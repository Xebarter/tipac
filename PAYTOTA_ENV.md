# Mobile Money (Paytota) — Environment Variables

Card payments continue to use Pesapal (`PESAPAL_*`). Mobile Money uses Paytota STK push.
**Never show the words “Paytota” or “Pesapal” in the ticket purchase UI** — buyers only see “Mobile Money” and “Card”.

## Required

```env
PAYTOTA_SECRET_KEY=your_secret_key_here
PAYTOTA_BRAND_ID=your_brand_id_here

# Optional overrides
PAYTOTA_BASE_URL=https://gate.paytota.com
# Optional: paste webhook public key to skip live key fetch
# PAYTOTA_WEBHOOK_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# Used for success/failure redirects + webhook callback URL
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Dashboard setup

1. Log in at https://gate.paytota.com/login
2. Complete KYC under Profile
3. Copy **Brand ID** and **Secret Key** from Developers
4. Register a webhook pointing to:
   `https://yourdomain.com/api/tickets/mobile-money/webhook`
   Listen for purchase events (`purchase.paid`, `purchase.*` failures)
5. Apply DB migration: `supabase_add_payment_method.sql`

## Test numbers (sandbox / test brand)

| Phone (MSISDN) | Country | Currency |
| --- | --- | --- |
| 256770123456 | UG | UGX |

Local form input still uses `07xxxxxxxx` (e.g. `0770123456`).

## Buyer flow

1. Mobile Money (default): enter phone → Pay → approve PIN on handset → ticket confirms on the same page
2. Card: name + email + phone → hosted card checkout → `/payment-complete`
