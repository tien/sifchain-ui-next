import { urlJoin } from "url-join-ts";
import { Chain } from "~/entities";
import { BaseChain } from "./_BaseChain";

export class CerberusChain extends BaseChain implements Chain {
  getBlockExplorerUrlForTxHash(hash: string) {
    return urlJoin(this.chainConfig.blockExplorerUrl, "tx", hash);
  }
}
