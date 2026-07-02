-- QPay интеграцид зориулсан bookings хүснэгтийн өөрчлөлт.
-- Supabase Dashboard > SQL Editor дотор ажиллуулна уу.
--
-- Логик:
--   1. Хэрэглэгч цаг сонгоод мэдээллээ бөглөхөд bookings мөр status='pending_payment'-ээр үүснэ.
--      Энэ нь тухайн slot-ыг 15 минутын турш "барьж" (өөр хэрэглэгч захиалахаас сэргийлнэ).
--   2. QPay invoice үүсэж, invoice_id нь bookings.qpay_invoice_id-д хадгалагдана.
--   3. Хэрэглэгч төлбөрөө хийсний дараа QPay callback ирнэ (эсвэл frontend polling хийнэ),
--      серверийн /api/qpay-callback эсвэл /api/qpay-check нь status='confirmed' болгож,
--      paid_at, qpay_payment_id-г бичнэ.
--   4. Хэрэв 15 минутын дотор төлбөр ороогүй бол pending_payment мөрийг "expired" гэж үзэж,
--      slot дахин чөлөөлөгдөнө (BookingPage-ийн slot query нь зөвхөн
--      pending_payment (шинэхэн)/confirmed/completed статустай мөрийг эзэлсэн гэж тооцно).

alter table bookings
  add column if not exists qpay_invoice_id text,
  add column if not exists qpay_payment_id text,
  add column if not exists advance_amount integer default 20000,
  add column if not exists paid_at timestamptz;

-- status баганын боломжит утгууд одоо:
--   'pending_payment' - захиалга үүссэн, QPay төлбөр хүлээгдэж байна (түр zөвшөөрөгдсөн, 15 минут)
--   'confirmed'        - урьдчилгаа амжилттай төлөгдсөн, цаг батлагдсан
--   'completed'        - үйлчилгээ хийгдэж дууссан (admin гараар тэмдэглэнэ)
--   'cancelled'        - цуцлагдсан
--   'expired'          - 15 минутын дотор төлбөр ороогүй тул slot чөлөөлөгдсөн

create index if not exists idx_bookings_qpay_invoice_id on bookings (qpay_invoice_id);
create index if not exists idx_bookings_date_status on bookings (date, status);
