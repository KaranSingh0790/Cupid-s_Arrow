# Cupid's Arrow 💘

An India-first romantic web application that enables users to express love through immersive, interactive experiences delivered via email.

## Features

- **Two Experience Modes**:
  - 💕 **Crush Mode**: Secret admiration reveal with playful Yes/No Valentine proposal
  - 💑 **Couple Mode**: Memory timeline with appreciation and reaffirmation CTA

- **Preview-First, Pay-to-Send Model**
- **UPI-First Payments** via Razorpay
- **Automated Email Delivery** after payment confirmation
- **No User Accounts Required**

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- Framer Motion (animations)
- Zustand (state management)
- React Router

### Backend
- Supabase (PostgreSQL + Row Level Security)
- Supabase Edge Functions (TypeScript)

### Integrations
- Razorpay (payments)
- Resend (transactional emails)

## Project Structure

```
val/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # UI & experience components
│   │   ├── pages/            # Route pages
│   │   ├── stores/           # Zustand stores
│   │   └── lib/              # Supabase & Razorpay clients
│   └── ...
├── supabase/
│   ├── migrations/           # Database schema
│   └── functions/            # Edge Functions
│       ├── createExperience/ 
│       ├── createPayment/
│       ├── paymentWebhook/
│       └── sendEmail/
└── README.md
```

## Setup

### Prerequisites
- Node.js 18+
- Supabase CLI
- Razorpay account (test mode)
- Resend account

### 1. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### 2. Database Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 3. Edge Functions Deployment

```bash
# Set secrets
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxx
supabase secrets set RAZORPAY_KEY_SECRET=xxx
supabase secrets set RAZORPAY_WEBHOOK_SECRET=xxx
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set APP_URL=https://your-domain.com

# Deploy functions
supabase functions deploy createExperience
supabase functions deploy createPayment
supabase functions deploy paymentWebhook
supabase functions deploy sendEmail
```

### 4. Razorpay Webhook Setup

1. Go to Razorpay Dashboard → Webhooks
2. Add webhook URL: `https://your-project.supabase.co/functions/v1/paymentWebhook`
3. Select event: `payment.captured`
4. Copy webhook secret to Supabase secrets

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```

### Edge Functions (Supabase Secrets)
```
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
RESEND_API_KEY=re_xxx
APP_URL=https://cupidsarrow.app
```

## User Flow

### Sender Flow
1. Landing → Select Experience Type
2. Fill Details → Preview Experience
3. Pay with Razorpay → Email Sent Automatically

### Recipient Flow
1. Receive Email → Click Link
2. Experience Playback → Respond
3. Completion Screen

## Experience Lifecycle

```
DRAFT → PREVIEW → PAID → SENT → OPENED → RESPONDED
```

## Pricing

| Mode   | Price |
|--------|-------|
| Crush  | ₹49   |
| Couple | ₹99   |

## Development

```bash
# Run frontend dev server
cd frontend && npm run dev

# Run Edge Functions locally
supabase functions serve
```

## License

Private - All rights reserved.
