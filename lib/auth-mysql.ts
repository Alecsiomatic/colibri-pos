import jwt from 'jsonwebtoken'
import { executeQuery } from './mysql-db'

// Clave secreta para JWT (en producción debe estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'tu-clave-secreta-super-segura-cambiala-en-produccion'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tu-clave-refresh-super-segura-cambiala-en-produccion'

// Configuración de tokens
const ACCESS_TOKEN_EXPIRY = '15m' // 15 minutos
const REFRESH_TOKEN_EXPIRY = '7d' // 7 días

export interface UserPayload {
  id: number
  email: string
  username: string
  is_admin: boolean
  is_driver: boolean
  is_waiter: boolean
}

export interface SessionData {
  accessToken: string
  refreshToken: string
  user: UserPayload
  expiresAt: Date
}

// Generar tokens de acceso y refresh
export function generateTokens(user: UserPayload): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      username: user.username, 
      is_admin: user.is_admin,
      is_driver: user.is_driver || false,
      is_waiter: user.is_waiter || false
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  )
  
  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  )
  
  return { accessToken, refreshToken }
}

// Verificar token de acceso
export function verifyAccessToken(token: string): UserPayload | null {
  try {
    console.log('🔍 Verificando token de acceso...')
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      is_admin: decoded.is_admin,
      is_driver: decoded.is_driver || false,
      is_waiter: decoded.is_waiter || false
    }
    console.log('✅ Token válido, usuario:', user)
    return user
  } catch (error) {
    console.log('❌ Error verificando token:', error)
    return null
  }
}

// Verificar token de refresh
export function verifyRefreshToken(token: string): { id: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any
    if (decoded.type !== 'refresh') return null
    return { id: decoded.id }
  } catch (error) {
    return null
  }
}

// Crear sesión en la base de datos
async function ensureSessionTable() {
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_sessions_user_id (user_id),
        INDEX idx_user_sessions_session_token (session_token(255)),
        INDEX idx_user_sessions_refresh_token (refresh_token(255)),
        CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)
  } catch (error: any) {
    if (error?.code !== 'ER_TABLE_EXISTS_ERROR') {
      console.error('Error al asegurar la tabla user_sessions:', error)
      throw error
    }
  }
}

export async function createSession(user: UserPayload): Promise<SessionData> {
  await ensureSessionTable()
  const { accessToken, refreshToken } = generateTokens(user)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
  
  // Eliminar sesiones antiguas del usuario
  await executeQuery(
    'DELETE FROM user_sessions WHERE user_id = ? AND expires_at < NOW()',
    [user.id]
  )
  
  // Crear nueva sesión
  await executeQuery(
    'INSERT INTO user_sessions (user_id, session_token, refresh_token, expires_at) VALUES (?, ?, ?, ?)',
    [user.id, accessToken, refreshToken, expiresAt]
  )
  
  return {
    accessToken,
    refreshToken,
    user,
    expiresAt
  }
}

// Obtener sesión por token
export async function getSessionByToken(token: string): Promise<UserPayload | null> {
  try {
    await ensureSessionTable()
    const sessions = await executeQuery(
      'SELECT s.*, u.email, u.username, u.is_admin, u.is_driver, u.is_waiter FROM user_sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = ? AND s.expires_at > NOW()',
      [token]
    ) as any[]
    
    if (sessions.length === 0) return null
    
    const session = sessions[0]
    return {
      id: session.user_id,
      email: session.email,
      username: session.username,
      is_admin: session.is_admin == 1 || session.is_admin === true || session.is_admin === '1',
      is_driver: session.is_driver == 1 || session.is_driver === true || session.is_driver === '1',
      is_waiter: session.is_waiter == 1 || session.is_waiter === true || session.is_waiter === '1'
    }
  } catch (error) {
    return null
  }
}

// Renovar token usando refresh token
export async function refreshAccessToken(refreshToken: string): Promise<SessionData | null> {
  const decoded = verifyRefreshToken(refreshToken)
  if (!decoded) return null
  
  // Verificar que el refresh token existe en la base de datos
  await ensureSessionTable()
  const sessions = await executeQuery(
    'SELECT s.*, u.email, u.username, u.is_admin, u.is_driver FROM user_sessions s JOIN users u ON s.user_id = u.id WHERE s.refresh_token = ? AND s.expires_at > NOW()',
    [refreshToken]
  ) as any[]
  
  if (sessions.length === 0) return null
  
  const session = sessions[0]
  const user: UserPayload = {
    id: session.user_id,
    email: session.email,
    username: session.username,
    is_admin: session.is_admin == 1 || session.is_admin === true || session.is_admin === '1',
    is_driver: session.is_driver == 1 || session.is_driver === true || session.is_driver === '1',
    is_waiter: session.is_waiter == 1 || session.is_waiter === true || session.is_waiter === '1'
  }
  
  // Generar nuevos tokens
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  
  // Actualizar sesión
  await executeQuery(
    'UPDATE user_sessions SET session_token = ?, refresh_token = ?, expires_at = ?, updated_at = NOW() WHERE id = ?',
    [newAccessToken, newRefreshToken, expiresAt, session.id]
  )
  
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user,
    expiresAt
  }
}

// Eliminar sesión (logout)
export async function deleteSession(token: string): Promise<boolean> {
  try {
    await ensureSessionTable()
    const result = await executeQuery(
      'DELETE FROM user_sessions WHERE session_token = ?',
      [token]
    ) as any
    
    return result.affectedRows > 0
  } catch (error) {
    return false
  }
}

// Eliminar todas las sesiones de un usuario
export async function deleteAllUserSessions(userId: number): Promise<boolean> {
  try {
    await ensureSessionTable()
    await executeQuery(
      'DELETE FROM user_sessions WHERE user_id = ?',
      [userId]
    )
    return true
  } catch (error) {
    return false
  }
}

// Limpiar sesiones expiradas
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await ensureSessionTable()
    await executeQuery('DELETE FROM user_sessions WHERE expires_at < NOW()')
  } catch (error) {
    console.error('Error limpiando sesiones expiradas:', error)
  }
}