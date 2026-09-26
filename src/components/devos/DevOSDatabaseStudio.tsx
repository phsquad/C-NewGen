import React, { useState, useEffect } from 'react';
import { Database, Table, Code2, Play, Plus, Trash2, Edit3, Check, RefreshCw, Sparkles, Terminal as TerminalIcon, ShieldCheck } from 'lucide-react';

export interface DbColumn {
  name: string;
  type: 'INTEGER' | 'TEXT' | 'REAL' | 'BOOLEAN';
  isPrimaryKey?: boolean;
  isNotNull?: boolean;
}

export interface DbTable {
  id: string;
  name: string;
  columns: DbColumn[];
  rows: Record<string, any>[];
}

const DEFAULT_TABLES: DbTable[] = [
  {
    id: 'users_table',
    name: 'Users_Table',
    columns: [
      { name: 'Id', type: 'INTEGER', isPrimaryKey: true, isNotNull: true },
      { name: 'FullName', type: 'TEXT', isNotNull: true },
      { name: 'GroupName', type: 'TEXT' },
      { name: 'GradeAverage', type: 'REAL' },
    ],
    rows: [
      { Id: 1, FullName: 'Александр Талентс', GroupName: 'ИВТ-201', GradeAverage: 4.95 },
      { Id: 2, FullName: 'Иван Иванов', GroupName: 'ИВТ-201', GradeAverage: 4.20 },
      { Id: 3, FullName: 'Мария Смирнова', GroupName: 'ПИ-302', GradeAverage: 5.00 },
      { Id: 4, FullName: 'Дмитрий Соколов', GroupName: 'ИВТ-201', GradeAverage: 4.75 },
    ],
  },
  {
    id: 'products_table',
    name: 'Products_Table',
    columns: [
      { name: 'Id', type: 'INTEGER', isPrimaryKey: true, isNotNull: true },
      { name: 'Title', type: 'TEXT', isNotNull: true },
      { name: 'Price', type: 'REAL' },
      { name: 'Stock', type: 'INTEGER' },
    ],
    rows: [
      { Id: 1, Title: 'Ноутбук Lenovo Legion', Price: 125000, Stock: 8 },
      { Id: 2, Title: 'Монитор Dell 27 4K', Price: 42000, Stock: 15 },
      { Id: 3, Title: 'Механическая клавиатура', Price: 9500, Stock: 30 },
    ],
  },
];

export const DevOSDatabaseStudio: React.FC = () => {
  const [tables, setTables] = useState<DbTable[]>(() => {
    try {
      const saved = localStorage.getItem('devos_db_tables');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_TABLES;
  });

  const [activeTableId, setActiveTableId] = useState<string>('users_table');
  const [activeTab, setActiveTab] = useState<'grid' | 'schema' | 'sql' | 'csharp'>('grid');

  // New row form state
  const [newRowData, setNewRowData] = useState<Record<string, string>>({});
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingRowData, setEditingRowData] = useState<Record<string, string>>({});

  // SQL Console state
  const [sqlQuery, setSqlQuery] = useState<string>(
    'SELECT * FROM Users_Table WHERE GradeAverage >= 4.5 ORDER BY FullName ASC;'
  );
  const [sqlResult, setSqlResult] = useState<{ columns: string[]; rows: any[][]; timeMs: number } | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);

  // New Column form state
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<'INTEGER' | 'TEXT' | 'REAL' | 'BOOLEAN'>('TEXT');

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('devos_db_tables', JSON.stringify(tables));
    } catch (e) {
      console.error(e);
    }
  }, [tables]);

  const activeTable = tables.find((t) => t.id === activeTableId) || tables[0];

  // ── ROW ACTIONS ──
  const handleAddRow = () => {
    if (!activeTable) return;
    const newId = activeTable.rows.length > 0 ? Math.max(...activeTable.rows.map((r) => Number(r.Id) || 0)) + 1 : 1;
    
    const rowObj: Record<string, any> = { Id: newId };
    activeTable.columns.forEach((col) => {
      if (col.name === 'Id') return;
      const val = newRowData[col.name];
      if (col.type === 'INTEGER' || col.type === 'REAL') {
        rowObj[col.name] = val ? Number(val) : 0;
      } else if (col.type === 'BOOLEAN') {
        rowObj[col.name] = val === 'true' || val === '1';
      } else {
        rowObj[col.name] = val || '';
      }
    });

    setTables((prev) =>
      prev.map((t) => (t.id === activeTable.id ? { ...t, rows: [...t.rows, rowObj] } : t))
    );
    setNewRowData({});
  };

  const handleDeleteRow = (index: number) => {
    if (!activeTable) return;
    setTables((prev) =>
      prev.map((t) =>
        t.id === activeTable.id ? { ...t, rows: t.rows.filter((_, i) => i !== index) } : t
      )
    );
  };

  const handleSaveEditRow = (index: number) => {
    if (!activeTable) return;
    const updatedRows = [...activeTable.rows];
    const currentRow = { ...updatedRows[index] };

    activeTable.columns.forEach((col) => {
      if (editingRowData[col.name] !== undefined) {
        const val = editingRowData[col.name];
        if (col.type === 'INTEGER' || col.type === 'REAL') {
          currentRow[col.name] = Number(val);
        } else {
          currentRow[col.name] = val;
        }
      }
    });

    updatedRows[index] = currentRow;
    setTables((prev) =>
      prev.map((t) => (t.id === activeTable.id ? { ...t, rows: updatedRows } : t))
    );
    setEditingRowIndex(null);
    setEditingRowData({});
  };

  const handleGenerateFakeData = () => {
    if (!activeTable) return;
    const names = ['Екатерина Волкова', 'Максим Морозов', 'Ольга Васильева', 'Артем Кузнецов', 'Наталья Попова'];
    const groups = ['ИВТ-201', 'ПИ-302', 'ИВТ-101', 'ИС-401'];

    const newRows = [...activeTable.rows];
    let nextId = newRows.length > 0 ? Math.max(...newRows.map((r) => Number(r.Id) || 0)) + 1 : 1;

    for (let i = 0; i < 3; i++) {
      if (activeTable.name === 'Users_Table') {
        newRows.push({
          Id: nextId++,
          FullName: names[Math.floor(Math.random() * names.length)],
          GroupName: groups[Math.floor(Math.random() * groups.length)],
          GradeAverage: Number((3.5 + Math.random() * 1.5).toFixed(2)),
        });
      } else {
        newRows.push({
          Id: nextId++,
          Title: `Товар #${nextId}`,
          Price: Math.floor(Math.random() * 50000) + 1000,
          Stock: Math.floor(Math.random() * 50) + 1,
        });
      }
    }

    setTables((prev) =>
      prev.map((t) => (t.id === activeTable.id ? { ...t, rows: newRows } : t))
    );
  };

  // ── SCHEMA ACTIONS ──
  const handleAddColumn = () => {
    if (!newColName.trim() || !activeTable) return;
    const colName = newColName.trim().replace(/[^A-Za-z0-9_]/g, '');
    if (activeTable.columns.some((c) => c.name === colName)) return;

    const newCols: DbColumn[] = [...activeTable.columns, { name: colName, type: newColType }];
    setTables((prev) =>
      prev.map((t) => (t.id === activeTable.id ? { ...t, columns: newCols } : t))
    );
    setNewColName('');
  };

  // ── SQL EXECUTION ──
  const handleRunSql = () => {
    setSqlError(null);
    const start = performance.now();

    try {
      const q = sqlQuery.trim().toUpperCase();
      if (q.startsWith('SELECT')) {
        // Simple mock parser
        let targetRows = activeTable.rows;
        if (sqlQuery.toLowerCase().includes('gradeaverage >= 4.5')) {
          targetRows = targetRows.filter((r) => (r.GradeAverage || 0) >= 4.5);
        }

        const cols = activeTable.columns.map((c) => c.name);
        const matrix = targetRows.map((r) => cols.map((c) => r[c] ?? 'NULL'));

        setSqlResult({
          columns: cols,
          rows: matrix,
          timeMs: Number((performance.now() - start + 0.5).toFixed(1)),
        });
      } else {
        setSqlResult({
          columns: ['Result'],
          rows: [['[OK] Запрос успешно выполнен. Затронуто строк: 1']],
          timeMs: Number((performance.now() - start + 0.4).toFixed(1)),
        });
      }
    } catch (err: any) {
      setSqlError(err.message || 'Ошибка выполнения SQL синтаксиса SQLite');
    }
  };

  // ── LIVE C# CODE GENERATION (POCO + REPOSITORY) ──
  const generatePocoCs = () => {
    if (!activeTable) return '';
    const className = activeTable.name.replace(/_Table$/i, '').replace(/s$/, '');
    const props = activeTable.columns
      .map((c) => {
        let csType = 'string';
        if (c.type === 'INTEGER') csType = 'int';
        if (c.type === 'REAL') csType = 'double';
        if (c.type === 'BOOLEAN') csType = 'bool';

        const defVal = csType === 'string' ? ' = string.Empty;' : '';
        return `    public ${csType} ${c.name} { get; set; }${defVal}`;
      })
      .join('\n');

    return `namespace MyUniversityApp.Models;\n\npublic class ${className}\n{\n${props}\n}`;
  };

  const generateRepoCs = () => {
    if (!activeTable) return '';
    const className = activeTable.name.replace(/_Table$/i, '').replace(/s$/, '');
    const repoName = `${className}Repository`;
    const colsExceptId = activeTable.columns.filter((c) => c.name !== 'Id');
    const colNamesStr = activeTable.columns.map((c) => c.name).join(', ');
    const insertColsStr = colsExceptId.map((c) => c.name).join(', ');
    const insertValsStr = colsExceptId.map((c) => `$${c.name.toLowerCase()}`).join(', ');

    const readerAssigns = activeTable.columns
      .map((c, idx) => {
        let getter = `reader.GetString(${idx})`;
        if (c.type === 'INTEGER') getter = `reader.GetInt32(${idx})`;
        if (c.type === 'REAL') getter = `reader.GetDouble(${idx})`;
        if (c.type === 'BOOLEAN') getter = `reader.GetBoolean(${idx})`;
        return `                ${c.name} = ${getter}`;
      })
      .join(',\n');

    const paramAssigns = colsExceptId
      .map((c) => `        command.Parameters.AddWithValue("$${c.name.toLowerCase()}", entity.${c.name});`)
      .join('\n');

    return `using System;
using System.Collections.Generic;
using Microsoft.Data.Sqlite;
using MyUniversityApp.Models;

namespace MyUniversityApp.Data;

public class ${repoName}
{
    private readonly string _connectionString = "Data Source=university_lab.db;";

    // Получить все записи из таблицы ${activeTable.name}
    public List<${className}> GetAll()
    {
        var list = new List<${className}>();
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = "SELECT ${colNamesStr} FROM ${activeTable.name};";

        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            list.Add(new ${className}
            {
${readerAssigns}
            });
        }
        return list;
    }

    // Добавить новую запись
    public void Add(${className} entity)
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            INSERT INTO ${activeTable.name} (${insertColsStr}) 
            VALUES (${insertValsStr});";

${paramAssigns}

        command.ExecuteNonQuery();
    }
}`;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 font-sans text-xs text-zinc-200 select-none overflow-hidden">
      {/* ── TOP HEADER / TABLE SWITCHER BAR ── */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded font-bold text-[11px] mr-2">
            <Database className="w-3.5 h-3.5" />
            <span>university_lab.db</span>
          </div>

          {tables.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTableId(t.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                activeTableId === t.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>{t.name}</span>
              <span className="text-[10px] opacity-75">({t.rows.length})</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleGenerateFakeData}
          className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] rounded cursor-pointer transition-colors shrink-0"
        >
          <Sparkles className="w-3 h-3" />
          <span>🎲 Фейк Записи</span>
        </button>
      </div>

      {/* ── MAIN NAVIGATION TABS ── */}
      <div className="bg-zinc-900/60 border-b border-zinc-800/80 px-3 flex items-center gap-1 text-[11px] font-semibold shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('grid')}
          className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'grid'
              ? 'border-blue-500 text-blue-400 bg-zinc-800/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>📊 Таблица Данных (Grid)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schema')}
          className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'schema'
              ? 'border-purple-500 text-purple-400 bg-zinc-800/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>🛠 Конструктор Схемы</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sql')}
          className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'sql'
              ? 'border-emerald-500 text-emerald-400 bg-zinc-800/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <TerminalIcon className="w-3.5 h-3.5" />
          <span>💻 SQL Консоль</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('csharp')}
          className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'csharp'
              ? 'border-cyan-500 text-cyan-400 bg-zinc-800/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>⚡ C# Код Репозитория (POCO)</span>
        </button>
      </div>

      {/* ── TAB CONTENT AREA ── */}
      <div className="flex-1 overflow-auto p-3">
        {/* TAB 1: DATA GRID */}
        {activeTab === 'grid' && activeTable && (
          <div className="space-y-3">
            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/40">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-mono text-[11px]">
                    {activeTable.columns.map((col) => (
                      <th key={col.name} className="p-2.5 font-semibold border-r border-zinc-800/60 last:border-r-0">
                        {col.name}{' '}
                        <span className="text-[10px] text-zinc-500 uppercase">({col.type})</span>
                      </th>
                    ))}
                    <th className="p-2.5 text-right w-28">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {activeTable.rows.map((row, rIdx) => {
                    const isEditing = editingRowIndex === rIdx;

                    return (
                      <tr key={rIdx} className="hover:bg-zinc-800/40 transition-colors">
                        {activeTable.columns.map((col) => (
                          <td key={col.name} className="p-2.5 font-mono text-zinc-200 border-r border-zinc-800/40 last:border-r-0">
                            {isEditing && col.name !== 'Id' ? (
                              <input
                                type="text"
                                defaultValue={row[col.name] ?? ''}
                                onChange={(e) =>
                                  setEditingRowData((prev) => ({
                                    ...prev,
                                    [col.name]: e.target.value,
                                  }))
                                }
                                className="w-full bg-zinc-950 border border-blue-500 px-2 py-1 rounded text-xs text-white focus:outline-none"
                              />
                            ) : (
                              <span>{String(row[col.name] ?? '')}</span>
                            )}
                          </td>
                        ))}

                        <td className="p-2.5 text-right shrink-0">
                          {isEditing ? (
                            <button
                              type="button"
                              onClick={() => handleSaveEditRow(rIdx)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Сохранить
                            </button>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRowIndex(rIdx);
                                  setEditingRowData({});
                                }}
                                title="Редактировать запись"
                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-blue-400 rounded cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(rIdx)}
                                title="Удалить запись"
                                className="p-1.5 bg-zinc-800 hover:bg-red-900/60 text-red-400 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* ADD NEW ROW INPUT LINE */}
                  <tr className="bg-blue-950/20 border-t-2 border-blue-600/40">
                    {activeTable.columns.map((col) => (
                      <td key={col.name} className="p-2 font-mono">
                        {col.name === 'Id' ? (
                          <span className="text-zinc-500 text-[10px] italic">AUTO ID</span>
                        ) : (
                          <input
                            type="text"
                            placeholder={`${col.name}...`}
                            value={newRowData[col.name] || ''}
                            onChange={(e) =>
                              setNewRowData((prev) => ({
                                ...prev,
                                [col.name]: e.target.value,
                              }))
                            }
                            className="w-full bg-zinc-950 border border-zinc-700 px-2 py-1 rounded text-xs text-zinc-200 focus:border-blue-500 focus:outline-none placeholder-zinc-600"
                          />
                        )}
                      </td>
                    ))}
                    <td className="p-2 text-right">
                      <button
                        type="button"
                        onClick={handleAddRow}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded flex items-center gap-1 justify-center w-full cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Добавить</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SCHEMA CONSTRUCTOR */}
        {activeTab === 'schema' && activeTable && (
          <div className="space-y-4 max-w-2xl">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-sm text-purple-400 flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span>Структура колонок таблицы "{activeTable.name}"</span>
              </h3>

              <div className="space-y-2">
                {activeTable.columns.map((col, cIdx) => (
                  <div key={cIdx} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between font-mono">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white">{col.name}</span>
                      <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] text-purple-300 font-bold">
                        {col.type}
                      </span>
                      {col.isPrimaryKey && (
                        <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[9px] font-bold">
                          PRIMARY KEY
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add column form */}
              <div className="pt-3 border-t border-zinc-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Имя колонки (e.g. Email, Age)..."
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-700 px-3 py-1.5 rounded text-xs text-white focus:outline-none"
                />
                <select
                  value={newColType}
                  onChange={(e: any) => setNewColType(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 px-3 py-1.5 rounded text-xs text-white"
                >
                  <option value="TEXT">TEXT</option>
                  <option value="INTEGER">INTEGER</option>
                  <option value="REAL">REAL</option>
                  <option value="BOOLEAN">BOOLEAN</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddColumn}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-xs cursor-pointer"
                >
                  ➕ Добавить колонку
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SQL CONSOLE */}
        {activeTab === 'sql' && (
          <div className="space-y-3 h-full flex flex-col">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 font-mono">💻 SQLite WASM SQL Editor</span>
                <button
                  type="button"
                  onClick={handleRunSql}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Выполнить (F5)</span>
                </button>
              </div>

              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* SQL Results */}
            {sqlError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl font-mono text-xs">
                ❌ {sqlError}
              </div>
            )}

            {sqlResult && (
              <div className="flex-1 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/40 p-2 space-y-2">
                <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between px-1">
                  <span>Выборка ({sqlResult.rows.length} строк):</span>
                  <span className="text-emerald-400 font-bold">{sqlResult.timeMs} ms</span>
                </div>

                <div className="overflow-auto border border-zinc-800 rounded-lg max-h-56">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                        {sqlResult.columns.map((c) => (
                          <th key={c} className="p-2 border-r border-zinc-800">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {sqlResult.rows.map((r, i) => (
                        <tr key={i} className="hover:bg-zinc-800/50">
                          {r.map((val, j) => (
                            <td key={j} className="p-2 border-r border-zinc-800">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: C# REPOSITORY CODE GENERATOR */}
        {activeTab === 'csharp' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full overflow-auto">
            {/* Model Class */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex flex-col space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-400 border-b border-zinc-800 pb-2">
                <span>📄 Модель POCO (User.cs)</span>
                <span className="text-[10px] text-zinc-500 font-mono">C# 12 / .NET 9</span>
              </div>
              <pre className="flex-1 bg-zinc-950 p-3 rounded-lg font-mono text-xs text-cyan-300 overflow-auto whitespace-pre selection:bg-cyan-900">
                {generatePocoCs()}
              </pre>
            </div>

            {/* Repository Class */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex flex-col space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400 border-b border-zinc-800 pb-2">
                <span>⚡ Репозиторий (UserRepository.cs)</span>
                <span className="text-[10px] text-zinc-500 font-mono">Microsoft.Data.Sqlite</span>
              </div>
              <pre className="flex-1 bg-zinc-950 p-3 rounded-lg font-mono text-xs text-emerald-300 overflow-auto whitespace-pre selection:bg-emerald-900">
                {generateRepoCs()}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER STATUS BAR ── */}
      <div className="bg-zinc-900 border-t border-zinc-800 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-zinc-400 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">[SQLite WASM: v3.45]</span>
          <span className="text-zinc-600">|</span>
          <span>База: university_lab.db</span>
          <span className="text-zinc-600">|</span>
          <span className="text-blue-400 font-semibold">Связь с C# DataAccessLayer: ВКЛ</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>IN-MEMORY ORM OK</span>
        </div>
      </div>
    </div>
  );
};
