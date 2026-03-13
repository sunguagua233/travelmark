import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Group, Itinerary } from '../types';
import { Plus, Folder, Map as MapIcon, ChevronRight, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isCreatingItinerary, setIsCreatingItinerary] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newItineraryName, setNewItineraryName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [g, i] = await Promise.all([api.groups.list(), api.itineraries.list()]);
    setGroups(g);
    setItineraries(i);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    await api.groups.create(newGroupName);
    setNewGroupName('');
    setIsCreatingGroup(false);
    loadData();
  };

  const handleCreateItinerary = async () => {
    if (!newItineraryName.trim()) return;
    const res = await api.itineraries.create(newItineraryName, selectedGroupId);
    setNewItineraryName('');
    setIsCreatingItinerary(false);
    loadData();
    navigate(`/itinerary/${res.id}`);
  };

  const groupedItineraries = itineraries.reduce((acc, it) => {
    const gid = it.group_id || 0;
    if (!acc[gid]) acc[gid] = [];
    acc[gid].push(it);
    return acc;
  }, {} as Record<number, Itinerary[]>);

  return (
    <div className="min-h-screen bg-[#F8F9FF] pb-20 font-sans">
      <div className="bg-primary h-64 rounded-b-[60px] p-8 pt-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full -ml-10 -mb-10 blur-2xl" />
        
        <header className="relative z-10">
          <h1 className="text-white text-3xl font-bold mb-2">欢迎使用行程助手</h1>
          <p className="text-white/70 text-sm">规划您的下一次完美旅程</p>
        </header>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-20 relative z-20 space-y-8">
        <section className="bg-white rounded-[40px] p-8 shadow-xl shadow-primary/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-primary">我的行程</h2>
            <button 
              onClick={() => setIsCreatingItinerary(true)}
              className="w-10 h-10 bg-accent text-white rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20 hover:scale-105 transition-transform"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Un-grouped Itineraries */}
            {groupedItineraries[0]?.map(it => (
              <div 
                key={it.id}
                onClick={() => navigate(`/itinerary/${it.id}`)}
                className="group flex items-center justify-between p-4 bg-[#F8F9FF] rounded-3xl border border-transparent hover:border-primary/20 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                    <MapIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#141414]">{it.name}</h3>
                    <p className="text-[10px] text-[#141414]/40 uppercase tracking-widest">{new Date(it.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-primary/30 group-hover:text-primary transition-colors" />
              </div>
            ))}

            {/* Groups */}
            {groups.map(group => (
              <div key={group.id} className="space-y-4 pt-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 px-2">
                  <Folder size={12} />
                  <span>{group.name}</span>
                </div>
                <div className="space-y-4">
                  {groupedItineraries[group.id]?.map(it => (
                    <div 
                      key={it.id}
                      onClick={() => navigate(`/itinerary/${it.id}`)}
                      className="group flex items-center justify-between p-4 bg-[#F8F9FF] rounded-3xl border border-transparent hover:border-primary/20 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                          <MapIcon size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-[#141414]">{it.name}</h3>
                          <p className="text-[10px] text-[#141414]/40 uppercase tracking-widest">{new Date(it.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-primary/30 group-hover:text-primary transition-colors" />
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setIsCreatingItinerary(true);
                    }}
                    className="w-full p-4 border-2 border-dashed border-primary/10 rounded-3xl text-xs font-bold text-primary/40 hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> 添加行程
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <button 
          onClick={() => setIsCreatingGroup(true)}
          className="w-full p-5 bg-white text-primary border-2 border-primary/10 rounded-[30px] font-bold hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/5"
        >
          <Folder size={24} /> 新建分组
        </button>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isCreatingGroup && (
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-primary mb-8">新建分组</h3>
              <input 
                autoFocus
                type="text"
                placeholder="输入分组名称"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                className="w-full p-5 bg-[#F8F9FF] rounded-3xl mb-8 outline-none focus:ring-2 ring-primary/20 font-medium"
              />
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsCreatingGroup(false)}
                  className="flex-1 p-5 rounded-3xl font-bold text-primary/40 hover:bg-primary/5 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleCreateGroup}
                  className="flex-1 p-5 bg-accent text-white rounded-3xl font-bold shadow-lg shadow-accent/20"
                >
                  创建
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isCreatingItinerary && (
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-primary mb-8">新建行程</h3>
              <input 
                autoFocus
                type="text"
                placeholder="输入行程名称"
                value={newItineraryName}
                onChange={e => setNewItineraryName(e.target.value)}
                className="w-full p-5 bg-[#F8F9FF] rounded-3xl mb-8 outline-none focus:ring-2 ring-primary/20 font-medium"
              />
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setIsCreatingItinerary(false);
                    setSelectedGroupId(null);
                  }}
                  className="flex-1 p-5 rounded-3xl font-bold text-primary/40 hover:bg-primary/5 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleCreateItinerary}
                  className="flex-1 p-5 bg-accent text-white rounded-3xl font-bold shadow-lg shadow-accent/20"
                >
                  创建
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
