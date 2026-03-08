"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Plus, Save, Trash2, Loader2, ArrowLeft, Circle, Square, RectangleHorizontal,
  Users, RotateCw, GripVertical
} from "lucide-react";
import { useToast } from "@/hooks/use-notifications";
import { useRouter } from "next/navigation";

interface RestaurantTable {
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
  status?: string;
}

export default function LayoutMesasPage() {
  const toast = useToast();
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Drag state
  const [dragging, setDragging] = useState<number | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Add table dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCapacity, setNewCapacity] = useState("4");
  const [newShape, setNewShape] = useState<"square" | "round" | "rectangle">("square");
  const [newZone, setNewZone] = useState("Principal");
  const [adding, setAdding] = useState(false);

  const fetchTables = async () => {
    try {
      const res = await fetch("/api/admin/restaurant-tables", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setTables(data.tables || []);
      }
    } catch {
      toast.error("Error", "No se pudieron cargar las mesas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // --- DRAG HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent, tableId: number) => {
    e.preventDefault();
    e.stopPropagation();
    const table = tables.find((t) => t.id === tableId);
    if (!table || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left - table.x,
      y: e.clientY - rect.top - table.y,
    };
    setDragging(tableId);
    setSelectedId(tableId);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragging === null || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.current.x, rect.width - 80));
      const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.current.y, rect.height - 80));

      setTables((prev) =>
        prev.map((t) => (t.id === dragging ? { ...t, x: Math.round(x), y: Math.round(y) } : t))
      );
      setHasChanges(true);
    },
    [dragging]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging !== null) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Touch support
  const handleTouchStart = (e: React.TouchEvent, tableId: number) => {
    e.stopPropagation();
    const touch = e.touches[0];
    const table = tables.find((t) => t.id === tableId);
    if (!table || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: touch.clientX - rect.left - table.x,
      y: touch.clientY - rect.top - table.y,
    };
    setDragging(tableId);
    setSelectedId(tableId);
  };

  useEffect(() => {
    if (dragging === null) return;

    const handleTouchMoveGlobal = (e: TouchEvent) => {
      if (!canvasRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(touch.clientX - rect.left - dragOffset.current.x, rect.width - 80));
      const y = Math.max(0, Math.min(touch.clientY - rect.top - dragOffset.current.y, rect.height - 80));
      setTables((prev) =>
        prev.map((t) => (t.id === dragging ? { ...t, x: Math.round(x), y: Math.round(y) } : t))
      );
      setHasChanges(true);
    };

    const handleTouchEndGlobal = () => {
      setDragging(null);
    };

    window.addEventListener("touchmove", handleTouchMoveGlobal, { passive: false });
    window.addEventListener("touchend", handleTouchEndGlobal);
    return () => {
      window.removeEventListener("touchmove", handleTouchMoveGlobal);
      window.removeEventListener("touchend", handleTouchEndGlobal);
    };
  }, [dragging]);

  // --- ACTIONS ---
  const handleAddTable = async () => {
    if (!newName.trim()) {
      toast.error("Error", "El nombre es requerido");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/restaurant-tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          capacity: parseInt(newCapacity) || 4,
          shape: newShape,
          zone: newZone || "Principal",
          x: 50 + Math.random() * 300,
          y: 50 + Math.random() * 200,
          width: newShape === "rectangle" ? 120 : 80,
          height: 80,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Mesa creada", `${newName} agregada al layout`);
        setAddOpen(false);
        setNewName("");
        setNewCapacity("4");
        setNewShape("square");
        fetchTables();
      } else {
        toast.error("Error", data.error || "No se pudo crear");
      }
    } catch {
      toast.error("Error", "Error al crear mesa");
    } finally {
      setAdding(false);
    }
  };

  const handleSaveLayout = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/restaurant-tables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Guardado", "Layout guardado correctamente");
        setHasChanges(false);
      } else {
        toast.error("Error", data.error || "No se pudo guardar");
      }
    } catch {
      toast.error("Error", "Error al guardar layout");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTable = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/restaurant-tables?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Eliminada", "Mesa eliminada");
        setSelectedId(null);
        fetchTables();
      }
    } catch {
      toast.error("Error", "No se pudo eliminar");
    }
  };

  const updateSelected = (field: string, value: any) => {
    setTables((prev) =>
      prev.map((t) => (t.id === selectedId ? { ...t, [field]: value } : t))
    );
    setHasChanges(true);
  };

  const selected = tables.find((t) => t.id === selectedId);

  // --- RENDER ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-colibri-green via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-colibri-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-colibri-green via-slate-900 to-slate-950">
      {/* Top Bar */}
      <div className="border-b border-colibri-gold/30 bg-slate-900/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => router.push("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Admin
          </Button>
          <h1 className="text-xl font-black text-white">Diseño de Mesas</h1>
          {hasChanges && <Badge className="bg-yellow-500 text-black font-bold animate-pulse">Sin guardar</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-colibri-gold text-colibri-gold hover:bg-colibri-gold/20"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Nueva Mesa
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white font-bold"
            onClick={handleSaveLayout}
            disabled={saving || !hasChanges}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Guardar Layout
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-60px)]">
        {/* Canvas */}
        <div className="flex-1 p-4 overflow-auto">
          <div
            ref={canvasRef}
            className="relative bg-slate-800/60 border-2 border-dashed border-colibri-gold/30 rounded-xl"
            style={{ width: "100%", minHeight: "600px", height: "70vh" }}
            onClick={() => setSelectedId(null)}
          >
            {/* Grid pattern */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {tables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white/40">
                  <Square className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg font-bold">Sin mesas configuradas</p>
                  <p className="text-sm">Haz clic en &quot;Nueva Mesa&quot; para comenzar</p>
                </div>
              </div>
            )}

            {tables.map((table) => (
              <div
                key={table.id}
                className={`absolute cursor-grab active:cursor-grabbing select-none transition-shadow ${
                  selectedId === table.id ? "ring-2 ring-colibri-gold shadow-lg shadow-colibri-gold/30" : ""
                } ${table.status === "occupied" ? "opacity-100" : "opacity-80"}`}
                style={{
                  left: table.x,
                  top: table.y,
                  width: table.width,
                  height: table.height,
                  transform: `rotate(${table.rotation || 0}deg)`,
                }}
                onMouseDown={(e) => handleMouseDown(e, table.id)}
                onTouchStart={(e) => handleTouchStart(e, table.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(table.id);
                }}
              >
                <div
                  className={`w-full h-full flex flex-col items-center justify-center border-2 ${
                    table.status === "occupied"
                      ? "bg-colibri-wine/80 border-colibri-wine text-white"
                      : "bg-slate-700/80 border-slate-500 text-white/80"
                  } ${table.shape === "round" ? "rounded-full" : "rounded-lg"}`}
                >
                  <GripVertical className="h-3 w-3 absolute top-1 left-1 opacity-30" />
                  <span className="font-black text-sm leading-tight text-center px-1">{table.name}</span>
                  <span className="text-[10px] mt-0.5 opacity-70 flex items-center">
                    <Users className="h-2.5 w-2.5 mr-0.5" />
                    {table.capacity}
                  </span>
                  {table.status === "occupied" && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] px-1 py-0">
                      Ocupada
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-72 border-l border-colibri-gold/30 bg-slate-900/80 p-4 overflow-y-auto">
          {selected ? (
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg">Propiedades</h3>

              <div>
                <Label className="text-white/70 text-sm">Nombre</Label>
                <Input
                  value={selected.name}
                  onChange={(e) => updateSelected("name", e.target.value)}
                  className="bg-slate-800 border-colibri-gold/30 text-white"
                />
              </div>

              <div>
                <Label className="text-white/70 text-sm">Capacidad</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={selected.capacity}
                  onChange={(e) => updateSelected("capacity", parseInt(e.target.value) || 1)}
                  className="bg-slate-800 border-colibri-gold/30 text-white"
                />
              </div>

              <div>
                <Label className="text-white/70 text-sm">Forma</Label>
                <div className="flex gap-2 mt-1">
                  {[
                    { v: "square", icon: Square, label: "Cuadrada" },
                    { v: "round", icon: Circle, label: "Redonda" },
                    { v: "rectangle", icon: RectangleHorizontal, label: "Rectángulo" },
                  ].map(({ v, icon: Icon, label }) => (
                    <Button
                      key={v}
                      variant="outline"
                      size="sm"
                      className={`flex-1 text-xs ${
                        selected.shape === v
                          ? "bg-colibri-wine border-colibri-wine text-white"
                          : "border-colibri-gold/30 text-white/70 hover:bg-slate-800"
                      }`}
                      onClick={() => {
                        updateSelected("shape", v);
                        if (v === "rectangle") updateSelected("width", 120);
                        else updateSelected("width", 80);
                      }}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white/70 text-sm">Zona</Label>
                <Input
                  value={selected.zone}
                  onChange={(e) => updateSelected("zone", e.target.value)}
                  className="bg-slate-800 border-colibri-gold/30 text-white"
                  placeholder="Ej: Terraza, Interior, VIP"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-white/70 text-sm">Ancho</Label>
                  <Input
                    type="number"
                    min="40"
                    max="200"
                    value={selected.width}
                    onChange={(e) => updateSelected("width", parseInt(e.target.value) || 80)}
                    className="bg-slate-800 border-colibri-gold/30 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white/70 text-sm">Alto</Label>
                  <Input
                    type="number"
                    min="40"
                    max="200"
                    value={selected.height}
                    onChange={(e) => updateSelected("height", parseInt(e.target.value) || 80)}
                    className="bg-slate-800 border-colibri-gold/30 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white/70 text-sm flex items-center gap-1">
                  <RotateCw className="h-3 w-3" /> Rotación ({selected.rotation}°)
                </Label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={selected.rotation}
                  onChange={(e) => updateSelected("rotation", parseInt(e.target.value))}
                  className="w-full mt-1"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20 mt-4"
                onClick={() => handleDeleteTable(selected.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Eliminar Mesa
              </Button>
            </div>
          ) : (
            <div className="text-center text-white/40 mt-8">
              <Square className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Selecciona una mesa</p>
              <p className="text-sm mt-1">Arrastra para moverla, haz clic para editar sus propiedades</p>
            </div>
          )}

          {/* Table List */}
          <div className="mt-6 border-t border-colibri-gold/20 pt-4">
            <h4 className="text-white/70 text-sm font-bold mb-2">Todas las mesas ({tables.length})</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {tables.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer text-sm ${
                    selectedId === t.id ? "bg-colibri-wine/30 text-white" : "text-white/60 hover:bg-slate-800"
                  }`}
                  onClick={() => setSelectedId(t.id)}
                >
                  <span className="font-medium">{t.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] opacity-60">{t.zone}</span>
                    <div className={`w-2 h-2 rounded-full ${t.status === "occupied" ? "bg-red-500" : "bg-green-500"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Table Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900 font-bold">Nueva Mesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-900 font-bold">Nombre</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Mesa 1, Terraza 3, VIP 2"
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>
            <div>
              <Label className="text-gray-900 font-bold">Capacidad (personas)</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>
            <div>
              <Label className="text-gray-900 font-bold">Forma</Label>
              <div className="flex gap-2 mt-1">
                {[
                  { v: "square" as const, icon: Square, label: "Cuadrada" },
                  { v: "round" as const, icon: Circle, label: "Redonda" },
                  { v: "rectangle" as const, icon: RectangleHorizontal, label: "Rectángulo" },
                ].map(({ v, icon: Icon, label }) => (
                  <Button
                    key={v}
                    variant="outline"
                    size="sm"
                    className={`flex-1 text-xs ${newShape === v ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-gray-700"}`}
                    onClick={() => setNewShape(v)}
                  >
                    <Icon className="h-3 w-3 mr-1" /> {label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-gray-900 font-bold">Zona</Label>
              <Input
                value={newZone}
                onChange={(e) => setNewZone(e.target.value)}
                placeholder="Ej: Interior, Terraza, VIP"
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="text-gray-700">
              Cancelar
            </Button>
            <Button onClick={handleAddTable} disabled={adding} className="bg-green-600 hover:bg-green-700 text-white">
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Crear Mesa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
