import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-simple'
import { executeQuery } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user || !user.is_driver) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Devolver datos directamente del usuario
    return NextResponse.json({
      driver: {
        id: user.id,
        name: user.username,
        email: user.email,
        is_active: user.is_driver,
        is_available: true
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.username,
        username: user.username
      }
    })
  } catch (error) {
    console.error('Error getting driver info:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
