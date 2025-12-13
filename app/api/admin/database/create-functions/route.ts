import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({
    message: 'Database functions creation temporarily disabled during Supabase to MySQL migration',
    status: 'migration_in_progress'
  })
}