// api/telegram-report.js
// API dành cho Telegram bot: báo cáo TMĐT và giá vốn sản phẩm TMĐT.

import { buildTelegramEcommerceCostView } from '../js/features/reports/telegramEcommerceCostViewRules.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://iejgtdcdzababydaqjef.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1';

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data, null, 2));
}

function getToken(req, url) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.substring(7);
  return url.searchParams.get('token') || '';
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function getVietnamDateParts(date = new Date()) {
  const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return {
    year: vnDate.getUTCFullYear(),
    month: vnDate.getUTCMonth() + 1,
    day: vnDate.getUTCDate()
  };
}

function vietnamDayRange(year, month, day) {
  const start = new Date(Date.UTC(year, month - 1, day, -7, 0, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, day, 16, 59, 59, 999));
  return { start: start.toISOString(), end: end.toISOString() };
}

function vietnamMonthRange(year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1, -7, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 16, 59, 59, 999));
  return { start: start.toISOString(), end: end.toISOString() };
}

async function supabaseFetch(path) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase query failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

function chunk(array, size = 100) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size));
  return chunks;
}

function formatDateVN(year, month, day) {
  return `${pad2(day)}/${pad2(month)}/${year}`;
}

async function getEcommerceProducts() {
  const products = await supabaseFetch(
    'products?is_ecommerce=eq.true&is_active=eq.true&select=id,product_code,name,is_ecommerce,ecommerce_platforms,product_units(unit_name,cost_price,retail_price,is_base_unit)&order=name.asc'
  );

  return products.map(product => {
    const units = product.product_units || [];
    const baseUnit = units.find(unit => unit.is_base_unit) || units[0] || {};
    return {
      product_code: product.product_code,
      name: product.name,
      unit_name: baseUnit.unit_name || '',
      cost_price: Number(baseUnit.cost_price || 0),
      retail_price: Number(baseUnit.retail_price || 0),
      ecommerce_platforms: product.ecommerce_platforms || []
    };
  });
}

async function getProductStock(queryText) {
  const keyword = String(queryText || '').trim();
  if (!keyword) {
    return {
      query: keyword,
      total: 0,
      products: []
    };
  }

  const safeKeyword = keyword.replace(/[,%*]/g, ' ').replace(/\s+/g, ' ').trim();
  const encodedLike = encodeURIComponent(`*${safeKeyword}*`);
  const products = await supabaseFetch(
    `products?is_active=eq.true&is_ecommerce=eq.true&or=(name.ilike.${encodedLike},product_code.ilike.${encodedLike},barcode.ilike.${encodedLike})&select=id,product_code,barcode,name,is_ecommerce,product_batches(batch_number,stock_quantity,expiry_date)&order=name.asc&limit=20`
  );

  return {
    query: keyword,
    total: products.length,
    products: products.map(product => {
      const batches = product.product_batches || [];
      const stock = batches.reduce((sum, batch) => sum + Number(batch.stock_quantity || 0), 0);
      const activeBatches = batches
        .filter(batch => Number(batch.stock_quantity || 0) !== 0)
        .sort((a, b) => String(a.expiry_date || '').localeCompare(String(b.expiry_date || '')))
        .slice(0, 5);

      return {
        product_code: product.product_code,
        barcode: product.barcode,
        name: product.name,
        stock,
        batches: activeBatches.map(batch => ({
          batch_number: batch.batch_number,
          stock_quantity: Number(batch.stock_quantity || 0),
          expiry_date: batch.expiry_date
        }))
      };
    }).sort((a, b) => b.stock - a.stock)
  };
}

async function getProductCost(queryText) {
  const keyword = String(queryText || '').trim();
  if (!keyword) {
    return {
      query: keyword,
      total: 0,
      products: []
    };
  }

  const safeKeyword = keyword.replace(/[,%*]/g, ' ').replace(/\s+/g, ' ').trim();
  const encodedLike = encodeURIComponent(`*${safeKeyword}*`);
  const products = await supabaseFetch(
    `products?is_active=eq.true&is_ecommerce=eq.true&or=(name.ilike.${encodedLike},product_code.ilike.${encodedLike},barcode.ilike.${encodedLike})&select=id,product_code,barcode,name,is_ecommerce,ecommerce_platforms,product_units(unit_name,cost_price,retail_price,is_base_unit)&order=name.asc&limit=20`
  );

  return {
    query: keyword,
    total: products.length,
    products: products.map(product => {
      const units = product.product_units || [];
      const baseUnit = units.find(unit => unit.is_base_unit) || units[0] || {};
      return {
        product_code: product.product_code,
        barcode: product.barcode,
        name: product.name,
        is_ecommerce: product.is_ecommerce === true,
        ecommerce_platforms: product.ecommerce_platforms || [],
        base_unit_name: baseUnit.unit_name || '',
        base_cost_price: Number(baseUnit.cost_price || 0),
        base_retail_price: Number(baseUnit.retail_price || 0),
        units: units.map(unit => ({
          unit_name: unit.unit_name,
          cost_price: Number(unit.cost_price || 0),
          retail_price: Number(unit.retail_price || 0),
          is_base_unit: unit.is_base_unit === true
        }))
      };
    })
  };
}

async function getEcommerceReport(startIso, endIso) {
  const orders = await supabaseFetch(
    `orders?order_type=eq.ecommerce&status=eq.completed&created_at=gte.${encodeURIComponent(startIso)}&created_at=lte.${encodeURIComponent(endIso)}&select=id,order_code,total,created_at,ecommerce_platform&order=created_at.asc`
  );

  if (!orders.length) {
    return {
      orders_count: 0,
      items_quantity: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
      orders: [],
      top_products: []
    };
  }

  const orderIds = orders.map(order => order.id);
  const items = [];
  for (const ids of chunk(orderIds, 100)) {
    const part = await supabaseFetch(
      `order_items?order_id=in.(${ids.join(',')})&select=id,order_id,product_id,batch_id,product_name,product_code,unit_name,quantity,total_price`
    );
    items.push(...part);
  }

  const productIds = [...new Set(items.map(item => item.product_id).filter(Boolean))];
  const batchIds = [...new Set(items.map(item => item.batch_id).filter(Boolean))];

  const units = [];
  for (const ids of chunk(productIds, 100)) {
    const part = await supabaseFetch(
      `product_units?product_id=in.(${ids.join(',')})&select=product_id,unit_name,cost_price,conversion_rate,is_base_unit`
    );
    units.push(...part);
  }

  const batches = [];
  for (const ids of chunk(batchIds, 100)) {
    const part = await supabaseFetch(
      `product_batches?id=in.(${ids.join(',')})&select=id,cost_price`
    );
    batches.push(...part);
  }

  const batchCostById = new Map(batches.map(batch => [batch.id, Number(batch.cost_price || 0)]));
  const productSummary = new Map();

  let totalCost = 0;
  let totalQty = 0;

  for (const item of items) {
    const quantity = Number(item.quantity || 0);
    totalQty += quantity;

    const batchCost = item.batch_id ? batchCostById.get(item.batch_id) : null;
    const unit = units.find(u => u.product_id === item.product_id && u.unit_name === item.unit_name)
      || units.find(u => u.product_id === item.product_id && u.is_base_unit);

    const unitCost = batchCost && batchCost > 0 ? batchCost : Number(unit?.cost_price || 0);
    const itemCost = unitCost * quantity;
    totalCost += itemCost;

    const key = item.product_id || item.product_code || item.product_name;
    if (!productSummary.has(key)) {
      productSummary.set(key, {
        product_code: item.product_code || '',
        name: item.product_name || 'Không rõ tên',
        unit_name: item.unit_name || '',
        quantity: 0,
        cost: 0,
        revenue: 0
      });
    }
    const row = productSummary.get(key);
    row.quantity += quantity;
    row.cost += itemCost;
    row.revenue += Number(item.total_price || 0);
  }

  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  return {
    orders_count: orders.length,
    items_quantity: totalQty,
    revenue,
    cost: totalCost,
    profit: revenue - totalCost,
    orders,
    top_products: [...productSummary.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 20)
  };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true });
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const apiSecretToken = String(process.env.API_SECRET_TOKEN || '').trim();
  if (!apiSecretToken) {
    return sendJson(res, 503, { error: 'Server configuration error.' });
  }
  const token = getToken(req, url);

  if (token !== apiSecretToken) {
    return sendJson(res, 401, { error: 'Unauthorized. Invalid or missing secret token.' });
  }

  try {
    const action = url.searchParams.get('action') || 'ecommerce_today';
    const today = getVietnamDateParts();

    if (action === 'ecommerce_products') {
      const products = await getEcommerceProducts();
      return sendJson(res, 200, {
        action,
        total: products.length,
        products
      });
    }

    if (action === 'product_stock') {
      const q = url.searchParams.get('q') || '';
      const stock = await getProductStock(q);
      return sendJson(res, 200, {
        action,
        ...stock
      });
    }

    if (action === 'product_cost') {
      const q = url.searchParams.get('q') || '';
      const cost = await getProductCost(q);
      return sendJson(res, 200, {
        action,
        ...cost
      });
    }

    let range;
    let label;

    if (action === 'ecommerce_month') {
      const month = Number(url.searchParams.get('month') || today.month);
      const year = Number(url.searchParams.get('year') || today.year);
      if (month < 1 || month > 12 || year < 2000) {
        return sendJson(res, 400, { error: 'Invalid month/year' });
      }
      range = vietnamMonthRange(year, month);
      label = `${pad2(month)}/${year}`;
    } else {
      const day = Number(url.searchParams.get('day') || today.day);
      const month = Number(url.searchParams.get('month') || today.month);
      const year = Number(url.searchParams.get('year') || today.year);
      if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000) {
        return sendJson(res, 400, { error: 'Invalid day/month/year' });
      }
      range = vietnamDayRange(year, month, day);
      label = formatDateVN(year, month, day);
    }

    const report = buildTelegramEcommerceCostView(await getEcommerceReport(range.start, range.end));
    return sendJson(res, 200, {
      action,
      label,
      range,
      ...report
    });
  } catch (error) {
    console.error('[telegram-report]', error);
    return sendJson(res, 500, { error: 'Internal Server Error', details: error.message });
  }
}
