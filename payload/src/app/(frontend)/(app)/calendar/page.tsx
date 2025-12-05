'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Filter, Calendar as CalendarIcon, TrendingUp, CheckCircle, Brush, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Payment {
  id: string
  name: string
  amount: number
  plan: string
  color: string
  icon: React.ReactNode
}

interface DayEvent {
  name: string
  color: string
}

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const MOCK_EVENTS: Record<number, DayEvent[]> = {
  3: [{ name: 'Netflix', color: 'bg-rose-500' }],
  10: [{ name: 'Spotify', color: 'bg-emerald-500' }],
  15: [{ name: 'Rent', color: 'bg-purple-500' }],
  24: [
    { name: 'Adobe CC', color: 'bg-orange-500' },
    { name: 'Hulu', color: 'bg-indigo-500' },
  ],
  28: [{ name: 'Gym', color: 'bg-cyan-500' }],
}

const MOCK_PAYMENTS: Payment[] = [
  { id: '1', name: 'Adobe Creative Cloud', amount: 54.99, plan: 'Monthly Plan • Auto-pay', color: 'bg-orange-500', icon: <Brush className="w-5 h-5" /> },
  { id: '2', name: 'Hulu (No Ads)', amount: 9.99, plan: 'Family Plan', color: 'bg-indigo-500', icon: <Film className="w-5 h-5" /> },
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function CalendarPage() {
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

  // Generate calendar days
  const calendarDays: { day: number; isCurrentMonth: boolean; events: DayEvent[] }[] = []

  // Previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, isCurrentMonth: false, events: [] })
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({ day, isCurrentMonth: true, events: MOCK_EVENTS[day] || [] })
  }

  // Next month days
  const remainingDays = 35 - calendarDays.length
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({ day, isCurrentMonth: false, events: [] })
  }

  const totalDueToday = MOCK_PAYMENTS.reduce((sum, p) => sum + p.amount, 0)

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
                              <div className={cn('size-2 rounded-full', event.color)} />
                              <span className="truncate text-[10px] font-medium text-muted-foreground hidden lg:block">
                                {event.name}
                              </span>
                            </div>
                          ))}
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
                <p className="text-sm font-medium text-white/80">Total Due Today</p>
                <h2 className="mt-1 text-3xl font-bold tracking-tight">${totalDueToday.toFixed(2)}</h2>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium backdrop-blur-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+12% from last month</span>
                </div>
              </div>

              {/* Payments List */}
              <div className="mt-8 flex flex-col gap-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Payments ({MOCK_PAYMENTS.length})
                </h4>

                {MOCK_PAYMENTS.map((payment) => (
                  <div
                    key={payment.id}
                    className="group flex items-center gap-4 rounded-xl border border-transparent bg-accent/50 p-3 transition-all hover:border-border hover:shadow-sm"
                  >
                    <div className={cn('flex size-12 items-center justify-center rounded-lg', payment.color, 'bg-opacity-20 text-current')}>
                      {payment.icon}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <p className="font-bold text-sm">{payment.name}</p>
                      <p className="text-xs text-muted-foreground">{payment.plan}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">${payment.amount.toFixed(2)}</p>
                      <button className="text-xs font-medium text-primary hover:text-primary/80">Details</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col gap-3">
                <Button className="w-full" variant="secondary">
                  <CheckCircle className="w-4 h-4" />
                  Mark All as Paid
                </Button>
                <Button className="w-full" variant="outline">
                  See Full Statement
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
