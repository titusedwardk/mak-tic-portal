'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from './notification-bell'
import { 
  LayoutDashboard, 
  FolderGit, 
  FolderPlus, 
  Kanban, 
  BarChart3, 
  Users, 
  Menu, 
  X, 
  LogOut, 
  User as UserIcon,
  Sparkles,
  Compass
} from 'lucide-react'

interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: string
  affiliation: string
}

export default function PortalShell({
  children,
  profile,
}: {
  children: React.ReactNode
  profile: Profile | null
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  if (!profile) return <>{children}</>

  const isAdmin = ['admin', 'reviewer', 'lab_manager'].includes(profile.role)

  const innovatorLinks = [
    { href: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/portal/projects', label: 'My Projects', icon: FolderGit },
    { href: '/portal/projects/new', label: 'Submit Project', icon: FolderPlus },
  ]

  const adminLinks = [
    { href: '/portal/admin/pipeline', label: 'Pipeline Kanban', icon: Kanban },
    { href: '/portal/admin/scoring', label: 'Scoring Board', icon: BarChart3 },
    { href: '/portal/admin/mentors', label: 'Mentor Matches', icon: Users },
  ]

  const publicLinks = [
    { href: '/showcase', label: 'Public Showcase', icon: Compass },
  ]

  const isActive = (href: string) => {
    if (href === '/portal/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const renderLinks = (links: typeof innovatorLinks) => {
    return links.map((link) => {
      const Icon = link.icon
      const active = isActive(link.href)
      return (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            active
              ? 'bg-amber-500 text-slate-900 shadow-md shadow-amber-500/10'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
          }`}
        >
          <Icon className="h-4.5 w-4.5" />
          {link.label}
        </Link>
      )
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Sidebar for Desktop */}
      <aside className="fixed top-0 bottom-0 left-0 w-64 bg-slate-900/60 backdrop-blur-md border-r border-slate-800/80 z-30 hidden md:flex flex-col p-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-amber-500 text-white font-extrabold text-lg flex shadow-lg">
            M
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight text-white leading-none">Mak-TIC</h1>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Portal</span>
          </div>
        </div>

        {/* Navigation Link Groups */}
        <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <span className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Innovator Hub
            </span>
            {renderLinks(innovatorLinks)}
          </div>

          {isAdmin && (
            <div className="space-y-1.5 pt-4 border-t border-slate-800/60">
              <span className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                Administration
              </span>
              {renderLinks(adminLinks)}
            </div>
          )}

          <div className="space-y-1.5 pt-4 border-t border-slate-800/60">
            <span className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Explore
            </span>
            {renderLinks(publicLinks)}
          </div>
        </nav>

        {/* User Card / Sign Out */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-4 w-4 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate">{profile.full_name}</h4>
              <span className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
                {profile.role}
                {profile.role === 'admin' && <Sparkles className="h-2.5 w-2.5 text-amber-400" />}
              </span>
            </div>
          </div>
          <form action="/auth/signout" method="POST" className="w-full">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/20 transition-all cursor-pointer text-left"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800/80 px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-slate-400 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-md font-bold text-white tracking-wide">Mak-TIC Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell userId={profile.id} />
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-4 w-4 text-slate-400" />
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <div className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col relative z-10 animate-slideRight">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 px-2 mb-8">
              <div className="h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-amber-500 text-white font-extrabold text-lg flex">
                M
              </div>
              <div>
                <h1 className="text-md font-bold tracking-tight text-white leading-none">Mak-TIC</h1>
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider">Portal</span>
              </div>
            </div>

            <nav className="flex-1 space-y-6 overflow-y-auto">
              <div className="space-y-1.5">
                <span className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  Innovator Hub
                </span>
                {renderLinks(innovatorLinks)}
              </div>
              {isAdmin && (
                <div className="space-y-1.5 pt-4 border-t border-slate-800/60">
                  <span className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                    Administration
                  </span>
                  {renderLinks(adminLinks)}
                </div>
              )}
              <div className="space-y-1.5 pt-4 border-t border-slate-800/60">
                <span className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  Explore
                </span>
                {renderLinks(publicLinks)}
              </div>
            </nav>

            <div className="pt-6 border-t border-slate-850 mt-auto flex flex-col gap-3">
              <div className="flex items-center gap-3 px-2">
                <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-4 w-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{profile.full_name}</h4>
                  <span className="text-[10px] text-slate-400 capitalize">{profile.role}</span>
                </div>
              </div>
              <form action="/auth/signout" method="POST" className="w-full">
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/20 transition-all text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Desktop Top Navbar header */}
        <header className="hidden md:flex h-16 border-b border-slate-800/50 bg-slate-950 px-8 items-center justify-between sticky top-0 z-20">
          <div>
            <h2 className="text-sm font-semibold text-slate-400">
              Welcome back, <span className="text-slate-100 font-bold">{profile.full_name}</span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell userId={profile.id} />
            <div className="h-px bg-slate-800 self-stretch my-2" />
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 group cursor-pointer focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-slate-500">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-4 w-4 text-slate-400" />
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-300 group-hover:text-slate-100">
                  {profile.full_name.split(' ')[0]}
                </span>
              </button>

              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 animate-fadeIn">
                    <Link
                      href="/portal/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-700/60 hover:text-white"
                    >
                      <UserIcon className="h-4 w-4" /> My Profile
                    </Link>
                    <form action="/auth/signout" method="POST" className="w-full">
                      <button
                        type="submit"
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/20 text-left cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Inner page children container */}
        <main className="flex-1 p-6 md:p-8 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}
