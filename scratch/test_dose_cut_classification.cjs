function parseDescription(item) {
  try {
    return item.description ? JSON.parse(item.description) : null;
  } catch {
    return null;
  }
}

function isDoseRetailProduct(item) {
  const desc = parseDescription(item);
  if (desc?.is_dose_retail === true) return true;
  if (desc?.is_dose_cut === true) return false;
  const code = item.code || item.product_code || '';
  return !item.id && code.startsWith('DOSE-');
}

function isDosePackageLine(item) {
  const desc = parseDescription(item);
  const code = item.code || item.product_code || '';
  if (desc?.is_dose_retail === true) return true;
  if (desc?.is_dose_cut === true) return false;
  if (item.isIngredient === true || item.channelPriceType === 'dose_ingredient') return false;
  return !item.id && code.startsWith('DOSE-');
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
  return { label, ok: true };
}

const rawIngredient = {
  product_code: 'SP188017',
  description: JSON.stringify({ is_dose_cut: true })
};

const retailPackageWithBothFlags = {
  product_code: 'SP5937',
  description: JSON.stringify({ is_dose_cut: true, is_dose_retail: true })
};

const virtualRetailPackage = {
  product_code: 'DOSE-12000',
  description: null
};

const realDoseCodeWithoutRetailTag = {
  id: 'real-product-id',
  product_code: 'DOSE-REAL',
  description: null
};

const results = [
  assertEqual(isDoseRetailProduct(rawIngredient), false, 'Nguyen lieu is_dose_cut khong phai goi ban le'),
  assertEqual(isDosePackageLine({ ...rawIngredient, isIngredient: true, channelPriceType: 'dose_ingredient' }), false, 'Nguyen lieu phai tru ton/xuat kho'),
  assertEqual(isDoseRetailProduct(retailPackageWithBothFlags), true, 'Goi ban le co ca hai co van la goi ban le'),
  assertEqual(isDosePackageLine(retailPackageWithBothFlags), true, 'Goi ban le khong tru ton nhu nguyen lieu'),
  assertEqual(isDoseRetailProduct(virtualRetailPackage), true, 'Ma ao DOSE van la goi ban le'),
  assertEqual(isDoseRetailProduct(realDoseCodeWithoutRetailTag), false, 'Hang that co ma DOSE van can tag ban le'),
  assertEqual(isDosePackageLine(realDoseCodeWithoutRetailTag), false, 'Hang that co ma DOSE khong tu dong bo qua tru ton')
];

console.log(JSON.stringify({ passed: results.length, results }, null, 2));
