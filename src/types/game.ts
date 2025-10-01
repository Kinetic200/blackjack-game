export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export interface Card {
  suit: Suit
  rank: Rank
  value: number
}

export interface GameState {
  playerHand: Card[]
  dealerHand: Card[]
  playerScore: number
  dealerScore: number
  gameStatus: 'betting' | 'playing' | 'dealer-turn' | 'finished'
  result: 'win' | 'lose' | 'push' | null
  currentBet: number
  chips: number
  canHit: boolean
  canStand: boolean
  canDouble: boolean
  canSplit: boolean
  showDealerCard: boolean
  hasDoubled: boolean
  // Split-specific fields
  isSplit: boolean
  splitHand: Card[] | null
  splitScore: number
  activeSplitHand: 'first' | 'second' | null
  splitResults: { first: 'win' | 'lose' | 'push' | null; second: 'win' | 'lose' | 'push' | null }
}

export interface GameHistory {
  id: string
  betAmount: number
  playerHand: Card[]
  dealerHand: Card[]
  playerScore: number
  dealerScore: number
  result: 'win' | 'lose' | 'push'
  chipsChange: number
  createdAt: string
}

export interface User {
  id: string
  email: string
  chips: number
}
