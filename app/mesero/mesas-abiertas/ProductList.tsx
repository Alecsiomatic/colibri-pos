import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductModifierModal } from "@/components/ProductModifierModal";

export default function ProductList({ category, selected, setSelected }: {
  category: string;
  selected: any[];
  setSelected: (p: any[]) => void;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showModifierModal, setShowModifierModal] = useState(false);

  useEffect(() => {
    if (!category) return;
    fetch(`/api/products-mysql?category=${encodeURIComponent(category)}`)
      .then(res => res.json())
      .then(data => setProducts(data.products || []));
  }, [category]);

  const handleProductClick = async (product: any) => {
    // Verificar si tiene modificadores
    try {
      const response = await fetch(`/api/modifiers/product/${product.id}`);
      const data = await response.json();
      
      if (data.success && data.groups && data.groups.length > 0) {
        // Tiene modificadores, abrir modal
        setSelectedProduct(product);
        setShowModifierModal(true);
      } else {
        // No tiene modificadores, agregar directo
        addProduct(product);
      }
    } catch (error) {
      console.error('Error checking modifiers:', error);
      addProduct(product);
    }
  };

  const addProduct = (product: any) => {
    const exists = selected.find((p) => p.id === product.id && !p.modifiers);
    if (exists) {
      setSelected(selected.map(p => p.id === product.id && !p.modifiers ? { ...p, quantity: p.quantity + 1 } : p));
    } else {
      setSelected([...selected, { ...product, quantity: 1 }]);
    }
  };

  const handleAddWithModifiers = (product: any, modifiers: any[], totalPrice: number) => {
    // Siempre agregar como nuevo item cuando tiene modificadores
    setSelected([...selected, {
      ...product,
      price: totalPrice,
      quantity: 1,
      modifiers: modifiers
    }]);
    setShowModifierModal(false);
  };

  return (
    <div>
      <ProductModifierModal
        isOpen={showModifierModal}
        onClose={() => setShowModifierModal(false)}
        product={selectedProduct}
        onAddToCart={handleAddWithModifiers}
      />
      
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {products.map(product => (
          <div key={product.id} className="rounded-xl bg-white shadow p-3 flex flex-col items-center border border-gray-200">
            <div className="font-bold text-gray-900 text-center mb-1">{product.name}</div>
            <div className="text-sm text-gray-700 mb-2">${Number(product.price).toFixed(2)}</div>
            <Button size="sm" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded" onClick={() => handleProductClick(product)}>
              Agregar
            </Button>
          </div>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="mt-4 bg-yellow-50 rounded-lg p-2">
          <div className="font-semibold mb-2 text-yellow-800">Productos seleccionados:</div>
          <ul className="text-yellow-900">
            {selected.map(p => (
              <li key={p.id}>{p.name} x {p.quantity}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
