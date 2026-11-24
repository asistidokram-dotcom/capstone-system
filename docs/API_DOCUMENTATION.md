
---

### File 2: `docs/API_DOCUMENTATION.md`
*Copy and paste this into the file. This is the "menu" of your backend.*

```markdown
# API Documentation

All routes are prefixed with `http://localhost:5000/api`.
Protected routes require a `Bearer <token>` in the Headers.

## 1. Authentication
*   **POST `/auth/login`** - Submits email & password. Returns a JWT token and user data.
    *   *Access:* Public

## 2. Groups (Manage Groups)
*   **GET `/groups`** - Fetch all groups (Admins see all, Students see their own).
    *   *Access:* Protected (All roles)
*   **POST `/groups`** - Create a new group.
    *   *Access:* Protected (ADMIN, COORDINATOR)
*   **PUT `/groups/:id`** - Update group details / assign adviser.
    *   *Access:* Protected (ADMIN, COORDINATOR)
*   **POST `/groups/:id/members`** - Add a student to a group.
    *   *Access:* Protected (ADMIN, COORDINATOR)

## 3. Title Proposals
*   **GET `/proposals`** - Fetch proposals (Students see only their group's).
    *   *Access:* Protected (All roles)
*   **POST `/proposals`** - Submit a new title proposal. Includes `multipart/form-data` for PDF upload.
    *   *Access:* Protected (STUDENT, ADMIN, COORDINATOR)
*   **PUT `/proposals/:id/status`** - Approve, reject, or request revisions.
    *   *Access:* Protected (ADMIN, COORDINATOR, ADVISER)

## 4. Defense Schedules
*   **GET `/schedules`** - Fetch schedules (Panelists see only their assigned ones).
    *   *Access:* Protected (All roles)
*   **POST `/schedules`** - Create a defense. *Backend enforces room, group, and time overlap checks.*
    *   *Access:* Protected (ADMIN, COORDINATOR)
*   **POST `/schedules/:id/panelists`** - Assign a panelist. *Backend enforces panelist time conflict checks.*
    *   *Access:* Protected (ADMIN, COORDINATOR)

## 5. Evaluations & Revisions
*   **POST `/evaluations/:scheduleId`** - Submit grades and comments.
    *   *Access:* Protected (PANELIST, ADMIN, COORDINATOR)
*   **GET `/evaluations/:scheduleId/results`** - Get consolidated panel scores and final average.
    *   *Access:* Protected (All roles)
*   **POST `/revisions`** - Add a revision requirement to a schedule.
    *   *Access:* Protected (PANELIST, ADMIN, COORDINATOR)

## 6. Dashboard & Audit
*   **GET `/dashboard/stats`** - Get total counts of groups, proposals, schedules, etc.
    *   *Access:* Protected (ADMIN, COORDINATOR)
*   **GET `/audit-logs`** - Fetch all system actions.
    *   *Access:* Protected (ADMIN)