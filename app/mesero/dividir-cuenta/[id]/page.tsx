"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, Users, ShoppingCart, DollarSign, CheckCircle, Loader2,
  Banknote, CreditCard, Plus, Minus, Trash2, Calculator
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-notifications";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  modifiers?: { group: string; modifier: string; price: number }[];
}

interface SplitAccount {
  label: string;
  items: OrderItem[];
  amount: number;
  paymentMethod: "efectivo" | "tarjeta";
  amountPaid: string;
  isPaid: boolean;
}

interface TableData {
  tableName: string;
  totalMesa: number;
  allItems: OrderItem[];
  orders: { id: number }[];
}

export default function DividirCuentaPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const orderId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [activeTab, setActiveTab] = useState("equal");

  // --- Equal Split State ---
  const [equalParts, setEqualParts] = useState(2);
  const [equalAccounts, setEqualAccounts] = useState<SplitAccount[]>([]);

  // --- By Items State ---
  const [itemAccounts, setItemAccounts] = useState<SplitAccount[]>([]);
  const [unassignedItems, setUnassignedItems] = useState<OrderItem[]>([]);

  // --- Custom Amount State ---
  const [customAccounts, setCustomAccounts] = useState<SplitAccount[]>([]);

  // --- Payment Modal ---
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payingAccountIdx, setPayingAccountIdx] = useState<number>(-1);
  const [payModalMethod, setPayModalMethod] = useState<"efectivo" | "tarjeta">("efectivo");
  const [payModalAmount, setPayModalAmount] = useState("");

  // Fetch table data
  useEffect(() => {
    async function loadTable() {
      try {
        const res = await fetch("/api/mesero/open-tables", { credentials: "include" });
        const data = await res.json();
        if (!data.success || !data.tables) {
          toast.error("Error", "No se pudieron cargar las mesas");
          router.push("/mesero/mesas-abiertas");
          return;
        }
        // Find the table that contains the order with this ID
        const table = data.tables.find((t: any) =>
          t.orders.some((o: any) => o.id === orderId)
        );
        if (!table) {
          toast.error("Error", "Mesa no encontrada");
          router.push("/mesero/mesas-abiertas");
          return;
        }
        // Normalize items
        const items: OrderItem[] = table.allItems.map((item: any, idx: number) => ({
          id: item.id || idx,
          name: item.name || "Sin nombre",
          price: parseFloat(item.price) || 0,
          quantity: item.quantity || 1,
          modifiers: item.modifiers || [],
        }));
        setTableData({
          tableName: table.tableName,
          totalMesa: table.totalMesa,
          allItems: items,
          orders: table.orders,
        });
        // Initialize modes
        initEqualSplit(2, table.totalMesa);
        initItemsSplit(items);
        initCustomSplit(2, table.totalMesa);
      } catch {
        toast.error("Error", "Error al cargar datos de la mesa");
        router.push("/mesero/mesas-abiertas");
      } finally {
        setLoading(false);
      }
    }
    loadTable();
  }, [orderId]);

  // ========== EQUAL SPLIT ==========
  const initEqualSplit = (parts: number, total: number) => {
    const perPerson = Math.floor((total / parts) * 100) / 100;
    const remainder = Math.round((total - perPerson * parts) * 100) / 100;
    const accounts: SplitAccount[] = Array.from({ length: parts }, (_, i) => ({
      label: `Cuenta ${i + 1}`,
      items: [],
      amount: i === 0 ? perPerson + remainder : perPerson,
      paymentMethod: "efectivo",
      amountPaid: "",
      isPaid: false,
    }));
    setEqualParts(parts);
    setEqualAccounts(accounts);
  };

  const handleEqualPartsChange = (parts: number) => {
    if (!tableData || parts < 2 || parts > 20) return;
    initEqualSplit(parts, tableData.totalMesa);
  };

  // ========== ITEMS SPLIT ==========
  const initItemsSplit = (items: OrderItem[]) => {
    setUnassignedItems(items.map((item) => ({ ...item })));
    setItemAccounts([
      { label: "Cuenta 1", items: [], amount: 0, paymentMethod: "efectivo", amountPaid: "", isPaid: false },
      { label: "Cuenta 2", items: [], amount: 0, paymentMethod: "efectivo", amountPaid: "", isPaid: false },
    ]);
  };

  const calcItemTotal = (item: OrderItem) => {
    const modTotal = (item.modifiers || []).reduce((s, m) => s + (m.price || 0), 0);
    return (item.price + modTotal) * item.quantity;
  };

  const assignItemToAccount = (itemIdx: number, accountIdx: number) => {
    const item = unassignedItems[itemIdx];
    if (!item) return;
    setUnassignedItems((prev) => prev.filter((_, i) => i !== itemIdx));
    setItemAccounts((prev) => {
      const updated = prev.map((a, i) => {
        if (i !== accountIdx) return a;
        const newItems = [...a.items, item];
        return { ...a, items: newItems, amount: newItems.reduce((s, it) => s + calcItemTotal(it), 0) };
      });
      return updated;
    });
  };

  const removeItemFromAccount = (accountIdx: number, itemIdx: number) => {
    setItemAccounts((prev) => {
      const account = prev[accountIdx];
      const item = account.items[itemIdx];
      const newItems = account.items.filter((_, i) => i !== itemIdx);
      const updated = prev.map((a, i) => {
        if (i !== accountIdx) return a;
        return { ...a, items: newItems, amount: newItems.reduce((s, it) => s + calcItemTotal(it), 0) };
      });
      setUnassignedItems((ui) => [...ui, item]);
      return updated;
    });
  };

  const addItemAccount = () => {
    setItemAccounts((prev) => [
      ...prev,
      { label: `Cuenta ${prev.length + 1}`, items: [], amount: 0, paymentMethod: "efectivo", amountPaid: "", isPaid: false },
    ]);
  };

  const removeItemAccount = (idx: number) => {
    if (itemAccounts.length <= 2) return;
    const account = itemAccounts[idx];
    // Return items to unassigned
    setUnassignedItems((prev) => [...prev, ...account.items]);
    setItemAccounts((prev) => {
      const filtered = prev.filter((_, i) => i !== idx);
      return filtered.map((a, i) => ({ ...a, label: `Cuenta ${i + 1}` }));
    });
  };

  // ========== CUSTOM SPLIT ==========
  const initCustomSplit = (parts: number, total: number) => {
    setCustomAccounts(
      Array.from({ length: parts }, (_, i) => ({
        label: `Cuenta ${i + 1}`,
        items: [],
        amount: i === 0 ? total : 0,
        paymentMethod: "efectivo",
        amountPaid: "",
        isPaid: false,
      }))
    );
  };

  const updateCustomAmount = (idx: number, value: string) => {
    const numVal = parseFloat(value) || 0;
    setCustomAccounts((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, amount: numVal } : a))
    );
  };

  const addCustomAccount = () => {
    setCustomAccounts((prev) => [
      ...prev,
      { label: `Cuenta ${prev.length + 1}`, items: [], amount: 0, paymentMethod: "efectivo", amountPaid: "", isPaid: false },
    ]);
  };

  const removeCustomAccount = (idx: number) => {
    if (customAccounts.length <= 2) return;
    setCustomAccounts((prev) => {
      const filtered = prev.filter((_, i) => i !== idx);
      return filtered.map((a, i) => ({ ...a, label: `Cuenta ${i + 1}` }));
    });
  };

  const customRemaining = useCallback(() => {
    if (!tableData) return 0;
    const sum = customAccounts.reduce((s, a) => s + a.amount, 0);
    return Math.round((tableData.totalMesa - sum) * 100) / 100;
  }, [customAccounts, tableData]);

  // ========== PAYMENT MODAL ==========
  const getActiveAccounts = (): SplitAccount[] => {
    if (activeTab === "equal") return equalAccounts;
    if (activeTab === "items") return itemAccounts;
    return customAccounts;
  };

  const setActiveAccounts = (updater: (prev: SplitAccount[]) => SplitAccount[]) => {
    if (activeTab === "equal") setEqualAccounts(updater);
    else if (activeTab === "items") setItemAccounts(updater);
    else setCustomAccounts(updater);
  };

  const openPayModal = (idx: number) => {
    const accounts = getActiveAccounts();
    const account = accounts[idx];
    setPayingAccountIdx(idx);
    setPayModalMethod(account.paymentMethod);
    setPayModalAmount("");
    setPayModalOpen(true);
  };

  const confirmPay = () => {
    const accounts = getActiveAccounts();
    const account = accounts[payingAccountIdx];
    if (!account) return;

    if (payModalMethod === "efectivo") {
      const paid = parseFloat(payModalAmount);
      if (!payModalAmount || isNaN(paid) || paid < account.amount) {
        toast.error("Error", "El monto pagado debe ser mayor o igual al subtotal");
        return;
      }
    }

    setActiveAccounts((prev) =>
      prev.map((a, i) =>
        i === payingAccountIdx
          ? {
              ...a,
              paymentMethod: payModalMethod,
              amountPaid: payModalMethod === "efectivo" ? payModalAmount : String(a.amount),
              isPaid: true,
            }
          : a
      )
    );

    if (payModalMethod === "efectivo") {
      const change = parseFloat(payModalAmount) - account.amount;
      if (change > 0) {
        toast.success("Pagado", `${account.label} pagada. Cambio: $${change.toFixed(2)}`);
      } else {
        toast.success("Pagado", `${account.label} pagada correctamente`);
      }
    } else {
      toast.success("Pagado", `${account.label} pagada con tarjeta`);
    }

    setPayModalOpen(false);
  };

  const undoPay = (idx: number) => {
    setActiveAccounts((prev) =>
      prev.map((a, i) =>
        i === idx ? { ...a, isPaid: false, amountPaid: "" } : a
      )
    );
  };

  // ========== SUBMIT ==========
  const canSubmit = (): boolean => {
    const accounts = getActiveAccounts();
    if (accounts.length < 2) return false;
    if (!accounts.every((a) => a.isPaid)) return false;
    if (activeTab === "items" && unassignedItems.length > 0) return false;
    if (activeTab === "items" && accounts.some((a) => a.items.length === 0)) return false;
    if (activeTab === "custom") {
      const remaining = customRemaining();
      if (Math.abs(remaining) > 0.02) return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!tableData || !canSubmit()) return;
    setSubmitting(true);

    const accounts = getActiveAccounts();
    const splits = accounts.map((a) => ({
      label: a.label,
      amount: a.amount,
      paymentMethod: a.paymentMethod,
      amountPaid: a.paymentMethod === "efectivo" ? parseFloat(a.amountPaid) : a.amount,
      items: a.items.length > 0 ? a.items : undefined,
    }));

    try {
      const res = await fetch("/api/mesero/split-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableName: tableData.tableName,
          totalAmount: tableData.totalMesa,
          splits,
        }),
      });
      const result = await res.json();

      if (result.success) {
        toast.success("Mesa cerrada", `${tableData.tableName} cerrada con ${accounts.length} cuentas divididas`);
        router.push("/mesero/mesas-abiertas");
      } else {
        toast.error("Error", result.error || "No se pudo cerrar la mesa");
      }
    } catch {
      toast.error("Error", "Error al procesar el pago dividido");
    } finally {
      setSubmitting(false);
    }
  };

  // ========== RENDER ==========
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-colibri-green via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-colibri-gold" />
      </div>
    );
  }

  if (!tableData) return null;

  const accounts = getActiveAccounts();
  const allPaid = accounts.every((a) => a.isPaid);
  const payingAccount = payingAccountIdx >= 0 ? accounts[payingAccountIdx] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-colibri-green via-slate-900 to-slate-950 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
            onClick={() => router.push("/mesero/mesas-abiertas")}
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Volver
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(171,153,118,0.5)]">
              Dividir Cuenta
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge className="bg-colibri-wine text-white font-bold">{tableData.tableName}</Badge>
              <Badge className="bg-colibri-gold text-slate-900 font-black text-lg">
                Total: ${tableData.totalMesa.toFixed(2)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 bg-slate-800/80 border border-colibri-gold/30">
            <TabsTrigger
              value="equal"
              className="data-[state=active]:bg-colibri-wine data-[state=active]:text-white font-bold text-white/70"
            >
              <Users className="h-4 w-4 mr-2" />
              Partes Iguales
            </TabsTrigger>
            <TabsTrigger
              value="items"
              className="data-[state=active]:bg-colibri-wine data-[state=active]:text-white font-bold text-white/70"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Por Productos
            </TabsTrigger>
            <TabsTrigger
              value="custom"
              className="data-[state=active]:bg-colibri-wine data-[state=active]:text-white font-bold text-white/70"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Montos Libres
            </TabsTrigger>
          </TabsList>

          {/* ==================== EQUAL SPLIT ==================== */}
          <TabsContent value="equal" className="space-y-4">
            <Card className="bg-slate-900/80 border-colibri-gold/30">
              <CardContent className="pt-6">
                <Label className="text-white font-bold text-base mb-3 block">
                  ¿En cuántas partes dividir?
                </Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-colibri-gold text-colibri-gold hover:bg-colibri-gold/20"
                    onClick={() => handleEqualPartsChange(equalParts - 1)}
                    disabled={equalParts <= 2}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-3xl font-black text-colibri-gold w-12 text-center">
                    {equalParts}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-colibri-gold text-colibri-gold hover:bg-colibri-gold/20"
                    onClick={() => handleEqualPartsChange(equalParts + 1)}
                    disabled={equalParts >= 20}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-white/70 font-medium ml-2">personas</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              {equalAccounts.map((account, idx) => (
                <AccountCard
                  key={idx}
                  account={account}
                  onPay={() => openPayModal(idx)}
                  onUndoPay={() => undoPay(idx)}
                />
              ))}
            </div>
          </TabsContent>

          {/* ==================== ITEMS SPLIT ==================== */}
          <TabsContent value="items" className="space-y-4">
            {/* Unassigned items */}
            {unassignedItems.length > 0 && (
              <Card className="bg-slate-900/80 border-colibri-gold/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-colibri-gold" />
                    Productos sin asignar ({unassignedItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {unassignedItems.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center justify-between bg-slate-800/80 p-3 rounded-lg border border-white/10">
                      <div className="flex-1">
                        <span className="text-white font-semibold">
                          {item.quantity}x {item.name}
                        </span>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-xs text-slate-400 mt-0.5">
                            {item.modifiers.map((m) => m.modifier).join(", ")}
                          </div>
                        )}
                        <span className="text-colibri-gold font-bold ml-3">
                          ${calcItemTotal(item).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex gap-1 ml-2">
                        {itemAccounts.map((account, accIdx) => (
                          <Button
                            key={accIdx}
                            size="sm"
                            className="bg-colibri-wine/80 hover:bg-colibri-wine text-white text-xs px-2 py-1 h-7"
                            onClick={() => assignItemToAccount(itemIdx, accIdx)}
                          >
                            C{accIdx + 1}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Item accounts */}
            <div className="grid gap-3 sm:grid-cols-2">
              {itemAccounts.map((account, accIdx) => (
                <Card key={accIdx} className={`border ${account.isPaid ? "bg-green-900/40 border-green-500/50" : "bg-slate-900/80 border-colibri-gold/30"}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white font-bold">{account.label}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-colibri-gold text-slate-900 font-black">
                          ${account.amount.toFixed(2)}
                        </Badge>
                        {itemAccounts.length > 2 && !account.isPaid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            onClick={() => removeItemAccount(accIdx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {account.items.length === 0 ? (
                      <p className="text-slate-500 text-sm italic">Asigna productos a esta cuenta</p>
                    ) : (
                      <div className="space-y-1.5 mb-3">
                        {account.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-center justify-between text-sm">
                            <span className="text-white">
                              {item.quantity}x {item.name}
                              <span className="text-colibri-gold ml-2">${calcItemTotal(item).toFixed(2)}</span>
                            </span>
                            {!account.isPaid && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                                onClick={() => removeItemFromAccount(accIdx, itemIdx)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {account.isPaid ? (
                      <div className="flex items-center justify-between">
                        <Badge className="bg-green-600 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" /> Pagada - {account.paymentMethod === "efectivo" ? "Efectivo" : "Tarjeta"}
                        </Badge>
                        <Button size="sm" variant="ghost" className="text-yellow-400 text-xs hover:bg-yellow-500/20" onClick={() => undoPay(accIdx)}>
                          Deshacer
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold mt-1"
                        onClick={() => openPayModal(accIdx)}
                        disabled={account.items.length === 0}
                      >
                        <Banknote className="h-4 w-4 mr-2" /> Cobrar ${account.amount.toFixed(2)}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              variant="outline"
              className="border-colibri-gold text-colibri-gold hover:bg-colibri-gold/20 w-full"
              onClick={addItemAccount}
            >
              <Plus className="h-4 w-4 mr-2" /> Agregar Cuenta
            </Button>
          </TabsContent>

          {/* ==================== CUSTOM SPLIT ==================== */}
          <TabsContent value="custom" className="space-y-4">
            <Card className="bg-slate-900/80 border-colibri-gold/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-bold">Total de la mesa:</span>
                  <span className="text-colibri-gold font-black text-xl">${tableData.totalMesa.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70 font-medium">Restante por asignar:</span>
                  <span className={`font-black text-xl ${Math.abs(customRemaining()) <= 0.02 ? "text-green-400" : "text-red-400"}`}>
                    ${customRemaining().toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              {customAccounts.map((account, idx) => (
                <Card key={idx} className={`border ${account.isPaid ? "bg-green-900/40 border-green-500/50" : "bg-slate-900/80 border-colibri-gold/30"}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white font-bold">{account.label}</CardTitle>
                      {customAccounts.length > 2 && !account.isPaid && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          onClick={() => removeCustomAccount(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {account.isPaid ? (
                      <div className="space-y-2">
                        <div className="text-colibri-gold font-black text-2xl">${account.amount.toFixed(2)}</div>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-green-600 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" /> Pagada - {account.paymentMethod === "efectivo" ? "Efectivo" : "Tarjeta"}
                          </Badge>
                          <Button size="sm" variant="ghost" className="text-yellow-400 text-xs hover:bg-yellow-500/20" onClick={() => undoPay(idx)}>
                            Deshacer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-white/70 text-sm">Monto</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={account.amount || ""}
                            onChange={(e) => updateCustomAmount(idx, e.target.value)}
                            className="bg-slate-800 border-colibri-gold/30 text-white font-bold text-lg"
                            placeholder="0.00"
                          />
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                          onClick={() => openPayModal(idx)}
                          disabled={account.amount <= 0}
                        >
                          <Banknote className="h-4 w-4 mr-2" /> Cobrar ${account.amount.toFixed(2)}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              variant="outline"
              className="border-colibri-gold text-colibri-gold hover:bg-colibri-gold/20 w-full"
              onClick={addCustomAccount}
            >
              <Plus className="h-4 w-4 mr-2" /> Agregar Cuenta
            </Button>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <div className="mt-8 pb-8">
          <Button
            className="w-full py-6 text-lg font-black bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl disabled:opacity-50"
            disabled={!canSubmit() || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Cerrando Mesa...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Confirmar y Cerrar Mesa ({accounts.filter((a) => a.isPaid).length}/{accounts.length} pagadas)
              </>
            )}
          </Button>
          {!canSubmit() && accounts.length >= 2 && (
            <p className="text-center text-yellow-400/80 text-sm mt-2 font-medium">
              {activeTab === "items" && unassignedItems.length > 0
                ? `Faltan ${unassignedItems.length} producto(s) por asignar`
                : activeTab === "custom" && Math.abs(customRemaining()) > 0.02
                ? `Faltan $${customRemaining().toFixed(2)} por asignar`
                : !accounts.every((a) => a.isPaid)
                ? `Faltan ${accounts.filter((a) => !a.isPaid).length} cuenta(s) por cobrar`
                : ""}
            </p>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="max-w-md bg-white border-2 border-gray-300">
          <DialogHeader>
            <DialogTitle className="flex items-center text-gray-900 font-bold text-lg">
              <Calculator className="h-5 w-5 mr-2 text-blue-600" />
              Cobrar {payingAccount?.label}
            </DialogTitle>
          </DialogHeader>

          {payingAccount && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Subtotal:</span>
                  <span className="text-xl font-black text-green-600">
                    ${payingAccount.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-lg font-bold mb-3 block text-gray-900">Método de pago</Label>
                <RadioGroup value={payModalMethod} onValueChange={(v: "efectivo" | "tarjeta") => setPayModalMethod(v)}>
                  <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-300">
                    <RadioGroupItem value="efectivo" id="split-efectivo" />
                    <Label htmlFor="split-efectivo" className="flex items-center cursor-pointer text-gray-900 font-bold text-base">
                      <Banknote className="h-5 w-5 mr-2 text-green-600" />
                      Efectivo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-300">
                    <RadioGroupItem value="tarjeta" id="split-tarjeta" />
                    <Label htmlFor="split-tarjeta" className="flex items-center cursor-pointer text-gray-900 font-bold text-base">
                      <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                      Tarjeta
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {payModalMethod === "efectivo" && (
                <div>
                  <Label htmlFor="split-amount" className="text-lg font-bold text-gray-900">
                    ¿Con cuánto paga?
                  </Label>
                  <Input
                    id="split-amount"
                    type="number"
                    value={payModalAmount}
                    onChange={(e) => setPayModalAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-xl mt-2 bg-white text-gray-900 border-2 border-gray-400 focus:border-blue-600 font-bold placeholder:text-gray-500"
                    step="0.01"
                    min={payingAccount.amount}
                  />
                  {payModalAmount && !isNaN(parseFloat(payModalAmount)) && (
                    <div className="mt-2 p-3 bg-gray-50 rounded border">
                      <div className="flex justify-between text-sm text-gray-800">
                        <span className="font-medium">Subtotal:</span>
                        <span className="font-semibold">${payingAccount.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-800">
                        <span className="font-medium">Pagó:</span>
                        <span className="font-semibold">${parseFloat(payModalAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2 mt-1">
                        <span className="text-gray-800">Cambio:</span>
                        <span className={parseFloat(payModalAmount) >= payingAccount.amount ? "text-green-600" : "text-red-600"}>
                          ${Math.max(0, parseFloat(payModalAmount) - payingAccount.amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {payModalMethod === "tarjeta" && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center text-blue-800 mb-2">
                    <CreditCard className="h-4 w-4 mr-2" />
                    <span className="font-semibold">Pago con tarjeta</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Se cobrará <strong className="text-gray-900">${payingAccount.amount.toFixed(2)}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayModalOpen(false)}
              className="border-gray-400 text-gray-700 hover:bg-gray-100 font-semibold"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmPay}
              disabled={payModalMethod === "efectivo" && (!payModalAmount || parseFloat(payModalAmount) < (payingAccount?.amount || 0))}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== SUB-COMPONENTS ==========

function AccountCard({
  account,
  onPay,
  onUndoPay,
}: {
  account: SplitAccount;
  onPay: () => void;
  onUndoPay: () => void;
}) {
  return (
    <Card className={`border ${account.isPaid ? "bg-green-900/40 border-green-500/50" : "bg-slate-900/80 border-colibri-gold/30"}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-bold text-lg">{account.label}</span>
          <span className="text-colibri-gold font-black text-2xl">${account.amount.toFixed(2)}</span>
        </div>
        {account.isPaid ? (
          <div className="flex items-center justify-between">
            <Badge className="bg-green-600 text-white">
              <CheckCircle className="h-3 w-3 mr-1" /> Pagada - {account.paymentMethod === "efectivo" ? "Efectivo" : "Tarjeta"}
            </Badge>
            <Button size="sm" variant="ghost" className="text-yellow-400 text-xs hover:bg-yellow-500/20" onClick={onUndoPay}>
              Deshacer
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
            onClick={onPay}
          >
            <Banknote className="h-4 w-4 mr-2" /> Cobrar ${account.amount.toFixed(2)}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
