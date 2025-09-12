// Utility to format numbers as Indian Rupees across the frontend
export function formatCurrency(value) {
  if (value == null || Number.isNaN(Number(value))) return "-";
  const num = Number(value);
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);
}

export default formatCurrency;
