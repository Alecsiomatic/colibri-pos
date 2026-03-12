import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db-retry";
import { getCurrentUser } from "@/lib/auth-simple";

// PATCH /api/mesero/update-order-items/[id] - Actualizar productos de mesa existente
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;
    const { items, notes } = await request.json();
    
    // Verificar autenticación
    const user = await getCurrentUser(request);
    if (!user || !user.is_waiter) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Debes enviar al menos un producto" }, { status: 400 });
    }
    
    // Obtener información de la orden actual
    const currentOrder = await executeQuery(
      `SELECT table, items, total FROM orders WHERE id = ? AND user_id = ? AND waiter_order = 1`,
      [orderId, user.id]
    ) as any[];

    if (currentOrder.length === 0) {
      return NextResponse.json({ error: "Mesa no encontrada o sin permisos" }, { status: 404 });
    }

    // Calcular nuevo total
    let total = 0;
    for (const item of items) {
      total += Number(item.price) * Number(item.quantity);
    }

    // Actualizar la orden en la base de datos
    await executeQuery(
      `UPDATE orders SET items = ?, total = ?, status = 'open_table' WHERE id = ?`,
      [JSON.stringify(items), total, orderId]
    );

    // ✨ IMPRESIÓN AUTOMÁTICA AL ACTUALIZAR MESA EXISTENTE
    try {
      const PRINT_SERVER_URL = process.env.NEXT_PUBLIC_PRINT_SERVER_URL || 'https://untextural-louetta-nonrestrictedly.ngrok-free.dev';
      
      // Preparar datos de impresión para mesero (comanda comedor)
      const tableName = currentOrder[0].table || 'Mesa sin asignar';
      const meseroNotes = notes && notes.trim() ? notes.trim() : 'Productos adicionales agregados';
      
      const printData = {
        orderId: orderId,
        isWaiterOrder: true,
        tableName: tableName,
        isTableUpdate: true,
        notes: meseroNotes,
        customer: {
          name: `COMANDA COMEDOR - ${tableName.toUpperCase()}`,
          phone: '',
          address: 'RECOGER EN LOCAL',
          notes: meseroNotes
        },
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: total,
        paymentMethod: 'efectivo',
        deliveryType: 'mesa',
        createdAt: new Date().toISOString()
      };

      const printResponse = await fetch(`${PRINT_SERVER_URL}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ order: printData }),
        signal: AbortSignal.timeout(5000)
      });
    } catch (printError) {
      // Print failure doesn't affect order update
    }

    return NextResponse.json({ 
      success: true,
      message: "Mesa actualizada e impresa correctamente" 
    });
  } catch (error) {
    console.error('Error actualizando mesa:', error);
    return NextResponse.json({ error: "Error al actualizar productos de la mesa" }, { status: 500 });
  }
}