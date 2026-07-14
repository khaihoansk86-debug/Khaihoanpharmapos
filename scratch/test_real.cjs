const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://iejgtdcdzababydaqjef.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const js = fs.readFileSync('js/features/reports/reportService.js', 'utf8');
const js2 = fs.readFileSync('js/features/reports/doseReportRules.js', 'utf8');
