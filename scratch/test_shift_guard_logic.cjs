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

const closedMorningShifts = july9Shifts.map((shift) => (
  shift.id === 'shift-khanh-morning'
    ? { ...shift, is_closed: true }
    : shift
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
  passed: results.length,
  results
}, null, 2));
