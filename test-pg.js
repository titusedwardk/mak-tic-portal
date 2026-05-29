const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.kypxmenwgtdhwbwmcorz:EUVa4tvsMEUM@aws-0-eu-central-1.pooler.supabase.com:6543/postgres'
});
async function main() {
  await client.connect();
  const res = await client.query('SELECT * FROM public.profiles;');
  console.log('Profiles:', res.rows);
  const users = await client.query('SELECT id, email FROM auth.users;');
  console.log('Users:', users.rows);
  await client.end();
}
main().catch(console.error);
