'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  Crown, Users, TrendingUp, Coins, Gift, Settings, Loader2,
  Search, Plus, Minus, Save, Star, Award, Trophy, Diamond,
  ArrowUpDown, History, Zap
} from 'lucide-react'
import { useToast } from '@/hooks/use-notifications'

interface LoyaltyStats {
  totalMembers: number
  totalPointsInCirculation: number
  pointsEarnedToday: number
  pointsRedeemedToday: number
  tierDistribution: { tier: string; count: number }[]
  topMembers: { user_id: number; username: string; email: string; total_points: number; lifetime_points: number; tier: string }[]
  recentActivity: { id: number; user_id: number; type: string; points: number; description: string; created_at: string; username?: string }[]
}

interface LoyaltyConfig {
  points_per_currency: number
  currency_per_point: number
  redemption_value: number
  min_redeem: number
  is_active: boolean
}

const TIER_ICONS: Record<string, any> = { bronce: Award, plata: Star, oro: Trophy, diamante: Diamond }
const TIER_COLORS: Record<string, string> = { bronce: '#CD7F32', plata: '#C0C0C0', oro: '#FFD700', diamante: '#B9F2FF' }
const TIER_LABELS: Record<string, string> = { bronce: 'Bronce', plata: 'Plata', oro: 'Oro', diamante: 'Diamante' }

export default function LealtadAdminPage() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<LoyaltyStats | null>(null)
  const [config, setConfig] = useState<LoyaltyConfig | null>(null)
  const [saving, setSaving] = useState(false)

  // Bonus dialog
  const [bonusOpen, setBonusOpen] = useState(false)
  const [bonusUserId, setBonusUserId] = useState('')
  const [bonusPoints, setBonusPoints] = useState('')
  const [bonusDesc, setBonusDesc] = useState('')
  const [bonusSaving, setBonusSaving] = useState(false)

  // Search members
  const [searchTerm, setSearchTerm] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, configRes] = await Promise.all([
        fetch('/api/loyalty?action=stats'),
        fetch('/api/loyalty?action=admin-config'),
      ])
      const statsData = await statsRes.json()
      const configData = await configRes.json()
      if (statsData.success) setStats(statsData.stats)
      if (configData.success) setConfig(configData.config)
    } catch (e: any) {
      toast.error('Error cargando datos de lealtad')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSaveConfig = async () => {
    if (!config) return
    setSaving(true)
    try {
      const res = await fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'update-config', config }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Configuración guardada')
      } else {
        toast.error(data.error || 'Error guardando')
      }
    } catch {
      toast.error('Error de red')
    } finally {
      setSaving(false)
    }
  }

  const handleBonus = async () => {
    if (!bonusUserId || !bonusPoints) return
    setBonusSaving(true)
    try {
      const res = await fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'bonus',
          user_id: Number(bonusUserId),
          points: Number(bonusPoints),
          description: bonusDesc || 'Ajuste administrativo',
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Puntos ajustados. Nuevo saldo: ${data.newBalance}`)
        setBonusOpen(false)
        setBonusUserId(''); setBonusPoints(''); setBonusDesc('')
        fetchData()
      } else {
        toast.error(data.error || 'Error')
      }
    } catch {
      toast.error('Error de red')
    } finally {
      setBonusSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-colibri-gold" />
      </div>
    )
  }

  const filteredTopMembers = stats?.topMembers.filter(m =>
    !searchTerm || m.username?.toLowerCase().includes(searchTerm.toLowerCase()) || m.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Crown className="w-7 h-7 text-colibri-gold" /> Programa de Lealtad
          </h1>
          <p className="text-colibri-beige mt-1">Gestiona puntos, niveles y recompensas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setBonusOpen(true)} variant="outline" className="border-colibri-gold/50 text-colibri-gold hover:bg-colibri-gold/10">
            <Plus className="w-4 h-4 mr-2" /> Ajustar Puntos
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-300 uppercase tracking-wide">Miembros</p>
                <p className="text-2xl font-bold text-white">{stats?.totalMembers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/50 to-amber-800/30 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-300 uppercase tracking-wide">Puntos en Circulación</p>
                <p className="text-2xl font-bold text-white">{(stats?.totalPointsInCirculation || 0).toLocaleString()}</p>
              </div>
              <Coins className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-300 uppercase tracking-wide">Ganados Hoy</p>
                <p className="text-2xl font-bold text-white">+{(stats?.pointsEarnedToday || 0).toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-300 uppercase tracking-wide">Canjeados Hoy</p>
                <p className="text-2xl font-bold text-white">-{(stats?.pointsRedeemedToday || 0).toLocaleString()}</p>
              </div>
              <Gift className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-white/10 border-0">
          <TabsTrigger value="overview" className="data-[state=active]:bg-colibri-green/50 data-[state=active]:text-white text-colibri-beige">
            Vista General
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-colibri-green/50 data-[state=active]:text-white text-colibri-beige">
            Miembros
          </TabsTrigger>
          <TabsTrigger value="config" className="data-[state=active]:bg-colibri-green/50 data-[state=active]:text-white text-colibri-beige">
            Configuración
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tier Distribution */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Distribución por Nivel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats?.tierDistribution?.map(td => {
                  const total = stats.totalMembers || 1
                  const pct = Math.round((td.count / total) * 100)
                  const color = TIER_COLORS[td.tier] || '#888'
                  const label = TIER_LABELS[td.tier] || td.tier
                  return (
                    <div key={td.tier} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-colibri-beige flex items-center gap-2">
                          <span style={{ color }}>{label}</span>
                        </span>
                        <span className="text-white">{td.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  )
                })}
                {(!stats?.tierDistribution || stats.tierDistribution.length === 0) && (
                  <p className="text-sm text-colibri-beige/50">Sin miembros aún</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {stats?.recentActivity?.map(a => (
                    <div key={a.id} className="flex justify-between items-center text-sm py-1.5 border-b border-white/5 last:border-0">
                      <div>
                        <span className="text-white">{a.username || `User #${a.user_id}`}</span>
                        <p className="text-xs text-colibri-beige/60">{a.description}</p>
                      </div>
                      <span className={`font-mono text-sm ${a.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {a.points > 0 ? '+' : ''}{a.points}
                      </span>
                    </div>
                  ))}
                  {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                    <p className="text-sm text-colibri-beige/50">Sin actividad aún</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tier info cards */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg">Niveles del Programa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: 'Bronce', key: 'bronce', min: 0, mult: '1x', icon: '🥉', color: '#CD7F32' },
                  { name: 'Plata', key: 'plata', min: 500, mult: '1.25x', icon: '🥈', color: '#C0C0C0' },
                  { name: 'Oro', key: 'oro', min: 2000, mult: '1.5x', icon: '🥇', color: '#FFD700' },
                  { name: 'Diamante', key: 'diamante', min: 5000, mult: '2x', icon: '💎', color: '#B9F2FF' },
                ].map(tier => (
                  <div key={tier.key} className="rounded-lg p-4 text-center" style={{ backgroundColor: `${tier.color}15`, border: `1px solid ${tier.color}30` }}>
                    <span className="text-3xl">{tier.icon}</span>
                    <p className="font-bold text-white mt-1">{tier.name}</p>
                    <p className="text-xs text-colibri-beige">{tier.min.toLocaleString()}+ pts acumulados</p>
                    <Badge className="mt-1 text-xs" style={{ backgroundColor: `${tier.color}30`, color: tier.color, border: 'none' }}>
                      Multiplicador {tier.mult}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Members ── */}
        <TabsContent value="members" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Top Miembros</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-colibri-beige/50" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-colibri-beige/30"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-colibri-beige/70">
                      <th className="text-left py-2 px-3">Usuario</th>
                      <th className="text-left py-2 px-3">Email</th>
                      <th className="text-center py-2 px-3">Nivel</th>
                      <th className="text-right py-2 px-3">Puntos</th>
                      <th className="text-right py-2 px-3">Acumulados</th>
                      <th className="text-center py-2 px-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTopMembers.map(m => {
                      const tierColor = TIER_COLORS[m.tier] || '#888'
                      const tierLabel = TIER_LABELS[m.tier] || m.tier
                      return (
                        <tr key={m.user_id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-2 px-3 text-white">{m.username}</td>
                          <td className="py-2 px-3 text-colibri-beige/70">{m.email}</td>
                          <td className="py-2 px-3 text-center">
                            <Badge style={{ backgroundColor: `${tierColor}25`, color: tierColor, border: 'none' }}>
                              {tierLabel}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-right text-white font-mono">{m.total_points.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right text-colibri-beige/70 font-mono">{m.lifetime_points.toLocaleString()}</td>
                          <td className="py-2 px-3 text-center">
                            <Button
                              size="sm" variant="ghost"
                              className="text-colibri-gold hover:bg-colibri-gold/10"
                              onClick={() => {
                                setBonusUserId(String(m.user_id))
                                setBonusOpen(true)
                              }}
                            >
                              <ArrowUpDown className="w-3.5 h-3.5 mr-1" /> Ajustar
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredTopMembers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-colibri-beige/50">
                          Sin miembros con puntos aún
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Config ── */}
        <TabsContent value="config" className="space-y-4">
          {config && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Configuración del Programa
                </CardTitle>
                <CardDescription className="text-colibri-beige/60">
                  Define cómo se acumulan y canjean los puntos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                  <div>
                    <p className="text-white font-medium">Programa Activo</p>
                    <p className="text-sm text-colibri-beige/60">Habilitar o deshabilitar la acumulación y canje de puntos</p>
                  </div>
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={v => setConfig({ ...config, is_active: v })}
                  />
                </div>

                <Separator className="bg-white/10" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Earning */}
                  <div className="space-y-4">
                    <h3 className="text-colibri-gold font-medium flex items-center gap-2"><Coins className="w-4 h-4" /> Acumulación</h3>
                    <div className="space-y-2">
                      <Label className="text-colibri-beige text-sm">Puntos ganados por compra</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number" min={1} value={config.points_per_currency}
                          onChange={e => setConfig({ ...config, points_per_currency: Number(e.target.value) || 1 })}
                          className="w-24 bg-white/5 border-white/10 text-white"
                        />
                        <span className="text-colibri-beige/60 text-sm">punto(s) por cada</span>
                        <Input
                          type="number" min={1} step={0.5} value={config.currency_per_point}
                          onChange={e => setConfig({ ...config, currency_per_point: Number(e.target.value) || 10 })}
                          className="w-24 bg-white/5 border-white/10 text-white"
                        />
                        <span className="text-colibri-beige/60 text-sm">$ gastados</span>
                      </div>
                      <p className="text-xs text-colibri-beige/40">
                        Ejemplo: 1 punto por cada $10 = una compra de $150 genera 15 puntos (sin multiplicador)
                      </p>
                    </div>
                  </div>

                  {/* Redemption */}
                  <div className="space-y-4">
                    <h3 className="text-colibri-gold font-medium flex items-center gap-2"><Gift className="w-4 h-4" /> Canje</h3>
                    <div className="space-y-2">
                      <Label className="text-colibri-beige text-sm">Valor de cada punto</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-colibri-beige/60 text-sm">1 punto =</span>
                        <span className="text-colibri-beige/60 text-sm">$</span>
                        <Input
                          type="number" min={0.01} step={0.01} value={config.redemption_value}
                          onChange={e => setConfig({ ...config, redemption_value: Number(e.target.value) || 0.10 })}
                          className="w-24 bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-colibri-beige text-sm">Mínimo de puntos para canjear</Label>
                      <Input
                        type="number" min={1} value={config.min_redeem}
                        onChange={e => setConfig({ ...config, min_redeem: Number(e.target.value) || 50 })}
                        className="w-32 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary card */}
                <div className="p-4 rounded-lg bg-colibri-gold/10 border border-colibri-gold/20">
                  <p className="text-colibri-gold font-medium text-sm mb-1">Resumen</p>
                  <p className="text-colibri-beige text-sm">
                    Un cliente que gaste <strong className="text-white">${(config.currency_per_point * 100).toFixed(0)}</strong> acumula{' '}
                    <strong className="text-white">{config.points_per_currency * 100}</strong> puntos, 
                    que equivalen a <strong className="text-white">${(config.points_per_currency * 100 * config.redemption_value).toFixed(2)}</strong> de descuento.
                    Mínimo para canjear: <strong className="text-white">{config.min_redeem}</strong> puntos 
                    (= ${(config.min_redeem * config.redemption_value).toFixed(2)}).
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveConfig} disabled={saving} className="bg-colibri-green hover:bg-colibri-green/80">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Guardar Configuración
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Bonus Dialog */}
      <Dialog open={bonusOpen} onOpenChange={setBonusOpen}>
        <DialogContent className="bg-gray-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Ajustar Puntos de Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-colibri-beige">ID del Usuario</Label>
              <Input
                value={bonusUserId}
                onChange={e => setBonusUserId(e.target.value)}
                placeholder="Ej: 5"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-colibri-beige">Puntos (positivo = sumar, negativo = restar)</Label>
              <Input
                type="number"
                value={bonusPoints}
                onChange={e => setBonusPoints(e.target.value)}
                placeholder="Ej: 100 o -50"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-colibri-beige">Descripción</Label>
              <Input
                value={bonusDesc}
                onChange={e => setBonusDesc(e.target.value)}
                placeholder="Ej: Bonus por inauguración"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBonusOpen(false)} className="text-colibri-beige">Cancelar</Button>
            <Button onClick={handleBonus} disabled={bonusSaving || !bonusUserId || !bonusPoints} className="bg-colibri-green hover:bg-colibri-green/80">
              {bonusSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
