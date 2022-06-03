import { ACTIVE_NETWORKS, NetworkKind } from "~/entities";
import {
  AssetConfig,
  CoreConfig,
  parseAssets,
  parseConfig,
} from "~/utils/parseConfig";

import { chainConfigByNetworkEnv } from "./chains";
import { NetworkEnv } from "./getEnv";
import devnetconfig from "./networks/config.devnet.json";
import localnetconfig from "./networks/config.localnet.json";
import mainnnetconfig from "./networks/config.mainnet.json";
import testnetconfig from "./networks/config.testnet.json";

type ConfigMap = Record<NetworkEnv, ReturnType<typeof parseConfig>>;

type ChainNetwork = `${NetworkKind}.${NetworkEnv}`;

export type AppConfig = ReturnType<typeof parseConfig>; // Will include other injectables

const REGISTRY_URL = "https://sifchain-registry.vercel.app";

const fetchConfig = async (network: NetworkKind, env: NetworkEnv) =>
  fetch(`${REGISTRY_URL}/api/${network}/${env}`)
    .then((x) => x.json() as Promise<AssetConfig[]>)
    .then(parseAssets);

export async function getConfig(
  applicationNetworkEnv: NetworkEnv = "localnet",
  sifchainAssetTag: ChainNetwork = "sifchain.localnet",
  ethereumAssetTag: ChainNetwork = "ethereum.localnet",
): Promise<AppConfig> {
  const [_, env] = sifchainAssetTag.split(".") as [NetworkKind, NetworkEnv];

  const [sifchainAssets, ethereumAssets] = await Promise.all([
    fetchConfig("sifchain", env),
    fetchConfig("ethereum", env),
  ]);

  if (process.env["NODE_ENV"] === "development") {
    console.log(
      "Using development config",
      applicationNetworkEnv,
      sifchainAssetTag,
      ethereumAssetTag,
      {
        sifchainAssets,
        ethereumAssets,
      },
    );
  }

  const allAssets = [...sifchainAssets, ...ethereumAssets];

  [...ACTIVE_NETWORKS]
    .filter((n) => n !== "ethereum" && n !== "sifchain")
    .forEach((n) => {
      allAssets.push(
        ...sifchainAssets.map((a) => ({
          ...a,
          network: n,
        })),
      );
    });

  const peggyCompatibleCosmosBaseDenoms = new Set([
    "uiris",
    "uatom",
    "uxprt",
    "ukava",
    "uakt",
    "hard",
    "uosmo",
    "uregen",
    "uion",
    "uixo",
    "ujuno",
    "udvpn",
    // not sure if these contracts actually exist
    "uphoton",
    "unyan",
  ]);
  const configMap: ConfigMap = {
    localnet: parseConfig(
      localnetconfig as CoreConfig,
      allAssets,
      chainConfigByNetworkEnv["localnet"],
      peggyCompatibleCosmosBaseDenoms,
    ),
    devnet: parseConfig(
      devnetconfig as CoreConfig,
      allAssets,
      chainConfigByNetworkEnv["devnet"],
      peggyCompatibleCosmosBaseDenoms,
    ),
    testnet: parseConfig(
      testnetconfig as CoreConfig,
      allAssets,
      chainConfigByNetworkEnv["testnet"],
      peggyCompatibleCosmosBaseDenoms,
    ),
    mainnet: parseConfig(
      mainnnetconfig as CoreConfig,
      allAssets,
      chainConfigByNetworkEnv["mainnet"],
      peggyCompatibleCosmosBaseDenoms,
    ),
  };

  return configMap[applicationNetworkEnv];
}