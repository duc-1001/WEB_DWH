'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Plus, MoreVertical, BarChart3 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Dashboard {
  id: string
  name: string
  description: string
  createdAt: string
  chartsCount: number
}

export function DashboardList() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchDashboards = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/dashboards', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || 'Failed to load dashboards')
        }

        if (isMounted) {
          setDashboards(Array.isArray(payload.data) ? payload.data : [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboards')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchDashboards()
    return () => {
      isMounted = false
    }
  }, [])

  const sortedDashboards = [...dashboards].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    return a.name.localeCompare(b.name)
  })

  const deleteDashboard = async (id: string) => {
    const previous = dashboards
    setDashboards(dashboards.filter((d) => d.id !== id))

    try {
      const response = await fetch(`/api/dashboards/${id}`, { method: 'DELETE' })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Failed to delete dashboard')
      }
    } catch (_err) {
      setDashboards(previous)
      setError('Failed to delete dashboard')
    }
  }

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/new">
          <Card className="border-primary/50 bg-linear-to-br from-primary/10 to-primary/5 hover:border-primary hover:from-primary/15 hover:to-primary/10 transition-all cursor-pointer h-full">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  Create Dashboard
                </h3>
                <p className="text-sm text-muted-foreground">Build a new analysis dashboard</p>
              </div>
              <div className="bg-primary/20 p-3 rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/charts/new">
          <Card className="border-accent/50 bg-linear-to-br from-accent/10 to-accent/5 hover:border-accent hover:from-accent/15 hover:to-accent/10 transition-all cursor-pointer h-full">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-accent" />
                  Create Chart
                </h3>
                <p className="text-sm text-muted-foreground">Design a new visualization</p>
              </div>
              <div className="bg-accent/20 p-3 rounded-lg">
                <BarChart3 className="h-5 w-5 text-accent" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Dashboards Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Dashboards</h2>
            <p className="text-muted-foreground mt-1">Manage your analysis dashboards</p>
          </div>
          <Link href="/dashboard/new">
            <Button className="gap-2" size="lg">
              <Plus className="h-4 w-4" />
              New Dashboard
            </Button>
          </Link>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'date' ? 'default' : 'outline'}
            onClick={() => setSortBy('date')}
            size="sm"
          >
            Sort by Date
          </Button>
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            onClick={() => setSortBy('name')}
            size="sm"
          >
            Sort by Name
          </Button>
        </div>

        {isLoading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Loading dashboards...</p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive/40">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Dashboards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedDashboards.map((dashboard) => (
            <Card key={dashboard.id} className="group hover:border-primary transition-all hover:shadow-lg border-border/50 bg-card/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-foreground">{dashboard.name}</CardTitle>
                    <CardDescription className="mt-1">{dashboard.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteDashboard(dashboard.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <p>{dashboard.chartsCount} charts</p>
                  </div>
                  <Link href={`/dashboard/${dashboard.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-primary hover:text-primary"
                    >
                      Open
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!isLoading && sortedDashboards.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No dashboards yet</p>
              <Link href="/dashboard/new">
                <Button>Create your first dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
