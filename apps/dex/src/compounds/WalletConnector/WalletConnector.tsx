import type { ChainConfig, NetworkKind } from "@sifchain/common";
import {
  useConnect as useCosmConnect,
  useSigningStargateClient,
} from "@sifchain/cosmos-connect";
import type { Coin } from "@sifchain/proto-types/cosmos/base/coin";
import {
  ChainEntry,
  CoinbaseIcon,
  ConnectedAccount,
  CosmostationIcon,
  KeplrIcon,
  MetamaskIcon,
  RenderConnectedAccount,
  WalletconnectCircleIcon,
  WalletSelector,
} from "@sifchain/ui";
import clsx from "clsx";
import { assoc, indexBy, prop } from "rambda";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import {
  useConnect as useEtherConnect,
  useDisconnect as useEtherDisconnect,
} from "wagmi";

import { useDexEnvironment } from "~/domains/core/envs";

const WALLET_ICONS = {
  keplr: <KeplrIcon />,
  keplrWalletconnect: <WalletconnectCircleIcon />,
  metaMask: <MetamaskIcon />,
  walletConnect: <WalletconnectCircleIcon />,
  coinbaseWallet: <CoinbaseIcon />,
  cosmostation: <CosmostationIcon />,
};

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

export function useNativeBalance(chainId: string, address: string) {
  const { data } = useDexEnvironment();

  const { client } = useSigningStargateClient(chainId);

  const query = useCallback(async () => {
    if (!client || !data) {
      return DEFAULT_NATIVE_BALANCE;
    }

    const chain = data.chainConfigsByNetwork[chainId as NetworkKind];

    if (!chain) {
      return {
        denom: "",
        amount: "",
        dollarValue: "",
      };
    }

    const result = await client.getBalance(
      address,
      chain.nativeAssetSymbol.toLowerCase(),
    );

    return result ?? DEFAULT_NATIVE_BALANCE;
  }, [address, chainId, client, data]);

  return useQuery(["native-balance", chainId, address], query, {
    enabled: Boolean(data && client),
    staleTime: 60_000,
  });
}

const WalletConnector: FC = () => {
  const { data } = useDexEnvironment();

  const chains = useMemo<ChainEntry[]>(() => {
    if (!data?.chainConfigsByNetwork) {
      return [];
    }

    return Object.entries(data.chainConfigsByNetwork).map(
      ([id, config]): ChainEntry => ({
        id,
        name: config.displayName,
        type: config.chainType,
        nativeAssetSymbol: config.nativeAssetSymbol,
        connected: false,
        icon: (
          <figure
            className={clsx(
              "h-6 w-6 bg-cover rounded-full bg-white -translate-x-1",
              {
                "invert border-black bg-black": ["ixo"].includes(id),
              },
            )}
            style={{ backgroundImage: `url('/chains/${id}.png')` }}
          />
        ),
      }),
    );
  }, [data?.chainConfigsByNetwork]);

  const {
    connectors: cosmosConnectors,
    connect: connectCosmos,
    isConnected: isCosmosConnected,
    connectingStatus: cosmosConnectingStatus,
    activeConnector: cosmosActiveConnector,
    disconnect: disconnectCosmos,
  } = useCosmConnect();

  const {
    connectors: evmConnectors,
    connectAsync: connectEvm,
    isConnected: isEthConnected,
    pendingConnector: pendingEvmConnector,
    data: evmData,
  } = useEtherConnect();

  const { disconnect: disconnectEVM } = useEtherDisconnect();

  const [accounts, setAccounts] = useState<Record<string, string[]>>({});

  const syncCosmosAccounts = useCallback(async () => {
    if (cosmosActiveConnector) {
      const entries = await Promise.all(
        chains.flatMap(async (chain) => {
          try {
            const signer = await cosmosActiveConnector.getSigner(chain.id);
            const accounts = await signer.getAccounts();

            return [chain.id, accounts.map((x) => x.address)];
          } catch (error) {
            return [chain.id, []];
          }
        }),
      );

      const cosmosAccounts = Object.fromEntries(
        entries.filter(([_, xs]) => xs),
      );
      setAccounts((accounts) => ({
        ...accounts,
        ...cosmosAccounts,
      }));
    }
  }, [chains, cosmosActiveConnector]);

  useEffect(() => {
    syncCosmosAccounts();
  }, [syncCosmosAccounts]);

  const [wallets, connectorsById] = useMemo(() => {
    const connectors = [
      ...cosmosConnectors.map(assoc("type", "ibc" as ChainConfig["chainType"])),
      ...evmConnectors.map(assoc("type", "eth" as ChainConfig["chainType"])),
    ];

    const wallets = connectors.map((x) => ({
      id: x.id,
      name: x.name,
      type: x.type,
      icon: WALLET_ICONS[x.id as keyof typeof WALLET_ICONS] ?? (
        <WalletconnectCircleIcon />
      ),
      isConnected: x.type === "ibc" ? isCosmosConnected : isEthConnected,
      account: x.type === "ibc" ? "" : evmData?.account ?? "",
    }));

    const connectorsById = indexBy(prop("id"), connectors);

    return [wallets, connectorsById];
  }, [
    cosmosConnectors,
    evmConnectors,
    isCosmosConnected,
    isEthConnected,
    evmData,
  ]);

  const handleConnectionRequest = useCallback(
    async ({ walletId = "", chainId = "" }) => {
      const selected = connectorsById[walletId];

      if (!selected) {
        console.error(`Unknown wallet ${walletId}`);
        return;
      }

      try {
        switch (selected.type) {
          case "ibc":
            {
              const connector = cosmosConnectors.find((x) => x.id === walletId);
              if (connector) {
                console.log("connecting to", connector);
                await connectCosmos(connector);
              } else {
                console.log("connector not found: ", chainId);
              }
            }
            break;
          case "eth":
            {
              const connector = evmConnectors.find((x) => x.id === walletId);
              if (connector) {
                console.log("connecting to", connector);
                const account = await connectEvm(connector);
                console.log({ account });
              } else {
                console.log("connector not found");
              }
            }
            break;
        }
      } catch (error) {
        console.log("failed to connect", error);
      }
    },
    [
      connectorsById,
      cosmosConnectors,
      evmConnectors,
      connectCosmos,
      connectEvm,
    ],
  );

  const handleDisconnectionRequest = useCallback(
    async ({ walletId = "", chainId = "" }) => {
      const selected = connectorsById[walletId];

      if (!selected) {
        console.error(`Unknown wallet ${walletId}`);
        return;
      }

      switch (selected.type) {
        case "ibc":
          {
            const connector = cosmosConnectors.find((x) => x.id === walletId);
            if (connector) {
              await disconnectCosmos(connector);
            }
          }
          break;
        case "eth":
          disconnectEVM();
      }
    },
    [connectorsById, cosmosConnectors, disconnectCosmos, disconnectEVM],
  );

  return (
    <WalletSelector
      chains={chains.map((x) => ({
        ...x,
        connected: Boolean(accounts[x.id]?.length ?? 0),
      }))}
      wallets={wallets}
      accounts={accounts}
      isLoading={
        Boolean(pendingEvmConnector) || cosmosConnectingStatus === "pending"
      }
      onDisconnect={handleDisconnectionRequest}
      onConnect={handleConnectionRequest}
      renderConnectedAccount={ConnectedAccountItem}
    />
  );
};

const ConnectedAccountItem: RenderConnectedAccount = (props) => {
  const { data } = useNativeBalance(props.chainId, props.account);

  return (
    <ConnectedAccount
      {...props}
      nativeAssetDollarValue={""}
      nativeAssetSymbol={(data as Coin)?.denom?.toUpperCase() ?? ""}
      nativeAssetBalance={(data as Coin)?.amount ?? ""}
    />
  );
};

export default WalletConnector;
