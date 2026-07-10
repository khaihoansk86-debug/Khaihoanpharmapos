const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://iejgtdcdzababydaqjef.supabase.co',
  'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1',
  { auth: { persistSession: false } }
);

function flags(description) {
  try {
    return description ? JSON.parse(description) : {};
  } catch {
    return {};
  }
}

async function run() {
  const { data, error } = await supabase
    .from('products')
    .select('id, product_code, name, description, categories(name), product_batches(id, stock_quantity)')
    .or('product_code.ilike.DOSE-%,description.ilike.%is_dose_cut%,description.ilike.%is_dose_retail%')
    .limit(200);

  if (error) throw error;

  const rows = (data || []).map((product) => {
    const parsed = flags(product.description);
    return {
      product_code: product.product_code,
      name: product.name,
      category: product.categories?.name || null,
      is_dose_cut: parsed.is_dose_cut === true,
      is_dose_retail: parsed.is_dose_retail === true,
      stock: (product.product_batches || []).reduce((sum, batch) => sum + Number(batch.stock_quantity || 0), 0)
    };
  });

  console.log(JSON.stringify({
    total: rows.length,
    dose_code_ingredient_count: rows.filter((row) => row.product_code?.startsWith('DOSE-') && row.is_dose_cut).length,
    rows
  }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
