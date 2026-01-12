## 1. Implementation

- [x] 1.1 Create `calculateNextBillingDate(currentDate, billingCycle, frequency)` utility
- [x] 1.2 Add `beforeChange` hook to set initial `nextBillingDate` from `startDate` + `billingCycle`
- [x] 1.3 Create `updateExpiredRenewalDates` job that advances dates using `billingCycle`
- [x] 1.4 Register the scheduled job (daily cron at 00:00 via node-cron)

## 2. Verification

- [x] 2.1 Build passes
- [ ] 2.2 Test frequency multiplier (e.g., every 3 months)
- [ ] 2.3 Verify renewal notifications work with updated dates
