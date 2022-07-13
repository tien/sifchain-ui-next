import type { NetworkKind } from "@sifchain/common";
import { compose, prop, propEq, toLower } from "rambda";
import { indexBy } from "ramda";
import { useMemo } from "react";

import { useDexEnvironment } from "~/domains/core/envs";

export function useAssetsQuery(networkKind: NetworkKind = "sifchain") {
  const { data: dexEnv, ...query } = useDexEnvironment();

  const networkAssets = useMemo(() => {
    if (!dexEnv) {
      return [];
    }

    const { assets } = dexEnv;

    if (!assets) {
      return [];
    }

    return assets.filter(propEq("network", networkKind));
  }, [dexEnv, networkKind]);

  const indices = useMemo(() => {
    if (!networkAssets) {
      return {
        indexedBySymbol: {},
        indexedByDisplaySymbol: {},
      };
    }

    const indexedBySymbol = indexBy(
      compose(toLower, prop("symbol")),
      networkAssets,
    );

    const indexedByDisplaySymbol = indexBy(
      compose(toLower, prop("displaySymbol")),
      networkAssets,
    );

    return {
      indexedBySymbol,
      indexedByDisplaySymbol,
    };
  }, [networkAssets]);

  return {
    data: {
      ...dexEnv,
      assets: networkAssets.map((asset) => ({
        ...asset,
        symbol: asset.symbol.toLowerCase(),
        displaySymbol: asset.displaySymbol.toLowerCase(),
      })),
    },
    ...query,
    ...indices,
  };
}
