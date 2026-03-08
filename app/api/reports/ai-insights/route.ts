import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `Eres un consultor experto en negocios de restaurantes. Tu nombre es Colibrí IA.
Analizas datos de ventas y das recomendaciones accionables, claras y breves.

Reglas:
- Responde SIEMPRE en español
- Sé conciso (máximo 200 palabras)
- Usa datos concretos cuando los tengas disponibles
- Da recomendaciones específicas, no genéricas
- Usa formato de lista cuando sea apropiado
- Si te preguntan algo fuera del ámbito de restaurantes/negocio, redirige amablemente
- Los montos están en pesos mexicanos (MXN)
- Cuando menciones cifras usa formato: $1,234`

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: true,
        message: '⚠️ Asistente IA no configurado.\n\nPara activar el asistente, agrega tu API Key de OpenAI:\n\n1. Abre el archivo .env.local\n2. Agrega: OPENAI_API_KEY=sk-...\n3. Reinicia el servidor\n\nPuedes obtener tu key en: platform.openai.com'
      })
    }

    const body = await request.json()
    const { message, context, history } = body

    if (!message || typeof message !== 'string' || message.length > 1000) {
      return NextResponse.json({ success: false, error: 'Mensaje inválido' }, { status: 400 })
    }

    const contextBlock = context ? `
DATOS DEL RESTAURANTE (últimos ${context.days} días):
- Ingresos totales: $${context.total_revenue?.toLocaleString() ?? 0} MXN
- Total pedidos: ${context.total_orders ?? 0}
- Ticket promedio: $${context.avg_ticket?.toLocaleString() ?? 0} MXN
- Top productos: ${context.top_products?.map((p: any) => `${p.name} (${p.qty} uds, $${p.rev})`).join(', ') || 'Sin datos'}
- Canales: ${context.channels?.map((c: any) => `${c.channel}: ${c.orders} pedidos, $${c.rev}`).join(' | ') || 'Sin datos'}
- Horas pico: ${context.peak_hours?.map((h: any) => `${h.hour}:00 (${h.orders} pedidos)`).join(', ') || 'Sin datos'}
- Mejores días: ${context.best_days?.map((d: any) => `${d.day}: $${d.rev}`).join(', ') || 'Sin datos'}
` : 'No hay datos de contexto disponibles.'

    const chatHistory = (history || [])
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .slice(-6)
      .map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: String(m.content).slice(0, 500),
      }))

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT + '\n\n' + contextBlock,
      messages: [
        ...chatHistory,
        { role: 'user' as const, content: message.slice(0, 1000) },
      ],
      maxOutputTokens: 500,
      temperature: 0.7,
    })

    return NextResponse.json({ success: true, message: text })
  } catch (error: any) {
    console.error('AI Insights error:', error)
    
    if (error?.message?.includes('API key')) {
      return NextResponse.json({
        success: true,
        message: '⚠️ API Key de OpenAI inválida. Verifica tu configuración en .env.local'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Error al procesar consulta IA' },
      { status: 500 }
    )
  }
}
