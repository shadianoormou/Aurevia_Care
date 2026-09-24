-- Replace an unrelated stock image that made the cough-syrup card look like a pet product.
-- This is intentionally scoped to the known starter record and is safe to rerun.
UPDATE dbo.Products
SET ImageUrl = N'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=900',
    UpdatedAt = SYSUTCDATETIME()
WHERE Name = N'Cough Comfort Syrup · 100ml'
  AND ImageUrl LIKE N'%1626285861696-9f0bf5a49c6d%';
