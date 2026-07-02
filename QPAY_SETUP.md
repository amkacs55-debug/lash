# QPay Интеграцийн Заавар

Энэ төсөл нь одоо **бодит QPay Merchant API v2**-той холбогдсон. Урьд нь
байсан "симуляц" төлбөр (шууд confirmed болгодог байсан) арилж, оронд нь
жинхэнэ QR нэхэмжлэл үүсэж, төлбөр орсны дараа л цаг батлагддаг боллоо.

## Хэрхэн ажилладаг вэ

1. Хэрэглэгч үйлчилгээ/огноо/цаг/мэдээллээ бөглөнө.
2. Frontend `/api/qpay-create-invoice` руу хүсэлт илгээнэ. Энэ серверийн
   функц нь:
   - Тухайн slot чөлөөтэй эсэхийг **сервер талд дахин шалгана** (frontend-ийн
     шалгалтад итгэдэггүй — race condition-оос хамгаална).
   - `bookings` хүснэгтэд `status = 'pending_payment'` мөр үүсгэж, slot-ыг
     15 минутын турш "барина".
   - QPay-с жинхэнэ invoice (нэхэмжлэл) үүсгэж, QR код буцаана.
3. Хэрэглэгчид QR код харагдана — банкныхаа аппаар уншуулж төлнө.
4. Frontend 3 секунд тутам `/api/qpay-check` рүү асууж, төлөгдсөн эсэхийг
   шалгана. Мөн QPay өөрөө `/api/qpay-callback` руу webhook илгээдэг
   (хэрэглэгч tab-аа хаасан ч гэсэн баталгаажна).
5. Төлбөр орсныг QPay баталгаажуулмагц booking `status = 'confirmed'` болж,
   slot албан ёсоор эзэлнэ.
6. Хэрэв 15 минутын дотор төлөгдөөгүй бол мөр `expired` болж, slot дахин
   чөлөөлөгдөнө (дараагийн хэрэглэгчийн хүсэлт дээр цэвэрлэгдэнэ).

## Vercel дээр тохируулах алхмууд

### 1. Supabase-д migration ажиллуулах

Supabase Dashboard > SQL Editor руу орж `supabase_qpay_migration.sql`
файлын агуулгыг бүхэлд нь хуулж ажиллуулна. (Хуучин `supabase_policies.sql`
аль хэдийн ажиллуулсан гэж үзэж байна; хэрэв үгүй бол түүнийг эхэлж
ажиллуулаарай.)

### 2. Vercel дээр Environment Variables нэмэх

Vercel Dashboard > таны төсөл > **Settings > Environment Variables** руу
орж дараах бүх утгыг нэмнэ (`.env.example` файлыг лавлагаа болгож болно):

| Key | Тайлбар | Хаанаас авах |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Public/anon key | Supabase Dashboard > Settings > API |
| `SUPABASE_URL` | Дээрхтэй ижил URL | — |
| `SUPABASE_SERVICE_ROLE_KEY` | **Нууц** service_role key | Supabase Dashboard > Settings > API |
| `QPAY_USERNAME` | QPay-с олгосон merchant username | QPay-тай хийсэн гэрээ/имэйл |
| `QPAY_PASSWORD` | QPay-с олгосон merchant password | QPay-тай хийсэн гэрээ/имэйл |
| `QPAY_INVOICE_CODE` | QPay invoice code | QPay-тай хийсэн гэрээ/имэйл |
| `QPAY_BASE_URL` | `https://merchant.qpay.mn/v2` (production) | — |
| `QPAY_CALLBACK_URL` | `https://<домэйн>/api/qpay-callback` | Deploy хийсний дараа домэйнээ мэдэж бөглөнө |

⚠️ **Чухал**: `SUPABASE_SERVICE_ROLE_KEY`, `QPAY_USERNAME`, `QPAY_PASSWORD`,
`QPAY_INVOICE_CODE` зэргийг **хэзээ ч `VITE_` угтвартай болгож болохгүй**.
`VITE_` угтвартай бүх зүйл build хийхэд browser-ийн JS bundle-д ил гардаг.

### 3. Deploy хийх

```
vercel --prod
```

Эсвэл Git repo-гоо Vercel-тэй холбож автомат deploy хийлгэж болно.

### 4. QPay Dashboard дээр callback URL бүртгэх

Хэрэв QPay-ийн merchant тохиргоонд webhook URL заавал бүртгэх шаардлагатай
бол `https://<домэйн>/api/qpay-callback`-г QPay-ийн удирдлагын самбар/
integration engineer-т мэдэгдэж бүртгүүлээрэй.

### 5. Тест хийх (Sandbox)

Эхлээд бодит мөнгөөр тест хийхээс өмнө `QPAY_BASE_URL`-г
`https://merchant-sandbox.qpay.mn/v2` болгож, QPay-с sandbox орчны тусдаа
username/password/invoice_code аваад турших нь зөв (энэ бол урьд нь
хэлэлцсэн сонголтуудын нэг байсан; хэрэв танд sandbox эрх байхгүй бол
шууд production-оор жижиг дүнгээр (жишээ нь 20,000₮) тест хийж болно).

## Файлын бүтэц

```
api/
  _lib/
    qpay.ts            # QPay auth/invoice/payment-check логик
    supabaseAdmin.ts   # Service-role Supabase client (зөвхөн серверт)
  qpay-create-invoice.ts  # POST — slot шалгах, booking hold хийх, invoice үүсгэх
  qpay-check.ts           # POST — frontend polling-д зориулсан төлбөр шалгалт
  qpay-callback.ts        # POST — QPay-с ирэх webhook
  qpay-cancel.ts          # POST — хэрэглэгч "Цуцлах" дархад slot-ыг шууд чөлөөлөх
supabase_qpay_migration.sql  # bookings хүснэгтэд нэмэх багана/индекс
```

## Анхаарах зүйлс

- `status` баганын шинэ утгууд: `pending_payment`, `expired` нэмэгдсэн
  (өмнөх `pending` статус ашиглагдахгүй болсон).
- Admin Bookings хуудсанд "Pending Payment" гэсэн шүүлтүүр/сонголт
  нэмэгдсэн тул төлбөр хүлээгдэж буй захиалгыг харах боломжтой.
- 15 минутын hold хугацааг `api/qpay-create-invoice.ts` доtorх
  `HOLD_MINUTES` тогтмолоор өөрчилж болно.
