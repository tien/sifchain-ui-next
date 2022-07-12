import { Decimal } from "@cosmjs/math";
import { runCatching } from "@sifchain/common";
import { useAccounts } from "@sifchain/cosmos-connect";
import {
  ArrowDownIcon,
  Button,
  Input,
  Modal,
  ModalProps,
  RacetrackSpinnerIcon,
} from "@sifchain/ui";
import { isNil } from "rambda";
import {
  ChangeEventHandler,
  FormEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useAccount } from "wagmi";
import AssetIcon from "~/compounds/AssetIcon";
import { useAllBalancesQuery } from "~/domains/bank/hooks/balances";
import { useExportTokensMutation } from "~/domains/bank/hooks/export";
import { useDexEnvironment } from "~/domains/core/envs";
import { useTokenRegistryQuery } from "~/domains/tokenRegistry";

const ExportModal = (props: ModalProps & { denom: string }) => {
  const exportTokensMutation = useExportTokensMutation();

  const { indexedByIBCDenom } = useTokenRegistryQuery();
  const balances = useAllBalancesQuery();
  const balance = balances.indexedByDenom?.[props.denom];

  const token = indexedByIBCDenom[props.denom];
  const isEthToken = token?.ibcDenom?.startsWith("c");
  const { data: env } = useDexEnvironment();
  const { accounts: sifAccounts } = useAccounts(env?.sifChainId ?? "", {
    enabled: env !== undefined,
  });
  const { accounts: cosmAccounts } = useAccounts(token?.chainId ?? "", {
    enabled: token !== undefined && !isEthToken,
  });
  const { data: ethAccount } = useAccount();
  const recipientAddress = isEthToken
    ? ethAccount?.address
    : cosmAccounts?.[0]?.address;

  const [amount, setAmount] = useState("");
  const amountDecimal = useMemo(
    () =>
      runCatching(() =>
        Decimal.fromUserInput(amount, balance?.amount.fractionalDigits ?? 0),
      )[1],
    [amount, balance?.amount.fractionalDigits],
  );

  const error = useMemo(() => {
    if (isEthToken && isNil(ethAccount)) {
      return new Error("Please connect Ethereum wallet");
    }

    if (!isEthToken && isNil(cosmAccounts)) {
      return new Error("Please connect Sifchain wallet");
    }

    if (
      amountDecimal?.isGreaterThan(
        balance?.amount ?? Decimal.zero(amountDecimal.fractionalDigits),
      )
    ) {
      return new Error("Insufficient fund");
    }

    return;
  }, [amountDecimal, balance?.amount, cosmAccounts, ethAccount, isEthToken]);

  const disabled = exportTokensMutation.isLoading || error !== undefined;

  const title = useMemo(() => {
    if (exportTokensMutation.isError) {
      return "Transaction failed";
    }

    return `Export ${indexedByIBCDenom[
      props.denom
    ]?.displaySymbol.toUpperCase()} from Sifchain`;
  }, [exportTokensMutation.isError, indexedByIBCDenom, props.denom]);

  const buttonMessage = useMemo(() => {
    if (error !== undefined) {
      return error.message;
    }

    if (exportTokensMutation.isError || exportTokensMutation.isSuccess) {
      return "Close";
    }

    return [
      exportTokensMutation.isLoading ? (
        <RacetrackSpinnerIcon />
      ) : (
        <ArrowDownIcon className="rotate-180" />
      ),
      "Export",
    ];
  }, [
    error,
    exportTokensMutation.isError,
    exportTokensMutation.isLoading,
    exportTokensMutation.isSuccess,
  ]);

  const onSubmit = useCallback(
    (e: FormEvent<HTMLElement>) => {
      e.preventDefault();

      if (exportTokensMutation.isError || exportTokensMutation.isSuccess) {
        props.onClose(false);
        return;
      }

      exportTokensMutation.mutate({
        senderAddress: sifAccounts?.[0]?.address ?? "",
        recipientAddress: recipientAddress ?? "",
        amount: {
          amount: amountDecimal?.atomics ?? "0",
          denom: props.denom,
        },
      });
    },
    [
      amountDecimal?.atomics,
      exportTokensMutation,
      props,
      recipientAddress,
      sifAccounts,
    ],
  );

  return (
    <Modal
      {...props}
      title={title}
      onClose={(isOpen) => {
        props.onClose(isOpen);
        exportTokensMutation.reset();
      }}
    >
      <form onSubmit={onSubmit}>
        <fieldset className="p-4 mb-4 bg-black rounded-lg">
          <Input
            label="Amount"
            secondaryLabel={`Balance: ${(
              balance?.amount.toFloatApproximation() ?? 0
            ).toLocaleString(undefined, { maximumFractionDigits: 6 })}`}
            value={amount}
            onChange={useCallback<ChangeEventHandler<HTMLInputElement>>(
              (event) => setAmount(event.target.value),
              [],
            )}
            fullWidth
          />
        </fieldset>
        <Input
          className="!bg-gray-750 text-ellipsis"
          label="Recipient address"
          value={recipientAddress}
          fullWidth
          disabled
        />
        <dl className="flex flex-col gap-4 p-6 [&>div]:flex [&>div]:justify-between [&_dt]:opacity-70 [&_dd]:font-semibold [&_dd]:flex [&_dd]:items-center [&_dd]:gap-2">
          <div>
            <dt>Destination</dt>
            <dd>Ethereum</dd>
          </div>
          <div>
            <dt>Export amount</dt>
            <dd>
              {amountDecimal
                ?.toFloatApproximation()
                .toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
              <AssetIcon network="sifchain" symbol={props.denom} size="sm" />
            </dd>
          </div>
          <div>
            <dt>New Sifchain Balance</dt>
            <dd>
              {(amountDecimal !== undefined &&
              balance?.amount.isGreaterThanOrEqual(amountDecimal)
                ? balance.amount
                    .minus(
                      amountDecimal ??
                        Decimal.zero(balance.amount.fractionalDigits),
                    )
                    .toFloatApproximation()
                : 0
              ).toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
              <AssetIcon network="sifchain" symbol={props.denom} size="sm" />
            </dd>
          </div>
        </dl>
        <Button className="w-full mt-6" disabled={disabled}>
          {buttonMessage}
        </Button>
      </form>
    </Modal>
  );
};

export default ExportModal;
