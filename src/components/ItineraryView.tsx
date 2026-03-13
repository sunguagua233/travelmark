import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker as LeafletMarker, Popup, useMap, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import { Itinerary, Marker, POI } from '../types';
import { ArrowLeft, Search, Plus, MapPin, Navigation, Star, Image as ImageIcon, X, Save, Trash2, Layers, ExternalLink, List as ListIcon, GripVertical, Maximize, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createFavIcon = (style: string = '⭐', name: string = '') => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="flex flex-col items-center">
      <div class="w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 border-primary shadow-lg text-xl">
        ${style}
      </div>
      <div class="mt-1 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-primary/10 whitespace-nowrap">
        <span class="text-[10px] font-bold text-primary">${name}</span>
      </div>
    </div>`,
    iconSize: [100, 64],
    iconAnchor: [50, 40],
  });
};

const createNumIcon = (num: number, name: string = '') => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="flex flex-col items-center">
      <div class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold border-2 border-white shadow-lg text-lg">${num}</div>
      <div class="mt-1 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-primary/10 whitespace-nowrap">
        <span class="text-[10px] font-bold text-primary">${name}</span>
      </div>
    </div>`,
    iconSize: [100, 64],
    iconAnchor: [50, 40],
  });
};

function MapController({ markers }: { markers: Marker[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [100, 100] });
    }
  }, [markers, map]);

  return null;
}

function MapEvents({ onContextMenu }: { onContextMenu: (latlng: L.LatLng) => void }) {
  useMapEvents({
    contextmenu: (e) => {
      onContextMenu(e.latlng);
    },
  });
  return null;
}

export default function ItineraryView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [map, setMap] = useState<L.Map | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<POI[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [editingMarker, setEditingMarker] = useState<Partial<Marker> | null>(null);
  const [viewingMarker, setViewingMarker] = useState<Marker | null>(null);
  const [showRoute, setShowRoute] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (id) loadItinerary();
  }, [id]);

  const loadItinerary = async () => {
    const data = await api.itineraries.get(Number(id));
    setItinerary(data);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsListOpen(false);
    // Mock POI search using Nominatim (OpenStreetMap)
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1`);
    const data = await res.json();
    const pois = data.map((item: any) => ({
      name: item.display_name.split(',')[0],
      address: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon)
    }));
    setSearchResults(pois);
  };

  const handlePoiClick = (poi: POI) => {
    setSelectedPoi(poi);
    setIsDrawerOpen(true);
    setIsListOpen(false);
    setSearchResults([]);
  };

  const handleAddMarker = () => {
    if (!selectedPoi) return;
    setEditingMarker({
      itinerary_id: Number(id),
      name: selectedPoi.name,
      address: selectedPoi.address,
      lat: selectedPoi.lat,
      lng: selectedPoi.lng,
      type: 'itinerary',
      category: '景点',
      style: '📍',
      notes: '',
      order_index: (itinerary?.markers?.length || 0) + 1,
      attachments: []
    });
    setIsEditorOpen(true);
    setIsDrawerOpen(false);
  };

  const handleSaveMarker = async () => {
    if (!editingMarker) return;
    
    // Prepare data for API
    const markerData = {
      ...editingMarker,
      attachments: editingMarker.attachments?.map(a => a.url) || []
    };

    if (editingMarker.id) {
      await api.markers.update(editingMarker.id, markerData);
    } else {
      await api.markers.create(markerData);
    }
    setIsEditorOpen(false);
    setEditingMarker(null);
    loadItinerary();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setEditingMarker(prev => {
        if (!prev) return prev;
        const currentAttachments = prev.attachments || [];
        return {
          ...prev,
          attachments: [...currentAttachments, { id: Date.now(), marker_id: prev.id || 0, url: base64String }]
        };
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = (idx: number) => {
    setEditingMarker(prev => {
      if (!prev) return prev;
      const currentAttachments = [...(prev.attachments || [])];
      currentAttachments.splice(idx, 1);
      return { ...prev, attachments: currentAttachments };
    });
  };

  const handleDeleteMarker = async (markerId: number) => {
    if (!confirm('确定删除该标记点吗？')) return;
    await api.markers.delete(markerId);
    loadItinerary();
    setIsEditorOpen(false);
    setIsDetailOpen(false);
    setEditingMarker(null);
    setViewingMarker(null);
  };

  const handleReorder = async (newOrder: Marker[]) => {
    if (!itinerary) return;
    
    // Update local state immediately for smooth UI
    const updatedMarkers = itinerary.markers.map(m => {
      if (m.type !== 'itinerary') return m;
      const index = newOrder.findIndex(nm => nm.id === m.id);
      return { ...m, order_index: index + 1 };
    });
    
    setItinerary({ ...itinerary, markers: updatedMarkers });

    // Sync with backend
    const bulkData = newOrder.map((m, idx) => ({
      id: m.id!,
      order_index: idx + 1
    }));
    await api.markers.bulkUpdate(bulkData);
    loadItinerary();
  };

  const handleFitBounds = () => {
    if (map && itinerary?.markers && itinerary.markers.length > 0) {
      const bounds = L.latLngBounds(itinerary.markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [100, 100] });
    }
    setIsMenuOpen(false);
  };

  const itineraryMarkers = itinerary?.markers?.filter(m => m.type === 'itinerary') || [];
  const favoriteMarkers = itinerary?.markers?.filter(m => m.type === 'favorite') || [];
  const routePoints = itineraryMarkers.map(m => [m.lat, m.lng] as [number, number]);

  return (
    <div className="h-screen flex flex-col relative overflow-hidden font-pingfang">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-[1000] p-4 flex items-center gap-3 pointer-events-none">
        <button 
          onClick={() => navigate('/')}
          className="pointer-events-auto p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg hover:bg-primary hover:text-white transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 pointer-events-auto relative">
          <input 
            type="text"
            placeholder="搜索地点..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full p-3 pl-12 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg outline-none focus:ring-2 ring-primary/20"
          />
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="relative pointer-events-auto">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              "p-3 rounded-2xl shadow-lg transition-all backdrop-blur-md",
              isMenuOpen ? "bg-primary text-white" : "bg-white/90 text-gray-700"
            )}
          >
            <MoreVertical size={20} />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 flex flex-col gap-2 z-[1001]"
              >
                <button 
                  onClick={handleFitBounds}
                  className="p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg hover:bg-primary hover:text-white transition-all text-gray-700 flex items-center justify-center"
                  title="缩放至全览"
                >
                  <Maximize size={20} />
                </button>
                <button 
                  onClick={() => {
                    setShowRoute(!showRoute);
                    setIsMenuOpen(false);
                  }}
                  className={cn(
                    "p-3 rounded-2xl shadow-lg transition-all backdrop-blur-md flex items-center justify-center",
                    showRoute ? "bg-primary text-white" : "bg-white/95 text-gray-700"
                  )}
                  title="显示路线"
                >
                  <Layers size={20} />
                </button>
                <button 
                  onClick={() => {
                    setIsListOpen(!isListOpen);
                    setIsMenuOpen(false);
                  }}
                  className={cn(
                    "p-3 rounded-2xl shadow-lg transition-all backdrop-blur-md flex items-center justify-center",
                    isListOpen ? "bg-primary text-white" : "bg-white/95 text-gray-700"
                  )}
                  title="行程列表"
                >
                  <ListIcon size={20} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 z-0">
        <MapContainer 
          center={[39.9042, 116.4074]} 
          zoom={13} 
          className="h-full w-full"
          zoomControl={false}
          ref={setMap}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapController markers={itinerary?.markers || []} />
          <MapEvents 
            onContextMenu={(latlng) => {
              setSelectedPoi({ name: '自定义位置', address: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`, lat: latlng.lat, lng: latlng.lng });
              setIsDrawerOpen(true);
            }}
          />

          {itineraryMarkers.map((m, idx) => (
            <LeafletMarker 
              key={m.id} 
              position={[m.lat, m.lng]} 
              icon={createNumIcon(idx + 1, m.name)}
              eventHandlers={{
                click: () => {
                  setViewingMarker(m);
                  setIsDetailOpen(true);
                }
              }}
            />
          ))}

          {favoriteMarkers.map(m => (
            <LeafletMarker 
              key={m.id} 
              position={[m.lat, m.lng]} 
              icon={createFavIcon(m.style || '⭐', m.name)}
              eventHandlers={{
                click: () => {
                  setViewingMarker(m);
                  setIsDetailOpen(true);
                }
              }}
            />
          ))}

          {showRoute && routePoints.length > 1 && (
            <Polyline 
              positions={routePoints} 
              color="#3B59F8" 
              weight={6} 
              opacity={0.8} 
              dashArray="1, 12"
              lineCap="round"
            />
          )}
        </MapContainer>
      </div>

      {/* Itinerary List Side Panel */}
      <AnimatePresence>
        {isListOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute top-20 right-4 bottom-24 w-80 z-[1000] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col border border-white/20 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListIcon size={20} className="text-primary" />
                <h3 className="font-bold text-gray-900">行程路线</h3>
              </div>
              <button onClick={() => setIsListOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {itineraryMarkers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                  <MapPin size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-medium">暂无行程标记<br/>请在地图上搜索并添加</p>
                </div>
              ) : (
                <Reorder.Group 
                  axis="y" 
                  values={itineraryMarkers} 
                  onReorder={handleReorder}
                  className="space-y-3"
                >
                  {itineraryMarkers.map((marker) => (
                    <Reorder.Item 
                      key={marker.id} 
                      value={marker}
                      className="group bg-gray-50 hover:bg-white hover:shadow-md rounded-2xl p-4 flex items-center gap-3 transition-all cursor-grab active:cursor-grabbing border border-transparent hover:border-primary/10"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {marker.order_index}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate text-sm">{marker.name}</h4>
                        <p className="text-[10px] text-gray-400 truncate">{marker.address}</p>
                      </div>
                      <GripVertical size={18} className="text-gray-300 group-hover:text-gray-400 shrink-0" />
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
                拖动列表项可调整行程顺序
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results List (Floating) */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-20 left-4 right-4 z-[1000] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-h-[50vh] overflow-y-auto p-2 border border-white/20"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">搜索结果</span>
              <button onClick={() => setSearchResults([])} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={16} /></button>
            </div>
            {searchResults.map((poi, idx) => (
              <div 
                key={idx}
                onClick={() => handlePoiClick(poi)}
                className="p-4 hover:bg-primary/5 rounded-2xl cursor-pointer transition-colors flex items-start gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <MapPin size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{poi.name}</h4>
                  <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{poi.address}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Drawer (POI Details) */}
      <AnimatePresence>
        {isDrawerOpen && selectedPoi && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1001]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 z-[1002] bg-white rounded-t-[40px] p-8 shadow-2xl border-t border-white/20"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
              <div className="flex items-start justify-between mb-8">
                <div className="flex-1 pr-4">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">{selectedPoi.name}</h2>
                  <p className="text-sm text-gray-500 flex items-start gap-2 leading-relaxed">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-primary" /> {selectedPoi.address}
                  </p>
                </div>
                <button 
                  onClick={handleAddMarker}
                  className="w-16 h-16 bg-primary text-white rounded-3xl flex items-center justify-center shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus size={32} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Marker Detail Modal */}
      <AnimatePresence>
        {isDetailOpen && viewingMarker && (
          <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 pb-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {viewingMarker.type === 'itinerary' ? viewingMarker.order_index : viewingMarker.style}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">地点详情</h3>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="space-y-2">
                  <label className="text-[11px] uppercase font-bold tracking-widest text-gray-400">名称</label>
                  <p className="text-2xl font-bold text-gray-900">{viewingMarker.name}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] uppercase font-bold tracking-widest text-gray-400">地址</label>
                  <p className="text-gray-600 flex items-start gap-2 leading-relaxed">
                    <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
                    {viewingMarker.address}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase font-bold tracking-widest text-gray-400">分类</label>
                    <div className="inline-flex px-4 py-2 bg-gray-100 rounded-full text-sm font-bold text-gray-600">
                      {viewingMarker.type === 'itinerary' ? '行程标记' : '收藏标记'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase font-bold tracking-widest text-gray-400">分组</label>
                    <div className="inline-flex px-4 py-2 bg-primary/10 rounded-full text-sm font-bold text-primary">
                      {viewingMarker.category}
                    </div>
                  </div>
                </div>

                {viewingMarker.notes && (
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase font-bold tracking-widest text-gray-400">备注</label>
                    <div className="p-6 bg-gray-50 rounded-3xl text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {viewingMarker.notes}
                    </div>
                    {viewingMarker.notes.includes('xiaohongshu.com') && (
                      <a 
                        href={viewingMarker.notes} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-full text-xs font-bold hover:bg-red-100 transition-colors mt-2"
                      >
                        <ExternalLink size={14} /> 在小红书查看
                      </a>
                    )}
                  </div>
                )}

                {viewingMarker.attachments && viewingMarker.attachments.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-[11px] uppercase font-bold tracking-widest text-gray-400">附件图片</label>
                    <div className="grid grid-cols-2 gap-3">
                      {viewingMarker.attachments.map((att, idx) => (
                        <div key={idx} className="aspect-[4/3] rounded-3xl overflow-hidden shadow-sm">
                          <img src={att.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 pt-4 flex gap-4 bg-gray-50/50 backdrop-blur-md">
                <button 
                  onClick={() => handleDeleteMarker(viewingMarker.id!)}
                  className="w-16 h-16 rounded-2xl bg-white text-red-500 shadow-sm hover:bg-red-50 transition-all flex items-center justify-center"
                >
                  <Trash2 size={24} />
                </button>
                <button 
                  onClick={() => {
                    setEditingMarker(viewingMarker);
                    setIsDetailOpen(false);
                    setIsEditorOpen(true);
                  }}
                  className="flex-1 h-16 bg-primary text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  编辑详情
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Marker Editor Modal */}
      <AnimatePresence>
        {isEditorOpen && editingMarker && (
          <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditorOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 pb-4 flex items-center justify-between border-b border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900">编辑标记点</h3>
                <button onClick={() => setIsEditorOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="space-y-2">
                  <label className="text-[11px] uppercase font-bold tracking-widest text-gray-400">标记名称</label>
                  <input 
                    type="text"
                    value={editingMarker.name}
                    onChange={e => setEditingMarker({ ...editingMarker, name: e.target.value })}
                    className="w-full p-5 bg-gray-50 rounded-3xl outline-none focus:ring-2 ring-primary/20 font-bold text-lg transition-all"
                    placeholder="输入地点名称"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] uppercase font-bold tracking-widest text-gray-400">详细地址</label>
                  <div className="p-5 bg-gray-50/50 rounded-3xl text-sm text-gray-500 flex items-start gap-3 leading-relaxed border border-gray-100">
                    <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
                    {editingMarker.address}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase font-bold tracking-widest text-gray-400">标记类型</label>
                    <div className="relative">
                      <select 
                        value={editingMarker.type}
                        onChange={e => setEditingMarker({ ...editingMarker, type: e.target.value as any })}
                        className="w-full p-5 bg-gray-50 rounded-3xl outline-none appearance-none font-bold text-gray-700 cursor-pointer"
                      >
                        <option value="itinerary">行程标记</option>
                        <option value="favorite">收藏标记</option>
                      </select>
                      <Layers size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase font-bold tracking-widest text-gray-400">
                      {editingMarker.type === 'itinerary' ? '行程顺序' : '自定义图标'}
                    </label>
                    {editingMarker.type === 'itinerary' ? (
                      <input 
                        type="number"
                        min={1}
                        max={(itinerary?.markers?.filter(m => m.type === 'itinerary').reduce((max, m) => Math.max(max, m.order_index || 0), 0) || 0) + 1}
                        value={editingMarker.order_index}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            setEditingMarker({ ...editingMarker, order_index: val });
                          }
                        }}
                        className="w-full p-5 bg-gray-50 rounded-3xl outline-none font-bold text-gray-700"
                      />
                    ) : (
                      <input 
                        type="text"
                        value={editingMarker.style || ''}
                        onChange={e => setEditingMarker({ ...editingMarker, style: e.target.value })}
                        className="w-full p-5 bg-gray-50 rounded-3xl outline-none font-bold text-center text-2xl"
                        placeholder="⭐"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] uppercase font-bold tracking-widest text-gray-400">备注信息</label>
                  <textarea 
                    value={editingMarker.notes || ''}
                    onChange={e => setEditingMarker({ ...editingMarker, notes: e.target.value })}
                    placeholder="添加备注、小红书链接等..."
                    rows={4}
                    className="w-full p-5 bg-gray-50 rounded-3xl outline-none focus:ring-2 ring-primary/20 resize-none transition-all leading-relaxed"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] uppercase font-bold tracking-widest text-gray-400">附件图片</label>
                  <div className="grid grid-cols-3 gap-3">
                    {editingMarker.attachments?.map((att, idx) => (
                      <div key={idx} className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative group shadow-sm">
                        <img src={att.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          onClick={() => handleRemoveAttachment(idx)}
                          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <ImageIcon size={20} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider">上传</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-8 pt-4 flex gap-4 bg-gray-50/50 backdrop-blur-md">
                <button 
                  onClick={handleSaveMarker}
                  className="flex-1 h-16 bg-primary text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Save size={24} /> 保存修改
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
