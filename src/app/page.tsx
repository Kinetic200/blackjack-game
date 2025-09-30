'use client'

import nextDynamic from 'next/dynamic'

// Import demo game for local testing
const DemoGame = nextDynamic(() => import('@/components/DemoGame'), { ssr: false })

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function Home() {
  return <DemoGame />
}
