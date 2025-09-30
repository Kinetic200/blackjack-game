'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

type AuthStep = 'email' | 'verify' | 'password'

export default function AuthForm() {
  const [step, setStep] = useState<AuthStep>('email')
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Please enter your email')
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        // For login, go directly to password
        setStep('password')
      } else {
        // For signup, send verification code
        const response = await fetch('/api/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        })

        const data = await response.json()

        if (!response.ok) {
          toast.error(data.error || 'Failed to send code')
        } else {
          toast.success('Verification code sent! Check your email.')
          setStep('verify')
        }
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter the 6-digit code')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/send-code', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Invalid code')
      } else {
        toast.success('Email verified! Now set your password.')
        setStep('password')
      }
    } catch {
      toast.error('Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password) {
      toast.error('Please enter a password')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (!isLogin && password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Verification screen
  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-white font-bold">Blackjack</CardTitle>
            <CardDescription className="text-gray-400 text-base">
              Enter the verification code sent to {email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-white">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={loading}
                  maxLength={6}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-center text-2xl tracking-widest font-bold"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-white text-black hover:bg-gray-200 h-12 text-base font-semibold" 
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setVerificationCode('')
                }}
                className="text-sm text-gray-400 hover:text-white transition-colors block w-full"
                disabled={loading}
              >
                Back to Email
              </button>
              <button
                type="button"
                onClick={handleSendCode}
                className="text-sm text-gray-400 hover:text-white transition-colors"
                disabled={loading}
              >
                Resend Code
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Password screen
  if (step === 'password') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-white font-bold">Blackjack</CardTitle>
            <CardDescription className="text-gray-400 text-base">
              {isLogin ? 'Enter your password' : 'Create a secure password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-white text-black hover:bg-gray-200 h-12 text-base font-semibold" 
                disabled={loading}
              >
                {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setPassword('')
                  setConfirmPassword('')
                }}
                className="text-sm text-gray-400 hover:text-white transition-colors"
                disabled={loading}
              >
                Back to Email
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Email screen (initial)
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-white font-bold">Blackjack</CardTitle>
          <CardDescription className="text-gray-400 text-base">
            {isLogin ? 'Sign in to your account' : 'Create a new account and get 500 free chips!'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-white text-black hover:bg-gray-200 h-12 text-base font-semibold" 
              disabled={loading}
            >
              {loading ? 'Loading...' : isLogin ? 'Continue' : 'Send Code'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setStep('email')
                setEmail('')
                setPassword('')
                setConfirmPassword('')
                setVerificationCode('')
              }}
              className="text-sm text-gray-400 hover:text-white transition-colors"
              disabled={loading}
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
