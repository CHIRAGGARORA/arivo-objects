-- Order automation: shipping status, automatic restock on refund, owner
-- notes, and a low-stock email step.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS restocked_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text;

-- Which order lines actually took stock when paid, so a refund puts back
-- exactly what was taken (an oversold line took none).
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS stock_taken boolean NOT NULL DEFAULT false;
UPDATE order_items i SET stock_taken = true
  FROM orders o
 WHERE o.id = i.order_id AND o.status = 'paid'
   AND (o.attention_reason IS NULL OR position('stock was insufficient' in o.attention_reason) = 0);

ALTER TABLE order_tasks DROP CONSTRAINT IF EXISTS order_tasks_task_check;
ALTER TABLE order_tasks ADD CONSTRAINT order_tasks_task_check CHECK (task IN (
  'customer_email', 'owner_email', 'shiprocket_order', 'shipping_alert_email', 'low_stock_email'));
