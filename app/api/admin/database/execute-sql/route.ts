import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({
    message: 'SQL execution temporarily disabled during Supabase to MySQL migration',
    status: 'migration_in_progress',
    note: 'Use phpMyAdmin or direct MySQL connection for database operations during migration'
  })
}