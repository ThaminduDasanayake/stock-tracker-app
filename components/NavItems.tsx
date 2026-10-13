"use client";

import { NAV_ITEMS } from "@/lib/constants";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchCommand from "./SearchCommand";

const NavItems = ({
  initialStocks,
}: {
  initialStocks: StockWithWatchlistStatus[];
}) => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";

    return pathname.startsWith(path);
  };
  return (
    <ul className="flex flex-col sm:flex-row items-center p-2 gap-3 sm:gap-10 font-medium">
      {NAV_ITEMS.map(({ href, label }) => {
        if (href === "/search")
          return (
            <li key="search-trigger" className="flex items-center">
              <SearchCommand
                renderAs="text"
                label="Search"
                initialStocks={initialStocks}
              />
            </li>
          );
        return (
          <li key={href} className="flex items-center">
            <Link
              href={href}
              className={`hover:text-yellow-500 transition-colors ${
                isActive(href) ? "text-gray-100" : "text-gray-400"
              }`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default NavItems;
