import React, { useState, useEffect } from 'react';
import { sqliteEngine, SqlQueryResult, SqlTableColumnInfo } from '../../utils/sqliteWasmEngine';
import {
  Database,
  Table,
  Code2,
  Play,
  Plus,
  Trash2,
  Edit3,
  Check,
  RefreshCw,
  Sparkles,
  Terminal as TerminalIcon,
  Download,
  Upload,
  FileCode,
  Layers,
  Search,
} from 'lucide-react';

export const DevOSDatabaseStudio: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [activeTable, setActiveTable] = useState<string>('Users_Table');
  const [columns, setColumns] = useState<SqlTableColumnInfo[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [activeTab, setActiveTab] = useState<'grid' | 'schema' | 'sql' | 'csharp'>('grid');

  // Row editor
  const [newRowData, setNewRowData] = useState<Record<string, string>>({});
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingRowData, setEditingRowData] = useState<Record<string, string>>({});

  // Column creator
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState('TEXT');

  // Table creator
  const [newTableName, setNewTableName] = useState('');
  const [showCreateTable, setShowCreateTable] = useState(false);

  // SQL Console
  const [sqlQuery, setSqlQuery] = useState<string>(
    'SELECT * FROM Users_Table WHERE GradeAverage >= 4.5 ORDER BY FullName ASC;'
  );
  const [sqlResult, setSqlResult] = useState<SqlQueryResult | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);

  // Initialize SQLite WASM
  useEffect(() => {
    sqliteEngine.initialize().then(() => {
      setIsReady(true);
      refreshDatabase();
    });
  }, []);

  const refreshDatabase = () => {
    const tableList = sqliteEngine.getTableList();
    setTables(tableList);
    const targetTable = tableList.includes(activeTable) ? activeTable : tableList[0] || '';
    setActiveTable(targetTable);
    if (targetTable) {
      loadTableData(targetTable);
    }
  };

  const loadTableData = (tableName: string) => {
    const cols = sqliteEngine.getTableColumns(tableName);
    const data = sqliteEngine.getTableRows(tableName);
    setColumns(cols);
    setRows(data);
    setEditingRowIndex(null);
  };

  const handleSelectTable = (tbl: string) => {
    setActiveTable(tbl);
    loadTableData(tbl);
  };

  // ── ROW ACTIONS ──
  const handleAddRow = () => {
    if (!activeTable) return;
    try {
      const colNames: string[] = [];
      const values: string[] = [];

      columns.forEach((col) => {
        if (col.pk && !newRowData[col.name]) return; // Let AUTOINCREMENT handle it
        const raw = newRowData[col.name];
        if (raw !== undefined && raw !== '') {
          colNames.push(`"${col.name}"`);
          if (col.type.toUpperCase() === 'INTEGER' || col.type.toUpperCase() === 'REAL') {
            values.push(String(Number(raw) || 0));
          } else {
            values.push(`'${raw.replace(/'/g, "''")}'`);
          }
        }
      });

      if (colNames.length > 0) {
        sqliteEngine.execute(
          `INSERT INTO "${activeTable}" (${colNames.join(', ')}) VALUES (${values.join(', ')});`
        );
      } else {
        sqliteEngine.execute(`INSERT INTO "${activeTable}" DEFAULT VALUES;`);
      }

      loadTableData(activeTable);
      setNewRowData({});
    } catch (e: any) {
      setSqlError(e.message);
    }
  };

  const handleDeleteRow = (row: Record<string, any>) => {
    if (!activeTable) return;
    const pkCol = columns.find((c) => c.pk) || columns[0];
    if (!pkCol) return;

    try {
      const val = row[pkCol.name];
      const condition =
        typeof val === 'number'
          ? `"${pkCol.name}" = ${val}`
          : `"${pkCol.name}" = '${String(val).replace(/'/g, "''")}'`;

      sqliteEngine.execute(`DELETE FROM "${activeTable}" WHERE ${condition};`);
      loadTableData(activeTable);
    } catch (e: any) {
      setSqlError(e.message);
    }
  };

  const handleSaveEditRow = (row: Record<string, any>) => {
    if (!activeTable) return;
    const pkCol = columns.find((c) => c.pk) || columns[0];
    if (!pkCol) return;

    try {
      const pkVal = row[pkCol.name];
      const updates: string[] = [];

      columns.forEach((col) => {
        if (col.pk) return;
        const val = editingRowData[col.name];
        if (val !== undefined) {
          if (col.type.toUpperCase() === 'INTEGER' || col.type.toUpperCase() === 'REAL') {
            updates.push(`"${col.name}" = ${Number(val) || 0}`);
          } else {
            updates.push(`"${col.name}" = '${val.replace(/'/g, "''")}'`);
          }
        }
      });

      if (updates.length > 0) {
        const condition =
          typeof pkVal === 'number'
            ? `"${pkCol.name}" = ${pkVal}`
            : `"${pkCol.name}" = '${String(pkVal).replace(/'/g, "''")}'`;

        sqliteEngine.execute(`UPDATE "${activeTable}" SET ${updates.join(', ')} WHERE ${condition};`);
      }

      setEditingRowIndex(null);
      loadTableData(activeTable);
    } catch (e: any) {
      setSqlError(e.message);
    }
  };

  // ── SCHEMA ACTIONS ──
  const handleAddColumn = () => {
    if (!activeTable || !newColName.trim()) return;
    try {
      sqliteEngine.execute(`ALTER TABLE "${activeTable}" ADD COLUMN "${newColName.trim()}" ${newColType};`);
      setNewColName('');
      loadTableData(activeTable);
    } catch (e: any) {
      setSqlError(e.message);
    }
  };

  const handleCreateTable = () => {
    if (!newTableName.trim()) return;
    try {
      sqliteEngine.execute(`
        CREATE TABLE "${newTableName.trim()}" (
          Id INTEGER PRIMARY KEY AUTOINCREMENT,
          Title TEXT NOT NULL,
          CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      setNewTableName('');
      setShowCreateTable(false);
      refreshDatabase();
      setActiveTable(newTableName.trim());
      loadTableData(newTableName.trim());
    } catch (e: any) {
      setSqlError(e.message);
    }
  };

  // ── SQL CONSOLE EXECUTION ──
  const handleRunQuery = () => {
    setSqlError(null);
    try {
      const res = sqliteEngine.execute(sqlQuery);
      setSqlResult(res);
      refreshDatabase();
    } catch (e: any) {
      setSqlError(e.message);
      setSqlResult(null);
    }
  };

  // ── EXPORT / IMPORT ──
  const handleExportSql = () => {
    const dump = sqliteEngine.exportSqlDump();
    const blob = new Blob([dump], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDb = () => {
    const binary = sqliteEngine.exportBinary();
    if (!binary) return;
    const blob = new Blob([binary.buffer as ArrayBuffer], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database.sqlite';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.sql')) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          sqliteEngine.execute(reader.result as string);
          refreshDatabase();
        } catch (err: any) {
          setSqlError(err.message);
        }
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          sqliteEngine.importBinary(reader.result as ArrayBuffer);
          refreshDatabase();
        } catch (err: any) {
          setSqlError(err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const csharpCodeSnippet = `// ------------------------------------------------------------------
// C# .NET 8 / 9 — SQLite Data Binding Example
// Using Microsoft.Data.Sqlite or System.Data.SQLite
// ------------------------------------------------------------------
using System;
using System.Data;
using Microsoft.Data.Sqlite;
using System.Windows.Forms;

public partial class ${activeTable || 'DataForm'} : Form
{
    private string connectionString = "Data Source=database.db";

    public void Load${activeTable || 'Table'}Data()
    {
        using (var connection = new SqliteConnection(connectionString))
        {
            connection.Open();
            var sql = "SELECT * FROM ${activeTable || 'Users_Table'}";
            
            using (var cmd = new SqliteCommand(sql, connection))
            using (var reader = cmd.ExecuteReader())
            {
                var dataTable = new DataTable();
                dataTable.Load(reader);
                
                // Real DataGridView binding:
                this.dataGridView1.DataSource = dataTable;
            }
        }
    }
}`;

  return (
    <div className="flex h-full w-full bg-[#121217] text-zinc-200 font-sans overflow-hidden">
      {/* ── LEFT TABLE NAVIGATION SIDEBAR (240px) ── */}
      <div className="w-60 border-r border-zinc-800 bg-[#16161D] flex flex-col shrink-0">
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs text-white">SQLite WASM</span>
          </div>
          <button
            onClick={() => setShowCreateTable(true)}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded cursor-pointer"
            title="Создать таблицу"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
          </button>
        </div>

        {/* Create table inline prompt */}
        {showCreateTable && (
          <div className="p-2 bg-zinc-900 border-b border-zinc-800 space-y-2">
            <input
              type="text"
              autoFocus
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="Имя таблицы (Orders)"
              className="w-full bg-zinc-950 border border-zinc-700 px-2 py-1 rounded text-xs text-white outline-none"
            />
            <div className="flex gap-1 justify-end">
              <button
                onClick={() => setShowCreateTable(false)}
                className="px-2 py-0.5 text-[10px] text-zinc-400 hover:text-white"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateTable}
                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold"
              >
                Создать
              </button>
            </div>
          </div>
        )}

        {/* Table list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 py-1">
            Таблицы ({tables.length})
          </div>
          {tables.map((t) => (
            <button
              key={t}
              onClick={() => handleSelectTable(t)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                activeTable === t
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Table className="w-3.5 h-3.5 shrink-0 opacity-80" />
              <span className="truncate">{t}</span>
            </button>
          ))}
        </div>

        {/* Bottom file controls */}
        <div className="p-2 border-t border-zinc-800 bg-[#14141A] space-y-1">
          <div className="flex gap-1">
            <button
              onClick={handleExportDb}
              title="Скачать .sqlite файл"
              className="flex-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] flex items-center justify-center gap-1 cursor-pointer font-mono"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>.sqlite</span>
            </button>
            <button
              onClick={handleExportSql}
              title="Скачать .sql дамп"
              className="flex-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] flex items-center justify-center gap-1 cursor-pointer font-mono"
            >
              <Download className="w-3 h-3 text-amber-400" />
              <span>.sql</span>
            </button>
          </div>

          <label className="w-full px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] flex items-center justify-center gap-1 cursor-pointer font-mono">
            <Upload className="w-3 h-3 text-emerald-400" />
            <span>Импорт (.db / .sql)</span>
            <input type="file" accept=".db,.sqlite,.sqlite3,.sql" onChange={handleImportFile} className="hidden" />
          </label>
        </div>
      </div>

      {/* ── RIGHT MAIN STUDIO WORKSPACE ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Workspace Tab Bar */}
        <div className="h-10 bg-[#16161D] border-b border-zinc-800 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'grid' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-blue-400" />
              <span>Данные (DataGridView)</span>
              <span className="text-[10px] font-mono text-zinc-500">({rows.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'schema' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Конструктор полей</span>
              <span className="text-[10px] font-mono text-zinc-500">({columns.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('sql')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'sql' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>SQL Консоль</span>
            </button>

            <button
              onClick={() => setActiveTab('csharp')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'csharp' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>C# Код</span>
            </button>
          </div>

          <button
            onClick={() => refreshDatabase()}
            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition cursor-pointer flex items-center gap-1 text-xs"
            title="Обновить"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
          </button>
        </div>

        {/* ── TAB 1: DATA GRID (VISUAL DATA VIEW & ROW EDITOR) ── */}
        {activeTab === 'grid' && (
          <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3">
            {/* Add row form */}
            <div className="bg-[#1A1A23] border border-zinc-800 p-2.5 rounded-xl flex items-center gap-2 overflow-x-auto shrink-0">
              <span className="text-xs font-bold text-zinc-400 shrink-0">+ Новая запись:</span>
              {columns.map((c) => (
                <input
                  key={c.name}
                  type="text"
                  placeholder={`${c.name} (${c.type})`}
                  value={newRowData[c.name] || ''}
                  onChange={(e) => setNewRowData({ ...newRowData, [c.name]: e.target.value })}
                  className="bg-zinc-950 border border-zinc-700 px-2 py-1 rounded text-xs text-white min-w-[120px] outline-none"
                />
              ))}
              <button
                onClick={handleAddRow}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить</span>
              </button>
            </div>

            {/* Table Grid */}
            <div className="flex-1 overflow-auto border border-zinc-800 rounded-xl bg-[#14141B]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1C1C26] border-b border-zinc-800 text-zinc-400 font-mono text-[11px] sticky top-0">
                    <th className="p-2 w-16 text-center">#</th>
                    {columns.map((c) => (
                      <th key={c.name} className="p-2 font-semibold">
                        <div className="flex items-center gap-1">
                          <span>{c.name}</span>
                          <span className="text-[9px] text-zinc-500 font-normal">({c.type})</span>
                          {c.pk === 1 && <span className="text-[9px] text-amber-400 font-bold">🔑</span>}
                        </div>
                      </th>
                    ))}
                    <th className="p-2 w-24 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 2} className="p-8 text-center text-zinc-500">
                        Таблица пуста. Добавьте строки сверху или выполните INSERT в SQL консоли.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, idx) => {
                      const isEditing = editingRowIndex === idx;
                      return (
                        <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="p-2 text-center text-zinc-500">{idx + 1}</td>
                          {columns.map((c) => (
                            <td key={c.name} className="p-2 text-zinc-200">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={
                                    editingRowData[c.name] !== undefined
                                      ? editingRowData[c.name]
                                      : String(row[c.name] ?? '')
                                  }
                                  onChange={(e) =>
                                    setEditingRowData({ ...editingRowData, [c.name]: e.target.value })
                                  }
                                  className="w-full bg-zinc-950 border border-blue-500 px-1.5 py-0.5 rounded text-white outline-none"
                                />
                              ) : (
                                <span>{row[c.name] === null ? <em className="text-zinc-600">null</em> : String(row[c.name])}</span>
                              )}
                            </td>
                          ))}
                          <td className="p-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isEditing ? (
                                <button
                                  onClick={() => handleSaveEditRow(row)}
                                  className="p-1 bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded cursor-pointer"
                                  title="Сохранить изменения"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingRowIndex(idx);
                                    setEditingRowData({});
                                  }}
                                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded cursor-pointer"
                                  title="Редактировать строку"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteRow(row)}
                                className="p-1 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 rounded cursor-pointer"
                                title="Удалить строку"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 2: SCHEMA DESIGNER (COLUMNS & TYPES) ── */}
        {activeTab === 'schema' && (
          <div className="flex-1 overflow-auto p-4 space-y-4">
            <div className="bg-[#1A1A23] border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
              <span className="text-xs font-bold text-white">+ Добавить колонку:</span>
              <input
                type="text"
                placeholder="Имя поля (Email)"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 px-2.5 py-1 rounded text-xs text-white outline-none w-48"
              />
              <select
                value={newColType}
                onChange={(e) => setNewColType(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 px-2.5 py-1 rounded text-xs text-white outline-none"
              >
                <option value="INTEGER">INTEGER (Число)</option>
                <option value="TEXT">TEXT (Строка)</option>
                <option value="REAL">REAL (Дробное)</option>
                <option value="BLOB">BLOB (Байты)</option>
              </select>
              <button
                onClick={handleAddColumn}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold cursor-pointer"
              >
                Добавить колонку
              </button>
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-[#14141B]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#1C1C26] border-b border-zinc-800 text-zinc-400 font-mono text-[11px]">
                    <th className="p-2.5">Колонка</th>
                    <th className="p-2.5">Тип SQLite</th>
                    <th className="p-2.5">Первичный ключ</th>
                    <th className="p-2.5">NOT NULL</th>
                    <th className="p-2.5">По умолчанию</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                  {columns.map((c) => (
                    <tr key={c.name} className="hover:bg-zinc-800/30">
                      <td className="p-2.5 font-bold text-white">{c.name}</td>
                      <td className="p-2.5 text-cyan-300">{c.type}</td>
                      <td className="p-2.5">{c.pk ? <span className="text-amber-400 font-bold">ДА (PK)</span> : 'Нет'}</td>
                      <td className="p-2.5">{c.notnull ? 'ДА' : 'Нет'}</td>
                      <td className="p-2.5 text-zinc-500">{c.dflt_value || 'NULL'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: SQL CONSOLE (WASM QUERY RUNNER) ── */}
        {activeTab === 'sql' && (
          <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3">
            {/* Editor Area */}
            <div className="flex flex-col bg-[#1A1A23] border border-zinc-800 rounded-xl overflow-hidden shrink-0">
              <div className="p-2 bg-[#16161D] border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 font-mono">SQLite Запрос:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setSqlQuery(`SELECT * FROM "${activeTable}" LIMIT 20;`)
                    }
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-mono cursor-pointer"
                  >
                    SELECT 20
                  </button>
                  <button
                    onClick={() =>
                      setSqlQuery(`SELECT COUNT(*) AS TotalRows FROM "${activeTable}";`)
                    }
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-mono cursor-pointer"
                  >
                    COUNT(*)
                  </button>
                  <button
                    onClick={handleRunQuery}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Выполнить (F5)</span>
                  </button>
                </div>
              </div>
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="w-full h-24 p-3 bg-zinc-950 font-mono text-xs text-cyan-200 outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Error banner */}
            {sqlError && (
              <div className="p-2.5 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs font-mono">
                ❌ {sqlError}
              </div>
            )}

            {/* Results Table */}
            <div className="flex-1 overflow-auto border border-zinc-800 rounded-xl bg-[#14141B] flex flex-col">
              {sqlResult ? (
                <>
                  <div className="p-2 bg-[#1C1C26] border-b border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>Строк: {sqlResult.values.length}</span>
                    <span className="text-emerald-400">⚡️ Затрачено: {sqlResult.timeMs} ms</span>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#1C1C26] border-b border-zinc-800 text-zinc-400 font-mono text-[11px] sticky top-0">
                          {sqlResult.columns.map((c, i) => (
                            <th key={i} className="p-2 font-semibold">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                        {sqlResult.values.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-zinc-800/40">
                            {row.map((val, cIdx) => (
                              <td key={cIdx} className="p-2 text-zinc-200">
                                {val === null ? <em className="text-zinc-600">null</em> : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs font-mono">
                  Нажмите «Выполнить» для запуска SQL запроса
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 4: C# INTEGRATION CODE ── */}
        {activeTab === 'csharp' && (
          <div className="flex-1 overflow-auto p-4">
            <pre className="p-4 bg-[#14141B] border border-zinc-800 rounded-xl font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto">
              {csharpCodeSnippet}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
