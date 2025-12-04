#!/usr/bin/env node
/**
 * Script to create the first admin user
 * Run: DATABASE_URL="your-database-url" node scripts/init-admin.js
 */

import bcrypt from 'bcrypt';
import { neon } from '@neondatabase/serverless';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.log('Usage: DATABASE_URL="postgresql://..." node scripts/init-admin.js');
    process.exit(1);
  }

  console.log('🔧 Carsellia Admin User Setup\n');
  
  const email = await question('Enter admin email: ');
  const password = await question('Enter admin password: ');
  const firstName = await question('Enter first name (optional): ') || 'Admin';
  const lastName = await question('Enter last name (optional): ') || 'User';
  
  rl.close();

  if (!email || !password) {
    console.error('❌ Email and password are required');
    process.exit(1);
  }

  if (!email.includes('@')) {
    console.error('❌ Please enter a valid email address');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('❌ Password must be at least 6 characters');
    process.exit(1);
  }

  try {
    const sql = neon(databaseUrl);
    
    // Check if user already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      console.error(`❌ User with email "${email}" already exists`);
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate unique ID
    const id = `admin_${Date.now()}`;
    
    // Insert user with admin role
    await sql`
      INSERT INTO users (id, email, password_hash, first_name, last_name, role, auth_type, is_active)
      VALUES (${id}, ${email}, ${passwordHash}, ${firstName}, ${lastName}, 'admin', 'password', 'true')
    `;

    console.log(`\n✅ Admin user created successfully!`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: admin`);
    console.log('\nYou can now log in with these credentials.\n');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

main();
