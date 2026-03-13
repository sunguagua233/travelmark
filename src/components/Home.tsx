import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ItineraryExportData } from '../services/db';
import { Group, Itinerary } from '../types';
import { Plus, Folder, Map as MapIcon, ChevronRight, Download, Upload, Share2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportAsJSON, importFromJSON } from '../utils/export';

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isCreatingItinerary, setIsCreatingItinerary] = useState(false);
  const [isExportMenu, setIsExportMenu] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newItineraryName, setNewItineraryName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [g, i] = await Promise.all([api.groups.list(), api.itineraries.list()]);
    setGroups(g);
    setItineraries(i);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
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

  // 导出所有数据
  const handleExportAll = async () => {
    try {
      const data = await api.export.all();
      exportAsJSON(data, `RoutePlanner-备份-${new Date().toLocaleDateString('zh-CN')}.json`);
      showMessage('success', '数据导出成功！');
      setIsExportMenu(false);
    } catch (error) {
      showMessage('error', '导出失败，请重试');
    }
  };

  // 导入行程
  const handleImport = async () => {
    try {
      setIsImporting(true);
      const data = await importFromJSON<ItineraryExportData>();

      // 验证数据格式
      if (!data.version || !data.data || !data.data.itinerary) {
        throw new Error('无效的行程文件格式');
      }

      const { itinerary } = data.data;
      const newId = await api.import.itinerary(itinerary, false);

      showMessage('success', `"${itinerary.name}" 导入成功！`);
      loadData();
      setIsExportMenu(false);

      // 询问是否跳转到新导入的行程
      setTimeout(() => {
        if (confirm(`是否跳转到新导入的行程"${itinerary.name}"？`)) {
          navigate(`/itinerary/${newId}`);
        }
      }, 500);
    } catch (error: any) {
      showMessage('error', error.message || '导入失败，请检查文件格式');
    } finally {
      setIsImporting(false);
    }
  };

  const groupedItineraries = itineraries.reduce((acc, it) => {
    const gid = it.group_id || 0;
    if (!acc[gid]) acc[gid] = [];
    acc[gid].push(it);
    return acc;
  }, {} as Record<number, Itinerary[]>);

  return (
    <div className="min-h-screen bg-[#F8F9FF] pb-20 font-sans">
      <div className="bg-primary h-64 rounded-b-[60px] p-6 pt-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full -ml-10 -mb-10 blur-2xl" />

        <header className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-white text-2xl font-bold mb-1">欢迎使用行程助手</h1>
              <p className="text-white/70 text-xs">规划您的下一次完美旅程</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setIsExportMenu(!isExportMenu)}
                className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <Share2 size={20} />
              </button>

              <AnimatePresence>
                {isExportMenu && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsExportMenu(false)}
                      className="fixed inset-0 z-40"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                      <button
                        onClick={handleExportAll}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <Download size={18} className="text-primary" />
                        <span className="text-sm font-medium text-gray-700">导出所有数据</span>
                      </button>
                      <button
                        onClick={handleImport}
                        disabled={isImporting}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100 disabled:opacity-50"
                      >
                        <Upload size={18} className="text-accent" />
                        <span className="text-sm font-medium text-gray-700">
                          {isImporting ? '导入中...' : '导入行程'}
                        </span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
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

      {/* Message Toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl z-50 ${
              message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

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
