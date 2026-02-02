/// <reference lib="webworker" />
import initSqlJs from 'sql.js';

let db: any = null;

self.onmessage = async (event: MessageEvent) => {
  const { type, payload } = event.data;

  try {
    // 1. INITIALIZE ENGINE
    if (type === 'init') {
      const SQL = await initSqlJs({
        // Point to the WASM file in public folder (we will add this later)
        locateFile: file => `https://sql.js.org/dist/${file}` 
      });
      db = new SQL.Database();
      self.postMessage({ type: 'ready', payload: "Virtual SQL Instance Started. Ready for data." });
    }

    // 2. LOAD DATA (The "Restore" Phase)
    if (type === 'load_dump') {
      if (!db) throw new Error("Database not initialized");
      
      // Payload is a massive SQL string (INSERT statements)
      // or a Schema definition
      db.run(payload); 
      
      // Get list of tables created
      const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
      self.postMessage({ type: 'loaded', payload: tables[0]?.values.flat() || [] });
    }

    // 3. EXECUTE QUERY (The "Runner" Phase)
    if (type === 'query') {
      if (!db) throw new Error("Database not initialized");
      
      const result = db.exec(payload); // payload is "SELECT * FROM..."
      
      if (result.length === 0) {
        self.postMessage({ type: 'result', payload: { columns: [], values: [] } });
      } else {
        self.postMessage({ type: 'result', payload: { 
          columns: result[0].columns, 
          values: result[0].values 
        }});
      }
    }

  } catch (error: any) {
    self.postMessage({ type: 'error', payload: error.message });
  }
};

export {};
