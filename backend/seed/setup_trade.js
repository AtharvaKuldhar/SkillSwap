const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function setupTrade() {
  try {
    const users = await prisma.user.findMany();
    const mokshita = users.find(u => u.email.includes('mokshita.kochhar07')) || users[0];
    const alex = users.find(u => u.name === 'Alex Rivera') || users.find(u => u.id !== mokshita.id);
    
    // Get their skills
    const mokshitaSkill = await prisma.skill.findFirst({ where: { userId: mokshita.id } }); // e.g. Python
    const alexSkill = await prisma.skill.findFirst({ where: { userId: alex.id } }); // e.g. Graphic Design

    if (!mokshitaSkill || !alexSkill) {
      console.log('Skills missing. Run seed_skills.js first.');
      return;
    }

    // Create an incoming trade request for Mokshita (from Alex)
    await prisma.tradeRequest.create({
      data: {
        requesterId: alex.id,
        receiverId: mokshita.id,
        offeredSkillId: alexSkill.id,
        requestedSkillId: mokshitaSkill.id,
        status: 'PENDING'
      }
    });

    console.log('Created incoming trade request for Mokshita from Alex.');
  } catch (err) {
    console.error('Setup error:', err.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

setupTrade();
