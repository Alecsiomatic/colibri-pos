import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-notifications";
import CategoryTabs from "./CategoryTabs";
import ProductList from "./ProductList";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AddProductsModal({ open, onClose, orderId, onProductsAdded, tableName }: {
  open: boolean;
  onClose: () => void;
  orderId: number;
  onProductsAdded: () => void;
  tableName: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogHeader className="flex items-center justify-between px-4 py-2 border-b bg-white/70 rounded-t-lg">
        <DialogTitle className="text-lg font-bold text-yellow-800">Agregar productos - {tableName}</DialogTitle>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-800">✕</button>
      </DialogHeader>
      <DialogContent className="p-0 bg-gradient-to-b from-white/80 to-yellow-50 rounded-lg shadow-xl max-w-md w-full mx-auto min-h-[80vh] flex flex-col">
        <div className="sticky top-0 z-10 bg-white/80 rounded-t-lg">
          <CategoryTabs value={selectedCategory} onChange={setSelectedCategory} />
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <ProductList category={selectedCategory} selected={selectedProducts} setSelected={setSelectedProducts} />
        </div>
        <div className="p-4 border-t bg-white/80 rounded-b-lg flex flex-col gap-2">
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Notas adicionales (opcional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Ej: Sin cebolla, término medio, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px] text-sm"
            />
          </div>
          <Button
            onClick={async () => {
              if (selectedProducts.length === 0) {
                toast.error("Selecciona al menos un producto");
                return;
              }
              setSaving(true);
              try {
                const res = await fetch(`/api/mesero/update-order-items/${orderId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ items: selectedProducts, notes: notes.trim() }),
                  credentials: "include",
                });
                const data = await res.json();
                if (data.success) {
                  toast.success("Productos agregados", "La mesa fue actualizada");
                  setSelectedProducts([]);
                  setSelectedCategory("");
                  setNotes("");
                  onClose();
                  onProductsAdded();
                } else {
                  toast.error("Error", data.error || "No se pudo actualizar la mesa");
                }
              } catch (e) {
                toast.error("Error", "No se pudo actualizar la mesa");
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="w-full text-lg font-bold bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-md py-3"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" /> : null}
            Agregar al pedido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
