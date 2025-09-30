'use client'

import { useState, useEffect } from 'react'
import { Card, GameState } from '@/types/game'
import { 
  drawCard, 
  calculateHandValue, 
  determineResult, 
  calculatePayout, 
  shouldDealerHit,
  isBlackjack 
} from '@/lib/gameLogic'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Card UI components removed - not used in this component
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import PlayingCard from './PlayingCard'

export default function BlackjackGame() {
  const { gameUser, updateChips } = useAuth()
  const [gameState, setGameState] = useState<GameState>({
    playerHand: [],
    dealerHand: [],
    playerScore: 0,
    dealerScore: 0,
    gameStatus: 'betting',
    result: null,
    currentBet: 0,
    chips: gameUser?.chips || 0,
    canHit: false,
    canStand: false,
    showDealerCard: false
  })
  const [betAmount, setBetAmount] = useState('')
  const [aiAdvice, setAiAdvice] = useState('')
  const [loadingAdvice, setLoadingAdvice] = useState(false)

  useEffect(() => {
    if (gameUser) {
      setGameState(prev => ({ ...prev, chips: gameUser.chips }))
    }
  }, [gameUser])

  const placeBet = () => {
    const bet = parseInt(betAmount)
    if (!bet || bet <= 0) {
      toast.error('Please enter a valid bet amount')
      return
    }
    if (bet > gameState.chips) {
      toast.error('Insufficient chips')
      return
    }

    // Deal initial cards
    const playerCard1 = drawCard()
    const playerCard2 = drawCard()
    const dealerCard1 = drawCard()
    const dealerCard2 = drawCard()

    const playerHand = [playerCard1, playerCard2]
    const dealerHand = [dealerCard1, dealerCard2]
    const playerScore = calculateHandValue(playerHand)

    setGameState({
      ...gameState,
      playerHand,
      dealerHand,
      playerScore,
      dealerScore: calculateHandValue([dealerCard1]), // Only show first dealer card
      gameStatus: isBlackjack(playerHand) ? 'finished' : 'playing',
      currentBet: bet,
      chips: gameState.chips - bet,
      canHit: !isBlackjack(playerHand),
      canStand: true,
      showDealerCard: false,
      result: isBlackjack(playerHand) && !isBlackjack(dealerHand) ? 'win' : null
    })

    setBetAmount('')

    // Check for immediate blackjack
    if (isBlackjack(playerHand)) {
      setTimeout(() => finishGame(playerHand, dealerHand), 1000)
    }
  }

  const hit = () => {
    if (gameState.gameStatus !== 'playing') return

    const newCard = drawCard()
    const newPlayerHand = [...gameState.playerHand, newCard]
    const newPlayerScore = calculateHandValue(newPlayerHand)

    if (newPlayerScore > 21) {
      // Player busts
      setGameState({
        ...gameState,
        playerHand: newPlayerHand,
        playerScore: newPlayerScore,
        gameStatus: 'finished',
        result: 'lose',
        canHit: false,
        canStand: false
      })
      setTimeout(() => finishGame(newPlayerHand, gameState.dealerHand), 1000)
    } else {
      setGameState({
        ...gameState,
        playerHand: newPlayerHand,
        playerScore: newPlayerScore,
        canHit: newPlayerScore < 21,
        canStand: true
      })
    }
  }

  const stand = () => {
    if (gameState.gameStatus !== 'playing') return

    setGameState({
      ...gameState,
      gameStatus: 'dealer-turn',
      canHit: false,
      canStand: false,
      showDealerCard: true,
      dealerScore: calculateHandValue(gameState.dealerHand)
    })

    // Dealer plays
    setTimeout(() => playDealerTurn(), 1000)
  }

  const playDealerTurn = () => {
    let dealerHand = [...gameState.dealerHand]
    
    const dealerTurn = () => {
      if (shouldDealerHit(dealerHand)) {
        const newCard = drawCard()
        dealerHand = [...dealerHand, newCard]
        
        setGameState(prev => ({
          ...prev,
          dealerHand,
          dealerScore: calculateHandValue(dealerHand)
        }))

        setTimeout(dealerTurn, 1000)
      } else {
        // Dealer is done
        setTimeout(() => finishGame(gameState.playerHand, dealerHand), 1000)
      }
    }

    dealerTurn()
  }

  const finishGame = async (playerHand: Card[], dealerHand: Card[]) => {
    const result = determineResult(playerHand, dealerHand)
    const isPlayerBlackjack = isBlackjack(playerHand)
    const payout = calculatePayout(gameState.currentBet, result, isPlayerBlackjack)
    const newChips = gameState.chips + gameState.currentBet + payout

    setGameState(prev => ({
      ...prev,
      gameStatus: 'finished',
      result,
      chips: newChips,
      showDealerCard: true,
      dealerScore: calculateHandValue(dealerHand)
    }))

    // Update chips in database
    if (gameUser) {
      await updateChips(newChips)
    }

    // Save game history
    if (gameUser) {
      await supabase.from('game_history').insert([
        {
          user_id: gameUser.id,
          bet_amount: gameState.currentBet,
          player_hand: JSON.stringify(playerHand),
          dealer_hand: JSON.stringify(dealerHand),
          player_score: calculateHandValue(playerHand),
          dealer_score: calculateHandValue(dealerHand),
          result,
          chips_change: payout
        }
      ])
    }

    // Show result toast
    const resultMessages = {
      win: isPlayerBlackjack ? 'Blackjack! You win!' : 'You win!',
      lose: 'You lose!',
      push: 'Push! It\'s a tie!'
    }
    
    setTimeout(() => {
      toast.success(resultMessages[result])
    }, 500)
  }

  const newGame = () => {
    setGameState({
      playerHand: [],
      dealerHand: [],
      playerScore: 0,
      dealerScore: 0,
      gameStatus: 'betting',
      result: null,
      currentBet: 0,
      chips: gameState.chips,
      canHit: false,
      canStand: false,
      showDealerCard: false
    })
    setAiAdvice('')
  }

  const buyChips = async () => {
    if (!gameUser) return
    
    const newChips = gameState.chips + 100
    await updateChips(newChips)
    setGameState(prev => ({ ...prev, chips: newChips }))
    toast.success('100 chips added!')
  }

  const getAIAdvice = async () => {
    if (gameState.gameStatus !== 'playing' || !gameState.dealerHand.length) return
    
    setLoadingAdvice(true)
    try {
      // Call API route instead of calling Gemini directly (keeps API key secure)
      const response = await fetch('/api/advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerHand: gameState.playerHand,
          dealerUpCard: gameState.dealerHand[0],
          currentBet: gameState.currentBet,
          chips: gameState.chips
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get advice')
      }

      const data = await response.json()
      setAiAdvice(data.advice)
    } catch {
      toast.error('Failed to get AI advice')
    } finally {
      setLoadingAdvice(false)
    }
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with chips */}
        <div className="flex justify-between items-center mb-12 px-4">
          <h1 className="text-white text-2xl font-bold">Blackjack</h1>
          <div className="flex items-center gap-2 bg-gray-900 px-4 py-2 rounded-lg border border-gray-700">
            <span className="text-yellow-400">💰</span>
            <span className="text-white font-semibold">{gameState.chips}</span>
          </div>
        </div>

        {/* Dealer Hand */}
        <div className="mb-20 text-center">
          <div className="flex gap-3 justify-center mb-4 min-h-[140px]">
            {gameState.dealerHand.map((card, index) => (
              <PlayingCard
                key={index}
                card={card}
                faceDown={index === 1 && !gameState.showDealerCard}
                delay={index * 200}
              />
            ))}
          </div>
          <div className="bg-gray-900 text-white px-4 py-2 rounded-lg inline-block border border-gray-700">
            {gameState.showDealerCard ? gameState.dealerScore : '?'} Dealer
          </div>
        </div>

        {/* Player Hand */}
        <div className="mb-8 text-center">
          <div className="bg-gray-900 text-white px-4 py-2 rounded-lg inline-block mb-4 border border-gray-700">
            {gameState.playerScore} You
          </div>
          <div className="flex gap-3 justify-center min-h-[140px]">
            {gameState.playerHand.map((card, index) => (
              <PlayingCard
                key={index}
                card={card}
                delay={index * 200}
              />
            ))}
          </div>
        </div>

        {/* Game Controls */}
        <div className="text-center space-y-6 mt-12">
          {gameState.gameStatus === 'betting' && (
            <div className="space-y-4">
              <div className="max-w-md mx-auto space-y-4">
                <Input
                  type="number"
                  placeholder="100"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="text-center bg-gray-900 border-gray-700 text-white text-lg h-14"
                />
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setBetAmount('5')} variant="outline" className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800">
                    +5
                  </Button>
                  <Button onClick={() => setBetAmount('25')} variant="outline" className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800">
                    +25
                  </Button>
                  <Button onClick={() => setBetAmount('100')} variant="outline" className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800">
                    +100
                  </Button>
                </div>
              </div>
              <Button onClick={placeBet} size="lg" className="bg-white text-black hover:bg-gray-200 px-8 py-6 text-lg">
                Place Bet
              </Button>
            </div>
          )}

          {gameState.gameStatus === 'playing' && (
            <div className="space-y-4">
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={hit} 
                  disabled={!gameState.canHit} 
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg"
                >
                  Hit
                </Button>
                <Button 
                  onClick={stand} 
                  disabled={!gameState.canStand} 
                  size="lg"
                  className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-6 text-lg"
                >
                  Stand
                </Button>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={getAIAdvice} 
                    disabled={loadingAdvice}
                    className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                  >
                    {loadingAdvice ? 'Getting Advice...' : 'Get AI Advice'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 text-white border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">AI Blackjack Advisor</DialogTitle>
                  </DialogHeader>
                  <div className="whitespace-pre-wrap text-gray-300">
                    {aiAdvice || 'Click "Get AI Advice" to receive strategic guidance for your current hand.'}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {gameState.gameStatus === 'dealer-turn' && (
            <div className="text-white text-xl">
              Dealer is playing...
            </div>
          )}

          {gameState.gameStatus === 'finished' && (
            <div className="space-y-4">
              <div className="text-white text-2xl font-bold">
                {gameState.result === 'win' && 'You Win! 🎉'}
                {gameState.result === 'lose' && 'You Lose 😞'}
                {gameState.result === 'push' && 'Push! 🤝'}
              </div>
              <div className="flex gap-4 justify-center">
                <Button onClick={newGame} size="lg" className="bg-white text-black hover:bg-gray-200 px-8 py-6 text-lg">
                  New Game
                </Button>
                {gameState.chips < 10 && (
                  <Button onClick={buyChips} variant="outline" size="lg" className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800">
                    Buy 100 Chips
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
