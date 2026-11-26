ALTER TABLE merchant_presentation
  DROP CONSTRAINT ck_presentation_logo,
  ADD CONSTRAINT ck_presentation_logo CHECK (logo_png IS NULL OR OCTET_LENGTH(logo_png) < 1000000)
