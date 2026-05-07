const TOKEN_COLORS: Readonly<Record<string, string>> = {
  BTC: "#F7931A",
  ETH: "#6E7BFF",
  XMR: "#F26822",
  USDC: "#2775CA",
  USDT: "#26A17B",
  BCH: "#8DC351",
  BNB: "#F0B90B",
  DOGE: "#C2A633",
  LTC: "#6F7CBA",
  WBTC: "#E8923C",
  SOL: "#9945FF",
  FLIP: "#46DA93",
  NEAR: "#9CA0B0",
  AVAX: "#E84142",
  ARB: "#28A0F0",
  TRX: "#EF0027",
  OP: "#FF0420",
  TON: "#0098EA",
  XRP: "#23292F",
  AAVE: "#B6509E",
  UNI: "#FF007A",
  DAI: "#F4B731",
  LINK: "#2A5ADA",
};

const FALLBACK_COLOR = "#88B89A";
const SIZE = 32;

type TokenGlyphProps = {
  readonly symbol: string;
};

export function TokenGlyph({ symbol }: TokenGlyphProps): React.JSX.Element {
  const upper = symbol.toUpperCase();
  const color = TOKEN_COLORS[upper] ?? FALLBACK_COLOR;
  const initial = upper.charAt(0);
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-mono font-bold"
      style={{
        width: SIZE,
        height: SIZE,
        backgroundColor: `${color}26`,
        color,
        fontSize: 13,
      }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
