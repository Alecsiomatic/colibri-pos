import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/mysql-db";
import { getCurrentUser } from "@/lib/auth-simple";

// GET - Obtener información empresarial
export async function GET(request: NextRequest) {
  try {
    // Permitir acceso a cualquier usuario autenticado para leer la información
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener configuración empresarial
    const query = `SELECT * FROM business_info LIMIT 1`;
    const result = await executeQuery(query);
    
    let businessInfo = null;
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
        google_maps_api_key: row.google_maps_api_key || null,
        enable_driver_tracking: row.enable_driver_tracking !== undefined ? Boolean(row.enable_driver_tracking) : true,
        delivery_radius_km: row.delivery_radius_km || 10.0,
        openai_api_key: row.openai_api_key || null,
        openai_model: row.openai_model || 'gpt-3.5-turbo',
        enable_ai_reports: row.enable_ai_reports !== undefined ? Boolean(row.enable_ai_reports) : false
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
        google_maps_api_key: null,
        enable_driver_tracking: true,
        delivery_radius_km: 10.0,
        openai_api_key: null,
        openai_model: 'gpt-3.5-turbo',
        enable_ai_reports: false
      };
    }

    return NextResponse.json({ success: true, businessInfo });
  } catch (error: any) {
    console.error('Error en /api/admin/business-info GET:', error);
    return NextResponse.json({ 
      error: "Error al obtener información empresarial", 
      details: error?.message 
    }, { status: 500 });
  }
}

// POST - Guardar información empresarial
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { businessInfo } = await request.json();
    
    if (!businessInfo) {
      return NextResponse.json({ error: "Datos de empresa requeridos" }, { status: 400 });
    }

    // Verificar si ya existe una configuración
    const checkQuery = `SELECT id FROM business_info LIMIT 1`;
    const existing = await executeQuery(checkQuery);

    if (existing && Array.isArray(existing) && existing.length > 0) {
      // Actualizar configuración existente
      const updateQuery = `
        UPDATE business_info SET 
          name = ?, 
          slogan = ?, 
          address = ?, 
          phone = ?, 
          email = ?, 
          website = ?, 
          instagram = ?, 
          facebook = ?, 
          whatsapp = ?,
          logo_url = ?,
          google_maps_api_key = ?,
          enable_driver_tracking = ?,
          delivery_radius_km = ?,
          openai_api_key = ?,
          openai_model = ?,
          enable_ai_reports = ?,
          updated_at = NOW()
        WHERE id = ?
      `;
      
      const existingId = (existing[0] as any).id;
      await executeQuery(updateQuery, [
        businessInfo.name,
        businessInfo.slogan,
        businessInfo.address,
        businessInfo.phone,
        businessInfo.email,
        businessInfo.website,
        businessInfo.instagram,
        businessInfo.facebook,
        businessInfo.whatsapp,
        businessInfo.logo_url,
        businessInfo.google_maps_api_key,
        businessInfo.enable_driver_tracking,
        businessInfo.delivery_radius_km,
        businessInfo.openai_api_key,
        businessInfo.openai_model,
        businessInfo.enable_ai_reports,
        existingId
      ]);
    } else {
      // Crear nueva configuración
      const insertQuery = `
        INSERT INTO business_info (
          name, slogan, address, phone, email, website, 
          instagram, facebook, whatsapp, logo_url, 
          google_maps_api_key, enable_driver_tracking, delivery_radius_km,
          openai_api_key, openai_model, enable_ai_reports,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      await executeQuery(insertQuery, [
        businessInfo.name,
        businessInfo.slogan,
        businessInfo.address,
        businessInfo.phone,
        businessInfo.email,
        businessInfo.website,
        businessInfo.instagram,
        businessInfo.facebook,
        businessInfo.whatsapp,
        businessInfo.logo_url,
        businessInfo.google_maps_api_key,
        businessInfo.enable_driver_tracking,
        businessInfo.delivery_radius_km,
        businessInfo.openai_api_key,
        businessInfo.openai_model,
        businessInfo.enable_ai_reports
      ]);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Información empresarial guardada correctamente" 
    });
  } catch (error: any) {
    console.error('Error en /api/admin/business-info POST:', error);
    return NextResponse.json({ 
      error: "Error al guardar información empresarial", 
      details: error?.message 
    }, { status: 500 });
  }
}