export interface Sample {
  key: string;
  name: string;
  schema: string;
  text: string;
}

export const SAMPLES: Sample[] = [
  {
    key: "team",
    name: "Team Orbit",
    schema: "nodes + links",
    text: `{
  "nodes": [
    { "id": "priya",  "group": "Product",     "value": 9 },
    { "id": "marco",  "group": "Product",     "value": 5 },
    { "id": "lena",   "group": "Product",     "value": 4 },
    { "id": "theo",   "group": "Design",      "value": 8 },
    { "id": "ana",    "group": "Design",      "value": 6 },
    { "id": "yuki",   "group": "Design",      "value": 4 },
    { "id": "omar",   "group": "Design",      "value": 3 },
    { "id": "sofia",  "group": "Engineering", "value": 10 },
    { "id": "dev",    "group": "Engineering", "value": 7 },
    { "id": "kira",   "group": "Engineering", "value": 6 },
    { "id": "mateo",  "group": "Engineering", "value": 5 },
    { "id": "nadia",  "group": "Engineering", "value": 6 },
    { "id": "ivan",   "group": "Engineering", "value": 4 },
    { "id": "rui",    "group": "Data",        "value": 7 },
    { "id": "emma",   "group": "Data",        "value": 5 },
    { "id": "noah",   "group": "Data",        "value": 4 },
    { "id": "zara",   "group": "Growth",      "value": 6 },
    { "id": "leo",    "group": "Growth",      "value": 4 },
    { "id": "mila",   "group": "Growth",      "value": 5 }
  ],
  "links": [
    { "source": "priya", "target": "theo",  "value": 9 },
    { "source": "priya", "target": "sofia", "value": 8 },
    { "source": "priya", "target": "rui",   "value": 6 },
    { "source": "priya", "target": "zara",  "value": 5 },
    { "source": "priya", "target": "marco", "value": 6 },
    { "source": "marco", "target": "ana",   "value": 5 },
    { "source": "marco", "target": "dev",   "value": 4 },
    { "source": "lena",  "target": "yuki",  "value": 4 },
    { "source": "lena",  "target": "emma",  "value": 5 },
    { "source": "lena",  "target": "mila",  "value": 3 },
    { "source": "theo",  "target": "ana",   "value": 7 },
    { "source": "theo",  "target": "yuki",  "value": 6 },
    { "source": "theo",  "target": "kira",  "value": 5 },
    { "source": "ana",   "target": "omar",  "value": 4 },
    { "source": "yuki",  "target": "omar",  "value": 3 },
    { "source": "sofia", "target": "dev",   "value": 9 },
    { "source": "sofia", "target": "kira",  "value": 7 },
    { "source": "sofia", "target": "mateo", "value": 6 },
    { "source": "sofia", "target": "nadia", "value": 7 },
    { "source": "dev",   "target": "ivan",  "value": 5 },
    { "source": "dev",   "target": "rui",   "value": 4 },
    { "source": "kira",  "target": "nadia", "value": 5 },
    { "source": "mateo", "target": "ivan",  "value": 4 },
    { "source": "nadia", "target": "noah",  "value": 4 },
    { "source": "rui",   "target": "emma",  "value": 7 },
    { "source": "rui",   "target": "noah",  "value": 5 },
    { "source": "emma",  "target": "zara",  "value": 4 },
    { "source": "zara",  "target": "leo",   "value": 6 },
    { "source": "zara",  "target": "mila",  "value": 5 },
    { "source": "leo",   "target": "mila",  "value": 4 },
    { "source": "mila",  "target": "omar",  "value": 3 }
  ]
}`,
  },
  {
    key: "services",
    name: "Service Mesh",
    schema: "nodes + links",
    text: `{
  "nodes": [
    { "id": "cdn",         "group": "edge",    "value": 5 },
    { "id": "gateway",     "group": "edge",    "value": 9 },
    { "id": "web-bff",     "group": "edge",    "value": 6 },
    { "id": "mobile-bff",  "group": "edge",    "value": 5 },
    { "id": "auth",        "group": "core",    "value": 8 },
    { "id": "users",       "group": "core",    "value": 7 },
    { "id": "orders",      "group": "core",    "value": 8 },
    { "id": "payments",    "group": "core",    "value": 7 },
    { "id": "catalog",     "group": "core",    "value": 6 },
    { "id": "search",      "group": "core",    "value": 5 },
    { "id": "inventory",   "group": "core",    "value": 5 },
    { "id": "shipping",    "group": "core",    "value": 4 },
    { "id": "notify",      "group": "core",    "value": 4 },
    { "id": "postgres",    "group": "data",    "value": 8 },
    { "id": "redis",       "group": "data",    "value": 6 },
    { "id": "kafka",       "group": "data",    "value": 7 },
    { "id": "elastic",     "group": "data",    "value": 4 },
    { "id": "prometheus",  "group": "ops",     "value": 4 },
    { "id": "grafana",     "group": "ops",     "value": 3 },
    { "id": "vault",       "group": "ops",     "value": 4 }
  ],
  "links": [
    { "source": "cdn",        "target": "gateway",    "value": 9 },
    { "source": "gateway",    "target": "web-bff",    "value": 7 },
    { "source": "gateway",    "target": "mobile-bff", "value": 6 },
    { "source": "gateway",    "target": "auth",       "value": 8 },
    { "source": "web-bff",    "target": "catalog",    "value": 6 },
    { "source": "web-bff",    "target": "search",     "value": 5 },
    { "source": "web-bff",    "target": "orders",     "value": 6 },
    { "source": "mobile-bff", "target": "catalog",    "value": 5 },
    { "source": "mobile-bff", "target": "orders",     "value": 5 },
    { "source": "auth",       "target": "users",      "value": 8 },
    { "source": "auth",       "target": "redis",      "value": 6 },
    { "source": "auth",       "target": "vault",      "value": 5 },
    { "source": "users",      "target": "postgres",   "value": 7 },
    { "source": "orders",     "target": "payments",   "value": 8 },
    { "source": "orders",     "target": "inventory",  "value": 6 },
    { "source": "orders",     "target": "postgres",   "value": 7 },
    { "source": "orders",     "target": "kafka",      "value": 6 },
    { "source": "payments",   "target": "vault",      "value": 6 },
    { "source": "payments",   "target": "kafka",      "value": 5 },
    { "source": "catalog",    "target": "postgres",   "value": 6 },
    { "source": "catalog",    "target": "redis",      "value": 5 },
    { "source": "search",     "target": "elastic",    "value": 7 },
    { "source": "search",     "target": "kafka",      "value": 4 },
    { "source": "inventory",  "target": "postgres",   "value": 5 },
    { "source": "inventory",  "target": "kafka",      "value": 4 },
    { "source": "shipping",   "target": "kafka",      "value": 5 },
    { "source": "shipping",   "target": "orders",     "value": 4 },
    { "source": "notify",     "target": "kafka",      "value": 6 },
    { "source": "prometheus", "target": "grafana",    "value": 6 },
    { "source": "prometheus", "target": "gateway",    "value": 3 },
    { "source": "prometheus", "target": "kafka",      "value": 3 }
  ]
}`,
  },
  {
    key: "forest",
    name: "Old-Growth Web",
    schema: "nested tree",
    text: `{
  "Old-Growth Forest": {
    "Canopy": {
      "Douglas Fir": { "eagle nest": 3, "lichen": 5, "bark beetle": 2 },
      "Red Alder": { "nitrogen fix": 6, "caterpillars": 4 },
      "Bigleaf Maple": { "epiphytes": 5, "aphids": 3 }
    },
    "Understory": {
      "Vine Maple": { "saplings": 3 },
      "Pacific Rhododendron": { "pollinators": 4 },
      "Salal": { "berries": 6 }
    },
    "Forest Floor": {
      "Mycelial Network": { "hyphae": 9, "truffles": 4, "carbon trade": 7 },
      "Ferns": { "spores": 4 },
      "Beetles": { "decomposition": 6 },
      "Banana Slug": { "seed dispersal": 3 }
    },
    "Riparian": {
      "Cedar": { "salmon shade": 5 },
      "Stream": { "salmon run": 7, "macroinvertebrates": 5 },
      "Bear": { "nutrient pump": 6 }
    }
  }
}`,
  },
  {
    key: "signals",
    name: "Signal Flow",
    schema: "adjacency map",
    text: `{
  "synth A":   ["mixer", { "target": "delay", "weight": 3 }],
  "synth B":   ["mixer", { "target": "reverb", "weight": 2 }],
  "drums":     [{ "target": "compressor", "weight": 5 }, "mixer"],
  "bass":      [{ "target": "compressor", "weight": 4 }, "mixer"],
  "vocals":    [{ "target": "reverb", "weight": 4 }, { "target": "compressor", "weight": 3 }, "mixer"],
  "guitar":    ["delay", "mixer"],
  "mixer":     [{ "target": "master bus", "weight": 6 }],
  "delay":     ["mixer"],
  "reverb":    ["mixer"],
  "compressor":["mixer"],
  "master bus":["limiter"],
  "limiter":   [{ "target": "speakers", "weight": 5 }]
}`,
  },
];
