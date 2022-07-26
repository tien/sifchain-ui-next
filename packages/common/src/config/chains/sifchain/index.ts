import { NetEnvChainConfigLookup } from "../NetEnvChainConfigLookup";
import { SIFCHAIN_DEVNET } from "./sifchain-devnet";
import { SIFCHAIN_TESTNET } from "./sifchain-testnet";
import { SIFCHAIN_MAINNET } from "./sifchain-mainnet";
import { SIFCHAIN_LOCALNET } from "./sifchain-localnet";
import { SIFCHAIN_TEMPNET } from "./sifchain-tempnet";

export default <NetEnvChainConfigLookup>{
  localnet: SIFCHAIN_LOCALNET,
  devnet: SIFCHAIN_DEVNET,
  testnet: SIFCHAIN_TESTNET,
  mainnet: SIFCHAIN_MAINNET,
  tempnet: SIFCHAIN_TEMPNET,
};
