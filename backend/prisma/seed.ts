import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Wiping old data to prevent duplicates...');
  
  await prisma.auditLog.deleteMany();
  await prisma.revisionSubmission.deleteMany();
  await prisma.revisionChecklist.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.evaluationCriteria.deleteMany(); // Added: Clear criteria
  await prisma.defensePanelMember.deleteMany();
  await prisma.defenseSchedule.deleteMany();
  await prisma.proposalRemark.deleteMany();
  await prisma.titleProposal.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.capstoneGroup.deleteMany();
  await prisma.student.deleteMany();
  await prisma.adviser.deleteMany();
  await prisma.panelist.deleteMany();
  await prisma.user.deleteMany();
  await prisma.section.deleteMany();
  await prisma.program.deleteMany();
  await prisma.room.deleteMany();

  console.log('🌱 Seeding data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Admin
  await prisma.user.create({
    data: {
      email: 'admin@lspu.edu.ph',
      passwordHash: await bcrypt.hash('admin123', 10),
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
    },
  });

  // 2. Create Coordinator
  await prisma.user.create({
    data: {
      email: 'coordinator@lspu.edu.ph',
      passwordHash: await bcrypt.hash('coordinator123', 10),
      firstName: 'Maria',
      lastName: 'Coordinator',
      role: 'COORDINATOR',
    },
  });

  // 3. Create Programs & Sections
  const csProgram = await prisma.program.create({ data: { name: 'BS Computer Science' } });
  const itProgram = await prisma.program.create({ data: { name: 'BS Information Technology' } });

  const sectionCS_A = await prisma.section.create({ data: { name: 'BSCS 3A', programId: csProgram.id } });
  const sectionCS_B = await prisma.section.create({ data: { name: 'BSCS 4A', programId: csProgram.id } });
  const sectionIT_A = await prisma.section.create({ data: { name: 'BSIT 3B', programId: itProgram.id } });
  const sectionIT_B = await prisma.section.create({ data: { name: 'BSIT 4B', programId: itProgram.id } });

  // 4. Create Rooms
  await prisma.room.createMany({
    data: [
      { name: 'Room 101', capacity: 30 },
      { name: 'Room 202', capacity: 40 },
      { name: 'Computer Lab 1', capacity: 50 },
      { name: 'AVR', capacity: 100 },
    ]
  });

  // 5. Create Advisers
  const adviserNames = [
    { first: 'Roxanne', last: 'Garbo', dept: 'Computer Studies' },
    { first: 'Jeremy', last: 'Reyes', dept: 'Information Technology' },
    { first: 'Rolan', last: 'Sotomayor', dept: 'Computer Studies' },
    { first: 'Mia', last: 'Villarica', dept: 'Information Technology' }
  ];

  const createdAdvisers = [];
  for (let i = 0; i < adviserNames.length; i++) {
    const a = await prisma.user.create({
      data: {
        email: `adviser${i + 1}@lspu.edu.ph`, 
        passwordHash, 
        firstName: adviserNames[i].first, 
        lastName: adviserNames[i].last, 
        role: 'ADVISER',
        adviser: { create: { department: adviserNames[i].dept } }
      },
      include: { adviser: true }
    });
    createdAdvisers.push(a);
  }

  // 6. Create Panelists
  const panelistNames = [
    { first: 'John', last: 'Peña' },
    { first: 'Chiel', last: 'Rivano' },
    { first: 'Mark', last: 'Bernardino' },
  ];

  for (let i = 0; i < panelistNames.length; i++) {
    await prisma.user.create({
      data: {
        email: `panelist${i + 1}@lspu.edu.ph`, passwordHash, 
        firstName: panelistNames[i].first, lastName: panelistNames[i].last, role: 'PANELIST',
        panelist: { create: { expertise: 'Software Engineering' } }
      }
    });
  }

  // 7. Create 30 Students
  const firstNames = [
    'Miguel', 'Andrea', 'Rafael', 'Patricia', 'Jasmine', 'Carlos', 'Bea', 'Daniel', 'Angel', 'Mark',
    'Sarah', 'John', 'Chloe', 'James', 'Nicole', 'Kevin', 'Michelle', 'Bryan', 'Hannah', 'Christian',
    'Erica', 'Paolo', 'Camille', 'Joshua', 'Megan', 'Gabriel', 'Tricia', 'Enzo', 'Denise', 'Marco'
  ];
  const lastNames = [
    'Bautista', 'Lim', 'Cruz', 'Garcia', 'Reyes', 'Mendoza', 'Alonzo', 'Padilla', 'Santos', 'Dela Cruz',
    'Ramos', 'Aquino', 'Villanueva', 'Castillo', 'Flores', 'Gonzales', 'Torres', 'Rivera', 'Navarro', 'Domingo',
    'Salazar', 'Fernandez', 'Gomez', 'Pascual', 'Santiago', 'Valdez', 'Castro', 'Ocampo', 'Mercado', 'Velasco'
  ];

  const createdStudents = [];
  
  for (let i = 0; i < 30; i++) {
    let sectionId = sectionCS_A.id;
    if (i >= 10 && i < 15) sectionId = sectionCS_B.id;
    if (i >= 15 && i < 25) sectionId = sectionIT_A.id;
    if (i >= 25) sectionId = sectionIT_B.id;

    const s = await prisma.user.create({
      data: {
        email: `student${i + 1}@lspu.edu.ph`, 
        passwordHash, 
        firstName: firstNames[i], 
        lastName: lastNames[i], 
        role: 'STUDENT',
        student: { 
          create: { 
            studentNumber: `2024-${1000 + i}`, 
            sectionId: sectionId 
          } 
        }
      },
      include: { student: true }
    });
    createdStudents.push(s.student!);
  }

  // 8. Create 6 Groups
  const groupNames = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'];
  
  for (let g = 0; g < 6; g++) {
    const adviserId = g < createdAdvisers.length ? createdAdvisers[g].adviser!.id : null;
    
    const groupMembers = [];
    for (let m = 0; m < 5; m++) {
      const studentIndex = (g * 5) + m;
      groupMembers.push({ studentId: createdStudents[studentIndex].id });
    }

    await prisma.capstoneGroup.create({
      data: {
        name: `Group ${groupNames[g]}`,
        status: adviserId ? 'ADVISER_ASSIGNED' : 'PENDING_ADVISER',
        adviserId: adviserId,
        members: {
          create: groupMembers
        }
      }
    });
  }

  // =========================================================================
  // 9. CREATE EVALUATION CRITERIA (NEW)
  // =========================================================================
  await prisma.evaluationCriteria.createMany({
    data: [
      { name: 'Presentation & Communication', weight: 0.30, maxScore: 100 },
      { name: 'System Functionality & Features', weight: 0.40, maxScore: 100 },
      { name: 'Documentation & Technical Quality', weight: 0.30, maxScore: 100 },
    ]
  });

  console.log('✅ Massive data seed complete!');
  console.log('------------------------------------');
  console.log('Admin: admin@lspu.edu.ph / admin123');
  console.log('Coordinator: coordinator@lspu.edu.ph / coordinator123');
  console.log('Advisers: adviser1@lspu.edu.ph / password123');
  console.log('Panelists: panelist1@lspu.edu.ph / password123');
  console.log('Students: student1@lspu.edu.ph / password123');
  console.log('------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });