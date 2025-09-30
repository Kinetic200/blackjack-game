import { GoogleGenerativeAI } from '@google/generative-ai'
import { Card } from '@/types/game'
import { calculateHandValue } from './gameLogic'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'placeholder-key')

export async function getBlackjackAdvice(
  playerHand: Card[],
  dealerUpCard: Card,
  currentBet: number,
  chips: number
): Promise<string> {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'placeholder-key') {
      throw new Error('Gemini API key not configured')
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const playerScore = calculateHandValue(playerHand)
    const dealerValue = dealerUpCard.rank === 'A' ? 11 : dealerUpCard.value

    const prompt = `You are a professional blackjack advisor. Please provide advice for this blackjack hand:

Player Hand: ${playerHand.map(card => `${card.rank} of ${card.suit}`).join(', ')}
Player Score: ${playerScore}
Dealer Up Card: ${dealerUpCard.rank} of ${dealerUpCard.suit} (value: ${dealerValue})
Current Bet: ${currentBet} chips
Remaining Chips: ${chips}

Please provide:
1. Your recommended action (Hit or Stand)
2. A brief explanation of your reasoning
3. Any additional strategic considerations

Keep your response concise and helpful for a player learning blackjack strategy.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error getting AI advice:', error)
    return "I'm unable to provide advice right now. As a general rule: Hit if your total is 11 or less, stand if it's 17 or more, and be cautious with hands between 12-16 depending on the dealer's up card."
  }
}
