SELECT (COUNT(*) = 1) AS satisfied FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenants'
  AND COLUMN_NAME = 'company_details' AND IS_NULLABLE = 'YES'
