### Types of Changes
- [ ] Model Changes
- [ ] Added Functions
- [ ] Added Concepts
- [x] Workflows Updated
- [ ] Reports Updated
- [ ] Added/Updated Dependencies
- [x] Features Added
- [x] Bug Fix

### Proposed Changes
- Add a check in the workflow furthestValidIndex to see if the step should be skipped
- Updated the Issue report workflow to add the 'ignoreComplete'
- Update the Evaluation meeting worklfow to add 'ignoreComplete'
- Updated the mapping - when a nodegroup tile is pulled it checks the cardinality to see whether to replace or append
- Created the soft delete tile when the revision is created and sets to false
- Added additional checks for a existing revisions
- Sent back error messages from the backend to allow for different messages to be displayed
- Created an open workflow page for designation
- Built 2 drop downs to separate the revisions from the HA's
- Added a default sort order to the base strategy
- Updated the dashboard.py to send the default sort order to the front end
- Frontend sets the new default sort order on initialization of the page
- Corrected the filter param that was passed that was hard coded to 1 for the page
- Update the sign off nodes - user-to-model-config

### Workflows Updated
- Issue Report
- Evaluation Meeting
- Designation workflow - new open workflow page

## Pull Requests

**Fix: 3079 3085 Evaluation Meeting and Issue Report tabs**
[738](https://github.com/flaxandteal/coral-arches/pull/738) by @StuCM

**Feat: 2889 Designation Workflow Update - Descriptions not transferring**
[744](https://github.com/flaxandteal/coral-arches/pull/744) by @StuCM

**fix: updated orm view to look for location details nodes**
[735](https://github.com/flaxandteal/coral-arches/pull/735) by @babou212

**Fix: Dashboard Pagination on Filters and Default Sort Order**
[736](https://github.com/flaxandteal/coral-arches/pull/736) by @StuCM

**Fix: Sign off config update**
[737](https://github.com/flaxandteal/coral-arches/pull/737) by @StuCM

