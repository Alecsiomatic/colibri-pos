import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { executeQuery } from "@/lib/db-retry"  
import { verifyAccessToken, getSessionByToken } from "@/lib/auth-mysql"
import { deductStockForOrder } from "@/lib/inventory"
import { deductIngredientsForProduct, checkIngredientsAvailability } from "@/lib/ingredients"

// GET - Obtener pedidos
export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value
    if (!authToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = verifyAccessToken(authToken) || await getSessionByToken(authToken)
    if (!user) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const orderSource = searchParams.get('source')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = `
      SELECT 
        o.*, 
        u.username, 
        u.email as user_email,
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(o.customer_info, '$.name')),
          JSON_UNQUOTE(JSON_EXTRACT(o.customer_info, '$.customerName')),
          'Cliente'
        ) as customer_name,
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(o.customer_info, '$.email')),
          JSON_UNQUOTE(JSON_EXTRACT(o.customer_info, '$.customerEmail')),
          u.email
        ) as customer_email
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      WHERE 1=1
    `
    const params: any[] = []

    // Los cajeros y admins ven todos los pedidos
    // Los meseros solo ven sus mesas, los drivers solo sus deliveries
    if (!user.is_admin && (user.is_waiter || user.is_driver)) {
      query += ' AND o.user_id = ?'
      params.push(user.id)
    }

    if (status) {
      query += ' AND o.status = ?'
      params.push(status)
    }

    if (orderSource) {
      query += ' AND o.order_source = ?'
      params.push(orderSource)
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

  const orders = await executeQuery(query, params) as any[]

    // Parsear items JSON
    orders.forEach(order => {
      if (order.items) {
        try {
          order.items = JSON.parse(order.items)
        } catch (e) {
          order.items = []
        }
      }
      if (order.customer_info) {
        try {
          order.customer_info = JSON.parse(order.customer_info)
        } catch (e) {
          order.customer_info = null
        }
      }
      if (order.delivery_address) {
        try {
          order.delivery_address = JSON.parse(order.delivery_address)
        } catch (e) {
          order.delivery_address = null
        }
      }
    })

    return NextResponse.json({
      success: true,
      orders
    })
  } catch (error: any) {
    console.error("Error al obtener pedidos:", error)
    return NextResponse.json(
      { error: "Error al obtener pedidos" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar todos los pedidos (solo admin con force=true)
export async function DELETE(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value
    if (!authToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = verifyAccessToken(authToken) || await getSessionByToken(authToken)
    if (!user?.is_admin) {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const forceDelete = searchParams.get('force') === 'true'
    const confirmDelete = searchParams.get('confirm') === 'yes'
    
    if (!forceDelete || !confirmDelete) {
      return NextResponse.json(
        { error: "Para eliminar todos los pedidos use: ?force=true&confirm=yes" },
        { status: 400 }
      )
    }

    console.log('🗑️ ELIMINANDO TODOS LOS PEDIDOS...')
    
    // 1. Eliminar asignaciones de delivery
    await executeQuery('DELETE FROM driver_assignments')
    console.log('✅ Asignaciones eliminadas')
    
    // 2. Eliminar todos los pedidos
    const result = await executeQuery('DELETE FROM orders') as any
    console.log('✅ Todos los pedidos eliminados')
    
    // 3. Resetear AUTO_INCREMENT
    await executeQuery('ALTER TABLE orders AUTO_INCREMENT = 1')
    await executeQuery('ALTER TABLE driver_assignments AUTO_INCREMENT = 1')
    
    return NextResponse.json({
      success: true,
      message: `${result.affectedRows} pedidos eliminados exitosamente`,
      deleted: result.affectedRows
    })
  } catch (error: any) {
    console.error("Error al eliminar todos los pedidos:", error)
    return NextResponse.json(
      { error: "Error al eliminar pedidos", details: error.message },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo pedido
export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value
    if (!authToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = verifyAccessToken(authToken) || await getSessionByToken(authToken)
    if (!user) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
    }



    const body = await request.json();
    const items = body.items;
    const customer_info = body.customer_info || null;
    const delivery_address = body.delivery_address || null;
    const payment_method = body.payment_method || 'efectivo';
    const notes = body.notes || null;
    const orderSource = body.order_source || body.orderSource || 'online';
    const shiftId = body.shift_id || body.shiftId || null;
    const cashReceived = body.cash_received || body.cashReceived || null;
    const changeGiven = body.change_given || body.changeGiven || null;
    const orderStatus = body.status || body.orderStatus || 'pending';
    const customerName = body.customer_name || body.customerName || null;
    const customerEmail = body.customer_email || body.customerEmail || null;
    // Solo usar waiter_order y table si están presentes (mesero)
    const waiter_order = body.waiter_order || false;
    const table = body.waiter_order ? (body.table || null) : null;

    // Log de los datos recibidos para depuración
    console.log('POST /api/orders-mysql datos recibidos:', {
      items,
      customer_info,
      delivery_address,
      payment_method,
      notes,
      waiter_order,
      table,
      orderSource,
      shiftId,
      orderStatus
    });

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Los items del pedido son requeridos" },
        { status: 400 }
      )
    }

    // Calcular total y verificar disponibilidad
    let total = 0
    for (const item of items) {
      const productId = item.id || item.product_id
      const products = await executeQuery(
        'SELECT price, is_available, stock FROM products WHERE id = ?',
        [productId]
      ) as any[]

      if (products.length === 0 || !products[0].is_available) {
        return NextResponse.json(
          { error: `Producto ${productId} no disponible` },
          { status: 400 }
        )
      }

      if (products[0].stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para producto ${productId}` },
          { status: 400 }
        )
      }

      total += products[0].price * item.quantity
    }


    // Si es pedido de mesero, buscar si ya existe mesa abierta
    let result;
    let existingMesa: any[] = [];
    
    if (waiter_order) {
      // Buscar mesa abierta para este usuario y nombre de mesa
      existingMesa = await executeQuery(
        `SELECT id, items, total FROM orders WHERE user_id = ? AND waiter_order = 1 AND status = 'open_table' AND \`table\` = ? LIMIT 1`,
        [user.id, table]
      ) as any[];
      if (existingMesa && existingMesa.length > 0) {
        // Sumar productos y total
        let currentItems = [];
        try {
          currentItems = JSON.parse(existingMesa[0].items) || [];
        } catch (e) {}
        // Sumar cantidades si el producto ya existe, si no agregarlo
        for (const newItem of items) {
          const idx = currentItems.findIndex((i:any) => i.id === newItem.id);
          if (idx >= 0) {
            currentItems[idx].quantity += newItem.quantity;
          } else {
            currentItems.push(newItem);
          }
        }
        const newTotal = existingMesa[0].total + total;
        await executeQuery(
          `UPDATE orders SET items = ?, total = ?, notes = ? WHERE id = ?`,
          [JSON.stringify(currentItems), newTotal, notes || null, existingMesa[0].id]
        );
        result = { insertId: existingMesa[0].id };
      } else {
        // Crear nueva mesa abierta
        const insertValues = [
          user.id,
          JSON.stringify(items),
          total,
          customer_info ? JSON.stringify(customer_info) : null,
          delivery_address ? JSON.stringify(delivery_address) : null,
          payment_method || 'efectivo',
          notes || null,
          'open_table',
          1,
          table || null
        ];
        console.log('Insertando pedido mesero con valores:', insertValues);
        result = await executeQuery(
          `INSERT INTO orders 
           (user_id, items, total, customer_info, delivery_address, payment_method, notes, status, waiter_order, \`table\`) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          insertValues
        ) as any;
      }
    } else {
      // Construir customer_info si viene customer_name/email
      let finalCustomerInfo = customer_info;
      if (!finalCustomerInfo && (customerName || customerEmail)) {
        finalCustomerInfo = JSON.stringify({
          name: customerName,
          email: customerEmail
        });
      } else if (finalCustomerInfo && typeof finalCustomerInfo === 'object') {
        finalCustomerInfo = JSON.stringify(finalCustomerInfo);
      }

      // Asegurar que delivery_address sea null si es undefined o vacío
      let finalDeliveryAddress = null;
      if (delivery_address) {
        // Si ya es string (viene como JSON desde checkout), validar que sea JSON válido
        if (typeof delivery_address === 'string') {
          try {
            JSON.parse(delivery_address); // Validar que sea JSON válido
            finalDeliveryAddress = delivery_address;
          } catch (e) {
            // Si no es JSON válido, convertir string a objeto JSON
            finalDeliveryAddress = JSON.stringify({ street: delivery_address, city: '', state: '', zip: '' });
          }
        } else {
          // Si es objeto, convertir a JSON
          finalDeliveryAddress = JSON.stringify(delivery_address);
        }
      }

      result = await executeQuery(
        `INSERT INTO orders 
         (user_id, items, total, customer_info, delivery_address, payment_method, notes, status, order_source, shift_id, cash_received, change_given) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          JSON.stringify(items),
          body.total_amount || total,
          finalCustomerInfo || null,
          finalDeliveryAddress,
          payment_method || 'efectivo',
          notes || null,
          orderStatus || 'pending',
          orderSource || 'caja',
          shiftId || null,
          cashReceived || null,
          changeGiven || null
        ]
      ) as any;
    }

    // Actualizar stock: si el producto tiene receta → deducir insumos; si no → deducir stock producto
    try {
      for (const item of items) {
        const productId = item.id || item.product_id
        if (!productId) continue
        const qty = Number(item.quantity) || 1
        const usedIngredients = await deductIngredientsForProduct(productId, qty, result.insertId, user.id)
        if (!usedIngredients) {
          // No recipe — fall back to product-level stock deduction
          const { adjustStock } = await import('@/lib/inventory')
          await adjustStock(productId, -qty, 'sale', {
            referenceId: `order-${result.insertId}`,
            notes: `Venta pedido #${result.insertId}`,
            userId: user.id,
          })
        }
      }
    } catch (stockErr) {
      console.error('Error deducting stock:', stockErr)
    }

    // ✨ IMPRESIÓN AUTOMÁTICA AL CREAR PEDIDO
    try {
      const PRINT_SERVER_URL = process.env.NEXT_PUBLIC_PRINT_SERVER_URL || 'https://untextural-louetta-nonrestrictedly.ngrok-free.dev';
      
      // Imprimir TODOS los pedidos (incluye meseros siempre)
      const shouldPrint = true; // Siempre imprimir, tanto mesas nuevas como existentes
      
      if (shouldPrint) {
        // Preparar datos de impresión
        let customerInfo: any = {};
        try {
          customerInfo = typeof customer_info === "string" ? JSON.parse(customer_info) : customer_info;
        } catch {}

        // Datos de impresión diferenciados para meseros
        const isUpdatingExistingTable = waiter_order && existingMesa.length > 0;
        const printData = waiter_order ? {
          // 🍽️ FORMATO ESPECIAL PARA MESERO
          orderId: result.insertId,
          isWaiterOrder: true,
          tableName: table || 'Mesa sin asignar',
          isTableUpdate: isUpdatingExistingTable, // Flag para formato de comanda comedor
          notes: notes || '', // Notas del mesero al nivel principal
          customer: {
            name: isUpdatingExistingTable ? 'COMANDA COMEDOR - PRODUCTOS ADICIONALES' : 'MESERO - PEDIDO LOCAL',
            phone: '',
            address: 'RECOGER EN LOCAL',
            notes: notes || ''
          },
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          total: total,
          paymentMethod: 'efectivo',
          deliveryType: 'dine_in',
          createdAt: new Date().toISOString()
        } : {
          // 🛍️ FORMATO NORMAL PARA CLIENTES
          orderId: result.insertId,
          customer: {
            name: customerInfo?.name || 'Cliente',
            phone: customerInfo?.phone || '',
            address: delivery_address || customerInfo?.address || '',
            notes: notes || customerInfo?.notes || ''
          },
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          total: total,
          paymentMethod: payment_method,
          deliveryType: delivery_address ? 'delivery' : 'pickup',
          createdAt: new Date().toISOString()
        };

        console.log('🖨️ Enviando a impresión automática:', printData.orderId);
        
        // Enviar a impresión (no bloquear si falla)
        fetch(`${PRINT_SERVER_URL}/print`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(printData)
        }).then(async (response) => {
          if (response.ok) {
            const result = await response.json();
            console.log('✅ Pedido impreso automáticamente:', result);
          } else {
            console.error('❌ Error en impresión automática:', await response.text());
          }
        }).catch(error => {
          console.error('❌ Error conectando al servidor de impresión:', error);
        });
      }
    } catch (printError) {
      console.error('❌ Error en impresión automática:', printError);
      // No fallar el pedido por error de impresión
    }

    return NextResponse.json({
      success: true,
      orderId: result.insertId,
      total,
      message: "Pedido creado exitosamente"
    })
  } catch (error: any) {
    console.error("Error al crear pedido:", error);
    if (error && error.stack) {
      console.error(error.stack);
    }
    return NextResponse.json(
      { error: "Error al crear pedido", detalle: error?.message || error },
      { status: 500 }
    );
  }
}