import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { product, quantity } = await req.json()

    // Aquí normalmente procesaríamos la adición al carrito
    // Por ahora solo devolvemos éxito

    return NextResponse.json({
      success: true,
      message: `Producto ${product} agregado al carrito (${quantity} kg)`,
    })
  } catch (error) {
    console.error("Error al agregar al carrito:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al procesar la solicitud",
      },
      { status: 500 },
    )
  }
}
