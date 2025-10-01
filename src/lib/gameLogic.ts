import { Card, Rank, Suit } from '@/types/game'

// Create a card with proper value calculation
export function createCard(suit: Suit, rank: Rank): Card {
  let value: number
  
  if (rank === 'A') {
    value = 11 // Ace starts as 11, will be adjusted in hand calculation
  } else if (['J', 'Q', 'K'].includes(rank)) {
    value = 10
  } else {
    value = parseInt(rank)
  }
  
  return { suit, rank, value }
}

// Generate a random card (infinite deck simulation)
export function drawCard(): Card {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  
  const randomSuit = suits[Math.floor(Math.random() * suits.length)]
  const randomRank = ranks[Math.floor(Math.random() * ranks.length)]
  
  return createCard(randomSuit, randomRank)
}

// Calculate the best possible score for a hand
export function calculateHandValue(hand: Card[]): number {
  let score = 0
  let aces = 0
  
  // Count non-ace cards and aces
  for (const card of hand) {
    if (card.rank === 'A') {
      aces++
      score += 11 // Start with ace as 11
    } else {
      score += card.value
    }
  }
  
  // Adjust aces from 11 to 1 if needed
  while (score > 21 && aces > 0) {
    score -= 10 // Convert ace from 11 to 1
    aces--
  }
  
  return score
}

// Check if hand is blackjack (21 with 2 cards)
export function isBlackjack(hand: Card[]): boolean {
  return hand.length === 2 && calculateHandValue(hand) === 21
}

// Check if hand is bust
export function isBust(hand: Card[]): boolean {
  return calculateHandValue(hand) > 21
}

// Determine game result
export function determineResult(
  playerHand: Card[],
  dealerHand: Card[]
): 'win' | 'lose' | 'push' {
  const playerScore = calculateHandValue(playerHand)
  const dealerScore = calculateHandValue(dealerHand)
  const playerBlackjack = isBlackjack(playerHand)
  const dealerBlackjack = isBlackjack(dealerHand)
  
  console.log('🎯 Determining result:')
  console.log('   Player hand:', playerHand.map(c => `${c.rank}${c.suit[0]}`).join(' '))
  console.log('   Player score:', playerScore)
  console.log('   Dealer hand:', dealerHand.map(c => `${c.rank}${c.suit[0]}`).join(' '))
  console.log('   Dealer score:', dealerScore)
  
  // Player bust
  if (isBust(playerHand)) {
    console.log('   → Player busted, result: LOSE')
    return 'lose'
  }
  
  // Dealer bust
  if (isBust(dealerHand)) {
    console.log('   → Dealer busted, result: WIN')
    return 'win'
  }
  
  // Both have blackjack
  if (playerBlackjack && dealerBlackjack) {
    console.log('   → Both blackjack, result: PUSH')
    return 'push'
  }
  
  // Player has blackjack, dealer doesn't
  if (playerBlackjack && !dealerBlackjack) {
    console.log('   → Player blackjack, result: WIN')
    return 'win'
  }
  
  // Dealer has blackjack, player doesn't
  if (dealerBlackjack && !playerBlackjack) {
    console.log('   → Dealer blackjack, result: LOSE')
    return 'lose'
  }
  
  // Compare scores
  if (playerScore > dealerScore) {
    console.log('   → Player score higher, result: WIN')
    return 'win'
  } else if (playerScore < dealerScore) {
    console.log('   → Dealer score higher, result: LOSE')
    return 'lose'
  } else {
    console.log('   → Equal scores, result: PUSH')
    return 'push'
  }
}

// Calculate payout based on result
export function calculatePayout(
  bet: number,
  result: 'win' | 'lose' | 'push',
  isPlayerBlackjack: boolean = false
): number {
  switch (result) {
    case 'win':
      // Blackjack pays 3:2, regular win pays 1:1
      return isPlayerBlackjack ? Math.floor(bet * 1.5) : bet
    case 'lose':
      return -bet
    case 'push':
      return 0
    default:
      return 0
  }
}

// Check if dealer should hit (dealer hits on 16 or less, stands on 17 or more)
export function shouldDealerHit(hand: Card[]): boolean {
  return calculateHandValue(hand) < 17
}

// Check if player can double down (only on first two cards)
export function canDoubleDown(hand: Card[], chips: number, currentBet: number): boolean {
  return hand.length === 2 && chips >= currentBet
}

// Check if player can split (two cards of same rank)
export function canSplit(hand: Card[], chips: number, currentBet: number): boolean {
  return hand.length === 2 && hand[0].rank === hand[1].rank && chips >= currentBet
}
