import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
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
  SignalPort,
  WireConnection,
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
  activeLeftTab: 'solution' | 'toolbox' | 'tree' | 'outline';
  activeRightTab: 'properties' | 'events' | 'code' | 'history' | 'presets';
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

  // Live Emulator, Sandbox, DevOS Desktop & Welcome Hub Mode
  appMode: 'designer' | 'emulator' | 'devos' | 'welcome';
  setAppMode: (mode: 'designer' | 'emulator' | 'devos' | 'welcome') => void;
  exitToWelcomeHub: () => void;
  consoleLogs: VirtualConsoleLog[];
  addConsoleLog: (category: VirtualConsoleLog['category'], text: string, details?: string) => void;
  clearConsoleLogs: () => void;
  messageBoxModal: { isOpen: boolean; title: string; text: string } | null;
  setMessageBoxModal: (modal: { isOpen: boolean; title: string; text: string } | null) => void;
  eventStudioModal: { isOpen: boolean; nodeId?: string; controlName?: string; eventName?: string; initialCode?: string } | null;
  setEventStudioModal: (modal: { isOpen: boolean; nodeId?: string; controlName?: string; eventName?: string; initialCode?: string } | null) => void;

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
  setActiveLeftTab: (tab: 'solution' | 'toolbox' | 'tree' | 'outline') => void;
  setActiveRightTab: (tab: 'properties' | 'events' | 'code' | 'history' | 'presets') => void;
  setCodeDockOpen: (open: boolean) => void;
  setLiveRunOpen: (open: boolean) => void;
  setImportModalOpen: (open: boolean) => void;
  alignSelectedNodes: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'sameWidth' | 'sameHeight' | 'bringForward' | 'sendBackward') => void;
  nudgeSelectedNodes: (dx: number, dy: number) => void;
  duplicateSelectedNodes: () => void;

  // Microsoft VS Standards State & Methods
  isTabOrderMode: boolean;
  nextTabOrderIndex: number;
  setTabOrderMode: (active: boolean) => void;
  setNextTabOrderIndex: (index: number) => void;
  assignTabIndex: (nodeId: string) => void;
  resetTabOrder: () => void;

  errorListOpen: boolean;
  setErrorListOpen: (open: boolean) => void;

  solutionBuildConfiguration: 'Debug' | 'Release';
  solutionBuildPlatform: 'Any CPU' | 'x64' | 'x86' | 'ARM64';
  setSolutionBuildConfiguration: (config: 'Debug' | 'Release') => void;
  setSolutionBuildPlatform: (platform: 'Any CPU' | 'x64' | 'x86' | 'ARM64') => void;

  bringNodeToFront: (nodeId: string) => void;
  sendNodeToBack: (nodeId: string) => void;
  moveNodeOrder: (nodeId: string, direction: 'up' | 'down') => void;

  // 🌟 5 NextGen Mechanics State & Methods
  wires: WireConnection[];
  showWiring: boolean;
  setShowWiring: (show: boolean) => void;
  toggleShowWiring: () => void;
  addWire: (wire: WireConnection) => void;
  removeWire: (wireId: string) => void;
  clearWires: () => void;
  pendingWireStart: SignalPort | null;
  setPendingWireStart: (port: SignalPort | null) => void;

  xrayMode: boolean;
  setXrayMode: (enabled: boolean) => void;
  toggleXrayMode: () => void;

  radialHaloNodeId: string | null;
  setRadialHaloNodeId: (nodeId: string | null) => void;

  morphicMode: 'absolute' | 'adaptive';
  setMorphicMode: (mode: 'absolute' | 'adaptive') => void;
  toggleMorphicMode: () => void;

  injectTableAsGrid: (tableName: string, columns: string[]) => void;

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

  const project = useMemo(() => {
    return store.getProject();
  }, [
    store.version,
    store.projectName,
    store.rootFormId,
    store.activeFormId,
    store.formZOrder,
    store.gridStep,
    store.snapToGrid,
    store.globalTheme,
    store.showGrid,
    store.nodes,
    store.selectedNodeIds,
    store.targetFramework,
    store.rawCustomLines,
    store.orphanedHandlers,
    store.wires,
    store.morphicMode,
    store.xrayMode,
    store.showWiring,
  ]);
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

  // Bi-directional multiplayer synchronization effect
  useEffect(() => {
    if (!p2pInstance) return;

    let isSyncing = false;
    let prevNodes = useDesignerStore.getState().nodes;

    // 1. Sync remote Y.js map changes to local Zustand store
    const syncFromYjs = () => {
      if (isSyncing) return;
      isSyncing = true;
      try {
        const sharedMap = p2pInstance.getSharedNodes();
        const yNodes = sharedMap.toJSON() as Record<string, any>;
        
        // If empty, seed the room with our local nodes
        if (Object.keys(yNodes).length === 0) {
          const localNodes = useDesignerStore.getState().nodes;
          p2pInstance.ydoc.transact(() => {
            Object.entries(localNodes).forEach(([id, node]) => {
              sharedMap.set(id, JSON.parse(JSON.stringify(node)));
            });
          });
          isSyncing = false;
          return;
        }

        // Compare and update local store if different
        const localNodes = useDesignerStore.getState().nodes;
        if (JSON.stringify(localNodes) !== JSON.stringify(yNodes)) {
          useDesignerStore.setState({ nodes: yNodes });
          prevNodes = yNodes;
        }
      } catch (err) {
        console.error('Error syncing from Yjs:', err);
      } finally {
        isSyncing = false;
      }
    };

    const sharedMap = p2pInstance.getSharedNodes();
    sharedMap.observe(syncFromYjs);
    
    // Initial pull
    syncFromYjs();

    // 2. Sync local Zustand store changes to remote Y.js map
    const unsubscribe = useDesignerStore.subscribe((state) => {
      if (isSyncing) return;
      
      const nodes = state.nodes;
      if (nodes === prevNodes) return;

      isSyncing = true;
      try {
        p2pInstance.ydoc.transact(() => {
          // Sync additions and modifications
          Object.entries(nodes).forEach(([id, node]) => {
            const prevNode = prevNodes[id];
            if (!prevNode || prevNode !== node) {
              const yNode = sharedMap.get(id);
              if (!yNode || JSON.stringify(node) !== JSON.stringify(yNode)) {
                sharedMap.set(id, JSON.parse(JSON.stringify(node)));
              }
            }
          });

          // Sync deletions
          Object.keys(prevNodes).forEach((id) => {
            if (!nodes[id]) {
              if (sharedMap.has(id)) {
                sharedMap.delete(id);
              }
            }
          });
        });
        
        prevNodes = nodes;
      } catch (err) {
        console.error('Error syncing to Yjs:', err);
      } finally {
        isSyncing = false;
      }
    });

    return () => {
      sharedMap.unobserve(syncFromYjs);
      unsubscribe();
    };
  }, [p2pInstance]);

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
    exitToWelcomeHub: store.exitToWelcomeHub,
    consoleLogs: store.consoleLogs,
    addConsoleLog: store.addConsoleLog,
    clearConsoleLogs: store.clearConsoleLogs,
    messageBoxModal: store.messageBoxModal,
    setMessageBoxModal: store.setMessageBoxModal,
    eventStudioModal: store.eventStudioModal,
    setEventStudioModal: store.setEventStudioModal,

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

    // Microsoft VS Standards Values & Actions
    isTabOrderMode: store.isTabOrderMode,
    nextTabOrderIndex: store.nextTabOrderIndex,
    setTabOrderMode: store.setTabOrderMode,
    setNextTabOrderIndex: store.setNextTabOrderIndex,
    assignTabIndex: store.assignTabIndex,
    resetTabOrder: store.resetTabOrder,

    errorListOpen: store.errorListOpen,
    setErrorListOpen: store.setErrorListOpen,

    solutionBuildConfiguration: store.solutionBuildConfiguration,
    solutionBuildPlatform: store.solutionBuildPlatform,
    setSolutionBuildConfiguration: store.setSolutionBuildConfiguration,
    setSolutionBuildPlatform: store.setSolutionBuildPlatform,

    bringNodeToFront: store.bringNodeToFront,
    sendNodeToBack: store.sendNodeToBack,
    moveNodeOrder: store.moveNodeOrder,

    // 🌟 5 NextGen Mechanics Values & Actions
    wires: store.wires,
    showWiring: store.showWiring,
    setShowWiring: store.setShowWiring,
    toggleShowWiring: store.toggleShowWiring,
    addWire: store.addWire,
    removeWire: store.removeWire,
    clearWires: store.clearWires,
    pendingWireStart: store.pendingWireStart,
    setPendingWireStart: store.setPendingWireStart,

    xrayMode: store.xrayMode,
    setXrayMode: store.setXrayMode,
    toggleXrayMode: store.toggleXrayMode,

    radialHaloNodeId: store.radialHaloNodeId,
    setRadialHaloNodeId: store.setRadialHaloNodeId,

    morphicMode: store.morphicMode,
    setMorphicMode: store.setMorphicMode,
    toggleMorphicMode: store.toggleMorphicMode,

    injectTableAsGrid: store.injectTableAsGrid,

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
