import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder-key')

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expires: number }>()

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Generate 6-digit code
    const code = generateCode()
    const expires = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Store code (expires in 10 minutes)
    verificationCodes.set(email.toLowerCase(), { code, expires })

    // Send email via Resend
    try {
      if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'placeholder-key') {
        console.log('DEMO MODE: Verification code:', code)
        // In demo mode, just return success (user can check server logs for code)
        return NextResponse.json({ success: true, message: 'Verification code sent! (Demo: check console)', demoCode: code })
      }

      await resend.emails.send({
        from: 'Blackjack Game <onboarding@resend.dev>', // Change to your verified domain
        to: email,
        subject: 'Your Blackjack Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000; color: #fff;">
            <h1 style="text-align: center; color: #fff;">🃏 Blackjack</h1>
            <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 10px; padding: 30px; margin: 20px 0;">
              <h2 style="color: #fff; margin-top: 0;">Your Verification Code</h2>
              <p style="color: #aaa; font-size: 16px;">Enter this code to verify your email:</p>
              <div style="background-color: #000; border: 2px solid #444; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #fff;">${code}</span>
              </div>
              <p style="color: #aaa; font-size: 14px;">This code will expire in 10 minutes.</p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
            </div>
          </div>
        `,
      })

      return NextResponse.json({ success: true, message: 'Verification code sent!' })
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      return NextResponse.json(
        { error: 'Failed to send email. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in send-code:', error)
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    )
  }
}

// Verify code endpoint
export async function PUT(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      )
    }

    const stored = verificationCodes.get(email.toLowerCase())

    if (!stored) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new one.' },
        { status: 400 }
      )
    }

    if (Date.now() > stored.expires) {
      verificationCodes.delete(email.toLowerCase())
      return NextResponse.json(
        { error: 'Verification code expired. Please request a new one.' },
        { status: 400 }
      )
    }

    if (stored.code !== code) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Code is valid, remove it
    verificationCodes.delete(email.toLowerCase())

    return NextResponse.json({ success: true, message: 'Email verified!' })
  } catch (error) {
    console.error('Error in verify-code:', error)
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    )
  }
}

