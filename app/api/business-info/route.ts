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
        logo_url: row.logo_url || null
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
        logo_url: null
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
      logo_url: null
    };
    
    return NextResponse.json({ success: true, businessInfo: defaultBusinessInfo });
  }
}