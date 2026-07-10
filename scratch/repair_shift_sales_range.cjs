const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://iejgtdcdzababydaqjef.supabase.co',
  'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1',
  { auth: { persistSession: false } }
);

const DATE_FROM = process.argv[2];
const DATE_TO = process.argv[3] || DATE_FROM;

if (!DATE_FROM) {
  console.error('Usage: node scratch/repair_shift_sales_range.cjs YYYY-MM-DD [YYYY-MM-DD]');
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

  const expectedByShift = new Map();
  for (const shift of shiftsWithNames) {
    expectedByShift.set(shift.id, {
      shift,
      cash: 0,
      bank: 0,
      outOfShift: 0,
      sales: 0,
      orderCount: 0
    });
  }

  const unmatchedOrders = [];
  for (const order of orders || []) {
    const orderDateKey = new Date(order.created_at).toISOString().slice(0, 10);
    const dayShifts = shiftsByDate.get(orderDateKey) || [];
    const targetShift = pickScheduledShift(dayShifts, localSecondsFromIso(order.created_at));
    if (!targetShift) {
      unmatchedOrders.push(order.order_code);
      continue;
    }

    const bucket = expectedByShift.get(targetShift.id);
    const amount = Number(order.total || 0);
    if ((order.payment_method || 'cash') === 'bank_transfer') bucket.bank += amount;
    else bucket.cash += amount;
    bucket.sales += amount;
    bucket.orderCount += 1;
  }

  if (unmatchedOrders.length > 0) {
    throw new Error(`Dung sua tu dong: co ${unmatchedOrders.length} hoa don ngoai ca trong khoang ${DATE_FROM} -> ${DATE_TO}.`);
  }

  const updates = [];
  for (const item of expectedByShift.values()) {
    const current = item.shift;
    const currentSales = Number(current.sales_amount || 0);
    const currentCash = Number(current.cash_amount || 0);
    const currentBank = Number(current.bank_amount || 0);
    const currentOut = Number(current.out_of_shift_sales || 0);

    if (
      currentSales === item.sales
      && currentCash === item.cash
      && currentBank === item.bank
      && currentOut === item.outOfShift
    ) {
      continue;
    }

    const payload = {
      cash_amount: item.cash,
      bank_amount: item.bank,
      out_of_shift_sales: item.outOfShift,
      sales_amount: item.sales,
      updated_at: new Date().toISOString()
    };

    const { data: updated, error: updateErr } = await supabase
      .from('employee_shifts')
      .update(payload)
      .eq('id', current.id)
      .select('id, shift_date, shift_name, employee_id, cash_amount, bank_amount, out_of_shift_sales, sales_amount, updated_at')
      .single();

    if (updateErr) throw updateErr;

    updates.push({
      before: {
        id: current.id,
        shift_date: current.shift_date,
        shift_name: current.shift_name,
        employee_name: current.employee_name,
        cash_amount: currentCash,
        bank_amount: currentBank,
        out_of_shift_sales: currentOut,
        sales_amount: currentSales
      },
      expected: {
        cash_amount: item.cash,
        bank_amount: item.bank,
        out_of_shift_sales: item.outOfShift,
        sales_amount: item.sales,
        order_count: item.orderCount
      },
      after: updated
    });
  }

  console.log(JSON.stringify({
    date_from: DATE_FROM,
    date_to: DATE_TO,
    updated_count: updates.length,
    updates
  }, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
