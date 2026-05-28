const { Client } = require('pg');

async function test() {
  const client = new Client({
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.kypxmenwgtdhwbwmcorz',
    password: 'EUVa4tvsMEUM',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected successfully!");
    const res = await client.query("SELECT 1 as val;");
    console.log(res.rows);
  } catch (err) {
    console.error("Connection error:", err.message);
  } finally {
    await client.end();
  }
}

test();
