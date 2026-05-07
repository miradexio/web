# miradex-web

Static Next.js 16 frontend for cross-chain swaps. The whole
app is a thin shell over `@miradexio/client`: keygen,
signing, deposit verification, and sweep all run client-side.
The server is a proxy, not a custodian.

The app exposes one route, `/swap`, with two views: a quote
form (pick pair, enter amount, get quotes across all
providers, confirm) and an active-swap view (deposit address,
QR, pipeline progress, sweep). Per-provider trust models and
the BTC↔XMR atomic-swap protocol live in the SDK docs.

---

## Stack

Next.js 16 (`output: 'export'`), React 19, Tailwind v4,
shadcn on Radix. TanStack Query for server state, IndexedDB
via `idb` for keystores and history,
`@miradexio/client` + WASM for crypto. Bitcoin and Monero
queries hit CORS-allowed electrs and monerod endpoints
directly from the browser; libp2p is delegated to the
gateway. Build with `next build --webpack` so WASM works
(`experiments.asyncWebAssembly: true` in `next.config.ts`).

---


## Build & Development

```bash
npm install
npm  dev          # next dev --webpack -p 3002
npm run build        # → out/ (static export)
```

Dev server runs at `http://localhost:3002/swap`.

---

## Configuration

Build-time config is via `NEXT_PUBLIC_*` env vars (inlined at
build time). Source:
[`lib/miradex-web/config.ts`](./lib/miradex-web/config.ts).

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://api.miradex.io` | Gateway base URL |
| `NEXT_PUBLIC_NETWORK` | `mainnet` | `mainnet`/`testnet`/`regtest` |
| `NEXT_PUBLIC_MONERO_NODES` | network default | Comma-separated XMR RPC URLs |


---

## Self-hosting

The static export in `out/` runs behind any HTTP server  (you need to configure CSP see next.config.ts).

---



## License

MIT. See [LICENSE](./LICENSE).
