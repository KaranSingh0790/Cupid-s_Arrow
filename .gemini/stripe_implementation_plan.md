# Stripe Implementation Plan for Cupid's Arrow 💘

## Executive Summary

This plan outlines the integration of **Stripe** as a payment gateway for Cupid's Arrow, alongside the existing Razorpay integration. This enables:
- **Global reach** - Accept payments from 135+ countries
- **Multi-currency support** - USD, EUR, GBP, etc.
- **Better international UX** - Apple Pay, Google Pay, Link
- **Dual payment system** - Razorpay for India, Stripe for international

---

## Current State Analysis

### Existing Payment Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                      CURRENT FLOW (Razorpay)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Frontend              Edge Functions             Database     │
│   ────────              ──────────────             ────────     │
│                                                                 │
│   Payment.jsx  ──────►  createPayment  ──────►  payments        │
│       │                 (Razorpay Order)         (PENDING)      │
│       │                                                         │
│       ▼                                                         │
│   Razorpay                                                      │
│   Checkout    ─────────────────────────────────────────────►    │
│       │                                                         │
│       ▼                                                         │
│   verifyPayment  ◄──  User Callback                             │
│       │                                                         │
│       ▼                                                         │
│   paymentWebhook  ◄──  Razorpay Server                          │
│       │                                                         │
│       ▼                                                         │
│   sendEmail  ──────►  experiences (PAID → SENT)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Current Files Involved
| File | Purpose |
|------|---------|
| `frontend/src/lib/razorpay.js` | Client-side Razorpay SDK integration |
| `frontend/src/pages/Payment.jsx` | Payment UI with Razorpay checkout |
| `supabase/functions/createPayment/` | Creates Razorpay order |
| `supabase/functions/verifyPayment/` | Verifies Razorpay signature (client callback) |
| `supabase/functions/paymentWebhook/` | Handles Razorpay webhook events |
| `supabase/migrations/001_schema.sql` | Database schema (Razorpay-specific columns) |

---

## Proposed Architecture

### Dual Payment Gateway Strategy
```
┌─────────────────────────────────────────────────────────────────┐
│                    PROPOSED FLOW (Multi-Gateway)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                      ┌──────────────────┐                       │
│                      │   Payment.jsx    │                       │
│                      │  (Gateway Select)│                       │
│                      └────────┬─────────┘                       │
│                               │                                 │
│              ┌────────────────┴────────────────┐                │
│              │                                 │                │
│              ▼                                 ▼                │
│   ┌──────────────────┐              ┌──────────────────┐        │
│   │    Razorpay      │              │     Stripe       │        │
│   │   (India 🇮🇳)     │              │ (International🌍)│        │
│   └────────┬─────────┘              └────────┬─────────┘        │
│            │                                 │                  │
│            ▼                                 ▼                  │
│   createPayment                     createStripePayment         │
│   (Razorpay Order)                  (Stripe Checkout Session)   │
│            │                                 │                  │
│            ▼                                 ▼                  │
│   paymentWebhook                    stripeWebhook               │
│   (Razorpay Events)                 (Stripe Events)             │
│            │                                 │                  │
│            └────────────────┬────────────────┘                  │
│                             │                                   │
│                             ▼                                   │
│                        sendEmail                                │
│                    (Unified trigger)                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Database Schema Updates
**Estimated Time: 1 hour**

#### 1.1 New Migration: `002_stripe_support.sql`

```sql
-- Add gateway-agnostic payment fields
ALTER TABLE payments
  ADD COLUMN payment_gateway TEXT DEFAULT 'razorpay',
  ADD COLUMN stripe_session_id TEXT,
  ADD COLUMN stripe_payment_intent_id TEXT,
  ADD COLUMN stripe_customer_id TEXT;

-- Create index for Stripe lookups
CREATE INDEX idx_payments_stripe_session ON payments(stripe_session_id);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);

-- Add constraint for payment gateway
ALTER TABLE payments
  ADD CONSTRAINT valid_payment_gateway 
  CHECK (payment_gateway IN ('razorpay', 'stripe'));
```

#### 1.2 Schema Considerations
- Keep existing Razorpay columns (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`)
- Add Stripe-specific columns (`stripe_session_id`, `stripe_payment_intent_id`)
- Add `payment_gateway` discriminator column

---

### Phase 2: Stripe Edge Functions
**Estimated Time: 3-4 hours**

#### 2.1 Create `createStripePayment/index.ts`

```typescript
// Key functionality:
// 1. Create Stripe Checkout Session
// 2. Configure success/cancel URLs
// 3. Store session in payments table
// 4. Return checkout URL to frontend

import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

// Create Checkout Session with:
// - Experience details as metadata
// - Automatic currency detection (or USD default)
// - Apple Pay / Google Pay enabled
// - Success and cancel redirect URLs
```

**Request Body:**
```typescript
interface CreateStripePaymentRequest {
  experience_id: string;
  currency?: string; // 'usd', 'eur', 'gbp' - default 'usd'
}
```

**Response:**
```typescript
interface CreateStripePaymentResponse {
  success: boolean;
  checkout_url: string;
  session_id: string;
}
```

#### 2.2 Create `stripeWebhook/index.ts`

```typescript
// Key functionality:
// 1. Verify Stripe webhook signature
// 2. Handle checkout.session.completed event
// 3. Update payment & experience status
// 4. Trigger sendEmail function

// Key events to handle:
// - checkout.session.completed → Payment successful
// - checkout.session.expired → Payment abandoned
// - charge.refunded → Handle refunds
```

**Webhook Events:**
| Event | Action |
|-------|--------|
| `checkout.session.completed` | Mark PAID, trigger email |
| `checkout.session.expired` | Mark FAILED |
| `charge.refunded` | Mark REFUNDED |

---

### Phase 3: Frontend Integration
**Estimated Time: 2-3 hours**

#### 3.1 Create `frontend/src/lib/stripe.js`

```javascript
// Stripe.js client library wrapper
// - Load Stripe.js dynamically
// - Redirect to Stripe Checkout
// - Handle success/cancel redirects

export async function initializeStripePayment(sessionUrl) {
  // Simply redirect to Stripe Checkout URL
  window.location.href = sessionUrl;
}

export function formatStripeCurrency(cents, currency = 'usd') {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
  return formatter.format(cents / 100);
}
```

#### 3.2 Update `Payment.jsx`

```jsx
// Add gateway selection UI (auto-detect or manual)
// - GeoIP-based auto-detection (India → Razorpay, else → Stripe)
// - Manual toggle for user preference
// - Different checkout flows based on selection

const [paymentGateway, setPaymentGateway] = useState(() => {
  // Auto-detect based on user locale/timezone
  return detectPaymentGateway();
});
```

**UI Additions:**
1. Gateway toggle/selector (subtle, possibly auto)
2. Different payment method icons (UPI vs Card/Apple Pay)
3. Currency display (₹ vs $)

#### 3.3 Create Success Handler Route

Since Stripe uses redirects (not popup like Razorpay):

```jsx
// Update App.jsx routes
<Route path="/create/payment/success" element={<StripeSuccess />} />
<Route path="/create/payment/cancel" element={<StripeCancel />} />
```

---

### Phase 4: Environment & Secrets
**Estimated Time: 30 minutes**

#### 4.1 New Environment Variables

**Frontend (.env):**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

**Supabase Secrets:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

#### 4.2 Stripe Dashboard Configuration

1. **Create Product & Prices:**
   - Crush Mode: $0.99 (or equivalent)
   - Couple Mode: $1.99 (or equivalent)

2. **Configure Webhook:**
   - URL: `https://your-project.supabase.co/functions/v1/stripeWebhook`
   - Events: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`

3. **Enable Payment Methods:**
   - Cards
   - Apple Pay
   - Google Pay
   - Link (Stripe's 1-click checkout)

---

### Phase 5: Currency & Pricing Strategy
**Estimated Time: 1 hour**

#### 5.1 Pricing Table

| Mode | India (₹) | USD ($) | EUR (€) | GBP (£) |
|------|-----------|---------|---------|---------|
| Crush | ₹49 | $0.99 | €0.99 | £0.79 |
| Couple | ₹99 | $1.99 | €1.99 | £1.59 |

#### 5.2 Currency Detection Logic

```javascript
function detectCurrency() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = navigator.language;
  
  // India detection
  if (timezone.includes('Kolkata') || locale.includes('IN')) {
    return { gateway: 'razorpay', currency: 'INR' };
  }
  
  // Europe
  if (timezone.includes('Europe')) {
    return { gateway: 'stripe', currency: 'EUR' };
  }
  
  // UK
  if (timezone.includes('London') || locale.includes('GB')) {
    return { gateway: 'stripe', currency: 'GBP' };
  }
  
  // Default: USD
  return { gateway: 'stripe', currency: 'USD' };
}
```

---

## File Structure After Implementation

```
val/
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── razorpay.js          # Existing
│   │   │   ├── stripe.js            # NEW: Stripe client
│   │   │   └── payment-gateway.js   # NEW: Gateway detection & routing
│   │   ├── pages/
│   │   │   ├── Payment.jsx          # MODIFIED: Dual gateway support
│   │   │   ├── StripeSuccess.jsx    # NEW: Stripe success handler
│   │   │   └── StripeCancel.jsx     # NEW: Stripe cancel handler
│   │   └── ...
│   └── ...
├── supabase/
│   ├── migrations/
│   │   ├── 001_schema.sql           # Existing
│   │   └── 002_stripe_support.sql   # NEW: Stripe columns
│   └── functions/
│       ├── createPayment/           # Existing (Razorpay)
│       ├── verifyPayment/           # Existing (Razorpay)
│       ├── paymentWebhook/          # Existing (Razorpay)
│       ├── createStripePayment/     # NEW
│       ├── stripeWebhook/           # NEW
│       └── sendEmail/               # Existing (unchanged)
└── ...
```

---

## Implementation Checklist

### Phase 1: Database ✅
- [x] Create migration `002_stripe_support.sql`
- [x] Add `payment_gateway` column
- [x] Add Stripe-specific columns
- [x] Create indexes
- [ ] Test migration locally
- [ ] Push to Supabase

### Phase 2: Edge Functions ✅
- [x] Create `createStripePayment/index.ts`
- [x] Create `stripeWebhook/index.ts`
- [x] Add Stripe npm package to Deno imports
- [ ] Test locally with `supabase functions serve`
- [ ] Deploy to Supabase

### Phase 3: Frontend ✅
- [x] Create `stripe.js` library
- [x] Gateway detection logic included in stripe.js
- [x] Update `Payment.jsx` with gateway selection
- [x] Create `StripeSuccess.jsx` page
- [x] Create `StripeCancel.jsx` page
- [x] Update `App.jsx` routes
- [x] Update `experienceStore.js` with Stripe methods
- [ ] Test complete flow

### Phase 4: Configuration (TODO)
- [ ] Add Stripe keys to `.env`
- [ ] Set Supabase secrets
- [ ] Create Stripe products/prices
- [ ] Configure Stripe webhook
- [ ] Enable payment methods in Stripe Dashboard

### Phase 5: Testing (TODO)
- [ ] Test Razorpay flow (regression)
- [ ] Test Stripe flow (cards)
- [ ] Test Stripe flow (Apple Pay - Safari)
- [ ] Test webhook reliability
- [ ] Test currency detection
- [ ] Test error handling

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Webhook failures | Implement retry logic, store raw events |
| Currency mismatch | Validate currency in backend, not frontend |
| Gateway detection fails | Default to Stripe (broader support) |
| Existing Razorpay breaks | Feature flag, gradual rollout |
| Refund handling | Implement refund webhook handler |

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Database | 1 hour | None |
| Phase 2: Edge Functions | 3-4 hours | Phase 1 |
| Phase 3: Frontend | 2-3 hours | Phase 2 |
| Phase 4: Configuration | 30 mins | Stripe account |
| Phase 5: Testing | 2 hours | All phases |
| **Total** | **8-10 hours** | |

---

## Future Enhancements

1. **Stripe Connect** - If you want to offer marketplace features
2. **Subscription Mode** - Monthly romantic experience packages
3. **Multi-currency Pricing** - Dynamic pricing based on region
4. **Payment Links** - Share direct payment links
5. **Invoice Generation** - For receipts and tax compliance

---

## Quick Start Commands

```bash
# 1. Create Stripe account at stripe.com

# 2. Get API keys from Stripe Dashboard

# 3. Set Supabase secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx

# 4. Deploy new functions (after creating them)
supabase functions deploy createStripePayment
supabase functions deploy stripeWebhook

# 5. Update frontend env
echo "VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx" >> frontend/.env

# 6. Push database migration
supabase db push
```

---

**Ready to implement?** Let me know and I'll start with Phase 1! 🚀
