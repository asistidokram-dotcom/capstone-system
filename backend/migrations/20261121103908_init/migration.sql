-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COORDINATOR', 'STUDENT', 'ADVISER', 'PANELIST');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('PENDING_ADVISER', 'ADVISER_ASSIGNED', 'PROPOSAL_PENDING', 'TITLE_APPROVED', 'FOR_PROPOSAL_DEFENSE', 'FOR_FINAL_DEFENSE', 'WITH_REVISIONS', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION');

-- CreateEnum
CREATE TYPE "DefenseType" AS ENUM ('TITLE_DEFENSE', 'PROPOSAL_DEFENSE', 'FINAL_DEFENSE');

-- CreateEnum
CREATE TYPE "DefenseResult" AS ENUM ('PASS', 'CONDITIONAL_PASS', 'FAIL');

-- CreateEnum
CREATE TYPE "RevisionStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentNumber" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adviser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "department" TEXT NOT NULL,

    CONSTRAINT "Adviser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Panelist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expertise" TEXT NOT NULL,

    CONSTRAINT "Panelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapstoneGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "GroupStatus" NOT NULL DEFAULT 'PENDING_ADVISER',
    "adviserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CapstoneGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TitleProposal" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TitleProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalRemark" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "remarkText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalRemark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefenseSchedule" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "type" "DefenseType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "roomId" TEXT NOT NULL,

    CONSTRAINT "DefenseSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefensePanelMember" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "panelistId" TEXT NOT NULL,

    CONSTRAINT "DefensePanelMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PanelAvailability" (
    "id" TEXT NOT NULL,
    "panelistId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PanelAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationCriteria" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "EvaluationCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "panelistId" TEXT NOT NULL,
    "criteriaId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisionChecklist" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "RevisionStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "RevisionChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisionSubmission" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevisionSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentNumber_key" ON "Student"("studentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Adviser_userId_key" ON "Adviser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Panelist_userId_key" ON "Panelist"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Program_name_key" ON "Program"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_studentId_key" ON "GroupMember"("studentId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adviser" ADD CONSTRAINT "Adviser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Panelist" ADD CONSTRAINT "Panelist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapstoneGroup" ADD CONSTRAINT "CapstoneGroup_adviserId_fkey" FOREIGN KEY ("adviserId") REFERENCES "Adviser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CapstoneGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleProposal" ADD CONSTRAINT "TitleProposal_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CapstoneGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalRemark" ADD CONSTRAINT "ProposalRemark_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "TitleProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefenseSchedule" ADD CONSTRAINT "DefenseSchedule_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CapstoneGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefenseSchedule" ADD CONSTRAINT "DefenseSchedule_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefensePanelMember" ADD CONSTRAINT "DefensePanelMember_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "DefenseSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefensePanelMember" ADD CONSTRAINT "DefensePanelMember_panelistId_fkey" FOREIGN KEY ("panelistId") REFERENCES "Panelist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanelAvailability" ADD CONSTRAINT "PanelAvailability_panelistId_fkey" FOREIGN KEY ("panelistId") REFERENCES "Panelist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "DefenseSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "EvaluationCriteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionChecklist" ADD CONSTRAINT "RevisionChecklist_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "DefenseSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionSubmission" ADD CONSTRAINT "RevisionSubmission_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "RevisionChecklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
