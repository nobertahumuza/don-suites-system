const { Pool } = require('@neondatabase/serverless');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_yrpcd7AXlD8s@ep-misty-bread-axhclh7m.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require',
});

const hashes = {
  admin: '$2b$10$s7paKq3U/T/wXVgEIP81kO.54vongthjb3F8YcvAFB0eRYPVNX9YG',
  reception: '$2b$10$Ci8rXup.pHqOTtXmQ2qF5uFMrjx4bqQBN7VmCDle2ZubjYiUt6dA.',
  storekeeper: '$2b$10$.3Uky1e4mC7Y.dFslZrrN.6dpbDk/zgGzqsb.3BfZRMt0u2Ev6Qg.',
  security: '$2b$10$vXpgCAnyKNHvgPIc1lSxQeJGDAQPEQgOR.DY5hmVZs2dRL8StqCUG',
};

async function main() {
  for (const [username, password] of Object.entries(hashes)) {
    await pool.query('UPDATE users SET password = $1 WHERE username = $2', [password, username]);
    console.log(`Updated ${username}`);
  }
  
  const r = await pool.query('SELECT username, role FROM users ORDER BY id');
  console.log('\nUsers:');
  r.rows.forEach(row => console.log(`  ${row.username} (${row.role})`));
  
  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
