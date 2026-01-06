export type BillingCycle = 'daily' | 'weekly' | 'monthly' | 'yearly'

/**
 * Calculate the next billing date based on billing cycle and frequency.
 * Advances the date until it's in the future.
 *
 * @param fromDate - The starting date to calculate from
 * @param billingCycle - The billing cycle type
 * @param frequency - How many cycles between billings (default: 1)
 * @returns The next billing date in the future
 */
export function calculateNextBillingDate(
  fromDate: Date,
  billingCycle: BillingCycle,
  frequency: number = 1,
): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  let nextDate = new Date(fromDate)
  nextDate.setHours(0, 0, 0, 0)

  // Advance until the date is in the future
  while (nextDate <= now) {
    nextDate = advanceByBillingCycle(nextDate, billingCycle, frequency)
  }

  return nextDate
}

/**
 * Advance a date by one billing cycle interval
 */
export function advanceByBillingCycle(
  date: Date,
  billingCycle: BillingCycle,
  frequency: number = 1,
): Date {
  const result = new Date(date)

  switch (billingCycle) {
    case 'daily':
      result.setDate(result.getDate() + (1 * frequency))
      break
    case 'weekly':
      result.setDate(result.getDate() + (7 * frequency))
      break
    case 'monthly':
      result.setMonth(result.getMonth() + (1 * frequency))
      break
    case 'yearly':
      result.setFullYear(result.getFullYear() + (1 * frequency))
      break
  }

  return result
}
