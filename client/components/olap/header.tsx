'use client'

import { BarChart3, Home, Settings, Search, Bell, Database } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useState } from 'react'

interface SearchItem {
  id: string
  type: 'dashboard' | 'chart'
  name: string
  description: string
  url: string
}

export function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 2) {
      setResults([])
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      try {
        setIsSearching(true)
        const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
          cache: 'no-store',
        })
        const payload = await response.json()
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || 'Search failed')
        }
        setResults(Array.isArray(payload.data) ? payload.data : [])
      } catch (_err) {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [searchQuery])

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3 gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">OLAP Analytics</h1>
            <p className="text-xs text-muted-foreground">Professional Data Platform</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dashboards, charts..."
              className="pl-9 bg-input/50 border-border/50 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {(searchQuery.trim().length >= 2 || isSearching) && (
              <div className="absolute top-11 left-0 right-0 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {isSearching ? (
                  <p className="text-sm text-muted-foreground px-3 py-2">Searching...</p>
                ) : results.length > 0 ? (
                  <div className="py-1">
                    {results.map((item) => (
                      <Link
                        key={`${item.type}-${item.id}`}
                        href={item.url}
                        className="block px-3 py-2 hover:bg-accent transition-colors"
                        onClick={() => {
                          setSearchQuery('')
                          setResults([])
                        }}
                      >
                        <p className="text-sm text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {item.type.toUpperCase()} • {item.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground px-3 py-2">No results</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden sm:flex items-center gap-1">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-foreground hover:bg-accent">
              <Home className="h-4 w-4" />
              <span className="hidden md:inline">Home</span>
            </Button>
          </Link>
          <Link href="/dashboard/new">
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent">
              New Dashboard
            </Button>
          </Link>
          <Link href="/charts/new">
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent">
              New Chart
            </Button>
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Link href="/data-sources">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground hidden sm:flex gap-2"
              title="Data Sources"
            >
              <Database className="h-4 w-4" />
              <span className="hidden lg:inline text-xs">Sources</span>
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>
          <Link href="/settings">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
