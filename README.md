# Theatre for Ignatius Peter And Charles (TIPAC)

Welcome to the official website for Theatre for Ignatius Peter And Charles (TIPAC). This is a Next.js 15+ application built with TypeScript, Tailwind CSS, and various other modern technologies.

## Technologies Used

- Next.js 15+
- TypeScript
- Tailwind CSS
- Framer Motion
- MongoDB (for contact messages)
- Supabase (for gallery images and events)
- PesaPal API (for ticket payments)

## Getting Started

1. Clone the repository
2. Install dependencies with `bun install` (or `npm install`)
3. Copy `.env.example` to `.env.local` and fill in your environment variables
4. Run the development server with `bun dev` (or `npm run dev`)

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Deployment

### Deploying to Vercel

This application is optimized for deployment on Vercel. Follow these steps:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Sign up/in to [Vercel](https://vercel.com)
3. Create a new project and import your repository
4. Configure environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `MONGODB_URI` - Your MongoDB connection string
   - `PESAPAL_CONSUMER_KEY` - Your PesaPal consumer key
   - `PESAPAL_CONSUMER_SECRET` - Your PesaPal consumer secret
   - `PESAPAL_CALLBACK_URL` - Your payment completion callback URL
   - `PESAPAL_IPN_ID` - Your PesaPal IPN ID
   - `PESAPAL_BASE_URL` - PesaPal API base URL (https://pay.pesapal.com/v3 for production)
   - `SITE_URL` - Your website URL (e.g., https://yourdomain.com)
5. Click "Deploy" and your application will be live!

### Environment Variables

See `.env.example` for all required environment variables.

## Ticketing System

The TIPAC website features an advanced ticketing system that supports both online and offline ticket sales:

### Online Tickets
- Processed through PesaPal payment gateway
- Automatically confirmed after successful payment
- Accessible through the main ticket purchasing page

### Offline (Batch) Tickets
- Generated in batches by administrators for physical distribution
- Each ticket has a unique QR code for verification
- Tickets must be activated with buyer information before use
- Verified through the ticket verification page

### Admin Features
Administrators can access additional ticketing features through the admin panel:
- Generate batch tickets for events
- Activate physical tickets with buyer information
- Verify ticket authenticity

To access the admin panel, visit `/admin` and log in with the credentials:
- Email: admin@tipac.com
- Password: Admin123

### Database Migration
To enable the new ticketing features, run the migration script `supabase_ticket_migration.sql` on your Supabase database. This will add the necessary fields to the tickets table and create the batches table.

## Learn More

To learn more about the technologies used:
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.io/)
- [MongoDB](https://mongodb.com/)
- [PesaPal API](https://developer.pesapal.com/)