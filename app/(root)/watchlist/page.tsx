import { getUserWatchlist } from "@/lib/actions/watchlist.action";
import { getNews } from "@/lib/actions/finnhub.actions";
import WatchlistButton from "@/components/WatchlistButton";
import Link from "next/link";
import { Star, TrendingUp, ExternalLink } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

const WatchlistPage = async () => {
  const watchlist = await getUserWatchlist();

  if (watchlist.length === 0) {
    return (
      <div className="watchlist-empty-container">
        <div className="watchlist-empty">
          <Star className="watchlist-star" />
          <h2 className="empty-title">Your watchlist is empty</h2>
          <p className="empty-description">
            Start tracking stocks by searching for a company and clicking the
            star or &quot;Add to Watchlist&quot; button.
          </p>
          <Link
            href="/"
            className="yellow-btn inline-flex items-center px-6 py-2.5 text-sm font-semibold"
          >
            Explore Market
          </Link>
        </div>
      </div>
    );
  }

  const symbols = watchlist.map((item) => item.symbol);
  let news: MarketNewsArticle[] = [];
  try {
    news = await getNews(symbols);
  } catch (e) {
    console.error("Error loading watchlist news:", e);
  }

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="watchlist-title">My Watchlist ({watchlist.length})</h1>
        </div>

        <div className="watchlist-table">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-header-row">
                <th className="py-3 px-4 table-header">Symbol</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4 hidden md:table-cell">Added</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((stock) => (
                <tr key={stock.symbol} className="table-row">
                  <td className="py-4 px-4 table-cell">
                    <Link
                      href={`/stocks/${stock.symbol}`}
                      className="font-bold text-yellow-500 hover:underline flex items-center gap-1.5"
                    >
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      {stock.symbol}
                    </Link>
                  </td>
                  <td className="py-4 px-4 table-cell text-gray-300">
                    <Link
                      href={`/stocks/${stock.symbol}`}
                      className="hover:text-yellow-400 transition-colors"
                    >
                      {stock.company}
                    </Link>
                  </td>
                  <td className="py-4 px-4 hidden md:table-cell text-sm text-gray-400">
                    {new Date(stock.addedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/stocks/${stock.symbol}`}
                        className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded bg-gray-700/60 hover:bg-gray-700 transition-colors"
                      >
                        Chart <ExternalLink className="w-3 h-3" />
                      </Link>
                      <WatchlistButton
                        symbol={stock.symbol}
                        company={stock.company}
                        isInWatchlist={true}
                        type="icon"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {news && news.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-100">
            News for Watched Stocks
          </h2>
          <div className="watchlist-news">
            {news.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="news-item flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="news-tag">{item.related || "Market"}</span>
                    <span className="text-xs text-gray-400">
                      {item.datetime ? formatTimeAgo(item.datetime) : ""}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-200 line-clamp-2 mb-2 hover:text-yellow-400 transition-colors">
                    {item.headline}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-3">
                    {item.summary}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-700/60 flex items-center justify-between text-xs text-gray-500">
                  <span>{item.source}</span>
                  <span className="text-yellow-500 font-medium">
                    Read article →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default WatchlistPage;
