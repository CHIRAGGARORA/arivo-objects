-- 002_coupons: record coupon discounts on orders. Additive; existing rows get
-- discount 0, which satisfies the new total rule.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_paise integer NOT NULL DEFAULT 0;

DO $$
DECLARE c record;
BEGIN
  -- Replace the old "total = subtotal + shipping" check (auto-named) with one
  -- that accounts for discounts.
  FOR c IN
    SELECT conname FROM pg_constraint
     WHERE conrelid = 'orders'::regclass AND contype = 'c'
       AND pg_get_constraintdef(oid) LIKE '%total_paise = (subtotal_paise + shipping_paise)%'
  LOOP
    EXECUTE format('ALTER TABLE orders DROP CONSTRAINT %I', c.conname);
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_total_rule') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_total_rule
      CHECK (discount_paise >= 0
             AND discount_paise <= subtotal_paise
             AND total_paise = subtotal_paise - discount_paise + shipping_paise
             AND total_paise >= 100);
  END IF;
END $$;
