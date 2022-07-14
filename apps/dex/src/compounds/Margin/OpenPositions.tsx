import { Slug } from "~/components/Slug";

const OPEN_POSITIONS_HEADER_ITEMS = [
  "Pool",
  "Side",
  "Asset",
  "Amount",
  "Base Leverage",
  "Unrealized P&L",
  "Interest Rate",
  "Unsettled Interest",
  "Next Payment",
  "Paid Interest",
  "Health",
  "Date Opened",
  "Time Open",
] as const;

type HideColsUnion =
  | "pool"
  | "side"
  | "asset"
  | "amount"
  | "base-leverage"
  | "unrealized-p-l"
  | "interest-rate"
  | "unsettled-interest"
  | "next-payment"
  | "paid-interest"
  | "health"
  | "date-opened"
  | "time-open";
type OpenPositionsTableProps = {
  hideCols?: HideColsUnion[];
};
const OpenPositionsTable = (props: OpenPositionsTableProps) => {
  const { hideCols } = props;
  let cols = [...OPEN_POSITIONS_HEADER_ITEMS];

  if (typeof hideCols !== "undefined") {
    cols = cols.filter((col) => {
      const itemKey = fromColNameToItemKey(col);
      if (hideCols.includes(itemKey)) {
        return false;
      }
      return true;
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="table-auto overflow-scroll w-full text-left text-xs">
        <thead className="bg-gray-800">
          <tr className="text-gray-400">
            {cols.map((title) => {
              const itemKey = fromColNameToItemKey(title);
              return (
                <th
                  key={itemKey}
                  data-item-key={itemKey}
                  className="font-normal px-4 py-3"
                >
                  {title}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-gray-850">
          <tr>
            <td className="px-4 py-3">ETH / ROWAN</td>
            <td className="px-4 py-3">
              <Slug color="green" title="Long" />
            </td>
            <td className="px-4 py-3">5.00000000</td>
            <td className="px-4 py-3">2x</td>
            <td className="px-4 py-3">&ndash;</td>
            <td className="px-4 py-3">
              <Slug color="green" title="0.002 (0.0%)" />
            </td>
            <td className="px-4 py-3">&ndash;</td>
            <td className="px-4 py-3">&ndash;</td>
            <td className="px-4 py-3">&ndash;</td>
            <td className="px-4 py-3">Close</td>
            <td className="px-4 py-3" hidden={Boolean(hideCols)}>
              &ndash;
            </td>
            <td className="px-4 py-3" hidden={Boolean(hideCols)}>
              &ndash;
            </td>
            <td className="px-4 py-3" hidden={Boolean(hideCols)}>
              &ndash;
            </td>
          </tr>
          <tr>
            <td className="px-4 py-3">ETH / ROWAN</td>
            <td className="px-4 py-3">
              <Slug color="red" title="Short" />
            </td>
            <td className="px-4 py-3">5.00000000</td>
            <td className="px-4 py-3">2x</td>
            <td className="px-4 py-3">&ndash;</td>
            <td className="px-4 py-3">
              <Slug color="red" title="-0.002 (0.0%)" />
            </td>
            <td className="px-4 py-3">&ndash;</td>
            <td className="px-4 py-3">&ndash;</td>
            <td className="px-4 py-3">&ndash;</td>
            <td className="px-4 py-3">Close</td>
            <td className="px-4 py-3" hidden={Boolean(hideCols)}>
              &ndash;
            </td>
            <td className="px-4 py-3" hidden={Boolean(hideCols)}>
              &ndash;
            </td>
            <td className="px-4 py-3" hidden={Boolean(hideCols)}>
              &ndash;
            </td>
          </tr>
          <NoResultsTr colSpan={cols.length} />
        </tbody>
      </table>
    </div>
  );
};

type NoResultsTrProps = {
  colSpan: number;
};
function NoResultsTr(props: NoResultsTrProps) {
  return (
    <tr>
      <td colSpan={props.colSpan} className="text-gray-400 text-center p-20">
        You have no open positions.
      </td>
    </tr>
  );
}

function fromColNameToItemKey(name: string) {
  return name.toLocaleLowerCase().replace(/[^a-z]+/g, "-") as HideColsUnion;
}

export default OpenPositionsTable;
