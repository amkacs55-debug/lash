// POST /api/qpay-check
//
// Body: { bookingId: string }
//
// Used by the frontend for polling (e.g. every 3s while the QR modal is open),
// as a fallback/complement to the qpay-callback webhook. Checks QPay directly
// for the invoice's payment status; if paid, marks the booking confirmed
// (idempotent — safe to call repeatedly, and safe if the webhook already did it).

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';
import { checkPayment, isPaid } from './_lib/qpay';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId } = req.body || {};
    if (!bookingId) {
      return res.status(400).json({ error: 'Missing bookingId' });
    }

    const supabase = getSupabaseAdmin();

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, qpay_invoice_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Already confirmed (e.g. webhook beat us to it) — nothing more to do
    if (booking.status === 'confirmed') {
      return res.status(200).json({ status: 'confirmed' });
    }

    if (booking.status === 'expired' || booking.status === 'cancelled') {
      return res.status(200).json({ status: booking.status });
    }

    if (!booking.qpay_invoice_id) {
      return res.status(200).json({ status: 'pending_payment' });
    }

    const paymentCheck = await checkPayment(booking.qpay_invoice_id as string);

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
        .eq('id', bookingId)
        .eq('status', 'pending_payment'); // idempotency guard

      return res.status(200).json({ status: 'confirmed' });
    }

    return res.status(200).json({ status: 'pending_payment' });
  } catch (err: any) {
    console.error('qpay-check error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
