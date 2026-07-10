const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://iejgtdcdzababydaqjef.supabase.co',
  'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1',
  { auth: { persistSession: false } }
);

const DATE_KEY = process.argv[2];
const CLOSE_TIME = process.argv[3];

if (!DATE_KEY || !CLOSE_TIME) {
  console.error('Usage: node scratch/repair_shift_split_by_close_time.cjs YYYY-MM-DD HH:mm[:ss]');
  process.exit(1);
}

function normalizeTime(time) {
  const [hh = '00', mm = '00', ss = '00'] = String(time).split(':');
  return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:${ss.padStart(2, '0')}`;
}

function localIso(dateKey, time) {
  return new Date(`${dateKey}T${normalizeTime(time)}+07:00`).toISOString();
}

function dateStartIso(dateKey) {
  return new Date(`${dateKey}T00:00:00+07:00`).toISOString();
}

function dateEndIso(dateKey) {
  return new Date(`${dateKey}T23:59:59.999+07:00`).toISOString();
}

function localLabel(iso) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date(iso));
}

function emptyTotals(shift) {
  return {
    shift,
    cash_amount: 0,
    bank_amount: 0,
    cash_exchange_amount: 0,
    out_of_shift_sales: 0,
    sales_amount: 0,
    order_count: 0,
    orders: []
  };
}

function applyOrder(totals, order) {
  const amount = Number(order.total || 0);
  const method = order.payment_method || 'cash';
  if (!amount) return;

  if (amount > 0) {
    if (method === 'bank_transfer') totals.bank_amount += amount;
    else totals.cash_amount += amount;
  } else if (method === 'bank_transfer') {
    totals.bank_amount = Math.max(0, totals.bank_amount + amount);
  } else {
    totals.cash_exchange_amount += Math.abs(amount);
  }

  totals.sales_amount = Math.max(
    0,
    totals.cash_amount + totals.bank_amount - totals.cash_exchange_amount + totals.out_of_shift_sales
  );
  totals.order_count += 1;
  totals.orders.push(order.order_code);
}

async function run() {
  const splitIso = localIso(DATE_KEY, CLOSE_TIME);
  const splitMs = new Date(splitIso).getTime();

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
  const workedShifts = (shifts || []).filter((shift) => shift.status === 'worked');
  const morningShift = workedShifts[0];
  const afternoonShift = workedShifts[1];
  if (!morningShift || !afternoonShift) {
    throw new Error(`Khong du ca worked de chia sang/chieu cho ${DATE_KEY}.`);
  }

  const totalsByShift = new Map((shifts || []).map((shift) => [shift.id, emptyTotals(shift)]));

  for (const order of orders || []) {
    const targetShift = new Date(order.created_at).getTime() < splitMs ? morningShift : afternoonShift;
    applyOrder(totalsByShift.get(targetShift.id), order);
  }

  const updates = [];
  for (const shift of shifts || []) {
    const totals = totalsByShift.get(shift.id);
    const payload = {
      cash_amount: totals.cash_amount,
      bank_amount: totals.bank_amount,
      cash_exchange_amount: totals.cash_exchange_amount,
      out_of_shift_sales: totals.out_of_shift_sales,
      sales_amount: totals.sales_amount,
      updated_at: new Date().toISOString()
    };

    if (shift.id === morningShift.id) {
      payload.is_closed = true;
      payload.closed_at = splitIso;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('employee_shifts')
      .update(payload)
      .eq('id', shift.id)
      .select('id, shift_date, shift_name, employee_id, cash_amount, bank_amount, cash_exchange_amount, out_of_shift_sales, sales_amount, is_closed, closed_at')
      .single();

    if (updateErr) throw updateErr;

    updates.push({
      employee_name: employeeById.get(shift.employee_id) || shift.employee_id,
      shift_name: shift.shift_name,
      before_sales_amount: Number(shift.sales_amount || 0),
      after_sales_amount: Number(updated.sales_amount || 0),
      cash_amount: Number(updated.cash_amount || 0),
      bank_amount: Number(updated.bank_amount || 0),
      order_count: totals.order_count,
      closed_at_local: updated.closed_at ? localLabel(updated.closed_at) : null,
      orders: totals.orders
    });
  }

  console.log(JSON.stringify({
    date: DATE_KEY,
    split_at_local: localLabel(splitIso),
    split_at_utc: splitIso,
    order_count: (orders || []).length,
    updates
  }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
