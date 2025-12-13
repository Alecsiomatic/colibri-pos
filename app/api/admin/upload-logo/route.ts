import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { getCurrentUser } from "@/lib/auth-simple";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Tipo de archivo no válido. Use JPG, PNG, GIF o WEBP" 
      }, { status: 400 });
    }

    // Validar tamaño (máximo 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "El archivo es muy grande. Máximo 2MB" 
      }, { status: 400 });
    }

    // Crear directorio si no existe
    const uploadDir = path.join(process.cwd(), "public", "uploads", "business");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const extension = path.extname(file.name);
    const fileName = `logo-${timestamp}${extension}`;
    const filePath = path.join(uploadDir, fileName);

    // Convertir archivo a buffer y guardarlo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // URL pública del logo
    const logoUrl = `/uploads/business/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      logoUrl,
      message: "Logo subido exitosamente" 
    });

  } catch (error: any) {
    console.error('Error en /api/admin/upload-logo:', error);
    return NextResponse.json({ 
      error: "Error al subir el logo", 
      details: error?.message 
    }, { status: 500 });
  }
}