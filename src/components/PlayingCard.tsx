'use client'

import { Card } from '@/types/game'
import { useState, useEffect } from 'react'

interface PlayingCardProps {
  card: Card
  faceDown?: boolean
  delay?: number
}

export default function PlayingCard({ card, faceDown = false, delay = 0 }: PlayingCardProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥️'
      case 'diamonds': return '♦️'
      case 'clubs': return '♣️'
      case 'spades': return '♠️'
      default: return ''
    }
  }

  const getSuitColor = (suit: string) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-black'
  }

  return (
    <div 
      className={`
        w-14 h-20 sm:w-20 sm:h-28 bg-white rounded-lg border-2 border-gray-300 
        flex flex-col justify-between p-1 sm:p-2 shadow-lg
        transition-all duration-500 transform
        ${isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
        ${faceDown ? 'bg-blue-800' : 'bg-white'}
      `}
      style={{
        animationDelay: `${delay}ms`
      }}
    >
      {faceDown ? (
        <div className="w-full h-full bg-white rounded flex items-center justify-center">
          <div className="text-gray-600 text-3xl sm:text-4xl font-bold">?</div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center relative">
          {/* Top left rank */}
          <div className={`absolute top-1 left-1 text-xs sm:text-sm font-bold ${getSuitColor(card.suit)}`}>
            {card.rank}
          </div>
          
          {/* Center suit symbol */}
          <div className={`text-2xl sm:text-3xl ${getSuitColor(card.suit)}`}>
            {getSuitSymbol(card.suit)}
          </div>
          
          {/* Bottom right rank (upside down) */}
          <div className={`absolute bottom-1 right-1 text-xs sm:text-sm font-bold ${getSuitColor(card.suit)} transform rotate-180`}>
            {card.rank}
          </div>
        </div>
      )}
    </div>
  )
}
