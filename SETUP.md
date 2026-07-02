# Lash Studio - Premium Booking Website Setup Guide

## Overview

This is a full-stack, premium lash extension booking website with a complete admin dashboard built with React 19, TypeScript, Vite, and Tailwind CSS.

## Features

### Public Website
- ✨ Modern, elegant hero page with premium typography
- 🖼️ Dynamic gallery with Cloudinary integration
- 💅 Services page with database-driven content
- 📅 Multi-step booking system with QPay integration
- 📍 Contact page with location information and Google Maps

### Admin Dashboard
- 🔐 Secure admin authentication
- 📊 Dashboard with key metrics and recent bookings
- 📋 Booking management (view, update status, cancel, reschedule)
- 🎨 Service management (create, edit, delete with images)
- 🖼️ Gallery management (upload, reorder, delete)
- ⚙️ Settings management (salon info, working hours, QPay config)

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4 with custom configuration
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation
- **Database**: Supabase (PostgreSQL)
- **Image Storage**: Cloudinary
- **Payment**: QPay API
- **State Management**: Zustand
- **Router**: React Router v6
- **Icons**: Lucide React

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (free tier available)
- Cloudinary account (free tier available)
- QPay merchant account (optional for testing)

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name

# QPay Configuration (optional)
VITE_QPAY_MERCHANT_ID=your_qpay_merchant_id
VITE_QPAY_API_KEY=your_qpay_api_key
```

### 3. Set Up Supabase Database

Create these tables in your Supabase project:

#### `services` table
```sql
create table services (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  price integer not null,
  duration integer,
  image_url text,
  is_active boolean default true,
  created_at timestamp default now()
);
```

#### `bookings` table
```sql
create table bookings (
  id uuid default uuid_generate_v4() primary key,
  service_id uuid references services(id),
  date date not null,
  time time not null,
  customer_name text not null,
  customer_phone text not null,
  status text default 'pending',
  advance_paid boolean default false,
  created_at timestamp default now()
);
```

#### `gallery` table
```sql
create table gallery (
  id uuid default uuid_generate_v4() primary key,
  url text not null,
  alt text,
  position integer default 0,
  created_at timestamp default now()
);
```

#### `settings` table
```sql
create table settings (
  id uuid default uuid_generate_v4() primary key,
  salon_name text not null,
  logo_url text,
  address text not null,
  address_image_url text,
  phone text not null,
  facebook_link text,
  working_hours text,
  qpay_config jsonb,
  created_at timestamp default now()
);
```

#### `admins` table
```sql
create table admins (
  id uuid default uuid_generate_v4() primary key,
  email text not null unique,
  password_hash text not null,
  created_at timestamp default now()
);
```

### 4. Set Up Cloudinary

1. Create a Cloudinary account at https://cloudinary.com
2. Get your Cloud Name from the dashboard
3. Add to your `.env.local`:
   ```env
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   ```

### 5. Configure QPay (Optional)

1. Get merchant credentials from QPay
2. Add to your `.env.local`:
   ```env
   VITE_QPAY_MERCHANT_ID=your_merchant_id
   VITE_QPAY_API_KEY=your_api_key
   ```

## Development

### Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

This creates an optimized single-file build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── public/          # Public website components
│   │   ├── Navigation.tsx
│   │   └── Footer.tsx
│   └── admin/           # Admin dashboard components
│       └── AdminSidebar.tsx
├── contexts/            # Context providers
│   └── SupabaseContext.tsx
├── layouts/             # Page layouts
│   ├── PublicLayout.tsx
│   └── AdminLayout.tsx
├── pages/
│   ├── public/          # Public pages
│   │   ├── HomePage.tsx
│   │   ├── GalleryPage.tsx
│   │   ├── ServicesPage.tsx
│   │   ├── BookingPage.tsx
│   │   └── ContactPage.tsx
│   └── admin/           # Admin pages
│       ├── AdminLogin.tsx
│       ├── AdminDashboard.tsx
│       ├── AdminBookings.tsx
│       ├── AdminServices.tsx
│       ├── AdminGallery.tsx
│       └── AdminSettings.tsx
├── stores/              # Zustand stores
│   └── authStore.ts
├── App.tsx              # Main app component
└── index.css            # Global styles with fonts
```

## Design System

### Color Palette
- **Cream Background**: `#FAF7F2`
- **Soft Pink**: `#E8BFCF`
- **Gold Accent**: `#C9A86A`
- **Dark Text**: `#1F1F1F`
- **White**: Cards and overlays

### Typography
- **Headings**: Playfair Display (serif)
- **Body**: Manrope (sans-serif)

### Spacing & Borders
- **Border Radius**: 20-24px (premium rounded corners)
- **Component Spacing**: Large whitespace for luxury aesthetic
- **Animations**: Subtle fade, scale, and slide transitions

## Key Features Explained

### 1. Multi-Step Booking
- Step 1: Service selection with prices
- Step 2: Date selection (prevents past dates)
- Step 3: Customer information with validation
- Step 4: QPay payment confirmation
- Automatic booking confirmation on successful payment

### 2. Admin Authentication
- Simple token-based authentication
- Login credentials stored in localStorage
- Protected routes with ProtectedRoute component
- Auto-redirect to login for unauthorized access

### 3. Database-Driven Content
- All services, gallery images, and settings from database
- Real-time updates when admin makes changes
- No hardcoded content

### 4. Cloudinary Integration
- Store all images in Cloudinary
- High-quality delivery without noticeable compression
- Responsive image sizes automatically generated
- Easy image management from admin dashboard

### 5. QPay Integration
- 20,000₮ advance payment requirement
- Advance deducted from final service price
- Non-refundable if customer doesn't arrive
- Payment webhook integration (to be implemented)

## Admin Login Credentials (Demo)

```
Email: admin@lashstudio.com
Password: demo123456
```

⚠️ Change these credentials immediately in production!

## Customization

### Change Salon Name
1. Go to Admin Dashboard → Settings
2. Update "Salon Name"
3. This appears throughout the site

### Add Services
1. Go to Admin Dashboard → Services
2. Click "Add Service"
3. Fill in details and upload image
4. Services automatically appear on Services page and booking flow

### Upload Gallery Images
1. Go to Admin Dashboard → Gallery
2. Paste Cloudinary image URL
3. Images appear on Gallery page in upload order

### Manage Bookings
1. Go to Admin Dashboard → Bookings
2. View all bookings with customer info
3. Update status (Pending → Confirmed → Completed/Cancelled)
4. Search and filter by status
5. Cancel bookings if needed

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Single-file optimized build (~550KB gzipped)
- Lazy loading for images
- Code splitting with React Router
- Optimized Tailwind CSS
- No unnecessary dependencies

## Security Considerations

1. **Admin Passwords**: Hash passwords using bcrypt in production
2. **Environment Variables**: Never commit `.env.local` to version control
3. **HTTPS**: Use HTTPS in production
4. **CORS**: Configure proper CORS headers for API endpoints
5. **Rate Limiting**: Implement rate limiting on payment endpoints
6. **Data Validation**: All inputs validated with Zod on both client and server

## Deployment

### Deploy to Vercel (Recommended)

```bash
vercel deploy
```

### Deploy to Netlify

1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Environment Variables in Production
- Configure all `.env` variables in your hosting provider's dashboard
- Never expose API keys in frontend code (use backend proxy if needed)

## Troubleshooting

### Supabase Connection Issues
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct
- Check that tables exist in Supabase dashboard
- Enable row level security policies if needed

### Images Not Loading from Cloudinary
- Verify VITE_CLOUDINARY_CLOUD_NAME is correct
- Check that image URLs are valid and public
- Ensure CORS is enabled in Cloudinary settings

### Build Size Too Large
- Check for unused dependencies: `npm ls`
- Use dynamic imports for heavy components
- Optimize images before uploading

## Contributing

To add features:
1. Create a new branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is created for premium salon booking. Customize as needed for your business.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review component documentation in code
3. Check Supabase and Cloudinary documentation

## Next Steps

1. Set up all environment variables
2. Create Supabase tables
3. Configure Cloudinary
4. Customize salon information
5. Add your services and gallery images
6. Test the complete booking flow
7. Deploy to production

Happy booking! 🎉
