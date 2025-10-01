'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface GameHistoryRecord {
  id: string
  bet_amount: number
  player_hand: string
  dealer_hand: string
  player_score: number
  dealer_score: number
  result: 'win' | 'lose' | 'push'
  chips_change: number
  created_at: string
}

interface GameHistoryProps {
  onBack: () => void
}

export default function GameHistory({ onBack }: GameHistoryProps) {
  const { gameUser } = useAuth()
  const [history, setHistory] = useState<GameHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    totalWinnings: 0,
    winRate: 0
  })

  useEffect(() => {
    fetchHistory()
  }, [gameUser]) // fetchHistory is stable, no need to include

  const fetchHistory = async () => {
    if (!gameUser) return

    try {
      const { data, error } = await supabase
        .from('game_history')
        .select('*')
        .eq('user_id', gameUser.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching history:', error)
        return
      }

      setHistory(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (games: GameHistoryRecord[]) => {
    const totalGames = games.length
    const wins = games.filter(g => g.result === 'win').length
    const losses = games.filter(g => g.result === 'lose').length
    const pushes = games.filter(g => g.result === 'push').length
    const totalWinnings = games.reduce((sum, game) => sum + game.chips_change, 0)
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0

    setStats({
      totalGames,
      wins,
      losses,
      pushes,
      totalWinnings,
      winRate
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const parseHand = (handString: string) => {
    try {
      return JSON.parse(handString)
    } catch {
      return []
    }
  }

  const formatHand = (handString: string) => {
    const hand = parseHand(handString)
    return hand.map((card: { rank: string; suit: string }) => `${card.rank}${getSuitSymbol(card.suit)}`).join(' ')
  }

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥️'
      case 'diamonds': return '♦️'
      case 'clubs': return '♣️'
      case 'spades': return '♠️'
      default: return ''
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win': return 'text-green-500'
      case 'lose': return 'text-red-500'
      case 'push': return 'text-yellow-500'
      default: return 'text-gray-400'
    }
  }

  const getResultEmoji = (result: string) => {
    switch (result) {
      case 'win': return '🎉'
      case 'lose': return '😞'
      case 'push': return '🤝'
      default: return ''
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading history...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm" className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Game
          </Button>
          <div className="relative group cursor-pointer">
            <h1 className="text-3xl font-bold text-white">Game History</h1>
            {/* Tooltip showing user email */}
            <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-gray-700">
              {gameUser?.email}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.totalGames}</div>
              <div className="text-sm text-gray-400">Total Games</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{stats.wins}</div>
              <div className="text-sm text-gray-400">Wins</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.winRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Win Rate</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${stats.totalWinnings >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.totalWinnings > 0 ? '+' : ''}{stats.totalWinnings}
              </div>
              <div className="text-sm text-gray-400">Net Chips</div>
            </CardContent>
          </Card>
        </div>

        {/* History List */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Games</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No games played yet. Start playing to see your history!
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((game) => (
                  <div key={game.id} className="border border-gray-800 rounded-lg p-4 bg-gray-950">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${getResultColor(game.result)}`}>
                          {game.result.toUpperCase()} {getResultEmoji(game.result)}
                        </span>
                        <span className="text-sm text-gray-400">
                          {formatDate(game.created_at)}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">Bet: {game.bet_amount}</div>
                        <div className={`text-sm ${game.chips_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {game.chips_change > 0 ? '+' : ''}{game.chips_change} chips
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-white">Your Hand ({game.player_score})</div>
                        <div className="text-gray-400">{formatHand(game.player_hand)}</div>
                      </div>
                      <div>
                        <div className="font-medium text-white">Dealer Hand ({game.dealer_score})</div>
                        <div className="text-gray-400">{formatHand(game.dealer_hand)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
