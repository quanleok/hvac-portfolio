export type ServiceKey = "ac-repair" | "furnace-repair" | "system-install" | "tune-up";
export type CityKey =
  | "oklahoma-city"
  | "edmond"
  | "moore"
  | "norman"
  | "yukon"
  | "mustang"
  | "midwest-city"
  | "del-city";

export const cities: Record<CityKey, { name: string; landmark: string }> = {
  "oklahoma-city": {
    name: "Oklahoma City",
    landmark: "From Bricktown to the Paseo to Capitol Hill, we know the city.",
  },
  edmond: {
    name: "Edmond",
    landmark: "From the UCO area to Coffee Creek to the lake-side neighborhoods.",
  },
  moore: {
    name: "Moore",
    landmark: "From the I-35 corridor to the older streets around Central.",
  },
  norman: {
    name: "Norman",
    landmark: "From Campus Corner to Brookhaven to the lake-side homes.",
  },
  yukon: {
    name: "Yukon",
    landmark: "From Mustang Road to Czech Hall to the new builds west of town.",
  },
  mustang: {
    name: "Mustang",
    landmark: "From the schools area to the newer subdivisions west of town.",
  },
  "midwest-city": {
    name: "Midwest City",
    landmark: "From the Tinker AFB neighborhoods to Soldier Creek to Reno.",
  },
  "del-city": {
    name: "Del City",
    landmark: "From Sooner Road over to Sunnylane and Vickie Drive.",
  },
};

export const services: Record<
  ServiceKey,
  {
    name: string;
    short: string;
    eyebrow: string;
    tone: "cooling" | "heating" | "replacement" | "maintenance";
    intro: string;
    problems: string[];
    fixes: string[];
    included: string[];
    cta: string;
    priceHint: string;
  }
> = {
  "ac-repair": {
    name: "AC repair",
    short: "AC repair",
    eyebrow: "Cooling",
    tone: "cooling",
    intro:
      "When the AC quits in the middle of an Oklahoma summer, you don't have time for a sales pitch. We come out, find what's actually wrong, and tell you straight what it costs to fix.",
    problems: [
      "AC running but not cooling",
      "Outdoor unit not turning on",
      "Frozen evaporator coil",
      "Refrigerant leak suspected",
      "Loud or unusual noises",
      "Thermostat not responding",
    ],
    fixes: [
      "Capacitor and contactor replacement",
      "Refrigerant leak detection and recharge",
      "Coil and condenser cleaning",
      "Compressor diagnostics",
      "Blower motor service",
      "Thermostat troubleshooting",
    ],
    included: [
      "On-site diagnostic with a real price quote before any work",
      "Most common parts on the truck — usually one trip",
      "30-day workmanship guarantee on completed repairs",
      "Honest call on whether repair or replace makes sense",
    ],
    cta: "AC out? Call (405) 361-5014",
    priceHint: "Most AC repairs land between $150 and $600.",
  },
  "furnace-repair": {
    name: "Furnace & heat repair",
    short: "Furnace repair",
    eyebrow: "Heating",
    tone: "heating",
    intro:
      "Furnace won't start on a cold snap. We service gas, electric, and heat pump systems. Most repairs we knock out the same visit so your home doesn't go cold overnight.",
    problems: [
      "Furnace won't ignite or stay lit",
      "Pilot light keeps going out",
      "Heat pump not switching to heat",
      "Cold air blowing instead of warm",
      "Strange smells when furnace runs",
      "Short cycling on and off",
    ],
    fixes: [
      "Igniter and flame sensor replacement",
      "Heat exchanger inspection",
      "Blower motor and capacitor service",
      "Heat pump reversing valve diagnostics",
      "Gas valve and pressure adjustments",
      "Limit switch and safety control replacement",
    ],
    included: [
      "Safety check on every furnace visit, no extra charge",
      "Carbon-monoxide check around the unit",
      "Real time window for arrival, not 'all day'",
      "Same tech from diagnostic through repair",
    ],
    cta: "Furnace down? Call (405) 361-5014",
    priceHint: "Most furnace repairs land between $200 and $700.",
  },
  "system-install": {
    name: "New system install",
    short: "HVAC installation",
    eyebrow: "Replacement",
    tone: "replacement",
    intro:
      "If your unit's on its last leg, we'll walk you through what fits your home and your budget. No upsell, no scare tactics. We size the system for the actual square footage, not the biggest invoice.",
    problems: [
      "AC over 12 years old and failing",
      "System still uses R-22 refrigerant",
      "Repair quote near half the cost of new",
      "Energy bills climbing every summer",
      "Some rooms never cool down",
      "Furnace heat exchanger cracked",
    ],
    fixes: [
      "AC condenser + matched coil replacement",
      "Full furnace + AC system swap",
      "Heat pump conversion",
      "Mini-split installation for additions",
      "Smart thermostat included on most installs",
      "Removal and disposal of old equipment",
    ],
    included: [
      "Manual J load calc — right-sized for your home",
      "Up-front price on the system + install, no surprises",
      "Workmanship guarantee on every install",
      "We explain the SEER2 and what it actually means for your bill",
    ],
    cta: "Get a real install quote · (405) 361-5014",
    priceHint: "Residential installs start at $4,999 and typically run $4,999–$12,000; light-commercial quoted on-site.",
  },
  "tune-up": {
    name: "Seasonal tune-ups",
    short: "HVAC tune-up",
    eyebrow: "Maintenance",
    tone: "maintenance",
    intro:
      "A spring AC check and a fall furnace check catches problems early — before they leave you without heat or cooling on the worst day. Most tune-ups take under an hour.",
    problems: [
      "Filter hasn't been changed in months",
      "Outdoor coil packed with dust and grass",
      "System struggling more than last year",
      "Trying to keep an older unit running",
      "Just bought the home and want a baseline",
      "Energy bill creeping up",
    ],
    fixes: [
      "Filter replacement and airflow check",
      "Outdoor coil clean and rinse",
      "Refrigerant level verification",
      "Electrical connection tightening",
      "Capacitor and contactor inspection",
      "Thermostat calibration",
    ],
    included: [
      "Multi-point inspection report so you know what's coming",
      "Heads-up on parts likely to fail in the next year",
      "No upsell pressure — just facts",
      "Bundle pricing if you do spring + fall together",
    ],
    cta: "Book a tune-up · (405) 361-5014",
    priceHint: "Single-system tune-ups typically $89–$129.",
  },
};

export const serviceKeys = Object.keys(services) as ServiceKey[];
export const cityKeys = Object.keys(cities) as CityKey[];
