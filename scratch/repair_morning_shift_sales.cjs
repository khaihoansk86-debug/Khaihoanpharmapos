const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://iejgtdcdzababydaqjef.supabase.co',
  'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1',
  { auth: { persistSession: false } }
);

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

function compareStartAsc(a, b) {
  const startDiff = normalizeTimeToSeconds(a.start_time) - normalizeTimeToSeconds(b.start_time);
  if (startDiff !== 0) return startDiff;
  return normalizeTimeToSeconds(a.end_time) - normalizeTimeToSeconds(b.end_time);
}

function localSecondsFromIso(iso) {
  const d = new Date(iso);
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
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
  const dateKey = localDateKey(now);
  const startLocal = new Date(now);
  startLocal.setHours(0, 0, 0, 0);

  const [{ data: employees, error: empErr }, { data: shifts, error: shiftErr }, { data: orders, error: orderErr }] = await Promise.all([
    supabase.from('employees').select('id, name'),
    supabase.from('employee_shifts').select('*').eq('shift_date', dateKey),
    supabase
      .from('orders')
      .select('id, order_code, total, payment_method, status, created_at, order_type')
      .in('order_type', ['retail', 'dose_cut'])
      .eq('status', 'completed')
      .gte('created_at', startLocal.toISOString())
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
  shiftsWithNames.forEach(shift => {
    expectedByShift.set(shift.id, {
      shift,
      cash: 0,
      bank: 0,
      outOfShift: 0,
      sales: 0,
      orderCount: 0
    });
  });

  for (const order of orders || []) {
    const targetShift = pickScheduledShift(shiftsWithNames, localSecondsFromIso(order.created_at));
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
    throw new Error(`Dung sua tu dong: co ${unmatchedOrders.length} hoa don ngoai ca chua the quy ve nhan vien mot cach chac chan.`);
  }

  const positiveShifts = [...expectedByShift.values()].filter(item => item.sales > 0);
  if (positiveShifts.length !== 1) {
    throw new Error(`Dung sua tu dong: co ${positiveShifts.length} ca duoc gan doanh so > 0, can xac nhan thu cong.`);
  }

  const target = positiveShifts[0];
  const current = target.shift;
  const updatePayload = {
    cash_amount: target.cash,
    bank_amount: target.bank,
    out_of_shift_sales: target.outOfShift,
    sales_amount: target.sales,
    updated_at: new Date().toISOString()
  };

  const { data: updated, error: updateErr } = await supabase
    .from('employee_shifts')
    .update(updatePayload)
    .eq('id', current.id)
    .select('id, shift_name, employee_id, cash_amount, bank_amount, out_of_shift_sales, sales_amount, updated_at')
    .single();

  if (updateErr) throw updateErr;

  console.log(JSON.stringify({
    local_date: dateKey,
    repaired_shift: {
      id: current.id,
      employee_name: current.employee_name,
      shift_name: current.shift_name
    },
    before: {
      cash_amount: Number(current.cash_amount || 0),
      bank_amount: Number(current.bank_amount || 0),
      out_of_shift_sales: Number(current.out_of_shift_sales || 0),
      sales_amount: Number(current.sales_amount || 0)
    },
    expected: {
      cash_amount: target.cash,
      bank_amount: target.bank,
      out_of_shift_sales: target.outOfShift,
      sales_amount: target.sales,
      order_count: target.orderCount
    },
    after: updated
  }, null, 2));
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
