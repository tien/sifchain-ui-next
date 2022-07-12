import { Decimal } from "@cosmjs/math";
import type { NetworkKind } from "@sifchain/common";
import { useSigningStargateClient } from "@sifchain/cosmos-connect";
import { formatNumberAsCurrency } from "@sifchain/ui";
import { useCallback } from "react";
import { useQuery } from "react-query";
import { useBalance } from "wagmi";
import { usePoolStatsQuery } from "~/domains/clp";
import { useDexEnvironment } from "~/domains/core/envs";

type NativeBalanceResult = {
  amount: string;
  denom: string;
  dollarValue: string;
};

const DEFAULT_NATIVE_BALANCE: NativeBalanceResult = {
  amount: "0",
  denom: "",
  dollarValue: "$0",
};

export function useCosmosNativeBalance(chainId: string, address: string) {
  const { client } = useSigningStargateClient(chainId);
  const { data: dexEnv } = useDexEnvironment();
  const { data: tokenStats } = usePoolStatsQuery();

  const query = useCallback(async () => {
    if (!client || !dexEnv) {
      return DEFAULT_NATIVE_BALANCE;
    }

    const chain = dexEnv.chainConfigsByNetwork[chainId as NetworkKind];

    if (!chain || !tokenStats?.pools) {
      return DEFAULT_NATIVE_BALANCE;
    }

    const nativeSymbol = chain.nativeAssetSymbol.toLowerCase();

    const stat = tokenStats.pools.find(
      ({ symbol }) => symbol === nativeSymbol || `u${symbol}` === nativeSymbol,
    );

    const asset = dexEnv.assets.find(
      ({ symbol }) =>
        symbol.toLowerCase() === nativeSymbol ||
        `u${symbol.toLowerCase()}` === nativeSymbol,
    );

    const result = await client.getBalance(
      address,
      chain.nativeAssetSymbol.toLowerCase(),
    );

    if (!result || !asset) {
      return DEFAULT_NATIVE_BALANCE;
    }

    const tokenPrice = Number(
      asset.symbol === "ROWAN" ? tokenStats.rowanUSD : stat?.priceToken ?? 0,
    );

    const normalizedBalance = Decimal.fromAtomics(
      result.amount,
      asset.decimals,
    );

    const dollarValue = normalizedBalance.toFloatApproximation() * tokenPrice;

    return {
      amount: normalizedBalance,
      denom: result.denom,
      dollarValue: formatNumberAsCurrency(dollarValue),
    };
  }, [address, chainId, client, dexEnv, tokenStats]);

  return useQuery(["ibc-native-balance", chainId, address], query, {
    enabled: Boolean(dexEnv && client && tokenStats),
    staleTime: 3600_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useEthNativeBalance(chainId: string | number, address: string) {
  const { data: dexEnv } = useDexEnvironment();
  const { data: tokenStats } = usePoolStatsQuery();

  const balanceQuery = useBalance({
    chainId: typeof chainId === "string" ? parseInt(chainId, 16) : chainId,
    addressOrName: address,
    staleTime: 3600_000,
  });

  const query = useCallback(async () => {
    if (!balanceQuery.data || !dexEnv) {
      return DEFAULT_NATIVE_BALANCE;
    }

    const chain = dexEnv.chainConfigsByNetwork[chainId as NetworkKind];

    if (!chain || !tokenStats?.pools) {
      return DEFAULT_NATIVE_BALANCE;
    }

    const nativeSymbol = chain.nativeAssetSymbol.toLowerCase();

    const stat = tokenStats.pools.find(
      ({ symbol }) => symbol === nativeSymbol || `u${symbol}` === nativeSymbol,
    );

    const asset = dexEnv.assets.find(
      ({ symbol }) =>
        symbol.toLowerCase() === nativeSymbol ||
        `u${symbol.toLowerCase()}` === nativeSymbol,
    );

    const result = balanceQuery.data;

    if (!result || !asset) {
      return DEFAULT_NATIVE_BALANCE;
    }

    const tokenPrice = Number(
      asset.symbol === "ROWAN" ? tokenStats.rowanUSD : stat?.priceToken ?? 0,
    );

    const normalizedBalance = new BigNumber(result.value.toString()).shiftedBy(
      -result.decimals,
    );

    const dollarValue = normalizedBalance.multipliedBy(tokenPrice);

    return {
      amount: normalizedBalance.toFixed(4),
      denom: result.symbol,
      dollarValue: formatNumberAsCurrency(dollarValue.toNumber()),
    };
  }, [
    balanceQuery.data,
    chainId,
    dexEnv,
    tokenStats?.pools,
    tokenStats?.rowanUSD,
  ]);

  return useQuery(["eth-native-balance", chainId, address], query, {
    enabled: Boolean(balanceQuery.isSuccess),
    staleTime: 3600_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
