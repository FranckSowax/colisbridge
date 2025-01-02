-- Mise à jour des prix totaux pour tous les colis existants
WITH price_calculations AS (
  SELECT 
    p.id,
    CASE
      WHEN pr.unit_type = 'kg' THEN p.weight * pr.price_per_unit
      WHEN pr.unit_type = 'cbm' THEN p.cbm * pr.price_per_unit
      ELSE 0
    END as calculated_price,
    pr.currency
  FROM parcels p
  LEFT JOIN pricing_rules pr ON 
    pr.country_code = LOWER(p.country) AND
    pr.shipping_type = LOWER(p.shipping_type)
  WHERE p.id IS NOT NULL
)
UPDATE parcels p
SET 
  total_price = pc.calculated_price,
  currency = pc.currency,
  updated_at = NOW()
FROM price_calculations pc
WHERE p.id = pc.id;

-- Afficher un résumé des mises à jour
SELECT 
  country,
  shipping_type,
  COUNT(*) as updated_parcels,
  SUM(total_price) as total_amount,
  currency
FROM parcels
WHERE total_price > 0
GROUP BY country, shipping_type, currency
ORDER BY country, shipping_type;
