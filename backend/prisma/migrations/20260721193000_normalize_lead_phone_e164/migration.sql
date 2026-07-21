UPDATE "Lead"
SET "normalizedPhone" = CASE
  WHEN "normalizedPhone" IS NULL OR "normalizedPhone" = '' THEN NULL
  WHEN "normalizedPhone" LIKE '+%' THEN "normalizedPhone"
  WHEN length("normalizedPhone") IN (10, 11) THEN '+55' || "normalizedPhone"
  ELSE '+' || "normalizedPhone"
END
WHERE "normalizedPhone" IS NOT NULL;
