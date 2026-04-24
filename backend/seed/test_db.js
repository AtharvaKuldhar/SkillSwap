require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const count = await prisma.user.count();
    console.log('User count:', count);
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
    console.log('Users:', JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('DB Error:', e.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
