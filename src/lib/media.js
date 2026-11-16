// Photo and icon choices from design/LandEase design system.png ("Imagery — where each supplied photo is used").
// Listings have no images in the API, so covers are chosen by destination country, then category.
import {
  Home, Bus, Scale, Briefcase, GraduationCap, Utensils, Landmark, Map, Shapes,
} from 'lucide-react';

export const IMG = {
  alpineAerial: '/images/alpine-aerial.jpg',
  airportBoard: '/images/airport-board.jpg',
  surfBeach: '/images/surf-beach.jpg',
  tokyoTower: '/images/tokyo-tower.jpg',
  kyotoStreet: '/images/kyoto-street.jpg',
  alpineLake: '/images/alpine-lake.jpg',
  securityOfficer: '/images/security-officer.jpg',
  padlock: '/images/padlock.png',
  sunsetHiker: '/images/sunset-hiker.jpg',
  balloon: '/images/balloon.jpg',
  aiHead: '/images/ai-head.jpg',
  holoWave: '/images/holographic-wave.jpg',
  holoLiquid: '/images/holographic-liquid.jpg',
};

const COUNTRY_COVERS = [
  [/austral/i, IMG.surfBeach],
  [/canad/i, IMG.alpineAerial],
  [/\b(uk|united kingdom|england|britain)\b/i, IMG.airportBoard],
  [/japan|tokyo/i, IMG.tokyoTower],
  [/german/i, IMG.alpineLake],
  [/new ?zealand/i, IMG.alpineLake],
];

export function coverFor(country) {
  const hit = COUNTRY_COVERS.find(([re]) => re.test(country || ''));
  return hit ? hit[1] : IMG.airportBoard;
}

export const CATEGORY_ICONS = {
  Accommodation: Home, Transport: Bus, Legal: Scale, Jobs: Briefcase, Education: GraduationCap,
  Food: Utensils, Banking: Landmark, CityOrientation: Map, Other: Shapes,
};

// Local emergency numbers by destination country (shown on SOS; falls back to generic copy).
const EMERGENCY = [
  [/austral/i, '000'], [/new ?zealand/i, '111'], [/\b(uk|united kingdom|england|britain)\b/i, '999'],
  [/canad|united states|\busa?\b/i, '911'], [/japan/i, '119'],
  [/german|france|spain|ital|portugal|netherland|ireland|europe/i, '112'],
];
export function emergencyNumber(country) {
  const hit = EMERGENCY.find(([re]) => re.test(country || ''));
  return hit ? hit[1] : null;
}
