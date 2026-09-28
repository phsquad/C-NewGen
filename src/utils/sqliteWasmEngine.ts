import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js';

export interface SqlQueryResult {
  columns: string[];
  values: any[][];
  timeMs: number;
  rowsAffected?: number;
}

export interface SqlTableColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

class SqliteWasmManager {
  private SQL: SqlJsStatic | null = null;
  private db: SqlJsDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  public async initialize(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const SQL = await initSqlJs({
          locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`,
        });
        this.SQL = SQL;

        // Try restoring binary database from indexedDb / localStorage if present
        const savedBinary = localStorage.getItem('devos_sqlite_binary');
        if (savedBinary) {
          try {
            const binaryArray = Uint8Array.from(atob(savedBinary), (c) => c.charCodeAt(0));
            this.db = new SQL.Database(binaryArray);
          } catch {
            this.db = new SQL.Database();
          }
        } else {
          this.db = new SQL.Database();
        }

        // Seed initial default tables if empty
        this.seedDefaultSchema();
      } catch (err) {
        console.warn('[SQLite WASM] Falling back to standard memory db:', err);
      }
    })();

    return this.initPromise;
  }

  private seedDefaultSchema() {
    if (!this.db) return;
    try {
      const check = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='Users_Table';");
      if (!check.length || !check[0].values.length) {
        this.db.run(`
          CREATE TABLE IF NOT EXISTS Users_Table (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            FullName TEXT NOT NULL,
            GroupName TEXT,
            GradeAverage REAL
          );
          INSERT INTO Users_Table (FullName, GroupName, GradeAverage) VALUES
            ('Александр Талентс', 'ИВТ-201', 4.95),
            ('Иван Иванов', 'ИВТ-201', 4.20),
            ('Мария Смирнова', 'ПИ-302', 5.00),
            ('Дмитрий Соколов', 'ИВТ-201', 4.75);

          CREATE TABLE IF NOT EXISTS Products_Table (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Title TEXT NOT NULL,
            Price REAL,
            Stock INTEGER
          );
          INSERT INTO Products_Table (Title, Price, Stock) VALUES
            ('Ноутбук Lenovo Legion', 125000, 8),
            ('Монитор Dell 27 4K', 42000, 15),
            ('Механическая клавиатура', 9500, 30);
        `);
        this.persist();
      }
    } catch (e) {
      console.error('[SQLite] Seed error:', e);
    }
  }

  public execute(sql: string): SqlQueryResult {
    if (!this.db) {
      throw new Error('SQLite WASM база данных еще инициализируется...');
    }

    const start = performance.now();
    const results = this.db.exec(sql);
    const timeMs = Math.round((performance.now() - start) * 100) / 100;

    this.persist();

    if (results.length > 0) {
      const first = results[0];
      return {
        columns: first.columns,
        values: first.values,
        timeMs,
      };
    }

    return {
      columns: ['Результат'],
      values: [['Команда выполнена успешно']],
      timeMs,
    };
  }

  public getTableList(): string[] {
    if (!this.db) return [];
    try {
      const res = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;");
      if (res.length > 0) {
        return res[0].values.map((v) => String(v[0]));
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  public getTableColumns(tableName: string): SqlTableColumnInfo[] {
    if (!this.db) return [];
    try {
      const res = this.db.exec(`PRAGMA table_info("${tableName}");`);
      if (res.length > 0) {
        return res[0].values.map((row) => ({
          cid: Number(row[0]),
          name: String(row[1]),
          type: String(row[2]),
          notnull: Number(row[3]),
          dflt_value: row[4],
          pk: Number(row[5]),
        }));
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  public getTableRows(tableName: string): Record<string, any>[] {
    if (!this.db) return [];
    try {
      const res = this.db.exec(`SELECT * FROM "${tableName}";`);
      if (res.length > 0) {
        const cols = res[0].columns;
        return res[0].values.map((row) => {
          const obj: Record<string, any> = {};
          cols.forEach((col, idx) => {
            obj[col] = row[idx];
          });
          return obj;
        });
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  public exportBinary(): Uint8Array | null {
    if (!this.db) return null;
    return this.db.export();
  }

  public importBinary(buffer: ArrayBuffer): void {
    if (!this.SQL) return;
    this.db = new this.SQL.Database(new Uint8Array(buffer));
    this.persist();
  }

  public exportSqlDump(): string {
    if (!this.db) return '';
    const tables = this.getTableList();
    let dump = `-- NextGen C# Designer / DevOS SQLite Dump\n-- Generated at: ${new Date().toISOString()}\n\n`;

    tables.forEach((t) => {
      const createRes = this.db!.exec(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${t}';`);
      if (createRes.length && createRes[0].values.length) {
        dump += `${createRes[0].values[0][0]};\n\n`;
      }

      const rowsRes = this.db!.exec(`SELECT * FROM "${t}";`);
      if (rowsRes.length && rowsRes[0].values.length) {
        const cols = rowsRes[0].columns.map((c) => `"${c}"`).join(', ');
        rowsRes[0].values.forEach((row) => {
          const formattedVals = row
            .map((v) => (v === null ? 'NULL' : typeof v === 'number' ? v : `'${String(v).replace(/'/g, "''")}'`))
            .join(', ');
          dump += `INSERT INTO "${t}" (${cols}) VALUES (${formattedVals});\n`;
        });
        dump += '\n';
      }
    });

    return dump;
  }

  private persist() {
    if (!this.db) return;
    try {
      const binary = this.db.export();
      let binaryStr = '';
      const len = binary.byteLength;
      // Convert to binary string in chunks to prevent max call stack
      const chunkSize = 8192;
      for (let i = 0; i < len; i += chunkSize) {
        const chunk = binary.subarray(i, Math.min(i + chunkSize, len));
        binaryStr += String.fromCharCode.apply(null, chunk as any);
      }
      localStorage.setItem('devos_sqlite_binary', btoa(binaryStr));
    } catch {
      // Storage quota or memory limit
    }
  }
}

export const sqliteEngine = new SqliteWasmManager();
