define([
  'knockout',
  'arches',
  'viewmodels/workflow',
  'templates/views/components/plugins/default-workflow.htm'
], function (ko, arches, Workflow, workflowTemplate) {
  return ko.components.register('dc-report-workflow', {
    viewModel: function (params) {
      this.componentName = 'dc-report-workflow';
      this.stepConfig = [
        {
          title: 'DC Report Reference',
          name: 'init-step',
          class: 'show-only-details',
          required: true,
          informationboxdata: {
            heading: 'DC Report',
            text: 'Select the cm ref for this survey'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'app-id',
                  tilesManaged: 'one',
                  parameters: {
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: 'f17f6581-efc7-11eb-b09f-a87eeabdefba',
                    semanticName: 'External Cross References',
                    hiddenNodes: [
                      // 'f17f6584-efc7-11eb-81f1-a87eeabdefba', // external_cross_reference,
                      'f17f6585-efc7-11eb-8ac0-a87eeabdefba', // external_cross_reference_description_type,
                      'f17f6587-efc7-11eb-b56f-a87eeabdefba', // external_cross_reference_description,
                      'f17f6588-efc7-11eb-8c12-a87eeabdefba', // external_cross_reference_description_metatype,
                      'f17f6589-efc7-11eb-9b90-a87eeabdefba', // url,
                      'f17f658a-efc7-11eb-a216-a87eeabdefba' // external_cross_reference_source
                    ]
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'DC Report',
          name: 'dc-report',
          class: 'show-only-details',
          workflowstepclass: 'workflow-form-component',
          required: true,
          informationboxdata: {
            heading: 'DC Report',
            text: ''
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'extent-of-listing',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: '6af2a0cb-efc5-11eb-8436-a87eeabdefba',
                    semanticName: 'Designation and Protection Assignment',
                    hiddenNodes: [
                      // '6af2a0ce-efc5-11eb-88d1-a87eeabdefba', // designation_or_protection_type,
                      // '6af2a0cf-efc5-11eb-806d-a87eeabdefba', // designation_amendment_date,
                      // '6af2a0d0-efc5-11eb-ab44-a87eeabdefba', // display_date,
                      // '6af2b4b4-efc5-11eb-a0d8-a87eeabdefba', // date_qualifier,
                      // '6af2b4b5-efc5-11eb-9977-a87eeabdefba', // designation_name_type,
                      // '6af2b4b6-efc5-11eb-b8cf-a87eeabdefba', // grade_metatype,
                      // '6af2b692-efc5-11eb-8adf-a87eeabdefba', // designation_name_metatype,
                      // '6af2b693-efc5-11eb-a32f-a87eeabdefba', // designation_name_use_metatype,
                      // '6af2b695-efc5-11eb-a0c0-a87eeabdefba', // date_qualifier_metatype,
                      // '6af2b696-efc5-11eb-b0b5-a87eeabdefba', // grade,
                      // '6af2b697-efc5-11eb-8152-a87eeabdefba', // designation_name_use_type,
                      // '6af2b698-efc5-11eb-9eeb-a87eeabdefba', // risk_status,
                      // '6af2b699-efc5-11eb-b88e-a87eeabdefba', // digital_file_s_,
                      // '6af2b69a-efc5-11eb-848d-a87eeabdefba', // risk_status_metatype,
                      // '6af2b69b-efc5-11eb-8d5a-a87eeabdefba', // designation_start_date,
                      // '6af2b69c-efc5-11eb-bf2b-a87eeabdefba', // designation_or_protection_metatype,
                      // '6af2b69e-efc5-11eb-801e-a87eeabdefba', // designation_name,
                      // '6af2b6a0-efc5-11eb-985a-a87eeabdefba', // designation_end_date,
                      // '6af2b6a2-efc5-11eb-aef4-a87eeabdefba', // local_heritage_list_criteria_metatype,
                      // '6af2b6a3-efc5-11eb-af76-a87eeabdefba', // local_heritage_list_criteria_type,
                      // '6af2b6a4-efc5-11eb-b5d4-a87eeabdefba' // reference_url
                    ]
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'date-of-construction',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: '77e8f287-efdc-11eb-a790-a87eeabdefba',
                    semanticName: 'Construction Phases',
                    hiddenNodes: [
                      // '77e8f28a-efdc-11eb-9600-a87eeabdefba', // construction_phase_display_date,
                      // '77e8f28b-efdc-11eb-b757-a87eeabdefba', // confidence_of_dating_metatype,
                      // '77e8f28c-efdc-11eb-b5fc-a87eeabdefba', // construction_phase_date_qualifier_metatype,
                      // '77e8f28d-efdc-11eb-afe4-a87eeabdefba', // construction_phase_type,
                      // '77e8f28e-efdc-11eb-b9f5-a87eeabdefba', // construction_phase_start_date,
                      // '77e8f291-efdc-11eb-9441-a87eeabdefba', // construction_phase_evidence_type,
                      // '77e8f292-efdc-11eb-acfd-a87eeabdefba', // construction_technique,
                      // '77e8f293-efdc-11eb-ac31-a87eeabdefba', // covering_material,
                      // '77e8f294-efdc-11eb-a9a2-a87eeabdefba', // construction_phase_date_qualifier,
                      // '77e8f295-efdc-11eb-a593-a87eeabdefba', // phase_description,
                      // '77e8f296-efdc-11eb-a8fe-a87eeabdefba', // covering_material_metatype,
                      // '77e8f297-efdc-11eb-a06e-a87eeabdefba', // construction_phase_evidence_metatype,
                      // '77e8f298-efdc-11eb-9465-a87eeabdefba', // confidence_of_dating,
                      // '77e8f299-efdc-11eb-84bc-a87eeabdefba', // construction_phase_metatype,
                      // '77e8f29a-efdc-11eb-813a-a87eeabdefba', // main_construction_material_metatype,
                      // '77e8f29b-efdc-11eb-b248-a87eeabdefba', // main_construction_material,
                      // '77e8f29c-efdc-11eb-a0ba-a87eeabdefba', // construction_method,
                      // '77e8f29d-efdc-11eb-b890-a87eeabdefba', // cultural_period,
                      // '77e8f29e-efdc-11eb-a8d8-a87eeabdefba', // phase_description_type,
                      // '77e8f29f-efdc-11eb-a58e-a87eeabdefba', // construction_phase_end_date,
                      // '77e9065c-efdc-11eb-bb1d-a87eeabdefba', // construction_method_metatype,
                      // '77e9065e-efdc-11eb-baa2-a87eeabdefba', // phase_certainty,
                      // '77e90834-efdc-11eb-b2b9-a87eeabdefba', // monument_type,
                      // '77e90835-efdc-11eb-91d3-a87eeabdefba', // phase_certainty_metatype,
                      // '77e90836-efdc-11eb-8022-a87eeabdefba', // phase_desctiption_metatype,
                      // '77e90837-efdc-11eb-a451-a87eeabdefba', // monument_metatype,
                      // '77e90838-efdc-11eb-bc1c-a87eeabdefba' // construction_technique_metatype_n1
                    ]
                  }
                },
                // {
                //     componentName: 'default-card',
                //     uniqueInstanceName: 'current-building-use', /* unique to step */
                //     tilesManaged: 'one',
                //     parameters: {
                //         graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                //         nodegroupid: 'b2133dda-efdc-11eb-ab07-a87eeabdefba',
                //         // resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",
                //     },
                // },
                // {
                //     componentName: 'default-card',
                //     uniqueInstanceName: 'former-building-use', /* unique to step */
                //     tilesManaged: 'one',
                //     parameters: {
                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                //         nodegroupid: '4263a7fa-eabf-11ed-9e22-72d420f37f11',
                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                //     },
                // },
                // {
                //     componentName: 'widget-labeller',
                //     uniqueInstanceName: 'conservation-area', /* unique to step */
                //     tilesManaged: 'one',
                //     parameters: {
                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                //         nodegroupid: '4263a002-eabf-11ed-9e22-72d420f37f11',
                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                //     },
                // },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'industrial-archaeology',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: 'b2133dda-efdc-11eb-ab07-a87eeabdefba',
                    semanticName: 'Use Phase',
                    hiddenNodes: [
                      // 'b2133e67-efdc-11eb-b3ea-a87eeabdefba', // use_phase_evidence_type,
                      // 'b2133e68-efdc-11eb-9f2d-a87eeabdefba', // use_phase_date_qualifier_metatype,
                      // 'b2133e69-efdc-11eb-a3d3-a87eeabdefba', // functional_metatype,
                      // 'b2133e6a-efdc-11eb-a294-a87eeabdefba', // use_phase_evidence_metatype,
                      // 'b2133e6b-efdc-11eb-aa04-a87eeabdefba', // functional_type,
                      // 'b2133e6c-efdc-11eb-8c3c-a87eeabdefba', // use_phase_date_qualifier,
                      // 'b2133e6d-efdc-11eb-b877-a87eeabdefba', // use_phase_display_date,
                      // 'b2133e6e-efdc-11eb-a96a-a87eeabdefba', // use_phase_desctiption_metatype,
                      // 'b2133e6f-efdc-11eb-a120-a87eeabdefba', // use_phase_end_date,
                      // 'b2133e71-efdc-11eb-a6f7-a87eeabdefba', // use_phase_description,
                      // 'b2133e72-efdc-11eb-a68d-a87eeabdefba', // use_phase_period,
                      // 'b2133e74-efdc-11eb-b241-a87eeabdefba', // use_phase_description_type,
                      // 'b2133e75-efdc-11eb-af28-a87eeabdefba', // use_phase_start_date"
                    ]
                  }
                },
                // {
                //     componentName: 'default-card',
                //     uniqueInstanceName: 'vernacular', /* unique to step */
                //     tilesManaged: 'one',
                //     parameters: {
                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                //         nodegroupid: '4263e0a8-eabf-11ed-9e22-72d420f37f11',
                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                //     },
                // },
                // {
                //     componentName: 'default-card',
                //     uniqueInstanceName: 'monument-status', /* unique to step */
                //     tilesManaged: 'one',
                //     parameters: {
                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                //         nodegroupid: '4263e0a8-eabf-11ed-9e22-72d420f37f11',
                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                //     },
                // },
                // {
                //     componentName: 'default-card',
                //     uniqueInstanceName: 'area-of-townscape-character', /* unique to step */
                //     tilesManaged: 'one',
                //     parameters: {
                //         graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                //         nodegroupid: '066cb8f0-a251-11e9-85d5-00224800b26d',
                //         // resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                //     },
                // },
                // {
                //     componentName: 'default-card',
                //     uniqueInstanceName: 'local-landscape-policy-area', /* unique to step */
                //     tilesManaged: 'one',
                //     parameters: {
                //         graphid: '8d41e49e-a250-11e9-9eab-00224800b26d',
                //         nodegroupid: '066cb8f0-a251-11e9-85d5-00224800b26d',
                //         // resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                //     },
                // },
                // {
                //     componentName: 'default-card',
                //     uniqueInstanceName: 'vancant-status', /* unique to step */
                //     tilesManaged: 'one',
                //     parameters: {
                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                //         nodegroupid: '426430e4-eabf-11ed-9e22-72d420f37f11',
                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                //     },
                // },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'derelict-status',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: '55d6a53e-049c-11eb-8618-f875a44e0e11',
                    semanticName: 'Components',
                    hiddenNodes: [
                      '0efa33e8-049e-11eb-bc30-f875a44e0e11', // construction_technique_metatype,
                      '46cd4b7e-049d-11eb-ba3a-f875a44e0e11', // component_type,
                      '5e8cc866-049d-11eb-afab-f875a44e0e11', // component_metatype,
                      '8e4109f9-04a1-11eb-9732-f875a44e0e11', // component_evidence_type,
                      '8e4109fc-04a1-11eb-add6-f875a44e0e11', // evidence_metatype,
                      'a0c7f934-04a4-11eb-9d78-f875a44e0e11', // associated_monument_construction_phase,
                      'bdd57f54-04a1-11eb-bede-f875a44e0e11', // component_material,
                      'd72e2974-049d-11eb-84c6-f875a44e0e11', // construction_technique_n1,
                      'ed06fc08-04a1-11eb-8131-f875a44e0e11' // component_material_metatype
                    ]
                  }
                },
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'niea-evaluation',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: 'ba342e69-b554-11ea-a027-f875a44e0e11',
                    semanticName: 'Descriptions',
                    hiddenNodes: [
                      'ba345577-b554-11ea-a9ee-f875a44e0e11', // description,
                      'ba345578-b554-11ea-97b3-f875a44e0e11', // description_metatype,
                      'ba345579-b554-11ea-9232-f875a44e0e11', // description_language,
                      'ba34557a-b554-11ea-9a51-f875a44e0e11', // description_language_metatype,
                      'ba34557b-b554-11ea-ab95-f875a44e0e11' // description_type
                    ]
                  }
                }
                // {
                //     componentName: 'default-card',
                //     uniqueInstanceName: 'date-of-listing', /* unique to step */
                //     tilesManaged: 'one',
                //     parameters: {
                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                //         nodegroupid: '4263a002-eabf-11ed-9e22-72d420f37f11',
                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                //     },
                // },
                // {
                //     componentName: 'default-card',
                //     uniqueInstanceName: 'date-of-delisting', /* unique to step */
                //     tilesManaged: 'one',
                //     parameters: {
                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                //         nodegroupid: '4263a002-eabf-11ed-9e22-72d420f37f11',
                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                //     },
                // },
                // {
                //     componentName: 'default-card',
                //     uniqueInstanceName: 'os-map-no', /* unique to step */
                //     parameters: {
                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                //         nodegroupid: '4264388c-eabf-11ed-9e22-72d420f37f11',
                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                //     },
                // },
                // {
                //     componentName: 'default-card',
                //     uniqueInstanceName: 'ig-ref', /* unique to step */
                //     parameters: {
                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                //         nodegroupid: '4263fa3e-eabf-11ed-9e22-72d420f37f11',
                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                //     },
                // },
                // {
                //     componentName: 'default-card',
                //     uniqueInstanceName: 'owner-category', /* unique to step */
                //     tilesManaged: 'one',
                //     parameters: {
                //         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
                //         nodegroupid: '4262ef4a-eabf-11ed-9e22-72d420f37f11',
                //         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",

                //     },
                // },
              ]
            }
          ]
        },
        // {
        //     title: 'Monument Location',
        //     name: 'dc-location',
        //     class: 'show-only-details',
        //     required: true,
        //     informationboxdata: {
        //         heading: 'Monument Location',
        //         text: 'Add address information and location descriptors',
        //     },
        //     layoutSections: [
        //         {
        //             componentConfigs: [
        //                 {
        //                     componentName: 'widget-labeller',
        //                     uniqueInstanceName: 'location-info', /* unique to step */
        //                     tilesManaged: 'one',
        //                     parameters: {
        //                         graphid: '4262df46-eabf-11ed-9e22-72d420f37f11',
        //                         nodegroupid: '426401a0-eabf-11ed-9e22-72d420f37f11',
        //                         resourceid: "['dc-cmref']['cm-ref']['resourceInstanceId']",
        //                     },
        //                 },
        //             ]
        //         }
        //     ]
        // },
        {
          title: 'Building Information',
          name: 'dc-location',
          class: 'show-only-details',
          required: true,
          informationboxdata: {
            heading: 'Building Information',
            text: 'Description and overview of the building'
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'building-info',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: 'ba342e69-b554-11ea-a027-f875a44e0e11',
                    semanticName: 'Descriptions',
                    hiddenNodes: [
                      // 'ba345577-b554-11ea-a9ee-f875a44e0e11', // description,
                      // 'ba345578-b554-11ea-97b3-f875a44e0e11', // description_metatype,
                      // 'ba345579-b554-11ea-9232-f875a44e0e11', // description_language,
                      // 'ba34557a-b554-11ea-9a51-f875a44e0e11', // description_language_metatype,
                      // 'ba34557b-b554-11ea-ab95-f875a44e0e11', // description_type
                    ]
                  }
                }
              ]
            }
          ]
        },
        {
          title: 'Additional Information',
          name: 'dc-location',
          class: 'show-only-details',
          required: true,
          informationboxdata: {
            heading: 'Additional Information',
            text: ''
          },
          layoutSections: [
            {
              componentConfigs: [
                {
                  componentName: 'default-card',
                  uniqueInstanceName: 'addition-info',
                  tilesManaged: 'one',
                  parameters: {
                    resourceid: "['init-step']['app-id'][0]['resourceid']['resourceInstanceId']",
                    graphid: '076f9381-7b00-11e9-8d6b-80000b44d1d9',
                    nodegroupid: 'ba342e69-b554-11ea-a027-f875a44e0e11',
                    semanticName: 'Descriptions',
                    hiddenNodes: [
                      // 'ba345577-b554-11ea-a9ee-f875a44e0e11', // description,
                      // 'ba345578-b554-11ea-97b3-f875a44e0e11', // description_metatype,
                      // 'ba345579-b554-11ea-9232-f875a44e0e11', // description_language,
                      // 'ba34557a-b554-11ea-9a51-f875a44e0e11', // description_language_metatype,
                      // 'ba34557b-b554-11ea-ab95-f875a44e0e11' // description_type
                    ]
                  }
                }
              ]
            }
          ]
        }
      ];

      Workflow.apply(this, [params]);
      this.quitUrl = arches.urls.plugin('init-workflow');
    },
    template: workflowTemplate
  });
});
