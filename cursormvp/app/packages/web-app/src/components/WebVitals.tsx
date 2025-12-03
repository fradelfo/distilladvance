'use client';

/**
 * WebVitals Component
 *
 * Tracks Core Web Vitals metrics and reports them to analytics.
 * Metrics tracked:
 * - LCP (Largest Contentful Paint) - loading performance
 * - INP (Interaction to Next Paint) - interactivity
 * - CLS (Cumulative Layout Shift) - visual stability
 * - TTFB (Time to First Byte) - server response time
 */

import { useEffect, useRef } from 'react';
import { onCLS, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';
import { trackWebVitals } from '@/lib/analytics';

function getRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
  // Thresholds based on Google's recommendations
  const thresholds: Record<string, [number, number]> = {
    CLS: [0.1, 0.25],
    LCP: [2500, 4000],
    TTFB: [800, 1800],
    INP: [200, 500],
  };

  const [good, poor] = thresholds[metric.name] || [0, 0];

  if (metric.value <= good) return 'good';
  if (metric.value <= poor) return 'needs-improvement';
  return 'poor';
}

function reportMetric(metric: Metric): void {
  trackWebVitals({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: getRating(metric),
  });
}

export function WebVitals() {
  // Use ref to prevent duplicate registration in React.StrictMode
  const isRegistered = useRef(false);

  useEffect(() => {
    // Guard against duplicate registration (React.StrictMode runs effects twice)
    if (isRegistered.current) return;
    isRegistered.current = true;

    // Register all Core Web Vitals observers
    onCLS(reportMetric);
    onLCP(reportMetric);
    onTTFB(reportMetric);
    onINP(reportMetric);
  }, []);

  // This component doesn't render anything
  return null;
}
