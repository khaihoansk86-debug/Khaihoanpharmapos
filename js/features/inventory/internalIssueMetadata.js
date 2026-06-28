export const INTERNAL_ISSUE_TARGET_TYPES = [
    { value: 'staff', label: 'Nhân viên' },
    { value: 'doctor', label: 'Bác sĩ / KTV' },
    { value: 'department', label: 'Phòng / Bộ phận' },
    { value: 'shared', label: 'Dùng chung' },
    { value: 'other', label: 'Khác' }
];

const TARGET_TYPE_MAP = new Map(INTERNAL_ISSUE_TARGET_TYPES.map((item) => [item.value, item.label]));
const TARGET_TYPE_TAG = 'ISSUE_TARGET_TYPE';
const TARGET_NAME_TAG = 'ISSUE_TARGET_NAME';

function sanitizeTagValue(value) {
    return String(value || '')
        .replace(/[\]\[]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function readTag(note, tagName) {
    const pattern = new RegExp(`\\[${tagName}:([^\\]]*)\\]`, 'i');
    const match = String(note || '').match(pattern);
    return sanitizeTagValue(match?.[1] || '');
}

function stripTag(note, tagName) {
    const pattern = new RegExp(`\\s*\\[${tagName}:[^\\]]*\\]\\s*`, 'gi');
    return String(note || '').replace(pattern, ' ').replace(/\s+/g, ' ').trim();
}

export function getInternalIssueTargetLabel(targetType) {
    return TARGET_TYPE_MAP.get(targetType) || 'Khác';
}

export function buildInternalIssueNote({ note = '', targetType = '', targetName = '' } = {}) {
    const cleanNote = String(note || '').trim();
    const tags = [];
    const safeType = sanitizeTagValue(targetType);
    const safeName = sanitizeTagValue(targetName);

    if (safeType) tags.push(`[${TARGET_TYPE_TAG}:${safeType}]`);
    if (safeName) tags.push(`[${TARGET_NAME_TAG}:${safeName}]`);

    return [cleanNote, ...tags].filter(Boolean).join(' ').trim();
}

export function parseInternalIssueNote(note = '') {
    const targetType = readTag(note, TARGET_TYPE_TAG);
    const targetName = readTag(note, TARGET_NAME_TAG);
    const userNote = stripTag(stripTag(note, TARGET_TYPE_TAG), TARGET_NAME_TAG);

    return {
        rawNote: String(note || ''),
        userNote,
        targetType,
        targetName,
        targetLabel: getInternalIssueTargetLabel(targetType)
    };
}
