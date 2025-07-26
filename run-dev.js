// Script to run the Next.js development server with proper environment variables
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure we're using the environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  console.log('No .env.local file found, using environment variables from process');
}

try {
  // Run the Next.js development server
  console.log('Starting Next.js development server...');
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  console.error('Error running development server:', error.message);
  process.exit(1);
}