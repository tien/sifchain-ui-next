import type { HistoryQueryData } from "~/domains/margin/hooks";

import { useRouter } from "next/router";
import clsx from "clsx";
import Link from "next/link";

import AssetIcon from "~/compounds/AssetIcon";
import { useSifSignerAddressQuery } from "~/hooks/useSifSigner";
import { useTokenRegistryQuery } from "~/domains/tokenRegistry";
import {
  FlashMessageLoading,
  FlashMessage5xxError,
  FlashMessageConnectSifChainWallet,
  FlashMessageConnectSifChainWalletError,
  FlashMessageConnectSifChainWalletLoading,
  ChevronDownIcon,
  formatNumberAsDecimal,
} from "@sifchain/ui";
import { useMarginHistoryQuery } from "~/domains/margin/hooks/useMarginHistoryQuery";

import { isNil } from "rambda";
const isTruthy = (target: any) => !isNil(target);

/**
 * ********************************************************************************************
 *
 * `_components`: "Dumb Components" used across Margin. They will be moved to a different place.
 * `_mockdata`: To mock React-Query and fake the Data Services reponses
 * `_intl`: Functions to format data used across Margin. They will be moved to a different place.
 * `_tables`: Constant values, functions to abstract logic, and pagination utilities used across Open Positions and History tables. They will be moved to a different place.
 *
 * ********************************************************************************************
 */
import { findNextOrderAndSortBy, SORT_BY, QS_DEFAULTS } from "./_tables";
import { formatDateISO, formatIntervalToDuration, createDurationLabel } from "./_intl";
import { HtmlUnicode, removeFirstCharsUC } from "./_trade";
import { NoResultsRow, PaginationShowItems, PaginationButtons, PillUpdating } from "./_components";

/**
 * ********************************************************************************************
 *
 * HistoryTable Compound
 *
 * ********************************************************************************************
 */
const HISTORY_HEADER_ITEMS = [
  { title: "Date Closed", order_by: "" },
  { title: "Duration", order_by: "open_date_time" },
  { title: "Pool", order_by: "" },
  { title: "Side", order_by: "position" },
  { title: "Asset", order_by: "open_custody_asset" },
  { title: "Position", order_by: "open_custody_amount" },
  { title: "Interest Paid", order_by: "close_interest_paid_custody" },
  { title: "Realized P&L", order_by: "" },
];
export type HistoryTableProps = {
  classNamePaginationContainer?: string;
};
const HistoryTable = (props: HistoryTableProps) => {
  const router = useRouter();
  const tokenRegistryQuery = useTokenRegistryQuery();
  const walletAddress = useSifSignerAddressQuery();

  const headers = HISTORY_HEADER_ITEMS;

  const queryParams = {
    limit: (router.query["limit"] as string) || QS_DEFAULTS.limit,
    offset: (router.query["offset"] as string) || QS_DEFAULTS.offset,
    orderBy: (router.query["orderBy"] as string) || "open_date_time",
    sortBy: (router.query["sortBy"] as string) || QS_DEFAULTS.sortBy,
  };
  const historyQuery = useMarginHistoryQuery({
    ...queryParams,
    walletAddress: walletAddress.data ?? "",
  });

  if (walletAddress.isPaused) {
    return <FlashMessageConnectSifChainWallet size="full-page" />;
  }

  if (walletAddress.isError) {
    return <FlashMessageConnectSifChainWalletError size="full-page" />;
  }

  if (walletAddress.isLoading) {
    return <FlashMessageConnectSifChainWalletLoading size="full-page" />;
  }

  if (historyQuery.isLoading || tokenRegistryQuery.isLoading) {
    return <FlashMessageLoading size="full-page" />;
  }

  if (historyQuery.isSuccess && tokenRegistryQuery.isSuccess) {
    const { findBySymbolOrDenom } = tokenRegistryQuery;
    const { results, pagination } = historyQuery.data;
    const pages = Math.ceil(Number(pagination.total) / Number(pagination.limit));

    return (
      <section className="bg-gray-850 flex h-full flex-col">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full table-auto overflow-scroll whitespace-nowrap text-left text-xs">
            <thead className="bg-gray-800">
              <tr className="text-gray-400">
                {headers.map((header) => {
                  if (header.order_by === "") {
                    return (
                      <th key={header.title} className="cursor-not-allowed px-4 py-3 font-normal">
                        {header.title}
                      </th>
                    );
                  }

                  const itemActive = pagination.order_by === header.order_by;
                  const { nextOrderBy, nextSortBy } = findNextOrderAndSortBy({
                    itemKey: header.order_by,
                    itemActive,
                    currentSortBy: pagination.sort_by,
                  });
                  return (
                    <th key={header.title} className="px-4 py-3 font-normal">
                      <Link
                        href={{
                          query: {
                            ...router.query,
                            orderBy: nextOrderBy,
                            sortBy: nextSortBy,
                          },
                        }}
                        scroll={false}
                      >
                        <a
                          className={clsx("flex flex-row items-center", {
                            "font-semibold text-white": itemActive,
                          })}
                        >
                          {header.title}
                          {itemActive && (
                            <ChevronDownIcon
                              className={clsx("ml-1 transition-transform", {
                                "-rotate-180": pagination.sort_by === SORT_BY.ASC,
                              })}
                            />
                          )}
                        </a>
                      </Link>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-gray-850">
              {results.length <= 0 && <NoResultsRow colSpan={headers.length} />}
              {results.map((x) => {
                const item = x as HistoryQueryData & { _optimistic: boolean };
                const realizedPL = Number(item.realized_pnl ?? "0");
                const realizedPLSign = Math.sign(Number(item.realized_pnl));

                let custodyAsset;
                try {
                  custodyAsset = findBySymbolOrDenom(item.open_custody_asset);
                } catch (err) {}

                if (!custodyAsset) {
                  console.group("History Missing Custody or Collateral Asset Error");
                  console.log({ item });
                  console.groupEnd();
                  return (
                    <tr>
                      {Array.from({ length: headers.length }, () => {
                        return (
                          <td className="px-4 py-3">
                            <HtmlUnicode name="EmDash" />
                          </td>
                        );
                      })}
                    </tr>
                  );
                }

                return (
                  <tr
                    key={item.id}
                    data-testid={item.id}
                    className={clsx({
                      "italic text-gray-300": item._optimistic,
                    })}
                  >
                    <td className="px-4 py-3">
                      {isTruthy(item.closed_date_time) ? (
                        formatDateISO(new Date(item.closed_date_time))
                      ) : (
                        <HtmlUnicode name="EmDash" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isTruthy(item.closed_date_time) && isTruthy(item.open_date_time) ? (
                        createDurationLabel(
                          formatIntervalToDuration(new Date(item.open_date_time), new Date(item.closed_date_time)),
                        )
                      ) : (
                        <HtmlUnicode name="EmDash" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isTruthy(item.pool) ? (
                        removeFirstCharsUC(item.pool.toUpperCase())
                      ) : (
                        <HtmlUnicode name="EmDash" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isTruthy(item.position) ? item.position : <HtmlUnicode name="EmDash" />}
                    </td>
                    <td className="px-4 py-3">
                      {isTruthy(item.open_custody_asset) ? (
                        removeFirstCharsUC(item.open_custody_asset.toUpperCase())
                      ) : (
                        <HtmlUnicode name="EmDash" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isTruthy(item.open_custody_amount) ? (
                        formatNumberAsDecimal(Number(item.open_custody_amount), 4)
                      ) : (
                        <HtmlUnicode name="EmDash" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isTruthy(item.close_interest_paid_custody) ? (
                        <div className="flex flex-row items-center justify-start">
                          <AssetIcon symbol={item.open_custody_asset} network="sifchain" size="sm" />
                          <span className="ml-1">
                            {formatNumberAsDecimal(Number(item.close_interest_paid_custody), 6) ?? (
                              <HtmlUnicode name="EmDash" />
                            )}
                          </span>
                        </div>
                      ) : (
                        <HtmlUnicode name="EmDash" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isTruthy(item.realized_pnl) && Number.isNaN(realizedPL) === false ? (
                        <div
                          className={clsx("flex flex-row items-center justify-start", {
                            "text-green-400": realizedPLSign === 1 && realizedPL > 0,
                            "text-red-400": realizedPLSign === -1 && realizedPL < 0,
                          })}
                        >
                          <AssetIcon symbol={item.open_collateral_asset} network="sifchain" size="sm" />
                          <span className="ml-1">{formatNumberAsDecimal(realizedPL, 6)}</span>
                        </div>
                      ) : (
                        <HtmlUnicode name="EmDash" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div
          className={clsx(
            "mt-auto flex flex-row items-center justify-end bg-gray-800",
            props.classNamePaginationContainer,
          )}
        >
          {historyQuery.isRefetching && <PillUpdating />}
          <PaginationShowItems
            limit={Number(pagination.limit)}
            offset={Number(pagination.offset)}
            total={Number(pagination.total)}
          />
          <PaginationButtons
            pages={pages}
            render={(page) => {
              const offset = String(Number(pagination.limit) * page - Number(pagination.limit));
              return (
                <Link href={{ query: { ...router.query, offset } }} scroll={false}>
                  <a
                    className={clsx("inline-grid h-[20px] w-[20px] place-items-center rounded", {
                      "bg-gray-400": pagination.offset === offset,
                    })}
                  >
                    {page}
                  </a>
                </Link>
              );
            }}
          />
        </div>
      </section>
    );
  }

  console.group("History Query Error");
  console.log({ historyQuery, tokenRegistryQuery });
  console.groupEnd();
  return <FlashMessage5xxError size="full-page" />;
};

export default HistoryTable;
