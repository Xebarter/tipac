import crypto from "crypto";

const baseUrl = (process.env.PAYTOTA_BASE_URL || "https://gate.paytota.com").replace(/\/$/, "");
const secretKey = process.env.PAYTOTA_SECRET_KEY;
const brandId = process.env.PAYTOTA_BRAND_ID;

export class PaymentConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentConfigError";
  }
}

export function assertPaytotaConfig() {
  if (!secretKey || !brandId) {
    throw new PaymentConfigError("Mobile money payments are not configured");
  }
}

/** Normalize Uganda local (07xxxxxxxx) / 256 / 7xxxxxxxx into 256XXXXXXXXX */
export function toUgandaMsisdn(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("256") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `256${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 9) return `256${digits}`;
  throw new Error("Phone number must be a valid Uganda mobile number (07xxxxxxxx)");
}

export function isValidUgLocalPhone(phone: string): boolean {
  return /^07[0-9]{8}$/.test(phone.replace(/\s+/g, ""));
}

export type CreatePurchaseInput = {
  phoneMsisdn: string;
  email?: string | null;
  fullName?: string | null;
  amountUgx: number;
  productName: string;
  reference: string;
  successRedirect?: string;
  failureRedirect?: string;
  successCallback?: string;
};

export type PaytotaPurchase = {
  id: string;
  status: string;
  checkout_url?: string;
  reference?: string;
  [key: string]: unknown;
};

/** Paytota/DRF-style errors: { __all__: [{message}], field: [{message}] } */
function extractPaytotaError(data: any, status: number): string {
  if (!data) return `Payment request failed (${status})`;
  if (typeof data === "string") return data;

  const parts: string[] = [];

  const pushMsg = (item: unknown) => {
    if (!item) return;
    if (typeof item === "string") {
      parts.push(item);
      return;
    }
    if (typeof item === "object" && item !== null && "message" in item) {
      parts.push(String((item as { message: unknown }).message));
      return;
    }
    parts.push(JSON.stringify(item));
  };

  if (Array.isArray(data.__all__)) data.__all__.forEach(pushMsg);
  if (typeof data.message === "string") parts.push(data.message);
  if (typeof data.detail === "string") parts.push(data.detail);
  if (typeof data.error === "string") parts.push(data.error);

  for (const [key, value] of Object.entries(data)) {
    if (key === "__all__" || key === "message" || key === "detail" || key === "error" || key === "raw") {
      continue;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === "string") parts.push(`${key}: ${item}`);
        else if (item && typeof item === "object" && "message" in item) {
          parts.push(`${key}: ${String((item as { message: unknown }).message)}`);
        }
      });
    } else if (value && typeof value === "object") {
      // nested e.g. client: { email: [{ message }] }
      for (const [subKey, subVal] of Object.entries(value as Record<string, unknown>)) {
        if (Array.isArray(subVal)) {
          subVal.forEach((item) => {
            if (typeof item === "string") parts.push(`${key}.${subKey}: ${item}`);
            else if (item && typeof item === "object" && "message" in item) {
              parts.push(`${key}.${subKey}: ${String((item as { message: unknown }).message)}`);
            }
          });
        }
      }
    }
  }

  if (parts.length) return parts.join("; ");
  if (data.raw && typeof data.raw === "string") return data.raw.slice(0, 300);
  return `Payment request failed (${status})`;
}

async function paytotaFetch(path: string, init?: RequestInit) {
  assertPaytotaConfig();
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      Accept: "application/json",
      ...(init?.headers || {}),
    },
    signal: init?.signal ?? AbortSignal.timeout(20000),
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    console.error("[MOBILE MONEY API ERROR]", res.status, path, text?.slice(0, 1000));
    throw new Error(extractPaytotaError(data, res.status));
  }
  return data;
}

export async function createPurchase(input: CreatePurchaseInput): Promise<PaytotaPurchase> {
  // Provider validates email format — use a real TLD fallback
  const email =
    input.email?.trim() ||
    `tickets+${input.phoneMsisdn}@tipac.co.ug`;

  const payload: Record<string, unknown> = {
    client: {
      email,
      phone: input.phoneMsisdn,
      country: "UG",
      ...(input.fullName?.trim() ? { full_name: input.fullName.trim() } : {}),
    },
    purchase: {
      currency: "UGX",
      products: [
        {
          name: input.productName.slice(0, 120),
          // Mobile Money docs use string amounts in UGX major units
          price: String(Math.round(input.amountUgx)),
        },
      ],
    },
    reference: String(input.reference),
    skip_capture: false,
    brand_id: brandId,
  };

  // Only send public https redirects — localhost URLs are often rejected
  const isPublicHttpUrl = (url?: string) =>
    !!url && /^https:\/\//i.test(url) && !/localhost|127\.0\.0\.1/i.test(url);

  if (isPublicHttpUrl(input.successRedirect)) payload.success_redirect = input.successRedirect;
  if (isPublicHttpUrl(input.failureRedirect)) payload.failure_redirect = input.failureRedirect;
  if (isPublicHttpUrl(input.successCallback)) payload.success_callback = input.successCallback;

  console.log("[MOBILE MONEY] Creating purchase", {
    phone: input.phoneMsisdn,
    amount: Math.round(input.amountUgx),
    reference: input.reference,
    hasRedirects: Boolean(payload.success_redirect),
  });

  return paytotaFetch("/api/v1/purchases/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** Trigger STK / PIN prompt on the subscriber handset (server-to-server). */
export async function executeMobileMoneyPurchase(purchaseId: string): Promise<unknown> {
  assertPaytotaConfig();
  const form = new FormData();
  form.append("s2s", "true");
  form.append("pm", "paytota_proxy");

  const res = await fetch(`${baseUrl}/p/${purchaseId}/`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(20000),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      data?.details?.message ||
      data?.message ||
      data?.error ||
      `Could not start mobile money prompt (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return data;
}

export async function getPurchase(purchaseId: string): Promise<PaytotaPurchase> {
  return paytotaFetch(`/api/v1/purchases/${purchaseId}/`, { method: "GET" });
}

export function normalizePurchaseStatus(status: string | null | undefined): {
  ticketStatus: "pending" | "confirmed" | "failed";
  label: string;
} {
  const s = (status || "").toLowerCase();
  if (s === "paid" || s === "captured" || s === "settled" || s === "overpaid") {
    return { ticketStatus: "confirmed", label: "successful" };
  }
  if (
    s === "error" ||
    s === "cancelled" ||
    s === "expired" ||
    s === "failed" ||
    s === "chargeback" ||
    s === "refunded"
  ) {
    return { ticketStatus: "failed", label: status || "failed" };
  }
  // created | pending_execute | pending | preauthorized | etc.
  return { ticketStatus: "pending", label: status || "pending" };
}

export async function getWebhookPublicKey(): Promise<string | null> {
  try {
    assertPaytotaConfig();
    const data = await paytotaFetch("/api/v1/public_key/", { method: "GET" });
    if (typeof data === "string") return data;
    if (data?.public_key) return data.public_key as string;
    if (data?.key) return data.key as string;
    return null;
  } catch (err) {
    console.error("[MOBILE MONEY] Failed to fetch public key", err);
    return process.env.PAYTOTA_WEBHOOK_PUBLIC_KEY || null;
  }
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureBase64: string | null,
  publicKeyPem: string
): boolean {
  if (!signatureBase64 || !publicKeyPem) return false;
  try {
    const key = publicKeyPem.includes("BEGIN")
      ? publicKeyPem
      : `-----BEGIN PUBLIC KEY-----\n${publicKeyPem}\n-----END PUBLIC KEY-----`;
    const verifier = crypto.createVerify("SHA256");
    verifier.update(rawBody);
    verifier.end();
    return verifier.verify(key, Buffer.from(signatureBase64, "base64"));
  } catch (err) {
    console.error("[MOBILE MONEY] Signature verify error", err);
    return false;
  }
}

/** Strip provider brand names from anything shown to buyers. */
export function sanitizeBuyerFacingError(message: string): string {
  return message
    .replace(/paytota/gi, "payment provider")
    .replace(/pesapal/gi, "payment provider")
    .replace(/PesaPal/g, "payment provider");
}
