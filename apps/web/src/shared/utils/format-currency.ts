/** Peso formatting — matches the prototype's `₱${amount.toLocaleString()}` convention
 * (Gsp.html's `renderFinance`), just centralized so every finance screen agrees. */
export function formatCurrency(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}₱${Math.abs(amount).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
