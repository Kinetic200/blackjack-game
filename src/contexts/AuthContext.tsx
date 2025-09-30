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
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
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
        const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError && fetchError.code === 'PGRST116') {
        // User doesn't exist, create new user with 500 chips
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
          console.error('Error creating user:', createError)
          setLoading(false)
          return
        }

        setGameUser({
          id: newUser.id,
          email: newUser.email,
          chips: newUser.chips
        })
      } else if (fetchError) {
        console.error('Error fetching user:', fetchError)
        setLoading(false)
        return
      }

      if (userData) {
        setGameUser({
          id: userData.id,
          email: userData.email,
          chips: userData.chips
        })
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error in fetchGameUser:', error)
    } finally {
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
