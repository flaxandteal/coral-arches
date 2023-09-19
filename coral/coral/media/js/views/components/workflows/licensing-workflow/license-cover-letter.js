define([
  'knockout',
  'underscore',
  'arches',
  'views/components/workflows/summary-step',
  'templates/views/components/workflows/licensing-workflow/license-cover-letter.htm',
  'plugins/knockout-select2'
], function (ko, _, arches, SummaryStep, licenseCoverTemplate) {
  function viewModel(params) {
    const self = this;

    this.resourceData = ko.observable();
    this.relatedResources = ko.observableArray();

    

    _.extend(this, params.form);



  this.getRelatedResources = function() {
      window.fetch(arches.urls.related_resources + this.resourceid + "?paginate=false")
      .then(response => response.json())
      .then(data => this.relatedResources(data))
  };

    

    self.currentLanguage = ko.observable({ code: arches.activeLanguage });

    this.pageVm = params.pageVm;

    const createTextObject = (value) => ({
      [self.currentLanguage().code]: {
        value: value?.toString() || '',
        direction: 'ltr'
      }
    });
    console.log("self", self)
    console.log("postsum tile", self.tile)

    self.getTextValue = (textObject) => {
      if (ko.isObservable(textObject)) {
        return textObject()[self.currentLanguage().code].value;
      } else {
        return textObject;
      }
    };

    this.activityResourceData = ko.observable();
    this.licenseResourceData = ko.observable();
    this.actorTileData = ko.observable();
    this.actorReportData = ko.observable([]);
    this.reportVals = {};

    this.licenseNo = ko.observable(createTextObject('AE/23/0001'));
    this.bFileNumber = ko.observable(createTextObject('B/23/0001'));

    this.textBody = ko.observable(
      createTextObject(
        'Further to your application on [Date], please find attached an Excavation License for the above mentioned location.'
      )
    );

    /**
     * Contacts
     */
    this.contacts_loaded = ko.observable(false)
    this.applicants = ko.observable({});
    this.applicantsAddresses = ko.observable({});
    this.companies = ko.observable({})
    this.companiesAddresses = ko.observable({})
    this.applicant = ko.observable(createTextObject());
    this.company = ko.observable(createTextObject());
    this.seniorInspector = ko.observable(createTextObject());
    this.signed = ko.observable(createTextObject());
    
    this.tempApp = ko.computed({
      read: function (){
        console.log("read")
        return this.applicant()
      },
      write: function (val){
        console.log("temp temp", val)
        if (val){
          this.applicant(createTextObject(val))
        }
      }
    }, this)

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
    this.areaName = ko.observable(createTextObject());
    this.buildingName = ko.observable(createTextObject());
    this.buildingNumber = ko.observable(createTextObject());
    this.street = ko.observable(createTextObject());
    this.buildingNumberSubSt = ko.observable(createTextObject());
    this.subStreet = ko.observable(createTextObject());
    this.city = ko.observable(createTextObject());
    this.county = ko.observable(createTextObject());
    this.postCode = ko.observable(createTextObject());

    this.tempAdd = ko.computed({
      read: function (){
        console.log("read")
        return this.applicant()
      },
      write: function (val){
        console.log("temp temp", val)
        this.areaName(createTextObject(val.areaName))
        this.buildingName(createTextObject(val.buildingName))
        this.buildingNumber(createTextObject(val.buildingNumber))
        this.street(createTextObject(val.street))
        this.buildingNumberSubSt(createTextObject(val.buildingNumberSubSt))
        this.subStreet(createTextObject(val.subStreet))
        this.city(createTextObject(val.city))
        this.county(createTextObject(val.county))
        this.postCode(createTextObject(val.postCode))
      }
    }, this)
    /**
     * Dates
     */
    this.receivedDate = ko.observable('');
    this.acknowledgedDate = ko.observable('');
    this.decisionDate = ko.observable('');
    this.sendDate = ko.observable(new Date().toLocaleDateString('en-GB'));
    this.appDate = ko.observable(new Date().toLocaleDateString('en-GB'));

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
        result += `<span>Dear: ${Object.keys(this.applicants()).join(', ')}, ${this.getTextValue(self.company)}</span>`;
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

    // this.getResourceData = function() {
    window.fetch(arches.urls.api_resources(this.resourceId()) + '?format=json&compact=false')
      .then(response => response.json())
      .then(val =>  {
        console.log("val", val)
        this.activityResourceData(val.resource)
        this.areaName(createTextObject(val.resource["Associated Activities"]["@value"]))

        this.signed(createTextObject(val.resource["Decision"]["Decision Assignment"]["Decision Made By"]["@value"]))
        this.decisionDate(val.resource["Decision"]["Decision Assignment"]["Decision Time Span"]["Decision Date"]["@value"])
        this.appDate(val.resource["Status and Duration Dates"]["Received Date"]["@value"])
        this.textBody(createTextObject(this.textBody().en.value.replace('[Date]', new Date(this.appDate()).toLocaleDateString())))

        window.fetch(arches.urls.api_tiles(val.resource['Contacts']['Applicants']['Applicant']['@tile_id']) + '?format=json&compact=false')
        .then(response => response.json())
        .then(data => data.data['859cb33e-521d-11ee-b790-0242ac120002'].forEach((contact_tile) => {
          const contacts = []
            window.fetch(arches.urls.api_resources(contact_tile.resourceId) + '?format=json&compact=false')
            .then(response => response.json())
            .then(
              data => {contacts.push(data)})
            .then(x => {

              for (let contact of contacts) {
                this.contacts_loaded(false)
                if (contact.graph_id === '22477f01-1a44-11e9-b0a9-000d3ab1e588') {

                  this.applicants()[contact["resource"]["Name"][0]["Full Name"]["@value"]] = []

                  if (contact["resource"]["Location Data"]) {
                    this.applicants()[contact["resource"]["Name"][0]["Full Name"]["@value"]] = contact["resource"]["Location Data"].map((location) => {
                        return {
                          buildingName : location.Addresses['Building Name']['Building Name Value']["@value"],
                          buildingNumber : location.Addresses['Building Number']['Building Number Value']["@value"],
                          street : location.Addresses['Street']['Street Value']["@value"],
                          buildingNumberSubSt : location.Addresses['Building Number Sub-Street']['Building Number Sub-Street Value']["@value"],
                          subStreet : location.Addresses['Sub-Street ']['Sub-Street Value']["@value"],
                          city : location.Addresses['Town or City']['Town or City Value']["@value"],
                          county : location.Addresses['County']['County Value']["@value"],
                          postCode : location.Addresses['Postcode']['Postcode Value']["@value"]
                        }
                      })
                  }
                }
                else if (contact.graph_id === 'd4a88461-5463-11e9-90d9-000d3ab1e588') {

                  this.company(createTextObject(contact["resource"]["Names"][0]["Organization Name"]["@value"]))
                  this.companies()[contact["resource"]["Names"][0]["Organization Name"]["@value"]] = []

                  if (contact["resource"]["Location Data"]) {
                    this.companies()[contact["resource"]["Names"][0]["Organization Name"]["@value"]] = contact["resource"]["Location Data"].map((location) => {
                        return {
                          buildingName : location.Addresses['Building Name']['Building Name Value']["@value"],
                          buildingNumber : location.Addresses['Building Number']['Building Number Value']["@value"],
                          street : location.Addresses['Street']['Street Value']["@value"],
                          buildingNumberSubSt : location.Addresses['Building Number Sub-Street']['Building Number Sub-Street Value']["@value"],
                          subStreet : location.Addresses['Sub-Street ']['Sub-Street Value']["@value"],
                          city : location.Addresses['Town or City']['Town or City Value']["@value"],
                          county : location.Addresses['County']['County Value']["@value"],
                          postCode : location.Addresses['Postcode']['Postcode Value']["@value"]
                        }
                  })
                } 
              }
            } 
            this.contacts_loaded(true)
            })
          })
          )
    })
  // };

      

        // this.reportVals['siteAddress'] = val.resource["Location Data"]["Addresses"][0]

        // val.resource["External Cross References"].forEach(ref => {
        //   if (ref["External Cross Reference Source"]["@value"] === "Historic Environment Record Number"){
        //     // this.reportVals['bFileNumber'] = ref["External Cross Reference"]["@value"]
        //     this.bFileNumber(createTextObject(ref["External Cross Reference"]["@value"]))
        //   }
        //   if (ref["External Cross Reference Source"]["@value"] === "Excavation"){
        //     // this.reportVals['licenseNo'] = ref["External Cross Reference"]["@value"]
        //     this.licenseNo(createTextObject(ref["External Cross Reference"]["@value"]))
        //   }
        //   if (ref["External Cross Reference Source"]["@value"] === "Wreck"){
        //     // this.reportVals['wreckRef'] = ref["External Cross Reference"]["@value"]
        //     // this.reportVals['wreckDesc'] = ref["External Cross Reference Notes"]["External Cross Reference Description"]["@value"]
        //   }
        // });
      //   this.loading(false)
      // })

      // this.relatedResources.subscribe((val) => {
        // console.log("relval", val)
        // this.licenseResourceData(val.related_resources[0])
        // console.log(this.licenseResourceData())
        // this.reportVals['areaName'] = val.related_resources[0]
        // this.loading(false)

        // this.reportVals["related_license"] = val["resource_relationships"][0]["resourceinstanceidfrom"]
        // this.loading(true)
        // window.fetch(arches.urls.api_resources(val["resource_relationships"][0]["resourceinstanceidfrom"]) + '?format=json&compact=false')
        //     .then(response => response.json())
        //     .then(data => this.actorTileData(data)).then(x => {this.loading(true)})
        //     .then(x => {
        //       window.fetch(arches.urls.api_tiles(val.related_resources[0]['resource']['Contacts']['Applicants']['Applicant']['@tile_id']) + '?format=json&compact=false')
        //       .then(response => response.json())
        //       .then(data => this.actorTileData(data)).then(x => {this.loading(true)})
        //       .then(x => {
        //         this.actorTileData().data['859cb33e-521d-11ee-b790-0242ac120002'].forEach((actor) => {
        //           window.fetch(arches.urls.api_resources(actor.resourceId) + '?format=json&compact=false')
        //           .then(response => response.json())
        //           .then(
        //             data => {this.loading(true); this.actorReportData().push(data)})
        //           .then(x => {
        //             this.loading(true)
        //             this.actorReportData().forEach(actor => {
        //               if (actor.graph_id === '22477f01-1a44-11e9-b0a9-000d3ab1e588'){
        //                 // this.reportVals['applicant'] = actor["resource"]["Name"][0]["Full Name"]["@value"]
        //                 this.applicant(this.reportVals.applicant)
        //                 // if (actor["resource"]["Location Data"]) {
        //                 //   this.reportVals['applicantAddresses'] = 
        //                 //   {
        //                 //     buildingName : actor["resource"]["Location Data"][0].Addresses['Building Name']['Building Name Value']["@value"],
        //                 //     buildingNumber : actor["resource"]["Location Data"][0].Addresses['Building Number']['Building Number Value']["@value"],
        //                 //     street : actor["resource"]["Location Data"][0].Addresses['Street']['Street Value']["@value"],
        //                 //     buildingNumberSubSt : actor["resource"]["Location Data"][0].Addresses['Building Number Sub-Street']['Building Number Sub-Street Value']["@value"],
        //                 //     subStreet : actor["resource"]["Location Data"][0].Addresses['Sub-Street ']['Sub-Street Value']["@value"],
        //                 //     city : actor["resource"]["Location Data"][0].Addresses['Town or City']['Town or City Value']["@value"],
        //                 //     county : actor["resource"]["Location Data"][0].Addresses['County']['County Value']["@value"],
        //                 //     postCode : actor["resource"]["Location Data"][0].Addresses['Postcode']['Postcode Value']["@value"]
        //                 //   }
        //                 //   this.buildingName(this.reportVals['applicantAddresses']['buildingName'])
        //                 //   this.buildingNumber(this.reportVals['applicantAddresses']['buildingNumber'])
        //                 //   this.street(this.reportVals['applicantAddresses']['street'])
        //                 //   this.buildingNumberSubSt(this.reportVals['applicantAddresses']['buildingNumberSubSt'])
        //                 //   this.subStreet(this.reportVals['applicantAddresses']['subStreet'])
        //                 //   this.city(this.reportVals['applicantAddresses']['city'])
        //                 //   this.county(this.reportVals['applicantAddresses']['county'])
        //                 //   this.postCode(this.reportVals['applicantAddresses']['postCode'])
        //                 // }
        //                 // this.buildingName(this.reportVals['applicantAddresses']['buildingName'])
        //                 // this.buildingNumber(this.reportVals['applicantAddresses']['buildingNumber'])
        //                 // this.street(this.reportVals['applicantAddresses']['street'])
        //                 // this.buildingNumberSubSt(this.reportVals['applicantAddresses']['buildingNumberSubSt'])
        //                 // this.subStreet(this.reportVals['applicantAddresses']['subStreet'])
        //                 // this.city(this.reportVals['applicantAddresses']['city'])
        //                 // this.county(this.reportVals['applicantAddresses']['county'])
        //                 // this.postCode(this.reportVals['applicantAddresses']['postCode'])
        //                 // `${actor["resource"]["Location Data"][0].Addresses['Building Name']['Building Name Value']["@value"] != '' ? actor["resource"]["Location Data"][0].Addresses['Building Name']['Building Name Value']["@value"] + ', <br />' : ''}
        //                 //  ${actor["resource"]["Location Data"][0].Addresses['Building Number']['Building Number Value']["@value"]} ${actor["resource"]["Location Data"][0].Addresses['Street']['Street Value']["@value"]},
        //                 //  ${actor["resource"]["Location Data"][0].Addresses['Building Number Sub-Street']['Building Number Sub-Street Value']["@value"] != '' ? actor["resource"]["Location Data"][0].Addresses['Building Number Sub-Street']['Building Number Sub-Street Value']["@value"] + ', <br />' : ''}
        //                 //  ${actor["resource"]["Location Data"][0].Addresses['Sub-Street ']['Sub-Street Value']["@value"] != '' ? actor["resource"]["Location Data"][0].Addresses['Sub-Street ']['Sub-Street Value']["@value"] + ', <br />' : ''}
        //                 //  <br />${actor["resource"]["Location Data"][0].Addresses['Town or City']['Town or City Value']["@value"]},
        //                 //  <br />${actor["resource"]["Location Data"][0].Addresses['County']['County Value']["@value"]},
        //                 //  <br />${actor["resource"]["Location Data"][0].Addresses['Postcode']['Postcode Value']["@value"]}`
        //               }
        //               this.address(this.reportVals['applicantAddresses'])
        //             // }
        //             if (actor.graph_id === 'd4a88461-5463-11e9-90d9-000d3ab1e588'){
        //               this.company(createTextObject(actor["resource"]["Names"][0]["Organization Name"]["@value"]))
        //               // if (actor["resource"]["Location Data"]){
        //               //   this.reportVals['companyAddresses'] =
        //               //   {
        //               //     buildingName : actor["resource"]["Location Data"]?.[0].Addresses['Building Name']['Building Name Value']["@value"],
        //               //     buildingNumber : actor["resource"]["Location Data"]?.[0].Addresses['Building Number']['Building Number Value']["@value"],
        //               //     street : actor["resource"]["Location Data"]?.[0].Addresses['Street']['Street Value']["@value"],
        //               //     buildingNumberSubSt : actor["resource"]["Location Data"]?.[0].Addresses['Building Number Sub-Street']['Building Number Sub-Street Value']["@value"],
        //               //     subStreet : actor["resource"]["Location Data"]?.[0].Addresses['Sub-Street ']['Sub-Street Value']["@value"],
        //               //     city : actor["resource"]["Location Data"]?.[0].Addresses['Town or City']['Town or City Value']["@value"],
        //               //     county : actor["resource"]["Location Data"]?.[0].Addresses['County']['County Value']["@value"],
        //               //     postCode : actor["resource"]["Location Data"]?.[0].Addresses['Postcode']['Postcode Value']["@value"]
        //               //   }
        //               // }
        //             }
        //           })
        //           this.loading(false)
        //         })
        //       })

        //     })
        //           .then(x => {this.loading(false); console.log("repVals",this.reportVals)})
        //   })
  //       })
  }

  ko.components.register('license-cover-letter', {
    viewModel: viewModel,
    template: licenseCoverTemplate
  });
  return viewModel;
});
