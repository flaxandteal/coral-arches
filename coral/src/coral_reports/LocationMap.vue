<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef } from "vue";
import { useGettext } from "vue3-gettext";

import arches from "arches";
import geojsonExtent from "@mapbox/geojson-extent";
import maplibregl from "maplibre-gl";

import { fetchMapData } from "@/arches_vue_components/widgets/MapWidget/api.ts";
import {
    DEFAULT_FEATURE_COLOR,
    DEFAULT_FEATURE_LINE_WIDTH,
    DEFAULT_FEATURE_POINT_FILL,
    DEFAULT_FEATURE_POINT_SIZE,
    STYLE_LOAD_EVENT,
    VIEWER_SOURCE_ID,
} from "@/arches_vue_components/widgets/MapWidget/constants.ts";

import type { Feature, FeatureCollection } from "geojson";
import type { Map as MaplibreMap } from "maplibre-gl";
import type { RawBasemap } from "@/arches_vue_components/widgets/MapWidget/types.ts";

const { component, resourceInstanceId } = defineProps<{
    component: { config: { node_id: string; title?: string } };
    resourceInstanceId: string;
}>();

const { $gettext } = useGettext();

const mapContainer = useTemplateRef<HTMLDivElement>("mapContainer");
const loaded = ref(false);
const hasFeatures = ref(false);
let map: MaplibreMap | null = null;

async function fetchFeatures(nodeId: string): Promise<Feature[]> {
    const url = arches.urls.resource_tiles.replace(
        "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        resourceInstanceId,
    );
    const response = await fetch(`${url}?nodeid=${nodeId}`);
    if (!response.ok) throw new Error(response.statusText);
    const parsed = await response.json();
    return parsed.tiles.flatMap(
        (tile: { data: Record<string, FeatureCollection | null> }) =>
            tile.data[nodeId]?.features ?? [],
    );
}

function addFeatureLayers(featureCollection: FeatureCollection) {
    map!.addSource(VIEWER_SOURCE_ID, {
        type: "geojson",
        data: featureCollection,
    });
    map!.addLayer({
        id: `${VIEWER_SOURCE_ID}-fill`,
        type: "fill",
        source: VIEWER_SOURCE_ID,
        filter: ["==", "$type", "Polygon"],
        paint: { "fill-color": DEFAULT_FEATURE_COLOR, "fill-opacity": 0.3 },
    });
    map!.addLayer({
        id: `${VIEWER_SOURCE_ID}-line`,
        type: "line",
        source: VIEWER_SOURCE_ID,
        filter: ["!=", "$type", "Point"],
        paint: {
            "line-color": DEFAULT_FEATURE_COLOR,
            "line-width": DEFAULT_FEATURE_LINE_WIDTH,
        },
    });
    map!.addLayer({
        id: `${VIEWER_SOURCE_ID}-point`,
        type: "circle",
        source: VIEWER_SOURCE_ID,
        filter: ["==", "$type", "Point"],
        paint: {
            "circle-radius": DEFAULT_FEATURE_POINT_SIZE,
            "circle-color": DEFAULT_FEATURE_POINT_FILL,
            "circle-stroke-color": DEFAULT_FEATURE_COLOR,
            "circle-stroke-width": DEFAULT_FEATURE_LINE_WIDTH,
        },
    });
}

async function initMap(featureCollection: FeatureCollection) {
    map = new maplibregl.Map({
        container: mapContainer.value!,
        attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl(), "top-left");

    map.on(STYLE_LOAD_EVENT, () => addFeatureLayers(featureCollection));

    const mapData = await fetchMapData();
    const basemaps = (mapData.basemaps ?? []) as RawBasemap[];
    const basemap = basemaps.find((candidate) => candidate.addtomap);
    if (basemap) map.setStyle(basemap.url);

    const [west, south, east, north] = geojsonExtent(featureCollection);
    map.fitBounds(
        [
            [west, south],
            [east, north],
        ],
        { padding: 40, maxZoom: 17, animate: false },
    );
}

onMounted(async () => {
    try {
        const features = await fetchFeatures(component.config.node_id);
        hasFeatures.value = features.length > 0;
        loaded.value = true;
        if (!hasFeatures.value) return;
        await nextTick();
        await initMap({ type: "FeatureCollection", features });
    } catch (error) {
        console.error("Error loading location map:", error);
        loaded.value = true;
    }
});

onUnmounted(() => {
    map?.remove();
});
</script>

<template>
    <div v-if="loaded">
        <p v-if="!hasFeatures">{{ $gettext("No geometry recorded") }}</p>
        <div
            v-else
            ref="mapContainer"
            class="location-map"
        />
    </div>
</template>

<style scoped>
.location-map {
    height: 28rem;
    width: 100%;
}
</style>
