// ═══════════════════════════════════════════════════════════════════════════
// I4IGUANA - Test Configuration
// ═══════════════════════════════════════════════════════════════════════════

export const TEST_CONFIG = {
  // App URLs
  urls: {
    app: 'https://i4iguana-app.vercel.app',
    website: 'https://i4iguana.com',
    admin: 'https://i4iguana-app.vercel.app/admin/super/control',
  },

  // Alert Email
  alertEmail: 'nir@i4iguana.com',
  
  // SendGrid API (for email alerts) - Add your key in .env.local
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',

  // Test intervals
  intervalMinutes: 60, // Run every hour

  // Test timeout (ms)
  timeout: 30000, // 30 seconds per test

  // Firebase Test User (for authentication tests)
  testUser: {
    email: 'test@i4iguana.com',
    // Don't store password here - use environment variable
  },

  // Pages to check
  pagesToCheck: [
    { name: 'Landing Page', url: '/', expectedText: 'I4IGUANA' },
    { name: 'App Main', url: '/app', expectedText: '' },
    { name: 'Terms', url: '/terms', expectedText: 'Terms' },
    { name: 'Privacy', url: '/privacy', expectedText: 'Privacy' },
    { name: 'Admin Login', url: '/admin/login', expectedText: '' },
  ],

  // API endpoints to check
  apiEndpoints: [
    { name: 'Checkout Session', url: '/api/create-checkout-session', method: 'POST' },
  ],

  // Critical features to test
  criticalFeatures: [
    'authentication',
    'profile',
    'checkin',
    'matching',
    'chat',
    'payment',
  ],
};

export default TEST_CONFIG;
