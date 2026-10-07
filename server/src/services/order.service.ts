import pool from "../db/connection";

async function withItems(order: any) {
  const items = await pool.query(
    `SELECT oi.id, oi.quantity, p.id AS product_id, p.name, p.price
     FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1`,
    [order.id]
  );
  return { ...order, items: items.rows };
}

const base = `SELECT o.*, s.name AS store_name, u.name AS client_name
              FROM orders o JOIN stores s ON s.id = o.store_id JOIN users u ON u.id = o.client_id`;

export async function createOrder(clientId: string, storeId: string, items: { productId: string; quantity: number }[]) {
  if (!Array.isArray(items) || !items.length) throw new Error("El pedido necesita al menos un producto");
  for (const item of items) if (!Number.isInteger(item.quantity) || item.quantity < 1) throw new Error("Cantidad invalida");

  const store = await pool.query("SELECT is_open FROM stores WHERE id = $1", [storeId]);
  if (!store.rows.length) throw new Error("Tienda no encontrada");
  if (!store.rows[0].is_open) throw new Error("La tienda esta cerrada");

  const ids = items.map(x => x.productId);
  const products = await pool.query("SELECT id FROM products WHERE store_id = $1 AND id = ANY($2::uuid[])", [storeId, ids]);
  if (products.rows.length !== new Set(ids).size) throw new Error("Hay productos que no pertenecen a esta tienda");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const orderResult = await client.query("INSERT INTO orders (client_id,store_id,status) VALUES ($1,$2,'waiting_for_deliver') RETURNING *", [clientId, storeId]);
    const order = orderResult.rows[0];
    for (const item of items) await client.query("INSERT INTO order_items (order_id,product_id,quantity) VALUES ($1,$2,$3)", [order.id, item.productId, item.quantity]);
    await client.query("COMMIT");
    return withItems(order);
  } catch (e) { await client.query("ROLLBACK"); throw e; }
  finally { client.release(); }
}

export async function getClientOrders(clientId: string) {
  const result = await pool.query(`${base} WHERE o.client_id = $1 ORDER BY o.created_at DESC`, [clientId]);
  return Promise.all(result.rows.map(withItems));
}

async function storeId(userId: string) {
  const result = await pool.query("SELECT id FROM stores WHERE user_owner_id = $1", [userId]);
  if (!result.rows.length) throw new Error("No tienes tienda asociada");
  return result.rows[0].id;
}

export async function getStoreOrders(userId: string) {
  const id = await storeId(userId);
  const result = await pool.query(`${base} WHERE o.store_id = $1 ORDER BY o.created_at DESC`, [id]);
  return Promise.all(result.rows.map(withItems));
}

export async function getAvailableOrders() {
  const result = await pool.query(`${base} WHERE o.status = 'waiting_for_deliver' ORDER BY o.created_at ASC`);
  return Promise.all(result.rows.map(withItems));
}

export async function getMyDeliveries(deliveryId: string) {
  const result = await pool.query(`${base} WHERE o.delivery_id = $1 ORDER BY o.created_at DESC`, [deliveryId]);
  return Promise.all(result.rows.map(withItems));
}

export async function acceptOrder(deliveryId: string, orderId: string) {
  const result = await pool.query("UPDATE orders SET delivery_id=$1,status='in_progress' WHERE id=$2 AND status='waiting_for_deliver' RETURNING *", [deliveryId, orderId]);
  if (!result.rows.length) {
    const exists = await pool.query("SELECT id FROM orders WHERE id=$1", [orderId]);
    if (!exists.rows.length) throw new Error("Pedido no encontrado");
    throw new Error("Este pedido ya fue tomado por otro domiciliario");
  }
  return withItems(result.rows[0]);
}

export async function releaseOrder(deliveryId: string, orderId: string) {
  const result = await pool.query("UPDATE orders SET delivery_id=NULL,status='waiting_for_deliver' WHERE id=$1 AND delivery_id=$2 AND status='in_progress' RETURNING *", [orderId, deliveryId]);
  if (!result.rows.length) throw new Error("No puedes liberar este pedido");
  return withItems(result.rows[0]);
}

export async function deliverOrder(deliveryId: string, orderId: string) {
  const result = await pool.query("UPDATE orders SET status='delivered' WHERE id=$1 AND delivery_id=$2 AND status='in_progress' RETURNING *", [orderId, deliveryId]);
  if (!result.rows.length) throw new Error("No puedes marcar este pedido como entregado");
  return withItems(result.rows[0]);
}
