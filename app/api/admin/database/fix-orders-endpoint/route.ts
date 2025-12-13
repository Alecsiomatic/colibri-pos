import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({
    message: 'Orders endpoint fix temporarily disabled during Supabase to MySQL migration',
    status: 'migration_in_progress',
    note: 'Orders system has been migrated to MySQL and should be working correctly'
  })
}