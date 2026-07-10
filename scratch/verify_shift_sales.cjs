const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://iejgtdcdzababydaqjef.supabase.co';
const SUPABASE_KEY = 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1';

function usage() {
  console.log([
    'Usage:',
    '  node scratch/verify_shift_sales.cjs self-test',
    '  node scratch/verify_shift_sales.cjs audit YYYY-MM-DD [YYYY-MM-DD]',
    '',
    'Modes:',
    '  self-test   Chay bo gia lap logic phan ca/doanh so',
    '  audit       Doi soat du lieu that theo ngay hoac khoang ngay'
  ].join('\n'));
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

  const endDiff = normalizeTimeToSeconds(a.end_time) - normalizeTimeToSeconds(b.end_time);
  if (endDiff !== 0) return endDiff;

  const createdA = Date.parse(a.created_at || 0);
  const createdB = Date.parse(b.created_at || 0);
  if (createdA !== createdB) return createdA - createdB;

  return String(a.id || '').localeCompare(String(b.id || ''));
}

function compareStartDesc(a, b) {
  return compareStartAsc(b, a);
}

function currentTimeSeconds(date = new Date()) {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function pickTimeMatchedShift(shifts, currentSec) {
  const timeMatched = (shifts || []).filter((shift) => {
    if (!shift.start_time || !shift.end_time) return false;
    return isTimeInInterval(
      currentSec,
      normalizeTimeToSeconds(shift.start_time),
      normalizeTimeToSeconds(shift.end_time)
    );
  });

  if (!timeMatched.length) return null;
  timeMatched.sort(compareStartAsc);
  return timeMatched[0];
}

function pickNextEmployeeShift(shifts, currentSec, employeeId) {
  const employeeShifts = (shifts || []).filter((shift) => shift.employee_id === employeeId && !shift.is_closed);
  if (!employeeShifts.length) return null;

  const worked = employeeShifts.filter((shift) => shift.status === 'worked');
  const candidates = worked.length ? worked : employeeShifts;

  const upcoming = candidates
    .filter((shift) => normalizeTimeToSeconds(shift.start_time) >= currentSec)
    .sort(compareStartAsc);
  if (upcoming.length) return upcoming[0];

  return [...candidates].sort(compareStartDesc)[0] || null;
}

function pickShiftForPOSSync(shifts, currentSec, employeeId) {
  const openWorkedShifts = (shifts || []).filter((shift) => shift.status === 'worked' && !shift.is_closed);
  return pickTimeMatchedShift(openWorkedShifts, currentSec)
    || pickNextEmployeeShift(shifts, currentSec, employeeId);
}

function hasShiftMoneyValues(payload) {
  return [
    payload.cash_amount,
    payload.bank_amount,
    payload.cash_exchange_amount,
    payload.sales_amount,
    payload.out_of_shift_sales
  ].some((value) => Number(value || 0) > 0);
}

function assertShiftUpdateIsSafeLocal(payload, shift, dayShifts, nowDate) {
  if (!hasShiftMoneyValues(payload)) return { ok: true };

  if (payload.shift_date && payload.shift_date > todayKey(nowDate)) {
    throw new Error(`future-shift-blocked:${payload.shift_date}`);
  }

  if (shift.__source !== 'pos-sync' || !payload.id) return { ok: true };

  const referenceDate = shift.__syncReferenceDate ? new Date(shift.__syncReferenceDate) : nowDate;
  const expectedShift = (() => {
    const currentSec = currentTimeSeconds(referenceDate);
    const openWorkedShifts = (dayShifts || []).filter((item) => item.status === 'worked' && !item.is_closed);
    const matchedShift = pickTimeMatchedShift(openWorkedShifts, currentSec);
    if (matchedShift) return matchedShift;
    if (!shift.__allowOutOfShiftFallback || !payload.employee_id) return null;
    return pickNextEmployeeShift(dayShifts || [], currentSec, payload.employee_id);
  })();

  if (!expectedShift || expectedShift.id !== payload.id) {
    throw new Error(`wrong-shift-blocked:${shift.__syncOrderCode || ''}`);
  }

  return { ok: true };
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

function sec(timeStr) {
  return normalizeTimeToSeconds(timeStr);
}

function pass(label, actual) {
  return { label, ok: true, actual };
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected "${expected}" but got "${actual}"`);
  }
  return pass(label, actual);
}

function assertThrows(fn, expectedPrefix, label) {
  try {
    fn();
  } catch (error) {
    const message = String(error.message || error);
    if (!message.startsWith(expectedPrefix)) {
      throw new Error(`${label}: expected throw "${expectedPrefix}" but got "${message}"`);
    }
    return pass(label, message);
  }
  throw new Error(`${label}: expected throw "${expectedPrefix}" but no error thrown`);
}

function buildSelfTestFixtures() {
  const july9Shifts = [
    {
      id: 'shift-long-morning',
      employee_id: 'long',
      employee_name: 'Long',
      shift_date: '2026-07-09',
      shift_name: 'Sang',
      start_time: '06:30:00',
      end_time: '13:30:00',
      status: 'off',
      is_closed: false,
      created_at: '2026-07-05T05:48:35.505Z'
    },
    {
      id: 'shift-khanh-morning',
      employee_id: 'khanh',
      employee_name: 'Anh Khanh',
      shift_date: '2026-07-09',
      shift_name: 'Sang',
      start_time: '06:30:00',
      end_time: '13:30:00',
      status: 'worked',
      is_closed: false,
      created_at: '2026-07-08T04:31:52.077Z'
    },
    {
      id: 'shift-hung-afternoon',
      employee_id: 'hung',
      employee_name: 'Hung',
      shift_date: '2026-07-09',
      shift_name: 'Chieu',
      start_time: '13:30:00',
      end_time: '20:00:00',
      status: 'worked',
      is_closed: false,
      created_at: '2026-07-05T05:48:53.312Z'
    }
  ];

  const overlappingWorkedShifts = [
    {
      id: 'shift-a',
      employee_id: 'a',
      employee_name: 'A',
      shift_date: '2026-07-09',
      shift_name: 'Sang A',
      start_time: '06:30:00',
      end_time: '13:30:00',
      status: 'worked',
      is_closed: false,
      created_at: '2026-07-01T01:00:00.000Z'
    },
    {
      id: 'shift-b',
      employee_id: 'b',
      employee_name: 'B',
      shift_date: '2026-07-09',
      shift_name: 'Sang B',
      start_time: '06:30:00',
      end_time: '13:30:00',
      status: 'worked',
      is_closed: false,
      created_at: '2026-07-02T01:00:00.000Z'
    }
  ];

  return { july9Shifts, overlappingWorkedShifts };
}

function runSelfTest() {
  const { july9Shifts, overlappingWorkedShifts } = buildSelfTestFixtures();
  const closedMorningShifts = july9Shifts.map((shift) => (
    shift.id === 'shift-khanh-morning'
      ? { ...shift, is_closed: true }
      : shift
  ));

  const results = [];

  results.push(assertEqual(
    pickShiftForPOSSync(july9Shifts, sec('09:00:00'), 'hung')?.employee_name,
    'Anh Khanh',
    'Trong ca sang, login Hung van vao Khanh'
  ));

  results.push(assertEqual(
    pickShiftForPOSSync(july9Shifts, sec('13:29:59'), 'hung')?.employee_name,
    'Anh Khanh',
    'Sat gio het ca sang van giu Khanh'
  ));

  results.push(assertEqual(
    pickShiftForPOSSync(july9Shifts, sec('13:30:00'), 'hung')?.employee_name,
    'Hung',
    'Dung gio sang ca chieu thi vao Hung'
  ));

  results.push(assertEqual(
    pickShiftForPOSSync(july9Shifts, sec('05:00:00'), 'hung')?.employee_name,
    'Hung',
    'Ngoai ca fallback vao ca tiep theo cua nguoi login'
  ));

  results.push(assertEqual(
    pickShiftForPOSSync(overlappingWorkedShifts, sec('09:00:00'), 'b')?.employee_name,
    'A',
    'Trung ca worked uu tien ca duoc xep truoc'
  ));

  results.push(assertEqual(
    pickShiftForPOSSync(closedMorningShifts, sec('10:50:00'), 'hung')?.employee_name,
    'Hung',
    'Ket ca sang som thi chuyen sang Hung'
  ));

  results.push(pass(
    'Guard cho phep ghi dung ca Khanh',
    assertShiftUpdateIsSafeLocal(
      {
        id: 'shift-khanh-morning',
        employee_id: 'khanh',
        shift_date: '2026-07-09',
        shift_name: 'Sang',
        cash_amount: 50000,
        bank_amount: 0,
        cash_exchange_amount: 0,
        sales_amount: 50000,
        out_of_shift_sales: 0
      },
      {
        __source: 'pos-sync',
        __syncReferenceDate: '2026-07-09T09:30:00+07:00',
        __allowOutOfShiftFallback: false,
        __syncOrderCode: 'ORD-1'
      },
      july9Shifts,
      new Date('2026-07-09T10:00:00+07:00')
    ).ok
  ));

  results.push(assertThrows(
    () => assertShiftUpdateIsSafeLocal(
      {
        id: 'shift-hung-afternoon',
        employee_id: 'hung',
        shift_date: '2026-07-09',
        shift_name: 'Chieu',
        cash_amount: 50000,
        bank_amount: 0,
        cash_exchange_amount: 0,
        sales_amount: 50000,
        out_of_shift_sales: 0
      },
      {
        __source: 'pos-sync',
        __syncReferenceDate: '2026-07-09T09:30:00+07:00',
        __allowOutOfShiftFallback: false,
        __syncOrderCode: 'ORD-2'
      },
      july9Shifts,
      new Date('2026-07-09T10:00:00+07:00')
    ),
    'wrong-shift-blocked:',
    'Guard chan ghi nham sang Hung khi van trong ca Khanh'
  ));

  results.push(pass(
    'Guard cho phep fallback ngoai ca vao Hung',
    assertShiftUpdateIsSafeLocal(
      {
        id: 'shift-hung-afternoon',
        employee_id: 'hung',
        shift_date: '2026-07-09',
        shift_name: 'Chieu',
        cash_amount: 50000,
        bank_amount: 0,
        cash_exchange_amount: 0,
        sales_amount: 50000,
        out_of_shift_sales: 50000
      },
      {
        __source: 'pos-sync',
        __syncReferenceDate: '2026-07-09T05:00:00+07:00',
        __allowOutOfShiftFallback: true,
        __syncOrderCode: 'ORD-3'
      },
      july9Shifts,
      new Date('2026-07-09T10:00:00+07:00')
    ).ok
  ));

  results.push(assertThrows(
    () => assertShiftUpdateIsSafeLocal(
      {
        id: 'future-shift',
        employee_id: 'hung',
        shift_date: '2026-07-10',
        shift_name: 'Sang',
        cash_amount: 50000,
        bank_amount: 0,
        cash_exchange_amount: 0,
        sales_amount: 50000,
        out_of_shift_sales: 0
      },
      {
        __source: 'pos-sync',
        __syncReferenceDate: '2026-07-09T10:00:00+07:00',
        __allowOutOfShiftFallback: false,
        __syncOrderCode: 'ORD-4'
      },
      july9Shifts,
      new Date('2026-07-09T10:00:00+07:00')
    ),
    'future-shift-blocked:',
    'Guard chan ghi doanh so vao ca tuong lai'
  ));

  results.push(pass(
    'Manual cap nhat ca tuong lai khong co doanh so duoc bo qua',
    assertShiftUpdateIsSafeLocal(
      {
        id: 'future-shift',
        employee_id: 'hung',
        shift_date: '2026-07-10',
        shift_name: 'Sang',
        cash_amount: 0,
        bank_amount: 0,
        cash_exchange_amount: 0,
        sales_amount: 0,
        out_of_shift_sales: 0
      },
      {},
      july9Shifts,
      new Date('2026-07-09T10:00:00+07:00')
    ).ok
  ));

  console.log(JSON.stringify({
    mode: 'self-test',
    passed: results.length,
    results
  }, null, 2));
}

async function runAudit(dateFrom, dateTo = dateFrom) {
  if (!dateFrom) {
    usage();
    process.exit(1);
  }

  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    { auth: { persistSession: false } }
  );

  const [{ data: employees, error: empErr }, { data: shifts, error: shiftErr }, { data: orders, error: orderErr }] = await Promise.all([
    supabase.from('employees').select('id, name'),
    supabase
      .from('employee_shifts')
      .select('*')
      .gte('shift_date', dateFrom)
      .lte('shift_date', dateTo)
      .order('shift_date', { ascending: true })
      .order('start_time', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('orders')
      .select('id, order_code, total, payment_method, status, created_at, order_type')
      .in('order_type', ['retail', 'dose_cut'])
      .eq('status', 'completed')
      .gte('created_at', toDateStart(dateFrom).toISOString())
      .lte('created_at', toDateEnd(dateTo).toISOString())
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
    mode: 'audit',
    date_from: dateFrom,
    date_to: dateTo,
    shift_count: summary.length,
    order_count: (orders || []).length,
    summary,
    unmatched_orders: unmatchedOrders,
    assignments
  }, null, 2));
}

async function main() {
  const mode = process.argv[2];

  if (!mode || mode === '--help' || mode === '-h') {
    usage();
    return;
  }

  if (mode === 'self-test') {
    runSelfTest();
    return;
  }

  if (mode === 'audit') {
    await runAudit(process.argv[3], process.argv[4]);
    return;
  }

  usage();
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
