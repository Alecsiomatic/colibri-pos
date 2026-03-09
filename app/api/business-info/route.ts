import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/mysql-db";

// GET - Obtener información empresarial para tickets (sin autenticación estricta)
export async function GET(request: NextRequest) {
  try {
    // Obtener configuración empresarial
    const query = `SELECT * FROM business_info LIMIT 1`;
    const result = await executeQuery(query);
    
    let businessInfo;
    if (result && Array.isArray(result) && result.length > 0) {
      const row = result[0] as any;
      businessInfo = {
        name: row.name || 'SUPER NOVA',
        slogan: row.slogan || 'Restaurante & Delivery',
        address: row.address || 'Av. Principal #123',
        phone: row.phone || '(555) 123-4567',
        email: row.email || 'info@supernova.com',
        website: row.website || 'www.supernova-delivery.com',
        instagram: row.instagram || '@SuperNovaRestaurante',
        facebook: row.facebook || '@SuperNovaOficial',
        whatsapp: row.whatsapp || '+52 555 123 4567',
        logo_url: row.logo_url || null,
        shortage_alert_threshold: row.shortage_alert_threshold ?? 50
      };
    } else {
      // Valores por defecto si no existe configuración
      businessInfo = {
        name: 'SUPER NOVA',
        slogan: 'Restaurante & Delivery',
        address: 'Av. Principal #123',
        phone: '(555) 123-4567',
        email: 'info@supernova.com',
        website: 'www.supernova-delivery.com',
        instagram: '@SuperNovaRestaurante',
        facebook: '@SuperNovaOficial',
        whatsapp: '+52 555 123 4567',
        logo_url: null,
        shortage_alert_threshold: 50
      };
    }

    return NextResponse.json({ success: true, businessInfo });
  } catch (error: any) {
    console.error('Error en /api/business-info GET:', error);
    
    // En caso de error, devolver valores por defecto
    const defaultBusinessInfo = {
      name: 'SUPER NOVA',
      slogan: 'Restaurante & Delivery',
      address: 'Av. Principal #123',
      phone: '(555) 123-4567',
      email: 'info@supernova.com',
      website: 'www.supernova-delivery.com',
      instagram: '@SuperNovaRestaurante',
      facebook: '@SuperNovaOficial',
      whatsapp: '+52 555 123 4567',
      logo_url: null,
      shortage_alert_threshold: 50
    };
    
    return NextResponse.json({ success: true, businessInfo: defaultBusinessInfo });
  }
}

// PATCH - Actualizar campos de configuración empresarial
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const allowedFields = ['shortage_alert_threshold']
    const updates: string[] = []
    const values: any[] = []

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`)
        values.push(body[field])
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No hay campos para actualizar' }, { status: 400 })
    }

    await executeQuery(`UPDATE business_info SET ${updates.join(', ')} LIMIT 1`, values)

    return NextResponse.json({ success: true, message: 'Configuración actualizada' })
  } catch (error: any) {
    console.error('Error en /api/business-info PATCH:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}