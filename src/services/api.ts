import { Group, Itinerary, Marker } from "../types";

const API_BASE = "/api";

export const api = {
  groups: {
    list: () => fetch(`${API_BASE}/groups`).then(res => res.json() as Promise<Group[]>),
    create: (name: string) => fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    }).then(res => res.json() as Promise<Group>),
  },
  itineraries: {
    list: () => fetch(`${API_BASE}/itineraries`).then(res => res.json() as Promise<Itinerary[]>),
    get: (id: number) => fetch(`${API_BASE}/itineraries/${id}`).then(res => res.json() as Promise<Itinerary>),
    create: (name: string, group_id: number | null) => fetch(`${API_BASE}/itineraries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, group_id })
    }).then(res => res.json() as Promise<Itinerary>),
  },
  markers: {
    create: (marker: Partial<Marker> & { attachments?: string[] }) => fetch(`${API_BASE}/markers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(marker)
    }).then(res => res.json()),
    update: (id: number, marker: Partial<Marker> & { attachments?: string[] }) => fetch(`${API_BASE}/markers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(marker)
    }).then(res => res.json()),
    delete: (id: number) => fetch(`${API_BASE}/markers/${id}`, {
      method: 'DELETE'
    }).then(res => res.json()),
    bulkUpdate: (markers: { id: number, order_index: number }[]) => fetch(`${API_BASE}/markers/bulk`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markers })
    }).then(res => res.json()),
  }
};
