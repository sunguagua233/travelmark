import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import fs from "fs";

const db = new Database("itinerary.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS itineraries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id)
  );

  CREATE TABLE IF NOT EXISTS markers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itinerary_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    type TEXT CHECK(type IN ('itinerary', 'favorite')) NOT NULL,
    category TEXT,
    style TEXT, -- For favorite markers (color, icon type)
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id)
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    marker_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    FOREIGN KEY (marker_id) REFERENCES markers(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/groups", (req, res) => {
    const groups = db.prepare("SELECT * FROM groups ORDER BY created_at DESC").all();
    res.json(groups);
  });

  app.post("/api/groups", (req, res) => {
    const { name } = req.body;
    const result = db.prepare("INSERT INTO groups (name) VALUES (?)").run(name);
    res.json({ id: result.lastInsertRowid, name });
  });

  app.get("/api/itineraries", (req, res) => {
    const itineraries = db.prepare("SELECT * FROM itineraries ORDER BY created_at DESC").all();
    res.json(itineraries);
  });

  app.post("/api/itineraries", (req, res) => {
    const { name, group_id } = req.body;
    const result = db.prepare("INSERT INTO itineraries (name, group_id) VALUES (?, ?)").run(name, group_id);
    res.json({ id: result.lastInsertRowid, name, group_id });
  });

  app.get("/api/itineraries/:id", (req, res) => {
    const itinerary = db.prepare("SELECT * FROM itineraries WHERE id = ?").get(req.params.id);
    if (!itinerary) return res.status(404).json({ error: "Not found" });
    
    const markers = db.prepare("SELECT * FROM markers WHERE itinerary_id = ? ORDER BY order_index ASC").all(req.params.id);
    
    // Attachments for each marker
    const markersWithAttachments = markers.map(m => {
      const attachments = db.prepare("SELECT * FROM attachments WHERE marker_id = ?").all(m.id);
      return { ...m, attachments };
    });

    res.json({ ...itinerary, markers: markersWithAttachments });
  });

  app.post("/api/markers", (req, res) => {
    const { itinerary_id, name, address, lat, lng, type, category, style, notes, order_index, attachments } = req.body;
    
    const insertMarker = db.transaction((data) => {
      const result = db.prepare(`
        INSERT INTO markers (itinerary_id, name, address, lat, lng, type, category, style, notes, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(data.itinerary_id, data.name, data.address, data.lat, data.lng, data.type, data.category, data.style, data.notes, data.order_index);
      
      const markerId = result.lastInsertRowid;
      
      if (data.attachments && Array.isArray(data.attachments)) {
        const stmt = db.prepare("INSERT INTO attachments (marker_id, url) VALUES (?, ?)");
        for (const url of data.attachments) {
          stmt.run(markerId, url);
        }
      }
      
      return markerId;
    });

    const id = insertMarker({ itinerary_id, name, address, lat, lng, type, category, style, notes, order_index, attachments });
    res.json({ id });
  });

  app.put("/api/markers/:id", (req, res) => {
    const { name, address, category, style, notes, order_index, attachments } = req.body;
    
    const updateMarker = db.transaction((data) => {
      db.prepare(`
        UPDATE markers SET name = ?, address = ?, category = ?, style = ?, notes = ?, order_index = ?
        WHERE id = ?
      `).run(data.name, data.address, data.category, data.style, data.notes, data.order_index, req.params.id);
      
      if (data.attachments) {
        db.prepare("DELETE FROM attachments WHERE marker_id = ?").run(req.params.id);
        const stmt = db.prepare("INSERT INTO attachments (marker_id, url) VALUES (?, ?)");
        for (const url of data.attachments) {
          stmt.run(req.params.id, url);
        }
      }
    });

    updateMarker({ name, address, category, style, notes, order_index, attachments });
    res.json({ success: true });
  });

  app.delete("/api/markers/:id", (req, res) => {
    db.prepare("DELETE FROM attachments WHERE marker_id = ?").run(req.params.id);
    db.prepare("DELETE FROM markers WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.put("/api/markers/bulk", (req, res) => {
    const { markers } = req.body;
    const updateStmt = db.prepare("UPDATE markers SET order_index = ? WHERE id = ?");
    
    const bulkUpdate = db.transaction((data) => {
      for (const m of data) {
        updateStmt.run(m.order_index, m.id);
      }
    });

    bulkUpdate(markers);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
