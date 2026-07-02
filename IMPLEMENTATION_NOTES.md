# Implementation Notes - Lash Studio

## Overview

This document provides detailed implementation notes for developers working with the Lash Studio booking system.

## Architecture Decisions

### 1. Mock Supabase Implementation
- **Location**: `src/contexts/SupabaseContext.tsx`
- **Reason**: Allows the app to run without Supabase setup initially
- **To Enable Real Supabase**:
  ```typescript
  import { createClient } from '@supabase/supabase-js';
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  ```

### 2. Authentication Flow
- **Type**: Token-based (localStorage)
- **Admin Store**: `src/stores/authStore.ts` (Zustand)
- **Protected Routes**: `src/components/ProtectedRoute.tsx`
- **Demo Mode**: Works without database for testing

### 3. State Management
- **Global State**: Zustand (auth store)
- **Component State**: React useState for UI
- **Database State**: Direct Supabase queries (no caching)
- **Why Zustand**: Lightweight, no provider hell, perfect for simple auth

### 4. Styling Approach
- **Framework**: Tailwind CSS 4 with custom config
- **Fonts**: Google Fonts (Playfair Display & Manrope)
- **Colors**: Custom palette in `tailwind.config.js`
- **Responsive**: Mobile-first design
- **Animations**: Framer Motion (minimal, purposeful)

## Component Architecture

### Page Components
Each page is a self-contained component that:
1. Fetches its own data via `useEffect`
2. Manages local UI state
3. Handles form submission and mutations
4. Shows loading/error states

### Layout Components
- **PublicLayout**: Navigation + Outlet + Footer
- **AdminLayout**: Sidebar + Outlet
- Both use React Router `<Outlet />`

### Shared Components
- **Navigation.tsx**: Glassmorphism navbar with mobile menu
- **Footer.tsx**: Contact info and social links
- **AdminSidebar.tsx**: Active route highlighting

## Data Flow

```
User Interaction
       ↓
Component Handler
       ↓
Supabase Query/Mutation
       ↓
State Update
       ↓
Re-render
```

## Important Implementation Details

### Booking System
1. **Multi-step Form** (`BookingPage.tsx`)
   - Step 1: Service selection
   - Step 2: Date selection (validated against past dates)
   - Step 3: Customer info (form validation with React Hook Form + Zod)
   - Step 4: Payment confirmation

2. **Form Validation**
   - Uses Zod schema for client-side validation
   - React Hook Form for form state management
   - Displays validation errors inline

3. **Payment Flow**
   - Shows QPay payment modal
   - 20,000₮ advance payment
   - Non-refundable policy notice
   - Booking auto-confirms on payment

### Admin Features

#### Dashboard
- Fetches today's, upcoming, and recent bookings
- Calculates total revenue (advance payments × bookings)
- Shows booking status distribution
- Auto-refreshes on navigation

#### Bookings Management
- Search by customer name or phone
- Filter by status (Pending, Confirmed, Completed, Cancelled)
- Status dropdown for quick updates
- Delete bookings with confirmation

#### Services Management
- Create with title, description, price, duration, image
- Upload to Cloudinary or use existing URLs
- Toggle active/inactive status
- Edit existing services
- Delete with confirmation

#### Gallery Management
- Upload images from Cloudinary URLs
- Reorder images with move buttons
- Delete with confirmation
- Position tracking for consistent ordering

#### Settings
- All salon information
- Logo and address image URLs
- Working hours (free text)
- Facebook link
- QPay configuration (placeholder)

## Database Integration Points

### Services
```javascript
const { data, error } = await supabase
  .from('services')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: true });
```

### Bookings
```javascript
const { data, error } = await supabase
  .from('bookings')
  .insert([{
    service_id,
    date,
    time,
    customer_name,
    customer_phone,
    status: 'confirmed',
    advance_paid: true
  }]);
```

### Gallery
```javascript
const { data, error } = await supabase
  .from('gallery')
  .select('*')
  .order('position', { ascending: true });
```

### Settings
```javascript
const { data, error } = await supabase
  .from('settings')
  .select('*')
  .single();
```

## Form Implementation Pattern

All forms follow this pattern:

```typescript
// 1. Define types
interface FormData {
  field: string;
}

// 2. Create schema
const schema = z.object({
  field: z.string().min(1)
});

// 3. Set up form hook
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});

// 4. Handle submission
const onSubmit = async (data: FormData) => {
  // Mutation logic
};

// 5. Render with validation
<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('field')} />
  {errors.field && <span>{errors.field.message}</span>}
</form>
```

## Animation Patterns

### Fade Up (Initial Load)
```typescript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}
```

### Scale (Card Interactions)
```typescript
whileHover={{ scale: 1.05 }}
transition={{ duration: 0.3 }}
```

### Stagger (Lists)
```typescript
variants={{
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}}
```

## File Size Optimization

Current build: **547KB (163KB gzipped)**

### Techniques Used
1. **Single-file build** (vite-plugin-singlefile)
2. **CSS minification** (Tailwind)
3. **JavaScript minification** (Vite)
4. **Code splitting** by route (React Router)
5. **Image lazy loading** (native)
6. **No unused dependencies**

## Common Tasks

### Add a New Service
1. Go to Admin → Services
2. Click "Add Service"
3. Fill form and submit
4. Service appears on Services page and booking flow

### Upload Gallery Image
1. Get image URL from Cloudinary
2. Go to Admin → Gallery
3. Paste URL and alt text
4. Image appears in gallery

### Change Booking Status
1. Go to Admin → Bookings
2. Find booking
3. Click status dropdown
4. Select new status
5. Updates immediately

### Update Salon Info
1. Go to Admin → Settings
2. Update fields
3. Click "Save Settings"
4. Changes appear across website

## Troubleshooting

### Images Not Loading
- Check Cloudinary URL is correct
- Verify image is public
- Check browser console for errors

### Booking Not Created
- Verify all form fields are valid
- Check Supabase connection
- Check browser console for errors

### Admin Page Not Loading
- Ensure logged in (check localStorage for adminToken)
- Clear cache and reload
- Check Supabase connection

## Performance Tips

1. **Images**: Use Cloudinary for transformations
2. **Queries**: Limit results with `.limit()`
3. **Rendering**: Use React.memo() for expensive components
4. **Animations**: Use will-change: transform for GPU acceleration

## Security Considerations

1. **Admin Password**: Hash before storing in database
2. **API Keys**: Never expose in frontend code
3. **CORS**: Configure in Supabase settings
4. **Validation**: Always validate on both client and server
5. **HTTPS**: Use in production

## Future Enhancements

1. **Email Notifications**: Send confirmation emails
2. **SMS Reminders**: Remind customers before appointment
3. **Review System**: Allow customers to leave reviews
4. **Real QPay Integration**: Complete payment processing
5. **Analytics**: Track booking trends
6. **Multiple Locations**: Support multiple salons
7. **Staff Scheduling**: Multiple staff members
8. **Product Sales**: Sell lash care products

## Migration Guide from Mock to Real Supabase

1. Update `SupabaseContext.tsx` with real client
2. Create tables using SQL from SETUP.md
3. Set environment variables
4. Test each feature (services, gallery, bookings)
5. Verify forms work correctly
6. Test admin features
7. Run production build

## Dependencies Overview

| Package | Purpose | Why? |
|---------|---------|------|
| react-router-dom | Routing | Standard choice |
| framer-motion | Animations | Smooth, performant |
| react-hook-form | Forms | Lightweight, efficient |
| zod | Validation | Type-safe validation |
| zustand | State | Minimal, no boilerplate |
| supabase | Database | All-in-one backend |
| lucide-react | Icons | Tree-shakeable icons |
| tailwindcss | Styling | Utility-first CSS |
| vite | Build | Fast, modern build tool |

## Code Quality

- **TypeScript**: Full type safety
- **Linting**: Via TypeScript
- **Formatting**: Consistent style
- **Comments**: Where complexity exists
- **Naming**: Descriptive, consistent
- **Error Handling**: Try-catch in async functions

## Testing Checklist

- [ ] Public pages load correctly
- [ ] Navigation works across all pages
- [ ] Gallery images lazy load
- [ ] Services display with correct prices
- [ ] Booking form validates inputs
- [ ] Admin login works
- [ ] Bookings can be viewed/filtered
- [ ] Services can be created/edited/deleted
- [ ] Gallery images can be uploaded/deleted
- [ ] Settings can be saved
- [ ] Mobile responsive on all pages
- [ ] Form errors display correctly
- [ ] Loading states show
- [ ] Error handling works

## Deployment Checklist

- [ ] All environment variables set
- [ ] Supabase database created and populated
- [ ] Cloudinary configured
- [ ] Admin credentials changed
- [ ] Building successfully
- [ ] No console errors
- [ ] No broken links
- [ ] Performance acceptable
- [ ] Mobile works
- [ ] Forms submit correctly

---

For more details, see [README.md](./README.md) and [SETUP.md](./SETUP.md)
