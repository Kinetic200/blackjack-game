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
import PlaceholderCard from './PlaceholderCard'

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
    
    setAiAdvice('') // Clear previous advice
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
    <div className="min-h-screen bg-black p-2 sm:p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Header with chips */}
        <div className="flex justify-between items-center mb-4 sm:mb-8 px-2 sm:px-4">
          <h1 className="text-white text-xl sm:text-2xl font-bold">Blackjack</h1>
          <div className="flex items-center gap-2 bg-gray-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-700">
            <span className="text-yellow-400 text-sm sm:text-base">💰</span>
            <span className="text-white font-semibold text-sm sm:text-base">{gameState.chips}</span>
          </div>
        </div>

        {/* Dealer Hand */}
        <div className="mb-8 sm:mb-16 text-center">
          <div className="flex gap-2 sm:gap-3 justify-center mb-2 sm:mb-4 min-h-[80px] sm:min-h-[140px]">
            {gameState.dealerHand.length > 0 ? (
              gameState.dealerHand.map((card, index) => (
                <PlayingCard
                  key={index}
                  card={card}
                  faceDown={index === 1 && !gameState.showDealerCard}
                  delay={index * 200}
                />
              ))
            ) : (
              // Show placeholder cards when no cards dealt
              <>
                <PlaceholderCard />
                <PlaceholderCard />
              </>
            )}
          </div>
          <div className="bg-gray-900 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg inline-block border border-gray-700 text-sm sm:text-base">
            {gameState.showDealerCard ? gameState.dealerScore : '?'} Dealer
          </div>
        </div>

        {/* Player Hand */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="bg-gray-900 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg inline-block mb-2 sm:mb-4 border border-gray-700 text-sm sm:text-base">
            {gameState.playerScore} You
          </div>
          <div className="flex gap-2 sm:gap-3 justify-center min-h-[80px] sm:min-h-[140px]">
            {gameState.playerHand.length > 0 ? (
              gameState.playerHand.map((card, index) => (
                <PlayingCard
                  key={index}
                  card={card}
                  delay={index * 200}
                />
              ))
            ) : (
              // Show placeholder cards when no cards dealt
              <>
                <PlaceholderCard />
                <PlaceholderCard />
              </>
            )}
          </div>
        </div>

        {/* Game Controls */}
        <div className="text-center space-y-3 sm:space-y-6 mt-4 sm:mt-8">
          {gameState.gameStatus === 'betting' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="max-w-md mx-auto space-y-2 sm:space-y-4 px-4">
                <Input
                  type="number"
                  placeholder="100"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="text-center bg-gray-900 border-gray-700 text-white text-base sm:text-lg h-10 sm:h-14"
                />
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setBetAmount('5')} variant="outline" className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800 text-sm sm:text-base px-3 sm:px-4">
                    +5
                  </Button>
                  <Button onClick={() => setBetAmount('25')} variant="outline" className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800 text-sm sm:text-base px-3 sm:px-4">
                    +25
                  </Button>
                  <Button onClick={() => setBetAmount('100')} variant="outline" className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800 text-sm sm:text-base px-3 sm:px-4">
                    +100
                  </Button>
                </div>
              </div>
              <Button onClick={placeBet} size="lg" className="bg-white text-black hover:bg-gray-200 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg">
                Place Bet
              </Button>
            </div>
          )}

          {gameState.gameStatus === 'playing' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex gap-3 sm:gap-4 justify-center">
                <Button 
                  onClick={hit} 
                  disabled={!gameState.canHit} 
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg"
                >
                  Hit
                </Button>
                <Button 
                  onClick={stand} 
                  disabled={!gameState.canStand} 
                  size="lg"
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg"
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
                    className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600 text-sm sm:text-base px-4 sm:px-6"
                  >
                    {loadingAdvice ? 'Getting Advice...' : 'Get AI Advice'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 text-white border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">AI Blackjack Advisor</DialogTitle>
                  </DialogHeader>
                  <div className="whitespace-pre-wrap text-gray-300">
                    {loadingAdvice ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                        <span>Loading AI advice...</span>
                      </div>
                    ) : (
                      aiAdvice || 'Click "Get AI Advice" to receive strategic guidance for your current hand.'
                    )}
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
            <div className="space-y-3 sm:space-y-4">
              <div className="text-white text-xl sm:text-2xl font-bold">
                {gameState.result === 'win' && 'You Win! 🎉'}
                {gameState.result === 'lose' && 'You Lose 😞'}
                {gameState.result === 'push' && 'Push! 🤝'}
              </div>
              <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
                <Button onClick={newGame} size="lg" className="bg-white text-black hover:bg-gray-200 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg">
                  New Game
                </Button>
                {gameState.chips < 10 && (
                  <Button onClick={buyChips} variant="outline" size="lg" className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800 text-sm sm:text-base">
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
