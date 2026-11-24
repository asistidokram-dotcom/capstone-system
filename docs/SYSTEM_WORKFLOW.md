# System Workflow

This document outlines the lifecycle of a Capstone Project within the system.

## 1. Setup & Grouping (Admin/Coordinator)
1. The Admin creates user accounts (Students, Advisers, Panelists) and sets up Programs, Sections, and Rooms.
2. The Coordinator creates a **Capstone Group** and assigns students to it.
3. The Coordinator assigns a **Capstone Adviser** to the group.

## 2. Title Proposal (Students & Coordinator)
1. The student group logs in and submits a **Title Proposal** (Title, Abstract, and PDF Document).
2. The backend automatically checks for duplicate/similar titles.
3. The Coordinator/Adviser reviews the proposal.
4. They can Approve, Reject, or request Revisions.
5. If approved, the group status changes to `TITLE_APPROVED`.

## 3. Defense Scheduling (Coordinator)
1. The Coordinator opens the Schedules module and books a Defense.
2. They assign a Room, Date, Start Time, and End Time.
3. The backend rejects the schedule if the room or group already has a booking for that exact time.
4. The Coordinator assigns **Panelists**.
5. The backend rejects the panelist if they are already assigned to an overlapping schedule.

## 4. Defense Evaluation (Panelists)
1. After the defense, Panelists log in and submit their **Evaluation**.
2. They enter scores (based on configured Criteria) and provide comments.
3. The system calculates the Final Average and automatically determines the Result (Passed / Failed).

## 5. Revisions & Completion (Students & Adviser)
1. If revisions are required, the Panel/Coordinator adds them to the **Revision Checklist**.
2. Students upload the revised PDF documents.
3. The Adviser/Coordinator reviews and marks the revisions as `APPROVED`.
4. Once all revisions are cleared, the project is marked as **Completed**.