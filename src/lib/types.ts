import type { Layer } from 'leaflet';
import type * as L from 'leaflet';

/** A single kabupaten/kota entry used in the quiz queue and sidebar list */
export interface SubdivisionItem{
  id:   string;
  name: string;
}

export interface SubdivisionLayer extends Layer {
  feature: {
    properties: {
      id:   string;
      name: string;
    };
  };
  _tooltipBound?: boolean;
  getBounds():                                      L.LatLngBounds;
  setStyle(style: L.PathOptions):                   void;
  bindTooltip(content: string, opts?: L.TooltipOptions): this;
  unbindTooltip():                                  this;
  closeTooltip():                                   this;
}

export type LayersById = Record<string, SubdivisionLayer>;

export type ProvincesData = Record<string, GeoJSON.FeatureCollection>;

export type AppMode = 'explore' | 'quiz' | 'typing';

export type FeedbackClass = 'correct' | 'wrong' | 'skip' | '';

export type RippleVariant = 'gold' | 'teal' | 'rust';

export interface HoverPayload {
  feature:  SubdivisionLayer['feature'];
  layer:    SubdivisionLayer;
  entering: boolean;
}

export interface ClickPayload {
  feature: SubdivisionLayer['feature'];
  layer:   SubdivisionLayer;
}

export interface SidebarHoverPayload {
  id:       string;
  entering: boolean;
}
