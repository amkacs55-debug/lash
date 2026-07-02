// POST /api/qpay-cancel
//
// Body: { bookingId: string }
//
// Called when the customer clicks "Цуцлах" (Cancel) on the QR payment modal.
// Immediately releases the held slot instead of waiting for the 15-minute
// auto-expiry, so other customers can book it right away.
// No-op (still returns 200) if the booking is already confirmed/expired/etc —
// we only touch bookings still in pending_payment to avoid ever cancelling
// a booking that has actually been paid for.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';

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

    await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .eq('status', 'pending_payment'); // never touch a booking that's already confirmed

    return res.status(200).json({ cancelled: true });
  } catch (err: any) {
    console.error('qpay-cancel error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
