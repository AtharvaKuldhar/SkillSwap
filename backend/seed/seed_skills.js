const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  try {
    const users = await prisma.user.findMany();
    if (users.length < 2) {
      console.log('Not enough users. Please signup first.');
      return;
    }

    const mokshita = users.find(u => u.email.includes('mokshita')) || users[0];
    const alex = users.find(u => u.name === 'Alex Rivera') || users[1];
    const sam = users.find(u => u.name === 'Sam Chen') || users[2];

    const skills = [
      { title: 'Python Programming', description: 'Advanced Python, Data Structures, and Web Scraping.', category: 'Technology', proficiencyLevel: 'Expert', userId: mokshita.id },
      { title: 'React Development', description: 'Building modern UI with React, Tailwind, and Framer Motion.', category: 'Technology', proficiencyLevel: 'Advanced', userId: mokshita.id },
      
      { title: 'Graphic Design', description: 'Logo design, branding, and typography using Adobe tools.', category: 'Design', proficiencyLevel: 'Expert', userId: alex.id },
      { title: 'UI/UX Design', description: 'User-centered design, prototyping in Figma.', category: 'Design', proficiencyLevel: 'Advanced', userId: alex.id },
      
      { title: 'Machine Learning', description: 'Scikit-learn, TensorFlow, and Predictive Modeling.', category: 'Technology', proficiencyLevel: 'Expert', userId: sam.id },
      { title: 'Data Analysis', description: 'Pandas, SQL, and Tableau visualization.', category: 'Technology', proficiencyLevel: 'Advanced', userId: sam.id }
    ];

    for (const s of skills) {
      await prisma.skill.create({ data: s });
    }

    console.log('Seeded 6 skills across 3 users.');
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seed();
