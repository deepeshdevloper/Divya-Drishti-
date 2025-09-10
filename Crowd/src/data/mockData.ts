import { Zone, EvacuationRoute } from '../types';

// Ujjain coordinates and zones for Divya Drishti (दिव्य  दृष्टि)
export const UJJAIN_CENTER: [number, number] = [23.1765, 75.7885];

export const MOCK_ZONES: Zone[] = [
  {
    id: 'ram-ghat',
    name: 'Ram Ghat',
    coordinates: [
      [23.1770, 75.7890],
      [23.1775, 75.7895],
      [23.1780, 75.7890],
      [23.1775, 75.7885],
    ],
    current_count: 245,
    capacity: 500,
    status: 'safe',
    last_updated: new Date().toISOString(),
  },
  {
    id: 'mahakal-ghat',
    name: 'Mahakal Ghat',
    coordinates: [
      [23.1760, 75.7880],
      [23.1765, 75.7885],
      [23.1770, 75.7880],
      [23.1765, 75.7875],
    ],
    current_count: 720,
    capacity: 800,
    status: 'moderate',
    last_updated: new Date().toISOString(),
  },
  {
    id: 'bhairav-ghat',
    name: 'Bhairav Ghat',
    coordinates: [
      [23.1750, 75.7870],
      [23.1755, 75.7875],
      [23.1760, 75.7870],
      [23.1755, 75.7865],
    ],
    current_count: 850,
    capacity: 900,
    status: 'moderate',
    last_updated: new Date().toISOString(),
  },
  {
    id: 'narsingh-ghat',
    name: 'Narsingh Ghat',
    coordinates: [
      [23.1740, 75.7860],
      [23.1745, 75.7865],
      [23.1750, 75.7860],
      [23.1745, 75.7855],
    ],
    current_count: 180,
    capacity: 600,
    status: 'safe',
    last_updated: new Date().toISOString(),
  },
  {
    id: 'kshipra-ghat',
    name: 'Kshipra Ghat',
    coordinates: [
      [23.1780, 75.7900],
      [23.1785, 75.7905],
      [23.1790, 75.7900],
      [23.1785, 75.7895],
    ],
    current_count: 420,
    capacity: 700,
    status: 'moderate',
    last_updated: new Date().toISOString(),
  },
];

export const EVACUATION_ROUTES: EvacuationRoute[] = [
  {
    id: 'bhairav-to-narsingh',
    from_zone: 'bhairav-ghat',
    to_zone: 'narsingh-ghat',
    path: [
      [23.1755, 75.7870],
      [23.1750, 75.7865],
      [23.1745, 75.7860],
    ],
    estimated_time: 5,
    status: 'recommended',
  },
  {
    id: 'mahakal-to-kshipra',
    from_zone: 'mahakal-ghat',
    to_zone: 'kshipra-ghat',
    path: [
      [23.1765, 75.7880],
      [23.1770, 75.7885],
      [23.1775, 75.7890],
      [23.1780, 75.7895],
    ],
    estimated_time: 7,
    status: 'active',
  },
  {
    id: 'ram-to-exit',
    from_zone: 'ram-ghat',
    to_zone: 'exit-point-1',
    path: [
      [23.1775, 75.7890],
      [23.1780, 75.7895],
      [23.1785, 75.7900],
    ],
    estimated_time: 3,
    status: 'active',
  },
];