import type { SyntheticEvent } from "react";

import { Button, formatNumberAsCurrency, formatNumberAsDecimal, Modal, RacetrackSpinnerIcon } from "@sifchain/ui";
import { useCallback } from "react";

import { useMarginMTPOpenMutation } from "~/domains/margin/hooks";

import AssetIcon from "~/compounds/AssetIcon";

type ModalMTPOpenProps = {
  data: {
    collateralAmount: string;
    fromDenom: string;
    leverage: string;
    poolInterestRate: string;
    positionPriceUsd: number;
    positionTokenAmount: string;
    toDenom: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onMutationError?: (_error: Error) => void;
  onMutationSuccess?: () => void;
  onTransitionEnd?: () => void;
};
export function ModalMTPOpen(props: ModalMTPOpenProps) {
  const confirmOpenPositionMutation = useMarginMTPOpenMutation({
    _optimisticCustodyAmount: props.data.positionTokenAmount,
  });

  const onClickConfirmOpenPosition = async (event: SyntheticEvent<HTMLButtonElement>) => {
    event.preventDefault();
    try {
      await confirmOpenPositionMutation.mutateAsync({
        collateralAsset: props.data.fromDenom,
        borrowAsset: props.data.toDenom,
        position: 1, // LONG
        collateralAmount: props.data.collateralAmount,
        leverage: props.data.leverage,
      });
      if (props.onMutationSuccess) {
        props.onMutationSuccess();
      }
    } catch (err) {
      if (props.onMutationError) {
        props.onMutationError(err as Error);
      }
    }
  };

  const onTransitionEnd = useCallback(() => {
    if (props.onTransitionEnd) {
      props.onTransitionEnd();
    }
    confirmOpenPositionMutation.reset();
  }, [confirmOpenPositionMutation, props]);

  let content = (
    <>
      {props.data.positionTokenAmount &&
      props.data.toDenom &&
      props.data.positionPriceUsd &&
      props.data.poolInterestRate ? (
        <ul className="flex flex-col gap-3">
          <li>
            <div className="flex flex-row items-center">
              <span className="mr-auto min-w-fit text-gray-300">Opening position</span>
              <div className="flex flex-row items-center">
                <span className="mr-1">{formatNumberAsDecimal(Number(props.data.positionTokenAmount), 4)}</span>
                <AssetIcon symbol={props.data.toDenom} network="sifchain" size="sm" />
              </div>
            </div>
          </li>
          <li>
            <div className="flex flex-row">
              <span className="mr-auto min-w-fit text-gray-300">Entry price</span>
              <span>{formatNumberAsCurrency(props.data.positionPriceUsd, 4)}</span>
            </div>
          </li>
          <li>
            <div className="flex flex-row">
              <span className="mr-auto min-w-fit text-gray-300">Current interest rate</span>
              <span>{props.data.poolInterestRate}</span>
            </div>
          </li>
        </ul>
      ) : (
        <div className="bg-gray-850 mt-6 flex items-center justify-center rounded p-2 text-4xl">
          <RacetrackSpinnerIcon />
        </div>
      )}
      {confirmOpenPositionMutation.isLoading ? (
        <p className="mt-6 rounded bg-indigo-200 py-3 px-4 text-center text-indigo-800">Opening trade...</p>
      ) : (
        <Button variant="primary" as="button" size="md" className="mt-6 w-full" onClick={onClickConfirmOpenPosition}>
          Open trade
        </Button>
      )}
      {confirmOpenPositionMutation.isError ? (
        <p className="mt-6 rounded bg-red-200 p-4 text-center text-red-800">
          <b className="mr-1">Failed to open position:</b>
          <span>{(confirmOpenPositionMutation.error as Error).message}</span>
        </p>
      ) : null}
    </>
  );

  return (
    <Modal
      title="Review trade"
      className="text-sm"
      isOpen={props.isOpen}
      onTransitionEnd={onTransitionEnd}
      onClose={props.onClose}
    >
      {content}
    </Modal>
  );
}
