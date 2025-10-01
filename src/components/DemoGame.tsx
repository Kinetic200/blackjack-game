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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import PlayingCard from './PlayingCard'
import PlaceholderCard from './PlaceholderCard'

export default function DemoGame() {
  const [gameState, setGameState] = useState<GameState>({
    playerHand: [],
    dealerHand: [],
    playerScore: 0,
    dealerScore: 0,
    gameStatus: 'betting',
    result: null,
    currentBet: 0,
    chips: 500, // Start with 500 chips in demo mode
    canHit: false,
    canStand: false,
    canDouble: false,
    canSplit: false,
    showDealerCard: false,
    hasDoubled: false,
    isSplit: false,
    splitHand: null,
    splitScore: 0,
    activeSplitHand: null,
    splitResults: { first: null, second: null },
    splitDoubled: { first: false, second: false }
  })
  const [betAmount, setBetAmount] = useState('')
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [wins, setWins] = useState(0)

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
      canDouble: false,
      canSplit: false,
      showDealerCard: false,
      hasDoubled: false,
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
        canStand: false,
        canDouble: false,
        canSplit: false
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
      canDouble: false,
      canSplit: false,
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

  const finishGame = (playerHand: Card[], dealerHand: Card[]) => {
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

    // Update stats
    setGamesPlayed(prev => prev + 1)
    if (result === 'win') {
      setWins(prev => prev + 1)
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
      canDouble: false,
      canSplit: false,
      showDealerCard: false,
      hasDoubled: false,
      isSplit: false,
      splitHand: null,
      splitScore: 0,
      activeSplitHand: null,
      splitResults: { first: null, second: null }
    })
  }

  const buyChips = () => {
    const newChips = gameState.chips + 100
    setGameState(prev => ({ ...prev, chips: newChips }))
    toast.success('100 chips added!')
  }

  const winRate = gamesPlayed > 0 ? ((wins / gamesPlayed) * 100).toFixed(1) : '0.0'

  return (
    <div className="min-h-screen bg-black p-4">
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center mb-8 px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-white text-2xl font-bold">Blackjack</h1>
          <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-lg">
            <span className="text-yellow-400">💰</span>
            <span className="text-white font-semibold">{gameState.chips}</span>
            <span className="text-gray-400">+</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-white">
          <button className="hover:text-gray-300">Home</button>
          <button className="hover:text-gray-300">History</button>
          <button className="hover:text-gray-300">Logout</button>
          <button className="hover:text-gray-300">🌙</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Fixed Layout Game Area */}
        <div className="flex flex-col items-center min-h-[700px]">
          
          {/* Dealer Section - Fixed Position */}
          <div className="text-center mb-16">
            <div className="h-32 flex gap-3 justify-center items-center mb-4">
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
                // Placeholder cards for dealer
                <div className="flex gap-3">
                  <PlaceholderCard />
                  <PlaceholderCard />
                </div>
              )}
            </div>
            <div className="bg-gray-800 text-white px-4 py-2 rounded-lg inline-block">
              {gameState.dealerHand.length > 0 ? (gameState.showDealerCard ? gameState.dealerScore : '?') : '0'} Dealer
            </div>
          </div>

          {/* Game Controls - Fixed Center Position */}
          <div className="text-center mb-16">
            <div className="h-20 flex flex-col justify-center">
              {gameState.gameStatus === 'betting' && (
                <div className="space-y-4">
                  <div className="max-w-sm mx-auto">
                    <Input
                      type="number"
                      placeholder="Enter bet amount"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="text-center bg-gray-800 text-white border-gray-600"
                    />
                  </div>
                  <Button onClick={placeBet} size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Deal Cards
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
                      className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
                    >
                      Hit
                    </Button>
                    <Button 
                      onClick={stand} 
                      disabled={!gameState.canStand} 
                      size="lg"
                      className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3"
                    >
                      Stand
                    </Button>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600">
                        Get AI Advice
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 text-white border-gray-700">
                      <DialogHeader>
                        <DialogTitle>AI Blackjack Advisor (Demo)</DialogTitle>
                      </DialogHeader>
                      <div>
                        <p className="mb-2"><strong>Demo Advice:</strong></p>
                        <p>• If your total is 11 or less: Always Hit</p>
                        <p>• If your total is 17 or more: Always Stand</p>
                        <p>• If dealer shows 2-6: Stand on 12+</p>
                        <p>• If dealer shows 7-A: Hit until 17+</p>
                        <p className="mt-4 text-sm text-gray-400">
                          <em>Set up Gemini API for personalized AI advice!</em>
                        </p>
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
                  <div className="text-white text-2xl font-bold mb-4">
                    {gameState.result === 'win' && 'You Win! 🎉'}
                    {gameState.result === 'lose' && 'You Lose 😞'}
                    {gameState.result === 'push' && 'Push! 🤝'}
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={newGame} size="lg" className="bg-blue-600 hover:bg-blue-700">
                      New Game
                    </Button>
                    {gameState.chips < 10 && (
                      <Button onClick={buyChips} variant="outline" size="lg">
                        Buy 100 Chips (Demo)
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Player Section - Fixed Position */}
          <div className="text-center">
            <div className="bg-gray-800 text-white px-4 py-2 rounded-lg inline-block mb-4">
              {gameState.playerHand.length > 0 ? gameState.playerScore : '0'} You
            </div>
            <div className="h-32 flex gap-3 justify-center items-center">
              {gameState.playerHand.length > 0 ? (
                gameState.playerHand.map((card, index) => (
                  <PlayingCard
                    key={index}
                    card={card}
                    delay={index * 200}
                  />
                ))
              ) : (
                // Placeholder cards for player
                <div className="flex gap-3">
                  <PlaceholderCard />
                  <PlaceholderCard />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
