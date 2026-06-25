export function getReturnSettlement(total = 0) {
    const value = Number(total || 0);
    if (value > 0) return { type: 'collect', amount: value };
    if (value < 0) return { type: 'refund', amount: Math.abs(value) };
    return { type: 'even', amount: 0 };
}
