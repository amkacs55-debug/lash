// POST /api/qpay-callback
//
// This is the webhook URL you give QPay (QPAY_CALLBACK_URL env var) — QPay calls
// this automatically when an invoice's payment status changes. QPay's callback
// payload format varies by integration; the reliable approach is to treat the
// callback as just a "hey, go check invoice X" trigger and re-verify status
// directly against QPay's payment/check endpoint (which is what we do here).
//
// This endpoint must respond quickly with 200 OK or QPay will retry.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';
import { checkPayment, isPaid } from './_lib/qpay';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // QPay typically sends the invoice/payment identifier as a query param or in
    // the body depending on integration setup. Support both.
    const invoiceId =
      (req.query.invoice_id as string) ||
      (req.body && (req.body.invoice_id || req.body.object_id));

    if (!invoiceId) {
      // Nothing we can act on — acknowledge anyway so QPay doesn't keep retrying garbage
      return res.status(200).json({ received: true });
    }

    const supabase = getSupabaseAdmin();

    const { data: booking } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('qpay_invoice_id', invoiceId)
      .single();

    if (!booking) {
      return res.status(200).json({ received: true });
    }

    if (booking.status === 'confirmed') {
      return res.status(200).json({ received: true, already: true });
    }

    const paymentCheck = await checkPayment(invoiceId);

    if (isPaid(paymentCheck)) {
      const paidRow = paymentCheck.rows.find((r) => r.payment_status === 'PAID');

      await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          advance_paid: true,
          paid_at: new Date().toISOString(),
          qpay_payment_id: paidRow?.payment_id || null,
        })
        .eq('id', booking.id)
        .eq('status', 'pending_payment');
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('qpay-callback error:', err);
    // Still return 200 so QPay doesn't hammer retries on our internal errors;
    // the polling endpoint (qpay-check) acts as a safety net regardless.
    return res.status(200).json({ received: true, error: err.message });
  }
}
