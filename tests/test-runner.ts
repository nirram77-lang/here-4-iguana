// ═══════════════════════════════════════════════════════════════════════════
// I4IGUANA - Main Test Runner
// Runs all tests and sends email alerts on failures
// ═══════════════════════════════════════════════════════════════════════════

import { TEST_CONFIG } from './test-config';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  error?: string;
  details?: string;
  duration: number;
  timestamp: Date;
}

export interface TestReport {
  runId: string;
  timestamp: Date;
  totalTests: number;
  passed: number;
  failed: number;
  results: TestResult[];
  duration: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// Test 1: Build Check
async function testBuild(): Promise<TestResult> {
  const start = Date.now();
  try {
    const { execSync } = require('child_process');
    execSync('npm run build', { 
      stdio: 'pipe',
      timeout: 120000 // 2 minutes
    });
    return {
      name: 'Build Test',
      category: 'build',
      passed: true,
      duration: Date.now() - start,
      timestamp: new Date(),
    };
  } catch (error: any) {
    return {
      name: 'Build Test',
      category: 'build',
      passed: false,
      error: 'Build failed',
      details: error.message || error.toString(),
      duration: Date.now() - start,
      timestamp: new Date(),
    };
  }
}

// Test 2: TypeScript Check
async function testTypeScript(): Promise<TestResult> {
  const start = Date.now();
  try {
    const { execSync } = require('child_process');
    execSync('npx tsc --noEmit', { 
      stdio: 'pipe',
      timeout: 60000
    });
    return {
      name: 'TypeScript Check',
      category: 'build',
      passed: true,
      duration: Date.now() - start,
      timestamp: new Date(),
    };
  } catch (error: any) {
    return {
      name: 'TypeScript Check',
      category: 'build',
      passed: false,
      error: 'TypeScript errors found',
      details: error.stdout?.toString() || error.message,
      duration: Date.now() - start,
      timestamp: new Date(),
    };
  }
}

// Test 3: Page Availability
async function testPageAvailability(page: { name: string; url: string; expectedText: string }): Promise<TestResult> {
  const start = Date.now();
  const fullUrl = TEST_CONFIG.urls.app + page.url;
  
  try {
    const response = await fetch(fullUrl, { 
      method: 'GET',
      headers: { 'User-Agent': 'I4IGUANA-Test-Bot/1.0' }
    });
    
    if (!response.ok) {
      return {
        name: `Page: ${page.name}`,
        category: 'pages',
        passed: false,
        error: `HTTP ${response.status}`,
        details: `URL: ${fullUrl} returned status ${response.status}`,
        duration: Date.now() - start,
        timestamp: new Date(),
      };
    }
    
    const html = await response.text();
    
    if (page.expectedText && !html.includes(page.expectedText)) {
      return {
        name: `Page: ${page.name}`,
        category: 'pages',
        passed: false,
        error: 'Expected content not found',
        details: `Expected "${page.expectedText}" not found in page`,
        duration: Date.now() - start,
        timestamp: new Date(),
      };
    }
    
    return {
      name: `Page: ${page.name}`,
      category: 'pages',
      passed: true,
      duration: Date.now() - start,
      timestamp: new Date(),
    };
  } catch (error: any) {
    return {
      name: `Page: ${page.name}`,
      category: 'pages',
      passed: false,
      error: 'Request failed',
      details: error.message,
      duration: Date.now() - start,
      timestamp: new Date(),
    };
  }
}

// Test 4: Website Availability
async function testWebsite(): Promise<TestResult> {
  const start = Date.now();
  
  try {
    const response = await fetch(TEST_CONFIG.urls.website, {
      method: 'GET',
      headers: { 'User-Agent': 'I4IGUANA-Test-Bot/1.0' }
    });
    
    if (!response.ok) {
      return {
        name: 'Website Availability',
        category: 'website',
        passed: false,
        error: `HTTP ${response.status}`,
        details: `Website returned status ${response.status}`,
        duration: Date.now() - start,
        timestamp: new Date(),
      };
    }
    
    return {
      name: 'Website Availability',
      category: 'website',
      passed: true,
      duration: Date.now() - start,
      timestamp: new Date(),
    };
  } catch (error: any) {
    return {
      name: 'Website Availability',
      category: 'website',
      passed: false,
      error: 'Website unreachable',
      details: error.message,
      duration: Date.now() - start,
      timestamp: new Date(),
    };
  }
}

// Test 5: Firebase Connection
async function testFirebaseConnection(): Promise<TestResult> {
  const start = Date.now();
  
  try {
    // Dynamic import to avoid build issues
    const { db } = await import('../lib/firebase');
    const { collection, getDocs, query, limit } = await import('firebase/firestore');
    
    // Try to read from venues (public collection)
    const q = query(collection(db, 'venues'), limit(1));
    await getDocs(q);
    
    return {
      name: 'Firebase Connection',
      category: 'firebase',
      passed: true,
      duration: Date.now() - start,
      timestamp: new Date(),
    };
  } catch (error: any) {
    return {
      name: 'Firebase Connection',
      category: 'firebase',
      passed: false,
      error: 'Firebase connection failed',
      details: error.message,
      duration: Date.now() - start,
      timestamp: new Date(),
    };
  }
}

// Test 6: Check for Console Errors (basic check)
async function testNoJSErrors(): Promise<TestResult> {
  const start = Date.now();
  
  try {
    const response = await fetch(TEST_CONFIG.urls.app + '/app');
    const html = await response.text();
    
    // Check for common error indicators in HTML
    const errorIndicators = [
      'Internal Server Error',
      'Application error',
      'Something went wrong',
      'Error: ',
      'Unhandled Runtime Error',
    ];
    
    for (const indicator of errorIndicators) {
      if (html.includes(indicator)) {
        return {
          name: 'JS Error Check',
          category: 'errors',
          passed: false,
          error: 'Error found in page',
          details: `Found: "${indicator}"`,
          duration: Date.now() - start,
          timestamp: new Date(),
        };
      }
    }
    
    return {
      name: 'JS Error Check',
      category: 'errors',
      passed: true,
      duration: Date.now() - start,
      timestamp: new Date(),
    };
  } catch (error: any) {
    return {
      name: 'JS Error Check',
      category: 'errors',
      passed: false,
      error: 'Check failed',
      details: error.message,
      duration: Date.now() - start,
      timestamp: new Date(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL NOTIFICATION
// ═══════════════════════════════════════════════════════════════════════════

async function sendEmailAlert(report: TestReport): Promise<void> {
  const failedTests = report.results.filter(r => !r.passed);
  
  if (failedTests.length === 0) {
    console.log('✅ All tests passed - no email sent');
    return;
  }
  
  const subject = `🚨 I4IGUANA Alert: ${failedTests.length} Test(s) Failed`;
  
  const body = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #0a1f1a; color: white; padding: 20px; }
    .header { background: #dc2626; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
    .test { background: #1a1a1a; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #dc2626; }
    .test-name { font-weight: bold; font-size: 16px; color: #f87171; }
    .test-error { color: #fca5a5; margin-top: 5px; }
    .test-details { color: #9ca3af; margin-top: 5px; font-family: monospace; font-size: 12px; white-space: pre-wrap; }
    .summary { background: #166534; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .footer { margin-top: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚨 I4IGUANA Test Alert</h1>
    <p>${failedTests.length} test(s) failed at ${new Date().toLocaleString('he-IL')}</p>
  </div>
  
  <h2>❌ Failed Tests:</h2>
  ${failedTests.map(test => `
    <div class="test">
      <div class="test-name">❌ ${test.name} (${test.category})</div>
      <div class="test-error">Error: ${test.error}</div>
      ${test.details ? `<div class="test-details">${test.details}</div>` : ''}
    </div>
  `).join('')}
  
  <div class="summary">
    <h3>📊 Summary</h3>
    <p>Total: ${report.totalTests} | Passed: ${report.passed} | Failed: ${report.failed}</p>
    <p>Duration: ${(report.duration / 1000).toFixed(2)}s</p>
  </div>
  
  <div class="footer">
    <p>🦎 I4IGUANA Automated Testing System</p>
    <p>Run ID: ${report.runId}</p>
  </div>
</body>
</html>
  `;
  
  // Try to send via SendGrid
  if (TEST_CONFIG.sendgridApiKey) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: TEST_CONFIG.alertEmail }] }],
          from: { email: 'alerts@i4iguana.com', name: 'I4IGUANA Tests' },
          subject,
          content: [{ type: 'text/html', value: body }],
        }),
      });
      
      if (response.ok) {
        console.log(`📧 Alert email sent to ${TEST_CONFIG.alertEmail}`);
      } else {
        console.error('Failed to send email:', await response.text());
      }
    } catch (error) {
      console.error('Email error:', error);
    }
  } else {
    // Fallback: Write to file for manual review
    const fs = require('fs');
    const alertFile = `./tests/alerts/alert-${Date.now()}.html`;
    fs.mkdirSync('./tests/alerts', { recursive: true });
    fs.writeFileSync(alertFile, body);
    console.log(`📝 Alert saved to ${alertFile}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════════

export async function runAllTests(options: { 
  skipBuild?: boolean;
  verbose?: boolean;
} = {}): Promise<TestReport> {
  const runId = `test-${Date.now()}`;
  const startTime = Date.now();
  const results: TestResult[] = [];
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🦎 I4IGUANA Test Runner');
  console.log(`📅 ${new Date().toLocaleString('he-IL')}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  
  // Test 1: Build (optional - takes time)
  if (!options.skipBuild) {
    console.log('🔨 Testing Build...');
    const buildResult = await testBuild();
    results.push(buildResult);
    console.log(buildResult.passed ? '  ✅ Build passed' : `  ❌ Build failed: ${buildResult.error}`);
  }
  
  // Test 2: TypeScript
  console.log('📝 Testing TypeScript...');
  const tsResult = await testTypeScript();
  results.push(tsResult);
  console.log(tsResult.passed ? '  ✅ TypeScript OK' : `  ❌ TypeScript errors: ${tsResult.error}`);
  
  // Test 3: Website
  console.log('🌐 Testing Website...');
  const websiteResult = await testWebsite();
  results.push(websiteResult);
  console.log(websiteResult.passed ? '  ✅ Website OK' : `  ❌ Website error: ${websiteResult.error}`);
  
  // Test 4: Pages
  console.log('📄 Testing Pages...');
  for (const page of TEST_CONFIG.pagesToCheck) {
    const pageResult = await testPageAvailability(page);
    results.push(pageResult);
    console.log(pageResult.passed ? `  ✅ ${page.name}` : `  ❌ ${page.name}: ${pageResult.error}`);
  }
  
  // Test 5: Firebase
  console.log('🔥 Testing Firebase...');
  const firebaseResult = await testFirebaseConnection();
  results.push(firebaseResult);
  console.log(firebaseResult.passed ? '  ✅ Firebase OK' : `  ❌ Firebase error: ${firebaseResult.error}`);
  
  // Test 6: JS Errors
  console.log('🐛 Checking for errors...');
  const errorResult = await testNoJSErrors();
  results.push(errorResult);
  console.log(errorResult.passed ? '  ✅ No errors' : `  ❌ Errors found: ${errorResult.error}`);
  
  // Generate report
  const report: TestReport = {
    runId,
    timestamp: new Date(),
    totalTests: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    results,
    duration: Date.now() - startTime,
  };
  
  // Print summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total: ${report.totalTests}`);
  console.log(`✅ Passed: ${report.passed}`);
  console.log(`❌ Failed: ${report.failed}`);
  console.log(`⏱️ Duration: ${(report.duration / 1000).toFixed(2)}s`);
  console.log('');
  
  // Send email if failures
  if (report.failed > 0) {
    console.log('📧 Sending alert email...');
    await sendEmailAlert(report);
  } else {
    console.log('✅ All tests passed! No alert needed.');
  }
  
  return report;
}

// Run if called directly
if (require.main === module) {
  runAllTests({ skipBuild: process.argv.includes('--skip-build') })
    .then(report => {
      process.exit(report.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}
