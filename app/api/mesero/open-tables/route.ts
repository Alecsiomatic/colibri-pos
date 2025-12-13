import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/mysql-db";
import { verifyAccessToken, getSessionByToken } from "@/lib/auth-mysql";

// GET - List open tables (mesero orders not closed)
export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth-token")?.value;
    if (!authToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const user = verifyAccessToken(authToken) || await getSessionByToken(authToken);
    if (!user || !user.is_waiter) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    // Log para depuración
    console.log('GET /api/mesero/open-tables user:', user);
    const query = `SELECT id, \`table\`, status, created_at, items, total, notes FROM orders WHERE waiter_order = 1 AND status = 'open_table' AND user_id = ? ORDER BY created_at DESC`;
    console.log('Ejecutando query:', query, 'con user_id:', user.id);
    
    const orders = await executeQuery(query, [user.id]);
    console.log('Resultado orders:', orders);
    
    // Parse items JSON
    const parsedOrders = (orders as any[]).map((o) => ({ 
      ...o, 
      items: o.items ? JSON.parse(o.items) : [] 
    }));
    
    // Group orders by table name
    const groupedTables = parsedOrders.reduce((groups: any, order: any) => {
      const tableName = order.table;
      
      if (!groups[tableName]) {
        groups[tableName] = {
          tableName,
          orders: [],
          totalMesa: 0,
          allItems: [],
          firstOrderDate: order.created_at,
          lastOrderDate: order.created_at,
          orderCount: 0
        };
      }
      
      groups[tableName].orders.push(order);
      groups[tableName].totalMesa += parseFloat(order.total) || 0;
      groups[tableName].orderCount += 1;
      
      // Add items to consolidated list
      if (order.items && Array.isArray(order.items)) {
        groups[tableName].allItems.push(...order.items);
      }
      
      // Update date range
      if (order.created_at < groups[tableName].firstOrderDate) {
        groups[tableName].firstOrderDate = order.created_at;
      }
      if (order.created_at > groups[tableName].lastOrderDate) {
        groups[tableName].lastOrderDate = order.created_at;
      }
      
      return groups;
    }, {});
    
    // Convert to array for easier frontend handling
    const tablesArray = Object.values(groupedTables);
    
    console.log('Tables grouped:', tablesArray);
    return NextResponse.json({ success: true, tables: tablesArray });
  } catch (error: any) {
    console.error('Error en /api/mesero/open-tables:', error);
    if (error && error.stack) {
      console.error(error.stack);
    }
    return NextResponse.json({ error: "Error al obtener mesas abiertas", detalle: error?.message || error }, { status: 500 });
  }
}
