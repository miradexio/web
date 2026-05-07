// `NEXT_PUBLIC_BASE_PATH` mirrors each consuming app's Next `basePath`. The
// homepage leaves it unset → empty prefix; the swap SPA sets it to "/swap"
// → assets resolve to `/swap/coin-icons/...` matching the SPA's basePath.
// Substituted at build time, so this is a zero-runtime-cost prefix.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const CHAIN_ICONS: Readonly<Record<string, string>> = {
  bitcoin: `${BASE}/coin-icons/Bitcoin.svg`,
  ethereum: `${BASE}/coin-icons/Ethereum.svg`,
  solana: `${BASE}/coin-icons/Solana.svg`,
  bsc: `${BASE}/coin-icons/BinanceSmartChain.svg`,
  binancesmartchain: `${BASE}/coin-icons/BinanceSmartChain.svg`,
  cosmos: `${BASE}/coin-icons/Cosmos.svg`,
  litecoin: `${BASE}/coin-icons/Litecoin.svg`,
  monero: `${BASE}/coin-icons/Monero.svg`,
  near: `${BASE}/coin-icons/near-coin.svg`,
  polkadot: `${BASE}/coin-icons/Polkadot.svg`,
  polygon: `${BASE}/coin-icons/Polygon.svg`,
  pol: `${BASE}/coin-icons/Polygon.svg`,
  cardano: `${BASE}/coin-icons/Cardano.svg`,
  chainlink: `${BASE}/coin-icons/Chainlink.svg`,
  dogecoin: `${BASE}/coin-icons/Dogecoin.svg`,
  doge: `${BASE}/coin-icons/Dogecoin.svg`,
  avalanche: `${BASE}/coin-icons/Avalanche.svg`,
  avax: `${BASE}/coin-icons/Avalanche.svg`,
  tether: `${BASE}/coin-icons/Tether.svg`,
  bch: `${BASE}/coin-icons/BitcoinCash.svg`,
  bitcoincash: `${BASE}/coin-icons/BitcoinCash.svg`,
  stellar: `${BASE}/coin-icons/Stellar.svg`,
  tron: `${BASE}/coin-icons/Tron.svg`,
  trx: `${BASE}/coin-icons/Tron.svg`,
  tezos: `${BASE}/coin-icons/Tezos.svg`,
};

export function chainIconKey(chain: string): string {
  return chain.toLowerCase().replace(/[\s_-]/g, "");
}
