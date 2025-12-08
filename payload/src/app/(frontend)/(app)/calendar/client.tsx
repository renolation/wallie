'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Filter, Calendar as CalendarIcon, TrendingUp, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SubscriptionEvent {
  id: number
  name: string
  amount: number
  currency: string
  billingCycle: string
  nextBillingDate: string
  logoUrl?: string
  categoryName?: string
  categoryColor?: string
}

interface CalendarData {
  subscriptions: SubscriptionEvent[]
  currency: string
}

interface CalendarClientProps {
  initialData: CalendarData
}

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function formatBillingCycle(cycle: string, frequency?: number): string {
  const freq = frequency && frequency > 1 ? `Every ${frequency} ` : ''
  switch (cycle) {
    case 'daily': return `${freq}Daily`
    case 'weekly': return `${freq}Weekly`
    case 'monthly': return `${freq}Monthly`
    case 'yearly': return `${freq}Yearly`
    default: return cycle
  }
}

export default function CalendarClient({ initialData }: CalendarClientProps) {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(today.getDate())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfMonth = getFirstDayOfMonth(year, month)
  const daysInPrevMonth = getDaysInMonth(year, month - 1)

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  const selectedDate = new Date(year, month, selectedDay)
  const selectedDateFormatted = selectedDate.toLocaleString('default', { month: 'long', day: 'numeric' })
  const selectedDayName = selectedDate.toLocaleString('default', { weekday: 'long' })

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDay(today.getDate())
  }

  const isToday = (day: number) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  // Group subscriptions by their billing day in the current month
  const eventsByDay: Record<number, { name: string; color: string; id: number }[]> = {}

  initialData.subscriptions.forEach((sub) => {
    if (!sub.nextBillingDate) return
    const billingDate = new Date(sub.nextBillingDate)

    // Check if the billing date is in the current displayed month
    if (billingDate.getMonth() === month && billingDate.getFullYear() === year) {
      const day = billingDate.getDate()
      if (!eventsByDay[day]) {
        eventsByDay[day] = []
      }
      eventsByDay[day].push({
        id: sub.id,
        name: sub.name,
        color: sub.categoryColor || '#6B7280',
      })
    }
  })

  // Generate calendar days
  const calendarDays: { day: number; isCurrentMonth: boolean; events: { name: string; color: string; id: number }[] }[] = []

  // Previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, isCurrentMonth: false, events: [] })
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({ day, isCurrentMonth: true, events: eventsByDay[day] || [] })
  }

  // Next month days
  const remainingDays = 35 - calendarDays.length
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({ day, isCurrentMonth: false, events: [] })
  }

  // Get payments for selected day
  const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
  const paymentsForSelectedDay = initialData.subscriptions.filter((sub) => {
    if (!sub.nextBillingDate) return false
    return sub.nextBillingDate.startsWith(selectedDateStr)
  })

  const totalDueToday = paymentsForSelectedDay.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Calendar</h1>
          <p className="text-sm text-muted-foreground">Manage your upcoming recurring payments.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Add Subscription
          </Button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left Column: Calendar */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Calendar Controls */}
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold">{monthName}</h3>
                <div className="flex items-center rounded-lg border border-border">
                  <button
                    onClick={prevMonth}
                    className="flex size-8 items-center justify-center text-muted-foreground hover:bg-accent rounded-l-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="h-4 w-px bg-border" />
                  <button
                    onClick={nextMonth}
                    className="flex size-8 items-center justify-center text-muted-foreground hover:bg-accent rounded-r-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button onClick={goToToday} className="text-sm font-medium text-primary hover:underline">
                Return to Today
              </button>
            </CardContent>
          </Card>

          {/* Calendar Grid */}
          <Card className="flex-1">
            <CardContent className="p-4 lg:p-6">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 mb-4">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 lg:gap-2">
                {calendarDays.map((dayData, index) => {
                  const isSelected = dayData.isCurrentMonth && dayData.day === selectedDay
                  const hasEvents = dayData.events.length > 0

                  return (
                    <button
                      key={index}
                      onClick={() => dayData.isCurrentMonth && setSelectedDay(dayData.day)}
                      disabled={!dayData.isCurrentMonth}
                      className={cn(
                        'relative flex flex-col items-start justify-start rounded-xl p-2 min-h-[60px] lg:min-h-[80px] transition-all text-left',
                        !dayData.isCurrentMonth && 'opacity-30 cursor-default',
                        dayData.isCurrentMonth && !isSelected && 'hover:bg-accent border border-transparent',
                        dayData.isCurrentMonth && hasEvents && !isSelected && 'border-border bg-card',
                        isSelected && 'border-2 border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,173,181,0.3)]'
                      )}
                    >
                      <span
                        className={cn(
                          'text-sm font-medium',
                          !dayData.isCurrentMonth && 'text-muted-foreground',
                          isSelected && 'flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold',
                          isToday(dayData.day) && dayData.isCurrentMonth && !isSelected && 'text-primary font-bold'
                        )}
                      >
                        {dayData.day}
                      </span>

                      {/* Events */}
                      {dayData.events.length > 0 && (
                        <div className="mt-auto flex w-full flex-col gap-1">
                          {dayData.events.slice(0, 2).map((event, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <div
                                className="size-2 rounded-full"
                                style={{ backgroundColor: event.color }}
                              />
                              <span className="truncate text-[10px] font-medium text-muted-foreground hidden lg:block">
                                {event.name}
                              </span>
                            </div>
                          ))}
                          {dayData.events.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{dayData.events.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Details Panel */}
        <div className="w-full xl:w-96">
          <Card className="h-full">
            <CardContent className="p-6">
              {/* Header Date */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-lg font-bold">{selectedDateFormatted}</h3>
                  <p className="text-sm font-medium text-muted-foreground">{selectedDayName}, {year}</p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CalendarIcon className="w-5 h-5" />
                </div>
              </div>

              {/* Stats Card */}
              <div className="mt-6 rounded-xl bg-gradient-to-br from-primary to-[#008c94] p-5 text-white shadow-lg">
                <p className="text-sm font-medium text-white/80">Total Due This Day</p>
                <h2 className="mt-1 text-3xl font-bold tracking-tight">
                  ${totalDueToday.toFixed(2)}
                </h2>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium backdrop-blur-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>{paymentsForSelectedDay.length} payment{paymentsForSelectedDay.length !== 1 ? 's' : ''} scheduled</span>
                </div>
              </div>

              {/* Payments List */}
              <div className="mt-8 flex flex-col gap-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Payments ({paymentsForSelectedDay.length})
                </h4>

                {paymentsForSelectedDay.length > 0 ? (
                  paymentsForSelectedDay.map((payment) => (
                    <div
                      key={payment.id}
                      className="group flex items-center gap-4 rounded-xl border border-transparent bg-accent/50 p-3 transition-all hover:border-border hover:shadow-sm"
                    >
                      <div
                        className="flex size-12 items-center justify-center rounded-lg text-white font-bold text-lg"
                        style={{ backgroundColor: payment.categoryColor || '#6B7280' }}
                      >
                        {payment.logoUrl ? (
                          <img
                            src={payment.logoUrl}
                            alt={payment.name}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          payment.name.charAt(0)
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <p className="font-bold text-sm">{payment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBillingCycle(payment.billingCycle)} • {payment.categoryName || 'Uncategorized'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">${payment.amount.toFixed(2)}</p>
                        <button className="text-xs font-medium text-primary hover:text-primary/80">Details</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No payments scheduled for this day</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {paymentsForSelectedDay.length > 0 && (
                <div className="mt-8 flex flex-col gap-3">
                  <Button className="w-full" variant="secondary">
                    <CheckCircle className="w-4 h-4" />
                    Mark All as Paid
                  </Button>
                  <Button className="w-full" variant="outline">
                    See Full Statement
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
