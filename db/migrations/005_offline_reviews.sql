-- Reviews from real customers who bought outside the website (Instagram,
-- WhatsApp, in person). Entered by the owner in /admin with the customer's
-- consent and labelled with where they bought; only website orders are
-- "verified buyer".
ALTER TABLE reviews ALTER COLUMN order_id DROP NOT NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'website';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS consent_confirmed boolean NOT NULL DEFAULT false;

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_source_rule;
ALTER TABLE reviews ADD CONSTRAINT reviews_source_rule CHECK (
  (source = 'website' AND order_id IS NOT NULL)
  OR (source IN ('instagram', 'whatsapp', 'in_person', 'other') AND order_id IS NULL AND consent_confirmed)
);
