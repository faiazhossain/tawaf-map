import type { Gate } from "@/types/gate";

/**
 * Haram gate data with accurate coordinates
 * Coordinates are in [longitude, latitude] format for GeoJSON/MapLibre
 */
export const HARAM_GATES: Gate[] = [
  // King Fahd Expansion Gates (Eastern Side)
  {
    id: "king-fahd-1",
    name: "King Fahd Gate 1",
    nameAr: "باب الملك فهد ١",
    location: {
      coordinates: [39.8361, 21.4239],
    },
    type: "king_fahd",
    facilities: ["escalator", "elevator", "restroom", "wheelchair"],
    nearestLandmarks: ["King Fahd Portico", "Safa Marwa"],
  },
  {
    id: "king-fahd-2",
    name: "King Fahd Gate 2",
    nameAr: "باب الملك فهد ٢",
    location: {
      coordinates: [39.8378, 21.4245],
    },
    type: "king_fahd",
    facilities: ["escalator", "elevator", "restroom", "wheelchair"],
    nearestLandmarks: ["King Fahd Portico", "Mas'a"],
  },
  {
    id: "king-fahd-3",
    name: "King Fahd Gate 3",
    nameAr: "باب الملك فهد ٣",
    location: {
      coordinates: [39.8392, 21.4251],
    },
    type: "king_fahd",
    facilities: ["escalator", "elevator", "restroom", "wheelchair"],
    nearestLandmarks: ["King Fahd Portico", "Marwa"],
  },

  // Umrah Gates (Southern Side)
  {
    id: "umrah-abdul-aziz",
    name: "Abdul Aziz Gate (Umrah)",
    nameAr: "باب عبد العزيز",
    location: {
      coordinates: [39.8245, 21.4198],
    },
    type: "umrah",
    facilities: ["escalator", "elevator", "restroom", "wheelchair", "vending"],
    nearestLandmarks: ["Ibrahim Al-Khalil Street", "Clock Tower"],
  },
  {
    id: "umrah-fahd",
    name: "Fahd Gate (Umrah)",
    nameAr: "باب فهد",
    location: {
      coordinates: [39.8228, 21.4205],
    },
    type: "umrah",
    facilities: ["escalator", "elevator", "restroom", "wheelchair"],
    nearestLandmarks: ["Ibrahim Al-Khalil Street", "Hilton Hotel"],
  },
  {
    id: "umrah-umar",
    name: "Umar Gate (Umrah)",
    nameAr: "باب عمر",
    location: {
      coordinates: [39.8212, 21.4212],
    },
    type: "umrah",
    facilities: ["escalator", "restroom", "wheelchair"],
    nearestLandmarks: ["Umar Bin Al-Khattab Street"],
  },
  {
    id: "umrah-salman",
    name: "Salman Al-Farsi Gate",
    nameAr: "باب سلمان الفارسي",
    location: {
      coordinates: [39.8198, 21.4219],
    },
    type: "umrah",
    facilities: ["escalator", "restroom"],
    nearestLandmarks: ["Salman Al-Farsi Street"],
  },
  {
    id: "umrah-ali",
    name: "Ali Gate (Umrah)",
    nameAr: "باب علي",
    location: {
      coordinates: [39.8185, 21.4226],
    },
    type: "umrah",
    facilities: ["escalator", "restroom"],
    nearestLandmarks: ["Ali Bin Abi Talib Street"],
  },
  {
    id: "umrah-wahab",
    name: "Abdul Wahab Gate",
    nameAr: "باب عبد الوهاب",
    location: {
      coordinates: [39.8172, 21.4233],
    },
    type: "umrah",
    facilities: ["escalator", "restroom"],
    nearestLandmarks: ["Muhammad Ibn Abdul Wahab Street"],
  },

  // Prayer/Salah Gates (Northern/Western Side)
  {
    id: "salah-mahmoud",
    name: "Al-Mahmoud Gate",
    nameAr: "باب المحمود",
    location: {
      coordinates: [39.8268, 21.4272],
    },
    type: "salah",
    facilities: ["escalator", "elevator", "restroom", "wheelchair"],
    nearestLandmarks: ["Al-Mahmoud Street"],
  },
  {
    id: "salah-nabawi",
    name: "An-Nabawi Gate",
    nameAr: "باب النبوي",
    location: {
      coordinates: [39.8251, 21.4278],
    },
    type: "salah",
    facilities: ["escalator", "restroom"],
    nearestLandmarks: ["Al-Nabawi Gate Area"],
  },
  {
    id: "salah-omar",
    name: "Omar Bin Khattab Gate",
    nameAr: "باب عمر بن الخطاب",
    location: {
      coordinates: [39.8235, 21.4284],
    },
    type: "salah",
    facilities: ["escalator", "restroom"],
    nearestLandmarks: ["Omar Bin Khattab Street"],
  },
  {
    id: "salah-abubakr",
    name: "Abu Bakr Gate",
    nameAr: "باب أبو بكر",
    location: {
      coordinates: [39.8285, 21.4266],
    },
    type: "salah",
    facilities: ["escalator", "restroom"],
    nearestLandmarks: ["Abu Bakr As-Siddiq Street"],
  },
  {
    id: "salah-utbah",
    name: "Utbah Bin Rabiah Gate",
    nameAr: "باب عتبة بن ربيعة",
    location: {
      coordinates: [39.8298, 21.4259],
    },
    type: "salah",
    facilities: ["restroom"],
    nearestLandmarks: ["Utbah Bin Rabiah Street"],
  },
  {
    id: "salah-ruqai",
    name: "Ar-Ruqai Gate",
    nameAr: "باب الرقاعي",
    location: {
      coordinates: [39.8311, 21.4252],
    },
    type: "salah",
    facilities: ["restroom"],
    nearestLandmarks: ["Ar-Ruqai Street"],
  },
  {
    id: "salah-khattab",
    name: "Al-Khattab Gate",
    nameAr: "باب الخطاب",
    location: {
      coordinates: [39.8324, 21.4245],
    },
    type: "salah",
    facilities: ["escalator", "restroom"],
    nearestLandmarks: ["Al-Khattab Street"],
  },

  // Additional Gates
  {
    id: "safa",
    name: "As-Safa Gate",
    nameAr: "باب الصفا",
    location: {
      coordinates: [39.8355, 21.4231],
    },
    type: "salah",
    facilities: ["escalator", "elevator", "restroom"],
    nearestLandmarks: ["As-Safa Hill", "Mas'a Start"],
  },
  {
    id: "marwa",
    name: "Al-Marwa Gate",
    nameAr: "باب المروة",
    location: {
      coordinates: [39.8388, 21.4258],
    },
    type: "salah",
    facilities: ["escalator", "elevator", "restroom"],
    nearestLandmarks: ["Al-Marwa Hill", "Mas'a End"],
  },
  {
    id: "ajyad",
    name: "Ajyad Gate",
    nameAr: "باب أجياد",
    location: {
      coordinates: [39.8415, 21.4235],
    },
    type: "salah",
    facilities: ["escalator", "restroom"],
    nearestLandmarks: ["Ajyad Street", "Ajyad Hospital"],
  },
];

/**
 * Get gate by ID
 */
export function getGateById(id: string): Gate | undefined {
  return HARAM_GATES.find((gate) => gate.id === id);
}

/**
 * Get gates by type
 */
export function getGatesByType(type: Gate["type"]): Gate[] {
  return HARAM_GATES.filter((gate) => gate.type === type);
}

/**
 * Find nearest gates to a given location
 */
export function findNearestGates(
  lat: number,
  lon: number,
  count = 5
): Array<{ gate: Gate; distance: number }> {
  const gatesWithDistance = HARAM_GATES.map((gate) => ({
    gate,
    distance:
      Math.sqrt(
        Math.pow(lat - gate.location.coordinates[1], 2) +
          Math.pow(lon - gate.location.coordinates[0], 2)
      ) * 111000, // Approximate conversion to meters
  }));

  return gatesWithDistance.sort((a, b) => a.distance - b.distance).slice(0, count);
}
