/// <reference lib="webworker" />

// By using importScripts, we load sql.js without letting webpack process it.
// This avoids the 'fs' module not found error during the Next.js build.
self.importScripts('https://sql.js.org/dist/sql-wasm.js');

// After importScripts, initSqlJs is available on the global scope of the worker
declare const initSqlJs: (config?: any) => Promise<any>;

let db: any = null;

self.onmessage = async (event: MessageEvent) => {
  const { type, payload } = event.data;

  try {
    // 1. INITIALIZE ENGINE (only if not already initialized)
    if (type === 'init') {
      if (!db) {
        const SQL = await initSqlJs({
          // Point to the WASM file in the same CDN directory
          locateFile: file => `https://sql.js.org/dist/${file}` 
        });
        db = new SQL.Database();
      }
      self.postMessage({ type: 'ready', payload: "Virtual SQL Instance Started. Ready for data." });
      return; // Initialization is done for this message
    }

    // Ensure db is initialized for other commands
    if (!db) {
      throw new Error("Database not initialized. Send 'init' message first.");
    }
    
    // 2. LOAD DATA (The "Restore" Phase)
    if (type === 'load_dump') {
      db.run(payload); 
      const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
      self.postMessage({ type: 'loaded', payload: tables[0]?.values.flat() || [] });
    }

    // 3. EXECUTE QUERY (The "Runner" Phase)
    if (type === 'query') {
      const result = db.exec(payload);
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
