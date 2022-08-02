import { isDeliverTxFailure, isDeliverTxSuccess } from "@cosmjs/stargate";
import { DEFAULT_FEE } from "@sifchain/stargate";
import { invariant, toast } from "@sifchain/ui";
import { isNil } from "rambda";
import { useMutation } from "react-query";
import useSifSigner from "~/hooks/useSifSigner";
import { useSifSigningStargateClient } from "~/hooks/useSifStargateClient";

const useAddLiquidityMutation = () => {
  const { signer } = useSifSigner();
  const { data: stargateClient } = useSifSigningStargateClient();

  const baseMutation = useMutation(
    async (variables: { nativeAmount: string; externalAmount: string }) => {
      invariant(signer !== undefined, "signer is undefined");
      invariant(stargateClient !== undefined, "stargateClient is undefined");

      const signerAddress = (await signer.getAccounts())[0]?.address ?? "";

      return stargateClient.signAndBroadcast(
        signerAddress,
        [
          {
            typeUrl: "/sifnode.clp.v1.MsgAddLiquidity",
            value: {
              signer: signerAddress,
              nativeAssetAmount: variables.nativeAmount,
              externalAssetAmount: variables.externalAmount,
            },
          },
        ],
        DEFAULT_FEE,
      );
    },
    {
      onMutate: () => {
        toast.info("Add liquidity inprogress");
      },
      onSettled: (data, error) => {
        if (!isNil(error)) {
          if (error instanceof Error || "message" in (error as Error)) {
            toast.error((error as Error).message);
          } else {
            toast.error("Failed to add liquidity");
          }
          return;
        }

        if (data === undefined) return;

        if (Boolean(error) || isDeliverTxFailure(data)) {
          toast.error(data?.rawLog ?? "Failed to add liquidity");
        } else if (data !== undefined && isDeliverTxSuccess(data)) {
          toast.success(`Successfully added liquidity`);
        }
      },
    },
  );

  return {
    ...baseMutation,
    isReady: signer !== undefined && stargateClient !== undefined,
  };
};

export default useAddLiquidityMutation;
