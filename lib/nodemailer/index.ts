import nodemailer from "nodemailer";
import {
  WELCOME_EMAIL_TEMPLATE,
  NEWS_SUMMARY_EMAIL_TEMPLATE,
  STOCK_ALERT_UPPER_EMAIL_TEMPLATE,
  STOCK_ALERT_LOWER_EMAIL_TEMPLATE,
} from "@/lib/nodemailer/templates";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL!,
    pass: process.env.NODEMAILER_PASSWORD!,
  },
});

export const sendWelcomeEmail = async ({
  email,
  name,
  intro,
}: WelcomeEmailData) => {
  const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace("{{name}}", name).replace(
    "{{intro}}",
    intro
  );

  const mailOptions = {
    from: `"Signalist" <signalist@jsmastery.pro>`,
    to: email,
    subject: `Welcome to Signalist - your stock market toolkit is ready!`,
    text: "Thanks for joining Signalist",
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

export const sendNewsSummaryEmail = async ({
  email,
  date,
  newsContent,
}: {
  email: string;
  date: string;
  newsContent: string;
}): Promise<void> => {
  const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE.replace(
    "{{date}}",
    date
  ).replace("{{newsContent}}", newsContent);

  const mailOptions = {
    from: `"Signalist News" <signalist@jsmastery.pro>`,
    to: email,
    subject: `📈 Market News Summary Today - ${date}`,
    text: `Today's market news summary from Signalist`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

export const sendStockPriceAlertEmail = async ({
  email,
  symbol,
  company,
  alertType,
  currentPrice,
  targetPrice,
}: {
  email: string;
  symbol: string;
  company: string;
  alertType: "upper" | "lower";
  currentPrice: number;
  targetPrice: number;
}): Promise<void> => {
  const baseTemplate =
    alertType === "upper"
      ? STOCK_ALERT_UPPER_EMAIL_TEMPLATE
      : STOCK_ALERT_LOWER_EMAIL_TEMPLATE;

  const html = baseTemplate
    .replace(/\{\{symbol\}\}/g, symbol)
    .replace(/\{\{company\}\}/g, company)
    .replace(/\{\{currentPrice\}\}/g, `$${currentPrice.toFixed(2)}`)
    .replace(/\{\{targetPrice\}\}/g, `$${targetPrice.toFixed(2)}`)
    .replace(
      /\{\{timestamp\}\}/g,
      new Date().toLocaleString("en-US", { timeZone: "UTC" })
    );

  const mailOptions = {
    from: `"Signalist Alerts" <signalist@jsmastery.pro>`,
    to: email,
    subject: `🚨 Price Alert: ${symbol} reached ${
      alertType === "upper" ? "upper" : "lower"
    } target ($${currentPrice.toFixed(2)})`,
    text: `${symbol} reached target price $${targetPrice.toFixed(
      2
    )}. Current price is $${currentPrice.toFixed(2)}.`,
    html,
  };

  await transporter.sendMail(mailOptions);
};
