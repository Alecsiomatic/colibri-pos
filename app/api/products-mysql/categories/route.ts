import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db-retry";

// GET /api/products-mysql/categories
export async function GET(request: NextRequest) {
  try {
    const rows = await executeQuery(
      `SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != '' ORDER BY category ASC`
    ) as { category: string }[];
    const categories = rows.map(r => r.category);
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 });
  }
}
