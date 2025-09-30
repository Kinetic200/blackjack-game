'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { User as GameUser } from '@/types/game'

interface AuthContextType {
  user: User | null
  gameUser: GameUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateChips: (newChips: number) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [gameUser, setGameUser] = useState<GameUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchGameUser(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, 'User:', session?.user?.email)
      setUser(session?.user ?? null)
      if (session?.user) {
        console.log('👤 Fetching game user for:', session.user.id)
        await fetchGameUser(session.user.id)
      } else {
        setGameUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // fetchGameUser is stable, no need to include

  const fetchGameUser = async (userId: string) => {
    try {
      console.log('📊 Fetching user data from database for ID:', userId)
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError && fetchError.code === 'PGRST116') {
        // User doesn't exist, create new user with 500 chips
        console.log('🆕 User not found in DB, creating new user with 500 chips')
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([
            {
              id: userId,
              email: user?.email || '',
              chips: 500
            }
          ])
          .select()
          .single()

        if (createError) {
          console.error('❌ Error creating user - Full error:', createError)
          console.error('   Error code:', createError.code)
          console.error('   Error message:', createError.message)
          console.error('   Error details:', createError.details)
          console.error('   Error hint:', createError.hint)
          setLoading(false)
          return
        }

        console.log('✅ New user created successfully!')
        setGameUser({
          id: newUser.id,
          email: newUser.email,
          chips: newUser.chips
        })
      } else if (fetchError) {
        console.error('❌ Error fetching user:', fetchError)
        setLoading(false)
        return
      }

      if (userData) {
        console.log('✅ User data loaded, chips:', userData.chips)
        setGameUser({
          id: userData.id,
          email: userData.email,
          chips: userData.chips
        })
      } else {
        console.log('⚠️ No user data, setting loading to false')
        setLoading(false)
      }
    } catch (error) {
      console.error('❌ Error in fetchGameUser:', error)
    } finally {
      console.log('🏁 fetchGameUser complete, setting loading to false')
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateChips = async (newChips: number) => {
    if (!user) return

    const { error } = await supabase
      .from('users')
      .update({ chips: newChips, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (!error && gameUser) {
      setGameUser({ ...gameUser, chips: newChips })
    }
  }

  const value = {
    user,
    gameUser,
    loading,
    signIn,
    signUp,
    signOut,
    updateChips,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
