# Capstone Project Monitoring and Defense Scheduling System

A comprehensive, full-stack web application designed to manage the complete Capstone lifecycle (from title proposal to final defense) for Laguna State Polytechnic University (LSPU) - College of Computer Studies.

## 🛠️ Tech Stack
* **Frontend:** React, TypeScript, Vite, Tailwind CSS
* **Backend:** Node.js, Express.js, TypeScript
* **Database:** PostgreSQL, Prisma ORM
* **Authentication:** JWT, bcryptjs
* **File Storage:** Multer (Local)

## 🚀 How to Run Locally
1. Clone the repository: `git clone https://github.com/asistidokram-dotcom/capstone-system.git`
2. **Backend Setup:**
   * `cd backend`
   * `npm install`
   * Create a `.env` file and add your `DATABASE_URL` and `JWT_SECRET`.
   * `npx prisma db push`
   * `npm run seed`
   * `npm run dev`
3. **Frontend Setup:**
   * Open a new terminal.
   * `cd frontend`
   * `npm install`
   * `npm run dev`
4. Open `http://localhost:5173` in your browser.

## 🔐 Default Test Accounts
* **Admin:** admin@lspu.edu.ph / admin123
* **Coordinator:** coordinator@lspu.edu.ph / coordinator123
* **Adviser:** adviser1@lspu.edu.ph / password123
* **Panelist:** panelist1@lspu.edu.ph / password123
* **Student:** student1@lspu.edu.ph / password123
