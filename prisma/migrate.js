// This script helps run Prisma migrations with environment variables from .env.local
require('dotenv').config({ path: '../.env.local' });
const { execSync } = require('child_process');

try {
    console.log('Running Prisma migration...');
    execSync('npx prisma migrate dev --name add_charge_product', { stdio: 'inherit' });
    console.log('Migration completed successfully!');
} catch (error) {
    console.error('Migration failed:', error);
}