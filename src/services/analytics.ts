export type ProductEventName =
  | "pondbrain_viewed"
  | "recommendation_viewed"
  | "recommendation_completed"
  | "alert_viewed"
  | "alert_acknowledged";

export interface ProductEvent {
  name: ProductEventName;
  properties?: Record<string, string | number | boolean>;
}

export function trackProductEvent(_event: ProductEvent) {
  // No-op by design. A future provider can implement this stable interface.
}
