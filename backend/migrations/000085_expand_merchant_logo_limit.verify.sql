SELECT (COUNT(*) = 1) AS satisfied
FROM information_schema.CHECK_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = DATABASE()
  AND TABLE_NAME = 'merchant_presentation'
  AND CONSTRAINT_NAME = 'ck_presentation_logo'
  AND LOWER(REPLACE(REPLACE(REPLACE(CHECK_CLAUSE, '`', ''), ' ', ''), CHAR(10), '')) =
    'logo_pngisnulloroctet_length(logo_png)<1000000'
