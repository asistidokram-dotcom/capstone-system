# System Features and Role Capacities

## 1. System Roles & Capacities

*   **ADMINISTRATOR (System IT)**
    *   Manage user accounts (Create/Deactivate).
    *   Manage infrastructure data (Programs, Sections, Rooms).
    *   View System Audit Logs (Security & Tracking).
*   **CAPSTONE COORDINATOR (Academic Admin)**
    *   Create and manage Capstone Groups.
    *   Assign Advisers to groups.
    *   Review and Approve/Reject Title Proposals.
    *   Schedule Defenses and assign Panelists.
    *   Generate and export system-wide reports.
*   **STUDENT**
    *   View group and adviser information.
    *   Submit Title Proposals (PDF upload).
    *   View defense schedules and evaluation results.
    *   Upload revised documents based on panel requirements.
*   **ADVISER**
    *   View assigned Capstone groups.
    *   Review and recommend Title Proposals.
    *   Review and approve student revision submissions.
*   **PANELIST**
    *   View assigned defense schedules.
    *   Submit defense evaluations (scores and comments).
    *   Assign revision requirements to students.

---

## 2. Core System Features

### Module 1: Capstone Group Management
*   Create, update, and archive student groups.
*   Assign students to groups (1 student = 1 group constraint).
*   Assign Advisers to groups.
*   Track group lifecycle status (Pending, Adviser Assigned, Title Approved, etc.).

### Module 2: Title Proposal & Approval
*   Student PDF document upload.
*   **Duplicate Title Detection:** Backend normalization checks for existing/similar titles.
*   Workflow status: Pending, Approved, Rejected, Needs Revision.
*   Adviser/Coordinator remarks and feedback.

### Module 3: Defense Scheduling & Conflict Detection
*   Schedule Title, Proposal, and Final Defenses.
*   **Backend Conflict Detection:** Prevents room double-booking, panelist time-overlaps, and group schedule overlaps.
*   Assign multiple panelists per defense.

### Module 4: Evaluation & Revisions
*   Panelist grading forms with configurable criteria and weights.
*   Consolidated result calculation (Pass, Conditional Pass, Fail).
*   Revision Checklist tracking (Pending, Submitted, Approved).
*   Revision document uploads by students.

### Module 5: Monitoring & Reports
*   Dynamic Dashboard (Real-time stats from PostgreSQL).
*   Adviser and Panelist workload monitoring.
*   Export reports to PDF (`jspdf`) and Excel (`xlsx`).
*   **Audit Logging:** Tracks all user actions for security.

### Technical Architecture
*   **Stack:** React (Vite) + TypeScript + Tailwind CSS (Frontend) | Node.js + Express + TypeScript (Backend).
*   **Database:** PostgreSQL + Prisma ORM.
*   **Security:** bcrypt password hashing, JWT authentication, Backend Role-Based Access Control (RBAC).
*   **Hosting:** 100% Localhost (No cloud dependencies).