const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    const password = 'Demo1234!';
    const hash = await bcrypt.hash(password, 12);
    const JWT_SECRET = process.env.JWT_SECRET;

    // Create demo user (delete if exists)
    await prisma.user.deleteMany({ where: { email: 'demo@skillswap.test' } });
    const demo = await prisma.user.create({
      data: {
        name: 'Priya Sharma',
        email: 'demo@skillswap.test',
        password: hash,
        location: 'Pune, India',
        timeCredits: 5,
        reputationPoints: 12,
      }
    });
    console.log('Created demo user:', demo.id);

    // Add 2 skills to demo user
    const skill1 = await prisma.skill.create({
      data: {
        title: 'Python Programming',
        description: 'Advanced Python, OOP, Data Structures and Algorithms. 5 years of experience.',
        category: 'Technology',
        proficiencyLevel: 'Expert',
        userId: demo.id,
      }
    });
    const skill2 = await prisma.skill.create({
      data: {
        title: 'Data Visualization',
        description: 'Matplotlib, Seaborn, Plotly and Tableau for business dashboards.',
        category: 'Technology',
        proficiencyLevel: 'Advanced',
        userId: demo.id,
      }
    });

    // Find Alex Rivera to make an incoming trade request
    const alex = await prisma.user.findFirst({ where: { name: 'Alex Rivera' } });
    const alexSkill = alex ? await prisma.skill.findFirst({ where: { userId: alex.id } }) : null;

    if (alex && alexSkill) {
      await prisma.tradeRequest.create({
        data: {
          requesterId: alex.id,
          receiverId: demo.id,
          offeredSkillId: alexSkill.id,
          requestedSkillId: skill1.id,
          status: 'PENDING',
        }
      });
      console.log('Created incoming trade from Alex to demo user');
    }

    // Find Sam's skill for the trade request modal demo
    const sam = await prisma.user.findFirst({ where: { name: 'Sam Chen' } });
    const samSkill = sam ? await prisma.skill.findFirst({ where: { userId: sam.id } }) : null;
    console.log('Sam skill available:', samSkill ? samSkill.title : 'none');

    // Generate JWT token
    const token = jwt.sign({ id: demo.id, email: demo.email }, JWT_SECRET, { expiresIn: '7d' });
    console.log('\n--- DEMO USER LOGIN TOKEN (paste in console) ---');
    console.log(JSON.stringify({ token, userId: demo.id, userName: demo.name }));
    console.log('Password: Demo1234!');
    console.log('Email: demo@skillswap.test');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
