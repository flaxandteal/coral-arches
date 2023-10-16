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

    this.configKeys = ko.observable({ placeholder: 0 });

    _.extend(this, params.form);

    self.currentLanguage = ko.observable({ code: arches.activeLanguage });

    self.loading = ko.observable(false);
    self.pageVm = params.pageVm;
    self.dirty(true);

    const createTextObject = (value) => ({
      [self.currentLanguage().code]: {
        value: value?.toString() || '',
        direction: 'ltr'
      }
    });

    self.getTextValue = (textObject) => {
      if (ko.isObservable(textObject)) {
        return textObject()?.[self.currentLanguage().code]?.value || '';
      } else {
        return textObject?.[self.currentLanguage().code]?.value || '';
      }
    };

    self.getSavedValue = (key) => {
      return params.form.savedData()?.coverLetterData[key];
    };

    var getNodeValues = function (tiles, nodeId) {
      var values = [];
      tiles.forEach((tile) => {
        if (tile.data[nodeId]) {
          values.push(tile.data[nodeId]);
        }
      });
      return values;
    };

    self.createAddressObject = ({
      fullAddress,
      buildingNumberSubSt,
      city,
      postcode,
      subStreet,
      buildingName,
      buildingNumber,
      streetName,
      locality,
      county
    } = {}) => ({
      fullAddress: ko.observable(fullAddress || createTextObject()),
      buildingNumberSubSt: ko.observable(buildingNumberSubSt || createTextObject()),
      city: ko.observable(city || createTextObject()),
      postcode: ko.observable(postcode || createTextObject()),
      subStreet: ko.observable(subStreet || createTextObject()),
      buildingName: ko.observable(buildingName || createTextObject()),
      buildingNumber: ko.observable(buildingNumber || createTextObject()),
      streetName: ko.observable(streetName || createTextObject()),
      locality: ko.observable(locality || createTextObject()),
      county: ko.observable(county || createTextObject())
    });

    self.loadCoverLetterData = () => {
      let data = params.form.savedData()?.coverLetterData;
      return {
        recipientName: ko.observable(data?.recipientName || createTextObject()),
        companyName: ko.observable(data?.companyName || createTextObject()),
        siteName: ko.observable(data?.siteName || createTextObject()),
        seniorInspectorName: ko.observable(data?.seniorInspectorName || createTextObject()),
        signedName: ko.observable(data?.signedName || createTextObject()),
        hasAdditonalFiles: ko.observable(data?.hasAdditonalFiles || false),
        licenseNumber: ko.observable(data?.licenseNumber || ''),
        cmReference: ko.observable(data?.cmReference || ''),
        selectedAddress: ko.observable(data?.selectedAddress || 'applicant'),
        decisionBy: {
          name: ko.observable(data?.decisionBy?.name || createTextObject()),
          date: ko.observable(data?.decisionBy?.date || '')
        },
        dates: {
          acknowledged: ko.observable(data?.dates?.acknowledged || ''),
          received: ko.observable(data?.dates?.received || ''),
          sendDate: ko.observable(data?.dates?.received || new Date().toLocaleDateString()),
        },
        addresses: {
          applicant: self.createAddressObject(data?.addresses?.applicant),
          company: self.createAddressObject(data?.addresses?.company),
          site: self.createAddressObject(data?.addresses?.site)
        }
      };
    };

    self.coverLetterData = self.loadCoverLetterData();

    this.activityResourceData = ko.observable();
    this.licenseResourceData = ko.observable();
    this.actorTileData = ko.observable();
    this.actorReportData = ko.observable([]);
    this.reportVals = {};

    this.licenseNo = ko.observable(createTextObject(''));
    this.bFileNumber = ko.observable(createTextObject(''));

    /**
     * Contacts
     */
    this.contacts_loaded = ko.observable(false);
    this.applicants = ko.observable({});

    this.applicantList = ko.observable([]);

    this.applicantAddresses = ko.observable([]);
    this.companies = ko.observable({});
    this.companyList = ko.observable([]);

    this.applicant = ko.observable(self.getSavedValue('applicant') || createTextObject());
    this.company = ko.observable(self.getSavedValue('company') || createTextObject());
    this.companyAddresses = ko.observable([]);

    // this.selectedRecipient = ko.observable();
    // this.nameOptions = ko.observable(['full name', 'title and surname', 'first name']);

    this.coverLetterData.selectedAddress.subscribe((selected) => {
      if (!selected) this.coverLetterData.selectedAddress('applicant');
    }, this);
    this.addressOptions = ko.observable([
      { text: 'Applicant', id: 'applicant' },
      { text: 'Company', id: 'company' },
      { text: 'Site', id: 'site' }
    ]);

    // this.selectedAddress.subscribe((addressType) => {
    //   console.log('addressType: ', addressType);
    //   let val = undefined;
    //   if (addressType === 'Applicant' && this.applicant()) {
    //     if (this.applicant().en.value === '') {
    //       this.applicant(this.applicantList()[0]?.id);
    //     } else {
    //       this.applicant(this.applicant());
    //     }
    //     val = this.applicants()[this.applicant()];
    //   }
    //   if (addressType === 'Company' && this.company()) {
    //     if (this.company().en.value === '') {
    //       this.company(this.companyList()[0]?.id);
    //     } else {
    //       this.company(this.company());
    //     }
    //     val = this.companies()[this.company()];
    //   }
    //   if (addressType === 'Site') {
    //     val = this.siteAddress();
    //   }
    //   if (val) {
    //     this.tempAddText(
    //       `{
    //         ${val.buildingName ? '"buildingName": "' + val.buildingName + '",' : ''}
    //         ${val.buildingNumber ? '"buildingNumber": "' + val.buildingNumber + '",' : ''}
    //         ${val.street ? '"street": "' + val.street + '",' : ''}
    //         ${
    //           val.buildingNumberSubSt
    //             ? '"buildingNumberSubSt": "' + val.buildingNumberSubSt + '",'
    //             : ''
    //         }
    //         ${val.subStreet ? '"subStreet": "' + val.subStreet + '",' : ''}
    //         ${val.city ? '"city": "' + val.city + '",' : ''}
    //         ${val.county ? '"county": "' + val.county + '",' : ''}
    //         ${val.postCode ? '"postCode": "' + val.postCode + '"' : ''}
    //       }`
    //     );
    //   }
    //   this.loading(true);
    //   this.loading(false);
    // });
    this.header = ko.observable(
      self.getSavedValue('headerBody') ||
      '<img width="30%" src="https://www.jobapplyni.com/image/logo-DfC-stacked.png" />'
    )

    this.textBody = ko.observable(
      self.getSavedValue('textBody') ||
        createTextObject(
          `<div>Further to your application on [Date], please find attached an Excavation License for the above mentioned location.</div>
          <br />
          <div>Please note that under the terms of the Licence you must, on completion of the excavation, furnish:</div>
          <br />
          [conditions]
          <br /><br />
          <div><em>The Historic Environment Division operates an environmental management system to the requirements of ISO 14001 and would remind all parties of the need to comply with relevant environmental legislation. Legislation covers, but is not limited to, waste management issues, water pollution, air pollution and appropriate storage of materials.</em></div>

          <div>The division has published an environmental good practice guide for archaeological excavations which may be found at:</div>
          <br />
          <a style="color: blue" href="url">https://www.communities-ni.gov.uk/publications/environmental-good-practice-guide-archaeological-excavations</a>
          `
        )
    );
    this.textPreview = ko.computed(
      {
        read: function () {
          return createTextObject(
            this.textBody().en.value.replace(
              '[Date]',
              self.coverLetterData.dates.acknowledged() || '[Date]'
            )
            
          );
        }
      },
      this
    );
    

    // this.applicant.subscribe((contact) => {
    //   if (typeof contact === 'string') {
    //     this.applicant(contact);
    //   }

    //   if (contact) {
    //     if (this.applicants()[this.getTextValue(contact)]) {
    //       this.applicantAddresses(
    //         this.applicants()[this.getTextValue(contact)].map((add) => {
    //           return {
    //             text: `${add.buildingNumber} ${add.street}`,
    //             id: JSON.stringify(add),
    //             value: add
    //           };
    //         })
    //       );
    //       this.loading(true);
    //       this.loading(false);
    //     }
    //   }

    // val = this.applicantAddresses()[0].value
    // if (this.applicantAddresses()[0]) {
    //   self.dirty(true);
    //   this.tempAddText(this.applicantAddresses()[0].id);
    // }
    // this.tempAddText(
    //   `{
    //     ${val.buildingName ? '"buildingName": "' + val.buildingName + '",' : ''}
    //     ${val.buildingNumber ? '"buildingNumber": "' + val.buildingNumber + '",' : ''}
    //     ${val.street ? '"street": "' + val.street + '",' : ''}
    //     ${val.buildingNumberSubSt ? '"buildingNumberSubSt": "' + val.buildingNumberSubSt + '",' : ''}
    //     ${val.subStreet ? '"subStreet": "' + val.subStreet + '",' : ''}
    //     ${val.city ? '"city": "' + val.city + '",' : ''}
    //     ${val.county ? '"county": "' + val.county + '",' : ''}
    //     ${val.postCode ? '"postCode": "' + val.postCode + '"': ''}
    //   }`
    // )
    // });
    // this.applicantText = ko.observable('');
    // this.applicantText.subscribe((text) => {
    //   this.applicant(createTextObject(text));
    // });

    // this.company.subscribe((contact) => {
    //   if (typeof contact === 'string') {
    //     this.company(createTextObject(contact));
    //   }
    //   if (contact) {
    //     if (this.companies()[this.getTextValue(contact)]) {
    //       this.companyAddresses(
    //         this.companies()[this.getTextValue(contact)].map((add) => {
    //           return {
    //             text: `${add.buildingNumber} ${add.street}`,
    //             id: JSON.stringify(add),
    //             value: add
    //           };
    //         })
    //       );
    //     }
    //   }

    //   if (this.companyAddresses()[0]) {
    //     this.tempAddText(this.companyAddresses()[0].id);
    //   }
    //   this.loading(true);
    //   this.loading(false);
    // });
    // this.companyText = ko.observable('');
    // this.companyText.subscribe((text) => {
    //   this.company(createTextObject(text));
    // });

    // this.tempAdd = ko.observable({});
    // this.tempAddText = ko.observable('{}');
    // this.tempAddText.subscribe((text) => {
    //   this.tempAdd(JSON.parse(text));
    // });

    // this.tempAdd.subscribe((val) => {
    //   if (val) {
    //     this.buildingName(createTextObject(val.buildingName));
    //     this.buildingNumber(createTextObject(val.buildingNumber));
    //     this.street(createTextObject(val.street));
    //     this.buildingNumberSubSt(createTextObject(val.buildingNumberSubSt));
    //     this.subStreet(createTextObject(val.subStreet));
    //     this.city(createTextObject(val.city));
    //     this.county(createTextObject(val.county));
    //     this.postCode(createTextObject(val.postCode));
    //   }
    // });

    this.appDateOptions = ko.observable(['received', 'acknowledged']);
    this.selectedAppDate = ko.observable('received');

    this.sendDateOptions = ko.observable(['today', 'decision', 'acknowledged']);
    this.selectedSendDate = ko.observable('today');

    self.fromAddress = ko.observable(
      self.getSavedValue('fromAddress') ||
      `<div style="width: 40%; border: 1px solid; text-align: left">
      <div><span>Historic Environment Division</span></div>
      <div><span>Ground Floor</span></div>
      <div><span>NINE Lanyon Place</span></div>
      <div><span>Town Parks</span></div>
      <div><span>Belfast</span></div>
      <div><span>BT1 3LP</span></div>
      <div><span>Email: ExcavationsandReports@communities-ni.gov.uk</span></div>
      <br />
      <div><span>Our Ref: ${self.getTextValue(self.coverLetterData.cmReference) ? self.getTextValue(self.coverLetterData.cmReference) : '[cmref]'}</span></div>
      <br />
      <div><span>Date: [send_date]</div></span>
      </div>`
    )
    if (self.getTextValue(self.coverLetterData.licenseNumber)) {
      result += `<span>License Number: ${self.getTextValue(
        self.coverLetterData.licenseNumber
      )}</span>`;
    }
    self.getAddressValue = (value) => {
      return self.getTextValue(
        self.coverLetterData.addresses[self.coverLetterData.selectedAddress()][value]
      );
    };
    this.fromAddressPreview = ko.computed(
      {
        read: function () {
          return self.fromAddress().replace(
              '[send_date]',
              self.coverLetterData.dates.sendDate() || '[send_date]'
            ).replace(
              '[cmref]',
              self.getTextValue(self.coverLetterData.cmReference())|| '[cmref]'
            )
        }
      },
      this
    );

    self.toAddress = ko.computed(() => {
      let result = '<div style="width: 40%; height: fit-content; border: 1px solid;">';
      if (self.getTextValue(self.coverLetterData.recipientName())){
        result += `<div><span>${self.getTextValue(self.coverLetterData.recipientName())}</span></div>`
      }
      if (self.getTextValue(self.company())){
        result += `<div><span>${self.getTextValue(self.company())}</span></div>`
      }
      if (self.getAddressValue('buildingName')) {
        result += `<div><span>${self.getAddressValue('buildingName')}</span></div>`;
      }
      if (self.getAddressValue('buildingNumber')) {
        result += `<div><span>${self.getAddressValue('buildingNumber')}, ${self.getAddressValue('streetName')}</span></div>`;
      }
      if (self.getAddressValue('subStreet')) {
        result += `<div><span>${self.getAddressValue('buildingNumberSubSt') ? self.getAddressValue('buildingNumberSubSt') +', ' : ''}${self.getAddressValue('subStreet')}</span></div>`;
      }
      if (self.getAddressValue('city')) {
        result += `<div><span>${self.getAddressValue('city')}</span></div>`;
      }
      if (self.getAddressValue('county')) {
        result += `<div><span>${self.getAddressValue('county')}</span></div>`;
      }
      if (self.getAddressValue('postcode')) {
        result += `<div><span>${self.getAddressValue('postcode')}</span></div>`;
      }
      result += '</div>';
      return result;
    }, self);

    self.details = ko.computed(() => {
      let result = '<div style="display: flex; width: 100%; flex-direction: column">';
      // if (self.getTextValue(self.coverLetterData.dates.acknowledged)) {
      //   result += `<span>Date: ${self.getTextValue(
      //     self.coverLetterData.dates.acknowledged
      //   )}</span>`;
      // }
      result += `<div><strong>APPLICATION FOR AN EXCAVATION LICENCE</strong><div>`
      if (self.getTextValue(self.coverLetterData.siteName)) {
        result += `<div><span><strong>Site: ${self.getTextValue(self.coverLetterData.siteName)}${self.getTextValue(self.coverLetterData.addresses.site.fullAddress) ? ',' + self.getTextValue(self.coverLetterData.addresses.site.fullAddress) : ''}</strong></span></div>`;
      }

      if (self.getTextValue(self.coverLetterData.licenseNumber)) {
        result += `<div><span><strong>License Number: ${self.getTextValue(
          self.coverLetterData.licenseNumber
        )}</strong></span></div>`;
      }
      
      result += '</div>';
      return result;
    }, self);

    self.body = ko.computed(() => {
      let result =
        '<div style="display: flex; width: 100%; flex-direction: column; margin: 24px 0 16px 0">';
      if (self.getTextValue(self.coverLetterData.recipientName)) {
        result += `<span>Dear: ${self.getTextValue(self.coverLetterData.recipientName)}</span>`;
      }
      result += `<span style="margin-top: 8px">${
        self.getTextValue(self.textPreview) || 'Please enter information regarding the email!'
      }</span>`;
      result += '</div>';

      return result;
    }, self);

    self.footer = ko.computed(() => {
      let result =
        '<div style="display: flex; width: 100%; flex-direction: column; margin: 24px 0 16px 0">';
      
      result += `<span>Yours sincerely\n ${
        self.getTextValue(self.coverLetterData.decisionBy.name) || '[Signature]'
      }</span>`;
      if (self.getTextValue(self.coverLetterData.seniorInspectorName)) {
        result += `<span>pp</span><span>Senior Inspector:  ${self.getTextValue(
          self.coverLetterData.seniorInspectorName
        )}</span>`;
      }
      result += '</div>';
      return result;
    }, self);

    self.letter = ko.computed(() => {
      console.log("weruliv", self.toAddress())
      let result =
        '<div style="display: flex; align-items: end; width: 100%; flex-direction: column">';
      result += self.header();
      result += '<div style="display: flex; justify-content: space-around; width: 100%">'
      result += self.toAddress()
      result += self.fromAddressPreview();
      result += '</div>'
      result += self.details();
      result += self.body();
      result += self.footer();
      result += '</div>';
      return result;
    }, self);

    params.form.save = async () => {
      if (ko.isObservable(self?.tile().data['72e0fc96-53d5-11ee-844f-0242ac130008'])) {
        self.tile().data['72e0fc96-53d5-11ee-844f-0242ac130008'](createTextObject(self.letter()));
      } else {
        self.tile().data['72e0fc96-53d5-11ee-844f-0242ac130008'] = createTextObject(self.letter());
      }
      /**
       * Save raw cover letter data to a node value.
       */
      if (ko.isObservable(self?.tile().data['a99a4236-68e0-11ee-81c3-0242ac130004'])) {
        self
          .tile()
          .data['a99a4236-68e0-11ee-81c3-0242ac130004'](
            createTextObject(koMapping.toJSON(self.coverLetterData))
          );
      } else {
        self.tile().data['a99a4236-68e0-11ee-81c3-0242ac130004'] = createTextObject(
          koMapping.toJSON(self.coverLetterData)
        );
      }
      await self.tile().save();
      params.form.savedData({
        tileData: koMapping.toJSON(self.tile().data),
        tileId: self.tile().tileid,
        resourceInstanceId: self.tile().resourceinstance_id,
        nodegroupId: self.tile().nodegroup_id,
        coverLetterData: ko.toJS(self.coverLetterData)
      });
      params.form.complete(true);
      params.form.saving(false);
    };

    self.getValueFromTiles = (tileData, nodeValueId, validator) => {
      /**
       * The validator callback can be used to access the found tile
       * and validate that another node value is present. Useful for
       * identifing multiple tiles of the same type.
       */
      const result = {
        tileId: null,
        value: null,
        display: null
      };
      for (const tile of tileData) {
        if (!(nodeValueId in tile.data)) continue;
        if (validator) {
          if (validator(tile)) {
            result.tileId = tile.tileid;
            result.value = tile.data[nodeValueId];
            result.display = tile.display_values.find((node) => node.nodeid === nodeValueId)?.value;
            break;
          }
          continue;
        }
        result.tileId = tile.tileid;
        result.value = tile.data[nodeValueId];
        result.display = tile.display_values.find((node) => node.nodeid === nodeValueId)?.value;
      }
      return result.tileId ? result : null;
    };

    self.fetchTileData = async (resourceId) => {
      const tilesResponse = await window.fetch(
        arches.urls.resource_tiles.replace('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', resourceId)
      );
      const data = await tilesResponse.json();
      console.log('Logging tilesResponse: ', tilesResponse, data.tiles);
      return data.tiles;
    };

    self.hasNodeGroup = (tileData, nodeGroupId) => {
      return tileData.some((tile) => tile.nodegroup === nodeGroupId);
    };

    self.setAddressValues = (
      addressee,
      {
        fullAddress,
        buildingNumberSubSt,
        city,
        postcode,
        subStreet,
        buildingName,
        buildingNumber,
        streetName,
        locality,
        county
      }
    ) => {
      if (fullAddress) {
        self.coverLetterData.addresses[addressee].fullAddress(fullAddress);
      }
      if (buildingNumberSubSt) {
        self.coverLetterData.addresses[addressee].buildingNumberSubSt(buildingNumberSubSt);
      }
      if (city) {
        self.coverLetterData.addresses[addressee].city(city);
      }
      if (postcode) {
        self.coverLetterData.addresses[addressee].postcode(postcode);
      }
      if (subStreet) {
        self.coverLetterData.addresses[addressee].subStreet(subStreet);
      }
      if (buildingName) {
        self.coverLetterData.addresses[addressee].buildingName(buildingName);
      }
      if (buildingNumber) {
        self.coverLetterData.addresses[addressee].buildingNumber(buildingNumber);
      }
      if (streetName) {
        self.coverLetterData.addresses[addressee].streetName(streetName);
      }
      if (locality) {
        self.coverLetterData.addresses[addressee].locality(locality);
      }
      if (county) {
        self.coverLetterData.addresses[addressee].county(county);
      }
    };

    self.configureAddress = (
      tileData,
      addressee,
      {
        fullAddressId,
        buildingNumberSubStId,
        cityId,
        postcodeId,
        subStreetId,
        buildingNameId,
        buildingNumberId,
        streetNameId,
        localityId,
        countyId
      }
    ) => {
      self.setAddressValues(addressee, {
        fullAddress: self.getValueFromTiles(tileData, fullAddressId)?.value,
        buildingNumberSubSt: self.getValueFromTiles(tileData, buildingNumberSubStId)?.value,
        city: self.getValueFromTiles(tileData, cityId)?.value,
        postcode: self.getValueFromTiles(tileData, postcodeId)?.value,
        subStreet: self.getValueFromTiles(tileData, subStreetId)?.value,
        buildingName: self.getValueFromTiles(tileData, buildingNameId)?.value,
        buildingNumber: self.getValueFromTiles(tileData, buildingNumberId)?.value,
        streetName: self.getValueFromTiles(tileData, streetNameId)?.value,
        locality: self.getValueFromTiles(tileData, localityId)?.value,
        county: self.getValueFromTiles(tileData, countyId)?.value
      });
    };

    self.loadData = async () => {
      self.loading(true);
      try {
        const licenseTiles = await self.fetchTileData(self.resourceId());

        const licenseNo = self.getValueFromTiles(
          licenseTiles,
          '280b75bc-4e4d-11ee-a340-0242ac140007',
          (tile) => {
            return (
              tile.data?.['280b7a9e-4e4d-11ee-a340-0242ac140007'] ===
              '9a383c95-b795-4d76-957a-39f84bcee49e'
            );
          }
        );
        if (licenseNo) {
          self.coverLetterData.licenseNumber(licenseNo.value);
        }

        const additionalFiles = self.getValueFromTiles(
          licenseTiles,
          '8c5356f4-48ce-11ee-8e4e-0242ac140007'
        );
        if (additionalFiles?.value.length) {
          self.coverLetterData.hasAdditonalFiles(true);
        }

        const contacts = self.getValueFromTiles(
          licenseTiles,
          '6d2924b6-5891-11ee-a624-0242ac120004'
        );
        if (contacts?.value.length) {
          await contacts.value.forEach(async (contact) => {
            const contactTiles = await self.fetchTileData(contact.resourceId);
            if (self.hasNodeGroup(contactTiles, '4110f741-1a44-11e9-885e-000d3ab1e588')) {
              // Name nodegroup of person
              const applicantName = self.getValueFromTiles(
                contactTiles,
                '5f8ded26-7ef9-11ea-8e29-f875a44e0e11'
              );
              if (applicantName) {
                console.log('applicantName: ', applicantName);
                self.coverLetterData.recipientName(applicantName.value);
              }
              self.configureAddress(contactTiles, 'applicant', {
                fullAddressId: 'b3a27611-effb-11eb-a79c-a87eeabdefba',
                buildingNumberSubStId: 'b3a27615-effb-11eb-8b46-a87eeabdefba',
                cityId: 'b3a27617-effb-11eb-a80f-a87eeabdefba',
                postcodeId: 'b3a27619-effb-11eb-a66d-a87eeabdefba',
                subStreetId: 'b3a2761b-effb-11eb-bcf9-a87eeabdefba',
                buildingNameId: 'b3a2761d-effb-11eb-9867-a87eeabdefba',
                buildingNumberId: 'b3a2761f-effb-11eb-9059-a87eeabdefba',
                streetNameId: 'b3a27621-effb-11eb-83e6-a87eeabdefba',
                localityId: 'b3a28c1a-effb-11eb-a811-a87eeabdefba',
                countyId: 'b3a28c1d-effb-11eb-95a1-a87eeabdefba'
              });
            }
            if (self.hasNodeGroup(contactTiles, 'af3b0116-29a9-11eb-8333-f875a44e0e11')) {
              // Name nodegroup of company
              const companyName = self.getValueFromTiles(
                contactTiles,
                'e8431c61-8098-11ea-8b01-f875a44e0e11'
              );
              if (companyName) {
                console.log('companyName: ', companyName);
                self.coverLetterData.companyName(companyName.value);
              }
              self.configureAddress(contactTiles, 'company', {
                fullAddressId: '9e7907c7-eff3-11eb-b606-a87eeabdefba',
                buildingNumberSubStId: '9e7907cb-eff3-11eb-83b1-a87eeabdefba',
                cityId: '9e7907cd-eff3-11eb-b0f1-a87eeabdefba',
                postcodeId: '9e7907cf-eff3-11eb-8412-a87eeabdefba',
                subStreetId: '9e7907d1-eff3-11eb-9d65-a87eeabdefba',
                buildingNameId: '9e7907d3-eff3-11eb-ac11-a87eeabdefba',
                buildingNumberId: '9e7907d5-eff3-11eb-a511-a87eeabdefba',
                streetNameId: '9e7907d7-eff3-11eb-8e7a-a87eeabdefba',
                localityId: '9e791cfb-eff3-11eb-bdaf-a87eeabdefba',
                countyId: '9e791cfe-eff3-11eb-9c35-a87eeabdefba'
              });
            }
          });

          console.log('self.coverLetterData.addresses: ', self.coverLetterData.addresses);
        }

        const decisionByDate = self.getValueFromTiles(
          licenseTiles,
          '4c58921e-48cc-11ee-9081-0242ac140007'
        );
        if (decisionByDate) {
          console.log('decisionByDate: ', decisionByDate);
          self.coverLetterData.decisionBy.date(decisionByDate.value);
        }

        const decisionBy = self.getValueFromTiles(
          licenseTiles,
          'f3dcbf02-48cb-11ee-9081-0242ac140007'
        );
        if (decisionBy?.value.length) {
          console.log('decisionBy: ', decisionBy);
          const decisionByTiles = await self.fetchTileData(decisionBy.value[0].resourceId);
          const decisionByName = self.getValueFromTiles(
            decisionByTiles,
            '5f8ded26-7ef9-11ea-8e29-f875a44e0e11'
          );
          console.log('decisionByName: ', decisionByName);
          self.coverLetterData.decisionBy.name(decisionByName.value);
        }

        const associatedActivitys = self.getValueFromTiles(
          licenseTiles,
          'a9f53f00-48b6-11ee-85af-0242ac140007'
        );
        if (associatedActivitys?.value.length) {
          console.log('associatedActivitys: ', associatedActivitys);
          // Assuming only one activity has been assigned upto this point
          const activityTiles = await self.fetchTileData(associatedActivitys.value[0].resourceId);
          const siteName = self.getValueFromTiles(
            activityTiles,
            '4a7be135-9938-11ea-b0e2-f875a44e0e11'
          );
          if (siteName) {
            self.coverLetterData.siteName(siteName.value);
          }
          const cmReference = self.getValueFromTiles(
            activityTiles,
            '589d4dc7-edf9-11eb-9856-a87eeabdefba',
            (tile) => {
              return (
                tile.data?.['589d4dcd-edf9-11eb-8a7d-a87eeabdefba'] ===
                '19afd557-cc21-44b4-b1df-f32568181b2c'
              );
            }
          );
          if (cmReference) {
            self.coverLetterData.cmReference(cmReference.value);
            console.log("we do have it,", self.coverLetterData.cmReference())
          }
          self.configureAddress(activityTiles, 'site', {
            fullAddressId: 'a5419224-f121-11eb-9ca7-a87eeabdefba',
            buildingNumberSubStId: 'a541b922-f121-11eb-9fa2-a87eeabdefba',
            cityId: 'a541e023-f121-11eb-b770-a87eeabdefba',
            postcodeId: 'a541e025-f121-11eb-8212-a87eeabdefba',
            subStreetId: 'a541e027-f121-11eb-ba26-a87eeabdefba',
            buildingNameId: 'a541e029-f121-11eb-802c-a87eeabdefba',
            buildingNumberId: 'a541b925-f121-11eb-9264-a87eeabdefba',
            streetNameId: 'a541b927-f121-11eb-8377-a87eeabdefba',
            localityId: 'a541b930-f121-11eb-a30c-a87eeabdefba',
            countyId: 'a541e034-f121-11eb-8803-a87eeabdefba'
          });
        }

        const acknowledgedDate = self.getValueFromTiles(
          licenseTiles,
          '0a914884-48b4-11ee-90a8-0242ac140007'
        );
        if (acknowledgedDate) {
          console.log('acknowledgedDate: ', acknowledgedDate);
          self.coverLetterData.dates.acknowledged(acknowledgedDate.value);
        }

        const receivedDate = self.getValueFromTiles(
          licenseTiles,
          '6b96c722-48c7-11ee-ba3a-0242ac140007'
        );
        if (receivedDate) {
          console.log('receivedDate: ', receivedDate);
          self.coverLetterData.dates.received(receivedDate.value);
        }

        console.log('coverLetterData: ', ko.toJS(self.coverLetterData));

        // const response = await window.fetch(
        //   arches.urls.api_resources(this.resourceId()) + '?format=json&compact=false'
        // );
        // const data = await response.json();

        // this.activityResourceData(data.resource);
        // this.areaName(createTextObject(data.resource['Associated Activities']['@value']));

        // if (data.resource['Decision']) {
        //   // this.signed(
        //   //   createTextObject(
        //   //     data.resource['Decision']['Decision Assignment']['Decision Made By']['@value']
        //   //   )
        //   // );
        //   // this.decisionDate(
        //   //   data.resource['Decision']['Decision Assignment']['Decision Time Span']['Decision Date'][
        //   //     '@value'
        //   //   ]
        //   // );
        // }

        // if (data.resource['Status and Duration Dates']) {
        //   this.appDate(data.resource['Status and Duration Dates']['Received Date']['@value']);
        // }

        // if (data.resource['Contacts']) {
        //   const inner_response = await window.fetch(
        //     arches.urls.api_tiles(
        //       data.resource['Contacts']['Applicants']['Applicant']['@tile_id']
        //     ) + '?format=json&compact=false'
        //   );
        //   const inner_data = await inner_response.json();
        //   if (inner_data['6d2924b6-5891-11ee-a624-0242ac120004']) {
        //     await inner_data.data['6d2924b6-5891-11ee-a624-0242ac120004'].forEach(
        //       async (contact_tile) => {
        //         const contacts = [];
        //         await window
        //           .fetch(
        //             arches.urls.api_resources(contact_tile.resourceId) +
        //               '?format=json&compact=false'
        //           )
        //           .then((response) => response.json())
        //           .then((data) => {
        //             contacts.push(data);
        //           })
        //           .then((x) => {
        //             for (let contact of contacts) {
        //               this.contacts_loaded(false);
        //               if (contact.graph_id === '22477f01-1a44-11e9-b0a9-000d3ab1e588') {
        //                 this.applicants()[contact['resource']['Name'][0]['Full Name']['@value']] =
        //                   [];
        //                 if (contact['resource']['Location Data']) {
        //                   this.applicants()[contact['resource']['Name'][0]['Full Name']['@value']] =
        //                     contact['resource']['Location Data'].map((location) => {
        //                       return {
        //                         buildingName:
        //                           location.Addresses['Building Name']['Building Name Value'][
        //                             '@value'
        //                           ],
        //                         buildingNumber:
        //                           location.Addresses['Building Number']['Building Number Value'][
        //                             '@value'
        //                           ],
        //                         street: location.Addresses['Street']['Street Value']['@value'],
        //                         buildingNumberSubSt:
        //                           location.Addresses['Building Number Sub-Street'][
        //                             'Building Number Sub-Street Value'
        //                           ]['@value'],
        //                         subStreet:
        //                           location.Addresses['Sub-Street ']['Sub-Street Value']['@value'],
        //                         city: location.Addresses['Town or City']['Town or City Value'][
        //                           '@value'
        //                         ],
        //                         county: location.Addresses['County']['County Value']['@value'],
        //                         postCode: location.Addresses['Postcode']['Postcode Value']['@value']
        //                       };
        //                     });
        //                 }
        //               } else if (contact.graph_id === 'd4a88461-5463-11e9-90d9-000d3ab1e588') {
        //                 this.companies({
        //                   [contact['resource']['Names'][0]['Organization Name']['@value']]: []
        //                 });
        //                 if (contact['resource']['Location Data']) {
        //                   if (typeof contact['resource']['Location Data'].map === 'function') {
        //                     this.companies()[
        //                       contact['resource']['Names'][0]['Organization Name']['@value']
        //                     ] = contact['resource']['Location Data'].map((location) => {
        //                       return {
        //                         buildingName:
        //                           location.Addresses['Building Name']['Building Name Value'][
        //                             '@value'
        //                           ],
        //                         buildingNumber:
        //                           location.Addresses['Building Number']['Building Number Value'][
        //                             '@value'
        //                           ],
        //                         street: location.Addresses['Street']['Street Value']['@value'],
        //                         buildingNumberSubSt:
        //                           location.Addresses['Building Number Sub-Street'][
        //                             'Building Number Sub-Street Value'
        //                           ]['@value'],
        //                         subStreet:
        //                           location.Addresses['Sub-Street ']['Sub-Street Value']['@value'],
        //                         city: location.Addresses['Town or City']['Town or City Value'][
        //                           '@value'
        //                         ],
        //                         county: location.Addresses['County']['County Value']['@value'],
        //                         postCode: location.Addresses['Postcode']['Postcode Value']['@value']
        //                       };
        //                     });
        //                     this.company(
        //                       createTextObject(
        //                         contact['resource']['Names'][0]['Organization Name']['@value']
        //                       )
        //                     );
        //                   } else {
        //                     let location = contact['resource']['Location Data'];
        //                     this.companies()[
        //                       contact['resource']['Names'][0]['Organization Name']['@value']
        //                     ] = [
        //                       {
        //                         buildingName:
        //                           location.Addresses['Building Name']['Building Name Value'][
        //                             '@value'
        //                           ],
        //                         buildingNumber:
        //                           location.Addresses['Building Number']['Building Number Value'][
        //                             '@value'
        //                           ],
        //                         street: location.Addresses['Street']['Street Value']['@value'],
        //                         buildingNumberSubSt:
        //                           location.Addresses['Building Number Sub-Street'][
        //                             'Building Number Sub-Street Value'
        //                           ]['@value'],
        //                         subStreet:
        //                           location.Addresses['Sub-Street ']['Sub-Street Value']['@value'],
        //                         city: location.Addresses['Town or City']['Town or City Value'][
        //                           '@value'
        //                         ],
        //                         county: location.Addresses['County']['County Value']['@value'],
        //                         postCode: location.Addresses['Postcode']['Postcode Value']['@value']
        //                       }
        //                     ];
        //                   }
        //                 }
        //               }
        //             }
        //             this.companyList(
        //               Object.keys(this.companies()).map((x) => {
        //                 return { text: x, id: x, value: x };
        //               })
        //             );
        //             this.companyText(Object.keys(this.companies())[0]);
        //             this.applicantList(
        //               Object.keys(this.applicants()).map((x) => {
        //                 return { text: x, id: x, value: x };
        //               })
        //             );
        //             this.applicantText(Object.keys(this.applicants())[0]);

        //             this.contacts_loaded(true);
        //           });
        //       }
        //     );
        // }
      } catch (error) {
        console.error('Failed loading data for cover letter: ', error);
        /**
         * TODO: Display error banner to user
         */
      }
      self.loading(false);

      // const related_response = await window.fetch(
      //   arches.urls.related_resources + this.resourceId() + '?paginate=false'
      // );
      // const related_data = await related_response.json();
      // related_data.related_resources.forEach((related_resource) => {
      //   if (related_resource.graph_id === 'd4a88461-5463-11e9-90d9-000d3ab1e588') {
      //     // company / organisation
      //   }
      //   if (related_resource.graph_id === '22477f01-1a44-11e9-b0a9-000d3ab1e588') {
      //     // people
      //   }
      //   if (related_resource.graph_id === 'b9e0701e-5463-11e9-b5f5-000d3ab1e588') {
      //     window
      //       .fetch(
      //         arches.urls.resource_editor +
      //           related_resource.resourceinstanceid +
      //           '/tiles?paginate=false'
      //       )
      //       .then((tiles) => tiles.json())
      //       .then((tiles) => {
      //         this.externalRefs(getNodeValues(tiles.tiles, '589d4dc7-edf9-11eb-9856-a87eeabdefba'));
      //         this.externalRefSources(
      //           getNodeValues(tiles.tiles, '589d4dcd-edf9-11eb-8a7d-a87eeabdefba')
      //         );
      //         this.externalRefNotes(
      //           getNodeValues(tiles.tiles, '589d4dca-edf9-11eb-83ea-a87eeabdefba')
      //         );

      //         this.siteAddress({
      //           buildingName: getNodeValues(tiles.tiles, 'a541e029-f121-11eb-802c-a87eeabdefba')[0]
      //             ? getNodeValues(tiles.tiles, 'a541e029-f121-11eb-802c-a87eeabdefba')[0][
      //                 this.currentLanguage().code
      //               ].value
      //             : '',
      //           buildingNumber: getNodeValues(
      //             tiles.tiles,
      //             'a541b925-f121-11eb-9264-a87eeabdefba'
      //           )[0]
      //             ? getNodeValues(tiles.tiles, 'a541b925-f121-11eb-9264-a87eeabdefba')[0][
      //                 this.currentLanguage().code
      //               ].value
      //             : '',
      //           street: getNodeValues(tiles.tiles, 'a541b927-f121-11eb-8377-a87eeabdefba')[0]
      //             ? getNodeValues(tiles.tiles, 'a541b927-f121-11eb-8377-a87eeabdefba')[0][
      //                 this.currentLanguage().code
      //               ].value
      //             : '',
      //           subStreetNumber: getNodeValues(
      //             tiles.tiles,
      //             'a541b922-f121-11eb-9fa2-a87eeabdefba'
      //           )[0]
      //             ? getNodeValues(tiles.tiles, 'a541b922-f121-11eb-9fa2-a87eeabdefba')[0][
      //                 this.currentLanguage().code
      //               ].value
      //             : '',
      //           subStreet: getNodeValues(tiles.tiles, 'a541e027-f121-11eb-ba26-a87eeabdefba')[0]
      //             ? getNodeValues(tiles.tiles, 'a541e027-f121-11eb-ba26-a87eeabdefba')[0][
      //                 this.currentLanguage().code
      //               ].value
      //             : '',
      //           county: getNodeValues(tiles.tiles, 'a541e034-f121-11eb-8803-a87eeabdefba')[0]
      //             ? getNodeValues(tiles.tiles, 'a541e034-f121-11eb-8803-a87eeabdefba')[0][
      //                 this.currentLanguage().code
      //               ].value
      //             : '',
      //           postCode: getNodeValues(tiles.tiles, 'a541e025-f121-11eb-8212-a87eeabdefba')[0]
      //             ? getNodeValues(tiles.tiles, 'a541e025-f121-11eb-8212-a87eeabdefba')[0][
      //                 this.currentLanguage().code
      //               ].value
      //             : '',
      //           city: getNodeValues(tiles.tiles, 'a541e023-f121-11eb-b770-a87eeabdefba')[0]
      //             ? getNodeValues(tiles.tiles, 'a541e023-f121-11eb-b770-a87eeabdefba')[0][
      //                 this.currentLanguage().code
      //               ].value
      //             : ''
      //         });
      //       });
      //   }
      //   if (related_resource.graph_id === 'a535a235-8481-11ea-a6b9-f875a44e0e11') {
      //     // digital objects
      //   }
      // });

      // for (const index in this.externalRefSources()) {
      //   // currently using HER ref as bfile number. Need to change when we have Kanika's concepts.
      //   if (this.externalRefSources()[index] === '19afd557-cc21-44b4-b1df-f32568181b2c') {
      //     this.bFileNumber = this.externalRefs()[index].en.value;
      //   }
      //   if (this.externalRefSources()[index] === '9a383c95-b795-4d76-957a-39f84bcee49e') {
      //     this.licenseNo = this.externalRefs()[index].en.value;
      //   }
      //   if (this.externalRefSources()[index] === 'df585888-b45c-4f48-99d1-4cb3432855d5') {
      //     // this.reportVals.assetNames.push(this.externalRefs()[index].en.value)
      //     // this.reportVals.assetNotes.push(this.externalRefNotes()[index].en.value)
      //   }
      //   if (this.externalRefSources()[index] === 'c14def6d-4713-465f-9119-bc33f0d6e8b3') {
      //     // this.reportVals.wreckNames.push(this.externalRefs()[index].en.value)
      //     // this.reportVals.wreckNotes.push(this.externalRefNotes()[index].en.value)
      //   }
      // }
      // // this.areaName(createTextObject(data.resource['Associated Activities']['@value']));
    };

    if (!params.form.savedData()?.['tileId']) {
      // Run fetch prefill data if there hasn't previously been a saved letter
      self.loadData();
    }

    // };
  }

  ko.components.register('license-cover-letter', {
    viewModel: viewModel,
    template: licenseCoverTemplate
  });
  return viewModel;
});
