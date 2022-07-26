export type TokenEntry = {
  id?: string;
  name: string;
  symbol: string;
  displaySymbol: string;
  decimals: number;
  network: string;
  homeNetwork?: string;
  label?: string;
  imageUrl?: string;
  homeNetworkUrl?: string;
  hasDarkIcon?: boolean;
  balance?: number;
};
