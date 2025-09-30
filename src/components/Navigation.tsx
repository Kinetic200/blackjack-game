'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { History, LogOut, User } from 'lucide-react'

interface NavigationProps {
  currentView: 'game' | 'history'
  onViewChange: (view: 'game' | 'history') => void
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const { gameUser, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <nav className="bg-green-900 border-b border-green-700 p-4">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-white text-xl font-bold">🃏 Blackjack</h1>
          <div className="flex gap-2">
            <Button
              variant={currentView === 'game' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('game')}
              className="text-white"
            >
              Game
            </Button>
            <Button
              variant={currentView === 'history' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('history')}
              className="text-white"
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-white">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="text-sm">{gameUser?.email}</span>
          </div>
          <div className="text-sm">
            💰 {gameUser?.chips || 0} chips
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-white hover:text-red-300"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
