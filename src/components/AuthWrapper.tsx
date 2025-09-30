'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AuthForm from '@/components/AuthForm'
import BlackjackGame from '@/components/BlackjackGame'
import GameHistory from '@/components/GameHistory'
import Navigation from '@/components/Navigation'

export default function AuthWrapper() {
  const { user, gameUser, loading } = useAuth()
  const [currentView, setCurrentView] = useState<'game' | 'history'>('game')

  if (loading) {
    return (
      <div className="min-h-screen bg-green-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!user || !gameUser) {
    return <AuthForm />
  }

  return (
    <div className="min-h-screen bg-green-800">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      
      {currentView === 'game' ? (
        <BlackjackGame />
      ) : (
        <GameHistory onBack={() => setCurrentView('game')} />
      )}
    </div>
  )
}
