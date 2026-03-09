"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, Loader2, RefreshCw, Users, Clock, DollarSign,
  PlusCircle, Scissors, CheckCircle, UtensilsCrossed,
  Banknote, CreditCard, Calculator
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-notifications";
import { useRouter } from "next/navigation";

interface VisualTable {
  id: number;
  name: string;
  capacity: number;
  shape: "square" | "round" | "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zone: string;
  status: "free" | "occupied";
  orderCount: number;
  currentTotal: number;
}

export default function MapaMesasPage() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [tables, setTables] = useState<VisualTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<VisualTable | null>(null);
  const [openTableOrders, setOpenTableOrders] = useState<Map<string, any>>(new Map());
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Close table modal state
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closingTableName, setClosingTableName] = useState("");
  const [closingTableTotal, setClosingTableTotal] = useState(0);
  const [closingTableOrders, setClosingTableOrders] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta">("efectivo");
  const [amountPaid, setAmountPaid] = useState("");
  const [calculating, setCalculating] = useState(false);

  const fetchData = async () => {
    try {
      const [tablesRes, ordersRes] = await Promise.all([
        fetch("/api/admin/restaurant-tables", { credentials: "include" }),
        fetch("/api/mesero/open-tables", { credentials: "include" }),
      ]);
      const tablesData = await tablesRes.json();
      const ordersData = await ordersRes.json();

      if (tablesData.success) {
        setTables(tablesData.tables || []);
      }

      if (ordersData.success && ordersData.tables) {
        const map = new Map<string, any>();
        for (const t of ordersData.tables) {
          map.set(t.tableName, t);
        }
        setOpenTableOrders(map);
      }
    } catch {
      // Silent fail on poll
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const getTableOrder = (tableName: string) => openTableOrders.get(tableName);

  const handleTableClick = (table: VisualTable) => {
    setSelectedTable(selectedTable?.id === table.id ? null : table);
  };

  const handleOpenTable = (tableName: string) => {
    const encoded = encodeURIComponent(tableName);
    window.location.href = `/menu?nuevaMesa=${encoded}`;
  };

  const handleCloseTableModal = (tableName: string) => {
    const order = openTableOrders.get(tableName);
    if (!order) return;
    setClosingTableName(tableName);
    setClosingTableTotal(order.totalMesa);
    setClosingTableOrders(order);
    setPaymentMethod("efectivo");
    setAmountPaid("");
    setCloseModalOpen(true);
  };

  const handleConfirmClose = async () => {
    if (paymentMethod === "efectivo") {
      const paid = parseFloat(amountPaid);
      if (!amountPaid || isNaN(paid)) {
        toast.error("Error", "Ingresa el monto que pagó el cliente");
        return;
      }
      if (paid < closingTableTotal) {
        toast.error("Error", `Monto ($${paid.toFixed(2)}) menor al total ($${closingTableTotal.toFixed(2)})`);
        return;
      }
    }
    setCalculating(true);
    try {
      const response = await fetch("/api/close-table-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tableId: closingTableName,
          paymentMethod,
          amountPaid: paymentMethod === "efectivo" ? parseFloat(amountPaid) : closingTableTotal,
          totalAmount: closingTableTotal,
        }),
      });
      const result = await response.json();
      if (result.success) {
        const change = paymentMethod === "efectivo" ? parseFloat(amountPaid) - closingTableTotal : 0;
        toast.success(
          "Mesa cerrada",
          change > 0
            ? `${closingTableName} cerrada. Cambio: $${change.toFixed(2)}`
            : `${closingTableName} cerrada correctamente`
        );
        setCloseModalOpen(false);
        setSelectedTable(null);
        fetchData();
      } else {
        toast.error("Error", result.error || "No se pudo cerrar la mesa");
      }
    } catch {
      toast.error("Error", "No se pudo cerrar la mesa");
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-colibri-green via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-colibri-gold" />
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-colibri-green via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 opacity-40" />
          <h2 className="text-2xl font-bold mb-2">Sin mesas configuradas</h2>
          <p className="text-white/60 mb-4">El administrador debe diseñar el layout primero.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" className="border-colibri-gold text-colibri-gold" onClick={() => router.push("/mesero/mesas-abiertas")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Vista Clásica
            </Button>
            <Button className="bg-colibri-wine text-white" onClick={() => router.push("/admin/mesas")}>
              Configurar Mesas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const zones = [...new Set(tables.map((t) => t.zone))];
  const occupied = tables.filter((t) => t.status === "occupied").length;
  const free = tables.filter((t) => t.status === "free").length;
  const order = selectedTable ? getTableOrder(selectedTable.name) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-colibri-green via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-colibri-gold/30 bg-slate-900/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => router.push("/mesero/mesas-abiertas")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Lista
          </Button>
          <h1 className="text-xl font-black text-white">Mapa del Restaurante</h1>
          <div className="flex gap-2 ml-4">
            <Badge className="bg-green-600/80 text-white font-bold">{free} libres</Badge>
            <Badge className="bg-red-600/80 text-white font-bold">{occupied} ocupadas</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-colibri-gold/50 text-colibri-gold" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" /> Actualizar
          </Button>
          <Button size="sm" className="bg-colibri-wine text-white font-bold" onClick={() => router.push("/menu")}>
            <PlusCircle className="h-4 w-4 mr-1" /> Nuevo Pedido
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-60px)]">
        {/* Map View */}
        <div className="flex-1 p-4 overflow-auto">
          <div
            className="relative bg-slate-800/40 border border-colibri-gold/20 rounded-xl"
            style={{ width: "100%", minHeight: "600px", height: "70vh" }}
            onClick={() => setSelectedTable(null)}
          >
            {/* Grid */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-5">
              <defs>
                <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mapgrid)" />
            </svg>

            {tables.map((table) => {
              const isOccupied = table.status === "occupied";
              const isSelected = selectedTable?.id === table.id;

              return (
                <div
                  key={table.id}
                  className={`absolute cursor-pointer select-none transition-all duration-200 hover:scale-105 ${
                    isSelected ? "z-10 scale-105" : ""
                  }`}
                  style={{
                    left: table.x,
                    top: table.y,
                    width: table.width,
                    height: table.height,
                    transform: `rotate(${table.rotation || 0}deg)`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTableClick(table);
                  }}
                >
                  <div
                    className={`w-full h-full flex flex-col items-center justify-center border-2 transition-all
                      ${isOccupied
                        ? "bg-colibri-wine/90 border-colibri-wine shadow-lg shadow-colibri-wine/30 text-white"
                        : "bg-green-800/60 border-green-600/80 text-white/90 hover:bg-green-700/70"
                      }
                      ${isSelected ? "ring-2 ring-colibri-gold ring-offset-2 ring-offset-slate-900" : ""}
                      ${table.shape === "round" ? "rounded-full" : "rounded-lg"}
                    `}
                  >
                    <span className="font-black text-sm leading-tight text-center px-1">{table.name}</span>
                    <span className="text-[10px] mt-0.5 opacity-70 flex items-center">
                      <Users className="h-2.5 w-2.5 mr-0.5" />
                      {table.capacity}
                    </span>
                    {isOccupied && table.currentTotal > 0 && (
                      <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-colibri-gold text-slate-900 text-[9px] px-1.5 py-0 font-black whitespace-nowrap">
                        ${table.currentTotal.toFixed(0)}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-3 justify-center text-sm text-white/60">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-green-800/60 border border-green-600/80" />
              <span>Libre</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-colibri-wine/90 border border-colibri-wine" />
              <span>Ocupada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded ring-2 ring-colibri-gold border border-transparent" />
              <span>Seleccionada</span>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="w-80 border-l border-colibri-gold/30 bg-slate-900/80 p-4 overflow-y-auto">
          {selectedTable ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-black text-white">{selectedTable.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={selectedTable.status === "occupied" ? "bg-red-500 text-white" : "bg-green-600 text-white"}>
                    {selectedTable.status === "occupied" ? "Ocupada" : "Libre"}
                  </Badge>
                  <span className="text-white/60 text-sm flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1" /> {selectedTable.capacity} personas
                  </span>
                </div>
                <span className="text-white/40 text-xs">{selectedTable.zone}</span>
              </div>

              {selectedTable.status === "occupied" && order ? (
                <>
                  <div className="bg-slate-800/80 rounded-lg p-3 border border-colibri-gold/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/70 text-sm font-medium">Total en mesa</span>
                      <span className="text-colibri-gold font-black text-xl">${order.totalMesa.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/50">
                      <span className="flex items-center"><Clock className="h-3 w-3 mr-0.5" /> {new Date(order.firstOrderDate).toLocaleTimeString()}</span>
                      <span>{order.orderCount} pedido(s)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    <h4 className="text-white/70 text-sm font-bold">Productos:</h4>
                    {order.allItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-white">{item.quantity}x {item.name}</span>
                        <span className="text-colibri-gold font-bold">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      size="sm"
                      className="w-full bg-colibri-wine text-white hover:bg-colibri-wine/90 font-semibold"
                      onClick={() => {
                        const encoded = encodeURIComponent(selectedTable.name);
                        window.location.href = `/menu?mesa=${order.orders[0].id}&nuevaMesa=${encoded}`;
                      }}
                    >
                      <PlusCircle className="h-4 w-4 mr-1" /> Agregar Productos
                    </Button>
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold"
                      onClick={() => router.push(`/mesero/dividir-cuenta/${order.orders[0].id}`)}
                    >
                      <Scissors className="h-4 w-4 mr-1" /> Dividir Cuenta
                    </Button>
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold"
                      onClick={() => handleCloseTableModal(selectedTable.name)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Cerrar y Cobrar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <DollarSign className="h-10 w-10 mx-auto text-green-500/40 mb-2" />
                  <p className="text-white/50 text-sm mb-4">Mesa disponible</p>
                  <Button
                    className="w-full bg-colibri-wine text-white font-bold"
                    onClick={() => handleOpenTable(selectedTable.name)}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" /> Abrir Mesa
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-white/40 mt-12">
              <UtensilsCrossed className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Toca una mesa</p>
              <p className="text-sm mt-1">Ver detalles y acciones rápidas</p>
            </div>
          )}

          {/* Zone Summary */}
          <div className="mt-6 border-t border-colibri-gold/20 pt-4">
            <h4 className="text-white/70 text-sm font-bold mb-2">Resumen por zona</h4>
            {zones.map((zone) => {
              const zoneTables = tables.filter((t) => t.zone === zone);
              const zoneOccupied = zoneTables.filter((t) => t.status === "occupied").length;
              return (
                <div key={zone} className="flex items-center justify-between text-sm py-1">
                  <span className="text-white/60">{zone}</span>
                  <span className="text-white font-medium">
                    {zoneOccupied}/{zoneTables.length} ocupadas
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Close Table Payment Modal */}
      <Dialog open={closeModalOpen} onOpenChange={setCloseModalOpen}>
        <DialogContent className="max-w-md bg-white border-2 border-gray-300">
          <DialogHeader>
            <DialogTitle className="flex items-center text-gray-900 font-bold text-lg">
              <Calculator className="h-5 w-5 mr-2 text-blue-600" />
              Cerrar {closingTableName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-white/90 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-800">Total a pagar:</span>
                <span className="text-xl font-bold text-green-600">${closingTableTotal.toFixed(2)}</span>
              </div>
              {closingTableOrders && (
                <div className="text-sm text-gray-700">
                  {closingTableOrders.orderCount} pedido(s) &bull; {closingTableOrders.allItems?.length || 0} producto(s)
                </div>
              )}
            </div>
            <div>
              <Label className="text-lg font-bold mb-3 block text-gray-900">Método de pago</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v: "efectivo" | "tarjeta") => setPaymentMethod(v)}>
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-300">
                  <RadioGroupItem value="efectivo" id="mp-efectivo" />
                  <Label htmlFor="mp-efectivo" className="flex items-center cursor-pointer text-gray-900 font-bold">
                    <Banknote className="h-5 w-5 mr-2 text-green-600" /> Efectivo
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-300">
                  <RadioGroupItem value="tarjeta" id="mp-tarjeta" />
                  <Label htmlFor="mp-tarjeta" className="flex items-center cursor-pointer text-gray-900 font-bold">
                    <CreditCard className="h-5 w-5 mr-2 text-blue-600" /> Tarjeta
                  </Label>
                </div>
              </RadioGroup>
            </div>
            {paymentMethod === "efectivo" && (
              <div>
                <Label htmlFor="mp-amount" className="text-lg font-bold text-gray-900">¿Con cuánto paga?</Label>
                <Input
                  id="mp-amount"
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  className="text-xl mt-2 bg-white text-gray-900 border-2 border-gray-400 focus:border-blue-600 font-bold"
                  step="0.01"
                  min={closingTableTotal}
                />
                {amountPaid && !isNaN(parseFloat(amountPaid)) && (
                  <div className="mt-2 p-3 bg-white rounded border border-blue-200">
                    <div className="flex justify-between text-sm text-gray-800">
                      <span>Total:</span><span className="font-semibold">${closingTableTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-800">
                      <span>Pagó:</span><span className="font-semibold">${parseFloat(amountPaid).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2 mt-1">
                      <span className="text-gray-800">Cambio:</span>
                      <span className={parseFloat(amountPaid) >= closingTableTotal ? "text-green-600" : "text-red-600"}>
                        ${Math.max(0, parseFloat(amountPaid) - closingTableTotal).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            {paymentMethod === "tarjeta" && (
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex items-center text-blue-800 mb-2">
                  <CreditCard className="h-4 w-4 mr-2" />
                  <span className="font-semibold">Pago con tarjeta</span>
                </div>
                <p className="text-sm text-gray-700">
                  Se cobrará <strong className="text-gray-900">${closingTableTotal.toFixed(2)}</strong>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseModalOpen(false)} disabled={calculating} className="border-gray-400 text-gray-700">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmClose}
              disabled={calculating || (paymentMethod === "efectivo" && (!amountPaid || parseFloat(amountPaid) < closingTableTotal))}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              {calculating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              {calculating ? "Procesando..." : "Confirmar Cobro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
