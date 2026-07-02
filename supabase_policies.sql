-- Gallery, settings болон бусад admin хүснэгтэд Row Level Security (RLS)
-- идэвхжсэн боловч policy үүсгээгүй бол anon key-ээр insert/update хийхэд
-- "new row violates row-level security policy" гэсэн алдаа гардаг.
-- Энэ файлыг Supabase Dashboard > SQL Editor дотор бүхэлд нь ажиллуулна уу.

-- ===== GALLERY =====
alter table gallery enable row level security;

drop policy if exists "Public can read gallery" on gallery;
create policy "Public can read gallery"
  on gallery for select
  using (true);

drop policy if exists "Anyone can manage gallery" on gallery;
create policy "Anyone can manage gallery"
  on gallery for all
  using (true)
  with check (true);

-- ===== SETTINGS =====
alter table settings enable row level security;

drop policy if exists "Public can read settings" on settings;
create policy "Public can read settings"
  on settings for select
  using (true);

drop policy if exists "Anyone can manage settings" on settings;
create policy "Anyone can manage settings"
  on settings for all
  using (true)
  with check (true);

-- ===== SERVICES =====
alter table services enable row level security;

drop policy if exists "Public can read services" on services;
create policy "Public can read services"
  on services for select
  using (true);

drop policy if exists "Anyone can manage services" on services;
create policy "Anyone can manage services"
  on services for all
  using (true)
  with check (true);

-- ===== BOOKINGS =====
alter table bookings enable row level security;

drop policy if exists "Anyone can manage bookings" on bookings;
create policy "Anyone can manage bookings"
  on bookings for all
  using (true)
  with check (true);

-- ЗӨВЛӨМЖ:
-- Дээрх policy-үүд нь "anon" key-тэй хэн ч (жишээ нь frontend) уншиж/бичиж чадна
-- гэсэн үг. Энэ бол admin login-оо зөв хамгаалж чадаж байгаа тохиолдолд л
-- аюулгүй (жишээ нь /admin замыг ProtectedRoute-оор хамгаалсан бол).
-- Хэрэв цаашид илүү найдвартай болгохыг хүсвэл Supabase Auth ашиглаж,
-- зөвхөн нэвтэрсэн admin хэрэглэгчид бичих эрхтэй байхаар policy-г
-- өөрчлөх нь зөв шийдэл.
