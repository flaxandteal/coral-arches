## Types of Changes

- [x] Model Changes
- [ ] Added Functions
- [ ] Added Concepts
- [x] Workflows Updated
- [ ] Reports Updated
- [ ] Added/Updated Dependencies
- [x] Features Added
- [x] Bug Fix

---

## Details
- **Fix: Update Cookie Parameters (#662)**
  - Secure=True: Ensures HTTPS only.
  - HttpOnly=True: Prevents JavaScript access.
  - SameSite='Strict': Optional CSRF protection.

- **Add X Frame Option and Security Content Nosniff (#661)**
  - Update `settings.py` to add security headers:
    - `X_FRAME_OPTIONS` for clickjacking protection.
    - `SECURE_CONTENT_TYPE_NOSNIFF` to prevent MIME-based attacks.

- **Add Completed By Field (#655)**
  - Added 'Completed by' field to the State Care Condition Survey.
  - Restricted to users in the group "StateCareCurE" to populate with their name.

- **Fix: Migration Tool - Concept Conversion and Group Hydration (#656)**
  - Concept-to-concept conversion now handles lists.
  - Rehydrate members function updated to capture all group members.
  - Adjustments made for global mapping in `handle_concept_change`.

- **Fix: Notify Planning Function (#659)**
  - Changed from `save` to `post_save` to fix user assignment errors.

- **Fix: Dashboard Updates (#660)**
  - Resolved duplicate group names in filter dropdown.
  - Fixed task card overflow with CSS updates.

- **Feat: SMC to Consultation (#663)**
  - SMC Workflow migrated to use Consultation.
  - Added system reference number generation for consultations.

- **Feat: Refactor Designation Dashboard (#675)**
  - Updated ORM query logic for improved performance.

- **Feat: Refactor Excavation Dashboard (#676)**
  - Excavation Dashboard updated to utilize new Arches ORM query logic.

- **Feat: Refactor Planning Dashboard (#677)**
  - Refactored Planning Dashboard with updated query logic.

- **Feat: Domain Values (#678)**
  - Added support for managing domain values to achieve better configurability.

- **Fix: Issue Pagination (#683)**
  - Resolved pagination issues in sprint 30.

- **Fix: Docker Module Dependency (#690)**
  - Removed `--no-binary` from Docker module dependency installation.

- **Feat: API File Endpoint (#671)**
  - Added a new endpoint to serve API files.

- **Hotfix: Agri Number Generator (#680)**
  - Fixed issues with the Agri number generator logic.

- **Feat: Ranger Inspection Workflow (#685)**
  - Added Ranger Inspection workflow along with a new resource model, group, and logset.

- **Fix: Workaround for Restricted IDs (#686)**
  - Implemented a workaround for restricted IDs issue.

- **Fix: Add Blob Directive to CSP (#689)**
  - Resolved CSP issues by adding blob directive for fonts.

- **Feat: PDF Merger (#642)**
  - Added functionality for merging PDFs.

- **Feat: Risk Assessment Workflow (#691)**
  - Created Risk Assessment workflow and added a new model.

- **Feat: State Care Dashboard (#687)**
  - Added State Care Dashboard with improved functionality.

---

### Model Changes
- Added 'Completed by' field to the State Care Condition Survey.
- Consultation model updated with nodes for SMC Workflow.
- Added models for:
  - Ranger Inspection Report.
  - Risk Assessment.

---

### Workflows Updated
- State Care Condition Survey workflow updated to include 'Completed by' field.
- SMC Workflow restructured to accommodate Consultation model.
- Added workflows for:
  - Ranger Inspections.
  - Risk Assessments.

---

### Bug Fixes
- Cookie parameters updated for security compliance.
- Migration Tool adjusted for concept handling and group hydration.
- Notify Planning function now uses `post_save` to prevent assignment errors.
- Dashboard filter names no longer duplicate, and task card overflow resolved.
- Fixed pagination issues in sprint 30.
- CSP issues resolved for fonts by adding blob directive.
- Workaround implemented for restricted IDs issue.

---

### Features Added
- Security headers in `settings.py` to improve application safety.
- Refactored dashboards: Designation, Excavation, Planning, and State Care.
- Added API File endpoint.
- Added functionality for merging PDFs.
- Added workflows for Ranger Inspections and Risk Assessments.

---

## PRs Included in this Release

| PR Title | PR # | Branch | Committed By |
|----------|------|--------|--------------|
| fix: #3096 update cookie params in settings.py | #662 | fix/#3096-update-cookie-params | @babou212 |
| Feat: Add X Frame Option and Security Content nosniff | #661 | feat/security-headers | @StuCM |
| #3055: Add completed by field to SCC workflow  | #655 | feat/#3055-Add-Completed-by | @babou212 |
| Fix: Migration Tool - Concept conversion and Group hydration | #656 | fix/migration-tool-members-and-concepts | @StuCM |
| Fix: Change Notify Planning function save to post save | #659 | fix/bug-notify-planning | @StuCM |
| Fix: Dashboards - Filter name duplication and task card overflow  | #660 | fix/dashboard-issues | @StuCM |
| Feat/3058 smc to consultation | #663 | feat/3058-smc-to-consultation | @StuCM |
| Feat/128 refactor designation dashboard | #675 | feat/128-refactor-designation-dashboardD | @StuCM |
| Feat/129 refactor excavaton dashboard | #676 | feat/129_refactor-excavaton-dashboard | @StuCM |
| Feat/130 refactor planning dashboard | #677 | feat/130_refactor-planning-dashboard | @StuCM |
| Feat/132 domain values | #678 | feat/132_domain-values | @StuCM |
| Fix/issue pagination sprint 30 | #683 | fix/issue-pagination-sprint_30 | @aidan-galvia |
| remove no binary from the docker module dependency install | #690 | fix/update-docker-submodule | @StuCM |
| feat: api_file endpoint | #671 | feat/api-blob-endpoint | @OwenGalvia |
| Hotfix/agri number generator | #680 | hotfix/agri-number-generator | @StuCM |
| feat: added Ranger inspection, graph, and workflow | #685 | feat/2830/Ranger-Inspection-workflow | @OwenGalvia |
| fix: Workaround for Restricted IDs (from release 30 branch) | #686 | fix/workaround-for-restricted-ids-es-from-release | @OwenGalvia |
| fix: add blob directive to font csp | #689 | fix/fix-csp-blocking-font-blob | @babou212 |
| Feature/#2818 pdf merger | #642 | feature/#2818-pdf-merger | @StuCM |
| Feature/risk assessment workflow | #691 | feature/risk-assessment-workflow | @StuCM |
| Feat/2821 State Care Dashboard | #687 | feat/2821-state-care-dashboard | @StuCM |
### Types of Changes

- [ ] - [ ] Model Changes
- [ ] - [ ] Added Functions
- [ ] - [ ] Added Concepts
- [ ] - [ ] Workflows Updated
- [ ] - [ ] Reports Updated
- [ ] - [ ] Added/Updated Dependencies
- [ ] - [ ] Features Added
- [x] - [x] Bug Fix
- [ ] ---


### PRs Included in this Release

| PR Title | PR # | Branch | Committed By |
|----------|------|--------|--------------|
| Fix: SMC Init Workflow Slug | #694 | fix/smc-init-slug | @StuCM |
- [x] - [x] Model Changes
- [ ] - [ ] Added Functions
- [ ] - [ ] Added Concepts
- [x] - [x] Workflows Updated
- [ ] - [ ] Reports Updated
- [ ] - [ ] Added/Updated Dependencies
- [ ] - [ ] Features Added
- [ ] - [ ] Bug Fix

| Fix/ SMC Workflow Updates | #695 | fix/smc-workflow-updates | @StuCM |
- [ ] - [ ] Model Changes
- [ ] - [ ] Added Functions
- [ ] - [ ] Added Concepts
- [ ] - [ ] Workflows Updated
- [ ] - [ ] Reports Updated
- [ ] - [ ] Added/Updated Dependencies
- [x] - [x] Features Added
- [ ] - [ ] Bug Fix

| feat: Update Logsets | #696 | feat/add-all-risk-logset | @StuCM |
- [ ] - [ ] Model Changes
- [ ] - [ ] Added Functions
- [ ] - [ ] Added Concepts
- [ ] - [ ] Workflows Updated
- [ ] - [ ] Reports Updated
- [ ] - [ ] Added/Updated Dependencies
- [ ] - [ ] Features Added
- [ ] - [ ] Bug Fix

| fix merging match members back into groups | #697 | fix/hydrate-groups | @StuCM |
- [x] - [x] Model Changes
- [ ] - [ ] Added Functions
- [ ] - [ ] Added Concepts
- [x] - [x] Workflows Updated
- [ ] - [ ] Reports Updated
- [ ] - [ ] Added/Updated Dependencies
- [ ] - [ ] Features Added
- [ ] - [ ] Bug Fix

| Fix: Risk Assessment Updates | #698 | fix/risk-assessment-updates | @StuCM |
