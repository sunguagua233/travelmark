/**
 * IndexedDB 数据服务层
 * 用于替代 SQLite + Express 后端，使应用可以部署到 GitHub Pages
 */

const DB_NAME = 'RoutePlannerDB';
const DB_VERSION = 1;

// 存储对象名称
const STORES = {
  GROUPS: 'groups',
  ITINERARIES: 'itineraries',
  MARKERS: 'markers',
  ATTACHMENTS: 'attachments'
} as const;

class Database {
  private db: IDBDatabase | null = null;

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建 groups 表
        if (!db.objectStoreNames.contains(STORES.GROUPS)) {
          const groupStore = db.createObjectStore(STORES.GROUPS, { keyPath: 'id', autoIncrement: true });
          groupStore.createIndex('created_at', 'created_at');
        }

        // 创建 itineraries 表
        if (!db.objectStoreNames.contains(STORES.ITINERARIES)) {
          const itineraryStore = db.createObjectStore(STORES.ITINERARIES, { keyPath: 'id', autoIncrement: true });
          itineraryStore.createIndex('group_id', 'group_id');
          itineraryStore.createIndex('created_at', 'created_at');
        }

        // 创建 markers 表
        if (!db.objectStoreNames.contains(STORES.MARKERS)) {
          const markerStore = db.createObjectStore(STORES.MARKERS, { keyPath: 'id', autoIncrement: true });
          markerStore.createIndex('itinerary_id', 'itinerary_id');
          markerStore.createIndex('type', 'type');
          markerStore.createIndex('order_index', 'order_index');
        }

        // 创建 attachments 表
        if (!db.objectStoreNames.contains(STORES.ATTACHMENTS)) {
          const attachmentStore = db.createObjectStore(STORES.ATTACHMENTS, { keyPath: 'id', autoIncrement: true });
          attachmentStore.createIndex('marker_id', 'marker_id');
        }
      };
    });
  }

  /**
   * 获取事务
   */
  private getTransaction(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBTransaction {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.transaction(storeName, mode);
  }

  /**
   * 获取对象存储
   */
  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    return this.getTransaction(storeName, mode).objectStore(storeName);
  }

  /**
   * 通用查询方法
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const request = this.getStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: string, id: number): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      const request = this.getStore(storeName).get(id);
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  }

  async add<T>(storeName: string, data: T): Promise<number> {
    return new Promise((resolve, reject) => {
      const request = this.getStore(storeName, 'readwrite').add(data);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async put<T>(storeName: string, data: T): Promise<number> {
    return new Promise((resolve, reject) => {
      const request = this.getStore(storeName, 'readwrite').put(data);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = this.getStore(storeName, 'readwrite').delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Groups API
   */
  async getGroups(): Promise<Group[]> {
    return this.getAll<Group>(STORES.GROUPS);
  }

  async createGroup(name: string): Promise<Group> {
    const group: Omit<Group, 'id'> = {
      name,
      created_at: new Date().toISOString()
    };
    const id = await this.add(STORES.GROUPS, group);
    return { ...group, id };
  }

  /**
   * Itineraries API
   */
  async getItineraries(): Promise<Itinerary[]> {
    return this.getAll<Itinerary>(STORES.ITINERARIES);
  }

  async getItinerary(id: number): Promise<Itinerary | null> {
    const itinerary = await this.get<Itinerary>(STORES.ITINERARIES, id);
    if (!itinerary) return null;

    // 获取该行程的所有标记点
    const allMarkers = await this.getAll<Marker>(STORES.MARKERS);
    const markers = allMarkers.filter(m => m.itinerary_id === id)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    // 获取每个标记点的附件
    const allAttachments = await this.getAll<Attachment>(STORES.ATTACHMENTS);
    const markersWithAttachments = markers.map(m => ({
      ...m,
      attachments: allAttachments.filter(a => a.marker_id === m.id)
    }));

    return { ...itinerary, markers: markersWithAttachments };
  }

  async createItinerary(name: string, group_id: number | null): Promise<Itinerary> {
    const itinerary: Omit<Itinerary, 'id'> = {
      group_id,
      name,
      description: null,
      created_at: new Date().toISOString()
    };
    const id = await this.add(STORES.ITINERARIES, itinerary);
    return { ...itinerary, id, markers: [] };
  }

  /**
   * Markers API
   */
  async createMarker(data: Omit<Marker, 'id' | 'created_at'> & { attachments?: string[] }): Promise<number> {
    const marker: Omit<Marker, 'id' | 'created_at'> = {
      itinerary_id: data.itinerary_id,
      name: data.name,
      address: data.address || null,
      lat: data.lat,
      lng: data.lng,
      type: data.type,
      category: data.category || null,
      style: data.style || null,
      notes: data.notes || null,
      order_index: data.order_index || 0
    };

    const id = await this.add(STORES.MARKERS, {
      ...marker,
      created_at: new Date().toISOString()
    });

    // 添加附件
    if (data.attachments && data.attachments.length > 0) {
      for (const url of data.attachments) {
        await this.add(STORES.ATTACHMENTS, {
          marker_id: id,
          url
        });
      }
    }

    return id;
  }

  async updateMarker(id: number, data: Partial<Marker> & { attachments?: string[] }): Promise<void> {
    const existing = await this.get<Marker>(STORES.MARKERS, id);
    if (!existing) throw new Error('Marker not found');

    const updated: Marker = {
      ...existing,
      name: data.name ?? existing.name,
      address: data.address ?? existing.address,
      category: data.category ?? existing.category,
      style: data.style ?? existing.style,
      notes: data.notes ?? existing.notes,
      order_index: data.order_index ?? existing.order_index
    };

    await this.put(STORES.MARKERS, updated);

    // 更新附件
    if (data.attachments !== undefined) {
      // 删除旧附件
      const allAttachments = await this.getAll<Attachment>(STORES.ATTACHMENTS);
      for (const att of allAttachments.filter(a => a.marker_id === id)) {
        await this.delete(STORES.ATTACHMENTS, att.id);
      }
      // 添加新附件
      for (const url of data.attachments) {
        await this.add(STORES.ATTACHMENTS, { marker_id: id, url });
      }
    }
  }

  async deleteMarker(id: number): Promise<void> {
    // 删除关联的附件
    const allAttachments = await this.getAll<Attachment>(STORES.ATTACHMENTS);
    for (const att of allAttachments.filter(a => a.marker_id === id)) {
      await this.delete(STORES.ATTACHMENTS, att.id);
    }
    // 删除标记点
    await this.delete(STORES.MARKERS, id);
  }

  async bulkUpdateMarkers(markers: { id: number; order_index: number }[]): Promise<void> {
    const tx = this.getTransaction(STORES.MARKERS, 'readwrite');

    for (const { id, order_index } of markers) {
      const existing = await this.get<Marker>(STORES.MARKERS, id);
      if (existing) {
        await this.put(STORES.MARKERS, { ...existing, order_index });
      }
    }
  }

  /**
   * 清空所有数据（用于测试）
   */
  async clearAll(): Promise<void> {
    const stores = [STORES.GROUPS, STORES.ITINERARIES, STORES.MARKERS, STORES.ATTACHMENTS];
    for (const store of stores) {
      const tx = this.getTransaction(store, 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = tx.objectStore(store).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
}

// 创建单例实例
const db = new Database();

// 确保在使用前初始化
let initPromise: Promise<void> | null = null;

export function ensureDbInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = db.init();
  }
  return initPromise;
}

// 导出 API（与原 API 接口保持一致）
export const api = {
  groups: {
    list: async () => {
      await ensureDbInitialized();
      return db.getGroups();
    },
    create: async (name: string) => {
      await ensureDbInitialized();
      return db.createGroup(name);
    }
  },

  itineraries: {
    list: async () => {
      await ensureDbInitialized();
      return db.getItineraries();
    },
    get: async (id: number) => {
      await ensureDbInitialized();
      const itinerary = await db.getItinerary(id);
      if (!itinerary) throw new Error('Itinerary not found');
      return itinerary;
    },
    create: async (name: string, group_id: number | null) => {
      await ensureDbInitialized();
      return db.createItinerary(name, group_id);
    }
  },

  markers: {
    create: async (marker: Partial<Marker> & { attachments?: string[] }) => {
      await ensureDbInitialized();
      const id = await db.createMarker(marker as any);
      return { id };
    },
    update: async (id: number, marker: Partial<Marker> & { attachments?: string[] }) => {
      await ensureDbInitialized();
      await db.updateMarker(id, marker);
      return { success: true };
    },
    delete: async (id: number) => {
      await ensureDbInitialized();
      await db.deleteMarker(id);
      return { success: true };
    },
    bulkUpdate: async (markers: { id: number; order_index: number }[]) => {
      await ensureDbInitialized();
      await db.bulkUpdateMarkers(markers);
      return { success: true };
    }
  }
};

// 类型定义（与原 types.ts 保持一致）
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
  style: string | null;
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

export default db;
