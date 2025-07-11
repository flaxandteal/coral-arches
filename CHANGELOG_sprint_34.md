### Types of Changes
- [x] Model Changes
- [ ] Added Functions
- [ ] Added Concepts
- [x] Workflows Updated
- [ ] Reports Updated
- [ ] Added/Updated Dependencies
- [x] Features Added
- [x] Bug Fix

### Proposed Changes
- Create a custom base manager file to remove the side bar resource editor if not admin
- Removed manage from the nav bar home page
- Added Dashboard to the nav bar home page
- moved the signup.js to the media/js location
- updating signup.htm to import require.js
- Change county type in Organization model to a concept
- Add else statement to update planning name function to stop the reference number being used
- Update the Planning Response open workflow descriptions
- Updated a typo in the Licence, open workflow description
- update check against application type in the show-hierarchy-change
- make the application type card visible in the resource instance
- add escape_function context to notify_enforcement
- Update plural labels for licence
- Update curatiorial inspection workflow labels
- remove info message when check application is null
- remove organization from the application node
- Fix typo in related HA workflow description
- Update the placeholder for evaluation meeting dropdown
- Disable HA name in Issue Report
- Updated casbin to check against the user permissions as well as the Django Group permissions
- Added additional logical sets for the digital objects
- Updated the planning groups with the new logical sets 
- Updated map markers for several models

### Model Changes
- Organization
- Consultation - Made Application Type card visible
- Licence
- Consultation
- HA
- HA Revision
- Consultation
- Activity
- Ranger Inspection
- Risk Assessment

### Workflows Updated
- HM Response
- HB Response
- Licence Workflow
- Curatorial Inspection
- Related HA
- Evaluation Meeting
- Issue Report

### Features Added
- Logical sets data set has been updated to include
-     - All digital objects
-     - HM Response Digital Objects
-     - HB Response Digital Objects 
- Casbin permissions check against user permissions
- Extra function added to check for permissions against graph access 

### Bug Fix
- add null check to the check open application
- Update description in related HA
- Update the placeholder for evaluation meeting dropdown

## Pull Requests

**fix: remove resource editor button on the main page**
[773](https://github.com/flaxandteal/coral-arches/pull/773) by @StuCM

**Fix: 2065 Password Criteria static build fix**
[771](https://github.com/flaxandteal/coral-arches/pull/771) by @StuCM

**fix(Organization): change county data type to a concept**
[774](https://github.com/flaxandteal/coral-arches/pull/774) by @StuCM

**Fix: 2782 - Update Consultation Display Name**
[772](https://github.com/flaxandteal/coral-arches/pull/772) by @StuCM

**fix: fixed typo in consultation response workflow descriptions**
[756](https://github.com/flaxandteal/coral-arches/pull/756) by @babou212

**fix: fixed typo in license workflow notification banner**
[757](https://github.com/flaxandteal/coral-arches/pull/757) by @babou212

**fix: check application type data on load to set hierarchy type**
[768](https://github.com/flaxandteal/coral-arches/pull/768) by @StuCM

**fix: add escape function to notify enforcement**
[767](https://github.com/flaxandteal/coral-arches/pull/767) by @StuCM

**chore: relabled fields in excavation workflow**
[759](https://github.com/flaxandteal/coral-arches/pull/759) by @babou212

**chore: relabeled fields in curatorial workflow**
[760](https://github.com/flaxandteal/coral-arches/pull/760) by @babou212

**chore: updated field names for various many selects in various workflows**
[761](https://github.com/flaxandteal/coral-arches/pull/761) by @babou212

**fix: fixed director many select not clearing**
[762](https://github.com/flaxandteal/coral-arches/pull/762) by @babou212

**fix: removed organisation from select in consultation graph**
[763](https://github.com/flaxandteal/coral-arches/pull/763) by @babou212

**fix: fixed typo in relate ha workflow**
[764](https://github.com/flaxandteal/coral-arches/pull/764) by @babou212

**fix: added time zone details in coral settings.py**
[765](https://github.com/flaxandteal/coral-arches/pull/765) by @babou212

**fix: fix typo in eval wf select**
[770](https://github.com/flaxandteal/coral-arches/pull/770) by @babou212

**fix: disable name field in issue report wf**
[775](https://github.com/flaxandteal/coral-arches/pull/775) by @babou212

**Fix: 2818 PDF Merge Files not showing for Users**
[766](https://github.com/flaxandteal/coral-arches/pull/766) by @StuCM

**feat (Multiple Models): Change Map Marker Colours**
[776](https://github.com/flaxandteal/coral-arches/pull/776) by @StuCM

**fix: added building name and barony to eval wf location details**
[758](https://github.com/flaxandteal/coral-arches/pull/758) by @babou212

