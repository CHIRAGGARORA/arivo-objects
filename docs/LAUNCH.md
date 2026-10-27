# ARIVO OBJECTS — commerce setup and launch runbook

Everything below is done in official dashboards by the owner. Never paste
passwords or secret keys into chat, email, code or Git — enter them only in
the provider dashboard and in **Vercel → Project → Settings → Environment
Variables**.

Order of work: **1 Neon → 2 Razorpay (test) → 3 Resend → 4 Shiprocket →
5 operations vars → 6 test on preview → 7 launch (approval required).**

Scope every variable to **Preview** first. Add Production values only at
launch (step 7). After changing variables, redeploy (Deployments → ⋯ →
Redeploy) — Vercel only applies env changes to new deployments.

---

## 1. Neon Postgres (free plan)

1. Vercel → your project → **Storage** → **Create Database** → **Neon** →
   Free plan. Region: **Singapore (ap-southeast-1)** — closest Neon region to
   India, and the app's functions are pinned to Vercel's Singapore region
   (`vercel.json` → `sin1`) to sit next to it.
2. When asked which environments to connect, choose **Preview** and
   **Development** only for now.
3. The integration adds `DATABASE_URL` (pooled) automatically. Nothing to copy.
4. Tables are created automatically on the next deploy (`npm run build` runs
   `scripts/migrate.mjs`, which only ever *adds* tables/columns and records
   each migration once).

**At launch:** create a *separate* database or Neon branch for Production so
test orders never mix with real ones, and connect it to the Production
environment.

## 2. Razorpay — TEST mode first

**The previously exposed live credentials must be treated as compromised.**

1. Razorpay Dashboard → switch to **Live mode** → Account & Settings →
   **API Keys** → **Regenerate** the live key. This invalidates the exposed
   secret. Do not store the new live secret anywhere yet; you'll set it only
   at launch (step 7). If you don't want live keys yet, regenerating still
   revokes the old one.
2. Switch to **Test mode** → API Keys → **Generate Test Key**. In Vercel
   (Preview scope) set:
   - `RAZORPAY_KEY_ID` = the `rzp_test_…` key id
   - `RAZORPAY_KEY_SECRET` = the test key secret
3. Test mode → Account & Settings → **Webhooks** → **Add New Webhook**:
   - URL: `https://<your preview URL>/api/webhooks/razorpay`
     (use the stable branch URL Vercel shows for `launch-test`)
   - Secret: generate a fresh random string (not your key secret) and put the
     same value in Vercel as `RAZORPAY_WEBHOOK_SECRET`
   - Active events — **only these four**: `payment.authorized`,
     `payment.captured`, `payment.failed`, `order.paid`
4. Payment capture: Account & Settings → **Payment capture** → automatic
   capture is recommended. (If authorisation-only is left on, the server
   captures verified payments itself before fulfilment.)

Preview deployments are behind Vercel login, so Razorpay can't deliver
webhooks to them until you allow it: Vercel → Settings → **Deployment
Protection** → **Protection Bypass for Automation** → create a secret, then
append `?x-vercel-protection-bypass=<that secret>` to the webhook URL in
Razorpay. (Production custom domains aren't protected, so this is
preview-only.)

## 3. Resend — transactional email (free plan: 3,000/month, 100/day)

1. Create an account at resend.com → **Domains** → **Add Domain** →
   `arivoobjects.com` (region: any; Tokyo/Singapore is closest).
2. Resend shows **DNS records** (an MX and TXT on a `send` subdomain for SPF,
   a `resend._domainkey` TXT for DKIM, optionally a `_dmarc` TXT).
3. Add them in **GoDaddy → My Products → arivoobjects.com → DNS → Add New
   Record**, copying type/name/value exactly.
   - These records are on subdomains (`send`, `resend._domainkey`), so they do
     **not** touch the website's A/CNAME records or any existing mailbox MX
     on the root domain. Do not delete or edit existing records.
   - If a `_dmarc` record already exists, keep it — don't add a second one.
4. Wait for Resend to show the domain as **Verified**.
5. **API Keys** → Create → permission **Sending access**, domain
   `arivoobjects.com`. In Vercel set `RESEND_API_KEY`.
6. Set `EMAIL_FROM` = `ARIVO OBJECTS <orders@arivoobjects.com>` (any address
   on the verified domain; it doesn't need a real mailbox to *send*).
7. Set `OWNER_EMAIL` = the inbox where you want order and contact
   notifications (e.g. your Gmail). Customer replies go to the customer's
   address via Reply-To, so you don't need an `@arivoobjects.com` mailbox to
   start.

## 4. Shiprocket — order creation only

The site creates the Shiprocket order after payment. **Courier choice, AWB
and pickup stay manual** in the Shiprocket dashboard.

1. Shiprocket → **Settings → Pickup Addresses**: add/confirm your pickup
   address. Note the **exact** pickup location name.
2. **Settings → API → Configure → Create an API User**: use a *different*
   email from your login (Shiprocket requires this). Choose a strong
   password. This user needs order-creation access only.
3. In Vercel set `SHIPROCKET_API_EMAIL`, `SHIPROCKET_API_PASSWORD`,
   `SHIPROCKET_PICKUP_LOCATION` (exact name, same spaces/case),
   `SHIPROCKET_PICKUP_PINCODE`.
4. Measure and weigh **one packed unit of each variant** and send the numbers
   (weight in kg, L×B×H in cm) so they can be entered in
   `src/lib/shipping-specs.ts`. Until then every order is flagged
   "create manually in Shiprocket" — nothing is guessed.

## 5. Operations variables (Preview now, Production at launch)

| Variable | Value |
|---|---|
| `ADMIN_PASSWORD` | strong password ≥ 12 chars — `/admin` login, user `admin` |
| `CRON_SECRET` | random ≥ 16 chars — protects the daily retry job |
| `IP_HASH_SALT` | random string |
| `SITE_URL` | `https://www.arivoobjects.com` in Production; the preview URL in Preview |
| `PREVIEW_SELLABLE_VARIANTS` | Preview only, e.g. `small-oval-marble-tray/black-marble` — lets you test-buy without enabling sales on the live site. Ignored in Production and with live keys. |

Then open `/admin` → **Stock** and enter a quantity for the variant(s) you
test with (a variant needs stock to be purchasable).

## 6. Test on the preview (Razorpay test mode — no real money)

Open `/api/health` on the preview: every check should be `ok: true`.
Then on the preview:

- Successful payment: test card `4111 1111 1111 1111`, any future expiry, any
  CVV, or UPI `success@razorpay`. Expect the order page to show "Thank you",
  `/admin` to show the order **paid** with all steps succeeded, two emails
  (customer + owner), and a NEW order in Shiprocket (don't assign a courier).
- Failed payment: UPI `failure@razorpay`. Expect "Payment not completed" and
  no emails.
- Contact form and newsletter: submit both; check `/admin`.

## 7. Launch — requires explicit owner approval

1. Decide the shipping fee → `shippingFeeInr` in `src/lib/siteConfig.ts`
   (0 = free shipping). Checkout is refused in Production until set.
2. Approve which variants are for sale → `sellable: true` in
   `src/lib/products.ts`; enter stock in `/admin`.
3. Production env vars: production `DATABASE_URL`, Resend vars, Shiprocket
   vars, operations vars, `SITE_URL`.
4. Payments: start Production with **test** keys and do one test order on the
   live domain. When satisfied, set the regenerated **live** key id/secret,
   create a separate **live-mode** webhook to
   `https://www.arivoobjects.com/api/webhooks/razorpay` with its own secret,
   and set `PAYMENTS_LIVE_APPROVED=true` (Production only).
5. Merge `launch-test` → `main` (Vercel deploys Production).
6. Legal pages (Terms, Privacy, Shipping & Returns, Candle Safety) are marked
   draft — have them reviewed before taking real orders.
