import * as dotenv from 'dotenv';
import path from 'node:path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { Client } from 'pg';

// Debug environment variables
console.log('POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD ? '*****' : 'undefined');
console.log('DB_USER_PASSWORD:', process.env.DB_USER_PASSWORD ? '*****' : 'undefined');

async function setupDatabase() {
  if (!process.env.POSTGRES_PASSWORD) {
    throw new Error('POSTGRES_PASSWORD environment variable is required');
  }
  
  if (!process.env.DB_USER_PASSWORD) {
    throw new Error('DB_USER_PASSWORD environment variable is required');
  }

  const adminClient = new Client({
    user: 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT) || 5432,
  });

  await adminClient.connect();
  
  try {
    // Create user if not exists
    await adminClient.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'expertassist_user') THEN
          CREATE USER expertassist_user WITH PASSWORD '${process.env.DB_USER_PASSWORD}';
        ELSE
          RAISE NOTICE 'User already exists';
        END IF;
      END
      $$;
    `);

    // Check if database exists
    const dbCheckResult = await adminClient.query(`
      SELECT 1 FROM pg_database WHERE datname = 'expert_assist_dev'
    `);
    
    // Create database if it doesn't exist
    if (dbCheckResult.rows.length === 0) {
      await adminClient.query('CREATE DATABASE expert_assist_dev OWNER expertassist_user');
      console.log('Database created successfully');
    } else {
      console.log('Database already exists');
    }
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  } finally {
    await adminClient.end();
  }
}

setupDatabase().catch(err => {
  console.error('Database setup failed:', err);
  process.exit(1);
});
