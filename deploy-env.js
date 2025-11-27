#!/usr/bin/env node
// Deploy Environment Variables to Vercel
// Usage: node deploy-env.js

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Vercel Environment Variables Upload...\n');

// Read .env file
const envFile = path.join(process.cwd(), '.env');

if (!fs.existsSync(envFile)) {
    console.error('❌ Error: .env file not found!');
    process.exit(1);
}

console.log('📖 Reading .env file...');

const envContent = fs.readFileSync(envFile, 'utf-8');
const lines = envContent.split('\n');

const envVars = [];

lines.forEach(line => {
    line = line.trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
        return;
    }
    
    // Parse KEY=VALUE
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Remove quotes if present
        value = value.replace(/^["']|["']$/g, '');
        
        envVars.push({ key, value });
    }
});

console.log(`✅ Found ${envVars.length} environment variables\n`);

// Upload each variable to Vercel
async function uploadVariables() {
    let successful = 0;
    let failed = 0;

    for (const env of envVars) {
        const { key, value } = env;
        
        console.log(`📤 Uploading: ${key}`);
        
        try {
            // Execute vercel env add command
            execSync(`echo "${value}" | vercel env add ${key} production`, {
                stdio: 'pipe',
                encoding: 'utf-8'
            });
            
            console.log('   ✅ Success');
            successful++;
        } catch (error) {
            console.log('   ⚠️  Warning: May already exist or failed');
            failed++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (successful > 0) {
        console.log('🎉 Environment variables uploaded successfully!\n');
        console.log('🔄 Next step: Redeploy your project');
        console.log('   Run: vercel --prod\n');
    } else {
        console.log('⚠️  No variables were uploaded. Check for errors above.\n');
    }
}

// Run the upload
uploadVariables().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
