import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, CheckCircle, Truck, AlertCircle, Package, ShoppingBag, User, Phone, Mail, MapPin } from "lucide-react";
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

type Driver = any;

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  drivers: Driver[];
  selectedDriver: string;
  setSelectedDriver: (id: string) => void;
  assigningDriver: boolean;
  assignDriver: (orderId: number, driverId: string) => void;
  fetchDrivers: () => void;
  updatingStatus: boolean;
  updateOrderStatus: (orderId: number, newStatus: string) => void;
  fetchOrders: () => void;
  setShowModal: (open: boolean) => void;
}

function getStatusColor(status: string) {
  switch (status) {
    case "pendiente": return "text-amber-400 bg-amber-400/20";
    case "procesando":
    case "listo": return "text-blue-400 bg-blue-400/20";
    case "asignado":
    case "aceptado": return "text-cyan-400 bg-cyan-400/20";
    case "enviado": return "text-purple-400 bg-purple-400/20";
    case "entregado": return "text-green-400 bg-green-400/20";
    case "cancelado": return "text-red-400 bg-red-400/20";
    default: return "text-gray-400 bg-gray-400/20";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "pendiente": return <Clock className="h-4 w-4" />;
    case "procesando":
    case "listo": return <Package className="h-4 w-4" />;
    case "asignado":
    case "aceptado": return <User className="h-4 w-4" />;
    case "enviado": return <Truck className="h-4 w-4" />;
    case "entregado": return <CheckCircle className="h-4 w-4" />;
    case "cancelado": return <AlertCircle className="h-4 w-4" />;
    default: return <ShoppingBag className="h-4 w-4" />;
  }
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  open,
  onOpenChange,
  order,
  drivers,
  selectedDriver,
  setSelectedDriver,
  assigningDriver,
  assignDriver,
  fetchDrivers,
  updatingStatus,
  updateOrderStatus,
  fetchOrders,
  setShowModal,
}) => {
  if (!order) return null;
  let customerInfo: any = {};
  try {
    customerInfo = typeof order.customer_info === "string" ? JSON.parse(order.customer_info) : order.customer_info;
  } catch {}
  let items: any[] = [];
  try {
    items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
  } catch {}
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-purple-900 to-black border-purple-500">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center justify-between">
            <span>Detalles del Pedido {order ? `#${order.id}` : ''}</span>
            <KitchenPrint order={order} />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Estado y Fecha */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-purple-300 text-sm">Estado</p>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                {order.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-purple-300 text-sm">Fecha</p>
              <p className="text-white">
                {new Date(order.created_at).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          {/* Información del cliente */}
          <div className="bg-purple-800/20 rounded-lg p-4 border border-purple-500/30">
            <h3 className="text-white font-semibold mb-3 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Información del Cliente
            </h3>
            <div className="space-y-2 text-purple-200">
              <p><strong>Nombre:</strong> {customerInfo?.name || 'N/A'}</p>
              {customerInfo?.phone && (
                <p className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  {customerInfo.phone}
                </p>
              )}
              {customerInfo?.email && (
                <p className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  {customerInfo.email}
                </p>
              )}
              {customerInfo?.address && (
                <p className="flex items-start">
                  <MapPin className="w-4 h-4 mr-2 mt-1" />
                  {customerInfo.address}
                </p>
              )}
              {customerInfo?.deliveryType && (
                <p>
                  <strong>Tipo:</strong>{' '}
                  {customerInfo.deliveryType === 'delivery' ? '🚚 Delivery' : '🏪 Recoger en tienda'}
                </p>
              )}
              {customerInfo?.notes && (
                <p>
                  <strong>Notas:</strong> {customerInfo.notes}
                </p>
              )}
            </div>
          </div>
          {/* Items del pedido */}
          <div className="bg-purple-800/20 rounded-lg p-4 border border-purple-500/30">
            <h3 className="text-white font-semibold mb-3 flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Productos
            </h3>
            {Array.isArray(items) && items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="border-b border-purple-500/20 pb-2 mb-2 last:border-0">
                    <div className="flex justify-between text-purple-200">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="text-green-400 font-semibold">
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    
                    {/* Mostrar modificadores si existen */}
                    {item.modifiers && Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                      <div className="mt-1 ml-4 space-y-0.5">
                        {item.modifiers.map((mod: any, idx: number) => (
                          <p key={idx} className="text-xs text-purple-300">
                            • {mod.group}: <span className="text-cyan-300">{mod.modifier}</span>
                            {mod.price !== 0 && <span className="text-green-400"> (+${mod.price.toFixed(2)})</span>}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="border-t border-purple-500/30 mt-3 pt-3 flex justify-between text-white font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-green-400">${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-purple-300">No hay productos</p>
            )}
          </div>
          {/* Método de pago */}
          <div className="bg-purple-800/20 rounded-lg p-4 border border-purple-500/30">
            <h3 className="text-white font-semibold mb-2">Método de Pago</h3>
            <p className="text-purple-200">
              {order.payment_method === 'mercadopago' ? '💳 Tarjeta (Mercado Pago)' : '💵 Efectivo'}
            </p>
          </div>
          {/* Cambiar Estado del Pedido */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-500/30">
            <h3 className="text-white font-semibold mb-3 flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Cambiar Estado del Pedido
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {order.raw_status !== 'confirmed' && (
                <button
                  onClick={() => updateOrderStatus(order.id, 'confirmed')}
                  disabled={updatingStatus}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                >
                  ✅ Confirmar
                </button>
              )}
              {order.raw_status !== 'preparing' && (
                <button
                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                  disabled={updatingStatus}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                >
                  🍳 Preparando
                </button>
              )}
              {order.raw_status !== 'ready' && (
                <button
                  onClick={() => updateOrderStatus(order.id, 'ready')}
                  disabled={updatingStatus}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                >
                  ✅ Listo
                </button>
              )}
              {order.raw_status !== 'delivered' && (
                <button
                  onClick={() => updateOrderStatus(order.id, 'delivered')}
                  disabled={updatingStatus}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                >
                  🎉 Entregado
                </button>
              )}
              {order.raw_status !== 'cancelled' && (
                <button
                  onClick={() => {
                    if (confirm('¿Seguro que quieres cancelar este pedido?')) {
                      updateOrderStatus(order.id, 'cancelled');
                    }
                  }}
                  disabled={updatingStatus}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors col-span-2"
                >
                  ❌ Cancelar Pedido
                </button>
              )}
            </div>
            {updatingStatus && (
              <p className="text-purple-300 text-sm mt-2 text-center">Actualizando...</p>
            )}
          </div>
          {/* Asignación Manual de Repartidor */}
          {(order.raw_status === 'ready' || order.status === 'listo') && (
            <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg p-4 border border-green-500/30">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Truck className="w-4 h-4 mr-2" />
                Asignar Repartidor
              </h3>
              <p className="text-purple-200 text-sm mb-3">
                Este pedido está listo para entrega. Selecciona un repartidor.
              </p>
              {drivers.length === 0 && (
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-3">
                  <p className="text-red-300 text-sm">⚠️ No hay repartidores registrados. Ejecuta <code className="bg-black/50 px-2 py-1 rounded">npm run create-driver</code></p>
                </div>
              )}
              <div className="space-y-3">
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  disabled={assigningDriver}
                  className="w-full bg-black/50 border border-purple-500/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-purple-400 disabled:opacity-50"
                >
                  <option value="">Seleccionar repartidor...</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} {driver.phone ? `(${driver.phone})` : ''}
                      {driver.vehicle_type ? ` - ${driver.vehicle_type}` : ''}
                      {!driver.is_available ? ' ⛔ NO DISPONIBLE' : ' ✅'}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => assignDriver(order.id, selectedDriver)}
                    disabled={assigningDriver || !selectedDriver}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                  >
                    {assigningDriver ? '⏳ Asignando...' : '🚚 Asignar Repartidor'}
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/orders-mysql/${order.id}/auto-assign`, {
                          method: 'POST',
                          credentials: 'include',
                        });
                        const data = await response.json();
                        if (data.success) {
                          alert(`✅ Pedido asignado automáticamente a ${data.driver.name}`);
                          setShowModal(false);
                          await fetchOrders();
                        } else {
                          alert(`❌ ${data.error}`);
                        }
                      } catch (error) {
                        alert('❌ Error al asignar repartidor');
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    title="Asignar automáticamente"
                  >
                    🎲 Auto
                  </button>
                </div>
                {drivers.length > 0 && drivers.filter((d) => d.is_available).length === 0 && (
                  <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-3">
                    <p className="text-amber-300 text-sm">
                      ⚠️ Hay {drivers.length} repartidor(es) registrado(s) pero ninguno está disponible.
                      Los repartidores se marcan como NO disponibles cuando tienen un pedido asignado.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal;
