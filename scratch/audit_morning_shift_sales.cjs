const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://iejgtdcdzababydaqjef.supabase.co',
  'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1',
  { auth: { persistSession: false } }
);

function localDateParts(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return { year, month, day, dateKey: `${year}-${month}-${day}` };
}

function normalizeTimeToSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(':').map(Number);
  return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
}

function isTimeInInterval(timeSec, startSec, endSec) {
  if (endSec >= startSec) return timeSec >= startSec && timeSec < endSec;
  return timeSec >= startSec || timeSec < endSec;
}

function localSecondsFromIso(iso) {
  const d = new Date(iso);
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

function compareStartAsc(a, b) {
  const startDiff = normalizeTimeToSeconds(a.start_time) - normalizeTimeToSeconds(b.start_time);
  if (startDiff !== 0) return startDiff;
  return normalizeTimeToSeconds(a.end_time) - normalizeTimeToSeconds(b.end_time);
}

function pickScheduledShift(shifts, orderSec) {
  const matches = (shifts || []).filter(shift => {
    if (shift.status !== 'worked' || shift.is_closed) return false;
    if (!shift.start_time || !shift.end_time) return false;
    return isTimeInInterval(orderSec, normalizeTimeToSeconds(shift.start_time), normalizeTimeToSeconds(shift.end_time));
  });
  if (!matches.length) return null;
  matches.sort(compareStartAsc);
  return matches[0];
}

async function run() {
  const now = new Date();
  const { dateKey } = localDateParts(now);
  const startUtc = new Date(now);
  startUtc.setHours(0, 0, 0, 0);

  const [{ data: employees, error: empErr }, { data: shifts, error: shiftErr }, { data: orders, error: orderErr }] = await Promise.all([
    supabase.from('employees').select('id, name').order('name', { ascending: true }),
    supabase.from('employee_shifts').select('*').eq('shift_date', dateKey).order('start_time', { ascending: true }),
    supabase
      .from('orders')
      .select('id, order_code, total, payment_method, status, created_at, order_type')
      .in('order_type', ['retail', 'dose_cut'])
      .eq('status', 'completed')
      .gte('created_at', startUtc.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: true })
  ]);

  if (empErr) throw empErr;
  if (shiftErr) throw shiftErr;
  if (orderErr) throw orderErr;

  const employeeById = new Map((employees || []).map(emp => [emp.id, emp.name]));
  const shiftsWithNames = (shifts || []).map(shift => ({ ...shift, employee_name: employeeById.get(shift.employee_id) || shift.employee_id }));
  const expectedByShift = new Map();
  const unmatchedOrders = [];
  const orderAssignments = [];

  shiftsWithNames.forEach(shift => {
    expectedByShift.set(shift.id, {
      shift,
      cash: 0,
      bank: 0,
      outOfShift: 0,
      sales: 0,
      orders: []
    });
  });

  for (const order of orders || []) {
    const orderSec = localSecondsFromIso(order.created_at);
    const targetShift = pickScheduledShift(shiftsWithNames, orderSec);
    if (!targetShift) {
      unmatchedOrders.push({
        order_code: order.order_code,
        created_at: order.created_at,
        total: Number(order.total || 0),
        payment_method: order.payment_method || 'cash',
        reason: 'outside_all_worked_shifts'
      });
      continue;
    }

    const bucket = expectedByShift.get(targetShift.id);
    const amount = Number(order.total || 0);
    if ((order.payment_method || 'cash') === 'bank_transfer') bucket.bank += amount;
    else bucket.cash += amount;
    bucket.sales += amount;
    bucket.orders.push({
      order_code: order.order_code,
      created_at: order.created_at,
      total: amount,
      payment_method: order.payment_method || 'cash'
    });

    orderAssignments.push({
      order_code: order.order_code,
      created_at: order.created_at,
      total: amount,
      payment_method: order.payment_method || 'cash',
      shift_id: targetShift.id,
      shift_name: targetShift.shift_name,
      employee_name: targetShift.employee_name
    });
  }

  const summary = shiftsWithNames.map(shift => {
    const expected = expectedByShift.get(shift.id);
    return {
      shift_id: shift.id,
      shift_name: shift.shift_name,
      employee_name: shift.employee_name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      current_cash_amount: Number(shift.cash_amount || 0),
      current_bank_amount: Number(shift.bank_amount || 0),
      current_out_of_shift_sales: Number(shift.out_of_shift_sales || 0),
      current_sales_amount: Number(shift.sales_amount || 0),
      expected_cash_amount: expected.cash,
      expected_bank_amount: expected.bank,
      expected_out_of_shift_sales: expected.outOfShift,
      expected_sales_amount: expected.sales,
      delta_sales_amount: expected.sales - Number(shift.sales_amount || 0),
      order_count: expected.orders.length
    };
  });

  console.log(JSON.stringify({
    local_now: now.toISOString(),
    local_date: dateKey,
    shift_count: shiftsWithNames.length,
    order_count: (orders || []).length,
    summary,
    unmatched_orders: unmatchedOrders,
    assignments: orderAssignments
  }, null, 2));
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
