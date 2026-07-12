export const inr = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0)

export const num = (n) => new Intl.NumberFormat('en-IN').format(Number(n) || 0)
