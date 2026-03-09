/**
 * Ingredients & Recipes Service — "Insumos por Porción"
 *
 * Simple approach:
 * - Ingredients = raw materials tracked in portions (the unit the restaurant already thinks in)
 * - Recipes = simple list of how many portions of each ingredient a product uses
 * - When selling a product WITH a recipe → deduct ingredients
 * - When selling a product WITHOUT a recipe → deduct product stock as before
 * - Product cost auto-calculated from recipe ingredients
 */

import { executeQuery } from '@/lib/db-retry'

// ─── Types ─────────────────────────────────
export interface Ingredient {
  id: number
  name: string
  unit: string           // "porción", "pieza", "ml", "g" — whatever the restaurateur prefers
  stock: number
  cost_per_unit: number  // cost per 1 unit
  min_stock: number      // alert threshold
  supplier: string | null
  category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RecipeItem {
  id: number
  product_id: number
  ingredient_id: number
  quantity: number       // how many units of this ingredient per 1 product
  ingredient_name?: string
  ingredient_unit?: string
  ingredient_stock?: number
  ingredient_cost?: number
}

export type IngredientMovementType = 'sale' | 'cancel_restore' | 'entry' | 'manual_reduce' | 'waste' | 'adjustment'

// ─── Migration (idempotent) ────────────────
let _ingredientsMigrated = false
export async function ensureIngredientTables() {
  if (_ingredientsMigrated) return
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        unit VARCHAR(50) NOT NULL DEFAULT 'porción',
        stock DECIMAL(10,2) NOT NULL DEFAULT 0,
        cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
        min_stock DECIMAL(10,2) NOT NULL DEFAULT 5,
        supplier VARCHAR(200) DEFAULT NULL,
        category VARCHAR(100) DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_category (category),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, [])

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS recipe_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        ingredient_id INT NOT NULL,
        quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_product_ingredient (product_id, ingredient_id),
        INDEX idx_product (product_id),
        INDEX idx_ingredient (ingredient_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, [])

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS ingredient_movements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ingredient_id INT NOT NULL,
        previous_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
        new_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
        change_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        change_type VARCHAR(30) NOT NULL,
        reference_id VARCHAR(50) DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        created_by INT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ingredient (ingredient_id),
        INDEX idx_type (change_type),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, [])

    _ingredientsMigrated = true
  } catch (e: any) {
    if (!e.message?.includes('already exists')) console.error('Ingredients migration error:', e.message)
    _ingredientsMigrated = true
  }
}

// ─── CRUD: Ingredients ─────────────────────

export async function getIngredients(opts: { active_only?: boolean; category?: string } = {}) {
  await ensureIngredientTables()
  let query = 'SELECT * FROM ingredients WHERE 1=1'
  const params: any[] = []
  if (opts.active_only !== false) { query += ' AND is_active = 1'; }
  if (opts.category) { query += ' AND category = ?'; params.push(opts.category) }
  query += ' ORDER BY category, name'
  return await executeQuery(query, params) as Ingredient[]
}

export async function getIngredientById(id: number) {
  await ensureIngredientTables()
  const rows = await executeQuery('SELECT * FROM ingredients WHERE id = ?', [id]) as Ingredient[]
  return rows[0] || null
}

export async function createIngredient(data: {
  name: string; unit?: string; stock?: number; cost_per_unit?: number;
  min_stock?: number; supplier?: string; category?: string
}) {
  await ensureIngredientTables()
  const result = await executeQuery(
    `INSERT INTO ingredients (name, unit, stock, cost_per_unit, min_stock, supplier, category)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.name, data.unit || 'porción', data.stock || 0, data.cost_per_unit || 0, data.min_stock || 5, data.supplier || null, data.category || null]
  ) as any
  return { id: result.insertId, ...data }
}

export async function updateIngredient(id: number, data: Partial<{
  name: string; unit: string; cost_per_unit: number;
  min_stock: number; supplier: string; category: string; is_active: boolean
}>) {
  await ensureIngredientTables()
  const fields: string[] = []
  const params: any[] = []
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) { fields.push(`${key} = ?`); params.push(val) }
  }
  if (fields.length === 0) return
  params.push(id)
  await executeQuery(`UPDATE ingredients SET ${fields.join(', ')} WHERE id = ?`, params)
}

export async function deleteIngredient(id: number) {
  await ensureIngredientTables()
  // Remove from recipes first
  await executeQuery('DELETE FROM recipe_items WHERE ingredient_id = ?', [id])
  await executeQuery('DELETE FROM ingredients WHERE id = ?', [id])
}

// ─── Ingredient stock operations ───────────

export async function adjustIngredientStock(
  ingredientId: number, changeAmount: number, changeType: IngredientMovementType,
  opts: { referenceId?: string; notes?: string; userId?: number; absoluteSet?: number } = {}
) {
  await ensureIngredientTables()
  const rows = await executeQuery('SELECT stock FROM ingredients WHERE id = ?', [ingredientId]) as any[]
  if (!rows.length) throw new Error(`Ingredient ${ingredientId} not found`)

  const previousStock = Number(rows[0].stock) || 0
  let newStock: number
  if (opts.absoluteSet !== undefined) {
    newStock = Math.max(0, opts.absoluteSet)
  } else {
    newStock = Math.max(0, previousStock + changeAmount)
  }

  await executeQuery('UPDATE ingredients SET stock = ? WHERE id = ?', [newStock, ingredientId])

  await executeQuery(
    `INSERT INTO ingredient_movements (ingredient_id, previous_stock, new_stock, change_amount, change_type, reference_id, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [ingredientId, previousStock, newStock, changeAmount, changeType, opts.referenceId || null, opts.notes || null, opts.userId || null]
  )

  return { success: true, previousStock, newStock }
}

// ─── CRUD: Recipes ─────────────────────────

export async function getRecipe(productId: number): Promise<RecipeItem[]> {
  await ensureIngredientTables()
  return await executeQuery(`
    SELECT ri.*, i.name as ingredient_name, i.unit as ingredient_unit, 
           i.stock as ingredient_stock, i.cost_per_unit as ingredient_cost
    FROM recipe_items ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    WHERE ri.product_id = ?
    ORDER BY i.name
  `, [productId]) as RecipeItem[]
}

export async function setRecipe(productId: number, items: { ingredient_id: number; quantity: number }[]) {
  await ensureIngredientTables()
  // Delete old recipe
  await executeQuery('DELETE FROM recipe_items WHERE product_id = ?', [productId])
  // Insert new items
  for (const item of items) {
    if (item.ingredient_id && item.quantity > 0) {
      await executeQuery(
        'INSERT INTO recipe_items (product_id, ingredient_id, quantity) VALUES (?, ?, ?)',
        [productId, item.ingredient_id, item.quantity]
      )
    }
  }
  // Auto-update product cost
  await recalcProductCost(productId)
  return await getRecipe(productId)
}

export async function getProductsWithRecipes() {
  await ensureIngredientTables()
  const rows = await executeQuery(`
    SELECT p.id, p.name, p.price, p.cost_price, p.stock, p.image_url,
           c.name as category_name,
           COUNT(ri.id) as ingredient_count,
           SUM(ri.quantity * i.cost_per_unit) as recipe_cost
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN recipe_items ri ON ri.product_id = p.id
    LEFT JOIN ingredients i ON ri.ingredient_id = i.id
    GROUP BY p.id
    ORDER BY c.name, p.name
  `, []) as any[]
  return rows
}

// ─── Auto-cost calculation ─────────────────

export async function recalcProductCost(productId: number) {
  await ensureIngredientTables()
  const rows = await executeQuery(`
    SELECT SUM(ri.quantity * i.cost_per_unit) as total_cost
    FROM recipe_items ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    WHERE ri.product_id = ?
  `, [productId]) as any[]

  const cost = Number(rows[0]?.total_cost) || 0
  if (cost > 0) {
    await executeQuery('UPDATE products SET cost_price = ? WHERE id = ?', [cost, productId])
  }
  return cost
}

export async function recalcAllProductCosts() {
  await ensureIngredientTables()
  const products = await executeQuery(
    'SELECT DISTINCT product_id FROM recipe_items', []
  ) as any[]
  for (const p of products) {
    await recalcProductCost(p.product_id)
  }
  return products.length
}

// ─── Deduct ingredients for an order ───────

export async function hasRecipe(productId: number): Promise<boolean> {
  await ensureIngredientTables()
  const rows = await executeQuery(
    'SELECT COUNT(*) as cnt FROM recipe_items WHERE product_id = ?', [productId]
  ) as any[]
  return Number(rows[0]?.cnt) > 0
}

/**
 * For a sold product: if it has a recipe, deduct ingredients.
 * Returns true if ingredients were deducted, false if product-level deduction should be used.
 */
export async function deductIngredientsForProduct(
  productId: number, quantity: number, orderId: number, userId?: number
): Promise<boolean> {
  await ensureIngredientTables()
  const recipe = await getRecipe(productId)
  if (recipe.length === 0) return false // no recipe → fall back to product stock

  for (const item of recipe) {
    const totalDeduct = item.quantity * quantity
    await adjustIngredientStock(item.ingredient_id, -totalDeduct, 'sale', {
      referenceId: `order-${orderId}`,
      notes: `Venta pedido #${orderId} (${quantity}x producto #${productId})`,
      userId,
    })
  }
  return true
}

/**
 * Restore ingredients when an order is cancelled
 */
export async function restoreIngredientsForProduct(
  productId: number, quantity: number, orderId: number, userId?: number
): Promise<boolean> {
  await ensureIngredientTables()
  const recipe = await getRecipe(productId)
  if (recipe.length === 0) return false

  for (const item of recipe) {
    const totalRestore = item.quantity * quantity
    await adjustIngredientStock(item.ingredient_id, totalRestore, 'cancel_restore', {
      referenceId: `order-${orderId}`,
      notes: `Cancelación pedido #${orderId} (${quantity}x producto #${productId})`,
      userId,
    })
  }
  return true
}

// ─── Check ingredient availability ─────────

export async function checkIngredientsAvailability(productId: number, quantity: number): Promise<{
  available: boolean; missing: { ingredient_name: string; needed: number; have: number; unit: string }[]
}> {
  await ensureIngredientTables()
  const recipe = await getRecipe(productId)
  if (recipe.length === 0) return { available: true, missing: [] } // no recipe = no ingredient check

  const missing: { ingredient_name: string; needed: number; have: number; unit: string }[] = []
  for (const item of recipe) {
    const needed = item.quantity * quantity
    const have = Number(item.ingredient_stock) || 0
    if (have < needed) {
      missing.push({
        ingredient_name: item.ingredient_name || `Insumo #${item.ingredient_id}`,
        needed, have,
        unit: item.ingredient_unit || 'porción',
      })
    }
  }
  return { available: missing.length === 0, missing }
}

// ─── Ingredient summary for dashboard ──────

export async function getIngredientsSummary() {
  await ensureIngredientTables()
  const ingredients = await executeQuery(`
    SELECT i.*, 
           COUNT(DISTINCT ri.product_id) as used_in_products
    FROM ingredients i
    LEFT JOIN recipe_items ri ON ri.ingredient_id = i.id
    WHERE i.is_active = 1
    GROUP BY i.id
    ORDER BY i.stock ASC
  `, []) as any[]

  const totals = {
    total: ingredients.length,
    out_of_stock: 0,
    low_stock: 0,
    healthy: 0,
    total_value: 0,
  }
  for (const ing of ingredients) {
    const stock = Number(ing.stock) || 0
    const minStock = Number(ing.min_stock) || 5
    totals.total_value += stock * (Number(ing.cost_per_unit) || 0)
    if (stock <= 0) totals.out_of_stock++
    else if (stock <= minStock) totals.low_stock++
    else totals.healthy++
  }

  return { ingredients, totals }
}

export async function getIngredientMovements(opts: {
  ingredientId?: number; type?: string; limit?: number; offset?: number
} = {}) {
  await ensureIngredientTables()
  let query = `
    SELECT im.*, i.name as ingredient_name, i.unit as ingredient_unit
    FROM ingredient_movements im
    LEFT JOIN ingredients i ON im.ingredient_id = i.id
    WHERE 1=1`
  const params: any[] = []
  if (opts.ingredientId) { query += ' AND im.ingredient_id = ?'; params.push(opts.ingredientId) }
  if (opts.type) { query += ' AND im.change_type = ?'; params.push(opts.type) }
  query += ' ORDER BY im.created_at DESC LIMIT ? OFFSET ?'
  params.push(opts.limit || 50, opts.offset || 0)

  const movements = await executeQuery(query, params) as any[]
  const countQ = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY.*$/, '')
  const [{ total }] = await executeQuery(
    `SELECT COUNT(*) as total FROM ingredient_movements im WHERE 1=1${opts.ingredientId ? ' AND im.ingredient_id = ?' : ''}${opts.type ? ' AND im.change_type = ?' : ''}`,
    params.slice(0, -2)
  ) as any[]
  return { movements, total }
}
