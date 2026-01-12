# Change: Auto-Update Subscription Renewal Dates Using Billing Cycle

## Why

Subscriptions have `nextBillingDate` and `billingCycle` fields, but `nextBillingDate` never advances automatically after the date passes. Users see stale/past renewal dates, breaking the renewal tracking and notification system.

## What Changes

- Add a scheduled job that uses `billingCycle` (daily/weekly/monthly/yearly) and `frequency` to calculate and advance `nextBillingDate` when it's in the past
- Add a `beforeChange` hook to auto-calculate initial `nextBillingDate` from `startDate` + `billingCycle`

## Impact

- Affected specs: `subscriptions`
- Affected code:
  - `src/collections/Subscriptions.ts` - add beforeChange hook
  - `src/jobs/renewal-notifications.ts` - add updateRenewalDates function
