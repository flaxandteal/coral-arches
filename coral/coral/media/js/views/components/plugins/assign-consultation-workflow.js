define([
  'knockout',
  'arches',
  'viewmodels/editable-workflow',
  'templates/views/components/plugins/default-workflow.htm',
  'views/components/workflows/related-document-upload',
  'views/components/workflows/widget-labeller'
], function (ko, arches, EditableWorkflow, workflowTemplate) {
  return ko.components.register('assign-consultation-workflow', {
    viewModel: function (params) {
      this.componentName = 'assign-consultation-workflow';
      this.stepConfig = [
        {
          title: 'Initialise Consultation',
          name: 'init-step',
          required: true,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'app-id',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'c853846a-7948-42c8-a089-63ebe34b49e4',
                    semanticName: 'System Reference Numbers',
                    hiddenNodes: [
                      '0629475d-a758-4483-8481-8d68025a28a7', // primary_reference_number,
                      // '18436d9e-c60b-4fb6-ad09-9458e270e993', // legacy_id,
                      // '79660038-ea02-4181-9cf0-521d39d57570', // resourceid_metatype,
                      // '9bb26274-eec1-4031-879a-4586810511fd', // primary_reference_number_type,
                      // 'abb5a463-2979-4e73-a554-6579dcbab33f', // resourceid_type,
                      // '5b6ece60-8dcc-46e1-91b3-0eb9bd00d8b2', // legacy_id_metatype,
                      '6a94dbfc-2d16-4534-8e63-1cbb8d643335' // resourceid,
                      // 'f3dbc907-f986-4bfd-a47a-e786d905ca76', // legacy_id_type,
                      // 'f44fc15f-eaee-4bfe-9f57-16b101c28bde', // primary_reference_number_metatype
                    ]
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Assign Consultation',
          name: 'application-details',
          required: true,
          workflowstepclass: 'workflow-form-component',
          informationboxdata: {
            heading: 'Applicant Details'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'con-name',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'fe1ca5cb-b642-48ae-b680-19a580a76b45',
                    semanticName: 'Consultation Names',
                    hiddenNodes: [
                      '4d0137d7-1ad9-4b71-ba2c-867f743ae3ce', // consultation_name_type,
                      // '689a685b-3138-40de-9368-8902a1d91792', // consultation_name,
                      '7c6a3aea-29bb-4611-8786-4136acd44f10', // consultation_name_use_type,
                      // '913dbb71-5736-41d6-8f2e-735ed815eee0', // consultation_name_currency_metatype,
                      // 'a37f9164-5789-46bf-b53b-1dc9395ac5a5', // consultation_name_metatype,
                      // '3a9edbd6-ae94-48d9-a8e8-241058f99d70', // consultation_name_use_metatype,
                      'e4bf04ba-5edd-4b5d-8afe-59fb100773fc' // consultation_name_currency
                    ]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'plan-ref',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: '87b1b187-39ec-46dc-95e6-bf5c1727bd30',
                    semanticName: 'External Cross References',
                    hiddenNodes: [
                      // '52b4cd82-ada8-4ce8-844a-c5325b11e1a4', // external_cross_reference_description_type,
                      '879c793c-757f-42a4-8951-e6accc35de7e', // external_cross_reference_description,
                      '90b26978-7a09-40de-b0f1-f261fcfbb9b5', // url,
                      // 'f8dbcbe7-0c33-4d3c-a171-fd9852315976', // external_cross_reference_description_metatype,
                      'a45c0772-01ab-4867-abb7-675f470fd08f' // external_cross_reference_source
                      // 'ebf279de-8a54-408c-812a-7fc344253758', // external_cross_reference
                    ],
                    labels: [['Cross Reference', 'Planning Reference']],
                    prefilledNodes: [
                      [
                        'a45c0772-01ab-4867-abb7-675f470fd08f',
                        '5fabe56e-ab1f-4b80-9a5b-f4dcf35efc27'
                      ]
                    ]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'cm-ref',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: '87b1b187-39ec-46dc-95e6-bf5c1727bd30',
                    semanticName: 'External Cross References',
                    hiddenNodes: [
                      // '52b4cd82-ada8-4ce8-844a-c5325b11e1a4', // external_cross_reference_description_type,
                      '879c793c-757f-42a4-8951-e6accc35de7e', // external_cross_reference_description,
                      '90b26978-7a09-40de-b0f1-f261fcfbb9b5', // url,
                      // 'f8dbcbe7-0c33-4d3c-a171-fd9852315976', // external_cross_reference_description_metatype,
                      'a45c0772-01ab-4867-abb7-675f470fd08f' // external_cross_reference_source
                      // 'ebf279de-8a54-408c-812a-7fc344253758', // external_cross_reference
                    ],
                    labels: [['Cross Reference', 'CM Reference']],
                    prefilledNodes: [
                      [
                        'a45c0772-01ab-4867-abb7-675f470fd08f',
                        '19afd557-cc21-44b4-b1df-f32568181b2c'
                      ]
                    ]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'received-date',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'c0c98765-b217-443d-ba91-cb720cd630aa',
                    semanticName: 'Consultation Dates',
                    hiddenNodes: [
                      '02f674e5-d15a-4499-ad66-d219a0d86f22', // target_date_start,
                      '1b5b60e1-0a30-429e-b6cd-33c3d6076145' // consultation_date_qualifier,
                      // 'b389b328-e83a-4ff0-9037-77484deceac2', // target_date_end,
                      // '58b2a2bb-181a-4606-a6a2-e21c1d64b2c4', // completion_date,
                      // '6d54eaff-396d-4b76-a262-caf053a576cd', // consultation_data_qualifier_metatype,
                      // '9dc3ab87-8bae-48bb-b5d5-9ef3a1ed2a95', // target_date_qualifier,
                      // 'e8792e00-448c-4034-92de-b8e82229e7da', // log_date
                    ],
                    labels: [
                      ['Log Date', 'Dif Received Date'],
                      ['Completion Date', 'Date Consulted']
                    ]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'entry-number',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    tileid: "['init-step']['app-id'][0]['tileId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'c853846a-7948-42c8-a089-63ebe34b49e4',
                    semanticName: 'System Reference Numbers',
                    hiddenNodes: [
                      // '0629475d-a758-4483-8481-8d68025a28a7', // primary_reference_number,
                      '18436d9e-c60b-4fb6-ad09-9458e270e993', // legacy_id,
                      // '79660038-ea02-4181-9cf0-521d39d57570', // resourceid_metatype,
                      '9bb26274-eec1-4031-879a-4586810511fd', // primary_reference_number_type,
                      'abb5a463-2979-4e73-a554-6579dcbab33f', // resourceid_type,
                      // '5b6ece60-8dcc-46e1-91b3-0eb9bd00d8b2', // legacy_id_metatype,
                      '6a94dbfc-2d16-4534-8e63-1cbb8d643335', // resourceid,
                      'f3dbc907-f986-4bfd-a47a-e786d905ca76' // legacy_id_type,
                      // 'f44fc15f-eaee-4bfe-9f57-16b101c28bde', // primary_reference_number_metatype
                    ],
                    labels: [['Primary Reference Number', 'Entry Number (for audit purpose only)']]
                  }
                },
                // todo classification
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'developent-type',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: '8a5c490f-34ac-4640-9a0e-c739a638ec7a',
                    semanticName: 'Development Type',
                    hiddenNodes: [
                      // 'bfca2666-57d7-4286-85fb-01303c772fec', // development_metatype,
                      // '8a5c490f-34ac-4640-9a0e-c739a638ec7a', // development_type
                    ]
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'contacts',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: '419290e1-331c-4739-beee-c33f3d46341b',
                    semanticName: 'Contacts',
                    hiddenNodes: [
                      // 'cddd5592-a2f7-45bf-92a2-653c6d92557f', // casework_officer_role_metatype,
                      // '09fec38f-856b-46ca-90dd-1662f4021b1d', // agent,
                      // '1f93d101-8623-4878-9ed5-4d0c1b7b7383', // owner_role_type,
                      // '2eda066c-943c-4518-a769-738c2e2dd24a', // planning_officer,
                      // '491d92d7-2009-44ed-9aef-a646830ec7ef', // casework_officer_role_type,
                      // '7ac28ac1-aeb8-4941-91a5-0063bc622942', // owner_role_metatype,
                      // '83557ff8-17c1-4344-a322-57e73804e0e0', // planning_officer_metatype,
                      // '1543b23b-47a2-4185-9f63-796a5f25df05', // casework_officer,
                      // 'b4ba16b5-4e92-47dc-9fe5-2fe36c77166c', // planning_officer_role_type,
                      // 'bba0798e-e5d8-4a78-bc62-70a6bf6a3d11', // applicant_role_metatype,
                      // 'c1af9163-c6a5-46b9-971f-fc2e704337b6', // applicant,
                      // 'f405cf7c-d44c-4ce6-81a5-fb8a54b4f3db', // applicant_role_type,
                      // 'd1a1f7eb-5ad3-424a-8237-1d8fb4f57ae4', // agent_role_metatype,
                      // 'd2480aed-0350-46ef-9129-644300c1aaa7', // planning_body,
                      'd5e6ab32-f73d-409b-983f-805db7e49688' // owner,
                      // 'daaf18a8-7b88-45b0-92ab-a97081320f24', // agent_role_type,
                      // 'e7823c77-1c65-44fd-998e-190beeb161a1', // consulting_contact
                    ]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'app-reason',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'de487c5c-b0cc-49de-ae1b-f5d47ab51700',
                    semanticName: 'Consultation Descriptions',
                    hiddenNodes: [
                      // '209f3ca4-6e2b-44af-828f-fa9172e40b88', // consultation_description,
                      '66c6c7b2-4fa6-4816-9d8a-fe3015cc76fe', // consultation_description_type,
                      'f5a94d2c-76df-43aa-bb6a-0dea6dfce336' // consulation_description_metatype
                    ],
                    labels: [['Consultation Description', 'Application Reason']]
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'proposal',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: '5a067282-4bc7-496f-a947-f647494d0162',
                    semanticName: 'Proposal',
                    hiddenNodes: [
                      '7cc4dc36-9aad-4a0b-aa39-0a27283787f0' // digital_file_s__n1,
                      // '2b406a26-533c-438f-93b5-355862d9f7de', // proposal_text,
                      // 'cf054088-d61e-45c6-92b2-3379e4d01c27', // proposal_description_type,
                      // 'dcfe9f09-fede-422e-b514-55a9ff752b5b', // proposal_description_metatype
                    ]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'location-data-tile',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'f0550a8c-8e04-11ee-85e6-0242ac190002',
                    semanticName: 'Location Data',
                    hiddenNodes: [],
                    hiddenCard: true
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Area Details',
          name: 'area-details',
          // required: true,
          workflowstepclass: 'workflow-form-component',
          informationboxdata: {
            heading: 'Area Details'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'planning-area',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parenttileid: "['application-details']['location-data-tile'][0]['tileId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'f054f204-8e04-11ee-85e6-0242ac190002',
                    semanticName: 'Geometry',
                    hiddenNodes: [
                      // 'f055564a-8e04-11ee-85e6-0242ac190002', // feature_shape,
                      // 'f055f712-8e04-11ee-85e6-0242ac190002', // geospatial_coordinates,
                      // 'f0562de0-8e04-11ee-85e6-0242ac190002', // feature_shape_metatype
                    ]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'townland',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parenttileid: "['application-details']['location-data-tile'][0]['tileId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'f054e41c-8e04-11ee-85e6-0242ac190002',
                    semanticName: 'Localities/Administrative Areas',
                    hiddenNodes: [
                      // 'f05584f8-8e04-11ee-85e6-0242ac190002', // area_name_metatype,
                      // 'f0558692-8e04-11ee-85e6-0242ac190002', // area_name,
                      // 'f0558836-8e04-11ee-85e6-0242ac190002', // area_name_type,
                      // 'f055b05e-8e04-11ee-85e6-0242ac190002', // area_currency_metatype,
                      // 'f055ca58-8e04-11ee-85e6-0242ac190002', // area_metatype,
                      'f055d0c0-8e04-11ee-85e6-0242ac190002', // area_currency_type,
                      'f055d584-8e04-11ee-85e6-0242ac190002' // area_type
                    ],
                    prefilledNodes: [
                      [
                        'f055d584-8e04-11ee-85e6-0242ac190002',
                        '24ca1cb9-c4d1-4cbc-9990-df74e6eb346e'
                      ]
                    ],
                    labels: [['Area Name', 'Townland']]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'county',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parenttileid: "['application-details']['location-data-tile'][0]['tileId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'f054e41c-8e04-11ee-85e6-0242ac190002',
                    semanticName: 'Localities/Administrative Areas',
                    hiddenNodes: [
                      // 'f05584f8-8e04-11ee-85e6-0242ac190002', // area_name_metatype,
                      // 'f0558692-8e04-11ee-85e6-0242ac190002', // area_name,
                      // 'f0558836-8e04-11ee-85e6-0242ac190002', // area_name_type,
                      // 'f055b05e-8e04-11ee-85e6-0242ac190002', // area_currency_metatype,
                      // 'f055ca58-8e04-11ee-85e6-0242ac190002', // area_metatype,
                      'f055d0c0-8e04-11ee-85e6-0242ac190002', // area_currency_type,
                      'f055d584-8e04-11ee-85e6-0242ac190002' // area_type
                    ],
                    prefilledNodes: [
                      [
                        'f055d584-8e04-11ee-85e6-0242ac190002',
                        '74e2eb43-49fc-41e9-8d61-388c01878573'
                      ]
                    ],
                    labels: [['Area Name', 'County']]
                  }
                },
                {
                  componentName: 'widget-labeller',
                  uniqueInstanceName: 'distric-council',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parenttileid: "['application-details']['location-data-tile'][0]['tileId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'f054e41c-8e04-11ee-85e6-0242ac190002',
                    semanticName: 'Localities/Administrative Areas',
                    hiddenNodes: [
                      // 'f05584f8-8e04-11ee-85e6-0242ac190002', // area_name_metatype,
                      // 'f0558692-8e04-11ee-85e6-0242ac190002', // area_name,
                      // 'f0558836-8e04-11ee-85e6-0242ac190002', // area_name_type,
                      // 'f055b05e-8e04-11ee-85e6-0242ac190002', // area_currency_metatype,
                      // 'f055ca58-8e04-11ee-85e6-0242ac190002', // area_metatype,
                      'f055d0c0-8e04-11ee-85e6-0242ac190002', // area_currency_type,
                      'f055d584-8e04-11ee-85e6-0242ac190002' // area_type
                    ],
                    prefilledNodes: [
                      [
                        'f055d584-8e04-11ee-85e6-0242ac190002',
                        'b66856da-9c70-4a88-ad56-00e68dab16a4'
                      ]
                    ],
                    labels: [['Area Name', 'District Council']]
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'related-monuments',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: '65ed4765-5f3a-4062-b730-47019f149f72',
                    semanticName: 'Related Monuments and Areas',
                    hiddenNodes: [
                      // '65ed4765-5f3a-4062-b730-47019f149f72', // related_monuments_and_areas
                    ]
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'related-activities',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'e389a294-c103-4e5c-9012-16b9e60b1ce0',
                    semanticName: 'Associated Activities',
                    hiddenNodes: [
                      // 'e389a294-c103-4e5c-9012-16b9e60b1ce0', // associated_activities
                    ]
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Location Details',
          name: 'location-details',
          required: true,
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'addresses-step',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    parenttileid: "['application-details']['location-data-tile'][0]['tileId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'f054ced2-8e04-11ee-85e6-0242ac190002',
                    semanticName: 'Addresses',
                    hiddenNodes: [
                      // 'f0554ff6-8e04-11ee-85e6-0242ac190002', // full_address,
                      // 'f0555cc6-8e04-11ee-85e6-0242ac190002', // postcode_metatype,
                      // 'f0555e6a-8e04-11ee-85e6-0242ac190002', // address_currency_metatype,
                      // 'f0556004-8e04-11ee-85e6-0242ac190002', // address_status_metatype,
                      // 'f055619e-8e04-11ee-85e6-0242ac190002', // locality_type,
                      // 'f0556338-8e04-11ee-85e6-0242ac190002', // building_number_type,
                      // 'f05564d2-8e04-11ee-85e6-0242ac190002', // building_number_sub_street_type,
                      // 'f055666c-8e04-11ee-85e6-0242ac190002', // building_number_sub_street_value,
                      // 'f0557012-8e04-11ee-85e6-0242ac190002', // building_number_value,
                      // 'f0557346-8e04-11ee-85e6-0242ac190002', // street_value,
                      // 'f05574e0-8e04-11ee-85e6-0242ac190002', // locality_metatype,
                      // 'f05576a2-8e04-11ee-85e6-0242ac190002', // building_number_sub_street_metatype,
                      // 'f055783c-8e04-11ee-85e6-0242ac190002', // town_or_city_metatype,
                      // 'f05579e0-8e04-11ee-85e6-0242ac190002', // county_type,
                      // 'f0557b84-8e04-11ee-85e6-0242ac190002', // sub_street_type,
                      // 'f055c1c0-8e04-11ee-85e6-0242ac190002', // full_address_type,
                      // 'f055c3e6-8e04-11ee-85e6-0242ac190002', // address_status,
                      // 'f055f8a2-8e04-11ee-85e6-0242ac190002', // county_metatype,
                      // 'f055fa3c-8e04-11ee-85e6-0242ac190002', // building_name_metatype,
                      // 'f055fbd6-8e04-11ee-85e6-0242ac190002', // sub_street_metatype,
                      // 'f055fd66-8e04-11ee-85e6-0242ac190002', // locality_value,
                      // 'f05635f6-8e04-11ee-85e6-0242ac190002', // town_or_city_value,
                      // 'f056392a-8e04-11ee-85e6-0242ac190002', // postcode_value,
                      // 'f0563c68-8e04-11ee-85e6-0242ac190002', // sub_street_value,
                      // 'f0563f9c-8e04-11ee-85e6-0242ac190002', // building_name_value,
                      // 'f0564140-8e04-11ee-85e6-0242ac190002', // building_name_type,
                      // 'f05642da-8e04-11ee-85e6-0242ac190002', // building_number_metatype,
                      // 'f0564604-8e04-11ee-85e6-0242ac190002', // address_currency,
                      // 'f056479e-8e04-11ee-85e6-0242ac190002', // town_or_city_type,
                      // 'f0564938-8e04-11ee-85e6-0242ac190002', // street_type,
                      // 'f0564ac8-8e04-11ee-85e6-0242ac190002', // postcode_type,
                      // 'f0564f96-8e04-11ee-85e6-0242ac190002', // full_address_metatype,
                      // 'f0565130-8e04-11ee-85e6-0242ac190002', // county_value,
                      // 'f05652f2-8e04-11ee-85e6-0242ac190002', // street_metatype
                    ]
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Documentation',
          name: 'assingment-documentation',
          required: false,
          informationboxdata: {
            heading: 'Assignment Documentation'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'related-document-upload',
                  uniqueInstanceName: 'file-upload',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: 'a535a235-8481-11ea-a6b9-f875a44e0e11',
                    nodegroupid: '7db68c6c-8490-11ea-a543-f875a44e0e11',
                    resourceModelId: "['init-step']['app-id'][0]['resourceInstanceId']",
                    resourceModelDigitalObjectNodeGroupId: 'f5aeaa90-3127-475d-886a-9fc62742de4f',
                    fileObjectNamePrefix: 'Consultation Files for '
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Action',
          name: 'consultation-action',
          // required: true,
          informationboxdata: {
            heading: 'Action'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'd32e7158-8541-11ee-8217-0242ac140002',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                    nodegroupid: 'd32e7158-8541-11ee-8217-0242ac140002',
                    semanticName: 'Assignment',
                    hiddenNodes: [
                      // 'b0c0d000-8543-11ee-8217-0242ac140002', // assignment_date,
                      // '7456a5ae-8543-11ee-8217-0242ac140002' // action_required
                    ]
                  }
                }
                /** Currently commented becuase this is an actual action nodegroup and might be required
                 *  but it seems from the penpot that we really just want to manage assignments here
                 *  and have to label that as an action. It's possible HED decide they need both
                 */
                // {
                //   componentName: 'widget-labeller',
                //   uniqueInstanceName: 'consultation-action',
                //   tilesManaged: 'one',
                //   parameters: {
                //     graphid: '8effdca4-ffb6-482b-94b8-4d35fb5c88c5',
                //     nodegroupid: '8d5175ba-e6bc-4f59-ac49-e208168c12cf',
                //     resourceid: "['init-step']['app-id'][0]['resourceInstanceId']"

                //     //   labels: [['Cross Reference', 'Planning Reference']],
                //   }
                // }
              ]
            }
          ]
        }
      ];
      EditableWorkflow.apply(this, [params]);
      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: workflowTemplate
  });
});
