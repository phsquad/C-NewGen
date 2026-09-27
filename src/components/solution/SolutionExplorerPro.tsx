import React, { useState, useMemo } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { NuGetIngestor } from '../../utils/NuGetIngestor';
import {
  FolderTree,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileCode,
  FileText,
  Boxes,
  Package,
  Layers,
  Sparkles,
  AppWindow,
  Search,
  RefreshCw,
  Plus,
  Settings,
  MoreVertical,
  Check,
  Code2,
  Cpu,
  Shield,
  Eye,
  Trash2,
  ExternalLink,
} from 'lucide-react';

export const SolutionExplorerPro: React.FC = () => {
  const {
    project,
    activeFormId,
    setActiveFormId,
    getAllForms,
    addForm,
    setCodeDockOpen,
    solutionBuildConfiguration,
    solutionBuildPlatform,
    setSolutionBuildConfiguration,
    setSolutionBuildPlatform,
  } = useDesigner();

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({
    solutionRoot: false,
    projectRoot: false,
    dependencies: false,
    packages: false,
    frameworks: false,
    properties: true,
  });

  const allForms = getAllForms();
  const rootForm = project.nodes[project.rootFormId];
  const projectName = project.projectName || (rootForm?.properties.name ? `${rootForm.properties.name}App` : 'WinFormsApp1');

  // Installed NuGet packages list
  const nugetPackages = useMemo(() => {
    const defaultPackages = [
      { name: 'Newtonsoft.Json', version: '13.0.3' },
      { name: 'Microsoft.Extensions.Logging', version: '8.0.0' },
    ];
    try {
      const dynamicPackages = NuGetIngestor.getInstalledPackages();
      if (dynamicPackages && dynamicPackages.length > 0) {
        return [...defaultPackages, ...dynamicPackages.map(p => ({ name: p.id, version: p.version }))];
      }
    } catch {
      // fallback
    }
    return defaultPackages;
  }, []);

  const toggleNode = (nodeKey: string) => {
    setCollapsedNodes(prev => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    Object.keys(collapsedNodes).forEach(k => {
      next[k] = true;
    });
    allForms.forEach(f => {
      next[`form_${f.id}`] = true;
    });
    setCollapsedNodes(next);
  };

  const expandAll = () => {
    setCollapsedNodes({});
  };

  const handleOpenFile = (type: 'designer' | 'behind' | 'program' | 'csproj' | 'readme', formId?: string) => {
    if (formId) {
      setActiveFormId(formId);
    }
    setCodeDockOpen(true);
    // Dispatch event to select code tab
    window.dispatchEvent(new CustomEvent('set-code-tab', { detail: type }));
  };

  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase().trim());
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-xs bg-zinc-900 select-none">
      {/* 1. Configuration Bar: [ Debug ▼ ] / [ Release ▼ ] & [ Any CPU ▼ ] */}
      <div className="px-2 py-1.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {/* Debug / Release Selector */}
          <div className="relative flex-1">
            <select
              value={solutionBuildConfiguration}
              onChange={e => setSolutionBuildConfiguration(e.target.value as any)}
              className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-700/80 rounded px-2 py-1 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
              title="Конфигурация сборки решения (Debug / Release)"
            >
              <option value="Debug">Debug</option>
              <option value="Release">Release</option>
            </select>
          </div>

          {/* Any CPU / Platform Selector */}
          <div className="relative flex-1">
            <select
              value={solutionBuildPlatform}
              onChange={e => setSolutionBuildPlatform(e.target.value as any)}
              className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-700/80 rounded px-2 py-1 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
              title="Целевая архитектура платформы"
            >
              <option value="Any CPU">Any CPU</option>
              <option value="x64">x64</option>
              <option value="x86">x86</option>
              <option value="ARM64">ARM64</option>
            </select>
          </div>
        </div>

        {/* Quick Toolbar Actions */}
        <div className="flex items-center gap-0.5 shrink-0 text-zinc-400">
          <button
            type="button"
            onClick={() => addForm()}
            title="Добавить новую форму Windows Forms"
            className="p-1 hover:bg-zinc-800 text-blue-400 hover:text-blue-300 rounded cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={collapseAll}
            title="Свернуть все узлы"
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded cursor-pointer transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={expandAll}
            title="Развернуть все узлы"
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded cursor-pointer transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Search Filter Bar */}
      <div className="p-2 border-b border-zinc-800/80 bg-zinc-900/50">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Поиск по решению (Ctrl+;)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded pl-8 pr-2.5 py-1 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-zinc-500 hover:text-zinc-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. Tree View: Canonically structured Solution Explorer */}
      <div className="flex-1 overflow-y-auto py-1 font-mono text-xs">
        {/* Solution Node */}
        <div className="select-none">
          <div
            onClick={() => toggleNode('solutionRoot')}
            className="px-2 py-1 flex items-center gap-1.5 hover:bg-zinc-800/60 cursor-pointer text-zinc-300 font-semibold"
          >
            {collapsedNodes['solutionRoot'] ? (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            )}
            <FolderTree className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Solution '{projectName}' (1 of 1 project)</span>
          </div>

          {!collapsedNodes['solutionRoot'] && (
            <div className="pl-4">
              {/* Project Node (.csproj) */}
              <div
                onClick={() => toggleNode('projectRoot')}
                className="px-2 py-1 flex items-center gap-1.5 hover:bg-zinc-800/60 cursor-pointer text-zinc-200 font-semibold"
              >
                {collapsedNodes['projectRoot'] ? (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                )}
                <Code2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate text-white">{projectName}</span>
                <span className="text-[10px] text-zinc-500 font-normal">(.NET 8.0-windows)</span>
              </div>

              {!collapsedNodes['projectRoot'] && (
                <div className="pl-4 space-y-0.5">
                  {/* --- Dependencies Node --- */}
                  <div>
                    <div
                      onClick={() => toggleNode('dependencies')}
                      className="px-2 py-0.5 flex items-center gap-1.5 hover:bg-zinc-800/60 cursor-pointer text-zinc-400"
                    >
                      {collapsedNodes['dependencies'] ? (
                        <ChevronRight className="w-3 h-3 text-zinc-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                      )}
                      <Boxes className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Dependencies</span>
                    </div>

                    {!collapsedNodes['dependencies'] && (
                      <div className="pl-4 space-y-0.5 text-zinc-400">
                        {/* Packages Sub-node */}
                        <div>
                          <div
                            onClick={() => toggleNode('packages')}
                            className="px-2 py-0.5 flex items-center gap-1.5 hover:bg-zinc-800/60 cursor-pointer text-zinc-400"
                          >
                            {collapsedNodes['packages'] ? (
                              <ChevronRight className="w-3 h-3 text-zinc-500 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                            )}
                            <Package className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>Packages</span>
                            <span className="text-[10px] text-zinc-600">({nugetPackages.length})</span>
                          </div>

                          {!collapsedNodes['packages'] && (
                            <div className="pl-4 space-y-0.5 text-[11px]">
                              {nugetPackages.map(pkg => (
                                <div
                                  key={pkg.name}
                                  className="px-2 py-0.5 flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 rounded truncate cursor-default"
                                  title={`${pkg.name} (v${pkg.version})`}
                                >
                                  <Package className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                  <span className="truncate">{pkg.name}</span>
                                  <span className="text-[9px] text-zinc-500 font-sans">({pkg.version})</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Frameworks Sub-node */}
                        <div>
                          <div
                            onClick={() => toggleNode('frameworks')}
                            className="px-2 py-0.5 flex items-center gap-1.5 hover:bg-zinc-800/60 cursor-pointer text-zinc-400"
                          >
                            {collapsedNodes['frameworks'] ? (
                              <ChevronRight className="w-3 h-3 text-zinc-500 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                            )}
                            <Layers className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span>Frameworks</span>
                          </div>

                          {!collapsedNodes['frameworks'] && (
                            <div className="pl-4 space-y-0.5 text-[11px]">
                              <div className="px-2 py-0.5 flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200">
                                <Cpu className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                                <span className="truncate">Microsoft.NETCore.App</span>
                              </div>
                              <div className="px-2 py-0.5 flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200">
                                <AppWindow className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                                <span className="truncate">Microsoft.WindowsDesktop.App.WindowsForms</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* --- Properties Node --- */}
                  <div>
                    <div
                      onClick={() => toggleNode('properties')}
                      className="px-2 py-0.5 flex items-center gap-1.5 hover:bg-zinc-800/60 cursor-pointer text-zinc-400"
                    >
                      {collapsedNodes['properties'] ? (
                        <ChevronRight className="w-3 h-3 text-zinc-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                      )}
                      <Settings className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>Properties</span>
                    </div>

                    {!collapsedNodes['properties'] && (
                      <div className="pl-4 space-y-0.5 text-[11px]">
                        <div
                          onClick={() => handleOpenFile('behind')}
                          className="px-2 py-0.5 flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 rounded cursor-pointer"
                        >
                          <FileCode className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>AssemblyInfo.cs</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* --- CANONICAL NESTED FORMS (Form1.cs -> Form1.Designer.cs & Form1.resx) --- */}
                  <div className="pt-1">
                    {allForms.map(formNode => {
                      const fName = formNode.properties.name || 'Form1';
                      const formKey = `form_${formNode.id}`;
                      const isCollapsed = collapsedNodes[formKey] !== undefined ? collapsedNodes[formKey] : false;
                      const isActive = activeFormId === formNode.id;

                      if (!matchesSearch(fName) && !matchesSearch(`${fName}.Designer.cs`) && !matchesSearch(`${fName}.resx`)) {
                        return null;
                      }

                      return (
                        <div key={formNode.id} className="select-none">
                          {/* Parent: Form1.cs */}
                          <div
                            className={`group px-2 py-1 flex items-center justify-between rounded hover:bg-zinc-800/70 cursor-pointer transition-colors ${
                              isActive ? 'bg-blue-600/15 text-blue-300 font-semibold' : 'text-zinc-300'
                            }`}
                            onClick={() => {
                              setActiveFormId(formNode.id);
                              handleOpenFile('behind', formNode.id);
                            }}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleNode(formKey);
                                }}
                                className="p-0.5 hover:text-white text-zinc-500"
                              >
                                {isCollapsed ? (
                                  <ChevronRight className="w-3 h-3 shrink-0" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 shrink-0" />
                                )}
                              </button>
                              <AppWindow className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span className="truncate">{fName}.cs</span>
                            </div>

                            <span className="text-[10px] text-zinc-500 font-sans opacity-0 group-hover:opacity-100 transition-opacity">
                              Дизайнер
                            </span>
                          </div>

                          {/* Children: Form1.Designer.cs & Form1.resx nested inside Form1.cs */}
                          {!isCollapsed && (
                            <div className="pl-6 space-y-0.5 border-l border-zinc-800/60 ml-3 my-0.5">
                              {/* Form1.Designer.cs */}
                              <div
                                onClick={() => {
                                  setActiveFormId(formNode.id);
                                  handleOpenFile('designer', formNode.id);
                                }}
                                className="px-2 py-0.5 flex items-center gap-1.5 text-zinc-400 hover:text-blue-300 hover:bg-zinc-800/50 rounded cursor-pointer transition-colors"
                                title="Сгенерированный файл инициализации компонентов Windows Forms"
                              >
                                <FileCode className="w-3 h-3 text-cyan-400 shrink-0" />
                                <span className="truncate">{fName}.Designer.cs</span>
                              </div>

                              {/* Form1.resx */}
                              <div
                                onClick={() => handleOpenFile('readme')}
                                className="px-2 py-0.5 flex items-center gap-1.5 text-zinc-400 hover:text-amber-300 hover:bg-zinc-800/50 rounded cursor-pointer transition-colors"
                                title="XML-файл ресурсов и строк формы"
                              >
                                <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate">{fName}.resx</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* --- Standalone C# & Project Files --- */}
                  <div className="pt-1 space-y-0.5">
                    {/* Program.cs */}
                    {matchesSearch('Program.cs') && (
                      <div
                        onClick={() => handleOpenFile('program')}
                        className="px-2 py-0.5 flex items-center gap-1.5 text-zinc-300 hover:text-blue-300 hover:bg-zinc-800/60 rounded cursor-pointer transition-colors"
                        title="Точка входа приложения: static void Main()"
                      >
                        <FileCode className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        <span className="truncate">Program.cs</span>
                      </div>
                    )}

                    {/* ProjectName.csproj */}
                    {matchesSearch(`${projectName}.csproj`) && (
                      <div
                        onClick={() => handleOpenFile('csproj')}
                        className="px-2 py-0.5 flex items-center gap-1.5 text-zinc-300 hover:text-blue-300 hover:bg-zinc-800/60 rounded cursor-pointer transition-colors"
                        title="MSBuild C# Project File"
                      >
                        <FileCode className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate">{projectName}.csproj</span>
                      </div>
                    )}

                    {/* App.config */}
                    {matchesSearch('App.config') && (
                      <div
                        onClick={() => handleOpenFile('csproj')}
                        className="px-2 py-0.5 flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded cursor-pointer transition-colors"
                        title="Конфигурация приложения"
                      >
                        <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">App.config</span>
                      </div>
                    )}

                    {/* README.md */}
                    {matchesSearch('README.md') && (
                      <div
                        onClick={() => handleOpenFile('readme')}
                        className="px-2 py-0.5 flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded cursor-pointer transition-colors"
                        title="Документация и инструкция по запуску"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">README.md</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-2 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
        <span>MSBuild SDK v8.0</span>
        <span className="text-emerald-400">● 100% C# Compliant</span>
      </div>
    </div>
  );
};
