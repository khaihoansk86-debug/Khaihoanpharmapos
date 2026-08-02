const numberFormatter = new Intl.NumberFormat('vi-VN');

export function formatNumber(value) {
    const number = Number(value || 0);
    return numberFormatter.format(Number.isFinite(number) ? number : 0);
}
