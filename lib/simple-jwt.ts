// Asegurar que el archivo simple-jwt.ts funcione correctamente

import { createHash } from "crypto"

export type JwtPayload = {
  id: number
  username: string
  isAdmin: boolean
  exp?: number
  iat?: number
}

// Función para codificar en base64url
function base64UrlEncode(str: string): string {
  return Buffer.from(str).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

// Función para decodificar base64url
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/")
  while (str.length % 4) {
    str += "="
  }
  return Buffer.from(str, "base64").toString()
}

// Crear un token JWT simplificado
export function createToken(payload: JwtPayload, secret: string, expiresIn = 604800): string {
  const now = Math.floor(Date.now() / 1000)

  const header = {
    alg: "HS256",
    typ: "JWT",
  }

  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  }

  const headerStr = base64UrlEncode(JSON.stringify(header))
  const payloadStr = base64UrlEncode(JSON.stringify(jwtPayload))

  const signature = createHash("sha256").update(`${headerStr}.${payloadStr}.${secret}`).digest("hex")
  const signatureBase64 = base64UrlEncode(signature)

  return `${headerStr}.${payloadStr}.${signatureBase64}`
}

// Verificar un token JWT simplificado
export function verifyToken(token: string, secret: string): JwtPayload | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) {
      return null
    }

    const [headerStr, payloadStr, signatureStr] = parts

    // Verificar la firma
    const expectedSignature = createHash("sha256").update(`${headerStr}.${payloadStr}.${secret}`).digest("hex")
    const expectedSignatureBase64 = base64UrlEncode(expectedSignature)

    if (expectedSignatureBase64 !== signatureStr) {
      return null
    }

    // Decodificar el payload
    const payload = JSON.parse(base64UrlDecode(payloadStr)) as JwtPayload

    // Verificar la expiración
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      return null
    }

    return payload
  } catch (error) {
    console.error("Error al verificar token:", error)
    return null
  }
}
