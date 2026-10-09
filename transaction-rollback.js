require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL');

  await client.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      action TEXT NOT NULL,
      post_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const postsBefore = await client.query('SELECT COUNT(*) FROM posts');
  const logBefore = await client.query('SELECT COUNT(*) FROM audit_log');
  console.log('\n--- Before transaction ---');
  console.log('posts count:', postsBefore.rows[0].count);
  console.log('audit_log count:', logBefore.rows[0].count);

  console.log('\n--- Attempting transaction (will fail on purpose) ---');
  try {
    await client.query('BEGIN');
    await client.query(
      "INSERT INTO posts (title, author_id) VALUES ('Rollback test post', 1)"
    );
    await client.query(
      "INSERT INTO audit_log (action, post_id) VALUES ('created_post', 'not_a_number')"
    );
    await client.query('COMMIT');
    console.log('Transaction committed (should NOT reach here)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.log('Transaction FAILED as expected:', err.message);
    console.log('ROLLBACK issued');
  }

  const postsAfter = await client.query('SELECT COUNT(*) FROM posts');
  const logAfter = await client.query('SELECT COUNT(*) FROM audit_log');
  console.log('\n--- After transaction (rollback proof) ---');
  console.log('posts count:', postsAfter.rows[0].count, '(should match BEFORE count)');
  console.log('audit_log count:', logAfter.rows[0].count, '(should match BEFORE count)');

  const rollbackWorked =
    postsBefore.rows[0].count === postsAfter.rows[0].count &&
    logBefore.rows[0].count === logAfter.rows[0].count;
  console.log('\nRollback genuinely worked:', rollbackWorked);

  await client.end();
}

main().catch(console.error);