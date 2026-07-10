const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://iejgtdcdzababydaqjef.supabase.co',
  'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1',
  { auth: { persistSession: false } }
);

const DATE_KEY = process.argv[2] || '2026-07-09';

function localDate(d) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(d));
}

function localTime(d) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date(d));
}

function dateStartIso(dateKey) {
  return new Date(`${dateKey}T00:00:00+07:00`).toISOString();
}

function dateEndIso(dateKey) {
  return new Date(`${dateKey}T23:59:59.999+07:00`).toISOString();
}

function sumOrders(orders) {
  return orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
}

async function run() {
  const [{ data: employees, error: empErr }, { data: shifts, error: shiftErr }, { data: orders, error: orderErr }] = await Promise.all([
    supabase.from('employees').select('id, name'),
    supabase
      .from('employee_shifts')
      .select('*')
      .eq('shift_date', DATE_KEY)
      .order('start_time', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('orders')
      .select('id, order_code, total, payment_method, status, created_at, order_type')
      .eq('status', 'completed')
      .or('order_type.eq.retail,order_type.eq.dose_cut,order_type.is.null')
      .gte('created_at', dateStartIso(DATE_KEY))
      .lte('created_at', dateEndIso(DATE_KEY))
      .order('created_at', { ascending: true })
  ]);

  if (empErr) throw empErr;
  if (shiftErr) throw shiftErr;
  if (orderErr) throw orderErr;

  const employeeById = new Map((employees || []).map((employee) => [employee.id, employee.name]));
  const shiftsWithName = (shifts || []).map((shift) => ({
    ...shift,
    employee_name: employeeById.get(shift.employee_id) || shift.employee_id
  }));
  const morning = shiftsWithName.find((shift) => shift.status === 'worked' && String(shift.shift_name || '').toLowerCase().includes('s'));
  const closedAt = morning?.closed_at || null;
  const splitTime = closedAt ? new Date(closedAt).getTime() : null;

  const beforeClose = [];
  const afterClose = [];
  for (const order of orders || []) {
    if (splitTime && new Date(order.created_at).getTime() >= splitTime) afterClose.push(order);
    else beforeClose.push(order);
  }

  console.log(JSON.stringify({
    date: DATE_KEY,
    shifts: shiftsWithName.map((shift) => ({
      id: shift.id,
      employee_name: shift.employee_name,
      shift_name: shift.shift_name,
      status: shift.status,
      start_time: shift.start_time,
      end_time: shift.end_time,
      is_closed: shift.is_closed,
      closed_at_utc: shift.closed_at,
      closed_at_local: shift.closed_at ? `${localDate(shift.closed_at)} ${localTime(shift.closed_at)}` : null,
      cash_amount: Number(shift.cash_amount || 0),
      bank_amount: Number(shift.bank_amount || 0),
      sales_amount: Number(shift.sales_amount || 0)
    })),
    split_by_morning_closed_at: {
      closed_at_utc: closedAt,
      closed_at_local: closedAt ? `${localDate(closedAt)} ${localTime(closedAt)}` : null,
      before_close_count: beforeClose.length,
      before_close_sum: sumOrders(beforeClose),
      after_close_count: afterClose.length,
      after_close_sum: sumOrders(afterClose)
    },
    after_close_orders: afterClose.map((order) => ({
      order_code: order.order_code,
      created_at_utc: order.created_at,
      created_at_local: `${localDate(order.created_at)} ${localTime(order.created_at)}`,
      total: Number(order.total || 0),
      payment_method: order.payment_method || 'cash'
    }))
  }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
