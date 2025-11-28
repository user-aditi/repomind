// lib/analytics.ts
import { logger } from './logger';

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, any>) => void;
    };
  }
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  logger.info({ event, properties }, 'Analytics event');
  
  // Send to analytics service (Posthog, Mixpanel, etc.)
  if (typeof window !== 'undefined') {
    window.posthog?.capture(event, properties);
  }
}
