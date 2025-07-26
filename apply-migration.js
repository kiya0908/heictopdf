// Script to apply Prisma migrations
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
  // Generate Prisma client with the updated schema
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Apply migrations
  console.log('Applying migrations...');
  execSync('npx prisma migrate dev --name add_charge_product', { stdio: 'inherit' });
  
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Error during migration:', error.message);
  process.exit(1);
}