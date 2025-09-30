import { NextRequest, NextResponse } from 'next/server'
import { getBlackjackAdvice } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const { playerHand, dealerUpCard, currentBet, chips } = await request.json()

    if (!playerHand || !dealerUpCard) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const advice = await getBlackjackAdvice(playerHand, dealerUpCard, currentBet, chips)

    return NextResponse.json({ advice })
  } catch (error) {
    console.error('Error getting AI advice:', error)
    return NextResponse.json(
      { error: 'Failed to get AI advice' },
      { status: 500 }
    )
  }
}
