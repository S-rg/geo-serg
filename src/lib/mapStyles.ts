import type { PathOptions } from 'leaflet';

export type StyleKey =
  | 'exploreDefault'
  | 'exploreHover'
  | 'explorePulse'
  | 'quizDefault'
  | 'quizHover'
  | 'quizWrong'
  | 'quizReveal'
  | 'completed';

export const STYLE: Record<StyleKey, PathOptions> = {
  exploreDefault: { color: '#CB9B3E', weight: 1.2, fillColor: '#3E6E8E', fillOpacity: 0.32 },
  exploreHover:   { color: '#4FA593', weight: 2.2, fillColor: '#4FA593', fillOpacity: 0.55 },
  explorePulse:   { color: '#E3BA66', weight: 3,   fillColor: '#CB9B3E', fillOpacity: 0.70 },
  quizDefault:    { color: '#23495D', weight: 1,   fillColor: '#3E6E8E', fillOpacity: 0.22 },
  quizHover:      { color: '#9FB6C2', weight: 1.4, fillColor: '#3E6E8E', fillOpacity: 0.34 },
  quizWrong:      { color: '#C1543D', weight: 2.4, fillColor: '#C1543D', fillOpacity: 0.65 },
  quizReveal:     { color: '#E3BA66', weight: 2.6, fillColor: '#CB9B3E', fillOpacity: 0.70 },
  completed:      { color: '#5B7A86', weight: 0.6, fillColor: '#2E7D6B', fillOpacity: 0.25 },
};
