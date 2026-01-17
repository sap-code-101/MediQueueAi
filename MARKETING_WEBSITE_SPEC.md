# MediQueueAI Marketing & License Website Specification

> Complete specification for building the marketing website, license management system, and payment integration for MediQueueAI.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Pages Structure](#pages-structure)
4. [License Management System](#license-management-system)
5. [API Endpoints](#api-endpoints)
6. [Stripe Integration](#stripe-integration)
7. [Email Templates](#email-templates)
8. [Design Requirements](#design-requirements)
9. [SEO Requirements](#seo-requirements)
10. [Security Requirements](#security-requirements)
11. [File Structure](#file-structure)
12. [Environment Variables](#environment-variables)
13. [Deployment](#deployment)

---

## Project Overview

MediQueueAI is a hospital queue management system that:
- Predicts patient wait times using machine learning
- Manages doctor schedules and appointments
- Allows patients to book appointments and check queue status
- Provides dashboards for doctors, receptionists, and admins
- **Sold as a self-hosted Docker container with license-based access**

### Business Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARKETING WEBSITE                            │
│  Customer buys license → Gets key: MQAI-ABCD-EFGH-1234          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER'S SERVER                            │
│  LICENSE_KEY=MQAI-ABCD-EFGH-1234 docker compose up -d           │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Backend reads LICENSE_KEY env variable                   │   │
│  │ Creates admin user with LICENSE_KEY as password          │   │
│  │ Stores license info in database                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  Login: username="admin", password="MQAI-ABCD-EFGH-1234"       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14+ with App Router, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL (for license management) |
| Payments | Stripe integration |
| Email | Resend or SendGrid for transactional emails |
| Hosting | Vercel (frontend) + Supabase/Neon (database) |

---

## Pages Structure

### Landing Page (`/`)

**Sections:**
- Hero section with tagline: "AI-Powered Smart Hospital Queue Management"
- Problem statement: Long wait times frustrate patients and staff
- Solution: MediQueueAI predicts wait times, optimizes queues
- Key features with icons:
  - AI Wait Time Predictions
  - Real-time Queue Tracking
  - Patient Self-Check-in
  - Doctor Dashboard
  - Multi-stage Queue Support
  - Analytics & Reports
- Pricing section (see pricing tiers below)
- Testimonials (placeholder)
- FAQ section
- Call-to-action: "Get Started" → /pricing

### Features Page (`/features`)

- Detailed breakdown of each feature
- Screenshots/mockups of the application
- Comparison table vs manual queue management
- Technical specifications:
  - Docker-based deployment
  - SQLite database (lightweight)
  - Python ML models
  - Real-time Socket.io updates

### Pricing Page (`/pricing`)

#### Tier 1: Starter - $99/month or $999/year
| Feature | Included |
|---------|----------|
| Doctors | Up to 3 |
| Receptionist accounts | 2 |
| Analytics | Basic |
| Support | Email |
| License prefix | `MQAI-STR-XXXX-XXXX` |

#### Tier 2: Professional - $249/month or $2,499/year
| Feature | Included |
|---------|----------|
| Doctors | Up to 10 |
| Receptionist accounts | 5 |
| Analytics | Advanced |
| Support | Priority |
| Custom branding | ✓ |
| License prefix | `MQAI-PRO-XXXX-XXXX` |

#### Tier 3: Enterprise - $499/month or $4,999/year
| Feature | Included |
|---------|----------|
| Doctors | Unlimited |
| Receptionist accounts | Unlimited |
| Analytics | Full suite |
| Support | 24/7 phone |
| On-premise support | ✓ |
| API access | ✓ |
| License prefix | `MQAI-ENT-XXXX-XXXX` |

Each tier has "Buy Now" button → Stripe checkout

### Documentation Page (`/docs`)

**Content:**
- Installation guide:
  ```bash
  # Quick Start
  LICENSE_KEY=MQAI-XXXX-XXXX-XXXX docker compose up -d
  
  # Access
  Frontend: http://localhost:3000
  Backend: http://localhost:5000
  
  # Login
  Username: admin
  Password: <your-license-key>
  ```
- System requirements
- Configuration options
- User guide for each role (Admin, Doctor, Receptionist, Patient)
- API documentation
- Troubleshooting

### Purchase Success Page (`/purchase/success`)

- Thank you message
- Display the generated license key prominently
- Copy button for license key
- Installation instructions
- Link to documentation
- Email confirmation sent notice

### Customer Dashboard (`/dashboard`) - Requires Auth

- Customer login (email/password, not license-based)
- View purchased licenses
- Download invoices
- Manage subscription
- View license usage/validity

---

## License Management System

### Database Schema (PostgreSQL)

```sql
-- Customers (website users who buy licenses)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    company_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Licenses
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT UNIQUE NOT NULL,  -- MQAI-XXX-XXXX-XXXX
    customer_id UUID REFERENCES customers(id),
    tier TEXT NOT NULL,  -- starter, professional, enterprise
    status TEXT DEFAULT 'active',  -- active, expired, suspended, revoked
    hospital_name TEXT,
    
    -- Stripe info
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    
    -- Dates
    purchased_at TIMESTAMP DEFAULT NOW(),
    activated_at TIMESTAMP,
    expires_at TIMESTAMP,
    last_validated_at TIMESTAMP,
    
    -- Usage tracking (optional)
    activation_count INT DEFAULT 0,
    last_activation_ip TEXT
);

-- License validation logs
CREATE TABLE validation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    validated_at TIMESTAMP DEFAULT NOW(),
    result TEXT  -- valid, expired, invalid, suspended
);

-- Indexes
CREATE INDEX idx_licenses_key ON licenses(license_key);
CREATE INDEX idx_licenses_customer ON licenses(customer_id);
```

### License Key Generation

```typescript
function generateLicenseKey(tier: 'starter' | 'professional' | 'enterprise'): string {
    const prefixes = {
        starter: 'STR',
        professional: 'PRO', 
        enterprise: 'ENT'
    };
    
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segments: string[] = [];
    
    for (let s = 0; s < 2; s++) {
        let segment = '';
        for (let i = 0; i < 4; i++) {
            segment += chars[Math.floor(Math.random() * chars.length)];
        }
        segments.push(segment);
    }
    
    return `MQAI-${prefixes[tier]}-${segments.join('-')}`;
}

// Output examples:
// MQAI-STR-AB2K-XY7P (Starter)
// MQAI-PRO-MN4Q-9RWT (Professional)
// MQAI-ENT-KL8V-2JFC (Enterprise)
```

### Feature Limits by Tier

```typescript
const TIER_FEATURES = {
    starter: {
        maxDoctors: 3,
        maxReceptionists: 2,
        analytics: 'basic',
        customBranding: false,
        apiAccess: false
    },
    professional: {
        maxDoctors: 10,
        maxReceptionists: 5,
        analytics: 'advanced',
        customBranding: true,
        apiAccess: false
    },
    enterprise: {
        maxDoctors: -1,  // unlimited
        maxReceptionists: -1,  // unlimited
        analytics: 'full',
        customBranding: true,
        apiAccess: true
    }
};
```

---

## API Endpoints

### Public API (for MediQueueAI instances to validate)

#### POST `/api/v1/license/validate`

Validates a license key and returns features.

**Request:**
```json
{
    "licenseKey": "MQAI-PRO-AB2K-XY7P",
    "hospitalName": "City General Hospital",
    "instanceId": "unique-installation-id"
}
```

**Response - Valid:**
```json
{
    "valid": true,
    "tier": "professional",
    "status": "active",
    "expiresAt": "2027-01-17T00:00:00Z",
    "features": {
        "maxDoctors": 10,
        "maxReceptionists": 5,
        "analytics": "advanced",
        "customBranding": true,
        "apiAccess": false
    },
    "hospitalName": "City General Hospital"
}
```

**Response - Invalid:**
```json
{
    "valid": false,
    "error": "LICENSE_EXPIRED",
    "message": "Your license has expired. Please renew at https://mediqueueai.com/renew"
}
```

**Error Codes:**
| Code | Description |
|------|-------------|
| `LICENSE_INVALID` | License key doesn't exist |
| `LICENSE_EXPIRED` | License has expired |
| `LICENSE_SUSPENDED` | License was suspended |
| `LICENSE_REVOKED` | License was revoked |

#### GET `/api/v1/license/status`

Quick status check for a license.

**Request:**
```
GET /api/v1/license/status?key=MQAI-PRO-AB2K-XY7P
```

**Response:**
```json
{
    "valid": true,
    "tier": "professional",
    "status": "active",
    "daysRemaining": 342,
    "expiresAt": "2027-01-17T00:00:00Z"
}
```

### Internal API (for website dashboard)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create customer account |
| `/api/auth/login` | POST | Customer login |
| `/api/auth/logout` | POST | Customer logout |
| `/api/dashboard/licenses` | GET | Get customer's licenses |
| `/api/dashboard/licenses/:id` | GET | Get single license details |
| `/api/stripe/checkout` | POST | Create Stripe checkout session |
| `/api/stripe/webhook` | POST | Handle Stripe events |
| `/api/stripe/portal` | POST | Create Stripe billing portal session |

---

## Stripe Integration

### Products & Prices Setup

Create these in Stripe Dashboard:

| Product | Price ID Pattern | Amount |
|---------|-----------------|--------|
| MediQueueAI Starter Monthly | `price_starter_monthly` | $99/mo |
| MediQueueAI Starter Yearly | `price_starter_yearly` | $999/yr |
| MediQueueAI Professional Monthly | `price_pro_monthly` | $249/mo |
| MediQueueAI Professional Yearly | `price_pro_yearly` | $2,499/yr |
| MediQueueAI Enterprise Monthly | `price_ent_monthly` | $499/mo |
| MediQueueAI Enterprise Yearly | `price_ent_yearly` | $4,999/yr |

### Checkout Session Creation

```typescript
// /api/stripe/checkout/route.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    const { priceId, customerEmail, tier } = await req.json();
    
    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: customerEmail,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
        metadata: {
            tier: tier,
        },
    });
    
    return Response.json({ url: session.url });
}
```

### Webhook Handler

```typescript
// /api/stripe/webhook/route.ts
import Stripe from 'stripe';
import { generateLicenseKey } from '@/lib/license';
import { db } from '@/lib/db';
import { sendLicenseEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature')!;
    
    let event: Stripe.Event;
    
    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }
    
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const tier = session.metadata?.tier as 'starter' | 'professional' | 'enterprise';
            const customerEmail = session.customer_email!;
            
            // Generate license key
            const licenseKey = generateLicenseKey(tier);
            
            // Calculate expiry (1 year for yearly, 1 month for monthly)
            const expiresAt = new Date();
            if (session.mode === 'subscription') {
                // Stripe handles renewal, set initial expiry
                expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            }
            
            // Find or create customer
            let customer = await db.customer.findUnique({ where: { email: customerEmail } });
            if (!customer) {
                customer = await db.customer.create({
                    data: { email: customerEmail, password_hash: '' }
                });
            }
            
            // Store license
            await db.license.create({
                data: {
                    license_key: licenseKey,
                    customer_id: customer.id,
                    tier: tier,
                    status: 'active',
                    stripe_customer_id: session.customer as string,
                    stripe_subscription_id: session.subscription as string,
                    expires_at: expiresAt,
                }
            });
            
            // Send email with license key
            await sendLicenseEmail({
                to: customerEmail,
                licenseKey: licenseKey,
                tier: tier,
                expiresAt: expiresAt,
            });
            
            break;
        }
        
        case 'invoice.paid': {
            const invoice = event.data.object as Stripe.Invoice;
            const subscriptionId = invoice.subscription as string;
            
            // Extend license expiry
            await db.license.updateMany({
                where: { stripe_subscription_id: subscriptionId },
                data: { 
                    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    status: 'active'
                }
            });
            break;
        }
        
        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            
            // Mark license as expired
            await db.license.updateMany({
                where: { stripe_subscription_id: subscription.id },
                data: { status: 'expired' }
            });
            break;
        }
        
        case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            
            if (subscription.cancel_at_period_end) {
                // Subscription will cancel at period end
                // Optionally notify customer
            }
            break;
        }
    }
    
    return Response.json({ received: true });
}
```

---

## Email Templates

### License Purchase Confirmation

```
Subject: Your MediQueueAI License Key 🎉

Hi {customerName},

Thank you for purchasing MediQueueAI {tierName}!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR LICENSE KEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{licenseKey}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUICK START
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Install Docker on your server
   https://docs.docker.com/get-docker/

2. Create a docker-compose.yml or download ours:
   https://mediqueueai.com/docs/docker-compose.yml

3. Run the following command:
   LICENSE_KEY={licenseKey} docker compose up -d

4. Access your installation:
   Frontend: http://your-server:3000
   Backend API: http://your-server:5000

5. Login with:
   Username: admin
   Password: {licenseKey}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LICENSE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Plan: {tierName}
Valid Until: {expiresAt}
Max Doctors: {maxDoctors}
Max Receptionists: {maxReceptionists}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESOURCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Documentation: https://mediqueueai.com/docs
💬 Support: support@mediqueueai.com
🎫 Dashboard: https://mediqueueai.com/dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need help? Reply to this email or visit our support portal.

Best regards,
The MediQueueAI Team

---
© 2024 MediQueueAI. All rights reserved.
```

### License Expiry Warning (7 days before)

```
Subject: Your MediQueueAI license expires in 7 days ⚠️

Hi {customerName},

Your MediQueueAI license ({licenseKey}) will expire on {expiresAt}.

To avoid service interruption, please renew your subscription:

👉 Renew Now: https://mediqueueai.com/dashboard/renew?license={licenseKey}

If you have automatic renewal enabled, you don't need to take any action.

Questions? Contact us at support@mediqueueai.com

Best regards,
The MediQueueAI Team
```

### License Expired

```
Subject: Your MediQueueAI license has expired

Hi {customerName},

Your MediQueueAI license ({licenseKey}) expired on {expiredAt}.

Your installation will continue to work, but you won't receive:
- Software updates
- New features
- Technical support

To reactivate your license:
👉 https://mediqueueai.com/dashboard/renew?license={licenseKey}

Best regards,
The MediQueueAI Team
```

---

## Design Requirements

### Colors

| Usage | Color | Hex |
|-------|-------|-----|
| Primary | Blue | `#3b82f6` |
| Secondary | Purple | `#8b5cf6` |
| Accent/Success | Green | `#10b981` |
| Warning | Amber | `#f59e0b` |
| Error | Red | `#ef4444` |
| Background | Slate | `#f8fafc` |
| Text Primary | Slate 900 | `#0f172a` |
| Text Secondary | Slate 500 | `#64748b` |

### Typography

- **Font Family:** Inter (or similar clean sans-serif)
- **Headings:** Bold (700)
- **Body:** Regular (400)
- **Small text:** Medium (500)

### Design Principles

- Modern, clean, medical/healthcare aesthetic
- Responsive design (mobile-first)
- Dark mode support (optional)
- Subtle animations (Framer Motion)
- Medical-themed illustrations or icons
- Plenty of whitespace
- Clear visual hierarchy

---

## SEO Requirements

### Meta Tags

```html
<!-- Primary -->
<title>MediQueueAI - AI-Powered Hospital Queue Management</title>
<meta name="description" content="Reduce patient wait times by 40% with AI-powered queue predictions. Real-time tracking, smart scheduling, and seamless hospital management." />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://mediqueueai.com/" />
<meta property="og:title" content="MediQueueAI - AI-Powered Hospital Queue Management" />
<meta property="og:description" content="Reduce patient wait times by 40% with AI-powered queue predictions." />
<meta property="og:image" content="https://mediqueueai.com/og-image.png" />

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="https://mediqueueai.com/" />
<meta property="twitter:title" content="MediQueueAI - AI-Powered Hospital Queue Management" />
<meta property="twitter:description" content="Reduce patient wait times by 40% with AI-powered queue predictions." />
<meta property="twitter:image" content="https://mediqueueai.com/og-image.png" />
```

### Target Keywords

- hospital queue management
- patient wait time prediction
- medical appointment scheduling
- healthcare queue system
- AI hospital software
- clinic management software
- patient flow management
- hospital wait time solution

### Technical SEO

- `sitemap.xml` - Auto-generated
- `robots.txt` - Allow all pages except `/api/*` and `/dashboard/*`
- Structured data (Organization, Product, FAQ schemas)
- Canonical URLs
- Clean URL structure

---

## Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| HTTPS | Required (automatic with Vercel) |
| Rate Limiting | 100 req/min per IP on public endpoints |
| License Validation Rate Limit | 10 req/min per license key |
| Input Sanitization | All user inputs sanitized |
| SQL Injection Prevention | Parameterized queries only |
| CORS | Configured for API endpoints |
| Webhook Verification | Stripe signature verification |
| Password Hashing | bcrypt with salt rounds 12 |
| JWT Tokens | Short expiry (1 hour), refresh tokens |

---

## File Structure

```
mediqueueai-website/
├── app/
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Global styles
│   │
│   ├── features/
│   │   └── page.tsx             # Features page
│   │
│   ├── pricing/
│   │   └── page.tsx             # Pricing page
│   │
│   ├── docs/
│   │   ├── page.tsx             # Docs index
│   │   ├── installation/
│   │   │   └── page.tsx         # Installation guide
│   │   ├── configuration/
│   │   │   └── page.tsx         # Configuration guide
│   │   └── [slug]/
│   │       └── page.tsx         # Dynamic doc pages
│   │
│   ├── dashboard/
│   │   ├── layout.tsx           # Dashboard layout (auth required)
│   │   ├── page.tsx             # Dashboard home
│   │   ├── licenses/
│   │   │   └── page.tsx         # View licenses
│   │   └── billing/
│   │       └── page.tsx         # Billing & invoices
│   │
│   ├── purchase/
│   │   └── success/
│   │       └── page.tsx         # Purchase success page
│   │
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx         # Customer login
│   │   ├── register/
│   │   │   └── page.tsx         # Customer registration
│   │   └── forgot-password/
│   │       └── page.tsx         # Password reset
│   │
│   └── api/
│       ├── v1/
│       │   └── license/
│       │       ├── validate/
│       │       │   └── route.ts # POST - Validate license
│       │       └── status/
│       │           └── route.ts # GET - License status
│       │
│       ├── auth/
│       │   ├── login/
│       │   │   └── route.ts     # POST - Login
│       │   ├── register/
│       │   │   └── route.ts     # POST - Register
│       │   └── logout/
│       │       └── route.ts     # POST - Logout
│       │
│       ├── stripe/
│       │   ├── checkout/
│       │   │   └── route.ts     # POST - Create checkout
│       │   ├── webhook/
│       │   │   └── route.ts     # POST - Stripe webhook
│       │   └── portal/
│       │       └── route.ts     # POST - Billing portal
│       │
│       └── dashboard/
│           ├── licenses/
│           │   └── route.ts     # GET - List licenses
│           └── profile/
│               └── route.ts     # GET/PUT - User profile
│
├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   │
│   ├── landing/                 # Landing page sections
│   │   ├── hero.tsx
│   │   ├── features.tsx
│   │   ├── pricing-preview.tsx
│   │   ├── testimonials.tsx
│   │   └── faq.tsx
│   │
│   ├── pricing/
│   │   ├── pricing-card.tsx
│   │   └── pricing-toggle.tsx   # Monthly/Yearly toggle
│   │
│   ├── dashboard/
│   │   ├── sidebar.tsx
│   │   ├── license-card.tsx
│   │   └── stats.tsx
│   │
│   └── shared/
│       ├── header.tsx
│       ├── footer.tsx
│       └── logo.tsx
│
├── lib/
│   ├── db.ts                    # Database connection (Prisma)
│   ├── stripe.ts                # Stripe client
│   ├── license.ts               # License generation/validation
│   ├── email.ts                 # Email sending (Resend)
│   ├── auth.ts                  # Authentication helpers
│   └── utils.ts                 # Utility functions
│
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Database migrations
│
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── og-image.png
│   │   └── screenshots/
│   ├── docs/
│   │   └── docker-compose.yml   # Downloadable docker-compose
│   └── favicon.ico
│
├── .env.example                 # Environment variables template
├── .env.local                   # Local environment variables
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies
└── README.md                    # Project README
```

---

## Environment Variables

```env
# ===========================================
# DATABASE
# ===========================================
DATABASE_URL=postgresql://user:password@host:5432/mediqueueai_website

# ===========================================
# STRIPE
# ===========================================
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_YEARLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_ENT_MONTHLY=price_...
STRIPE_PRICE_ENT_YEARLY=price_...

# ===========================================
# EMAIL (Resend)
# ===========================================
RESEND_API_KEY=re_...
EMAIL_FROM=MediQueueAI <noreply@mediqueueai.com>

# ===========================================
# AUTHENTICATION
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-change-this
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://mediqueueai.com

# ===========================================
# APP
# ===========================================
NEXT_PUBLIC_APP_URL=https://mediqueueai.com
NODE_ENV=production
```

---

## Deployment

### Prerequisites

1. **Vercel Account** - For hosting the Next.js app
2. **Supabase/Neon Account** - For PostgreSQL database
3. **Stripe Account** - For payment processing
4. **Resend Account** - For transactional emails
5. **Domain** - mediqueueai.com (or your choice)

### Deployment Steps

#### 1. Database Setup (Supabase)

```bash
# Create a new Supabase project
# Get the DATABASE_URL from Project Settings > Database

# Run migrations
npx prisma migrate deploy
```

#### 2. Stripe Setup

1. Create products in Stripe Dashboard
2. Set up webhook endpoint: `https://mediqueueai.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`

#### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard
# or via CLI:
vercel env add DATABASE_URL
vercel env add STRIPE_SECRET_KEY
# ... etc
```

#### 4. Domain Setup

1. Add domain in Vercel Dashboard
2. Update DNS records
3. SSL is automatic

#### 5. Post-Deployment

- [ ] Test checkout flow with Stripe test mode
- [ ] Test license validation API
- [ ] Test email delivery
- [ ] Set up monitoring (Vercel Analytics, Sentry)
- [ ] Switch Stripe to live mode

---

## Testing the Integration

### Test License Validation

```bash
# Test the validation endpoint
curl -X POST https://mediqueueai.com/api/v1/license/validate \
  -H "Content-Type: application/json" \
  -d '{"licenseKey": "MQAI-PRO-AB2K-XY7P", "hospitalName": "Test Hospital"}'
```

### Test Stripe Webhook Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Support

For questions about this specification:
- Email: support@mediqueueai.com
- Documentation: https://mediqueueai.com/docs

---

*This specification document is for internal use in building the MediQueueAI marketing website.*
