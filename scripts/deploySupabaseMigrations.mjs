import {
    mkdtempSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const LEGACY_BASELINE = 48;
const isDryRun = process.argv.includes('--dry-run');
const migrationsDirectory = join(process.cwd(), 'supabase', 'migrations');
const supabaseCliPath = join(
    process.cwd(),
    'node_modules',
    'supabase',
    'dist',
    'supabase.js'
);

function runSupabase(args, { capture = false } = {}) {
    const result = spawnSync(
        process.execPath,
        [supabaseCliPath, ...args, '--agent', 'no'],
        {
            cwd: process.cwd(),
            encoding: 'utf8',
            stdio: capture ? 'pipe' : 'inherit'
        }
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
        if (capture) {
            process.stderr.write(result.stderr || '');
            process.stderr.write(result.stdout || '');
        }
        throw new Error(`Supabase CLI thất bại với mã ${result.status}.`);
    }
    return result.stdout || '';
}

function getLocalMigrations() {
    const migrations = readdirSync(migrationsDirectory)
        .map(filename => {
            const match = filename.match(/^(\d+)_.*\.sql$/i);
            if (!match) return null;
            return {
                version: match[1],
                number: Number(match[1]),
                filename,
                filePath: join(migrationsDirectory, filename)
            };
        })
        .filter(Boolean)
        .filter(migration => migration.number > LEGACY_BASELINE)
        .sort((left, right) => left.number - right.number);

    const seenVersions = new Set();
    migrations.forEach(migration => {
        if (seenVersions.has(migration.version)) {
            throw new Error(`Trùng phiên bản migration mới: ${migration.version}.`);
        }
        seenVersions.add(migration.version);
    });
    return migrations;
}

function getRemoteVersions() {
    const output = runSupabase([
        'db',
        'query',
        '--linked',
        `select version from supabase_migrations.schema_migrations
         where version > '${String(LEGACY_BASELINE).padStart(3, '0')}'
         order by version;`,
        '--output-format',
        'json'
    ], { capture: true });
    const rows = JSON.parse(output);
    return new Set(rows.map(row => String(row.version)));
}

const localMigrations = getLocalMigrations();
const remoteVersions = getRemoteVersions();
const pendingMigrations = localMigrations.filter(
    migration => !remoteVersions.has(migration.version)
);

if (pendingMigrations.length === 0) {
    console.log('Supabase đã cập nhật, không có migration mới.');
    process.exit(0);
}

console.log('Migration chờ triển khai:');
pendingMigrations.forEach(migration => console.log(`- ${migration.filename}`));
if (isDryRun) process.exit(0);

for (const migration of pendingMigrations) {
    console.log(`Đang áp dụng ${migration.filename}...`);
    const temporaryDirectory = mkdtempSync(join(tmpdir(), 'khpos-supabase-'));
    const wrappedMigrationPath = join(temporaryDirectory, migration.filename);
    writeFileSync(
        wrappedMigrationPath,
        `BEGIN;\n${readFileSync(migration.filePath, 'utf8')}\nCOMMIT;\n`,
        'utf8'
    );
    try {
        runSupabase([
            'db',
            'query',
            '--linked',
            '--file',
            wrappedMigrationPath,
            '--output-format',
            'text'
        ]);
    } finally {
        rmSync(temporaryDirectory, { recursive: true, force: true });
    }
    runSupabase([
        'migration',
        'repair',
        '--linked',
        '--status',
        'applied',
        migration.version,
        '--output-format',
        'text'
    ]);
}

console.log(`Đã triển khai ${pendingMigrations.length} migration Supabase.`);
