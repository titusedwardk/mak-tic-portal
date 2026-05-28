import { redirect } from 'next/navigation'
import { createClient, getUserProfile } from '@/lib/supabase/server'
import PortalShell from '@/components/portal-shell'

export const metadata = {
  title: 'Mak-TIC Portal | Makerere University',
  description: 'Makerere University Technology & Innovation Center Portal',
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Get user session
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // 2. Get user profile
  const profile = await getUserProfile()

  if (!profile) {
    // If the profile wasn't created yet or trigger failed, sign them out to be safe
    await supabase.auth.signOut()
    redirect('/login?error=Failed to retrieve profile record')
  }

  return (
    <PortalShell profile={profile}>
      {children}
    </PortalShell>
  )
}
