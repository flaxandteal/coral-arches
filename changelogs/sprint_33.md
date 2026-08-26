### Types of Changes
- [x] Model Changes
- [ ] Added Functions
- [ ] Added Concepts
- [x] Workflows Updated
- [x] Reports Updated
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
- Update State Care Workflow to disable delete
- Updated the get-selected-licence.js to call the method to fetch the licence info
- Add Activity and Consultation to the associated resources for an enforcement
- Change resource instance select summary to false
- Updated system settings to hide empty nodes in reports
- Updated the signup.htm to use a js script
- Created a static js script to validate the password before submitting
- Added CSS classes for validation
- Removed date consulted from pc summary
- added building name and townland to the address details
- In migrate tool allow many, add a check if the node value is already a list
- Fix the HA model issues in the JSON
- Fix the HA Revision issues in the JSON
- Add max-height css property for the reports
- Add loading icon to the letter generate and disable the button when loading

### Model Changes
- Enforcement
- Consultation -
-     -  Updated occupier node datatype to resource-instance-list
-     - Updated FM Warden node datatype to resource-instance-list
- Heritage Asset
- Heritage Asset Revision

### Workflows Updated
- Issue Report
- Evaluation Meeting
- Designation workflow - new open workflow page
- State Care Condition Survey

### Reports Updated
- All summary reports for instance select should be changed

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

**fix: disabled delete in ha select**
[743](https://github.com/flaxandteal/coral-arches/pull/743) by @babou212

**fix: 3122 show site name on the excavation site visit workflow**
[742](https://github.com/flaxandteal/coral-arches/pull/742) by @StuCM

**fix: added activity and consultation graphs back to resource list node**
[748](https://github.com/flaxandteal/coral-arches/pull/748) by @babou212

**Fix: 2261 Report Summary Resource Instance Select - Licence**
[749](https://github.com/flaxandteal/coral-arches/pull/749) by @StuCM

**Feat: 2065 Add colour indicators when the password criteria is met on signup**
[746](https://github.com/flaxandteal/coral-arches/pull/746) by @StuCM

**Fix: 2432 Consultation Response Summary Nodes**
[750](https://github.com/flaxandteal/coral-arches/pull/750) by @StuCM

**fix: can add multiple users to occupier and FM Warden fields**
[740](https://github.com/flaxandteal/coral-arches/pull/740) by @babou212

**fix: Migration Tool Many Select Conversion**
[752](https://github.com/flaxandteal/coral-arches/pull/752) by @StuCM

**Fix: 3046 scheduling criteria not showing**
[753](https://github.com/flaxandteal/coral-arches/pull/753) by @StuCM

**feat: add loading icon when a letter is generating**
[754](https://github.com/flaxandteal/coral-arches/pull/754) by @StuCM

