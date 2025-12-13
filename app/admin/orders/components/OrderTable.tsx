import React from "react";
import { ShoppingBag } from "lucide-react";
import KitchenPrint from "./KitchenPrint";

type Order = {
  id: number;
  user_id: number;
  items: string;
  total: number;
  status: string;
  created_at: string;
  customer_info: string;
  username?: string;
  raw_status?: string;
  payment_method?: string;
  delivery_address?: string;
  notes?: string;
};

type OrderTableProps = {
  orders: Order[];
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  onView: (order: Order) => void;
  onDelete: (order: Order) => void;
};

export default function OrderTable({
  orders,
  getStatusColor,
  getStatusIcon,
  onView,
  onDelete,
}: OrderTableProps) {
  return (
    <div className="bg-black/50 backdrop-blur-md rounded-lg border border-purple-800/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-purple-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-white font-medium">ID</th>
              <th className="px-6 py-3 text-left text-white font-medium">Usuario</th>
              <th className="px-6 py-3 text-left text-white font-medium">Total</th>
              <th className="px-6 py-3 text-left text-white font-medium">Estado</th>
              <th className="px-6 py-3 text-left text-white font-medium">Fecha</th>
              <th className="px-6 py-3 text-left text-white font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-800/50">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-purple-900/20">
                <td className="px-6 py-4 text-white font-mono">#{order.id}</td>
                <td className="px-6 py-4 text-purple-300">{order.username || `Usuario ${order.user_id}`}</td>
                <td className="px-6 py-4 text-green-400 font-semibold">${Number(order.total).toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-300">
                  {new Date(order.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 items-center">
                    <KitchenPrint order={order} />
                    <button
                      className="text-purple-400 hover:text-purple-300 font-medium"
                      onClick={() => onView(order)}
                    >
                      Ver detalles
                    </button>
                    <button
                      className="text-red-400 hover:text-red-300 font-medium"
                      onClick={() => onDelete(order)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No hay pedidos que mostrar</p>
        </div>
      )}
    </div>
  );
}
