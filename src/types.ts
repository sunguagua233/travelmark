export interface Group {
  id: number;
  name: string;
  created_at: string;
}

export interface Itinerary {
  id: number;
  group_id: number | null;
  name: string;
  description: string | null;
  created_at: string;
  markers?: Marker[];
}

export type MarkerType = 'itinerary' | 'favorite';

export interface Attachment {
  id: number;
  marker_id: number;
  url: string;
}

export interface Marker {
  id: number;
  itinerary_id: number;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  type: MarkerType;
  category: string | null;
  style: string | null; // JSON string or simple string for color/icon
  notes: string | null;
  order_index: number;
  created_at: string;
  attachments?: Attachment[];
}

export interface POI {
  name: string;
  address: string;
  lat: number;
  lng: number;
}
