const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.resolve(__dirname, '../data/seoul_osm.json');
const OUTPUT_PATH = path.resolve(__dirname, '../data/seoul_city.json');
const TARGET_SIZE = 30; // 월드 좌표계에서 X/Z 폭

function loadOSM() {
    const raw = fs.readFileSync(INPUT_PATH, 'utf8');
    return JSON.parse(raw);
}

function pseudoRandomFromId(id) {
    const str = String(id);
    let acc = 0;
    for (let i = 0; i < str.length; i++) {
        acc = (acc + str.charCodeAt(i) * (i + 1)) % 1e9;
    }
    const x = Math.sin(acc) * 10000;
    return x - Math.floor(x);
}

function projectPoint(lat, lon, bounds, size) {
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLon = (bounds.east + bounds.west) / 2;
    const spanLat = bounds.north - bounds.south;
    const spanLon = bounds.east - bounds.west;

    const x = ((lon - centerLon) / spanLon) * size;
    const z = ((lat - centerLat) / spanLat) * -size;
    return { x, z };
}

function polygonArea(points) {
    if (points.length < 3) {
        return 0;
    }
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].z - points[j].x * points[i].z;
    }
    return Math.abs(area / 2);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function buildData(osm) {
    const elements = osm.elements || [];
    const ways = elements.filter((el) => el.type === 'way' && Array.isArray(el.geometry));

    const latValues = [];
    const lonValues = [];
    ways.forEach((way) => {
        way.geometry.forEach((pt) => {
            latValues.push(pt.lat);
            lonValues.push(pt.lon);
        });
    });

    const bounds = {
        north: Math.max(...latValues),
        south: Math.min(...latValues),
        east: Math.max(...lonValues),
        west: Math.min(...lonValues),
    };

    const roadTypes = new Set([
        'motorway',
        'trunk',
        'primary',
        'secondary',
        'tertiary',
        'unclassified',
        'residential',
        'service',
        'living_street',
    ]);

    const roadWidthByType = {
        motorway: 0.35,
        trunk: 0.3,
        primary: 0.25,
        secondary: 0.22,
        tertiary: 0.18,
        unclassified: 0.15,
        residential: 0.14,
        living_street: 0.12,
        service: 0.1,
    };

    const buildingPalette = [
        '#cdd5e0',
        '#b8c1cc',
        '#d4cdbf',
        '#f0e3c2',
        '#d0d8db',
        '#e2d6c5',
    ];

    const buildings = [];
    const roads = [];

    ways.forEach((way) => {
        const { tags = {}, id } = way;
        const points = way.geometry.map((pt) =>
            projectPoint(pt.lat, pt.lon, bounds, TARGET_SIZE)
        );

        if (tags.highway && roadTypes.has(tags.highway)) {
            const simplified = [];
            points.forEach((pt, idx) => {
                if (
                    idx === 0 ||
                    idx === points.length - 1 ||
                    Math.hypot(pt.x - points[idx - 1].x, pt.z - points[idx - 1].z) > 0.02
                ) {
                    simplified.push(pt);
                }
            });

            if (simplified.length < 2) {
                return;
            }

            const width = roadWidthByType[tags.highway] || 0.12;
            roads.push({
                id,
                name: tags.name || null,
                type: tags.highway,
                width,
                points: simplified.map((pt) => [Number(pt.x.toFixed(4)), Number(pt.z.toFixed(4))]),
            });
            return;
        }

        if (!tags.building) {
            return;
        }

        const footprint = points.slice();
        if (footprint.length > 2) {
            const first = footprint[0];
            const last = footprint[footprint.length - 1];
            if (Math.hypot(first.x - last.x, first.z - last.z) < 0.001) {
                footprint.pop();
            }
        }

        if (footprint.length < 3) {
            return;
        }

        const area = polygonArea(footprint);
        if (area < 0.02) {
            return;
        }

        let heightMeters = null;
        if (tags.height) {
            const parsed = parseFloat(tags.height);
            if (!Number.isNaN(parsed)) {
                heightMeters = parsed;
            }
        }
        if (!heightMeters && tags['building:levels']) {
            const levels = parseFloat(tags['building:levels']);
            if (!Number.isNaN(levels)) {
                heightMeters = levels * 3.5;
            }
        }

        if (!heightMeters) {
            const variation = pseudoRandomFromId(id) * 20;
            heightMeters = 10 + variation;
        }

        let baseHeight = 0;
        if (tags['building:min_level']) {
            const minLevel = parseFloat(tags['building:min_level']);
            if (!Number.isNaN(minLevel)) {
                baseHeight = minLevel * 3.5;
            }
        }

        heightMeters = clamp(heightMeters, baseHeight + 4, 120);

        const colorIdx = Math.floor(pseudoRandomFromId(id) * buildingPalette.length);
        const color = buildingPalette[colorIdx % buildingPalette.length];

        buildings.push({
            id,
            height: Number((heightMeters / 5).toFixed(2)), // 월드 단위 약식 스케일
            minHeight: Number((baseHeight / 5).toFixed(2)),
            color,
            footprint: footprint.map((pt) => [Number(pt.x.toFixed(4)), Number(pt.z.toFixed(4))]),
        });
    });

    return {
        meta: {
            source: 'OpenStreetMap contributors',
            generatedAt: new Date().toISOString(),
            note: 'Geometry projected to local scene coordinates.',
        },
        bounds,
        size: TARGET_SIZE,
        center: {
            lat: (bounds.north + bounds.south) / 2,
            lon: (bounds.east + bounds.west) / 2,
        },
        roads,
        buildings,
    };
}

function main() {
    if (!fs.existsSync(INPUT_PATH)) {
        console.error(`Input file not found: ${INPUT_PATH}`);
        process.exit(1);
    }

    const osm = loadOSM();
    const data = buildData(osm);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Generated ${OUTPUT_PATH} with ${data.roads.length} roads and ${data.buildings.length} buildings.`);
}

main();
