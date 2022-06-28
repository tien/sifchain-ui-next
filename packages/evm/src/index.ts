import type { BigNumberish, Overrides, Signer } from "ethers";
import mainnetPeggyBridgeBankAbi from "./eth-sdk/abis/mainnet/peggy/bridgeBank.json";
import {
  getContract,
  getMainnetSdk as getBaseMainnetSdk,
  MainnetSdk,
} from "./generated";

export * from "./generated";

const enhanceSdk = (sdk: MainnetSdk) => ({
  ...sdk,
  peggy: {
    ...sdk.peggy,
    sendTokensToCosmos: async (
      recipient: string,
      token: string,
      amount: BigNumberish,
      overrides?: Overrides & {
        from?: string | Promise<string>;
      },
    ) => {
      const isBridgedToken =
        await sdk.peggy.bridgeBank.getCosmosTokenInWhiteList(token);

      return isBridgedToken
        ? sdk.peggy.bridgeBank.burn(recipient, token, amount, overrides)
        : sdk.peggy.bridgeBank.lock(recipient, token, amount, overrides);
    },
  },
});

export const getMainnetSdk = (defaultSigner: Signer) =>
  enhanceSdk(getBaseMainnetSdk(defaultSigner));

// temporary solution since testnet and devnet contracts are not verified
// we assume it's the same as mainnet
export const getTestnetSdk = (defaultSigner: Signer) =>
  enhanceSdk({
    peggy: {
      bridgeBank: getContract(
        "0x6CfD69783E3fFb44CBaaFF7F509a4fcF0d8e2835",
        mainnetPeggyBridgeBankAbi,
        defaultSigner,
      ),
    },
  });

export const getDevnetSdk = (defaultSigner: Signer) =>
  enhanceSdk({
    peggy: {
      bridgeBank: getContract(
        "0x96DC6f02C66Bbf2dfbA934b8DafE7B2c08715A73",
        mainnetPeggyBridgeBankAbi,
        defaultSigner,
      ),
    },
  });