'use client'

import { useState, useEffect } from 'react'
import { Card, GameState } from '@/types/game'
import { 
  drawCard, 
  calculateHandValue, 
  determineResult, 
  calculatePayout, 
  shouldDealerHit,
  isBlackjack,
  canDoubleDown,
  canSplit
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

    const newChips = gameState.chips - bet
    
    const playerHasBlackjack = isBlackjack(playerHand)
    const dealerHasBlackjack = isBlackjack(dealerHand)
    
    setGameState({
      ...gameState,
      playerHand,
      dealerHand,
      playerScore,
      dealerScore: playerHasBlackjack ? calculateHandValue(dealerHand) : calculateHandValue([dealerCard1]),
      gameStatus: playerHasBlackjack ? 'finished' : 'playing',
      currentBet: bet,
      chips: newChips,
      canHit: !playerHasBlackjack,
      canStand: true,
      canDouble: !playerHasBlackjack && canDoubleDown(playerHand, newChips, bet),
      canSplit: !playerHasBlackjack && canSplit(playerHand, newChips, bet),
      showDealerCard: playerHasBlackjack,
      hasDoubled: false,
      result: playerHasBlackjack ? (dealerHasBlackjack ? 'push' : 'win') : null
    })

    setBetAmount('')

    // Check for immediate blackjack
    if (playerHasBlackjack) {
      setTimeout(() => finishGame(playerHand, dealerHand), 1000)
    }
  }

  const hit = () => {
    if (gameState.gameStatus !== 'playing') return

    const newCard = drawCard()
    
    if (gameState.isSplit && gameState.activeSplitHand === 'first') {
      // Hitting on first split hand
      const newPlayerHand = [...gameState.playerHand, newCard]
      const newPlayerScore = calculateHandValue(newPlayerHand)
      
      if (newPlayerScore > 21) {
        // First hand busts, automatically move to second hand
        toast.error('Hand 1 busts! Moving to Hand 2...')
        
        if (gameState.splitHand) {
          const newSplitHand = [...gameState.splitHand, drawCard()]
          setGameState({
            ...gameState,
            playerHand: newPlayerHand,
            playerScore: newPlayerScore,
            splitHand: newSplitHand,
            splitScore: calculateHandValue(newSplitHand),
            activeSplitHand: 'second',
            canHit: true,
            canStand: true,
            canDouble: false,
            canSplit: false
          })
        }
      } else {
        setGameState({
          ...gameState,
          playerHand: newPlayerHand,
          playerScore: newPlayerScore,
          canHit: newPlayerScore < 21,
          canStand: true,
          canDouble: false,
          canSplit: false
        })
      }
    } else if (gameState.isSplit && gameState.activeSplitHand === 'second' && gameState.splitHand) {
      // Hitting on second split hand
      const newSplitHand = [...gameState.splitHand, newCard]
      const newSplitScore = calculateHandValue(newSplitHand)
      
      if (newSplitScore > 21) {
        // Second hand busts, move to dealer turn
        toast.error('Hand 2 busts! Dealer\'s turn...')
        setGameState({
          ...gameState,
          splitHand: newSplitHand,
          splitScore: newSplitScore,
          gameStatus: 'dealer-turn',
          canHit: false,
          canStand: false,
          showDealerCard: true,
          dealerScore: calculateHandValue(gameState.dealerHand),
          activeSplitHand: null
        })
        setTimeout(() => playDealerTurn(), 1000)
      } else {
        setGameState({
          ...gameState,
          splitHand: newSplitHand,
          splitScore: newSplitScore,
          canHit: newSplitScore < 21,
          canStand: true
        })
      }
    } else {
      // Regular hit (no split)
      const newPlayerHand = [...gameState.playerHand, newCard]
      const newPlayerScore = calculateHandValue(newPlayerHand)

      if (newPlayerScore > 21) {
        // Player busts - immediate loss, dealer doesn't play
        setGameState({
          ...gameState,
          playerHand: newPlayerHand,
          playerScore: newPlayerScore,
          gameStatus: 'finished',
          result: 'lose',
          canHit: false,
          canStand: false,
          canDouble: false,
          canSplit: false,
          showDealerCard: true,
          dealerScore: calculateHandValue(gameState.dealerHand)
        })
        
        toast.error('Bust! You lose.')
        
        // Call finishGame to save and update chips
        setTimeout(() => finishGame(newPlayerHand, gameState.dealerHand), 1000)
      } else {
        setGameState({
          ...gameState,
          playerHand: newPlayerHand,
          playerScore: newPlayerScore,
          canHit: newPlayerScore < 21,
          canStand: true,
          canDouble: false, // Can't double after hitting
          canSplit: false // Can't split after hitting
        })
      }
    }
  }

  const doubleDown = () => {
    if (gameState.gameStatus !== 'playing' || !gameState.canDouble) return
    
    console.log('🎲 DOUBLE DOWN STARTED:')
    console.log('   gameState.chips:', gameState.chips)
    console.log('   gameState.currentBet:', gameState.currentBet)
    
    // Double the bet and deduct from chips
    const newCard = drawCard()
    const newPlayerHand = [...gameState.playerHand, newCard]
    const newPlayerScore = calculateHandValue(newPlayerHand)
    const originalBet = gameState.currentBet
    
    // Calculate chips AFTER double deduction (BEFORE setState to avoid async issues)
    const chipsAfterDouble = gameState.chips - originalBet
    
    console.log('   Chips after double calculation:', chipsAfterDouble)
    console.log('   Doubled bet will be:', originalBet * 2)
    
    // Check if player busts on double down
    if (newPlayerScore > 21) {
      // Player busts - immediate loss, dealer doesn't play
      setGameState({
        ...gameState,
        playerHand: newPlayerHand,
        playerScore: newPlayerScore,
        currentBet: originalBet * 2,
        chips: chipsAfterDouble,
        gameStatus: 'finished',
        result: 'lose',
        canHit: false,
        canStand: false,
        canDouble: false,
        canSplit: false,
        showDealerCard: true,
        dealerScore: calculateHandValue(gameState.dealerHand),
        hasDoubled: true
      })
      
      toast.error('Bust! You lose.')
      setTimeout(() => finishGame(newPlayerHand, gameState.dealerHand, originalBet * 2, chipsAfterDouble), 1000)
    } else {
      // Continue to dealer turn
      setGameState({
        ...gameState,
        playerHand: newPlayerHand,
        playerScore: newPlayerScore,
        currentBet: originalBet * 2,
        chips: chipsAfterDouble,
        gameStatus: 'dealer-turn',
        canHit: false,
        canStand: false,
        canDouble: false,
        canSplit: false,
        showDealerCard: true,
        dealerScore: calculateHandValue(gameState.dealerHand),
        hasDoubled: true
      })
      
      // Dealer plays automatically (need to pass doubled bet and chips through)
      setTimeout(() => playDealerTurn(originalBet * 2, chipsAfterDouble), 1000)
    }
  }

  const splitHand = () => {
    if (gameState.gameStatus !== 'playing' || !gameState.canSplit) return
    
    // Split the hand
    const firstHand = [gameState.playerHand[0], drawCard()]
    const secondHand = [gameState.playerHand[1]]
    
    setGameState({
      ...gameState,
      playerHand: firstHand,
      splitHand: secondHand,
      playerScore: calculateHandValue(firstHand),
      splitScore: calculateHandValue(secondHand),
      currentBet: gameState.currentBet * 2,
      chips: gameState.chips - gameState.currentBet, // Deduct additional bet
      isSplit: true,
      activeSplitHand: 'first',
      canHit: true,
      canStand: true,
      canDouble: false,
      canSplit: false
    })
    
    toast.success('Hand split! Playing first hand...')
  }

  const stand = () => {
    if (gameState.gameStatus !== 'playing') return

    if (gameState.isSplit && gameState.activeSplitHand === 'first' && gameState.splitHand) {
      // Finished first hand, move to second hand
      const newSplitHand = [...gameState.splitHand, drawCard()]
      
      setGameState({
        ...gameState,
        splitHand: newSplitHand,
        splitScore: calculateHandValue(newSplitHand),
        activeSplitHand: 'second',
        canHit: true,
        canStand: true,
        canDouble: false,
        canSplit: false
      })
      
      toast.info('Now playing second hand...')
    } else {
      // Either not split, or finished second hand - go to dealer
      setGameState({
        ...gameState,
        gameStatus: 'dealer-turn',
        canHit: false,
        canStand: false,
        canDouble: false,
        canSplit: false,
        showDealerCard: true,
        dealerScore: calculateHandValue(gameState.dealerHand),
        activeSplitHand: null
      })

      // Dealer plays
      setTimeout(() => playDealerTurn(), 1000)
    }
  }

  const playDealerTurn = (actualBet?: number, actualChips?: number) => {
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
        // Dealer is done - pass the actual bet and chips if provided (for double down)
        setTimeout(() => finishGame(gameState.playerHand, dealerHand, actualBet, actualChips), 1000)
      }
    }

    dealerTurn()
  }

  const finishGame = async (playerHand: Card[], dealerHand: Card[], actualBet?: number, actualChips?: number) => {
    // Use passed bet or current bet from state
    const betAmount = actualBet || gameState.currentBet
    // Use passed chips or current chips from state (for double down, chips are already deducted)
    const currentChips = actualChips ?? gameState.chips
    let result: 'win' | 'lose' | 'push'
    let payout: number
    let newChips: number
    
    // Check if player already busted (shouldn't calculate dealer result)
    const playerBusted = calculateHandValue(playerHand) > 21
    
    if (playerBusted && !gameState.isSplit) {
      // Player busted in regular game - immediate loss
      result = 'lose'
      payout = calculatePayout(betAmount, result, false)
      newChips = currentChips + betAmount + payout
    } else if (gameState.isSplit && gameState.splitHand) {
      // Calculate results for both hands
      const firstResult = determineResult(playerHand, dealerHand)
      const secondResult = determineResult(gameState.splitHand, dealerHand)
      
      const halfBet = betAmount / 2
      const firstPayout = calculatePayout(halfBet, firstResult, false)
      const secondPayout = calculatePayout(halfBet, secondResult, false)
      
      payout = firstPayout + secondPayout
      newChips = currentChips + betAmount + payout
      
      console.log('💰💰 SPLIT Payout calculation:')
      console.log('   Total bet:', betAmount)
      console.log('   Per hand bet:', halfBet)
      console.log('   Hand 1 result:', firstResult, '→ Payout:', firstPayout)
      console.log('   Hand 2 result:', secondResult, '→ Payout:', secondPayout)
      console.log('   Combined payout:', payout)
      console.log('   Current chips:', currentChips)
      console.log('   Final chips:', newChips)
      
      // Overall result (for display)
      if (firstResult === 'win' && secondResult === 'win') {
        result = 'win'
      } else if (firstResult === 'lose' && secondResult === 'lose') {
        result = 'lose'
      } else {
        result = 'push'
      }
      
      setGameState(prev => ({
        ...prev,
        gameStatus: 'finished',
        result,
        chips: newChips,
        showDealerCard: true,
        dealerScore: calculateHandValue(dealerHand),
        splitResults: { first: firstResult, second: secondResult }
      }))
    } else {
      // Regular game (no split)
      result = determineResult(playerHand, dealerHand)
      const isPlayerBlackjack = isBlackjack(playerHand)
      payout = calculatePayout(betAmount, result, isPlayerBlackjack)
      
      // Calculate final chips: current chips + bet back + winnings/losses
      // For win: chips + bet + bet = chips + 2*bet
      // For loss: chips + bet + (-bet) = chips (you lose your bet)
      // For push: chips + bet + 0 = chips + bet (get bet back)
      newChips = currentChips + betAmount + payout
      
      console.log('💰 Payout calculation:')
      console.log('   Current chips (from state):', gameState.chips)
      console.log('   Current chips (passed/actual):', currentChips)
      console.log('   Actual bet (passed):', betAmount)
      console.log('   State current bet:', gameState.currentBet)
      console.log('   Result:', result)
      console.log('   Payout:', payout)
      console.log('   Final chips:', newChips)
      console.log('   Has doubled:', gameState.hasDoubled)
      
      setGameState(prev => ({
        ...prev,
        gameStatus: 'finished',
        result,
        chips: newChips,
        showDealerCard: true,
        dealerScore: calculateHandValue(dealerHand)
      }))
    }

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

    // Show result toast with detailed explanation
    let resultMessage = ''
    const playerScore = calculateHandValue(playerHand)
    const dealerScore = calculateHandValue(dealerHand)
    const playerHasBlackjack = isBlackjack(playerHand)
    const dealerHasBlackjack = isBlackjack(dealerHand)
    
    if (gameState.isSplit) {
      resultMessage = result === 'win' ? 'You win both hands!' : result === 'lose' ? 'You lose both hands!' : 'Mixed results!'
    } else if (result === 'win') {
      if (playerHasBlackjack) {
        resultMessage = 'Blackjack! You win 3:2!'
      } else if (dealerScore > 21) {
        resultMessage = `Dealer busts with ${dealerScore}! You win!`
      } else {
        resultMessage = `You win! (${playerScore} vs ${dealerScore})`
      }
    } else if (result === 'lose') {
      if (playerScore > 21) {
        resultMessage = `Bust! You have ${playerScore}`
      } else if (dealerHasBlackjack && !playerHasBlackjack) {
        resultMessage = `Dealer Blackjack beats your ${playerScore}`
      } else {
        resultMessage = `You lose (${playerScore} vs ${dealerScore})`
      }
    } else {
      // Push
      if (playerHasBlackjack && dealerHasBlackjack) {
        resultMessage = 'Push! Both have Blackjack'
      } else {
        resultMessage = `Push! Both have ${playerScore}`
      }
    }
    
    setTimeout(() => {
      if (result === 'win') {
        toast.success(resultMessage)
      } else if (result === 'lose') {
        toast.error(resultMessage)
      } else {
        toast.info(resultMessage)
      }
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
            <button 
              onClick={buyChips}
              className="ml-1 text-white hover:text-gray-300 transition-colors text-lg font-bold"
            >
              +
            </button>
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

        {/* Player Hand(s) */}
        <div className="mb-6 sm:mb-8 text-center">
          {gameState.isSplit ? (
            // Split hands display
            <div className="flex gap-4 sm:gap-8 justify-center flex-wrap">
              {/* First Hand */}
              <div className={`transition-opacity ${gameState.activeSplitHand === 'second' ? 'opacity-50' : ''}`}>
                <div className={`bg-gray-900 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg inline-block mb-2 sm:mb-4 border text-sm sm:text-base ${gameState.activeSplitHand === 'first' ? 'border-blue-500' : 'border-gray-700'}`}>
                  {gameState.playerScore} Hand 1 {gameState.activeSplitHand === 'first' && '⬅️'}
                </div>
                <div className="flex gap-2 justify-center">
                  {gameState.playerHand.map((card, index) => (
                    <PlayingCard key={index} card={card} delay={0} />
                  ))}
                </div>
              </div>
              
              {/* Second Hand */}
              <div className={`transition-opacity ${gameState.activeSplitHand === 'first' ? 'opacity-50' : ''}`}>
                <div className={`bg-gray-900 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg inline-block mb-2 sm:mb-4 border text-sm sm:text-base ${gameState.activeSplitHand === 'second' ? 'border-blue-500' : 'border-gray-700'}`}>
                  {gameState.splitScore} Hand 2 {gameState.activeSplitHand === 'second' && '⬅️'}
                </div>
                <div className="flex gap-2 justify-center">
                  {gameState.splitHand && gameState.splitHand.map((card, index) => (
                    <PlayingCard key={index} card={card} delay={0} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Regular single hand display
            <>
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
            </>
          )}
        </div>

        {/* Game Controls */}
        <div className="text-center space-y-3 sm:space-y-6 mt-4 sm:mt-8">
          {gameState.gameStatus === 'betting' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="max-w-md mx-auto space-y-2 sm:space-y-4 px-4">
                <Input
                  type="number"
                  placeholder="Enter bet amount"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="text-center bg-gray-900 border-gray-700 text-white text-base sm:text-lg h-12 sm:h-14 font-bold"
                />
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button 
                    onClick={() => {
                      const current = parseInt(betAmount) || 0
                      const newAmount = Math.min(current + 25, gameState.chips)
                      setBetAmount(newAmount.toString())
                    }} 
                    variant="outline" 
                    className="bg-black border-gray-700 text-white hover:bg-gray-900 text-sm sm:text-base w-20 sm:w-24 py-3 font-semibold"
                  >
                    +25
                  </Button>
                  <Button 
                    onClick={() => {
                      const current = parseInt(betAmount) || 0
                      const newAmount = Math.min(current + 100, gameState.chips)
                      setBetAmount(newAmount.toString())
                    }} 
                    variant="outline" 
                    className="bg-black border-gray-700 text-white hover:bg-gray-900 text-sm sm:text-base w-20 sm:w-24 py-3 font-semibold"
                  >
                    +100
                  </Button>
                  <Button 
                    onClick={() => setBetAmount(gameState.chips.toString())} 
                    variant="outline" 
                    className="bg-red-600 border-red-700 text-white hover:bg-red-700 text-sm sm:text-base w-20 sm:w-24 py-3 font-semibold"
                  >
                    All In
                  </Button>
                  <Button 
                    onClick={() => setBetAmount('0')} 
                    variant="outline" 
                    className="bg-black border-gray-700 text-white hover:bg-gray-900 text-sm sm:text-base w-20 sm:w-24 py-3 font-semibold"
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <Button onClick={placeBet} size="lg" className="bg-white text-black hover:bg-gray-200 px-8 sm:px-10 py-5 sm:py-7 text-lg sm:text-xl font-bold shadow-lg">
                Place Bet
              </Button>
            </div>
          )}

          {gameState.gameStatus === 'playing' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
                <Button 
                  onClick={hit} 
                  disabled={!gameState.canHit} 
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white w-24 sm:w-32 py-4 sm:py-6 text-sm sm:text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hit
                </Button>
                <Button 
                  onClick={stand} 
                  disabled={!gameState.canStand} 
                  size="lg"
                  className="bg-gray-700 hover:bg-gray-600 text-white w-24 sm:w-32 py-4 sm:py-6 text-sm sm:text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Stand
                </Button>
                <Button 
                  onClick={doubleDown} 
                  disabled={!gameState.canDouble} 
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white w-24 sm:w-32 py-4 sm:py-6 text-sm sm:text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Double
                </Button>
                <Button 
                  onClick={splitHand} 
                  disabled={!gameState.canSplit} 
                  size="lg"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white w-24 sm:w-32 py-4 sm:py-6 text-sm sm:text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Split
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
                <DialogContent className="bg-gray-900 text-white border-gray-700 max-h-[85vh] flex flex-col">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-white">AI Blackjack Advisor</DialogTitle>
                  </DialogHeader>
                  <div className="whitespace-pre-wrap text-gray-300 overflow-y-auto max-h-[60vh] pr-2">
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
                <Button onClick={newGame} size="lg" className="bg-white text-black hover:bg-gray-200 w-40 sm:w-48 py-4 sm:py-6 text-base sm:text-lg font-bold">
                  New Game
                </Button>
                {gameState.chips < 10 && (
                  <Button onClick={buyChips} variant="outline" size="lg" className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800 w-40 sm:w-48 py-4 sm:py-6 text-base sm:text-lg font-bold">
                    Buy Chips
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
