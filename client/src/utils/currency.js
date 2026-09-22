// Central currency formatter. Prices are stored as decimal BDT values in SQL Server.
export const formatPrice = (amount) => {
  const value = Number(amount) || 0;
  return `৳${value.toFixed(2)}`;
};
