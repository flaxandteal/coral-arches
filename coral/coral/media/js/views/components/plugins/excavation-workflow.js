define([
  'knockout',
  'jquery',
  'arches',
  'viewmodels/workflow',
  'templates/views/components/plugins/excavation-workflow.htm'
], function (ko, $, arches, Workflow, excavationWorkflow) {
  return ko.components.register('excavation-workflow', {
    viewModel: function (params) {
      this.componentName = 'excavation-workflow';

      this.stepConfig = [
        {
          title: 'Application Details',
          name: 'application-details' /* unique to workflow */,
          required: true,
          informationboxdata: {
            heading: 'License',
            text: 'Please complete the required boxes below.'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'application-id' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'c0d16f14-fb90-4014-aa33-25b28a4ef494',
                    nodegroupid: '1e64d9fa-1f0d-11ee-9608-0242ac140008',
                    renderContext: 'workflow',
                  }
                }
              ]
            },
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'site-name' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'c0d16f14-fb90-4014-aa33-25b28a4ef494',
                    nodegroupid: 'cc01b7ea-1f0d-11ee-991f-0242ac140008'
                  }
                }
              ]
            },
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'county' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'c0d16f14-fb90-4014-aa33-25b28a4ef494',
                    nodegroupid: 'd7fc9dee-1f0d-11ee-813e-0242ac140008'
                  }
                }
              ]
            },
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'b-file-cm-number' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'c0d16f14-fb90-4014-aa33-25b28a4ef494',
                    nodegroupid: 'e2f6e93e-1f0d-11ee-991f-0242ac140008'
                  }
                }
              ]
            },
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'grid-ref' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'c0d16f14-fb90-4014-aa33-25b28a4ef494',
                    nodegroupid: 'f9addfac-1f0d-11ee-813e-0242ac140008'
                  }
                }
              ]
            },
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'planning-ref' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'c0d16f14-fb90-4014-aa33-25b28a4ef494',
                    nodegroupid: '083bfcd4-1f0e-11ee-991f-0242ac140008'
                  }
                }
              ]
            },
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'applicant-info' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'c0d16f14-fb90-4014-aa33-25b28a4ef494',
                    nodegroupid: '1099a296-1f0e-11ee-813e-0242ac140008'
                  }
                }
              ]
            },
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'status' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'c0d16f14-fb90-4014-aa33-25b28a4ef494',
                    nodegroupid: '638d516e-1f0e-11ee-991f-0242ac140008'
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Related Documents',
          name: 'related-documents' /* unique to workflow */,
          required: true,
          informationboxdata: {
            // heading: 'Upload related documentation',
            // text: 'If you documents that relate to this please upload them now.'
            heading: '',
            text: ''
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'documentation-files' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'c0d16f14-fb90-4014-aa33-25b28a4ef494',
                    nodegroupid: '9669fe52-1f0e-11ee-813e-0242ac140008',
                    renderContext: 'workflow',
                    resourceid: "['application-details']['application-id'][0]['resourceid']['resourceInstanceId']",
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Excavations Licensing Details',
          name: 'license-details' /* unique to workflow */,
          required: true,
          informationboxdata: {
            // heading: 'Upload related documentation',
            // text: 'If you documents that relate to this please upload them now.'
            heading: '',
            text: ''
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'licensee-name' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'c0d16f14-fb90-4014-aa33-25b28a4ef494',
                    nodegroupid: '1e9a25b8-1f0f-11ee-991f-0242ac140008',
                    renderContext: 'workflow',
                    resourceid: "['application-details']['application-id'][0]['resourceid']['resourceInstanceId']",
                  }
                }
              ]
            },
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'address' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'c0d16f14-fb90-4014-aa33-25b28a4ef494',
                    nodegroupid: '33349b2a-1f0f-11ee-813e-0242ac140008',
                    renderContext: 'workflow',
                    resourceid: "['application-details']['application-id'][0]['resourceid']['resourceInstanceId']",
                  }
                }
              ]
            },
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'date' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'c0d16f14-fb90-4014-aa33-25b28a4ef494',
                    nodegroupid: '4a2ecf58-1f0f-11ee-991f-0242ac140008',
                    renderContext: 'workflow',
                    resourceid: "['application-details']['application-id'][0]['resourceid']['resourceInstanceId']",
                  }
                }
              ]
            },
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'b-file-cm-number' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'c0d16f14-fb90-4014-aa33-25b28a4ef494',
                    nodegroupid: 'e2f6e93e-1f0d-11ee-991f-0242ac140008',
                    renderContext: 'workflow',
                    resourceid: "['application-details']['application-id'][0]['resourceid']['resourceInstanceId']",
                  }
                }
              ]
            },
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'site-name' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'c0d16f14-fb90-4014-aa33-25b28a4ef494',
                    nodegroupid: 'cc01b7ea-1f0d-11ee-991f-0242ac140008',
                    renderContext: 'workflow',
                    resourceid: "['application-details']['application-id'][0]['resourceid']['resourceInstanceId']",
                  }
                }
              ]
            },
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'license-number' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'c0d16f14-fb90-4014-aa33-25b28a4ef494',
                    nodegroupid: '5fc61006-1f0f-11ee-813e-0242ac140008',
                    renderContext: 'workflow',
                    resourceid: "['application-details']['application-id'][0]['resourceid']['resourceInstanceId']",
                  }
                }
              ]
            },
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'submission-details' /* unique to step */,
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'c0d16f14-fb90-4014-aa33-25b28a4ef494',
                    nodegroupid: '6c4ebe18-1f0f-11ee-991f-0242ac140008',
                    renderContext: 'workflow',
                    resourceid: "['application-details']['application-id'][0]['resourceid']['resourceInstanceId']",
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Excavations Licensing Cover Letter',
          name: 'license-cover-letter' /* unique to workflow */,
          required: false,
          informationboxdata: {
            // heading: 'Upload related documentation',
            // text: 'If you documents that relate to this please upload them now.'
            heading: '',
            text: ''
          },
          layoutSections: [
            //
          ]
        },
        {
          title: 'Summary',
          name: 'summary' /* unique to workflow */,
          required: false,
          informationboxdata: {
            // heading: 'Upload related documentation',
            // text: 'If you documents that relate to this please upload them now.'
            heading: '',
            text: ''
          },
          layoutSections: [
            //
          ]
        },
      ];
      Workflow.apply(this, [params]);
      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: excavationWorkflow
  });
});
