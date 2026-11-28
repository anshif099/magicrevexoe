SELECT (COUNT(*) = 1) AS satisfied FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenants'
  AND COLUMN_NAME = 'business_classification' AND IS_NULLABLE = 'YES'
