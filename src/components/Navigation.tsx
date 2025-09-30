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
    <nav className="bg-black border-b border-gray-800 p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h1 className="text-white text-xl font-bold">Blackjack</h1>
          <div className="flex gap-2">
            <Button
              variant={currentView === 'game' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('game')}
              className={currentView === 'game' ? 'bg-white text-black hover:bg-gray-200' : 'text-gray-400 hover:text-white hover:bg-gray-900'}
            >
              Home
            </Button>
            <Button
              variant={currentView === 'history' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('history')}
              className={currentView === 'history' ? 'bg-white text-black hover:bg-gray-200' : 'text-gray-400 hover:text-white hover:bg-gray-900'}
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-gray-400">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4" />
            <span>{gameUser?.email}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-gray-400 hover:text-white hover:bg-gray-900"
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
}
