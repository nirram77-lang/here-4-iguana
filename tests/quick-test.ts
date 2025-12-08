// ═══════════════════════════════════════════════════════════════════════════
// I4IGUANA - Quick Tests (Fast version - no build)
// Run: npx ts-node tests/quick-test.ts
// ═══════════════════════════════════════════════════════════════════════════

const URLS = {
  app: 'https://i4iguana-app.vercel.app',
  website: 'https://i4iguana.com',
};

const ALERT_EMAIL = 'nir@i4iguana.com';

interface QuickTestResult {
  test: string;
  passed: boolean;
  error?: string;
  responseTime?: number;
}

async function checkUrl(name: string, url: string): Promise<QuickTestResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'I4IGUANA-QuickTest/1.0' }
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      return { test: name, passed: false, error: `HTTP ${response.status}`, responseTime: Date.now() - start };
    }
    
    return { test: name, passed: true, responseTime: Date.now() - start };
  } catch (error: any) {
    return { test: name, passed: false, error: error.message, responseTime: Date.now() - start };
  }
}

async function runQuickTests(): Promise<void> {
  console.log('');
  console.log('🦎 I4IGUANA Quick Tests');
  console.log('═══════════════════════════════════════════');
  console.log(`📅 ${new Date().toLocaleString('he-IL')}`);
  console.log('');
  
  const results: QuickTestResult[] = [];
  
  // Test 1: Website
  console.log('🌐 Testing website...');
  results.push(await checkUrl('Website', URLS.website));
  
  // Test 2: App
  console.log('📱 Testing app...');
  results.push(await checkUrl('App', URLS.app));
  
  // Test 3: App pages
  const pages = ['/app', '/terms', '/privacy', '/admin/login'];
  for (const page of pages) {
    console.log(`📄 Testing ${page}...`);
    results.push(await checkUrl(`Page: ${page}`, URLS.app + page));
  }
  
  // Summary
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('📊 RESULTS');
  console.log('═══════════════════════════════════════════');
  
  let failed = 0;
  for (const result of results) {
    if (result.passed) {
      console.log(`✅ ${result.test} (${result.responseTime}ms)`);
    } else {
      console.log(`❌ ${result.test}: ${result.error}`);
      failed++;
    }
  }
  
  console.log('');
  console.log(`Total: ${results.length} | Passed: ${results.length - failed} | Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('');
    console.log('🚨 FAILURES DETECTED!');
    console.log(`Alert would be sent to: ${ALERT_EMAIL}`);
    
    // Write failure report
    const report = {
      timestamp: new Date().toISOString(),
      failures: results.filter(r => !r.passed),
    };
    
    const fs = require('fs');
    fs.mkdirSync('./tests/alerts', { recursive: true });
    fs.writeFileSync(`./tests/alerts/quick-${Date.now()}.json`, JSON.stringify(report, null, 2));
    
    process.exit(1);
  } else {
    console.log('');
    console.log('✅ All quick tests passed!');
    process.exit(0);
  }
}

runQuickTests().catch(console.error);
