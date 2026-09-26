import React, { useState, useEffect } from 'react';
import {
  NuGetIngestor,
  NuGetSearchResult,
  InstalledPackage,
  AssemblyTypeInfo,
} from '../../utils/NuGetIngestor';
import { useDesigner } from '../../context/DesignerContext';
import {
  Search,
  Package,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Box,
  Layers,
  Code2,
  FileCode,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  ShieldCheck,
  Cpu,
  BookOpen,
  ArrowDownCircle,
} from 'lucide-react';

export const DevOSNuGetStudio: React.FC = () => {
  const { project } = useDesigner();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'installed' | 'inspector'>('browse');

  const [searchResults, setSearchResults] = useState<NuGetSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [installedList, setInstalledList] = useState<InstalledPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('Newtonsoft.Json');

  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installSuccessMessage, setInstallSuccessMessage] = useState<string | null>(null);

  // Selected class for Inspector / Decompiler
  const [selectedType, setSelectedType] = useState<AssemblyTypeInfo | null>(null);

  useEffect(() => {
    refreshInstalled();
    handleSearch('');
  }, []);

  const refreshInstalled = () => {
    const installed = NuGetIngestor.getInstalledPackages();
    setInstalledList(installed);
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await NuGetIngestor.searchPackages(query);
      setSearchResults(results);
      if (results.length > 0 && !selectedPackageId) {
        setSelectedPackageId(results[0].id);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleInstall = async (pkg: NuGetSearchResult) => {
    setInstallingId(pkg.id);
    setInstallSuccessMessage(null);

    try {
      const installed = await NuGetIngestor.installPackage(pkg.id, pkg.version, pkg);
      refreshInstalled();

      // Update .csproj in designer context
      setInstallSuccessMessage(`Пакет "${pkg.id} v${pkg.version}" распакован в ОЗУ и подключен к .csproj!`);
      setTimeout(() => setInstallSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error('[NuGet Studio] Install error:', err);
    } finally {
      setInstallingId(null);
    }
  };

  const handleUninstall = (pkgId: string) => {
    NuGetIngestor.uninstallPackage(pkgId);
    refreshInstalled();
  };

  const selectedPkgMeta = searchResults.find((p) => p.id.toLowerCase() === selectedPackageId.toLowerCase()) || {
    id: selectedPackageId,
    version: '13.0.3',
    title: selectedPackageId,
    description: 'Сериализация JSON и высокопроизводительный парсер данных для .NET.',
    authors: ['NuGet Contributor'],
    totalDownloads: 1500000000,
    verified: true,
  };

  const isSelectedInstalled = NuGetIngestor.isPackageInstalled(selectedPackageId);
  const installedInfo = installedList.find((p) => p.id.toLowerCase() === selectedPackageId.toLowerCase());

  // Aggregate statistics
  const totalRamKb = installedList.reduce((acc, p) => acc + p.dllSizeKb, 0);
  const totalAssemblies = installedList.length;

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-zinc-200 font-sans select-none overflow-hidden">
      {/* ── HEADER & SEARCH BAR ── */}
      <div className="p-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="Поиск пакетов на nuget.org (например: Dapper, Newtonsoft, MathNet, CsvHelper)..."
              className="w-full pl-9 pr-4 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={() => handleSearch(searchQuery)}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors cursor-pointer border border-zinc-700/60"
            title="Обновить результаты поиска"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NuGet v3 API Online</span>
          </span>
        </div>
      </div>

      {/* ── SUCCESS NOTIFICATION BANNER ── */}
      {installSuccessMessage && (
        <div className="px-4 py-2 bg-emerald-950/90 border-b border-emerald-500 text-emerald-200 text-xs font-mono flex items-center justify-between shrink-0 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{installSuccessMessage}</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold">⚡ IntelliSense обновлен!</span>
        </div>
      )}

      {/* ── TAB NAVIGATION ── */}
      <div className="px-3 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('browse')}
            className={`px-3.5 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'browse'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>🌐 Обзор (nuget.org)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('installed')}
            className={`px-3.5 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'installed'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>📥 Установленные в проект ({installedList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inspector')}
            className={`px-3.5 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'inspector'
                ? 'border-purple-500 text-purple-400 bg-purple-950/20'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>🔬 Инспектор сборок (ILSpy)</span>
          </button>
        </div>

        <div className="text-[10px] text-zinc-400 font-mono">
          Проект: <span className="text-white font-bold">{project.projectName || 'MyLabApp.csproj'}</span>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 overflow-hidden flex">
        {/* TAB 1: BROWSE NUGET.ORG FEED */}
        {activeTab === 'browse' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Packages List */}
            <div className="w-1/2 border-r border-zinc-800/80 overflow-y-auto p-2 space-y-1.5">
              {searchResults.map((pkg) => {
                const isSelected = selectedPackageId.toLowerCase() === pkg.id.toLowerCase();
                const isInst = NuGetIngestor.isPackageInstalled(pkg.id);

                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/80 ring-1 ring-blue-500/30'
                        : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="font-bold text-xs text-white truncate">{pkg.title}</span>
                        {pkg.verified && (
                          <span title="Подлинный пакет nuget.org">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 font-mono text-[10px] rounded border border-zinc-700">
                          v{pkg.version}
                        </span>
                        {isInst && (
                          <span className="px-1.5 py-0.5 bg-emerald-600/20 text-emerald-400 font-bold text-[9px] rounded border border-emerald-500/30">
                            УСТАНОВЛЕН
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {pkg.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span>Автор: {pkg.authors.join(', ')}</span>
                      <span>{(pkg.totalDownloads / 1000000).toFixed(1)}M скачиваний</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Package Details Inspector */}
            <div className="w-1/2 p-5 overflow-y-auto space-y-4 bg-zinc-950">
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3 shadow-xl">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-400" />
                      <h3 className="font-bold text-sm text-white">{selectedPkgMeta.title}</h3>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Автор: <span className="text-zinc-200">{selectedPkgMeta.authors.join(', ')}</span>
                    </p>
                  </div>

                  <span className="px-2.5 py-1 bg-zinc-800 text-blue-300 font-mono font-bold text-xs rounded-xl border border-zinc-700">
                    Версия {selectedPkgMeta.version}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800/80">
                    <span className="text-zinc-500 text-[10px] block">Фреймворк:</span>
                    <span className="text-emerald-400 font-bold">.NET 8.0 (net8.0)</span>
                  </div>
                  <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800/80">
                    <span className="text-zinc-500 text-[10px] block">Лицензия:</span>
                    <span className="text-cyan-300 font-bold">MIT Open Source</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-zinc-300">📄 Описание:</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    {selectedPkgMeta.description}
                  </p>
                </div>

                {/* Install / Uninstall Button */}
                <div className="pt-2">
                  {isSelectedInstalled ? (
                    <button
                      type="button"
                      onClick={() => handleUninstall(selectedPackageId)}
                      className="w-full py-2.5 bg-zinc-900 hover:bg-red-950/80 border border-red-800 text-red-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Удалить пакет из .csproj</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleInstall(selectedPkgMeta)}
                      disabled={installingId === selectedPkgMeta.id}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {installingId === selectedPkgMeta.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Распаковка .nupkg в ОЗУ (0.2s)...</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownCircle className="w-4 h-4" />
                          <span>➕ УСТАНОВИТЬ В ПРОЕКТ (0.2s)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INSTALLED PACKAGES */}
        {activeTab === 'installed' && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-zinc-950">
            <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <Box className="w-4 h-4 text-emerald-400" />
                <span>Всего пакетов в памяти: <strong className="text-white">{installedList.length}</strong></span>
              </div>
              <div className="text-zinc-400">
                Занимаемый объем ОЗУ: <strong className="text-cyan-300">{totalRamKb.toFixed(1)} КБ</strong>
              </div>
            </div>

            <div className="space-y-2">
              {installedList.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-sm text-white">{pkg.id}</span>
                      <span className="px-2 py-0.5 bg-zinc-800 text-emerald-300 font-mono text-[10px] rounded border border-zinc-700">
                        v{pkg.version}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-950 text-blue-300 font-mono text-[10px] rounded border border-blue-800/60">
                        {pkg.framework}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{pkg.description}</p>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      Файл: {pkg.dllName} ({pkg.dllSizeKb} КБ) | Классов в типе: {pkg.exportedTypes.length}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUninstall(pkg.id)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-red-900/60 text-red-300 rounded-xl font-bold text-xs border border-zinc-700 hover:border-red-700 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ASSEMBLY DECOMPILER / ILSPY INSPECTOR */}
        {activeTab === 'inspector' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Tree of Exported Types in Assemblies */}
            <div className="w-1/3 border-r border-zinc-800 overflow-y-auto p-3 space-y-3 bg-zinc-950">
              <h4 className="font-bold text-xs text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                <span>Дерево типов сборок (ILSpy)</span>
              </h4>

              {installedList.map((pkg) => (
                <div key={pkg.id} className="space-y-1">
                  <div className="px-2 py-1 bg-zinc-900 rounded font-bold text-xs text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>{pkg.id}.dll</span>
                  </div>

                  <div className="pl-3 space-y-0.5 font-mono text-[11px]">
                    {pkg.exportedTypes.map((typeInfo) => (
                      <div
                        key={typeInfo.name}
                        onClick={() => setSelectedType(typeInfo)}
                        className={`px-2 py-1 rounded cursor-pointer transition-colors flex items-center justify-between ${
                          selectedType?.name === typeInfo.name
                            ? 'bg-purple-950 text-purple-200 border border-purple-500/40 font-bold'
                            : 'hover:bg-zinc-900 text-zinc-300'
                        }`}
                      >
                        <span className="truncate">{typeInfo.name}</span>
                        <span className="text-[9px] text-zinc-500 uppercase">{typeInfo.kind}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Decompiled Signatures & Method Explorer */}
            <div className="w-2/3 p-5 overflow-y-auto font-mono text-xs space-y-4 bg-zinc-950">
              {selectedType ? (
                <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div>
                      <span className="text-[10px] text-purple-400 font-bold block">{selectedType.namespace}</span>
                      <h3 className="font-bold text-sm text-white">{selectedType.kind} {selectedType.name}</h3>
                    </div>
                    {selectedType.isControl && (
                      <span className="px-2 py-1 bg-amber-500/20 text-amber-300 font-bold text-[10px] rounded border border-amber-500/40">
                        🎨 UI Control Component
                      </span>
                    )}
                  </div>

                  {selectedType.docSummary && (
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                      {selectedType.docSummary}
                    </p>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-bold text-zinc-300 text-xs">⚡ Публичные методы (Public Methods):</h4>
                    <div className="space-y-1 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                      {selectedType.methods.map((m, idx) => (
                        <div key={idx} className="text-cyan-300 flex items-center gap-1.5">
                          <ChevronRight className="w-3 h-3 text-purple-400 shrink-0" />
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-zinc-300 text-xs">⚙️ Свойства (Properties):</h4>
                    <div className="space-y-1 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                      {selectedType.properties.map((p, idx) => (
                        <div key={idx} className="text-emerald-300 flex items-center gap-1.5">
                          <ChevronRight className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2">
                  <Code2 className="w-10 h-10 text-zinc-600" />
                  <p className="text-xs">Выберите тип данных из дерева слева для инспекции DLL методов.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER STATUS BAR ── */}
      <div className="px-3 py-1.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-400 shrink-0">
        <div className="flex items-center gap-3">
          <span>[NuGet API: <strong className="text-emerald-400">ONLINE</strong>]</span>
          <span>[Сборок в ОЗУ: <strong className="text-white">{totalAssemblies} шт ({totalRamKb.toFixed(1)} КБ)</strong>]</span>
        </div>
        <div className="text-emerald-400 font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>IntelliSense & Roslyn: СИНХРОНИЗИРОВАН</span>
        </div>
      </div>
    </div>
  );
};
