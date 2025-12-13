import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Database structure check temporarily disabled during Supabase to MySQL migration',
    status: 'migration_in_progress'
  })
}