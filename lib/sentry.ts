// lib/sentry.ts
// ✅ Sentry Error Monitoring Configuration

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || '';

interface SentryError {
  message: string;
  stack?: string;
  componentStack?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

class SentryService {
  private initialized = false;
  private dsn: string;

  constructor() {
    this.dsn = SENTRY_DSN;
  }

  init() {
    if (this.initialized || !this.dsn) {
      if (!this.dsn) {
        console.log('⚠️ Sentry DSN not configured - error monitoring disabled');
      }
      return;
    }

    // Load Sentry SDK dynamically
    const script = document.createElement('script');
    script.src = 'https://browser.sentry-cdn.com/7.94.1/bundle.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if ((window as any).Sentry) {
        (window as any).Sentry.init({
          dsn: this.dsn,
          environment: process.env.NODE_ENV || 'production',
          release: 'i4iguana@2.8.23',
          
          // Performance monitoring
          tracesSampleRate: 0.1, // 10% of transactions
          
          // Session replay (optional)
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
          
          // Filter out non-critical errors
          beforeSend(event: any) {
            // Ignore certain errors
            if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
              return null;
            }
            if (event.exception?.values?.[0]?.value?.includes('Network request failed')) {
              return null;
            }
            return event;
          },
        });
        
        this.initialized = true;
        console.log('✅ Sentry initialized - error monitoring active');
      }
    };
    document.head.appendChild(script);
  }

  // Capture an error manually
  captureError(error: Error | string, context?: Record<string, any>) {
    if (!this.initialized || !(window as any).Sentry) {
      console.error('Sentry not initialized:', error);
      return;
    }

    if (typeof error === 'string') {
      (window as any).Sentry.captureMessage(error, {
        level: 'error',
        extra: context,
      });
    } else {
      (window as any).Sentry.captureException(error, {
        extra: context,
      });
    }
  }

  // Set user context
  setUser(userId: string, email?: string, phone?: string) {
    if (!this.initialized || !(window as any).Sentry) return;

    (window as any).Sentry.setUser({
      id: userId,
      email: email,
      phone: phone,
    });
  }

  // Clear user on logout
  clearUser() {
    if (!this.initialized || !(window as any).Sentry) return;
    (window as any).Sentry.setUser(null);
  }

  // Add breadcrumb for debugging
  addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
    if (!this.initialized || !(window as any).Sentry) return;

    (window as any).Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }

  // Set extra context
  setContext(name: string, data: Record<string, any>) {
    if (!this.initialized || !(window as any).Sentry) return;
    (window as any).Sentry.setContext(name, data);
  }

  // Set tag
  setTag(key: string, value: string) {
    if (!this.initialized || !(window as any).Sentry) return;
    (window as any).Sentry.setTag(key, value);
  }
}

// Singleton instance
export const sentry = new SentryService();

// Global error handler
export function setupGlobalErrorHandlers() {
  // Catch unhandled errors
  window.onerror = (message, source, lineno, colno, error) => {
    sentry.captureError(error || new Error(String(message)), {
      source,
      lineno,
      colno,
    });
  };

  // Catch unhandled promise rejections
  window.onunhandledrejection = (event) => {
    sentry.captureError(event.reason || 'Unhandled Promise Rejection', {
      type: 'unhandledrejection',
    });
  };
}
