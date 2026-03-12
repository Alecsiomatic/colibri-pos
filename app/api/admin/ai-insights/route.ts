import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { reportData, period, analysisType = 'business', completeData } = await request.json()
    
    // Obtener configuración de OpenAI
    const businessResult = await executeQuery<any>(
      'SELECT openai_api_key, openai_model, enable_ai_reports FROM business_info WHERE id = 1'
    )
    
    const businessInfo = businessResult[0]
    
    if (!businessInfo || !businessInfo.enable_ai_reports || !businessInfo.openai_api_key) {
      return NextResponse.json(
        { error: 'OpenAI no está configurado' },
        { status: 400 }
      )
    }

    
    const openai = new OpenAI({
      apiKey: businessInfo.openai_api_key
    })
    
    // Preparar datos completos para el análisis
    const analysisData = {
      period: `${period} días`,
      totalRevenue: reportData.totalRevenue,
      totalOrders: reportData.totalOrders,
      averageTicket: reportData.averageTicket,
      topProducts: reportData.topProducts.slice(0, 5),
      dailyTrend: reportData.dailySales?.slice(0, 7) || [],
      peakHours: reportData.hourlyPattern.sort((a: any, b: any) => b.orders - a.orders).slice(0, 3),
      // Datos adicionales completos
      dailyDetails: completeData?.dailyDetails?.slice(0, 7) || [],
      salesByTable: completeData?.salesByTable?.slice(0, 10) || [],
      salesByWaiter: completeData?.salesByWaiter?.slice(0, 10) || [],
      dailyCut: completeData?.dailyCut || {},
      paymentMethods: reportData.paymentMethods || []
    }
    
    // Diferentes tipos de prompts según el análisis solicitado
    let prompt = ''
    
    if (analysisType === 'business') {
      prompt = `
Como Senior Business Analyst especializado en restaurantes, realiza un análisis completo de este negocio:

📊 DATOS DEL NEGOCIO (${analysisData.period}):
• Ingresos Totales: $${analysisData.totalRevenue}
• Pedidos Totales: ${analysisData.totalOrders}
• Ticket Promedio: $${analysisData.averageTicket}

🍽️ PRODUCTOS TOP:
${analysisData.topProducts.map((p: any, i: number) => 
  `${i + 1}. ${p.name}: ${p.quantity} unidades → $${p.revenue}`
).join('\n')}

📅 ANÁLISIS DIARIO:
${analysisData.dailyDetails.map((d: any) => 
  `${d.date}: ${d.orders_count} órdenes, $${d.daily_revenue} (${d.delivery_orders} delivery, ${d.pickup_orders} pickup)`
).join('\n')}

🏪 VENTAS POR MESA:
${analysisData.salesByTable.map((t: any) => 
  `${t.table_name}: ${t.orders_count} órdenes → $${t.table_revenue}`
).join('\n')}

👨‍💼 VENTAS POR MESERO:
${analysisData.salesByWaiter.map((w: any) => 
  `${w.waiter_name}: ${w.orders_served} órdenes → $${w.waiter_revenue}`
).join('\n')}

💳 MÉTODOS DE PAGO:
${analysisData.paymentMethods.map((p: any) => 
  `${p.method}: ${p.count} transacciones → $${p.revenue}`
).join('\n')}

PROPORCIONA ANÁLISIS EJECUTIVO:
1. 🎯 RESUMEN EJECUTIVO (estado general del negocio)
2. 📈 PERFORMANCE HIGHLIGHTS (métricas clave y comparaciones)
3. 🔍 INSIGHTS CRÍTICOS (patrones importantes detectados)
4. ⚡ OPORTUNIDADES INMEDIATAS (acciones de alto impacto)
5. 📊 RECOMENDACIONES ESTRATÉGICAS (crecimiento a mediano plazo)
`
    } else if (analysisType === 'predictions') {
      prompt = `
Como Data Scientist especializado en forecasting para restaurantes, analiza estos datos y genera predicciones:

📊 DATOS HISTÓRICOS (${analysisData.period}):
• Revenue: $${analysisData.totalRevenue}
• Órdenes: ${analysisData.totalOrders}
• Tendencia: ${analysisData.dailyTrend.map((d: any) => `$${d.revenue}`).join(' → ')}

� GENERA PREDICCIONES DETALLADAS:
1. 📈 PROYECCIONES DE VENTAS (próximos 30 días)
2. 🎯 DEMANDA POR PRODUCTOS (cuáles crecerán/decrecerán)
3. ⏰ PATRONES ESTACIONALES (horas/días de mayor demanda)
4. 💰 ESTIMACIONES DE REVENUE (proyección realista)
5. 🚨 ALERTAS Y RIESGOS (qué vigilar)
6. 🎲 ESCENARIOS (optimista, realista, pesimista)

Usa matemáticas y estadística. Sé preciso con números y porcentajes.
`
    } else if (analysisType === 'recommendations') {
      prompt = `
Como Business Consultant especializado en optimización de restaurantes, proporciona un plan de acción:

💼 SITUACIÓN ACTUAL:
• Revenue: $${analysisData.totalRevenue} en ${analysisData.period}
• ${analysisData.totalOrders} órdenes completadas
• Ticket promedio: $${analysisData.averageTicket}

🎯 PLAN DE ACCIÓN DETALLADO:

1. 🚀 ACCIONES INMEDIATAS (implementar esta semana):
   - Específicas y medibles
   - Con impacto en revenue
   
2. 📈 OPTIMIZACIONES A 30 DÍAS:
   - Estrategias de pricing
   - Mejoras operacionales
   
3. 🎪 INICIATIVAS DE CRECIMIENTO:
   - Nuevas líneas de producto
   - Expansión de mercado
   
4. 📊 MÉTRICAS A MONITOREAR:
   - KPIs clave
   - Frecuencia de revisión
   
5. 💡 INNOVACIONES SUGERIDAS:
   - Tecnología
   - Procesos
   
Cada recomendación debe incluir: objetivo, timeline, costo estimado, ROI esperado.
`
    }
    
    // Prompt base anterior como fallback
    if (!prompt) {
      prompt = `
Como experto consultor de restaurantes, analiza estos datos de negocio y proporciona insights accionables:

PERÍODO: ${analysisData.period}
INGRESOS TOTALES: $${analysisData.totalRevenue}
PEDIDOS TOTALES: ${analysisData.totalOrders}
TICKET PROMEDIO: $${analysisData.averageTicket}

Proporciona un análisis detallado con recomendaciones específicas.
`
    }
    

    const completion = await openai.chat.completions.create({
      model: businessInfo.openai_model || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un consultor experto en restaurantes y delivery. Proporciona análisis prácticos y accionables basados en datos reales.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
    
    const insights = completion.choices[0]?.message?.content || 'No se pudieron generar insights'
    
    return NextResponse.json({ insights })
    
  } catch (error) {
    console.error('Error generating AI insights:', error)
    return NextResponse.json(
      { error: 'Error al generar insights con IA' },
      { status: 500 }
    )
  }
}