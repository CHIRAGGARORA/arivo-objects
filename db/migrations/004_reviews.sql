-- Verified-buyer reviews. Only a paid order's customer can write one (via the
-- unguessable order link), at most one per product per order, and nothing is
-- shown publicly until the owner approves it in /admin.
CREATE TABLE IF NOT EXISTS reviews (
  id            bigserial PRIMARY KEY,
  order_id      bigint NOT NULL REFERENCES orders(id),
  product_slug  text NOT NULL,
  rating        smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body          text NOT NULL CHECK (char_length(body) BETWEEN 10 AND 1000),
  author_name   text NOT NULL CHECK (char_length(author_name) BETWEEN 1 AND 40),
  city          text,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  moderated_at  timestamptz,
  UNIQUE (order_id, product_slug)
);

CREATE INDEX IF NOT EXISTS reviews_public_idx ON reviews (status, product_slug, created_at DESC);
