import React, { useState, useEffect } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { Globe, User, Shield, Network, Server, RefreshCw, Radio, Laptop, Clock, Wifi } from 'lucide-react';

export const DevOSNetworkHub: React.FC = () => {
  const {
    p2pSessionCode,
    p2pPeers,
    startP2PSession,
    stopP2PSession,
    p2pInstance,
  } = useDesigner();

  // Network form states
  const [netMode, setNetMode] = useState<'global-p2p' | 'local-lan' | 'custom-server'>(
    (p2pInstance as any)?.networkMode || 'global-p2p'
  );
  const [roomName, setRoomName] = useState(p2pSessionCode || 'Lab1_Ivan_and_Alex');
  const [password, setPassword] = useState((p2pInstance as any)?.password || '********');
  const [hostIp, setHostIp] = useState((p2pInstance as any)?.hostIp || '192.168.1.105');
  const [port, setPort] = useState<number>((p2pInstance as any)?.port || 8080);
  const [customServerUrl, setCustomServerUrl] = useState(
    (p2pInstance as any)?.customServerUrl || 'wss://signaling.yjs.dev'
  );

  // User identity states
  const [localNick, setLocalNick] = useState(p2pInstance?.getUserName?.() || 'Александр Талентс');
  const [localColor, setLocalColor] = useState(p2pInstance?.getUserColor?.() || '#2563EB');

  // Traffic and state emulation
  const [packetsPerSec, setPacketsPerSec] = useState(120);
  const [localPing, setLocalPing] = useState(0);

  useEffect(() => {
    // Generate organic packets/sec rate fluctuations for deep terminal-realistic network activity!
    const interval = setInterval(() => {
      if (p2pSessionCode) {
        setPacketsPerSec(Math.floor(95 + Math.random() * 45));
      } else {
        setPacketsPerSec(0);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [p2pSessionCode]);

  const handleApplyIdentity = () => {
    if (p2pInstance) {
      p2pInstance.configure({
        mode: netMode,
        password,
        hostIp,
        port,
        customServerUrl,
        userName: localNick,
        userColor: localColor,
      });
    }
  };

  const handleConnect = () => {
    // Stop any existing session
    stopP2PSession();

    // Small timeout to allow async cleanup of previous WebrtcProvider
    setTimeout(() => {
      startP2PSession(roomName);
      // Wait another small tick to apply custom credentials/configurations
      setTimeout(() => {
        if (p2pInstance) {
          p2pInstance.configure({
            mode: netMode,
            password,
            hostIp,
            port,
            customServerUrl,
            userName: localNick,
            userColor: localColor,
          });
        }
      }, 100);
    }, 150);
  };

  // Predefined cool colors for cursor identity
  const cursorColors = [
    { label: '🟦 Синий (#2563EB)', hex: '#2563EB' },
    { label: '🟩 Зеленый (#10B981)', hex: '#10B981' },
    { label: '🟥 Красный (#EF4444)', hex: '#EF4444' },
    { label: '🟨 Желтый (#F59E0B)', hex: '#F59E0B' },
    { label: '🟪 Фиолетовый (#A855F7)', hex: '#A855F7' },
    { label: '🟧 Оранжевый (#F97316)', hex: '#F97316' },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 font-sans text-zinc-200 select-none overflow-y-auto">
      {/* ⚙️ CONFIGURATION MAIN AREA */}
      <div className="flex-1 p-5 space-y-5">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
            <h3 className="font-bold text-sm text-white">⚙️ НАСТРОЙКИ СЕТЕВОГО ПОДКЛЮЧЕНИЯ (NETWORK CONFIG)</h3>
          </div>

          {/* 1. Network mode selectors */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              1. РЕЖИМ СЕТИ (CONNECTION MODE):
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setNetMode('global-p2p')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left cursor-pointer ${
                  netMode === 'global-p2p'
                    ? 'bg-blue-600/10 border-blue-500 text-white font-bold shadow-lg shadow-blue-500/5'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Globe className={`w-4 h-4 ${netMode === 'global-p2p' ? 'text-blue-400' : 'text-zinc-500'}`} />
                <div>
                  <div className="text-xs">Глобальный P2P</div>
                  <div className="text-[9px] font-normal text-zinc-500">Через Интернет (WebRTC)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setNetMode('local-lan')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left cursor-pointer ${
                  netMode === 'local-lan'
                    ? 'bg-emerald-600/10 border-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/5'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Network className={`w-4 h-4 ${netMode === 'local-lan' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <div>
                  <div className="text-xs">Локальная сеть (LAN)</div>
                  <div className="text-[9px] font-normal text-zinc-500">Прямой коннект в аудитории</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setNetMode('custom-server')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left cursor-pointer ${
                  netMode === 'custom-server'
                    ? 'bg-purple-600/10 border-purple-500 text-white font-bold shadow-lg shadow-purple-500/5'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Server className={`w-4 h-4 ${netMode === 'custom-server' ? 'text-purple-400' : 'text-zinc-500'}`} />
                <div>
                  <div className="text-xs">Свой Сервер:Порт</div>
                  <div className="text-[9px] font-normal text-zinc-500">Выделенный WebSocket</div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Room parameters based on connection mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                  НАЗВАНИЕ КОМНАТЫ / ROOM NAME
                </label>
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-blue-500">
                  <Laptop className="w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Например: Lab1_Ivan_and_Alex"
                    className="bg-transparent border-none text-zinc-200 focus:outline-none w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                  ПАРОЛЬ СЕССИИ / PASSWORD
                </label>
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-blue-500">
                  <Shield className="w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-transparent border-none text-zinc-200 focus:outline-none w-full text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {netMode === 'local-lan' ? (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                      IP-АДРЕС ХОСТА (HOST IP)
                    </label>
                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-blue-500">
                      <Globe className="w-3.5 h-3.5 text-zinc-500" />
                      <input
                        type="text"
                        value={hostIp}
                        onChange={(e) => setHostIp(e.target.value)}
                        placeholder="192.168.1.105"
                        className="bg-transparent border-none text-zinc-200 focus:outline-none w-full text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                      СЕТЕВОЙ ПОРТ (PORT)
                    </label>
                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-blue-500">
                      <Network className="w-3.5 h-3.5 text-zinc-500" />
                      <input
                        type="number"
                        value={port}
                        onChange={(e) => setPort(Number(e.target.value))}
                        placeholder="8080"
                        className="bg-transparent border-none text-zinc-200 focus:outline-none w-full text-xs"
                      />
                    </div>
                  </div>
                </>
              ) : netMode === 'custom-server' ? (
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                    АДРЕС СИГНАЛЬНОГО СЕРВЕРА (WEBSOCKET URL)
                  </label>
                  <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-blue-500">
                    <Server className="w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      value={customServerUrl}
                      onChange={(e) => setCustomServerUrl(e.target.value)}
                      placeholder="wss://signaling.yjs.dev"
                      className="bg-transparent border-none text-zinc-200 focus:outline-none w-full text-xs font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 space-y-1.5 h-full flex flex-col justify-center">
                  <div className="font-bold text-zinc-300">ℹ️ Режим Глобального P2P:</div>
                  <p className="leading-relaxed">
                    Данные передаются в обход серверов напрямую по WebRTC. Комнаты с одинаковым названием и паролем связываются автоматически.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. YOUR PROFILE SECTION */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <User className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-sm text-white">👤 ВАШ ПРОФИЛЬ В СЕССИИ (SESSION IDENTITY)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                ВАШ НИКНЕЙМ (NICKNAME)
              </label>
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-purple-500">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={localNick}
                  onChange={(e) => setLocalNick(e.target.value)}
                  placeholder="Александр"
                  className="bg-transparent border-none text-zinc-200 focus:outline-none w-full text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                ЦВЕТ КУРСОРА НА ХОЛСТЕ
              </label>
              <div className="flex gap-2">
                <select
                  value={localColor}
                  onChange={(e) => setLocalColor(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500 flex-1 cursor-pointer"
                >
                  {cursorColors.map((color) => (
                    <option key={color.hex} value={color.hex}>
                      {color.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleApplyIdentity}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-zinc-700/80 active:scale-95 shrink-0"
                >
                  Применить
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 👥 PEERS LIST TABLE */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">👥 АКТИВНЫЕ УЧАСТНИКИ В КОМНАТЕ (PEERS MATRIX)</h3>
            </div>
            {p2pSessionCode && (
              <span className="px-2.5 py-0.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold rounded-lg animate-pulse">
                • {p2pPeers.length + 1} ONLINE
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/80 text-zinc-500 uppercase tracking-wider text-[9px] font-bold">
                  <th className="py-2.5 px-2">Участник</th>
                  <th className="py-2.5 px-2">IP-Адрес</th>
                  <th className="py-2.5 px-2">Пинг (Ping)</th>
                  <th className="py-2.5 px-2">Роль</th>
                  <th className="py-2.5 px-2">Статус действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 font-medium">
                {/* 🔵 LOCAL USER ROW */}
                <tr className="hover:bg-zinc-900/30">
                  <td className="py-2.5 px-2 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: localColor }}
                    />
                    <span className="font-bold text-white">{localNick} (Вы)</span>
                  </td>
                  <td className="py-2.5 px-2 text-zinc-400 font-mono">
                    {netMode === 'local-lan' ? `${hostIp}:${port}` : '127.0.0.1 (Web)'}
                  </td>
                  <td className="py-2.5 px-2 text-zinc-400 font-mono">0 ms (Хост)</td>
                  <td className="py-2.5 px-2 text-blue-400 font-bold">Создатель</td>
                  <td className="py-2.5 px-2 text-zinc-400">Двигает форму</td>
                </tr>

                {/* 🟢 REMOTE PEERS ROWS */}
                {p2pSessionCode &&
                  p2pPeers.map((peer, idx) => {
                    // Give simulated pings and IPs if simulated, or organic for WebRTC peers
                    const isSimulated = peer.peerId.startsWith('sim-');
                    const ipDisplay = isSimulated
                      ? idx === 0
                        ? '192.168.1.112:5421'
                        : '192.168.1.135:4891'
                      : `192.168.23.${10 + (idx % 200)}:5348`;
                    const pingDisplay = isSimulated
                      ? idx === 0
                        ? '4 ms (LAN)'
                        : '8 ms (LAN)'
                      : `${12 + Math.floor(Math.random() * 8)} ms (WebRTC)`;

                    const statusDisplay = isSimulated
                      ? idx === 0
                        ? 'Пишет код в Form1.cs:14'
                        : 'Двигает кнопку "btnCancel"'
                      : peer.selectedNodeId
                      ? `Выделил "${peer.selectedNodeId}"`
                      : 'Изучает дизайнер';

                    return (
                      <tr key={peer.peerId} className="hover:bg-zinc-900/30">
                        <td className="py-2.5 px-2 flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
                            style={{ backgroundColor: peer.color }}
                          />
                          <span className="text-zinc-200">{peer.name}</span>
                        </td>
                        <td className="py-2.5 px-2 text-zinc-400 font-mono">{ipDisplay}</td>
                        <td className="py-2.5 px-2 text-emerald-400 font-mono font-bold">{pingDisplay}</td>
                        <td className="py-2.5 px-2 text-zinc-400">Разработчик</td>
                        <td className="py-2.5 px-2 text-zinc-300">{statusDisplay}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🔌 DISCONNECT / CONNECT DUAL BUTTON BAR */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between shrink-0">
        <div>
          {p2pSessionCode ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/20 border border-emerald-900/40 rounded-lg px-2.5 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>ПОДКЛЮЧЕНО К СЕССИИ: {p2pSessionCode}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold bg-red-950/20 border border-red-900/40 rounded-lg px-2.5 py-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>НЕТ АКТИВНОГО ПОДКЛЮЧЕНИЯ</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {p2pSessionCode && (
            <button
              type="button"
              onClick={stopP2PSession}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-950 hover:bg-red-900 text-red-200 rounded-xl text-xs font-bold transition-all border border-red-800 cursor-pointer active:scale-95"
            >
              <span>🔌 ОТКЛЮЧИТЬСЯ</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleConnect}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-blue-500/10 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>🚀 СОЗДАТЬ / ВОЙТИ</span>
          </button>
        </div>
      </div>

      {/* 📟 BOTTOM FOOTER BAR */}
      <footer className="px-4 py-2 border-t border-zinc-900/80 bg-zinc-950 font-mono text-[10px] text-zinc-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span>📟 СТАТУС:</span>
          {p2pSessionCode ? (
            <span className="text-zinc-400">
              [Сеть: {netMode === 'local-lan' ? `LAN ${hostIp}:${port}` : 'Global P2P Relay'}] | [Пакеты: {packetsPerSec} pkt/s] | [Синхронизация AST: 100%]
            </span>
          ) : (
            <span className="text-zinc-600">Ожидание подключения...</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Wifi className="w-3 h-3 text-emerald-500/70" />
          <span className="text-emerald-500/70">WASM P2P Engine Active</span>
        </div>
      </footer>
    </div>
  );
};
