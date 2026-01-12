## ADDED Requirements

### Requirement: Calculate Next Billing Date from Billing Cycle

The system SHALL calculate `nextBillingDate` using the `billingCycle` field value:

| billingCycle | Advance By |
|--------------|------------|
| daily | +1 day * frequency |
| weekly | +7 days * frequency |
| monthly | +1 month * frequency |
| yearly | +1 year * frequency |

#### Scenario: Monthly billing cycle advances by 1 month
- **WHEN** subscription has `billingCycle: monthly`, `frequency: 1`, `nextBillingDate: 2025-01-01`
- **THEN** next billing date advances to `2025-02-01`

#### Scenario: Yearly billing cycle advances by 1 year
- **WHEN** subscription has `billingCycle: yearly`, `frequency: 1`, `nextBillingDate: 2024-06-15`
- **THEN** next billing date advances to `2025-06-15`

#### Scenario: Weekly with frequency 2 advances by 2 weeks
- **WHEN** subscription has `billingCycle: weekly`, `frequency: 2`, `nextBillingDate: 2025-01-01`
- **THEN** next billing date advances to `2025-01-15`

---

### Requirement: Auto-Advance Expired Renewal Dates

The system SHALL run a daily scheduled job to update subscriptions where `nextBillingDate` has passed.

For each subscription with `autoRenew: true` and `nextBillingDate < today`:
1. Read `billingCycle` and `frequency` values
2. Advance `nextBillingDate` by the billing cycle interval until it's in the future
3. Save the updated date

#### Scenario: Expired monthly subscription auto-advances
- **WHEN** today is `2025-01-06` and subscription has `nextBillingDate: 2025-01-01`, `billingCycle: monthly`, `autoRenew: true`
- **THEN** job updates `nextBillingDate` to `2025-02-01`

#### Scenario: Multiple periods passed advances to future date
- **WHEN** today is `2025-01-06` and subscription has `nextBillingDate: 2024-10-01`, `billingCycle: monthly`
- **THEN** job advances through Nov, Dec, Jan until `nextBillingDate: 2025-02-01`

#### Scenario: Auto-renew false skips update
- **WHEN** subscription has `autoRenew: false` and `nextBillingDate` is past
- **THEN** job does NOT update the date

---

### Requirement: Set Initial Next Billing Date on Create

The system SHALL auto-calculate `nextBillingDate` when creating a subscription if not provided.

Using `startDate` + `billingCycle`, advance until date is in the future.

#### Scenario: New subscription gets calculated nextBillingDate
- **WHEN** subscription created with `startDate: 2024-06-15`, `billingCycle: monthly`, no `nextBillingDate`
- **THEN** system calculates `nextBillingDate` as next future monthly date from that start
