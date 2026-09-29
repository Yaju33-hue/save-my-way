# SaveMyWay

SaveMyWay is a React and Vite personal-finance tracker for wallet activity, savings, and investment holdings. It uses React Router with hash-based URLs, a reactive client-side store, and a shared CSS token system.

## Run locally

```sh
npm install
npm run dev
```

Check the production build, lint, and auth tests with:

```sh
npm run build
npm run lint
node --test src/store/auth.test.js
```

## Market data

Copy `.env.example` to `.env` to configure optional Finnhub and NGX market-data keys. Vite variables prefixed with `VITE_` are embedded in browser JavaScript and are visible to site visitors; do not use them for secrets that must remain private. Stock prices and exchange rates use third-party services and may be delayed or unavailable.

## Storage and account limitations

The current app stores profile, session, settings, compressed profile images, and finance records in browser `localStorage`, isolated by local user ID. It has no server-side account system, cloud synchronization, account recovery, or remote backup. Sign-out does not erase locally stored records, and clearing site storage may permanently remove them. This client-side separation is not server-enforced security.

Password handling is client-side and should not be treated as production authentication. The current code uses an unsalted SHA-256 digest and fails closed when Web Crypto is unavailable. Do not use this version to protect credentials or sensitive financial records.

Portfolio spreadsheets and PDFs are parsed in the browser. Privacy and terms pages are drafts based on current source behavior; they need review by the app operator and qualified counsel before being treated as formal legal documents.

## Deployment

The configured deployment target is GitHub Pages under `/save-my-way/`. Run `npm run deploy` to build and publish the site. Any `VITE_` values included in the build are public.
