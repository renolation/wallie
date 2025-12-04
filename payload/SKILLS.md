# Subscription Tracker - Development Skills

Reusable workflows, patterns, and templates for common development tasks.

---

## Skill: Create Payload Collection

### When to Use
When adding a new data model/table to the backend.

### Checklist
- [ ] Define collection file in `/payload/src/collections/`
- [ ] Add TypeScript interface for the document type
- [ ] Configure access control (who can CRUD)
- [ ] Add to `payload.config.ts` collections array
- [ ] Create any necessary hooks
- [ ] Add indexes for frequently queried fields (PostgreSQL handles this automatically)

### Template

```typescript
// /payload/src/collections/[collection-name].ts

import type { CollectionConfig } from 'payload'

// Type definition (optional but recommended)
export interface YourType {
  id: string
  // ... fields
  createdAt: string
  updatedAt: string
}

export const YourCollection: CollectionConfig = {
  slug: 'your-collection', // URL-friendly, plural
  
  admin: {
    useAsTitle: 'name', // Field to display in admin UI
    group: 'Core', // Admin sidebar grouping
    defaultColumns: ['name', 'createdAt'], // List view columns
  },
  
  access: {
    // Restrict to authenticated users
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => {
      if (!user) return false
      // Users can only read their own documents
      return { user: { equals: user.id } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      return { user: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return { user: { equals: user.id } }
    },
  },
  
  hooks: {
    beforeChange: [],
    afterChange: [],
  },
  
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      // Auto-populate with current user
      defaultValue: ({ user }) => user?.id,
      admin: {
        condition: () => false, // Hide in admin
      },
    },
    // Add more fields...
  ],
  
  timestamps: true, // Adds createdAt, updatedAt
}
```

### Registration

```typescript
// /payload/src/payload.config.ts
import { YourCollection } from './collections/your-collection'

export default buildConfig({
  collections: [
    Users,
    YourCollection, // Add here
    // ...
  ],
})
```

---

## Skill: Create Custom Endpoint

### When to Use
When you need API functionality beyond standard CRUD operations.

### Checklist
- [ ] Create endpoint file in `/payload/src/endpoints/`
- [ ] Define request/response types
- [ ] Add input validation (Zod)
- [ ] Register in payload.config.ts
- [ ] Add appropriate authentication check

### Template

```typescript
// /payload/src/endpoints/dashboard-summary.ts

import type { PayloadHandler } from 'payload'
import { z } from 'zod'

// Input validation schema
const QuerySchema = z.object({
  householdId: z.string().optional(),
})

export const dashboardSummary: PayloadHandler = async (req, res) => {
  try {
    // 1. Authentication check
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // 2. Validate input
    const query = QuerySchema.parse(req.query)

    // 3. Business logic
    const subscriptions = await req.payload.find({
      collection: 'subscriptions',
      where: {
        user: { equals: req.user.id },
        ...(query.householdId && { household: { equals: query.householdId } }),
      },
    })

    const totalMonthly = subscriptions.docs.reduce((sum, sub) => {
      // Normalize to monthly
      const monthly = sub.billingCycle === 'yearly' 
        ? sub.price / 12 
        : sub.billingCycle === 'weekly'
        ? sub.price * 4
        : sub.price
      return sum + monthly
    }, 0)

    // 4. Return response
    return res.json({
      totalSubscriptions: subscriptions.totalDocs,
      totalMonthlySpend: totalMonthly,
      upcomingPayments: subscriptions.docs
        .filter(s => daysUntil(s.nextPaymentDate) <= 7)
        .length,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors })
    }
    console.error('Dashboard summary error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

### Registration

```typescript
// /payload/src/payload.config.ts
import { dashboardSummary } from './endpoints/dashboard-summary'

export default buildConfig({
  endpoints: [
    {
      path: '/dashboard/summary',
      method: 'get',
      handler: dashboardSummary,
    },
  ],
})
```

---

## Skill: Create Flutter Feature

### When to Use
When adding a new screen/feature to the mobile app.

### Checklist
- [ ] Create model in `/lib/data/models/`
- [ ] Create repository in `/lib/data/repositories/`
- [ ] Create Riverpod providers
- [ ] Create screen in `/lib/presentation/screens/`
- [ ] Create widgets in `/lib/presentation/widgets/`
- [ ] Add route to navigation

### Template Structure

```
lib/
├── data/
│   ├── models/
│   │   └── subscription_model.dart      # Freezed model
│   └── repositories/
│       └── subscription_repository.dart # API calls
├── presentation/
│   ├── providers/
│   │   └── subscriptions_provider.dart  # Riverpod state
│   ├── screens/
│   │   └── subscriptions_screen.dart    # Main screen
│   └── widgets/
│       └── subscription_card.dart       # Reusable widget
```

### Model Template

```dart
// /lib/data/models/subscription_model.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'subscription_model.freezed.dart';
part 'subscription_model.g.dart';

enum BillingCycle { weekly, monthly, yearly }

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
    @Default(1.0) double splitPercentage,
  }) = _Subscription;

  factory Subscription.fromJson(Map<String, dynamic> json) =>
      _$SubscriptionFromJson(json);
}

// Computed properties via extension
extension SubscriptionX on Subscription {
  double get myCost => price * splitPercentage;
  
  int get daysRemaining => 
      nextPaymentDate.difference(DateTime.now()).inDays;
  
  bool get isDueSoon => daysRemaining <= 3;
}
```

### Repository Template

```dart
// /lib/data/repositories/subscription_repository.dart

import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'subscription_repository.g.dart';

@riverpod
SubscriptionRepository subscriptionRepository(SubscriptionRepositoryRef ref) {
  return SubscriptionRepository(ref.read(dioProvider));
}

class SubscriptionRepository {
  final Dio _dio;
  
  SubscriptionRepository(this._dio);

  Future<List<Subscription>> fetchAll({String? householdId}) async {
    final response = await _dio.get('/api/subscriptions', queryParameters: {
      if (householdId != null) 'where[household][equals]': householdId,
    });
    
    final docs = response.data['docs'] as List;
    return docs.map((json) => Subscription.fromJson(json)).toList();
  }

  Future<Subscription> create(Subscription subscription) async {
    final response = await _dio.post(
      '/api/subscriptions',
      data: subscription.toJson(),
    );
    return Subscription.fromJson(response.data['doc']);
  }

  Future<Subscription> update(String id, Subscription subscription) async {
    final response = await _dio.patch(
      '/api/subscriptions/$id',
      data: subscription.toJson(),
    );
    return Subscription.fromJson(response.data['doc']);
  }

  Future<void> delete(String id) async {
    await _dio.delete('/api/subscriptions/$id');
  }
}
```

### Provider Template

```dart
// /lib/presentation/providers/subscriptions_provider.dart

import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'subscriptions_provider.g.dart';

@riverpod
class SubscriptionsController extends _$SubscriptionsController {
  @override
  Future<List<Subscription>> build() async {
    return _fetchSubscriptions();
  }

  Future<List<Subscription>> _fetchSubscriptions() {
    final repo = ref.read(subscriptionRepositoryProvider);
    final householdId = ref.watch(selectedHouseholdProvider);
    return repo.fetchAll(householdId: householdId);
  }

  Future<void> add(Subscription subscription) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await ref.read(subscriptionRepositoryProvider).create(subscription);
      return _fetchSubscriptions();
    });
  }

  Future<void> remove(String id) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await ref.read(subscriptionRepositoryProvider).delete(id);
      return _fetchSubscriptions();
    });
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
  }
}
```

### Screen Template

```dart
// /lib/presentation/screens/subscriptions_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SubscriptionsScreen extends ConsumerWidget {
  const SubscriptionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subscriptionsAsync = ref.watch(subscriptionsControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Subscriptions'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showAddDialog(context),
          ),
        ],
      ),
      body: subscriptionsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (subscriptions) => RefreshIndicator(
          onRefresh: () => ref.read(subscriptionsControllerProvider.notifier).refresh(),
          child: ListView.builder(
            itemCount: subscriptions.length,
            itemBuilder: (context, index) {
              return SubscriptionCard(subscription: subscriptions[index]);
            },
          ),
        ),
      ),
    );
  }

  void _showAddDialog(BuildContext context) {
    // Show add subscription dialog
  }
}
```

---

## Skill: Implement Offline Support

### When to Use
When a feature needs to work without internet connectivity.

### Architecture
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   UI Layer   │────▶│  Repository  │────▶│   Remote     │
└──────────────┘     │   (Cache)    │     │   (API)      │
                     │              │     └──────────────┘
                     │      │       │
                     │      ▼       │
                     │ ┌──────────┐ │
                     │ │  Local   │ │
                     │ │  (Hive)  │ │
                     │ └──────────┘ │
                     └──────────────┘
```

### Implementation

```dart
// /lib/data/repositories/offline_subscription_repository.dart

class OfflineSubscriptionRepository implements SubscriptionRepository {
  final Dio _dio;
  final Box<Subscription> _cache;
  final Box<PendingOperation> _pendingOps;
  final ConnectivityService _connectivity;

  @override
  Future<List<Subscription>> fetchAll({String? householdId}) async {
    // Try remote first
    if (await _connectivity.isOnline) {
      try {
        final remote = await _fetchRemote(householdId);
        // Update cache
        await _cache.clear();
        for (final sub in remote) {
          await _cache.put(sub.id, sub);
        }
        return remote;
      } catch (e) {
        // Fall through to cache
      }
    }
    
    // Return cached data
    return _cache.values.toList();
  }

  @override
  Future<Subscription> create(Subscription subscription) async {
    // Optimistic local update
    final tempId = 'temp_${DateTime.now().millisecondsSinceEpoch}';
    final local = subscription.copyWith(id: tempId);
    await _cache.put(tempId, local);

    if (await _connectivity.isOnline) {
      try {
        final remote = await _createRemote(subscription);
        await _cache.delete(tempId);
        await _cache.put(remote.id, remote);
        return remote;
      } catch (e) {
        // Queue for later sync
        await _queueOperation(PendingOperation.create(subscription));
        return local;
      }
    } else {
      await _queueOperation(PendingOperation.create(subscription));
      return local;
    }
  }

  Future<void> syncPendingOperations() async {
    if (!await _connectivity.isOnline) return;

    final pending = _pendingOps.values.toList();
    for (final op in pending) {
      try {
        switch (op.type) {
          case OperationType.create:
            await _createRemote(op.subscription!);
            break;
          case OperationType.update:
            await _updateRemote(op.id!, op.subscription!);
            break;
          case OperationType.delete:
            await _deleteRemote(op.id!);
            break;
        }
        await _pendingOps.delete(op.key);
      } catch (e) {
        // Keep in queue, will retry next sync
      }
    }
  }
}
```

---

## Skill: Add Push Notifications

### When to Use
When implementing renewal alerts or other push notifications.

### Backend (Scheduling)

```typescript
// /payload/src/jobs/notification-scheduler.ts

import cron from 'node-cron'
import type { Payload } from 'payload'

export function startNotificationScheduler(payload: Payload) {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(dayAfter.getDate() + 1)

    // Find subscriptions due tomorrow
    const dueSubscriptions = await payload.find({
      collection: 'subscriptions',
      where: {
        nextPaymentDate: {
          greater_than_equal: tomorrow,
          less_than: dayAfter,
        },
        // Exclude already notified
        notifiedForCurrentCycle: { equals: false },
      },
      depth: 1, // Include user data
    })

    for (const sub of dueSubscriptions.docs) {
      await payload.create({
        collection: 'notifications',
        data: {
          user: sub.user.id,
          type: 'renewal_reminder',
          title: `${sub.name} renews tomorrow`,
          body: `Your ${sub.name} subscription ($${sub.price}) will renew tomorrow.`,
          subscription: sub.id,
          status: 'pending',
        },
      })

      // Mark as notified
      await payload.update({
        collection: 'subscriptions',
        id: sub.id,
        data: { notifiedForCurrentCycle: true },
      })
    }
  })
}
```

### Backend (Sending)

```typescript
// /payload/src/jobs/notification-sender.ts

import admin from 'firebase-admin'

export function startNotificationSender(payload: Payload) {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    const pending = await payload.find({
      collection: 'notifications',
      where: { status: { equals: 'pending' } },
      limit: 100,
      depth: 1,
    })

    for (const notif of pending.docs) {
      try {
        const tokens = notif.user.deviceTokens || []
        
        if (tokens.length > 0) {
          await admin.messaging().sendEachForMulticast({
            tokens,
            notification: {
              title: notif.title,
              body: notif.body,
            },
            data: {
              type: notif.type,
              subscriptionId: notif.subscription?.id || '',
            },
          })
        }

        await payload.update({
          collection: 'notifications',
          id: notif.id,
          data: { status: 'sent', sentAt: new Date() },
        })
      } catch (error) {
        await payload.update({
          collection: 'notifications',
          id: notif.id,
          data: { status: 'failed', error: error.message },
        })
      }
    }
  })
}
```

### Mobile (Receiving)

```dart
// /lib/core/services/notification_service.dart

class NotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  Future<void> initialize() async {
    // Request permission
    await _messaging.requestPermission();

    // Get token and save to backend
    final token = await _messaging.getToken();
    if (token != null) {
      await _saveDeviceToken(token);
    }

    // Listen for token refresh
    _messaging.onTokenRefresh.listen(_saveDeviceToken);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background/terminated tap
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
  }

  void _handleForegroundMessage(RemoteMessage message) {
    // Show local notification
    FlutterLocalNotificationsPlugin().show(
      message.hashCode,
      message.notification?.title,
      message.notification?.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'renewals',
          'Renewal Reminders',
          importance: Importance.high,
        ),
      ),
    );
  }

  void _handleNotificationTap(RemoteMessage message) {
    final subscriptionId = message.data['subscriptionId'];
    if (subscriptionId != null) {
      // Navigate to subscription detail
      navigatorKey.currentState?.pushNamed(
        '/subscription/$subscriptionId',
      );
    }
  }
}
```

---

## Skill: OCR Screenshot Import

### When to Use
Implementing the smart scanning feature for subscription screenshots.

### Backend Endpoint

```typescript
// /payload/src/endpoints/import-screenshot.ts

import OpenAI from 'openai'
import type { PayloadHandler } from 'payload'

const openai = new OpenAI()

const PARSING_PROMPT = `
Analyze this screenshot of a phone's subscription management screen.
Extract all visible subscriptions and return them as JSON array.

For each subscription, extract:
- name: The service name (e.g., "Netflix", "Spotify")
- price: The price as a number (e.g., 15.99)
- billingCycle: One of "weekly", "monthly", "yearly"
- nextPaymentDate: If visible, in ISO format. Otherwise null.

Return ONLY valid JSON array, no other text.
Example: [{"name": "Netflix", "price": 15.99, "billingCycle": "monthly", "nextPaymentDate": "2024-02-15"}]
`

export const importScreenshot: PayloadHandler = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { image } = req.body // Base64 encoded image

  if (!image) {
    return res.status(400).json({ error: 'Image required' })
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PARSING_PROMPT },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${image}` },
            },
          ],
        },
      ],
      max_tokens: 1000,
    })

    const content = response.choices[0]?.message?.content || '[]'
    const subscriptions = JSON.parse(content)

    // Create subscriptions in database
    const created = []
    for (const sub of subscriptions) {
      const doc = await req.payload.create({
        collection: 'subscriptions',
        data: {
          ...sub,
          user: req.user.id,
          source: 'screenshot_import',
        },
      })
      created.push(doc)
    }

    return res.json({
      imported: created.length,
      subscriptions: created,
    })
  } catch (error) {
    console.error('Screenshot import error:', error)
    return res.status(500).json({ error: 'Failed to process screenshot' })
  }
}
```

### Mobile UI

```dart
// /lib/presentation/screens/import_screen.dart

class ImportScreen extends ConsumerWidget {
  Future<void> _importScreenshot(BuildContext context, WidgetRef ref) async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery);
    
    if (image == null) return;

    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final bytes = await image.readAsBytes();
      final base64 = base64Encode(bytes);
      
      final result = await ref.read(importRepositoryProvider)
          .importScreenshot(base64);
      
      Navigator.pop(context); // Close loading
      
      // Show success
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Imported ${result.imported} subscriptions')),
      );
      
      // Refresh list
      ref.invalidate(subscriptionsControllerProvider);
    } catch (e) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Import failed: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Import Subscriptions')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.document_scanner, size: 80, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 24),
            const Text('Import from Screenshot'),
            const SizedBox(height: 8),
            Text(
              'Take a screenshot of your phone\'s\nsubscription settings page',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => _importScreenshot(context, ref),
              icon: const Icon(Icons.photo_library),
              label: const Text('Select Screenshot'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## Skill: Split-Bill Settlement Calculation

### When to Use
Calculating "who owes who" in household shared subscriptions.

### Algorithm

```typescript
// /payload/src/services/settlement.service.ts

interface Settlement {
  from: string      // User ID who owes
  to: string        // User ID who is owed
  amount: number    // Amount owed
}

export async function calculateSettlements(
  payload: Payload,
  householdId: string
): Promise<Settlement[]> {
  // 1. Get all household subscriptions with split assignments
  const subscriptions = await payload.find({
    collection: 'subscriptions',
    where: { household: { equals: householdId } },
    depth: 2,
  })

  // 2. Build balance sheet: who paid vs who owes
  const balances: Record<string, number> = {} // userId -> net balance

  for (const sub of subscriptions.docs) {
    const paidBy = sub.paidBy // User who actually pays the bill
    const splits = sub.splits || [] // Array of { user, percentage }

    // Person who paid is owed the full amount
    balances[paidBy] = (balances[paidBy] || 0) + sub.price

    // Each person in split owes their share
    for (const split of splits) {
      const owes = sub.price * (split.percentage / 100)
      balances[split.user] = (balances[split.user] || 0) - owes
    }
  }

  // 3. Simplify debts using the "min-cash-flow" algorithm
  const settlements: Settlement[] = []
  const users = Object.keys(balances)

  while (true) {
    // Find max creditor and max debtor
    let maxCreditor = users[0]
    let maxDebtor = users[0]

    for (const user of users) {
      if (balances[user] > balances[maxCreditor]) maxCreditor = user
      if (balances[user] < balances[maxDebtor]) maxDebtor = user
    }

    // If everyone is settled (within $0.01), we're done
    if (Math.abs(balances[maxCreditor]) < 0.01) break

    // Transfer the minimum of what debtor owes and creditor is owed
    const amount = Math.min(
      Math.abs(balances[maxDebtor]),
      balances[maxCreditor]
    )

    settlements.push({
      from: maxDebtor,
      to: maxCreditor,
      amount: Math.round(amount * 100) / 100, // Round to cents
    })

    balances[maxCreditor] -= amount
    balances[maxDebtor] += amount
  }

  return settlements
}
```

### Endpoint

```typescript
// /payload/src/endpoints/household-settlements.ts

export const householdSettlements: PayloadHandler = async (req, res) => {
  const { id: householdId } = req.params

  // Verify user is member of household
  const membership = await req.payload.find({
    collection: 'household-members',
    where: {
      household: { equals: householdId },
      user: { equals: req.user.id },
    },
  })

  if (membership.totalDocs === 0) {
    return res.status(403).json({ error: 'Not a member of this household' })
  }

  const settlements = await calculateSettlements(req.payload, householdId)

  // Enrich with user names
  const enriched = await Promise.all(
    settlements.map(async (s) => {
      const [from, to] = await Promise.all([
        req.payload.findByID({ collection: 'users', id: s.from }),
        req.payload.findByID({ collection: 'users', id: s.to }),
      ])
      return {
        ...s,
        fromName: from.name,
        toName: to.name,
      }
    })
  )

  return res.json({ settlements: enriched })
}
```

---

## Quick Reference: Common Patterns

### Payload: Field Types Cheat Sheet
```typescript
{ name: 'x', type: 'text' }                    // String
{ name: 'x', type: 'number' }                  // Number
{ name: 'x', type: 'date' }                    // Date picker
{ name: 'x', type: 'select', options: [...] } // Enum
{ name: 'x', type: 'relationship', relationTo: 'y' } // Foreign key
{ name: 'x', type: 'array', fields: [...] }   // Embedded array
{ name: 'x', type: 'upload', relationTo: 'media' } // File upload
```

### Flutter: Riverpod Cheat Sheet
```dart
ref.watch(provider)          // Subscribe to changes
ref.read(provider)           // One-time read
ref.listen(provider, ...)    // Listen without rebuilding
ref.invalidate(provider)     // Force refresh
```

### Flutter: Common Widgets
```dart
AsyncValue.when()            // Handle loading/error/data states
RefreshIndicator             // Pull-to-refresh
Dismissible                  // Swipe-to-delete
Hero                         // Shared element transitions
```
