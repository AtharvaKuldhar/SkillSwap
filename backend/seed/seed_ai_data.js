/**
 * seed_ai_data.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Seeds the database with enough realistic data to train all three AI signals:
 *   1. TF-IDF content-based filtering  → needs skills with varied text
 *   2. SVD collaborative filtering     → needs completed trades
 *   3. PageRank trust scoring          → needs a completed-trade graph
 *
 * Run from the backend directory:
 *   node seed_ai_data.js
 *
 * After seeding, calls POST /api/ai/retrain to activate the live model.
 */

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SEED_PASSWORD = 'Skillswap1!';

// 4 diverse users across different domains
const USERS = [
  { name: 'Arjun Mehta',   email: 'arjun@skillswap.ai',   location: 'Mumbai, India' },
  { name: 'Sneha Reddy',   email: 'sneha@skillswap.ai',   location: 'Hyderabad, India' },
  { name: 'Rahul Gupta',   email: 'rahul@skillswap.ai',   location: 'Delhi, India' },
  { name: 'Priya Sharma',  email: 'priya@skillswap.ai',   location: 'Pune, India' },
];

// Skills spread across multiple categories for rich TF-IDF signal
const buildSkills = (users) => {
  const [arjun, sneha, rahul, priya] = users;
  return [
    // Arjun — Technology heavy
    {
      title: 'React & TypeScript Development',
      description: 'Building modern web applications with React, TypeScript, hooks, and context API. Experience with Redux, React Query, and performance optimisation.',
      category: 'Technology',
      proficiencyLevel: 'Expert',
      userId: arjun.id,
    },
    {
      title: 'Node.js & REST API Design',
      description: 'Backend development with Node.js, Express, and Prisma ORM. JWT authentication, rate limiting, PostgreSQL, and REST API best practices.',
      category: 'Technology',
      proficiencyLevel: 'Advanced',
      userId: arjun.id,
    },
    {
      title: 'Docker & DevOps',
      description: 'Containerising applications with Docker and Docker Compose. CI/CD pipelines using GitHub Actions, deployment on Railway and Render.',
      category: 'Technology',
      proficiencyLevel: 'Intermediate',
      userId: arjun.id,
    },

    // Sneha — AI/Data + Design
    {
      title: 'Python & Machine Learning',
      description: 'Scikit-learn, PyTorch, and pandas for building classification models, recommendation systems, and NLP pipelines. 3 years of production ML experience.',
      category: 'Technology',
      proficiencyLevel: 'Expert',
      userId: sneha.id,
    },
    {
      title: 'Data Analysis & Visualisation',
      description: 'Exploratory data analysis with pandas and NumPy. Visualisation using Matplotlib, Seaborn, and Plotly. Dashboard creation in Tableau.',
      category: 'Technology',
      proficiencyLevel: 'Advanced',
      userId: sneha.id,
    },
    {
      title: 'UI/UX Design with Figma',
      description: 'User-centered product design, wireframing, interactive prototyping, and design systems in Figma. Conducted usability testing for 10+ products.',
      category: 'Design',
      proficiencyLevel: 'Advanced',
      userId: sneha.id,
    },

    // Rahul — Business + Marketing
    {
      title: 'Digital Marketing & SEO',
      description: 'Google Ads, Meta Ads, and organic SEO audits. Keyword research, on-page optimisation, and analytics tracking via Google Analytics and Search Console.',
      category: 'Marketing',
      proficiencyLevel: 'Expert',
      userId: rahul.id,
    },
    {
      title: 'Content Writing & Copywriting',
      description: 'Long-form blog posts, landing page copy, email sequences, and social media content. Experience with SaaS, e-commerce, and ed-tech niches.',
      category: 'Marketing',
      proficiencyLevel: 'Advanced',
      userId: rahul.id,
    },
    {
      title: 'Business Strategy & Product Management',
      description: 'Market research, competitive analysis, OKR setting, and roadmap planning. Familiar with Agile and Scrum frameworks for cross-functional teams.',
      category: 'Business',
      proficiencyLevel: 'Intermediate',
      userId: rahul.id,
    },

    // Priya — Creative + Language
    {
      title: 'Graphic Design & Branding',
      description: 'Logo design, brand identity, and print collateral using Adobe Illustrator and Photoshop. Worked with 20+ startups on their visual identity.',
      category: 'Design',
      proficiencyLevel: 'Expert',
      userId: priya.id,
    },
    {
      title: 'Video Editing & Motion Graphics',
      description: 'Short-form video editing for YouTube and Instagram Reels using Premiere Pro. Basic motion graphics and animated intros with After Effects.',
      category: 'Design',
      proficiencyLevel: 'Intermediate',
      userId: priya.id,
    },
    {
      title: 'Spanish Language Coaching (B2)',
      description: 'Conversational Spanish lessons, grammar coaching, and business writing. Helped 15+ students reach B2 level for DELE certification.',
      category: 'Language',
      proficiencyLevel: 'Advanced',
      userId: priya.id,
    },
    {
      title: 'French Language Tutoring (C1)',
      description: 'Advanced French tutoring including academic writing, literature discussion, and exam preparation for DELF/DALF.',
      category: 'Language',
      proficiencyLevel: 'Expert',
      userId: priya.id,
    },
  ];
};

async function seed() {
  console.log('──────────────────────────────────────────────');
  console.log('  SkillSwap AI Seed Script');
  console.log('──────────────────────────────────────────────\n');

  try {
    // Step 1: Create / upsert users
    console.log('📦 Step 1: Creating users...');
    const hash = await bcrypt.hash(SEED_PASSWORD, 12);
    const createdUsers = [];

    for (const u of USERS) {
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (existing) {
        console.log(`  ↳ User already exists, skipping: ${u.name}`);
        createdUsers.push(existing);
      } else {
        const user = await prisma.user.create({
          data: { ...u, password: hash, reputationPoints: Math.floor(Math.random() * 100) + 20, timeCredits: 5 },
        });
        console.log(`  ✓ Created: ${user.name} (${user.email})`);
        createdUsers.push(user);
      }
    }

    const [arjun, sneha, rahul, priya] = createdUsers;

    // Step 2: Create skills
    console.log('\n🎯 Step 2: Creating skills...');
    const skillDefinitions = buildSkills(createdUsers);
    const createdSkills = {};

    for (const sd of skillDefinitions) {
      const existing = await prisma.skill.findFirst({
        where: { title: sd.title, userId: sd.userId },
      });
      if (existing) {
        console.log(`  ↳ Skill exists, skipping: "${sd.title}"`);
        createdSkills[sd.title] = existing;
      } else {
        const skill = await prisma.skill.create({ data: sd });
        console.log(`  ✓ Created skill: "${skill.title}" (${skill.category})`);
        createdSkills[skill.title] = skill;
      }
    }

    // Step 3: Create completed trades with ratings (needed for SVD + PageRank)
    console.log('\n🤝 Step 3: Creating completed trades with reviews...');

    const tradePairs = [
      // Arjun ↔ Sneha: React for ML
      {
        requesterId: arjun.id,
        receiverId: sneha.id,
        offeredSkillId: createdSkills['React & TypeScript Development'].id,
        requestedSkillId: createdSkills['Python & Machine Learning'].id,
        rating: 5,
        comment: 'Excellent teacher! Sneha explained ML concepts very clearly.',
        reviewerId: arjun.id,
        revieweeId: sneha.id,
      },
      // Sneha ↔ Rahul: Data Analysis for SEO
      {
        requesterId: sneha.id,
        receiverId: rahul.id,
        offeredSkillId: createdSkills['Data Analysis & Visualisation'].id,
        requestedSkillId: createdSkills['Digital Marketing & SEO'].id,
        rating: 4,
        comment: 'Rahul really knows his SEO stuff. Highly recommend!',
        reviewerId: sneha.id,
        revieweeId: rahul.id,
      },
      // Rahul ↔ Priya: Content Writing for Graphic Design
      {
        requesterId: rahul.id,
        receiverId: priya.id,
        offeredSkillId: createdSkills['Content Writing & Copywriting'].id,
        requestedSkillId: createdSkills['Graphic Design & Branding'].id,
        rating: 5,
        comment: 'Priya delivered amazing branding work. Super talented!',
        reviewerId: rahul.id,
        revieweeId: priya.id,
      },
      // Arjun ↔ Priya: Node.js for UI/UX
      {
        requesterId: arjun.id,
        receiverId: sneha.id,
        offeredSkillId: createdSkills['Node.js & REST API Design'].id,
        requestedSkillId: createdSkills['UI/UX Design with Figma'].id,
        rating: 4,
        comment: 'Great Figma skills. Learned a lot about prototyping.',
        reviewerId: arjun.id,
        revieweeId: sneha.id,
      },
      // Priya ↔ Rahul: Spanish for Business Strategy
      {
        requesterId: priya.id,
        receiverId: rahul.id,
        offeredSkillId: createdSkills['Spanish Language Coaching (B2)'].id,
        requestedSkillId: createdSkills['Business Strategy & Product Management'].id,
        rating: 4,
        comment: 'Rahul gave great product strategy advice. Very insightful.',
        reviewerId: priya.id,
        revieweeId: rahul.id,
      },
      // Sneha ↔ Priya: ML for Video Editing
      {
        requesterId: sneha.id,
        receiverId: priya.id,
        offeredSkillId: createdSkills['Python & Machine Learning'].id,
        requestedSkillId: createdSkills['Video Editing & Motion Graphics'].id,
        rating: 5,
        comment: 'Priya is a fantastic video editor. My content looks professional now!',
        reviewerId: sneha.id,
        revieweeId: priya.id,
      },
    ];

    for (const tp of tradePairs) {
      // Check if this pair already has a completed trade
      const existing = await prisma.tradeRequest.findFirst({
        where: {
          requesterId: tp.requesterId,
          receiverId: tp.receiverId,
          offeredSkillId: tp.offeredSkillId,
          status: 'COMPLETED',
        },
      });

      if (existing) {
        console.log('  ↳ Trade already exists, skipping.');
        continue;
      }

      const { rating, comment, reviewerId, revieweeId, ...tradeData } = tp;

      const trade = await prisma.tradeRequest.create({
        data: { ...tradeData, status: 'COMPLETED' },
      });

      // Create review
      const reviewExists = await prisma.review.findUnique({ where: { tradeId: trade.id } });
      if (!reviewExists) {
        await prisma.review.create({
          data: { rating, comment, reviewerId, revieweeId, tradeId: trade.id },
        });
      }

      const requesterName = createdUsers.find(u => u.id === tp.requesterId)?.name;
      const receiverName  = createdUsers.find(u => u.id === tp.receiverId)?.name;
      console.log(`  ✓ Trade: ${requesterName} ↔ ${receiverName} (rating: ${rating}⭐)`);
    }

    // Step 4: Trigger AI retrain via the backend API
    console.log('\n🤖 Step 4: Triggering AI model retraining...');
    try {
      const res = await fetch('http://localhost:5000/api/ai/retrain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer dummy' },
      });
      const data = await res.json().catch(() => ({}));
      console.log('  ✓ Retrain triggered:', data.message || 'ok');
      console.log('  ⏳ Model is training in the background (takes ~2-3 seconds)...');
    } catch {
      // Try the AI service directly
      try {
        const res2 = await fetch('http://localhost:8000/retrain', { method: 'POST' });
        const d2 = await res2.json().catch(() => ({}));
        console.log('  ✓ Retrain triggered via AI service directly:', d2.message || 'ok');
      } catch {
        console.log('  ⚠ Could not reach backend/AI service. Start them and hit "Refresh AI" in the browser.');
      }
    }

    console.log('\n──────────────────────────────────────────────');
    console.log('  ✅ Seeding complete!');
    console.log('──────────────────────────────────────────────');
    console.log('\nDatabase now has:');
    const uCount = await prisma.user.count();
    const sCount = await prisma.skill.count();
    const tCount = await prisma.tradeRequest.count({ where: { status: 'COMPLETED' } });
    const rCount = await prisma.review.count();
    console.log(`  👥 ${uCount} users`);
    console.log(`  🎯 ${sCount} skills`);
    console.log(`  🤝 ${tCount} completed trades`);
    console.log(`  ⭐ ${rCount} reviews`);
    console.log('\n🌐 Open http://localhost:5173/ai-insights — AI should now show "Live"');
    console.log('\n📝 Login with any seeded account:');
    console.log('   Email: arjun@skillswap.ai  | Password: Skillswap1!');
    console.log('   Email: sneha@skillswap.ai  | Password: Skillswap1!');
    console.log('   Email: rahul@skillswap.ai  | Password: Skillswap1!');
    console.log('   Email: priya@skillswap.ai  | Password: Skillswap1!');

  } catch (err) {
    console.error('\n❌ Seeding failed:', err.message);
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seed();
