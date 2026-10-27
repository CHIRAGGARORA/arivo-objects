-- 003_refunds: record Razorpay refunds. Additive.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_paise integer NOT NULL DEFAULT 0 CHECK (refunded_paise >= 0);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

-- Allow the 'refunded' status (replace the auto-named status check).
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
     WHERE conrelid = 'orders'::regclass AND contype = 'c'
       AND pg_get_constraintdef(oid) LIKE '%status = ANY%'
       AND pg_get_constraintdef(oid) LIKE '%cancelled%'
       AND pg_get_constraintdef(oid) NOT LIKE '%refunded%'
  LOOP
    EXECUTE format('ALTER TABLE orders DROP CONSTRAINT %I', c.conname);
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_values') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_status_values
      CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded'));
  END IF;
END $$;

-- Each Razorpay refund is applied once, even if its webhook is re-delivered.
CREATE TABLE IF NOT EXISTS refunds (
  refund_id     text PRIMARY KEY,
  order_id      bigint NOT NULL REFERENCES orders(id),
  amount_paise  integer NOT NULL CHECK (amount_paise > 0),
  created_at    timestamptz NOT NULL DEFAULT now()
);
