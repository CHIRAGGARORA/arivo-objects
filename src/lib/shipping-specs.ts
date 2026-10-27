/**
 * shipping-specs.ts
 * ---------------------------------------------------------------------------
 * PACKED shipping measurements per product variant, as sent to Shiprocket.
 * These are the measurements of the box the customer receives (product +
 * packaging), not the bare product.
 *
 * Every value is null until the owner has physically measured and weighed a
 * packed unit. DO NOT ESTIMATE. While any value for an ordered variant is
 * null, Shiprocket order creation is skipped and flagged for manual handling
 * instead of sending wrong numbers (which causes courier weight disputes
 * and surcharges).
 *
 * Units: weight in kilograms (e.g. 0.45), dimensions in centimetres.
 * ---------------------------------------------------------------------------
 */

export interface PackedSpec {
  weightKg: number | null;
  lengthCm: number | null;
  breadthCm: number | null;
  heightCm: number | null;
}

const PENDING: PackedSpec = { weightKg: null, lengthCm: null, breadthCm: null, heightCm: null };

/** Keyed by `${productSlug}/${variantId}`. */
export const packedSpecs: Record<string, PackedSpec> = {
  "small-oval-marble-tray/black-marble": { ...PENDING }, // [MEASUREMENTS_PENDING]
  "small-oval-marble-tray/terracotta-marble": { ...PENDING }, // [MEASUREMENTS_PENDING]
  "small-oval-marble-tray/ochre-marble": { ...PENDING }, // [MEASUREMENTS_PENDING]
  "large-cloud-marble-tray/black-marble": { ...PENDING }, // [MEASUREMENTS_PENDING]
  "flower-jesmonite-candle/black-marble": { ...PENDING }, // [MEASUREMENTS_PENDING]
};

export function getPackedSpec(productSlug: string, variantId: string): PackedSpec | undefined {
  return packedSpecs[`${productSlug}/${variantId}`];
}

export function isCompleteSpec(spec: PackedSpec | undefined): spec is {
  weightKg: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
} {
  return (
    !!spec &&
    [spec.weightKg, spec.lengthCm, spec.breadthCm, spec.heightCm].every(
      (v) => typeof v === "number" && Number.isFinite(v) && v > 0
    )
  );
}
