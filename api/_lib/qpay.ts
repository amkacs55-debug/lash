// QPay Merchant API v2 client (server-side only — never import this from frontend code)
//
// Required environment variables (set these in Vercel dashboard, NOT prefixed with VITE_):
//   QPAY_USERNAME       - Merchant username provided by QPay
//   QPAY_PASSWORD       - Merchant password provided by QPay
//   QPAY_INVOICE_CODE   - Invoice code provided by QPay for this merchant/branch
//   QPAY_BASE_URL       - Optional. Defaults to production https://merchant.qpay.mn/v2
//                         Use https://merchant-sandbox.qpay.mn/v2 for testing
//   QPAY_CALLBACK_URL   - Full URL QPay should POST to when a payment is completed,
//                         e.g. https://your-domain.vercel.app/api/qpay-callback
//
// We deliberately do NOT persist the access token anywhere durable (no DB, no file).
// Vercel serverless functions are stateless/short-lived, so we just fetch a fresh
// token on every invocation. This is simpler and avoids stale-token bugs; QPay's
// auth endpoint is cheap to call and not rate-limited for this volume of traffic.

interface QPayTokenResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface QPayInvoiceLine {
  tax_product_code?: string | null;
  line_description: string;
  line_quantity: string;
  line_unit_price: string;
  note?: string;
}

export interface CreateInvoiceParams {
  senderInvoiceNo: string; // your own unique id for this invoice, e.g. booking id
  amount: number; // in MNT
  description: string;
  receiverName?: string;
  receiverPhone?: string;
}

export interface QPayInvoiceResponse {
  invoice_id: string;
  qr_text: string;
  qr_image: string; // base64 PNG
  qPay_shortUrl?: string;
  urls?: Array<{ name: string; description: string; logo?: string; link: string }>;
}

export interface QPayPaymentCheckRow {
  payment_id: string;
  payment_status: 'NEW' | 'FAILED' | 'PAID' | 'REFUNDED' | string;
  payment_date: string;
  payment_amount: string;
  payment_currency: string;
}

export interface QPayPaymentCheckResponse {
  count: number;
  paid_amount: number;
  rows: QPayPaymentCheckRow[];
}

function getBaseUrl(): string {
  return process.env.QPAY_BASE_URL || 'https://merchant.qpay.mn/v2';
}

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in your Vercel project settings.`
    );
  }
  return value;
}

/**
 * Authenticate against QPay and return a bearer access token.
 * Fetches a fresh token every call (see note above on why we don't cache).
 */
export async function getAccessToken(): Promise<string> {
  const username = getEnvOrThrow('QPAY_USERNAME');
  const password = getEnvOrThrow('QPAY_PASSWORD');
  const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

  const res = await fetch(`${getBaseUrl()}/auth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`QPay auth failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as QPayTokenResponse;
  return data.access_token;
}

/**
 * Create a QPay invoice for the given amount. Returns the invoice_id (used later
 * to check payment status) plus a QR code (text + base64 image) to display to the
 * customer.
 */
export async function createInvoice(
  params: CreateInvoiceParams
): Promise<QPayInvoiceResponse> {
  const invoiceCode = getEnvOrThrow('QPAY_INVOICE_CODE');
  const callbackUrl = getEnvOrThrow('QPAY_CALLBACK_URL');
  const token = await getAccessToken();

  const body = {
    invoice_code: invoiceCode,
    sender_invoice_no: params.senderInvoiceNo,
    invoice_receiver_code: 'terminal',
    invoice_description: params.description,
    amount: params.amount,
    callback_url: callbackUrl,
    ...(params.receiverName || params.receiverPhone
      ? {
          invoice_receiver_data: {
            name: params.receiverName || '',
            phone: params.receiverPhone || '',
          },
        }
      : {}),
  };

  const res = await fetch(`${getBaseUrl()}/invoice`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`QPay invoice creation failed (${res.status}): ${text}`);
  }

  return (await res.json()) as QPayInvoiceResponse;
}

/**
 * Check whether a given invoice has been paid. Returns the raw QPay response;
 * callers should check `paid_amount > 0` or look for a row with status PAID.
 */
export async function checkPayment(invoiceId: string): Promise<QPayPaymentCheckResponse> {
  const token = await getAccessToken();

  const res = await fetch(`${getBaseUrl()}/payment/check`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      object_type: 'INVOICE',
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 100 },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`QPay payment check failed (${res.status}): ${text}`);
  }

  return (await res.json()) as QPayPaymentCheckResponse;
}

export function isPaid(check: QPayPaymentCheckResponse): boolean {
  return check.paid_amount > 0 || check.rows.some((r) => r.payment_status === 'PAID');
}
