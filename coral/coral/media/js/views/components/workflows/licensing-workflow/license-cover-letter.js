define([
  'knockout',
  'knockout-mapping',
  'underscore',
  'arches',
  'templates/views/components/workflows/licensing-workflow/license-cover-letter.htm',
  'plugins/knockout-select2'
], function (ko, koMapping, _, arches, licenseCoverTemplate) {
  function viewModel(params) {
    const self = this;

    self.currentLanguage = ko.observable({ code: arches.activeLanguage });

    _.extend(this, params.form);
    this.pageVm = params.pageVm;

    const createTextObject = (value) => ({
      [self.currentLanguage().code]: {
        value: value?.toString() || '',
        direction: 'ltr'
      }
    });

    self.getTextValue = (textObject) => {
      if (ko.isObservable(textObject)) {
        return textObject()[self.currentLanguage().code].value;
      } else {
        return textObject;
      }
    };

    self.getSavedValue = (key) => {
      return params.form.savedData()?.coverLetterData[key];
    };

    this.activityResourceData = ko.observable();
    this.licenseResourceData = ko.observable();
    this.actorTileData = ko.observable();
    this.actorReportData = ko.observable([]);
    this.reportVals = {};

    this.licenseNo = ko.observable(createTextObject('AE/23/0001'));
    this.bFileNumber = ko.observable(createTextObject('B/23/0001'));

    this.textBody = ko.observable(
      self.getSavedValue('textBody') ||
        createTextObject(
          'Further to your application on [Date], please find attached an Excavation License for the above mentioned location.'
        )
    );

    /**
     * Contacts
     */
    this.applicant = ko.observable(self.getSavedValue('applicant') || createTextObject());
    this.company = ko.observable(self.getSavedValue('company') || createTextObject());
    this.seniorInspector = ko.observable(
      self.getSavedValue('seniorInspector') || createTextObject()
    );
    this.signed = ko.observable(self.getSavedValue('signed') || createTextObject());

    /**
     * self.tile().dirty
     * Needs to be subscribed to and once changed this will
     * make the 'save' option available to the user
     * currently when applicant changes it will be made
     * available
     */
    self.applicant.subscribe(function (val) {
      self.dirty(val);
    });

    /**
     * Location
     */
    this.areaName = ko.observable(self.getSavedValue('areaName') || createTextObject());
    this.buildingName = ko.observable(self.getSavedValue('buildingName') || createTextObject());
    this.buildingNumber = ko.observable(self.getSavedValue('buildingNumber') || createTextObject());
    this.street = ko.observable(self.getSavedValue('street') || createTextObject());
    this.buildingNumberSubSt = ko.observable(
      self.getSavedValue('buildingNumberSubSt') || createTextObject()
    );
    this.subStreet = ko.observable(self.getSavedValue('subStreet') || createTextObject());
    this.city = ko.observable(self.getSavedValue('city') || createTextObject());
    this.county = ko.observable(self.getSavedValue('county') || createTextObject());
    this.postCode = ko.observable(self.getSavedValue('postCode') || createTextObject());

    /**
     * Dates
     */
    this.receivedDate = ko.observable(self.getSavedValue('receivedDate') || '');
    this.acknowledgedDate = ko.observable(self.getSavedValue('acknowledgedDate') || '');
    this.decisionDate = ko.observable(self.getSavedValue('decisionDate') || '');
    this.sendDate = ko.observable(
      self.getSavedValue('sendDate') || new Date().toLocaleDateString('en-GB')
    );
    this.appDate = ko.observable(
      self.getSavedValue('appDate') || new Date().toLocaleDateString('en-GB')
    );

    this.selectedRecipient = ko.observable();
    this.nameOptions = ko.observable(['full name', 'title and surname', 'first name']);

    this.selectedAddress = ko.observable('applicant');
    this.addressOptions = ko.observable(['applicant', 'company', 'site']);

    this.appDateOptions = ko.observable(['received', 'acknowledged']);
    this.selectedAppDate = ko.observable('received');

    this.sendDateOptions = ko.observable(['today', 'decision', 'acknowledged']);
    this.selectedSendDate = ko.observable('today');

    self.header = ko.computed(() => {
      let result = '<div>';
      if (self.getTextValue(self.buildingName)) {
        result += `<span>${self.getTextValue(self.buildingName)}</span>`;
      }
      if (self.getTextValue(self.buildingName) && self.getTextValue(self.buildingNumber)) {
        result += `<span>, </span>`;
      }
      if (self.getTextValue(self.buildingNumber)) {
        result += `<span>${self.getTextValue(self.buildingNumber)}</span>`;
      }
      if (self.getTextValue(self.buildingNumber) && self.getTextValue(self.buildingNumberSubSt)) {
        result += `<span>, </span>`;
      }
      if (self.getTextValue(self.buildingNumberSubSt)) {
        result += `<span>${self.getTextValue(self.buildingNumberSubSt)}</span>`;
      }
      result += '</div><div>';
      if (self.getTextValue(self.street)) {
        result += `<span>${self.getTextValue(self.street)}</span>`;
      }
      if (self.getTextValue(self.street) && self.getTextValue(self.subStreet)) {
        result += `<span>, </span>`;
      }
      if (self.getTextValue(self.subStreet)) {
        result += `<span>${self.getTextValue(self.subStreet)}</span>`;
      }
      result += '</div>';
      if (self.getTextValue(self.city)) {
        result += `<span>${self.getTextValue(self.city)}</span>`;
      }
      if (self.getTextValue(self.county)) {
        result += `<span>${self.getTextValue(self.county)}</span>`;
      }
      if (self.getTextValue(self.postCode)) {
        result += `<span>${self.getTextValue(self.postCode)}</span>`;
      }
      return result;
    }, self);

    self.details = ko.computed(() => {
      let result = '<div style="display: flex; width: 100%; flex-direction: column">';
      if (self.sendDate()) {
        result += `<span>Date: ${self.sendDate()}</span>`;
      }
      if (self.getTextValue(self.bFileNumber)) {
        result += `<span>Our ref: ${self.getTextValue(self.bFileNumber)}</span>`;
      }
      if (self.getTextValue(self.licenseNo)) {
        result += `<span>License No: ${self.getTextValue(self.licenseNo)}</span>`;
      }
      if (self.getTextValue(self.areaName)) {
        result += `<span>Site: ${self.getTextValue(self.areaName)}</span>`;
      }
      result += '</div>';
      return result;
    }, self);

    self.body = ko.computed(() => {
      let result =
        '<div style="display: flex; width: 100%; flex-direction: column; margin: 24px 0 16px 0">';
      if (self.getTextValue(self.applicant)) {
        result += `<span>Dear: ${self.getTextValue(self.applicant)}</span>`;
      }
      result += `<span style="margin-top: 8px">${
        self.getTextValue(self.textBody) || 'Please enter information regarding the email!'
      }</span>`;
      result += '</div>';
      return result;
    }, self);

    self.footer = ko.computed(() => {
      let result =
        '<div style="display: flex; width: 100%; flex-direction: column; margin: 24px 0 16px 0">';
      if (self.getTextValue(self.seniorInspector)) {
        result += `<span>Senior Inspector:  ${self.getTextValue(self.seniorInspector)}</span>`;
      }
      result += `<span>Signed: ${self.getTextValue(self.signed) || 'Signature required!'}</span>`;
      result += '</div>';
      return result;
    }, self);

    self.letter = ko.computed(() => {
      let result =
        '<div style="display: flex; align-items: end; width: 100%; flex-direction: column">';
      result += self.header();
      result += self.details();
      result += self.body();
      result += self.footer();
      result += '</div>';
      return result;
    }, this);

    self.letter.subscribe((value) => {
      console.log('letter ', value);
    }, this);

    params.form.save = async () => {
      self.tile().data['72e0fc96-53d5-11ee-844f-0242ac130008'](createTextObject(self.letter()));
      await self.tile().save();
      params.form.savedData({
        tileData: koMapping.toJSON(self.tile().data),
        tileId: self.tile().tileid,
        resourceInstanceId: self.tile().resourceinstance_id,
        coverLetterData: {
          licenseNo: ko.unwrap(this.licenseNo),
          bFileNumber: ko.unwrap(this.bFileNumber),

          textBody: ko.unwrap(this.textBody),

          applicant: ko.unwrap(this.applicant),
          company: ko.unwrap(this.company),
          seniorInspector: ko.unwrap(this.seniorInspector),
          signed: ko.unwrap(this.signed),

          areaName: ko.unwrap(this.areaName),
          buildingName: ko.unwrap(this.buildingName),
          buildingNumber: ko.unwrap(this.buildingNumber),
          street: ko.unwrap(this.street),
          buildingNumberSubSt: ko.unwrap(this.buildingNumberSubSt),
          subStreet: ko.unwrap(this.subStreet),
          city: ko.unwrap(this.city),
          county: ko.unwrap(this.county),
          postCode: ko.unwrap(this.postCode),

          receivedDate: ko.unwrap(this.receivedDate),
          acknowledgedDate: ko.unwrap(this.acknowledgedDate),
          decisionDate: ko.unwrap(this.decisionDate),
          sendDate: ko.unwrap(this.sendDate),
          appDate: ko.unwrap(this.appDate)
        }
      });
      params.form.complete(true);
      params.form.saving(false);
    };

    // this.sendDate = ko.computed(
    //   {
    //     read: function () {
    //       if (this.selectedSendDate() === 'today') {
    //         return new Date().toLocaleDateString();
    //       }
    //       if (this.selectedSendDate() === 'decision') {
    //         return new Date(this.decisionDate()).toLocaleDateString();
    //       }
    //       if (this.selectedSendDate() === 'acknowledged') {
    //         return new Date(this.acknowledgedDate()).toLocaleDateString();
    //       }
    //     },
    //     write: function () {}
    //   },
    //   this
    // );

    // this.appDate = ko.computed(
    //   {
    //     read: function () {
    //       if (this.selectedAppDate() === 'received') {
    //         return new Date(this.receivedDate()).toLocaleDateString();
    //       }
    //       if (this.selectedAppDate() === 'acknowledged') {
    //         return new Date(this.acknowledgedDate()).toLocaleDateString();
    //       }
    //     },
    //     write: function () {}
    //   },
    //   this
    // );

    // this.address = ko.computed({
    //   read: function () {
    //     return `${this.buildingName() != '' ? this.buildingName() + ', <br />' : ''}
    //     ${this.buildingNumber()} ${this.street()},
    //     ${this.buildingNumberSubSt() != '' ? this.buildingNumberSubSt() + ' ' : ''}
    //     ${this.subStreet() != '' ? this.subStreet() + ',' : ''}
    //     <br />${this.city()},
    //     <br />${this.county()},
    //     <br />${this.postCode()}`
    //   },
    //   write: function (){

    //   }
    //   }, this)

    //   this.addressSelector = ko.computed({

    //     read: function () {
    //       console.log("begin read", this.selectedAddress())
    //       this.selectedAddress()
    //       console.log(this.reportVals)
    //       if (this.selectedAddress() === 'applicant'){
    //         this.buildingName(this.reportVals['applicantAddresses'] ? this.reportVals['applicantAddresses']['buildingName'] : '')
    //         this.buildingNumber(this.reportVals['applicantAddresses'] ? this.reportVals['applicantAddresses']['buildingNumber'] : '')
    //         this.street(this.reportVals['applicantAddresses'] ? this.reportVals['applicantAddresses']['street'] : '')
    //         this.buildingNumberSubSt(this.reportVals['applicantAddresses'] ? this.reportVals['applicantAddresses']['buildingNumberSubSt'] : '')
    //         this.subStreet(this.reportVals['applicantAddresses'] ? this.reportVals['applicantAddresses']['subStreet'] : '')
    //         this.city(this.reportVals['applicantAddresses'] ? this.reportVals['applicantAddresses']['city'] : '')
    //         this.county(this.reportVals['applicantAddresses'] ? this.reportVals['applicantAddresses']['county'] : '')
    //         this.postCode(this.reportVals['applicantAddresses'] ? this.reportVals['applicantAddresses']['postCode'] : '')
    //       }
    //       if (this.selectedAddress() === 'company'){
    //         this.buildingName(this.reportVals['companyAddresses'] ? this.reportVals['companyAddresses']['buildingName'] : '')
    //         this.buildingNumber(this.reportVals['companyAddresses'] ? this.reportVals['companyAddresses']['buildingNumber'] : '')
    //         this.street(this.reportVals['companyAddresses'] ? this.reportVals['companyAddresses']['street'] : '')
    //         this.buildingNumberSubSt(this.reportVals['companyAddresses'] ? this.reportVals['companyAddresses']['buildingNumberSubSt'] : '')
    //         this.subStreet(this.reportVals['companyAddresses'] ? this.reportVals['companyAddresses']['subStreet'] : '')
    //         this.city(this.reportVals['companyAddresses'] ? this.reportVals['companyAddresses']['city'] : '')
    //         this.county(this.reportVals['companyAddresses'] ? this.reportVals['companyAddresses']['county'] : '')
    //         this.postCode(this.reportVals['companyAddresses'] ? this.reportVals['companyAddresses']['postCode'] : '')
    //       }
    //       if (this.selectedAddress() === 'site'){
    //         console.log(this.reportVals['siteAddress'])
    //         this.buildingName(this.reportVals['siteAddress'] ? this.reportVals['siteAddress']['Building Name']['Building Name Value']['@value'] : '')
    //         this.buildingNumber(this.reportVals['siteAddress'] ? this.reportVals['siteAddress']['Building Number']['Building Number Value']['@value'] : '')
    //         this.street(this.reportVals['siteAddress'] ? this.reportVals['siteAddress']['Street']['Street Value']['@value'] : '')
    //         this.buildingNumberSubSt(this.reportVals['siteAddress'] ? this.reportVals['siteAddress']['Building Number Sub-Street']['Building Number Sub-Street Value']['@value'] : '')
    //         this.subStreet(this.reportVals['siteAddress'] ? this.reportVals['siteAddress']['Sub-Street ']['Sub-Street Value']['@value'] : '')
    //         this.city(this.reportVals['siteAddress'] ? this.reportVals['siteAddress']['Town or City']['Town or City Value']['@value'] : '')
    //         this.county(this.reportVals['siteAddress'] ? this.reportVals['siteAddress']['County']['County Value']['@value'] : '')
    //         this.postCode(this.reportVals['siteAddress'] ? this.reportVals['siteAddress']['Postcode']['Postcode Value']['@value'] : '')
    //       }
    //     },
    //     }, this)

    //   this.address = ko.computed({
    //     read: function () {
    //       return `${this.buildingName() != '' ? this.buildingName() + ', <br />' : ''}
    //       ${this.buildingNumber()} ${this.street()},
    //       ${this.buildingNumberSubSt() != '' ? this.buildingNumberSubSt() + ' ' : ''}
    //       ${this.subStreet() != '' ? this.subStreet() + ',' : ''}
    //       <br />${this.city()},
    //       <br />${this.county()},
    //       <br />${this.postCode()}`
    //     },
    //     }, this)

    //     this.addressSelector = ko.computed({

    //       read: function () {
    //         console.log("begin read", this.selectedAddress())
    //         this.selectedAddress()
    //         console.log(this.reportVals)
    //         if (this.selectedAddress() === 'applicant'){
    //           this.buildingName(this.reportVals['applicantAddresses'] ? this.reportVals['applicantAddresses']['buildingName'] : '')
    //           this.buildingNumber(this.reportVals['applicantAddresses'] ? this.reportVals['applicantAddresses']['buildingNumber'] : '')
    //           this.street(this.reportVals['applicantAddresses'] ? this.reportVals['applicantAddresses']['street'] : '')
    //           this.buildingNumberSubSt(this.reportVals['applicantAddresses'] ? this.reportVals['applicantAddresses']['buildingNumberSubSt'] : '')
    //           this.subStreet(this.reportVals['applicantAddresses'] ? this.reportVals['applicantAddresses']['subStreet'] : '')
    //           this.city(this.reportVals['applicantAddresses'] ? this.reportVals['applicantAddresses']['city'] : '')
    //           this.county(this.reportVals['applicantAddresses'] ? this.reportVals['applicantAddresses']['county'] : '')
    //           this.postCode(this.reportVals['applicantAddresses'] ? this.reportVals['applicantAddresses']['postCode'] : '')
    //         }
    //         if (this.selectedAddress() === 'company'){
    //           this.buildingName(this.reportVals['companyAddresses'] ? this.reportVals['companyAddresses']['buildingName'] : '')
    //           this.buildingNumber(this.reportVals['companyAddresses'] ? this.reportVals['companyAddresses']['buildingNumber'] : '')
    //           this.street(this.reportVals['companyAddresses'] ? this.reportVals['companyAddresses']['street'] : '')
    //           this.buildingNumberSubSt(this.reportVals['companyAddresses'] ? this.reportVals['companyAddresses']['buildingNumberSubSt'] : '')
    //           this.subStreet(this.reportVals['companyAddresses'] ? this.reportVals['companyAddresses']['subStreet'] : '')
    //           this.city(this.reportVals['companyAddresses'] ? this.reportVals['companyAddresses']['city'] : '')
    //           this.county(this.reportVals['companyAddresses'] ? this.reportVals['companyAddresses']['county'] : '')
    //           this.postCode(this.reportVals['companyAddresses'] ? this.reportVals['companyAddresses']['postCode'] : '')
    //         }
    //         if (this.selectedAddress() === 'site'){
    //           console.log(this.reportVals['siteAddress'])
    //           this.buildingName(this.reportVals['siteAddress'] ? this.reportVals['siteAddress']['Building Name']['Building Name Value']['@value'] : '')
    //           this.buildingNumber(this.reportVals['siteAddress'] ? this.reportVals['siteAddress']['Building Number']['Building Number Value']['@value'] : '')
    //           this.street(this.reportVals['siteAddress'] ? this.reportVals['siteAddress']['Street']['Street Value']['@value'] : '')
    //           this.buildingNumberSubSt(this.reportVals['siteAddress'] ? this.reportVals['siteAddress']['Building Number Sub-Street']['Building Number Sub-Street Value']['@value'] : '')
    //           this.subStreet(this.reportVals['siteAddress'] ? this.reportVals['siteAddress']['Sub-Street ']['Sub-Street Value']['@value'] : '')
    //           this.city(this.reportVals['siteAddress'] ? this.reportVals['siteAddress']['Town or City']['Town or City Value']['@value'] : '')
    //           this.county(this.reportVals['siteAddress'] ? this.reportVals['siteAddress']['County']['County Value']['@value'] : '')
    //           this.postCode(this.reportVals['siteAddress'] ? this.reportVals['siteAddress']['Postcode']['Postcode Value']['@value'] : '')
    //         }
    //       },
    //       }, this)

    //   this.resourceData.subscribe((val) => {
    //     console.log('VAL', val)
    //     this.loading(true)
    //     this.activityResourceData(val.resource)
    //     this.reportVals['areaName'] = val.resource["Activity Names"][0]["Activity Name"]["@value"]
    //     this.areaName(this.reportVals['areaName'])
    //     this.reportVals['siteAddress'] = val.resource["Location Data"]["Addresses"][0]

    //     val.resource["External Cross References"].forEach(ref => {
    //       if (ref["External Cross Reference Source"]["@value"] === "Historic Environment Record Number"){
    //         this.reportVals['bFileNumber'] = ref["External Cross Reference"]["@value"]
    //         this.bFileNumber(this.reportVals['bFileNumber'])
    //       }
    //       if (ref["External Cross Reference Source"]["@value"] === "Excavation"){
    //         this.reportVals['licenseNo'] = ref["External Cross Reference"]["@value"]
    //         this.licenseNo(this.reportVals['licenseNo'])
    //       }
    //       if (ref["External Cross Reference Source"]["@value"] === "Wreck"){
    //         this.reportVals['wreckRef'] = ref["External Cross Reference"]["@value"]
    //         this.reportVals['wreckDesc'] = ref["External Cross Reference Notes"]["External Cross Reference Description"]["@value"]
    //       }
    //     });
    //     this.loading(false)
    //   })

    //   this.relatedResources.subscribe((val) => {
    //     console.log('RELVAL', val)
    //     console.log('1')
    //     this.licenseResourceData(val.related_resources[0])
    //     console.log(this.licenseResourceData())
    //     this.reportVals['areaName'] = val.related_resources[0]
    //     this.loading(false)

    //     this.reportVals["related_license"] = val["resource_relationships"][0]["resourceinstanceidfrom"]
    //     this.loading(true)
    //     console.log("no fetch")
    //     window.fetch(this.urls.api_resources(this.reportVals["related_license"]) + '?format=json&compact=false')
    //         .then(response => response.json())
    //         .then(data => this.actorTileData(data)).then(x => {this.loading(true)})
    //         .then(x => {
    //           window.fetch(this.urls.api_tiles(this.licenseResourceData()['resource']['Contacts']['Applicants']['Applicant']['@tile_id']) + '?format=json&compact=false')
    //           .then(response => response.json())
    //           .then(data => this.actorTileData(data)).then(x => {this.loading(true)})
    //           .then(x => {
    //             console.log(this.actorTileData().data)
    //             console.log(JSON.stringify(this.actorTileData().data))

    //             this.actorTileData().data['859cb33e-521d-11ee-b790-0242ac120002'].forEach((actor) => {
    //               window.fetch(this.urls.api_resources(actor.resourceId) + '?format=json&compact=false')
    //               .then(response => response.json())
    //               .then(
    //                 data => {this.loading(true); this.actorReportData().push(data)})
    //               .then(x => {
    //                 this.loading(true)
    //                 this.actorReportData().forEach(actor => {
    //                   console.log("actor", actor)
    //                   console.log("act graph",actor.graph_id)
    //                   if (actor.graph_id === '22477f01-1a44-11e9-b0a9-000d3ab1e588'){
    //                     console.log(actor["resource"]["Location Data"])
    //                     this.reportVals['applicant'] = actor["resource"]["Name"][0]["Full Name"]["@value"]
    //                     this.applicant(this.reportVals.applicant)
    //                     if (actor["resource"]["Location Data"]) {
    //                       this.reportVals['applicantAddresses'] =
    //                       {
    //                         buildingName : actor["resource"]["Location Data"][0].Addresses['Building Name']['Building Name Value']["@value"],
    //                         buildingNumber : actor["resource"]["Location Data"][0].Addresses['Building Number']['Building Number Value']["@value"],
    //                         street : actor["resource"]["Location Data"][0].Addresses['Street']['Street Value']["@value"],
    //                         buildingNumberSubSt : actor["resource"]["Location Data"][0].Addresses['Building Number Sub-Street']['Building Number Sub-Street Value']["@value"],
    //                         subStreet : actor["resource"]["Location Data"][0].Addresses['Sub-Street ']['Sub-Street Value']["@value"],
    //                         city : actor["resource"]["Location Data"][0].Addresses['Town or City']['Town or City Value']["@value"],
    //                         county : actor["resource"]["Location Data"][0].Addresses['County']['County Value']["@value"],
    //                         postCode : actor["resource"]["Location Data"][0].Addresses['Postcode']['Postcode Value']["@value"]
    //                       }
    //                       this.buildingName(this.reportVals['applicantAddresses']['buildingName'])
    //                       this.buildingNumber(this.reportVals['applicantAddresses']['buildingNumber'])
    //                       this.street(this.reportVals['applicantAddresses']['street'])
    //                       this.buildingNumberSubSt(this.reportVals['applicantAddresses']['buildingNumberSubSt'])
    //                       this.subStreet(this.reportVals['applicantAddresses']['subStreet'])
    //                       this.city(this.reportVals['applicantAddresses']['city'])
    //                       this.county(this.reportVals['applicantAddresses']['county'])
    //                       this.postCode(this.reportVals['applicantAddresses']['postCode'])
    //                     }
    //                     this.buildingName(this.reportVals['applicantAddresses']['buildingName'])
    //                     this.buildingNumber(this.reportVals['applicantAddresses']['buildingNumber'])
    //                     this.street(this.reportVals['applicantAddresses']['street'])
    //                     this.buildingNumberSubSt(this.reportVals['applicantAddresses']['buildingNumberSubSt'])
    //                     this.subStreet(this.reportVals['applicantAddresses']['subStreet'])
    //                     this.city(this.reportVals['applicantAddresses']['city'])
    //                     this.county(this.reportVals['applicantAddresses']['county'])
    //                     this.postCode(this.reportVals['applicantAddresses']['postCode'])
    //                     // `${actor["resource"]["Location Data"][0].Addresses['Building Name']['Building Name Value']["@value"] != '' ? actor["resource"]["Location Data"][0].Addresses['Building Name']['Building Name Value']["@value"] + ', <br />' : ''}
    //                     //  ${actor["resource"]["Location Data"][0].Addresses['Building Number']['Building Number Value']["@value"]} ${actor["resource"]["Location Data"][0].Addresses['Street']['Street Value']["@value"]},
    //                     //  ${actor["resource"]["Location Data"][0].Addresses['Building Number Sub-Street']['Building Number Sub-Street Value']["@value"] != '' ? actor["resource"]["Location Data"][0].Addresses['Building Number Sub-Street']['Building Number Sub-Street Value']["@value"] + ', <br />' : ''}
    //                     //  ${actor["resource"]["Location Data"][0].Addresses['Sub-Street ']['Sub-Street Value']["@value"] != '' ? actor["resource"]["Location Data"][0].Addresses['Sub-Street ']['Sub-Street Value']["@value"] + ', <br />' : ''}
    //                     //  <br />${actor["resource"]["Location Data"][0].Addresses['Town or City']['Town or City Value']["@value"]},
    //                     //  <br />${actor["resource"]["Location Data"][0].Addresses['County']['County Value']["@value"]},
    //                     //  <br />${actor["resource"]["Location Data"][0].Addresses['Postcode']['Postcode Value']["@value"]}`
    //                   }
    //                   this.address(this.reportVals['applicantAddresses'])
    //                 }
    //                 if (actor.graph_id === 'd4a88461-5463-11e9-90d9-000d3ab1e588'){
    //                   console.log(actor["resource"]["Location Data"])
    //                   this.reportVals['company'] = actor["resource"]["Names"][0]["Organization Name"]["@value"]
    //                   this.company(this.reportVals['company'])
    //                   if (actor["resource"]["Location Data"]){
    //                     this.reportVals['companyAddresses'] =
    //                     {
    //                       buildingName : actor["resource"]["Location Data"]?.[0].Addresses['Building Name']['Building Name Value']["@value"],
    //                       buildingNumber : actor["resource"]["Location Data"]?.[0].Addresses['Building Number']['Building Number Value']["@value"],
    //                       street : actor["resource"]["Location Data"]?.[0].Addresses['Street']['Street Value']["@value"],
    //                       buildingNumberSubSt : actor["resource"]["Location Data"]?.[0].Addresses['Building Number Sub-Street']['Building Number Sub-Street Value']["@value"],
    //                       subStreet : actor["resource"]["Location Data"]?.[0].Addresses['Sub-Street ']['Sub-Street Value']["@value"],
    //                       city : actor["resource"]["Location Data"]?.[0].Addresses['Town or City']['Town or City Value']["@value"],
    //                       county : actor["resource"]["Location Data"]?.[0].Addresses['County']['County Value']["@value"],
    //                       postCode : actor["resource"]["Location Data"]?.[0].Addresses['Postcode']['Postcode Value']["@value"]
    //                     }
    //                   }
    //                 }
    //               })
    //               this.loading(false)
    //             })
    //           })

    //         })
    //               .then(x => {this.loading(false); console.log("repVals",this.reportVals)})
    //       })
    // })
  }

  ko.components.register('license-cover-letter', {
    viewModel: viewModel,
    template: licenseCoverTemplate
  });
  return viewModel;
});
