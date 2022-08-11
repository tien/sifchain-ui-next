import { useRouter } from "next/router";
import clsx from "clsx";
import Link from "next/link";

import { ChevronDownIcon, formatNumberAsCurrency } from "@sifchain/ui";
import { useHistoryQuery } from "~/domains/margin/hooks/useMarginHistoryQuery";

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
import {
  NoResultsRow,
  PaginationShowItems,
  PaginationButtons,
  PillUpdating,
} from "./_components";
import { formatDateRelative, formatDateDistance } from "./_intl";
import {
  findNextOrderAndSortBy,
  SORT_BY,
  MARGIN_POSITION,
  QS_DEFAULTS,
} from "./_tables";
import { HtmlUnicode } from "./_trade";

/**
 * ********************************************************************************************
 *
 * HistoryTable Compound
 *
 * ********************************************************************************************
 */
const HISTORY_HEADER_ITEMS = [
  { title: "Date Closed", order_by: "" },
  { title: "Time Open", order_by: "open_date_time" },
  { title: "Pool", order_by: "" },
  { title: "Side", order_by: "position" },
  { title: "Asset", order_by: "open_custody_asset" },
  { title: "Amount", order_by: "open_custody_amount" },
  { title: "Realized P&L", order_by: "" },
];
export type HistoryTableProps = {
  queryId: string;
  classNamePaginationContainer?: string;
};
const HistoryTable = (props: HistoryTableProps) => {
  const router = useRouter();
  const queryParams = {
    limit: (router.query["limit"] as string) || QS_DEFAULTS.limit,
    offset: (router.query["offset"] as string) || QS_DEFAULTS.offset,
    orderBy: (router.query["orderBy"] as string) || "address",
    sortBy: (router.query["sortBy"] as string) || QS_DEFAULTS.sortBy,
  };
  const historyQuery = useHistoryQuery({
    ...queryParams,
    address: props.queryId,
  });
  const headers = HISTORY_HEADER_ITEMS;

  if (historyQuery.isSuccess) {
    const { results, pagination } = historyQuery.data;
    const pages = Math.ceil(
      Number(pagination.total) / Number(pagination.limit),
    );

    return (
      <>
        <div
          className={clsx(
            "flex flex-row bg-gray-800 items-center",
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
              const offset = String(
                Number(pagination.limit) * page - Number(pagination.limit),
              );
              return (
                <Link
                  href={{ query: { ...router.query, offset } }}
                  scroll={false}
                >
                  <a
                    className={clsx("px-2 py-1 rounded", {
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
        <div className="overflow-x-auto">
          <table className="table-auto overflow-scroll w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-gray-800">
              <tr className="text-gray-400">
                {headers.map((header) => {
                  const itemActive = pagination.order_by === header.order_by;
                  const { nextOrderBy, nextSortBy } = findNextOrderAndSortBy({
                    itemKey: header.order_by,
                    itemActive,
                    currentSortBy: pagination.sort_by,
                  });
                  return (
                    <th key={header.title} className="font-normal px-4 py-3">
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
                            "text-white font-semibold": itemActive,
                            "cursor-not-allowed": header.order_by === "",
                          })}
                        >
                          {header.title}
                          {itemActive && (
                            <ChevronDownIcon
                              className={clsx("ml-1 transition-transform", {
                                "-rotate-180":
                                  pagination.sort_by === SORT_BY.ASC,
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
              {results.length <= 0 && (
                <NoResultsRow
                  colSpan={headers.length}
                  message="History not available. Try again later."
                />
              )}
              {results.map((item: any) => {
                const amountSign = Math.sign(Number(item.open_custody_amount));
                const realizedPLSign = Math.sign(Number(item.realized_pnl));

                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      {isTruthy(item.closed_date_time) ? (
                        formatDateRelative(new Date(item.closed_date_time))
                      ) : (
                        <HtmlUnicode name="EmDash" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isTruthy(item.open_date_time) ? (
                        formatDateDistance(new Date(item.open_date_time))
                      ) : (
                        <HtmlUnicode name="EmDash" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isTruthy(item.open_custody_asset) ? (
                        item.open_custody_asset.toUpperCase()
                      ) : (
                        <HtmlUnicode name="EmDash" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isTruthy(item.position) ? (
                        <span
                          className={clsx({
                            "text-cyan-400":
                              item.position === MARGIN_POSITION.UNSPECIFIED,
                            "text-green-400":
                              item.position === MARGIN_POSITION.LONG,
                            "text-red-400":
                              item.position === MARGIN_POSITION.SHORT,
                          })}
                        >
                          {item.position}
                        </span>
                      ) : (
                        <HtmlUnicode name="EmDash" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isTruthy(item.open_custody_asset) ? (
                        item.open_custody_asset.toUpperCase()
                      ) : (
                        <HtmlUnicode name="EmDash" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isTruthy(item.open_custody_amount) ? (
                        <span
                          className={clsx({
                            "text-green-400": amountSign === 1,
                            "text-red-400": amountSign === -1,
                          })}
                        >
                          {formatNumberAsCurrency(
                            Number(item.open_custody_amount),
                            4,
                          )}
                        </span>
                      ) : (
                        <HtmlUnicode name="EmDash" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isTruthy(item.realized_pnl) ? (
                        <span className="text-green-400">
                          <span
                            className={clsx({
                              "text-green-400": realizedPLSign === 1,
                              "text-red-400": realizedPLSign === -1,
                            })}
                          >
                            {formatNumberAsCurrency(
                              Number(item.realized_pnl),
                              2,
                            )}
                          </span>
                        </span>
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
      </>
    );
  }

  if (historyQuery.isError) {
    return (
      <div className="bg-gray-850 p-10 text-center text-gray-100">
        Try again later.
      </div>
    );
  }

  return (
    <div className="bg-gray-850 p-10 text-center text-gray-100">Loading...</div>
  );
};

export default HistoryTable;
