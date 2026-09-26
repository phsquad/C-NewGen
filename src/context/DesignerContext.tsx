import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  DesignerProjectState,
  DesignerNode,
  ControlType,
  LayoutBounds,
  NodeProperties,
  NodeEvents,
  SnapGuide,
  EquidistantTick,
  SnapTargetTelemetry,
  TargetFramework,
  OSFrameTheme,
  GridStep,
} from '../types/ast';
import { useDesignerStore, ToolboxDragStatus } from '../store/designerStore';
import { WasmEngineStatus } from '../utils/wasmEngine';
import { StorageStatusInfo } from '../utils/debouncedStorage';
import { DpiMode } from '../utils/dpiNormalizer';
import { VirtualConsoleLog } from '../utils/mockRuntime';
import { HistoryCommand } from '../utils/historyEngine';
import { P2PCollaborationStudio, RemotePeerCursor } from '../utils/P2PCollaborationStudio';

interface DesignerContextType {
  project: DesignerProjectState;
  nodes: Record<string, DesignerNode>;
  selectedNodes: DesignerNode[];
  selectedNode: DesignerNode | null;
  wasmStatus: WasmEngineStatus;
  zoom: number;
  panOffset: { x: number; y: number };
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
  snapGuides: SnapGuide[];
  equidistantTicks: EquidistantTick[];
  snapTelemetry: SnapTargetTelemetry | null;
  isPanMode: boolean;
  cursorPos: { screenX: number; screenY: number; formX: number | null; formY: number | null };
  fps: number;
  dpi: number;
  dpr: number;
  activeLeftTab: 'toolbox' | 'tree';
  activeRightTab: 'properties' | 'events' | 'code';
  codeDockOpen: boolean;
  liveRunOpen: boolean;
  importModalOpen: boolean;
  toolboxDragState: ToolboxDragStatus | null;
  setToolboxDragState: (status: Partial<ToolboxDragStatus> | null) => void;
  hasUnsavedChanges: boolean;
  storageStatusInfo: StorageStatusInfo;
  canUndo: boolean;
  canRedo: boolean;
  historyJournal: HistoryCommand[];
  redoJournal: HistoryCommand[];
  historyPanelOpen: boolean;
  setHistoryPanelOpen: (open: boolean) => void;
  beginTransaction: () => void;
  commitTransaction: (description: string, category?: HistoryCommand['category']) => void;
  cancelTransaction: () => void;
  createCheckpoint: (customLabel?: string) => void;
  jumpToHistoryStep: (targetStepNumber: number) => void;
  getHistoryMemorySizeKb: () => number;
  nextUndoDescription: string | null;
  nextRedoDescription: string | null;

  // Multi-Form & OS Skins
  activeFormId: string;
  formZOrder: string[];
  globalTheme: OSFrameTheme;
  gridStep: GridStep;
  setActiveFormId: (id: string) => void;
  bringFormToFront: (formId: string) => void;
  setGlobalTheme: (theme: OSFrameTheme) => void;
  setGridStep: (step: GridStep) => void;
  addForm: (className?: string, title?: string, bounds?: Partial<LayoutBounds>, theme?: OSFrameTheme) => string;
  removeForm: (formId: string) => void;
  getAllForms: () => DesignerNode[];

  // Live Emulator, Sandbox & DevOS Desktop Mode
  appMode: 'designer' | 'emulator' | 'devos';
  setAppMode: (mode: 'designer' | 'emulator' | 'devos') => void;
  consoleLogs: VirtualConsoleLog[];
  addConsoleLog: (category: VirtualConsoleLog['category'], text: string, details?: string) => void;
  clearConsoleLogs: () => void;
  messageBoxModal: { isOpen: boolean; title: string; text: string } | null;
  setMessageBoxModal: (modal: { isOpen: boolean; title: string; text: string } | null) => void;

  // Methods
  selectNode: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  updateNodeBounds: (id: string, bounds: Partial<LayoutBounds>, recordHistory?: boolean) => void;
  updateMultipleNodeBounds: (updates: Record<string, Partial<LayoutBounds>>, recordHistory?: boolean) => void;
  updateNodeProperties: (id: string, props: Partial<NodeProperties>, recordHistory?: boolean) => void;
  updateMultipleNodesProperties: (nodeIds: string[], props: Partial<NodeProperties>, recordHistory?: boolean) => void;
  updateNodeEvents: (id: string, events: Partial<NodeEvents>) => void;
  addControl: (type: ControlType, parentId?: string, position?: { x: number; y: number }) => string;
  applyQuickTemplate: (type: 'login' | 'tableFilter' | 'confirmDialog', targetParentId?: string, position?: { x: number; y: number }) => void;
  deleteSelectedNodes: () => void;
  reparentNode: (nodeId: string, newParentId: string) => void;
  setTargetFramework: (target: TargetFramework) => void;
  setProjectState: (newState: DesignerProjectState) => void;
  saveProject: () => void;
  undo: () => void;
  redo: () => void;
  setZoom: (z: number | ((prev: number) => number)) => void;
  setPanOffset: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  resetView: () => void;
  setSnapToGrid: (val: boolean) => void;
  setShowGrid: (val: boolean) => void;
  setSnapGuides: (guides: SnapGuide[]) => void;
  setEquidistantTicks: (ticks: EquidistantTick[]) => void;
  setSnapTelemetry: (telemetry: SnapTargetTelemetry | null) => void;
  setIsPanMode: (val: boolean) => void;
  activeDpiMode: DpiMode;
  setActiveDpiMode: (mode: DpiMode) => void;
  setCursorPos: (pos: { screenX: number; screenY: number; formX: number | null; formY: number | null }) => void;
  setFps: (fps: number) => void;
  setActiveLeftTab: (tab: 'toolbox' | 'tree') => void;
  setActiveRightTab: (tab: 'properties' | 'events' | 'code') => void;
  setCodeDockOpen: (open: boolean) => void;
  setLiveRunOpen: (open: boolean) => void;
  setImportModalOpen: (open: boolean) => void;
  alignSelectedNodes: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'sameWidth' | 'sameHeight' | 'bringForward' | 'sendBackward') => void;
  nudgeSelectedNodes: (dx: number, dy: number) => void;
  duplicateSelectedNodes: () => void;

  // P2P Multiplayer Extension
  p2pSessionCode: string | null;
  p2pPeers: RemotePeerCursor[];
  startP2PSession: (code?: string) => void;
  stopP2PSession: () => void;
  p2pInstance: P2PCollaborationStudio | null;
}

const DesignerContext = createContext<DesignerContextType | null>(null);

export const DesignerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useDesignerStore();

  const project = store.getProject();
  const selectedNode = store.getSelectedNode();
  const selectedNodes = store.getSelectedNodes();
  const wasmStatus = store.getWasmStatus();

  // P2P Collaboration State & Ref to prevent stale closures and duplicate creation (Pravka 25.1.2)
  const [p2pSessionCode, setP2pSessionCode] = useState<string | null>(null);
  const [p2pPeers, setP2pPeers] = useState<RemotePeerCursor[]>([]);
  const [p2pInstance, setP2pInstance] = useState<P2PCollaborationStudio | null>(null);
  const p2pRef = useRef<P2PCollaborationStudio | null>(null);

  const startP2PSession = (code?: string) => {
    const finalCode = code || `DEV-${Math.floor(100 + Math.random() * 900)}`;
    
    // Always clean up existing ref immediately to avoid any parallel socket/doc creation
    if (p2pRef.current) {
      p2pRef.current.destroy();
      p2pRef.current = null;
    }

    const instance = new P2PCollaborationStudio(finalCode, 'Вы', '#3B82F6');
    p2pRef.current = instance;
    setP2pSessionCode(finalCode);
    setP2pInstance(instance);

    instance.registerOnPeersChange(() => {
      setP2pPeers(Array.from(instance.peers.values()));
    });
    // Set initial list
    setP2pPeers(Array.from(instance.peers.values()));

    // Synchronize Node modifications
    instance.registerOnNodeSync((nodeId, nodeData) => {
      if (nodeData.bounds) {
        store.updateNodeBounds(nodeId, nodeData.bounds, false);
      }
      if (nodeData.properties) {
        store.updateNodeProperties(nodeId, nodeData.properties, false);
      }
    });
  };

  const stopP2PSession = () => {
    if (p2pRef.current) {
      p2pRef.current.destroy();
      p2pRef.current = null;
    }
    setP2pInstance(null);
    setP2pSessionCode(null);
    setP2pPeers([]);
  };

  // By default, start in Solo (offline) mode
  useEffect(() => {
    return () => {
      // Direct access to ref inside cleanup ensures strict React 18/19 compatibility
      if (p2pRef.current) {
        p2pRef.current.destroy();
        p2pRef.current = null;
      }
    };
  }, []);

  const value: DesignerContextType = {
    project,
    nodes: store.nodes,
    selectedNodes,
    selectedNode,
    wasmStatus,
    zoom: store.zoom,
    panOffset: store.panOffset,
    snapToGrid: store.snapToGrid,
    gridSize: store.gridSize,
    showGrid: store.showGrid,
    snapGuides: store.snapGuides,
    equidistantTicks: store.equidistantTicks,
    snapTelemetry: store.snapTelemetry,
    isPanMode: store.isPanMode,
    cursorPos: store.cursorPos,
    fps: store.fps,
    dpi: store.dpi,
    dpr: store.dpr,
    activeLeftTab: store.activeLeftTab,
    activeRightTab: store.activeRightTab,
    codeDockOpen: store.codeDockOpen,
    liveRunOpen: store.liveRunOpen,
    importModalOpen: store.importModalOpen,
    toolboxDragState: store.toolboxDragState,
    setToolboxDragState: store.setToolboxDragState,
    hasUnsavedChanges: store.hasUnsavedChanges,
    storageStatusInfo: store.storageStatusInfo,
    canUndo: store.historyJournal.length > 0 || store.undoStack.length > 0,
    canRedo: store.redoJournal.length > 0 || store.redoStack.length > 0,
    historyJournal: store.historyJournal,
    redoJournal: store.redoJournal,
    historyPanelOpen: store.historyPanelOpen,
    setHistoryPanelOpen: store.setHistoryPanelOpen,
    createCheckpoint: store.createCheckpoint,
    jumpToHistoryStep: store.jumpToHistoryStep,
    getHistoryMemorySizeKb: store.getHistoryMemorySizeKb,
    nextUndoDescription: store.historyJournal.length > 0
      ? store.historyJournal[store.historyJournal.length - 1].description
      : null,
    nextRedoDescription: store.redoJournal.length > 0
      ? store.redoJournal[0].description
      : null,

    appMode: store.appMode,
    setAppMode: store.setAppMode,
    consoleLogs: store.consoleLogs,
    addConsoleLog: store.addConsoleLog,
    clearConsoleLogs: store.clearConsoleLogs,
    messageBoxModal: store.messageBoxModal,
    setMessageBoxModal: store.setMessageBoxModal,

    activeFormId: store.activeFormId,
    formZOrder: store.formZOrder,
    globalTheme: store.globalTheme,
    gridStep: store.gridStep,
    setActiveFormId: store.setActiveFormId,
    bringFormToFront: store.bringFormToFront,
    setGlobalTheme: store.setGlobalTheme,
    setGridStep: store.setGridStep,
    addForm: store.addForm,
    removeForm: store.removeForm,
    getAllForms: store.getAllForms,

    selectNode: store.selectNode,
    clearSelection: store.clearSelection,
    updateNodeBounds: store.updateNodeBounds,
    updateMultipleNodeBounds: store.updateMultipleNodeBounds,
    updateNodeProperties: store.updateNodeProperties,
    updateMultipleNodesProperties: store.updateMultipleNodesProperties,
    updateNodeEvents: store.updateNodeEvents,
    beginTransaction: store.beginTransaction,
    commitTransaction: store.commitTransaction,
    cancelTransaction: store.cancelTransaction,
    addControl: store.addControl,
    applyQuickTemplate: store.applyQuickTemplate,
    deleteSelectedNodes: store.deleteSelectedNodes,
    reparentNode: store.reparentNode,
    setTargetFramework: store.setTargetFramework,
    setProjectState: store.setProjectState,
    saveProject: store.saveProject,
    undo: store.undo,
    redo: store.redo,
    setZoom: store.setZoom,
    setPanOffset: store.setPanOffset,
    resetView: store.resetView,
    setSnapToGrid: store.setSnapToGrid,
    setShowGrid: store.setShowGrid,
    setSnapGuides: store.setSnapGuides,
    setEquidistantTicks: store.setEquidistantTicks,
    setSnapTelemetry: store.setSnapTelemetry,
    setIsPanMode: store.setIsPanMode,
    activeDpiMode: store.activeDpiMode,
    setActiveDpiMode: store.setActiveDpiMode,
    setCursorPos: store.setCursorPos,
    setFps: store.setFps,
    setActiveLeftTab: store.setActiveLeftTab,
    setActiveRightTab: store.setActiveRightTab,
    setCodeDockOpen: store.setCodeDockOpen,
    setLiveRunOpen: store.setLiveRunOpen,
    setImportModalOpen: store.setImportModalOpen,
    alignSelectedNodes: store.alignSelectedNodes,
    nudgeSelectedNodes: store.nudgeSelectedNodes,
    duplicateSelectedNodes: store.duplicateSelectedNodes,

    // P2P Multiplayer Values
    p2pSessionCode,
    p2pPeers,
    startP2PSession,
    stopP2PSession,
    p2pInstance,
  };

  return (
    <DesignerContext.Provider value={value}>
      {children}
    </DesignerContext.Provider>
  );
};

export const useDesigner = () => {
  const context = useContext(DesignerContext);
  if (!context) {
    throw new Error('useDesigner must be used within DesignerProvider');
  }
  return context;
};
