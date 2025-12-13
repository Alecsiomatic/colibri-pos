"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TicketPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/mesero/order/${params.id}`, { credentials: "include" });
        const data = await res.json();
        if (data.success) setOrder(data.order);
        else router.push("/mesero/mesas-abiertas");
      } catch {
        router.push("/mesero/mesas-abiertas");
      }
      setLoading(false);
    };
    fetchOrder();
  }, [params.id, router]);

  useEffect(() => {
    if (order) {
      setTimeout(() => window.print(), 500);
    }
  }, [order]);

  if (loading) return <div className="p-10 text-center">Cargando ticket...</div>;
  if (!order) return null;

  return (
    <div className="p-6 max-w-xs mx-auto bg-white text-black border border-gray-300 rounded shadow print:shadow-none print:border-0 print:bg-white">
      <div className="text-center mb-2">
        <h2 className="font-bold text-lg">RESTAURANTE</h2>
        <div className="text-xs">Ticket #{order.id}</div>
        <div className="text-xs">Mesa: {order.table}</div>
        <div className="text-xs">{new Date(order.created_at).toLocaleString()}</div>
      </div>
      <hr className="my-2" />
      <div>
        <div className="font-bold text-sm mb-1">Productos:</div>
        <ul className="mb-2">
          {order.items && order.items.map((item: any, idx: number) => (
            <li key={idx} className="mb-2">
              <div className="flex justify-between text-xs">
                <span>{item.quantity} x {item.name}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
              
              {/* Mostrar modificadores */}
              {item.modifiers && item.modifiers.length > 0 && (
                <div className="ml-4 mt-0.5 text-xs text-gray-600">
                  {item.modifiers.map((mod: any, midx: number) => (
                    <div key={midx}>
                      • {mod.group}: {mod.modifier}
                      {mod.price !== 0 && <span> (+${mod.price.toFixed(2)})</span>}
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className="flex justify-between font-bold text-base border-t pt-2">
          <span>Total:</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
      </div>
      {order.notes && (
        <div className="mt-2 text-xs">Notas: {order.notes}</div>
      )}
      <div className="mt-4 text-center text-xs">¡Gracias por su visita!</div>
    </div>
  );
}
