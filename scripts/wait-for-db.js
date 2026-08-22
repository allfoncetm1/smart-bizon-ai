#!/usr/bin/env node
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const maxRetries = parseInt(process.env.WAIT_DB_RETRIES || '60', 10);
const delayMs = parseInt(process.env.WAIT_DB_DELAY_MS || '1000', 10);

async function waitForDb() {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} — connecting to database...`);
      const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
      });
      await client.connect();
      await client.end();
      console.log('\nDatabase is available');
      process.exit(0);
    } catch (err) {
      console.error(`Attempt ${attempt} failed: ${err.message}`);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  console.error('\nTimed out waiting for database');
  process.exit(1);
}

waitForDb();
