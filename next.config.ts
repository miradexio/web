import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/swap",
  assetPrefix: "/swap",
  trailingSlash: false,
  transpilePackages: ["@miradexio/client"],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Bare `/` → `/swap` in `next dev` / `next start`. Matches what nginx
  // does in production via the `public/_root_redirect.html` fallback, so
  // the same UX (visit `/`, land on the swap form) works whether you run
  // the dev server, the prod server, or the static export behind nginx.
  // `basePath: false` means the source path is matched as-is (not under
  // /swap), and the destination is not auto-prefixed — so `/swap` here
  // really means external `/swap`. No-op under `output: "export"`.
  async redirects() {
    return [
      {
        source: "/",
        destination: "/swap",
        basePath: false,
        permanent: false,
      },
    ];
  },
  // Note: `headers()` and `redirects()` are no-ops under output:'export'.
  // CSP/HSTS and root-redirect must be handled by whatever serves the
  // static bundle (CDN, Cloudflare Workers, nginx). Kept here for parity
  // with `next dev` / `next start`; ignored by `next export`.
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";

    // Production CSP: explicit allowlist of external hosts the SDK reaches.
    // Bitcoin chain access goes through CORS-allowed electrs HTTP endpoints
    // (kept in sync with `ELECTRS_CORS_SERVERS` in `lib/miradex-web/config.ts`).
    // Update both lists together when adding/removing operators.
    const PROD_CONNECT_SRC = [
      "'self'",
      "https://api.miradex.io",
     
      "https://gateway.liquify.com",
      "https://thornode.thorchain.network",
      "https://midgard.thorchain.network",
      "https://chainflip-swap.chainflip.io",
      "https://chainflip-broker.io",
      "https://1click.chaindefuser.com",
     
      "https://node.sethforprivacy.com",
      "https://dewitte.fiatfaucet.com",
      "https://chad.fiatfaucet.com",
      "https://kowalski.fiatfaucet.com",
      "https://connect.xmr-node.org",
      "https://monerod.not.futbol",
      "https://xmr.0xrpc.io",
      "https://xmr.jayjonkman.nl:18089",
      "https://monero.definitelynotafed.com",
      "https://xmr1.doggett.tech:18089",
      "https://xmr2.doggett.tech:18089",
      "https://xmr3.doggett.tech:18089",
      "https://xmr4.doggett.tech:18089",
      "https://xmr5.doggett.tech:18089",
      "https://public-monero-node.xyz",
      "https://xmr.hexide.com",
      "https://xmr.greyfox.tech:443",
      "https://xmr-node.cakewallet.com:18081",
      "https://xmr.surveillance.monster",
      "https://node.xmr.surf",
      "https://xmr.thinhhv.com:443",
      "https://xmr.unshakled.net",
      "https://xmr.cryptostorm.is:18081",
      "https://xmr.qu.ax:443",
      "https://monero-rpc.cheems.de.box.skhron.com.ua:18089",
      "https://xmr.letmego.me",
      "https://xmr.ci.vet:443",
      "https://xmr.winslow.cloud:18089",
      "https://xmr.visnova.pl",
      "https://monero.openinternet.io",
      "https://xmr.support:18089",
      // Bitcoin electrs HTTP endpoints (mainnet + testnet, fallback list).
      "https://mempool.space",
      "https://blockstream.info",
      "https://mempool.emzy.de",
      "https://mempool.fra.mempool.space",
      "https://mempool.va1.mempool.space",
    ].join(" ");

    const csp = isDev
      // Dev: keep most directives but loosen connect-src so the browser can
      // reach the local API and any verification/RPC endpoint without
      // adding each one to an allowlist while iterating.
      ? [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "connect-src 'self' http: https: ws: wss:",
          "frame-ancestors 'none'",
        ].join("; ")
      : [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          `connect-src ${PROD_CONNECT_SRC}`,
          "frame-ancestors 'none'",
        ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  turbopack: {},
  webpack: (config, { isServer }) => {
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
    };
    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // asyncWebAssembly emits a top-level `await` to load the .wasm module.
    // Next's default browserslist makes Webpack pessimistic about async-function
    // support; declare it here so the warning goes away and the efficient
    // code-path is used. Modern browsers (Chrome 55+, Firefox 52+, Safari 10.1+,
    // Edge 15+) all support async/await; we don't ship to anything older.
    config.output = {
      ...config.output,
      environment: {
        ...(config.output?.environment ?? {}),
        asyncFunction: true,
      },
    };

    if (!isServer) {
      // Add externals for node modules that should not be bundled
      type ExternalContext = { readonly request?: string };
      type ExternalCallback = (
        err?: Error | null,
        result?: string | undefined,
      ) => void;
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : config.externals ? [config.externals] : []),
        (ctx: ExternalContext, callback: ExternalCallback) => {
          if (ctx.request?.startsWith('node:') === true) {
            return callback(null, `commonjs ${ctx.request}`);
          }
          callback();
        },
      ];

      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        fs: false,
        'node:fs': false,
        'node:fs/promises': false,
        'node:url': false,
        'node:path': false,
        net: false,
        tls: false,
        url: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;
