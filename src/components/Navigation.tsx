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

        <div className="flex items-center gap-2 sm:gap-4 text-gray-400">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm max-w-[100px] sm:max-w-none relative group cursor-pointer">
            <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="hidden sm:inline truncate">{gameUser?.email}</span>
            {/* Tooltip - shows on all screen sizes */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[9999] border border-gray-600 shadow-lg">
              {gameUser?.email}
              {/* Arrow pointing down */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
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
