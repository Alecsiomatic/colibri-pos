import { executeQuery as mysqlExecuteQuery } from "./mysql-db"

type QueryParams = any[]

export async function executeQuery(query: string, params: QueryParams = [], retries = 3, baseDelayMs = 250) {
  let attempt = 0
  while (true) {
    try {
      return await mysqlExecuteQuery(query, params)
    } catch (err: any) {
      attempt++
      const isLast = attempt > retries

      // If it's a connection timeout or network error, retry
      const retryable = err?.code === 'ETIMEDOUT' || err?.errno === 'ETIMEDOUT' || err?.code === 'ECONNREFUSED' || err?.fatal

      if (!retryable || isLast) {
        throw err
      }

      const delay = baseDelayMs * Math.pow(2, attempt - 1)
      console.warn(`DB query failed (attempt ${attempt}/${retries}), retrying in ${delay}ms...`, err?.message || err)
      await new Promise((res) => setTimeout(res, delay))
    }
  }
}

export async function executeTransaction(queries: { query: string; params: any[] }[], retries = 3, baseDelayMs = 250) {
  let attempt = 0
  while (true) {
    try {
      // import dynamically to avoid circular issues
      const { executeTransaction: txn } = await import("./mysql-db")
      return await txn(queries)
    } catch (err: any) {
      attempt++
      const isLast = attempt > retries
      const retryable = err?.code === 'ETIMEDOUT' || err?.errno === 'ETIMEDOUT' || err?.code === 'ECONNREFUSED' || err?.fatal
      if (!retryable || isLast) throw err
      const delay = baseDelayMs * Math.pow(2, attempt - 1)
      console.warn(`DB transaction failed (attempt ${attempt}/${retries}), retrying in ${delay}ms...`, err?.message || err)
      await new Promise((res) => setTimeout(res, delay))
    }
  }
}

export default { executeQuery, executeTransaction }
