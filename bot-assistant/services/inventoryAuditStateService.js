import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.resolve(moduleDir, '../data/inventory-audit-state.json');

async function readState() {
    try {
        return JSON.parse(await fs.readFile(statePath, 'utf8'));
    } catch (error) {
        if (error.code === 'ENOENT') return { snapshots: [] };
        throw error;
    }
}

async function writeState(state) {
    await fs.mkdir(path.dirname(statePath), { recursive: true });
    await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf8');
}

export async function saveInventoryAuditSnapshot(tasks, options = {}) {
    const state = await readState();
    const sentAt = options.sentAt || new Date().toISOString();
    const dueAt = options.dueAt || new Date(new Date(sentAt).getTime() + 2 * 60 * 60 * 1000).toISOString();
    const dateKey = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Ho_Chi_Minh'
    }).format(new Date(sentAt));
    const snapshot = {
        id: `${dateKey}-${Date.now()}`,
        dateKey,
        sentAt,
        dueAt,
        reportedAt: null,
        tasks
    };
    state.snapshots.push(snapshot);
    await writeState(state);
    return snapshot;
}

export async function getDueInventoryAuditSnapshots(now = new Date()) {
    const state = await readState();
    return state.snapshots.filter(snapshot =>
        !snapshot.reportedAt && new Date(snapshot.dueAt).getTime() <= now.getTime()
    );
}

export async function markInventoryAuditSnapshotReported(snapshotId, reportedAt = new Date().toISOString()) {
    const state = await readState();
    const snapshot = state.snapshots.find(item => item.id === snapshotId);
    if (!snapshot) return false;
    snapshot.reportedAt = reportedAt;
    await writeState(state);
    return true;
}
