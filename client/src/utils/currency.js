// Central currency formatter for the whole app.
// MediMart AI prices are stored in the database as plain numbers (Bangladeshi Taka),
// this just handles how they are displayed — the underlying math is unchanged.
export const formatPrice = (amount) => {
  const value = Number(amount) || 0;
  return `৳${value.toFixed(2)}`;
};
