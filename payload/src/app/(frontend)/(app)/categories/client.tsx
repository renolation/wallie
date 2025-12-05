'use client'

import React, { useState } from 'react'
import { PlusCircle, Search, MoreHorizontal, List, FolderOpen, Package, DollarSign, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Category, Subscription } from '@/payload-types'

interface CategoriesClientProps {
  initialSubscriptions: Subscription[]
  initialCategories: Category[]
}

export default function CategoriesClient({ initialSubscriptions, initialCategories }: CategoriesClientProps) {
  const [subscriptions] = useState<Subscription[]>(initialSubscriptions)
  const [categories] = useState<Category[]>(initialCategories)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const selectedCategoryData = categories.find((c) => String(c.id) === selectedCategory)

  // Calculate total monthly cost
  const totalMonthlyCost = subscriptions.reduce((total, sub) => {
    let monthlyAmount = sub.amount
    if (sub.billingCycle === 'yearly') {
      monthlyAmount = sub.amount / 12
    } else if (sub.billingCycle === 'weekly') {
      monthlyAmount = sub.amount * 4
    }
    return total + monthlyAmount
  }, 0)

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase())

    if (selectedCategory === 'all') {
      return matchesSearch
    }

    const categoryId = typeof sub.category === 'object' ? sub.category?.id : sub.category
    return matchesSearch && String(categoryId) === selectedCategory
  })

  return (
    <div className="h-full flex flex-col p-6 lg:p-8 overflow-hidden">
      {/* Page Heading */}
      <div className="flex flex-wrap justify-between items-center gap-4 shrink-0 pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Categories Management</h1>
        <Button>
          <PlusCircle className="w-4 h-4" />
          Create New Category
        </Button>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Categories List */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Monthly Cost</p>
              <p className="text-lg font-bold">${totalMonthlyCost.toFixed(2)}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Active Subs</p>
              <p className="text-lg font-bold">{subscriptions.length}</p>
            </div>
          </div>

          {/* Categories List */}
          <div className="flex flex-col gap-2">
            {/* All Categories Option */}
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'flex items-center gap-3 px-4 py-3 justify-between rounded-lg transition-all text-left',
                selectedCategory === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border hover:bg-accent'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex items-center justify-center rounded-lg shrink-0 w-10 h-10',
                  selectedCategory === 'all' ? 'bg-white/20' : 'bg-muted'
                )}>
                  <List className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <p className="font-medium text-sm">All</p>
                  <p className={cn(
                    "text-xs",
                    selectedCategory === 'all' ? "text-white/70" : "text-muted-foreground"
                  )}>
                    {subscriptions.length} subscriptions
                  </p>
                </div>
              </div>
            </button>

            {categories.map((category) => {
              const isSelected = String(category.id) === selectedCategory
              const categorySubCount = subscriptions.filter((s) => {
                const catId = typeof s.category === 'object' ? s.category?.id : s.category
                return catId === category.id
              }).length

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(String(category.id))}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 justify-between rounded-lg transition-all text-left',
                    isSelected
                      ? 'bg-primary text-white'
                      : 'bg-card border border-border hover:bg-accent'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex items-center justify-center rounded-lg shrink-0 w-10 h-10',
                      isSelected ? 'bg-white/20' : 'bg-muted'
                    )}>
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <p className="font-medium text-sm">{category.name}</p>
                      <p className={cn(
                        "text-xs",
                        isSelected ? "text-white/70" : "text-muted-foreground"
                      )}>
                        {categorySubCount} subscriptions
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Column: Subscriptions Grid */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          <CardContent className="p-6 flex flex-col flex-1 min-h-0">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 shrink-0">
              <h2 className="text-lg font-semibold">
                Subscriptions in <span className="text-primary">&apos;{selectedCategory === 'all' ? 'All' : selectedCategoryData?.name}&apos;</span>
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search subscriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto flex-1 content-start">
              {filteredSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-col gap-3 bg-card p-4 rounded-lg border border-border"
                >
                  <div className="flex justify-between items-start">
                    {sub.logo ? (
                      <img
                        src={sub.logo}
                        alt={sub.name}
                        className="w-10 h-10 rounded-lg object-contain bg-muted p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-bold">
                        {sub.name.charAt(0)}
                      </div>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-col">
                    <p className="font-medium text-sm">{sub.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {sub.nextBillingDate
                        ? `Renews on ${new Date(sub.nextBillingDate).toLocaleDateString()}`
                        : 'No renewal date'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Reassign
                  </Button>
                </div>
              ))}

              {/* Empty State */}
              {filteredSubscriptions.length === 0 && (
                <div className="md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center gap-3 bg-card p-8 rounded-lg border-2 border-dashed border-border h-48">
                  <Package className="w-10 h-10 text-muted-foreground/50" />
                  <p className="text-muted-foreground text-sm text-center">This category is empty.</p>
                  <p className="text-muted-foreground/70 text-xs text-center">
                    Drag subscriptions here or use the &apos;Reassign&apos; button to add them.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
