'use client'

import React, { useState } from 'react'
import { PlusCircle, Search, MoreVertical, MoreHorizontal, List, FolderOpen, Package } from 'lucide-react'
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
    <div className="p-8 lg:p-12">
      <div className="flex flex-col gap-8">
        {/* Page Heading */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-4xl font-black tracking-tight">Categories Management</h1>
          <button className="flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
            <PlusCircle className="w-5 h-5" />
            Create New Category
          </button>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Categories List */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {categories.map((category) => {
              const isSelected = category.id === selectedCategory
              const isAll = category.id === 'all'

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 min-h-[72px] justify-between rounded-xl transition-all text-left',
                    isSelected
                      ? 'bg-card border-2 border-primary'
                      : 'bg-card border border-border hover:bg-accent'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'flex items-center justify-center rounded-lg shrink-0 w-12 h-12',
                      isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      {isAll ? (
                        <List className="w-5 h-5" />
                      ) : (
                        <FolderOpen className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <p className="font-medium">{category.name}</p>
                      <p className="text-muted-foreground text-sm">{category.subscriptionCount} subscriptions</p>
                    </div>
                  </div>
                  {!isAll && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0"
                    >
                      <button className="text-muted-foreground hover:text-foreground flex w-8 h-8 items-center justify-center rounded-full hover:bg-accent transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Right Column: Subscriptions Grid */}
          <div className="lg:col-span-2 flex flex-col gap-6 bg-card p-6 rounded-xl border border-border">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <h2 className="text-2xl font-bold">
                Subscriptions in <span className="text-primary">&apos;{selectedCategoryData?.name}&apos;</span>
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search subscriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg h-11 pl-10 pr-4 focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-col gap-4 bg-background p-4 rounded-lg border border-border"
                >
                  <div className="flex justify-between items-start">
                    {sub.logo ? (
                      <img
                        src={sub.logo}
                        alt={sub.name}
                        className="w-12 h-12 rounded-lg object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-lg font-bold">
                        {sub.name.charAt(0)}
                      </div>
                    )}
                    <button className="text-muted-foreground hover:text-foreground flex w-7 h-7 items-center justify-center rounded-full hover:bg-accent transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col">
                    <p className="font-semibold">{sub.name}</p>
                    <p className="text-muted-foreground text-sm">Renews on {sub.renewalDate}</p>
                  </div>
                  <button className="w-full text-center bg-primary/20 text-primary text-sm font-bold py-2 rounded-md hover:bg-primary/30 transition-colors">
                    Reassign
                  </button>
                </div>
              ))}

              {/* Empty State */}
              {filteredSubscriptions.length === 0 && (
                <div className="md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center gap-4 bg-background p-8 rounded-lg border-2 border-dashed border-border h-64">
                  <Package className="w-12 h-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground text-center">This category is empty.</p>
                  <p className="text-muted-foreground/70 text-sm text-center">
                    Drag subscriptions here or use the &apos;Reassign&apos; button to add them.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
