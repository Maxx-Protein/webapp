// Simple script to apply database schema
// This avoids issues with spaces in the path

const fs = require('fs');
const path = require('path');

// Read the complete database setup file
const schemaPath = path.join(__dirname, 'complete-database-setup.sql');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

console.log('=== Report Calculator Database Schema ===');
console.log('Copy the content below and paste it into your Supabase SQL Editor:\n');
console.log('========================================\n');
console.log(schemaContent);
console.log('\n========================================');
console.log('End of schema. Paste this into Supabase SQL Editor and run it.');