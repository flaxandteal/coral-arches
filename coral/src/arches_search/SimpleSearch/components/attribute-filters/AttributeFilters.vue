<!--
    CORAL OVERRIDE of arches_search .../attribute-filters/AttributeFilters.vue -
    arches-search 0.1.0a13. Only the two <Accordion> banners below differ; see
    coral/src/README.md.
-->
<script setup lang="ts">
import { useGettext } from "vue3-gettext";

import Accordion from "primevue/accordion";
import AccordionPanel from "primevue/accordionpanel";
import AccordionHeader from "primevue/accordionheader";
import AccordionContent from "primevue/accordioncontent";
import Button from "primevue/button";

import { getAttributeFilterEntry } from "@/arches_search/SimpleSearch/components/attribute-filters/registry.ts";

import { ref } from "vue";

import type { Component } from "vue";
import type { NodeFilterConfigNode } from "@/arches_search/SimpleSearch/types.ts";

const { $gettext } = useGettext();

defineProps<{
    nodes: NodeFilterConfigNode[];
    values: Record<string, unknown>;
}>();

const emit = defineEmits<{
    (event: "update:value", nodeAlias: string, value: unknown): void;
    (event: "close"): void;
}>();

// >>> CORAL OVERRIDE <<< Upstream passed the literal `:value="[]"`, which
// PrimeVue re-seeds its internal state from on every identity change - and
// selecting a checkbox re-renders us, so panels snapped shut on each click.
const expandedPanels = ref<string[]>([]);

function componentFor(node: NodeFilterConfigNode): Component | null {
    return getAttributeFilterEntry(node.datatype)?.component ?? null;
}
</script>

<template>
    <div class="attribute-filters">
        <div class="attribute-filters-header">
            <h3 class="attribute-filters-title">
                <i class="pi pi-filter" />
                {{ $gettext("Attribute Filters") }}
            </h3>
            <Button
                :label="$gettext('Close')"
                icon="pi pi-times"
                icon-pos="left"
                :text="true"
                class="attribute-filters-close-btn"
                @click="emit('close')"
            />
        </div>

        <span
            v-if="nodes.length === 0"
            class="attribute-filters-empty-state"
        >
            {{
                $gettext(
                    "No filters have been configured for this resource type.",
                )
            }}
        </span>

        <!--
            >>> CORAL OVERRIDE <<< `lazy` - without it PrimeVue creates every
            panel's content and merely v-show's it, so all 209 facets mounted
            and fetched on open. Safe to unmount: selections live in
            SimpleSearch.vue's filterValues, not in the facet.
        -->
        <Accordion
            v-else
            v-model:value="expandedPanels"
            :multiple="true"
            :lazy="true"
        >
            <AccordionPanel
                v-for="node in nodes"
                :key="node.node_alias"
                :value="node.node_alias"
            >
                <AccordionHeader>{{ node.label }}</AccordionHeader>
                <AccordionContent>
                    <component
                        :is="componentFor(node)"
                        v-if="componentFor(node)"
                        :node="node"
                        :model-value="values[node.node_alias] ?? null"
                        @update:model-value="
                            emit('update:value', node.node_alias, $event)
                        "
                    />
                    <div
                        v-else
                        class="unsupported"
                    >
                        {{
                            $gettext(
                                "Filtering is not supported for this field yet.",
                            )
                        }}
                    </div>
                </AccordionContent>
            </AccordionPanel>
        </Accordion>
    </div>
</template>

<style scoped>
.attribute-filters {
    height: 100%;
    overflow-y: auto;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
}

.attribute-filters-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.75rem;
    border-bottom: 0.125rem solid var(--p-content-border-color);
}

.attribute-filters-title {
    margin: 0;
    font-weight: 700;
    font-size: 1.5rem;
    color: var(--p-text-color);
}

.attribute-filters-title .pi {
    margin-inline-end: 0.6rem;
    color: var(--p-primary-color);
}

.attribute-filters-close-btn {
    padding: 0.3rem 0.8rem;
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--p-text-muted-color);
    border-radius: 0.4rem;
}

.attribute-filters-close-btn:hover {
    background: var(--p-content-hover-background);
    color: var(--p-text-color);
}

.attribute-filters-empty-state {
    display: block;
    padding: 1rem;
    border: 0.125rem solid var(--p-content-border-color);
    border-radius: 0.5rem;
    font-size: 1rem;
    color: var(--p-text-muted-color);
    line-height: 1.5;
}

.unsupported {
    font-size: 1.3rem;
    color: var(--p-text-muted-color);
    padding: 0.4rem 0 0.8rem 0;
    line-height: 1.5;
}
</style>
