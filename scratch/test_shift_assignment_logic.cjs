function normalizeTimeToSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(':').map(Number);
  return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
}

function isTimeInInterval(timeSec, startSec, endSec) {
  if (endSec >= startSec) {
    return timeSec >= startSec && timeSec < endSec;
  }
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

function pickTimeMatchedShift(shifts, currentSec) {
  const timeMatched = (shifts || []).filter((s) => {
    if (!s.start_time || !s.end_time) return false;
    const startSec = normalizeTimeToSeconds(s.start_time);
    const endSec = normalizeTimeToSeconds(s.end_time);
    return isTimeInInterval(currentSec, startSec, endSec);
  });

  if (!timeMatched.length) return null;
  timeMatched.sort(compareStartAsc);
  return timeMatched[0];
}

function pickNextEmployeeShift(shifts, currentSec, employeeId) {
  const employeeShifts = (shifts || []).filter((s) => s.employee_id === employeeId && !s.is_closed);
  if (!employeeShifts.length) return null;

  const worked = employeeShifts.filter((s) => s.status === 'worked');
  const candidates = worked.length ? worked : employeeShifts;

  const upcoming = candidates
    .filter((s) => normalizeTimeToSeconds(s.start_time) >= currentSec)
    .sort(compareStartAsc);
  if (upcoming.length) return upcoming[0];

  return [...candidates].sort(compareStartDesc)[0] || null;
}

function pickShiftForPOSSync(shifts, currentSec, employeeId) {
  const openWorkedShifts = (shifts || []).filter((s) => s.status === 'worked' && !s.is_closed);
  return pickTimeMatchedShift(openWorkedShifts, currentSec)
    || pickNextEmployeeShift(shifts, currentSec, employeeId);
}

function sec(hhmmss) {
  return normalizeTimeToSeconds(hhmmss);
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected "${expected}" but got "${actual}"`);
  }
  return { label, ok: true, actual };
}

const shifts = [
  {
    id: 'shift-long-morning',
    employee_id: 'long',
    employee_name: 'Long',
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
  pickShiftForPOSSync(shifts, sec('09:00:00'), 'hung')?.employee_name,
  'Anh Khanh',
  'Trong ca sang, dang nhap Hung van phai vao ca sang cua Khanh'
));

results.push(assertEqual(
  pickShiftForPOSSync(shifts, sec('13:29:59'), 'hung')?.employee_name,
  'Anh Khanh',
  'Sat gio ket ca sang van phai giu ca sang'
));

results.push(assertEqual(
  pickShiftForPOSSync(shifts, sec('13:30:00'), 'hung')?.employee_name,
  'Hung',
  'Dung gio bat dau ca chieu thi chuyen sang Hung'
));

results.push(assertEqual(
  pickShiftForPOSSync(shifts, sec('05:00:00'), 'hung')?.employee_name,
  'Hung',
  'Ngoai ca thi fallback vao ca tiep theo cua nguoi dang login'
));

results.push(assertEqual(
  pickShiftForPOSSync(overlappingWorkedShifts, sec('09:00:00'), 'b')?.employee_name,
  'A',
  'Trung ca worked phai uu tien ca duoc xep truoc'
));

const endedMorningShifts = shifts.map((shift) => (
  shift.id === 'shift-khanh-morning'
    ? { ...shift, is_closed: true }
    : shift
));

results.push(assertEqual(
  pickShiftForPOSSync(endedMorningShifts, sec('12:00:00'), 'hung')?.employee_name,
  'Hung',
  'Neu ca sang da ket ca thi doanh so duoc chuyen sang ca tiep theo'
));

console.log(JSON.stringify({
  passed: results.length,
  results
}, null, 2));
