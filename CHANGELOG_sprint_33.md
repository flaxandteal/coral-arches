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

