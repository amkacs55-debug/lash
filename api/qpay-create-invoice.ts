// POST /api/qpay-create-invoice
//
// Body: {
//   serviceId: string,
//   date: string,       // "YYYY-MM-DD"
//   time: string,       // "HH:MM"
//   customerName: string,
//   customerPhone: string,
// }
//
// Flow:
//   1. Re-validate the slot is still free (server-side, authoritative check).
//   2. Insert a `pending_payment` booking row (this "holds" the slot).
//   3. Create a QPay invoice for the fixed advance amount (20,000₮).
//   4. Return the invoice QR (text + image) and our internal booking id to the client.
//
// The booking is NOT confirmed here — it only becomes `confirmed` once
// /api/qpay-callback (webhook) or /api/qpay-check (polling) sees status PAID.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';
import { createInvoice } from './_lib/qpay';

const ADVANCE_AMOUNT_MNT = 20000;
const HOLD_MINUTES = 15;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { serviceId, date, time, customerName, customerPhone } = req.body || {};

    if (!serviceId || !date || !time || !customerName || !customerPhone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = getSupabaseAdmin();

    // Look up the service to get its duration + price (never trust client-sent price/duration)
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, title, price, duration')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const duration = (service as any).duration || 60;
    const requestedStart = toMinutes(time);
    const requestedEnd = requestedStart + duration;

    // Reject slots that are already in the past when booking for today.
    // (Client also blocks this in the UI, but the server is the source of truth.)
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (date === todayStr) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (requestedStart < nowMinutes) {
        return res.status(409).json({ error: 'SLOT_IN_PAST' });
      }
    } else if (date < todayStr) {
      return res.status(409).json({ error: 'SLOT_IN_PAST' });
    }

    // Expire any stale pending_payment holds older than HOLD_MINUTES before checking conflicts
    const cutoff = new Date(Date.now() - HOLD_MINUTES * 60 * 1000).toISOString();
    await supabase
      .from('bookings')
      .update({ status: 'expired' })
      .eq('status', 'pending_payment')
      .lt('created_at', cutoff);

    // Re-check for conflicts against active bookings (pending_payment/confirmed/completed)
    const { data: existing, error: existingError } = await supabase
      .from('bookings')
      .select('time, status, services(duration)')
      .eq('date', date)
      .in('status', ['pending_payment', 'confirmed', 'completed']);

    if (existingError) throw existingError;

    const conflict = (existing || []).some((b: any) => {
      const bStart = toMinutes((b.time as string).slice(0, 5));
      const bEnd = bStart + (b.services?.duration || 60);
      return requestedStart < bEnd && requestedEnd > bStart;
    });

    if (conflict) {
      return res.status(409).json({ error: 'SLOT_TAKEN' });
    }

    // Create the pending booking row (holds the slot)
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert([
        {
          service_id: serviceId,
          date,
          time,
          customer_name: customerName,
          customer_phone: customerPhone,
          status: 'pending_payment',
          advance_paid: false,
          advance_amount: ADVANCE_AMOUNT_MNT,
        },
      ])
      .select()
      .single();

    if (insertError || !booking) throw insertError || new Error('Failed to create booking');

    // Create the QPay invoice, tagged with our booking id so the callback can find it
    let invoice;
    try {
      invoice = await createInvoice({
        senderInvoiceNo: booking.id,
        amount: ADVANCE_AMOUNT_MNT,
        description: `${service.title} - урьдчилгаа төлбөр`,
        receiverName: customerName,
        receiverPhone: customerPhone,
      });
    } catch (qpayError) {
      // Roll back the held slot if invoice creation failed
      await supabase.from('bookings').delete().eq('id', booking.id);
      throw qpayError;
    }

    // Save the invoice id on the booking so we can check/confirm payment later
    await supabase
      .from('bookings')
      .update({ qpay_invoice_id: invoice.invoice_id })
      .eq('id', booking.id);

    return res.status(200).json({
      bookingId: booking.id,
      invoiceId: invoice.invoice_id,
      qrText: invoice.qr_text,
      qrImage: invoice.qr_image,
      urls: invoice.urls || [],
      amount: ADVANCE_AMOUNT_MNT,
    });
  } catch (err: any) {
    console.error('qpay-create-invoice error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
