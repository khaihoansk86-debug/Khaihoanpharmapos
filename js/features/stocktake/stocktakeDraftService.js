import { idbDelete, idbGet, idbSet } from '../../core/idbService.js';
import { chooseNewestStocktakeDraft } from './stocktakeSessionRules.js';

export const STOCKTAKE_DRAFT_KEY = 'khaihoan_stocktake_draft';
const REMOTE_DRAFT_KEY = 'default';

function safeParse(value) {
    if (!value) return null;
    try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        return parsed && Array.isArray(parsed.lines) ? parsed : null;
    } catch {
        return null;
    }
}

export async function saveLocalStocktakeDraft(
    draft,
    storage = globalThis.localStorage
) {
    storage?.setItem?.(STOCKTAKE_DRAFT_KEY, JSON.stringify(draft));
    await idbSet(STOCKTAKE_DRAFT_KEY, draft);
    return draft;
}

export async function loadLocalStocktakeDraft(storage = globalThis.localStorage) {
    const localDraft = safeParse(storage?.getItem?.(STOCKTAKE_DRAFT_KEY));
    const indexedDraft = safeParse(await idbGet(STOCKTAKE_DRAFT_KEY));
    return chooseNewestStocktakeDraft(localDraft, indexedDraft);
}

export async function deleteLocalStocktakeDraft(storage = globalThis.localStorage) {
    storage?.removeItem?.(STOCKTAKE_DRAFT_KEY);
    await idbDelete(STOCKTAKE_DRAFT_KEY);
}

async function getAuthenticatedUserId(client) {
    if (!client?.auth?.getSession) return null;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data?.session?.user?.id || null;
}

export async function saveRemoteStocktakeDraft(draft, client) {
    const userId = await getAuthenticatedUserId(client);
    if (!userId) return { synced: false, reason: 'unauthenticated' };

    const { error } = await client
        .from('stocktake_drafts')
        .upsert({
            user_id: userId,
            draft_key: REMOTE_DRAFT_KEY,
            payload: draft,
            updated_at: new Date(draft.timestamp || Date.now()).toISOString()
        }, { onConflict: 'user_id,draft_key' });
    if (error) throw error;
    return { synced: true };
}

export async function loadRemoteStocktakeDraft(client) {
    const userId = await getAuthenticatedUserId(client);
    if (!userId) return null;

    const { data, error } = await client
        .from('stocktake_drafts')
        .select('payload, updated_at')
        .eq('user_id', userId)
        .eq('draft_key', REMOTE_DRAFT_KEY)
        .maybeSingle();
    if (error) throw error;
    return safeParse(data?.payload);
}

export async function deleteRemoteStocktakeDraft(client) {
    const userId = await getAuthenticatedUserId(client);
    if (!userId) return { synced: false, reason: 'unauthenticated' };

    const { error } = await client
        .from('stocktake_drafts')
        .delete()
        .eq('user_id', userId)
        .eq('draft_key', REMOTE_DRAFT_KEY);
    if (error) throw error;
    return { synced: true };
}

export async function loadNewestStocktakeDraft(client, storage = globalThis.localStorage) {
    const localDraft = await loadLocalStocktakeDraft(storage);
    try {
        const remoteDraft = await loadRemoteStocktakeDraft(client);
        return chooseNewestStocktakeDraft(localDraft, remoteDraft);
    } catch (error) {
        console.warn('Không thể tải nháp kiểm kê trên máy chủ:', error?.message || error);
        return localDraft;
    }
}

export async function deleteStocktakeDraftEverywhere(client, storage = globalThis.localStorage) {
    await deleteLocalStocktakeDraft(storage);
    try {
        await deleteRemoteStocktakeDraft(client);
    } catch (error) {
        console.warn('Không thể xóa nháp kiểm kê trên máy chủ:', error?.message || error);
    }
}
