# Zalo inventory preview: migration 105 verification — 2026-09-09

## Deployed scope

User approved local SQL testing followed by deployment to the existing Supabase database; paid Branching was not used. Migration `105_add_zalo_inventory_preview.sql` was applied only to project `iejgtdcdzababydaqjef`. Migration history was recorded atomically with DDL and PostgREST schema reload. Migrations 102–104 were NOT deployed or marked applied.

The SQL matches backend draft at commit `1a922653c66c72e222a67e4bd46b0080a5df3423`, with deployment-only lock timeout 5 seconds and statement timeout 30 seconds. Existing manual commands and notification types are preserved. No stock, min/max, invoice, employee, schedule or recipient changes.

## Verification

- Backend syntax check passed; full suite 162/162 passed outside sandbox. Initial sandbox run was 159/162 because Windows CIM was denied and Chrome timed out; the same tests passed with OS access, without code changes.
- POS regression suite: 160/160 suites, 556/556 tests passed (`npm.cmd test -- --runInBand`).
- PGlite executed the numbered migration and an additional role/RLS smoke test with an auth.uid mapping matching production.
- Production schema rehearsal executed DDL and smoke assertions in one transaction, then ROLLBACK. A new connection confirmed no preview table, command or history row remained.
- Actual deployment repeated smoke tests inside a savepoint, rolled back all fixtures, then committed schema + migration history. Command table has no external-action triggers. Worker never observed a committed test command.
- Checked anon denial, staff denial, admin mapping/read roundtrip, admin-only enqueue, empty preview payload, automatic notification not manually enqueueable, duplicate admission, service-role-only store, no direct worker table writes, count mismatch, 1 MiB limit, idempotent store, 15-minute expiration through both RPC and RLS, unauthorized requester denial.
- New connection after commit: `bot_get_zalo_preview_contract().verified = true`, RLS enabled, ACL correct, preview result rows = 0, preview command rows = 0.
- Real PostgREST anon calls to get/store/contract RPCs returned HTTP 401 / SQLSTATE 42501, not missing-schema errors. No credentials recorded in artifacts.
- `git diff --check` passed. No new JavaScript runtime changes in this deployment; no build/type/lint scripts invoked for SQL.

Tests using SET ROLE and request claims validate database authorization, not a full interactive Supabase Auth login. No real admin browser preview, live worker roundtrip, Manager delivery or Zalo sending was tested. Database fingerprint verification alone does not certify deployed worker source.

## Remaining work

Backend commit has not been pushed/deployed/restarted by this task. POS preview adapter remains unavailable and send capabilities remain locked. Next: separately deploy verified clean backend, observe fresh runtime capability for preview, connect the POS adapter, and test explicit admin preview end-to-end without sending Zalo.

The numbered migration and this report are local, not Git-committed/pushed in this task. Preserve unrelated dirty POS changes. Future deployments must not blindly `db push` missing 102–104 or mark them as applied; reconcile those separately.

Evidence scripts are in `D:/Khaihoanpharmapos/`: `zalo-preview-smoke-20260909.sql`, `test-zalo-preview-migration-20260909.mjs`, `zalo-preview-rehearsal-20260909.sql`, `zalo-preview-deploy-20260909.sql`, `verify-zalo-preview-api-20260909.mjs`. Deployment script has preflight drift/history guards; do not rerun as a generic migration runner.
