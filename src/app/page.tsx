'use client'

import nextDynamic from 'next/dynamic'

// Import AuthWrapper which handles authentication and shows the real game
const AuthWrapper = nextDynamic(() => import('@/components/AuthWrapper'), { ssr: false })

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function Home() {
  return <AuthWrapper />
}
