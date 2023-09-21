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

    this.resourceData = ko.observable();
    this.relatedResources = ko.observableArray();

    this.configKeys = ko.observable({placeholder: 0})
    

    _.extend(this, params.form);

    self.currentLanguage = ko.observable({ code: arches.activeLanguage });

    self.loading = ko.observable(true);

    this.pageVm = params.pageVm;

    const createTextObject = (value) => ({
      [self.currentLanguage().code]: {
        value: value?.toString() || '',
        direction: 'ltr'
      }
    });

    self.getTextValue = (textObject) => {
      if (ko.isObservable(textObject)) {
        if (textObject()){
          if (textObject()[self.currentLanguage().code]) {
            return textObject()[self.currentLanguage().code]?.value;
          }
        }
      } else if (typeof(textObject) === "string") {
        return textObject;
      }
      if (textObject[self.currentLanguage().code]) {
        return textObject[self.currentLanguage().code]?.value
      }
      return ""
    };

    self.getSavedValue = (key) => {
      return params.form.savedData()?.coverLetterData[key];
    };

    var getNodeValues = function(tiles, nodeId) {
      var values = [];
      tiles.forEach((tile) => {
        if (tile.data[nodeId]){
          values.push(tile.data[nodeId])
        }
          });
      ;
      return values;
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
    this.contacts_loaded = ko.observable(false)
    this.applicants = ko.observable({});

    this.applicantList = ko.observable([])
    
    this.applicantAddresses = ko.observable([]);
    this.companies = ko.observable({})
    this.companyList = ko.observable([])
    
    this.applicant = ko.observable(self.getSavedValue('applicant') || createTextObject());
    this.company = ko.observable(self.getSavedValue('company') || createTextObject());
    this.companyAddresses = ko.observable([]);

    this.seniorInspector = ko.observable(
      self.getSavedValue('seniorInspector') || createTextObject()
    );
    this.signed = ko.observable(self.getSavedValue('signed') || createTextObject());
    
    this.siteAddress = ko.observable({})
    this.siteAddresses = ko.observable()
    // TODO change writable computed to subscribe events
    // this.tempApp = ko.computed({
    //   read: function (){
    //     return this.applicant()
    //   },
    //   write: function (val){
    //     if (val){
    //       this.applicant(createTextObject(val))
    //     }
    //   }
    // }, this)

    // this.tempComp = ko.computed({
    //   read: function (){
    //     return this.company()
    //   },
    //   write: function (val){
    //     if (val){
    //       this.company(createTextObject(val))
    //     }
    //   }
    // }, this)

    /**
     * self.tile().dirty
     * Needs to be subscribed to and once changed this will
     * make the 'save' option available to the user
     * currently when applicant changes it will be made
     * available
     */
    // self.applicant.subscribe(function (val) {
    //   self.dirty(val);
    // });

    /**
     * Location
     */
    this.areaName = ko.observable(self.getSavedValue('areaName') || createTextObject(""));
    this.buildingName = ko.observable(self.getSavedValue('buildingName') || createTextObject(""));
    this.buildingNumber = ko.observable(self.getSavedValue('buildingNumber') || createTextObject(""));
    this.street = ko.observable(self.getSavedValue('street') || createTextObject(""));
    this.buildingNumberSubSt = ko.observable(
      self.getSavedValue('buildingNumberSubSt') || createTextObject("")
    );
    this.subStreet = ko.observable(self.getSavedValue('subStreet') || createTextObject(""));
    this.city = ko.observable(self.getSavedValue('city') || createTextObject(""));
    this.county = ko.observable(self.getSavedValue('county') || createTextObject(""));
    this.postCode = ko.observable(self.getSavedValue('postCode') || createTextObject(""));

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
    this.addressOptions = ko.observable([
      {text: 'applicant', id: 'applicant'}, 
      {text: 'company', id: 'company'}, 
      {text: 'site', id: 'site'}, 
    ]);

    this.selectedAddress.subscribe(addressType => {
      let val = undefined
      if (addressType === 'applicant'){
        // this.applicant(this.applicant())

        if (this.applicant().en.value === "") {
          this.applicant(this.applicantList()[0].id)
        } else {
          this.applicant(this.applicant())
        }
        val = this.applicants()[this.applicant()]
      }
      if (addressType === 'company') {
        
        // this.company(this.getTextValue(this.company))
        if (this.company().en.value === "") {
          console.log(this.companyList()[0].id)
          this.company(this.companyList()[0].id)
        } else {
          this.company(this.company())
        }
        val = this.companies()[this.company()]
      }
      if (addressType === 'site'){
        val = this.siteAddress()
      }
      if (val) {
        this.tempAdd(
          { 
            buildingName: val.buildingName,
            buildingNumber: val.buildingNumber,
            street: val.street,
            buildingNumberSubSt: val.buildingNumberSubSt,
            subStreet: val.subStreet,
            city: val.city,
            county: val.county,
            postCode: val.postCode
          }
        )
      }
    })

    this.applicant.subscribe(contact => {
      if (typeof(contact) === "string"){
        this.applicant(createTextObject(contact))
      }

      if (this.applicants()[this.getTextValue(contact)]) {

        this.applicantAddresses(this.applicants()[this.getTextValue(contact)].map((add => {
          return {
            'text': `${add.buildingNumber} ${add.street}`,
            'id': add,
            'value': add

          }
        })))
      }

      
      val = this.applicantAddresses()[0].value
      console.log(val, contact)
      if (val) {
        self.dirty(val);
        this.tempAdd(
          { 
            buildingName: val.buildingName,
            buildingNumber: val.buildingNumber,
            street: val.street,
            buildingNumberSubSt: val.buildingNumberSubSt,
            subStreet: val.subStreet,
            city: val.city,
            county: val.county,
            postCode: val.postCode
          }
        )
        
      }
    })

    this.company.subscribe(contact => {
      if (typeof(contact) === "string"){
        this.company(createTextObject(contact))
      }
      this.companyAddresses(this.companies()[this.getTextValue(contact)].map((add => {
        console.log("here it is", add)
        return {
          'text': `${add.buildingNumber} ${add.street}`,
          'id': add,
          'value': add

        }
      })))
      val = this.companyAddresses()[0].value
      console.log(val, contact)
      if (val) {
        this.tempAdd(
          { 
            buildingName: val.buildingName,
            buildingNumber: val.buildingNumber,
            street: val.street,
            buildingNumberSubSt: val.buildingNumberSubSt,
            subStreet: val.subStreet,
            city: val.city,
            county: val.county,
            postCode: val.postCode
          })
      }
    })

    this.tempAdd = ko.observable({})

    this.tempAdd.subscribe(val => {
      console.log("add updating", val)
      if (val) {
        this.buildingName(createTextObject(val.buildingName))
        this.buildingNumber(createTextObject(val.buildingNumber))
        this.street(createTextObject(val.street))
        this.buildingNumberSubSt(createTextObject(val.buildingNumberSubSt))
        this.subStreet(createTextObject(val.subStreet))
        this.city(createTextObject(val.city))
        this.county(createTextObject(val.county))
        this.postCode(createTextObject(val.postCode))
      }
    })

    // this.tempAdd = ko.computed({
    //   read: function (){
    //     if (self.selectedAddress() === 'applicant'){
    //       return this.applicant()
    //     }
    //     if (self.selectedAddress() === 'company'){
    //       console.log(this.companies())
    //       console.log(this.company())
    //       console.log(this.companies()[this.company().en.value])
    //       return this.company()
    //     }
    //     if (self.selectedAddress() === 'site'){
    //       console.log(this.siteAddress)
    //       this.tempAdd(this.siteAddress)
    //     }
    //   },
    //   write: function (val){
    //     if (val) {
    //     console.log("Valval",val)
    //     this.buildingName(createTextObject(val.buildingName))
    //     this.buildingNumber(createTextObject(val.buildingNumber))
    //     this.street(createTextObject(val.street))
    //     this.buildingNumberSubSt(createTextObject(val.buildingNumberSubSt))
    //     this.subStreet(createTextObject(val.subStreet))
    //     this.city(createTextObject(val.city))
    //     this.county(createTextObject(val.county))
    //     this.postCode(createTextObject(val.postCode))
    //   }
    //   }
    // }, this)

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
      console.log("apple time!", self.applicant())

      let result =
        '<div style="display: flex; width: 100%; flex-direction: column; margin: 24px 0 16px 0">';
      if (self.getTextValue(self.applicant)) {
        console.log("apple time!", self.applicant())
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

    params.form.save = async () => {
      self.tile().data['72e0fc96-53d5-11ee-844f-0242ac130008'](createTextObject(self.letter()));
      await self.tile().save();
      params.form.savedData({
        tileData: koMapping.toJSON(self.tile().data),
        tileId: self.tile().tileid,
        resourceInstanceId: self.tile().resourceinstance_id,
        nodegroupId: self.tile().nodegroup_id,
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

    self.loadData = async () => {
      try {
        const response = await window.fetch(arches.urls.api_resources(this.resourceId()) + '?format=json&compact=false');
        const data = await response.json();

        this.areaName(createTextObject(data.resource["Associated Activities"]["@value"]));
      } catch (error)  {
        console.error('Failed loading data for cover letter: ', error);
        /**
         * TODO: Display error banner to user
         */
      }

      self.loading(false);
    };

    if (!params.form.savedData()?.['tileId']) {
      // Run fetch prefill data if there hasn't previously been a saved letter
      self.loadData();
    }

    // this.getResourceData = function() {
    window.fetch(arches.urls.api_resources(this.resourceId()) + '?format=json&compact=false')
      .then(response => response.json())
      .then(val =>  {
        this.activityResourceData(val.resource)
        this.areaName(createTextObject(val.resource["Associated Activities"]["@value"]))
        this.areaName.valueHasMutated()

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
                console.log("CONTACT", contact.graph_id)
                if (contact.graph_id === '22477f01-1a44-11e9-b0a9-000d3ab1e588') {
                  console.log("pretending this is a dude", contact.graph_id)
                  // this.applicant(createTextObject(contact["resource"]["Name"][0]["Full Name"]["@value"]))
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
                  console.log("making company")
                  
                  this.companies({[contact["resource"]["Names"][0]["Organization Name"]["@value"]] : []})
                  console.log("comp res", contact)
                  if (contact["resource"]["Location Data"]) {

                    if (typeof(contact["resource"]["Location Data"].map) === "function") {
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
                    this.company(createTextObject(contact["resource"]["Names"][0]["Organization Name"]["@value"]))
                    console.log(this.company())
                    }
                    else {
                      let location = contact["resource"]["Location Data"]
                      this.companies()[contact["resource"]["Names"][0]["Organization Name"]["@value"]] = [{
                        buildingName : location.Addresses['Building Name']['Building Name Value']["@value"],
                        buildingNumber : location.Addresses['Building Number']['Building Number Value']["@value"],
                        street : location.Addresses['Street']['Street Value']["@value"],
                        buildingNumberSubSt : location.Addresses['Building Number Sub-Street']['Building Number Sub-Street Value']["@value"],
                        subStreet : location.Addresses['Sub-Street ']['Sub-Street Value']["@value"],
                        city : location.Addresses['Town or City']['Town or City Value']["@value"],
                        county : location.Addresses['County']['County Value']["@value"],
                        postCode : location.Addresses['Postcode']['Postcode Value']["@value"]
                      }]
                    }
                } 
            }
          }
            this.applicantList(Object.keys(this.applicants()).map(x => { console.log("for the list ", x);return {text: x, id: x}}))
            this.companyList(Object.keys(this.companies()).map(x => { console.log("for the list ", x);return {text: x, id: x}}))
            this.contacts_loaded(true)
            })
          })
          )
    })
  // };

      

        
      //   this.loading(false)
      // })

      // this.getRelatedResources = function() {
        window.fetch(arches.urls.related_resources + this.resourceId() + "?paginate=false")
        .then(response => response.json())
        .then(val => {
          console.log("relval", val)
          val.related_resources.forEach(related_resource => {
            if (related_resource.graph_id === "d4a88461-5463-11e9-90d9-000d3ab1e588") {
              // company / organisation
            }
            if (related_resource.graph_id === "22477f01-1a44-11e9-b0a9-000d3ab1e588") {
              // people
            }
            if (related_resource.graph_id === "b9e0701e-5463-11e9-b5f5-000d3ab1e588") {
              // activity
              externalRefs = getNodeValues(related_resource.tiles, '589d4dc7-edf9-11eb-9856-a87eeabdefba')
              externalRefSources = getNodeValues(related_resource.tiles, '589d4dcd-edf9-11eb-8a7d-a87eeabdefba')
              externalRefNotes = getNodeValues(related_resource.tiles, '589d4dca-edf9-11eb-83ea-a87eeabdefba')
              this.siteAddress({
                buildingName : this.getTextValue(getNodeValues(related_resource.tiles, 'a541e029-f121-11eb-802c-a87eeabdefba')[0]),
                buildingNumber : this.getTextValue(getNodeValues(related_resource.tiles, 'a541b925-f121-11eb-9264-a87eeabdefba')[0]),
                street : this.getTextValue(getNodeValues(related_resource.tiles, 'a541b927-f121-11eb-8377-a87eeabdefba')[0]),
                subStreetNumber : this.getTextValue(getNodeValues(related_resource.tiles, 'a541b922-f121-11eb-9fa2-a87eeabdefba')[0]),
                subStreet : this.getTextValue(getNodeValues(related_resource.tiles, 'a541e027-f121-11eb-ba26-a87eeabdefba')[0]),
                county : this.getTextValue(getNodeValues(related_resource.tiles, 'a541e034-f121-11eb-8803-a87eeabdefba')[0]),
                postCode : this.getTextValue(getNodeValues(related_resource.tiles, 'a541e025-f121-11eb-8212-a87eeabdefba')[0]),
                city : this.getTextValue(getNodeValues(related_resource.tiles, 'a541e023-f121-11eb-b770-a87eeabdefba')[0])

              })
    
            }
            if (related_resource.graph_id === "a535a235-8481-11ea-a6b9-f875a44e0e11") {
              // digital objects
            }
    
          })
          for (const index in externalRefSources) {
            // currently using HER ref as bfile number. Need to change when we have Kanika's concepts.
            if (externalRefSources[index] === "19afd557-cc21-44b4-b1df-f32568181b2c") {
              this.bFileNumber = externalRefs[index].en.value
            }
            if (externalRefSources[index] === "9a383c95-b795-4d76-957a-39f84bcee49e") {
              this.licenseNo = externalRefs[index].en.value
            }
            if (externalRefSources[index] === "df585888-b45c-4f48-99d1-4cb3432855d5") {
              // this.reportVals.assetNames.push(externalRefs[index].en.value)
              // this.reportVals.assetNotes.push(externalRefNotes[index].en.value)
            }
            if (externalRefSources[index] === "c14def6d-4713-465f-9119-bc33f0d6e8b3") {
              // this.reportVals.wreckNames.push(externalRefs[index].en.value)
              // this.reportVals.wreckNotes.push(externalRefNotes[index].en.value)
            }
          }
            
            })
        // };
      }
      
      ko.components.register('license-cover-letter', {
        viewModel: viewModel,
        template: licenseCoverTemplate
      });
      return viewModel;
    });
    