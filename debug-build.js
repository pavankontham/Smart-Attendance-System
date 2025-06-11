// Debug script to check if all required modules and environment variables are available
console.log('🔍 Debugging build environment...\n');

// Check Node.js version
console.log('📦 Node.js version:', process.version);

// Check environment variables
console.log('\n🔧 Environment Variables:');
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_API_URL'
];

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  console.log(`${envVar}: ${value ? '✅ Set' : '❌ Missing'}`);
});

// Check if critical files exist
console.log('\n📁 Critical Files:');
const fs = require('fs');
const path = require('path');

const criticalFiles = [
  'src/lib/firebase.js',
  'src/lib/supabase.js',
  'src/contexts/AuthContext.js',
  'pages/_app.js',
  'next.config.js',
  'package.json'
];

criticalFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`${file}: ${exists ? '✅ Exists' : '❌ Missing'}`);
});

// Check dependencies
console.log('\n📦 Dependencies:');
try {
  const packageJson = require('./package.json');
  const criticalDeps = [
    'next',
    'react',
    'react-dom',
    'firebase',
    '@supabase/supabase-js'
  ];
  
  criticalDeps.forEach(dep => {
    const version = packageJson.dependencies[dep];
    console.log(`${dep}: ${version ? `✅ ${version}` : '❌ Missing'}`);
  });
} catch (error) {
  console.log('❌ Could not read package.json');
}

console.log('\n🏁 Debug complete!');
