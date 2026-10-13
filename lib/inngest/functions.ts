import { inngest } from "@/lib/inngest/client";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "@/lib/inngest/prompts";
import {
  sendNewsSummaryEmail,
  sendWelcomeEmail,
  sendStockPriceAlertEmail,
} from "@/lib/nodemailer";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";
import { getAllUsersForNewsEmail } from "../actions/user.action";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.action";
import { connectToDatabase } from "@/database/mongoose";
import { AlertModel } from "@/database/models/alert.model";
import { getCurrentStockQuote } from "@/lib/actions/alert.action";

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{userProfile}}",
      userProfile
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.";

      const {
        data: { email, name },
      } = event;

      return await sendWelcomeEmail({ email, name, intro: introText });
    });

    return {
      success: true,
      message: "Welcome email sent successfully",
    };
  }
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }],
  async ({ step }) => {
    // Step #1: Get all users for news delivery
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);

    if (!users || users.length === 0)
      return { success: false, message: "No users found for news email" };

    // Step #2: For each user, get watchlist symbols -> fetch news (fallback to general)
    const results = await step.run("fetch-user-news", async () => {
      const perUser: Array<{
        user: User;
        articles: MarketNewsArticle[];
      }> = [];
      for (const user of users as User[]) {
        try {
          const symbols = await getWatchlistSymbolsByEmail(user.email);
          let articles = await getNews(symbols);
          // Enforce max 6 articles per user
          articles = (articles || []).slice(0, 6);
          // If still empty, fallback to general
          if (!articles || articles.length === 0) {
            articles = await getNews();
            articles = (articles || []).slice(0, 6);
          }
          perUser.push({ user, articles });
        } catch (e) {
          console.error("daily-news: error preparing user news", user.email, e);
          perUser.push({ user, articles: [] });
        }
      }
      return perUser;
    });

    // Step #3: (placeholder) Summarize news via AI
    const userNewsSummaries: {
      user: User;
      newsContent: string | null;
    }[] = [];

    for (const { user, articles } of results) {
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          "{{newsData}}",
          JSON.stringify(articles, null, 2)
        );

        const response = await step.ai.infer(`summarize-news-${user.email}`, {
          model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
          body: {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent =
          (part && "text" in part ? part.text : null) || "No market news.";

        userNewsSummaries.push({ user, newsContent });
      } catch {
        console.error("Failed to summarize news for : ", user.email);
        userNewsSummaries.push({ user, newsContent: null });
      }
    }

    // Step #4: (placeholder) Send the emails
    await step.run("send-news-emails", async () => {
      await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }) => {
          if (!newsContent) return false;

          return await sendNewsSummaryEmail({
            email: user.email,
            date: getFormattedTodayDate(),
            newsContent,
          });
        })
      );
    });

    return {
      success: true,
      message: "Daily news summary emails sent successfully",
    };
  }
);

export const checkPriceAlerts = inngest.createFunction(
  { id: "check-price-alerts" },
  [{ event: "app/check.price.alerts" }, { cron: "*/15 * * * *" }],
  async ({ step }) => {
    // Step 1: Fetch all active alerts from database
    const alerts = await step.run("get-active-alerts", async () => {
      await connectToDatabase();
      const list = await AlertModel.find({ isActive: true }).lean();
      return list.map((a) => ({
        id: String(a._id),
        userId: String(a.userId),
        symbol: String(a.symbol),
        company: String(a.company),
        alertType: a.alertType as "upper" | "lower",
        threshold: Number(a.threshold),
      }));
    });

    if (!alerts || alerts.length === 0) {
      return { success: true, message: "No active price alerts" };
    }

    // Step 2: Fetch current prices for all distinct symbols
    const distinctSymbols = [...new Set(alerts.map((a) => a.symbol))];
    const prices = await step.run("fetch-stock-prices", async () => {
      const map: Record<string, number> = {};
      await Promise.all(
        distinctSymbols.map(async (sym) => {
          const price = await getCurrentStockQuote(sym);
          if (price !== null) {
            map[sym] = price;
          }
        })
      );
      return map;
    });

    // Step 3: Check which alerts are triggered
    const triggeredAlerts = alerts.filter((alert) => {
      const price = prices[alert.symbol];
      if (price === undefined) return false;
      if (alert.alertType === "upper" && price >= alert.threshold) return true;
      if (alert.alertType === "lower" && price <= alert.threshold) return true;
      return false;
    });

    if (triggeredAlerts.length === 0) {
      return { success: true, message: "No alerts triggered" };
    }

    // Step 4: Send emails and update alerts
    await step.run("send-alert-notifications", async () => {
      const mongoose = await connectToDatabase();
      const db = mongoose.connection.db;
      if (!db) return;

      for (const alert of triggeredAlerts) {
        const user = await db.collection("user").findOne({
          $or: [
            { id: alert.userId },
            { _id: alert.userId as unknown as import("mongodb").ObjectId },
          ],
        });

        if (user?.email) {
          try {
            await sendStockPriceAlertEmail({
              email: user.email,
              symbol: alert.symbol,
              company: alert.company,
              alertType: alert.alertType,
              currentPrice: prices[alert.symbol],
              targetPrice: alert.threshold,
            });

            // Mark alert as triggered & deactivate so user isn't spammed
            await AlertModel.updateOne(
              { _id: alert.id },
              { $set: { isActive: false, lastTriggeredAt: new Date() } }
            );
          } catch (err) {
            console.error(`Failed sending alert for ${alert.symbol}:`, err);
          }
        }
      }
    });

    return {
      success: true,
      message: `Triggered ${triggeredAlerts.length} price alerts`,
    };
  }
);
