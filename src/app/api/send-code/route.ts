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

    console.log('📧 Attempting to send code to:', email)
    console.log('🔑 API Key status:', process.env.RESEND_API_KEY ? 'SET (starts with: ' + process.env.RESEND_API_KEY.substring(0, 7) + '...)' : 'NOT SET')

    // Send email via Resend
    try {
      if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'placeholder-key') {
        console.log('⚠️ DEMO MODE: Verification code:', code, 'for email:', email)
        return NextResponse.json({ 
          success: true, 
          message: 'Code sent! (Demo mode - check console)', 
          demoCode: code 
        })
      }

      console.log('📨 Sending email via Resend...')

      const emailResponse = await resend.emails.send({
        from: 'Blackjack <onboarding@resend.dev>',
        to: email,
        subject: 'Your Blackjack Game Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" style="max-width: 600px; width: 100%; background-color: #000000;">
                      <!-- Header -->
                      <tr>
                        <td style="text-align: center; padding: 20px 0;">
                          <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: bold;">🃏 Blackjack</h1>
                        </td>
                      </tr>
                      
                      <!-- Content Card -->
                      <tr>
                        <td style="padding: 0 20px;">
                          <table role="presentation" style="width: 100%; background-color: #1a1a1a; border: 1px solid #333333; border-radius: 12px;">
                            <tr>
                              <td style="padding: 40px 30px;">
                                <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px 0; font-weight: 600;">Your Verification Code</h2>
                                <p style="color: #aaaaaa; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                                  Welcome to Blackjack! Enter this code to verify your email address and start playing:
                                </p>
                                
                                <!-- Code Box -->
                                <table role="presentation" style="width: 100%;">
                                  <tr>
                                    <td align="center" style="padding: 20px 0;">
                                      <div style="background-color: #000000; border: 2px solid #444444; border-radius: 8px; padding: 24px; display: inline-block;">
                                        <span style="font-size: 42px; font-weight: bold; letter-spacing: 10px; color: #ffffff; font-family: 'Courier New', monospace;">${code}</span>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                
                                <p style="color: #aaaaaa; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
                                  ⏰ This code will expire in <strong style="color: #ffffff;">10 minutes</strong>.
                                </p>
                                <p style="color: #666666; font-size: 12px; line-height: 18px; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #333333;">
                                  If you didn't request this code, please ignore this email. Your account is secure.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="text-align: center; padding: 30px 20px;">
                          <p style="color: #666666; font-size: 12px; margin: 0;">
                            © ${new Date().getFullYear()} Blackjack Game. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      })

      if (emailResponse.error) {
        console.error('❌ Resend API error:', emailResponse.error)
        return NextResponse.json(
          { error: `Email service error: ${emailResponse.error.message || 'Unknown error'}` },
          { status: 500 }
        )
      }

      console.log('✅ Email sent successfully!')
      console.log('   Email ID:', emailResponse.data?.id)
      console.log('   Sent to:', email)

      return NextResponse.json({ success: true, message: 'Verification code sent to your email!' })
    } catch (emailError) {
      const error = emailError as Error
      console.error('❌ Email sending failed with exception:', emailError)
      console.error('   Error details:', error.message || emailError)
      console.error('   Stack:', error.stack)
      return NextResponse.json(
        { error: `Failed to send email: ${error.message || 'Please try again'}` },
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

