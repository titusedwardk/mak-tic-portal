'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, BellOff, Check, ArrowUpRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  read_at: string | null
  created_at: string
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // 1. Fetch initial notifications
    const fetchNotifications = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      setLoading(false)
      if (!error && data) {
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.read_at).length)
      }
    }

    fetchNotifications()

    // 2. Realtime subscription for notifications table
    const channel = supabase
      .channel(`public:notifications:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as Notification
            setNotifications((prev) => [newNotif, ...prev.slice(0, 9)])
            setUnreadCount((c) => c + 1)
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotif = payload.new as Notification
            setNotifications((prev) =>
              prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
            )
            // Recalculate unread
            setUnreadCount((c) => Math.max(0, updatedNotif.read_at ? c - 1 : c + 1))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  const handleMarkAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    }
  }

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id)
    if (unreadIds.length === 0) return

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', unreadIds)

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ? n.read_at : new Date().toISOString() }))
      )
      setUnreadCount(0)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer focus:outline-none"
      >
        {unreadCount > 0 ? (
          <>
            <Bell className="h-5 w-5 animate-pulse text-amber-400" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-900 border border-slate-900">
              {unreadCount}
            </span>
          </>
        ) : (
          <Bell className="h-5 w-5" />
        )}
      </button>

      {open && (
        <>
          {/* Backdrop to close list */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          
          <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/60 border-b border-slate-700/60">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-amber-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-700/40">
              {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  <span className="text-xs text-slate-500 mt-2">Loading notifications...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <BellOff className="h-8 w-8 text-slate-600 mb-2" />
                  <span className="text-sm font-semibold text-slate-400">All caught up!</span>
                  <span className="text-xs text-slate-500 mt-0.5">No notifications right now</span>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3.5 transition-colors ${
                      notif.read_at ? 'bg-transparent' : 'bg-blue-950/20'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={`text-xs font-bold ${notif.read_at ? 'text-slate-300' : 'text-white'}`}>
                        {notif.title}
                      </h4>
                      {!notif.read_at && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          title="Mark as read"
                          className="text-slate-500 hover:text-emerald-400 p-0.5 rounded transition-colors cursor-pointer"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.body}</p>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                      <span>{new Date(notif.created_at).toLocaleDateString()}</span>
                      {notif.link && (
                        <Link
                          href={notif.link}
                          onClick={() => {
                            setOpen(false)
                            if (!notif.read_at) handleMarkAsRead(notif.id)
                          }}
                          className="text-blue-400 font-semibold hover:underline flex items-center gap-0.5"
                        >
                          View <ArrowUpRight className="h-2.5 w-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
