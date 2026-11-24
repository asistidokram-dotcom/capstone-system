# Entity Relationship Diagram (ERD)

## Visual Diagram
```mermaid
erDiagram
    PROGRAM ||--o{ SECTION : contains
    SECTION ||--o{ STUDENT : has
    USER ||--o| STUDENT : is_a
    USER ||--o| ADVISER : is_a
    USER ||--o| PANELIST : is_a
    ADVISER ||--o{ CAPSTONE_GROUP : advises
    CAPSTONE_GROUP ||--o{ GROUP_MEMBER : has
    STUDENT ||--o{ GROUP_MEMBER : joins
    CAPSTONE_GROUP ||--o| TITLE_PROPOSAL : submits
    TITLE_PROPOSAL ||--o{ PROPOSAL_REMARK : receives
    CAPSTONE_GROUP ||--o{ DEFENSE_SCHEDULE : attends
    DEFENSE_SCHEDULE ||--o{ DEFENSE_PANEL_MEMBER : has
    PANELIST ||--o{ DEFENSE_PANEL_MEMBER : evaluates
    DEFENSE_SCHEDULE ||--o{ EVALUATION : generates
    DEFENSE_SCHEDULE ||--o{ REVISION_CHECKLIST : requires
    USER ||--o{ AUDIT_LOG : triggers