define([
    "underscore",
    "knockout",
    "knockout-mapping",
    "uuid",
    "arches",
    "viewmodels/card-component",
    "viewmodels/alert",
    "templates/views/components/workflows/get-ha-smc-details.htm",
], function(
    _,
    ko,
    koMapping,
    uuid,
    arches,
    CardComponentViewModel,
    AlertViewModel,
    template
) {
    function viewModel(params) {
        CardComponentViewModel.apply(this, [params]);
        this.SYSTEM_REFERENCE_NODEGROUP = "325a2f2f-efe4-11eb-9b0c-a87eeabdefba";
        this.SYSTEM_REFERENCE_RESOURCE_ID_NODE =
      "325a430a-efe4-11eb-810b-a87eeabdefba";

        this.HERRITAGE_ASSET_REFERENCES_NODEGROUP =
      "e71df5cc-3aad-11ef-a2d0-0242ac120003";
        this.SMR_NUMBER_NODE = "158e1ed2-3aae-11ef-a2d0-0242ac120003";

        this.MONUMENT_NAMES_NODEGROUP = "676d47f9-9c1c-11ea-9aa0-f875a44e0e11";
        this.MONUMENT_NAMES_NODE = "676d47ff-9c1c-11ea-b07f-f875a44e0e11";

        this.ADDRESSES_NODEGROUP = "87d39b25-f44f-11eb-95e5-a87eeabdefba";
        this.TOWNLAND_NODEGROUP = "919bcb94-345c-11ef-a5b7-0242ac120003";
        this.TOWNLAND_NODE = "d033683a-345c-11ef-a5b7-0242ac120003";

        this.COUNCIL = "447973ce-d7e2-11ee-a4a1-0242ac120006";

        // Switched out for Heritage Asset Type node under constrcution phases nodegroup
        // Monument Type seems to be a duplicate node 
        this.MONUMENT_TYPE_NODEGROUP = "77e90834-efdc-11eb-b2b9-a87eeabdefba";

        this.haRefStrings = {
            "158e1ed2-3aae-11ef-a2d0-0242ac120003": "SMR Number",
            "250002fe-3aae-11ef-91fd-0242ac120003": "HB Number",
            "1de9abf0-3aae-11ef-91fd-0242ac120003": "IHR Number",
            "2c2d02fc-3aae-11ef-91fd-0242ac120003":
        "Historic Parks and Gardens Number",
        };

        this.labels = params.labels || [];

        this.selectedMonuments = ko.observable([]);

        this.cards = ko.observable({});

        this.dataNode = params.node;

        const self = this;

        this.searchString = params.searchString;

        this.form
            .card()
            ?.widgets()
            .forEach((widget) => {
                this.labels?.forEach(([prevLabel, newLabel]) => {
                    if (widget.label() === prevLabel) {
                        widget.label(newLabel);
                    }
                });
            });

        this.tile.data[this.dataNode].subscribe((value) => {
            if (value && value.length) {
                const currentResources = value.map((t) => ko.unwrap(t.resourceId));
                currentResources.forEach((id) => {
                    this.cards({
                        ...this.cards(),
                        [id]: {
                            monumentName: "",
                            smrNumber: "",
                            monumentType: "",
                            townlandValue: "",
                        },
                    });
                    this.getMonumentDetails(id);
                });
                this.selectedMonuments(currentResources);
            } else {
                this.selectedMonuments([]);
            }
        }, this);

        this.fetchTileData = async(resourceId) => {
            const tilesResponse = await window.fetch(
                arches.urls.resource_tiles.replace(
                    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                    resourceId
                )
            );
            const data = await tilesResponse.json();
            return data.tiles;
        };

        this.getMonumentDetails = async(resourceId) => {
            const tiles = await this.fetchTileData(resourceId);
            const monumentName = ko.observable("None");
            const haRefNumber = ko.observable("None");
            const haNumberLabel = ko.observable("Heritage Asset Ref Number");
            const townlandValue = ko.observableArray(["None"]);
            const monumentType = ko.observable("None");

            const additionalPromises = [];

            for (const tile of tiles) {
                if (tile.nodegroup === this.HERRITAGE_ASSET_REFERENCES_NODEGROUP) {
                    for (const [key, value] of Object.entries(tile.data)) {
                        if (value) {
                            haRefNumber(value.en.value);
                            haNumberLabel(this.haRefStrings[key]);
                        }
                    }
                }

                tiles.forEach((tile) => {
                    tile["display_values"].forEach((display_val) => {
                        if (display_val["label"] === "Heritage Asset Type") {
                            monumentType(display_val["value"]);
                        }
                    });
                });

                if (tile.nodegroup === this.MONUMENT_NAMES_NODEGROUP) {
                    monumentName(tile.data[this.MONUMENT_NAMES_NODE].en.value);
                }

                if (tile.nodegroup === this.ADDRESSES_NODEGROUP) {
                    const typeId = tile.data[this.TOWNLAND_NODE];
                    if (!typeId) continue;
                    townlandValue.removeAll();
                    typeId.forEach((id) => {
                        additionalPromises.push(
                            $.ajax({
                                type: "GET",
                                url: arches.urls.concept_value + `?valueid=${id}`,
                                context: self,
                                success: function(responseJSON, status, response) {
                                    townlandValue.push(responseJSON.value);
                                },
                                error: function(response, status, error) {
                                    if (response.statusText !== "abort") {
                                        const alert = new AlertViewModel(
                                            "ep-alert-red",
                                            arches.requestFailed.title,
                                            response.responseText
                                        );
                                        this.viewModel.alert(alert);
                                    }
                                    return;
                                },
                            })
                        );
                    });
                }
            }
            await Promise.all(additionalPromises);

            this.cards({
                ...this.cards(),
                [resourceId]: {
                    monumentName: monumentName(),
                    haNumberLabel: haNumberLabel(),
                    smrNumber: haRefNumber(),
                    townlandValue: townlandValue(),
                    monumentType: monumentType(),
                },
            });
        };

        // This will force a refresh to generate the tile if it already exists - not ideal
        this.tile.data[this.dataNode](this.tile.data[this.dataNode]());
    }

    ko.components.register("get-ha-smc-details", {
        viewModel: viewModel,
        template: template,
    });

    return viewModel;
});
