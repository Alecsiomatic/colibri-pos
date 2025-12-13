"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Session } from "@supabase/supabase-js"

export default function SessionDebug() {
  const [clientSession, setClientSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        console.log("Client session:", session)
        console.log("Session error:", error)
        setClientSession(session)
      } catch (error) {
        console.error("Error getting session:", error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session)
      setClientSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  if (process.env.NODE_ENV !== "development") return null

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Session Debug</h3>
      <p>Loading: {loading ? "Yes" : "No"}</p>
      <p>Client Session: {clientSession ? "✅ Active" : "❌ None"}</p>
      {clientSession && (
        <>
          <p>Email: {clientSession.user.email}</p>
          <p>ID: {clientSession.user.id}</p>
        </>
      )}
    </div>
  )
}
