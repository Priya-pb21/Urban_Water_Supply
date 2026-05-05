const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
};

const database = process.env.DB_NAME || 'water_supply_db';

function quoteIdentifier(identifier) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error('DB_NAME must contain only letters, numbers, and underscores, and cannot start with a number');
  }
  return `"${identifier}"`;
}

async function ensureDatabase() {
  const client = new Client({ ...dbConfig, database: 'postgres' });
  await client.connect();

  try {
    const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (!existing.rows.length) {
      await client.query(`CREATE DATABASE ${quoteIdentifier(database)}`);
      console.log(`Created database "${database}"`);
    }
  } finally {
    await client.end();
  }
}

async function applySchema() {
  const client = new Client({ ...dbConfig, database });
  await client.connect();

  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(sql);
  } finally {
    await client.end();
  }
}

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    await ensureDatabase();
    await applySchema();
    console.log('Database schema created successfully!');
    console.log('Default admin: admin@waterms.com / Admin@123');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    throw err;
  }
}

initializeDatabase();
