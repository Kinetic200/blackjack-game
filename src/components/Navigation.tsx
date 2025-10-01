'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { History, LogOut, User } from 'lucide-react'

interface NavigationProps {
  currentView: 'game' | 'history'
  onViewChange: (view: 'game' | 'history') => void
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const { gameUser, signOut } = useAuth()
  const [showEmail, setShowEmail] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <nav className="bg-black border-b border-gray-800 p-3 sm:p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center gap-2">
        <div className="flex items-center gap-2 sm:gap-6">
          <h1 className="text-white text-base sm:text-xl font-bold">Blackjack</h1>
          <div className="flex gap-1 sm:gap-2">
            <Button
              variant={currentView === 'game' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('game')}
              className={`text-xs sm:text-sm px-2 sm:px-4 ${currentView === 'game' ? 'bg-white text-black hover:bg-gray-200' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}
            >
              Home
            </Button>
            <Button
              variant={currentView === 'history' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('history')}
              className={`text-xs sm:text-sm px-2 sm:px-4 ${currentView === 'history' ? 'bg-white text-black hover:bg-gray-200' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}
            >
              <History className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">History</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-gray-400 relative">
          {/* Click target: user icon */}
          <button
            type="button"
            onClick={() => setShowEmail(v => !v)}
            aria-label="Toggle user email"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm max-w-[100px] sm:max-w-none relative cursor-pointer"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="hidden sm:inline truncate">{gameUser?.email}</span>
          </button>

          {/* Slide-out email pill to the left of the icon */}
          <div
            className={`absolute right-full mr-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg border border-gray-700 shadow-lg whitespace-nowrap z-[9999] transition-all duration-200 ${showEmail ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'}`}
          >
            {gameUser?.email || 'Not signed in'}
            {/* Arrow pointer */}
            <span className="ml-2 text-gray-400">&lt;</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-gray-400 hover:text-white hover:bg-gray-900 text-xs sm:text-sm px-2 sm:px-4"
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
}
