'use client'

import React, { useState } from 'react'
import { PlusCircle, Search, MoreHorizontal, List, FolderOpen, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Subscription {
  id: string
  name: string
  logo?: string
  renewalDate: string
}

interface Category {
  id: string
  name: string
  subscriptionCount: number
  icon?: string
}

const mockCategories: Category[] = [
  { id: 'all', name: 'All Subscriptions', subscriptionCount: 34, icon: 'list' },
  { id: '1', name: 'Entertainment', subscriptionCount: 8 },
  { id: '2', name: 'Productivity', subscriptionCount: 12 },
  { id: '3', name: 'Utilities', subscriptionCount: 5 },
]

const mockSubscriptions: Subscription[] = [
  { id: '1', name: 'Spotify', logo: 'https://icons.duckduckgo.com/ip3/spotify.com.ico', renewalDate: '24 Dec 2024' },
  { id: '2', name: 'Netflix', logo: 'https://icons.duckduckgo.com/ip3/netflix.com.ico', renewalDate: '15 Jan 2025' },
  { id: '3', name: 'React Pro', renewalDate: '01 Feb 2025' },
]

export default function CategoriesPage() {
  const [categories] = useState<Category[]>(mockCategories)
  const [subscriptions] = useState<Subscription[]>(mockSubscriptions)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory)

  const filteredSubscriptions = subscriptions.filter((sub) =>
    sub.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col gap-6">
        {/* Page Heading */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Categories Management</h1>
          <Button>
            <PlusCircle className="w-4 h-4" />
            Create New Category
          </Button>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Categories List */}
          <div className="lg:col-span-1 flex flex-col gap-2">
            {categories.map((category) => {
              const isSelected = category.id === selectedCategory
              const isAll = category.id === 'all'

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
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
                      {isAll ? (
                        <List className="w-4 h-4" />
                      ) : (
                        <FolderOpen className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <p className="font-medium text-sm">{category.name}</p>
                      <p className={cn(
                        "text-xs",
                        isSelected ? "text-white/70" : "text-muted-foreground"
                      )}>
                        {category.subscriptionCount} subscriptions
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right Column: Subscriptions Grid */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-lg font-semibold">
                  Subscriptions in <span className="text-primary">&apos;{selectedCategoryData?.name}&apos;</span>
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

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                      <p className="text-muted-foreground text-xs">Renews on {sub.renewalDate}</p>
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
    </div>
  )
}
