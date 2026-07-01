const { Client } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const allRegions = [
  'ap-southeast-1', 'ap-northeast-1', 'ap-northeast-2', 'ap-southeast-2',
  'us-east-1', 'us-west-1', 'us-east-2', 'us-west-2',
  'eu-west-1', 'eu-central-1',
  // Remaining regions:
  'ap-northeast-3', 'ap-south-1', 'ca-central-1', 'eu-west-2',
  'eu-west-3', 'eu-south-1', 'sa-east-1', 'me-central-1', 'af-south-1'
];

async function testConnections() {
  const projectId = 'tilidsutgdiqzfvyhsxv';
  const password = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!password) {
    console.error('ERROR: Missing SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // 1. Test IPv6 direct connection first
  console.log('Testing direct IPv6 connection...');
  const ipv6Client = new Client({
    host: '2406:da12:5ca:b702:21e:e31b:bb2a:2d56',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000
  });
  try {
    await ipv6Client.connect();
    console.log('🎉 SUCCESS! Connected directly via IPv6!');
    const res = await ipv6Client.query('SELECT current_database(), now()');
    console.log('Query output:', res.rows[0]);
    await ipv6Client.end();
    return;
  } catch (err) {
    console.log(`❌ IPv6 direct failed: ${err.message}\n`);
  }

  // 2. Test pooler regions
  for (const region of allRegions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const username = `postgres.${projectId}`;
    
    console.log(`Testing region: ${region} (${host})...`);
    const client = new Client({
      host,
      port: 5432,
      database: 'postgres',
      user: username,
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000
    });

    try {
      await client.connect();
      console.log(`\n🎉 SUCCESS! Connected to region: ${region}`);
      const res = await client.query('SELECT current_database(), now()');
      console.log('Query output:', res.rows[0]);
      await client.end();
      return;
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
    }
  }

  console.log('\n❌ All connections failed.');
}

testConnections();
