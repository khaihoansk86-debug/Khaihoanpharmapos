const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://iejgtdcdzababydaqjef.supabase.co',
  'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1',
  { auth: { persistSession: false } }
);

const DATE_FROM = process.argv[2];
const DATE_TO = process.argv[3] || DATE_FROM;

if (!DATE_FROM) {
  console.error('Usage: node scratch/audit_shift_sales_range.cjs YYYY-MM-DD [YYYY-MM-DD]');
  process.exit(1);
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

function resolveClosedSeconds(shift) {
  if (!shift.is_closed || !shift.closed_at) return null;
  const closedSec = localSecondsFromIso(shift.closed_at);
  const endSec = normalizeTimeToSeconds(shift.end_time);
  return Math.min(closedSec, endSec || closedSec);
}

function compareStartAsc(a, b) {
  const startDiff = normalizeTimeToSeconds(a.start_time) - normalizeTimeToSeconds(b.start_time);
  if (startDiff !== 0) return startDiff;

  const endDiff = normalizeTimeToSeconds(a.end_time) - normalizeTimeToSeconds(b.end_time);
  if (endDiff !== 0) return endDiff;

  const createdA = Date.parse(a.created_at || 0);
  const createdB = Date.parse(b.created_at || 0);
  if (createdA !== createdB) return createdA - createdB;

  return String(a.id || '').localeCompare(String(b.id || ''));
}

function pickScheduledShift(shifts, orderSec) {
  const workedShifts = (shifts || [])
    .filter((shift) => shift.status === 'worked' && shift.start_time && shift.end_time)
    .sort(compareStartAsc);

  if (!workedShifts.length) return null;

  let previousEndSec = null;
  for (const shift of workedShifts) {
    const scheduledStartSec = normalizeTimeToSeconds(shift.start_time);
    const scheduledEndSec = normalizeTimeToSeconds(shift.end_time);
    const closedSec = resolveClosedSeconds(shift);
    const effectiveStartSec = previousEndSec === null ? scheduledStartSec : previousEndSec;
    const effectiveEndSec = Math.max(effectiveStartSec, closedSec ?? scheduledEndSec);

    if (isTimeInInterval(orderSec, effectiveStartSec, effectiveEndSec)) {
      return shift;
    }

    previousEndSec = effectiveEndSec;
  }

  return null;
}

function toDateStart(dateKey) {
  return new Date(`${dateKey}T00:00:00+07:00`);
}

function toDateEnd(dateKey) {
  return new Date(`${dateKey}T23:59:59+07:00`);
}

async function run() {
  const [{ data: employees, error: empErr }, { data: shifts, error: shiftErr }, { data: orders, error: orderErr }] = await Promise.all([
    supabase.from('employees').select('id, name'),
    supabase
      .from('employee_shifts')
      .select('*')
      .gte('shift_date', DATE_FROM)
      .lte('shift_date', DATE_TO)
      .order('shift_date', { ascending: true })
      .order('start_time', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('orders')
      .select('id, order_code, total, payment_method, status, created_at, order_type')
      .in('order_type', ['retail', 'dose_cut'])
      .eq('status', 'completed')
      .gte('created_at', toDateStart(DATE_FROM).toISOString())
      .lte('created_at', toDateEnd(DATE_TO).toISOString())
      .order('created_at', { ascending: true })
  ]);

  if (empErr) throw empErr;
  if (shiftErr) throw shiftErr;
  if (orderErr) throw orderErr;

  const employeeById = new Map((employees || []).map((emp) => [emp.id, emp.name]));
  const shiftsWithNames = (shifts || []).map((shift) => ({
    ...shift,
    employee_name: employeeById.get(shift.employee_id) || shift.employee_id
  }));

  const shiftsByDate = new Map();
  for (const shift of shiftsWithNames) {
    const list = shiftsByDate.get(shift.shift_date) || [];
    list.push(shift);
    shiftsByDate.set(shift.shift_date, list);
  }

  const summaryByShift = new Map();
  for (const shift of shiftsWithNames) {
    summaryByShift.set(shift.id, {
      shift_date: shift.shift_date,
      shift_id: shift.id,
      employee_name: shift.employee_name,
      shift_name: shift.shift_name,
      status: shift.status,
      start_time: shift.start_time,
      end_time: shift.end_time,
      current_cash_amount: Number(shift.cash_amount || 0),
      current_bank_amount: Number(shift.bank_amount || 0),
      current_out_of_shift_sales: Number(shift.out_of_shift_sales || 0),
      current_sales_amount: Number(shift.sales_amount || 0),
      expected_cash_amount: 0,
      expected_bank_amount: 0,
      expected_sales_amount: 0,
      order_count: 0
    });
  }

  const unmatchedOrders = [];
  const assignments = [];

  for (const order of orders || []) {
    const orderDateKey = new Date(order.created_at).toISOString().slice(0, 10);
    const dayShifts = shiftsByDate.get(orderDateKey) || [];
    const targetShift = pickScheduledShift(dayShifts, localSecondsFromIso(order.created_at));
    if (!targetShift) {
      unmatchedOrders.push({
        order_code: order.order_code,
        created_at: order.created_at,
        total: Number(order.total || 0),
        payment_method: order.payment_method || 'cash',
        shift_date: orderDateKey
      });
      continue;
    }

    const bucket = summaryByShift.get(targetShift.id);
    const amount = Number(order.total || 0);
    if ((order.payment_method || 'cash') === 'bank_transfer') bucket.expected_bank_amount += amount;
    else bucket.expected_cash_amount += amount;
    bucket.expected_sales_amount += amount;
    bucket.order_count += 1;

    assignments.push({
      shift_date: targetShift.shift_date,
      order_code: order.order_code,
      created_at: order.created_at,
      total: amount,
      payment_method: order.payment_method || 'cash',
      shift_id: targetShift.id,
      shift_name: targetShift.shift_name,
      employee_name: targetShift.employee_name
    });
  }

  const summary = [...summaryByShift.values()].map((item) => ({
    ...item,
    delta_sales_amount: item.expected_sales_amount - item.current_sales_amount
  }));

  console.log(JSON.stringify({
    date_from: DATE_FROM,
    date_to: DATE_TO,
    shift_count: summary.length,
    order_count: (orders || []).length,
    summary,
    unmatched_orders: unmatchedOrders,
    assignments
  }, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
