import { executeQuery } from '@/lib/mysql-db'

let migrated = false

export async function ensureCajaMigrations() {
  if (migrated) return
  migrated = true

  try {
    // Add tip column to payments
    await executeQuery(
      `ALTER TABLE payments ADD COLUMN IF NOT EXISTS tip DECIMAL(10,2) DEFAULT 0`,
      []
    ).catch(() => {})

    // Add waiter_name to payments for easier queries
    await executeQuery(
      `ALTER TABLE payments ADD COLUMN IF NOT EXISTS waiter_name VARCHAR(100) DEFAULT NULL`,
      []
    ).catch(() => {})

    // Add total_tips to cash_shifts
    await executeQuery(
      `ALTER TABLE cash_shifts ADD COLUMN IF NOT EXISTS total_tips DECIMAL(10,2) DEFAULT 0`,
      []
    ).catch(() => {})

    // Add shortage_alert_threshold to business_info
    await executeQuery(
      `ALTER TABLE business_info ADD COLUMN IF NOT EXISTS shortage_alert_threshold DECIMAL(10,2) DEFAULT 50`,
      []
    ).catch(() => {})
  } catch (e) {
    // Migrations already applied or table doesn't support IF NOT EXISTS
    console.log('Migrations check completed')
  }
}
