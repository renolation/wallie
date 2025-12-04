# Subscription Tracker Super App

## Project Overview

A comprehensive subscription management application combining household bill splitting, AI-powered automation, and deep analytics. Built with **Payload CMS** (backend/API/database) and **Flutter** (mobile app).

## Tech Stack

### Backend (payload/)
- **Framework**: Payload CMS 3.x (TypeScript)
- **Database**: PostgreSQL (via @payloadcms/db-postgres)
- **Authentication**: JWT-based auth with Payload's built-in auth
- **File Storage**: S3-compatible storage for avatars/receipts
- **Email**: Resend or Nodemailer for notifications
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **OCR/AI**: OpenAI Vision API or Google Cloud Vision
- **Cron Jobs**: node-cron for scheduled tasks (renewal checks, price monitoring)

### Mobile
- **Framework**: Flutter 3.x (Dart)
- **State Management**: Riverpod 2.x
- **Local Storage**: Hive or Isar for offline mode
- **HTTP Client**: Dio with interceptors
- **Push Notifications**: firebase_messaging
- **Biometrics**: local_auth package
- **Calendar**: device_calendar package

## Project Structure

```
wallie/
├── payload/                    # Payload CMS application (this directory)
│   ├── src/
│   │   ├── collections/        # Payload collections (Users, Subscriptions, etc.)
│   │   ├── globals/            # Global configs (PriceDatabase, AppSettings)
│   │   ├── hooks/              # Before/after change hooks
│   │   ├── endpoints/          # Custom REST endpoints
│   │   ├── jobs/               # Scheduled tasks
│   │   ├── services/           # Business logic (OCR, notifications, etc.)
│   │   ├── access/             # Reusable access control functions
│   │   └── payload.config.ts   # Main Payload configuration
│   └── package.json
│
├── mobile/                     # Flutter application (future)
│   ├── lib/
│   │   ├── core/               # App-wide utilities, theme, constants
│   │   ├── data/               # Repositories, data sources, models
│   │   ├── domain/             # Entities, use cases
│   │   ├── presentation/       # UI (screens, widgets, controllers)
│   │   └── main.dart
│   └── pubspec.yaml
│
└── docs/                       # Additional documentation
```

## Payload CMS Collections

### Core Collections

| Collection | Purpose |
|------------|---------|
| `users` | Authentication, profile, currency preferences |
| `subscriptions` | Individual subscription records |
| `households` | Family/group containers |
| `household-members` | Join table: users ↔ households with roles |
| `split-assignments` | Who pays what portion of a subscription |
| `categories` | Entertainment, Utilities, Software, etc. |
| `notifications` | Push notification queue and history |
| `price-records` | Historical price data for "Price Hike Watch" |

### Collection Relationships

```
User (1) ──────────── (N) Subscription
  │                         │
  │                         └── belongsTo: Household (optional)
  │
  └── (N) HouseholdMember (N) ── Household
                                    │
                                    └── (N) Subscription (shared)
```

## Coding Conventions

### Payload CMS (TypeScript)

```typescript
// Collection naming: kebab-case files, PascalCase types
// Example: collections/subscriptions.ts

import type { CollectionConfig } from 'payload'

export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  auth: false,
  admin: {
    useAsTitle: 'name',
    group: 'Core',
  },
  access: {
    read: ({ req: { user } }) => ({
      user: { equals: user?.id },
    }),
  },
  hooks: {
    beforeChange: [calculateNextPaymentDate],
    afterChange: [scheduleRenewalNotification],
  },
  fields: [
    // Fields defined here
  ],
}
```

### Flutter (Dart)

```dart
// Feature-first organization within presentation/
// Use Riverpod for all state management
// Models are immutable with copyWith

@freezed
class Subscription with _$Subscription {
  const factory Subscription({
    required String id,
    required String name,
    required double price,
    required BillingCycle billingCycle,
    required DateTime nextPaymentDate,
    String? logoUrl,
    String? householdId,
  }) = _Subscription;

  factory Subscription.fromJson(Map<String, dynamic> json) =>
      _$SubscriptionFromJson(json);
}
```

## API Patterns

### Standard Payload Endpoints (Auto-generated)
- `GET /api/subscriptions` - List with filters
- `POST /api/subscriptions` - Create
- `PATCH /api/subscriptions/:id` - Update
- `DELETE /api/subscriptions/:id` - Delete

### Custom Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/dashboard/summary` | GET | Aggregated stats for home screen |
| `/api/households/:id/settlements` | GET | Calculate "who owes who" |
| `/api/import/screenshot` | POST | OCR processing for subscription import |
| `/api/import/voice` | POST | Voice-to-subscription parsing |
| `/api/import/email-webhook` | POST | Receipt email parser webhook |
| `/api/sync` | POST | Offline data synchronization |

## Key Business Logic

### Next Payment Date Calculation

```typescript
function calculateNextPaymentDate(
  firstPaymentDate: Date,
  billingCycle: 'weekly' | 'monthly' | 'yearly'
): Date {
  const now = new Date()
  let next = new Date(firstPaymentDate)
  
  while (next <= now) {
    switch (billingCycle) {
      case 'weekly':
        next.setDate(next.getDate() + 7)
        break
      case 'monthly':
        next.setMonth(next.getMonth() + 1)
        break
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1)
        break
    }
  }
  
  return next
}
```

### Split Cost Calculation

```typescript
// User's actual cost = (subscription.price * userSplitPercentage) / 100
// Settlement = sum of (what user paid) - sum of (what user owes)
```

## Environment Variables

### payload (.env)
```
DATABASE_URI=postgresql://localhost:5432/wallie
PAYLOAD_SECRET=your-secret-key
S3_BUCKET=wallie-uploads
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx
OPENAI_API_KEY=xxx
FCM_SERVER_KEY=xxx
LOGO_API_KEY=xxx  # Clearbit or similar
```

### Mobile
```dart
// Use flutter_dotenv or compile-time env
const apiBaseUrl = String.fromEnvironment('API_URL');
```

## Development Commands

### Backend (payload/)
```bash
cd payload
pnpm install
pnpm dev              # Start dev server on http://localhost:3000
pnpm generate:types   # Generate TypeScript types
pnpm payload migrate  # Run database migrations
pnpm build            # Build for production
pnpm start            # Start production server
```

### Mobile
```bash
cd mobile
flutter pub get
flutter run
flutter build apk --release
flutter build ios --release
```

## Phase Implementation Priority

1. **Phase 1 (MVP)**: Auth, manual subscription CRUD, dashboard, basic notifications
2. **Phase 2**: Households, split-bill logic, calendar sync
3. **Phase 3**: OCR import, voice entry, email parser, free trial alerts
4. **Phase 4**: Analytics, offline mode, biometrics, privacy features

## Important Notes

- Always calculate `nextPaymentDate` server-side in hooks
- Logo fetching should be async with fallback to first letter avatar
- Notifications must be idempotent (check if already sent)
- Offline mode requires conflict resolution strategy (last-write-wins)
- Currency conversion rates should be cached (refresh daily)
- All monetary values stored in cents/smallest unit to avoid float issues
- PostgreSQL is used for relational data integrity and complex queries
- Use Payload's built-in migrations for schema changes (`pnpm payload migrate`)
