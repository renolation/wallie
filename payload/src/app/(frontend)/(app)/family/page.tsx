'use client'

import React, { useState } from 'react'
import { UserPlus, Search, MoreVertical, Plus, Film, Music, Cloud } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Member {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
  avatar?: string
  subscriptions: { id: string; name: string; icon: string }[]
}

interface FamilyStats {
  totalMonthlyCost: number
  costChange: number
  costPerMember: number
  memberCostChange: number
}

const mockMembers: Member[] = [
  {
    id: '1',
    name: 'Alex Doe',
    email: 'alex@example.com',
    role: 'admin',
    subscriptions: [
      { id: '1', name: 'Netflix', icon: 'movie' },
      { id: '2', name: 'Spotify', icon: 'music' },
      { id: '3', name: 'Cloud Storage', icon: 'cloud' },
    ],
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'member',
    subscriptions: [
      { id: '1', name: 'Netflix', icon: 'movie' },
      { id: '2', name: 'Spotify', icon: 'music' },
    ],
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'member',
    subscriptions: [
      { id: '3', name: 'Cloud Storage', icon: 'cloud' },
    ],
  },
]

const mockStats: FamilyStats = {
  totalMonthlyCost: 89.99,
  costChange: 5,
  costPerMember: 22.50,
  memberCostChange: -2,
}

function getIconComponent(icon: string) {
  switch (icon) {
    case 'movie': return Film
    case 'music': return Music
    case 'cloud': return Cloud
    default: return Film
  }
}

export default function FamilyPage() {
  const [members] = useState<Member[]>(mockMembers)
  const [stats] = useState<FamilyStats>(mockStats)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Stats */}
      <aside className="w-80 flex-shrink-0 border-r border-border p-6 hidden lg:flex flex-col gap-6">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg h-12 px-4 bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
          <UserPlus className="w-5 h-5" />
          Invite New Member
        </button>

        {/* Stats */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-xl p-6 border border-border bg-card">
            <p className="text-base font-medium text-muted-foreground">Total Monthly Cost</p>
            <p className="text-2xl font-bold tracking-tight">${stats.totalMonthlyCost.toFixed(2)}</p>
            <p className={cn(
              "text-sm font-medium",
              stats.costChange >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {stats.costChange >= 0 ? '+' : ''}{stats.costChange}% from last month
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl p-6 border border-border bg-card">
            <p className="text-base font-medium text-muted-foreground">Cost Per Member</p>
            <p className="text-2xl font-bold tracking-tight">${stats.costPerMember.toFixed(2)}</p>
            <p className={cn(
              "text-sm font-medium",
              stats.memberCostChange >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {stats.memberCostChange >= 0 ? '+' : ''}{stats.memberCostChange}% from last month
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10">
        <div className="flex flex-col gap-8">
          {/* Page Header & Search */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-4xl font-black tracking-tight">Family Management</h1>
            <div className="w-full max-w-xs">
              <div className="flex w-full items-center rounded-lg bg-muted h-12">
                <div className="flex items-center justify-center pl-4 text-muted-foreground">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Find a family member..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none h-full px-4 text-base focus:outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>

          {/* Mobile Stats */}
          <div className="flex lg:hidden gap-4">
            <button className="flex items-center justify-center gap-2 rounded-lg h-12 px-4 bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
              <UserPlus className="w-5 h-5" />
              Invite
            </button>
            <div className="flex-1 flex flex-col justify-center rounded-xl px-4 py-2 border border-border bg-card">
              <p className="text-xs text-muted-foreground">Monthly Cost</p>
              <p className="text-lg font-bold">${stats.totalMonthlyCost.toFixed(2)}</p>
            </div>
          </div>

          {/* Member Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 hover:bg-accent/50 hover:border-border/80 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{member.name}</h3>
                      <p className="text-muted-foreground text-sm capitalize">{member.role}</p>
                    </div>
                  </div>
                  <button className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Subscriptions</p>
                  <div className="flex flex-wrap gap-2">
                    {member.subscriptions.map((sub) => {
                      const IconComponent = getIconComponent(sub.icon)
                      return (
                        <div
                          key={sub.id}
                          className="flex items-center gap-2 rounded bg-primary/20 px-2 py-1 text-xs font-medium text-primary"
                        >
                          <IconComponent className="w-4 h-4" />
                          <span>{sub.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Member Card */}
            <div className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-transparent p-6 text-center text-muted-foreground hover:border-primary hover:bg-primary/10 hover:text-primary transition-all">
              <div className="flex w-12 h-12 items-center justify-center rounded-full bg-muted">
                <Plus className="w-6 h-6" />
              </div>
              <p className="text-lg font-bold">Add New Member</p>
              <p className="text-sm">Invite someone to join your family group.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
