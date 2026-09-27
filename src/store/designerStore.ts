import { create } from 'zustand';
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
  OrphanedEventHandler,
  SignalPort,
  WireConnection,
} from '../types/ast';
import {
  HistoryCommand,
  createHistoryCommand,
  applyHistoryPatches,
  calculateHistoryMemoryKb,
} from '../utils/historyEngine';
import { createLoginTemplate, createMultiFormTemplate } from '../utils/templates';
import { loadProjectFromLocalStorage } from '../utils/storage';
import { debouncedStorage, StorageStatusInfo } from '../utils/debouncedStorage';
import { validateProjectAst, WasmEngineStatus } from '../utils/wasmEngine';
import { sanitizeCsIdentifier } from '../utils/csharpSanitizer';
import { DpiMode, DPI_PROFILES } from '../utils/dpiNormalizer';
import { VirtualConsoleLog, getTimestamp } from '../utils/mockRuntime';
import { COMPONENT_REGISTRY } from '../utils/componentRegistry';
import { insertLoginBlock, insertTableFilterBlock, insertConfirmationDialogBlock } from '../utils/quickTemplates';
import { migrateProjectSchema, CURRENT_SCHEMA_VERSION } from '../utils/schemaMigrator';
import { broadcastProjectUpdate, broadcastProjectSaved } from '../utils/tabBroadcast';
import { getActiveDirectoryHandle, syncProjectToLocalDirectory } from '../utils/fileSystemSync';

export interface ToolboxDragStatus {
  isDragging: boolean;
  controlType: ControlType | null;
  targetContainerId: string | null;
  targetContainerName: string | null;
  futureName: string | null;
  localPos: { x: number; y: number } | null;
  screenPos: { x: number; y: number } | null;
}

export interface DesignerStoreState {
  // Flat Entity Store - Key-Value Hash Table O(1)
  nodes: Record<string, DesignerNode>;
  rootFormId: string;
  selectedNodeIds: string[];
  version: string;
  projectName: string;
  targetFramework: TargetFramework;

  // Multi-Form Stacking Context, Form Focus Arbiter & OS Skins
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

  // History Stacks & RFC 6902 Delta Commands Journal
  undoStack: DesignerProjectState[];
  redoStack: DesignerProjectState[];
  historyJournal: HistoryCommand[];
  redoJournal: HistoryCommand[];
  transactionBaseState: DesignerProjectState | null;
  historyPanelOpen: boolean;
  setHistoryPanelOpen: (open: boolean) => void;
  beginTransaction: () => void;
  commitTransaction: (description: string, category?: HistoryCommand['category']) => void;
  cancelTransaction: () => void;
  createCheckpoint: (customLabel?: string) => void;
  jumpToHistoryStep: (targetStepNumber: number) => void;
  getHistoryMemorySizeKb: () => number;
  hasUnsavedChanges: boolean;
  storageStatusInfo: StorageStatusInfo;

  // Viewport & Canvas Settings
  zoom: number;
  panOffset: { x: number; y: number };
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
  snapGuides: SnapGuide[];
  equidistantTicks: EquidistantTick[];
  snapTelemetry: SnapTargetTelemetry | null;
  isPanMode: boolean;
  activeDpiMode: DpiMode;

  // Viewport Telemetry
  cursorPos: { screenX: number; screenY: number; formX: number | null; formY: number | null };
  fps: number;
  dpi: number;
  dpr: number;

  // Panels & Modals State
  activeLeftTab: 'solution' | 'toolbox' | 'tree' | 'outline';
  activeRightTab: 'properties' | 'events' | 'code' | 'history';
  codeDockOpen: boolean;
  liveRunOpen: boolean;
  importModalOpen: boolean;
  orphanedHandlers: OrphanedEventHandler[];
  rawCustomLines: string[];

  // Microsoft VS Standards State
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
  // 1. Visual Signal-Wiring
  wires: WireConnection[];
  showWiring: boolean;
  setShowWiring: (show: boolean) => void;
  toggleShowWiring: () => void;
  addWire: (wire: WireConnection) => void;
  removeWire: (wireId: string) => void;
  clearWires: () => void;
  pendingWireStart: SignalPort | null;
  setPendingWireStart: (port: SignalPort | null) => void;

  // 2. 2.5D X-Ray Layering
  xrayMode: boolean;
  setXrayMode: (enabled: boolean) => void;
  toggleXrayMode: () => void;

  // 3. Radial Action Halo
  radialHaloNodeId: string | null;
  setRadialHaloNodeId: (nodeId: string | null) => void;

  // 4. Morphic Layout Engine
  morphicMode: 'absolute' | 'adaptive';
  setMorphicMode: (mode: 'absolute' | 'adaptive') => void;
  toggleMorphicMode: () => void;

  // 5. Quantum Loop 4-in-1 (SQLite ⟷ Designer ⟷ AST ⟷ Code)
  injectTableAsGrid: (tableName: string, columns: string[], sampleRows?: any[]) => void;

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

  // Computed & Getters
  getProject: () => DesignerProjectState;
  getSelectedNode: () => DesignerNode | null;
  getSelectedNodes: () => DesignerNode[];
  getWasmStatus: () => WasmEngineStatus;

  // O(1) Entity Operations
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
  duplicateSelectedNodes: () => void;
  alignSelectedNodes: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'sameWidth' | 'sameHeight' | 'bringForward' | 'sendBackward') => void;
  nudgeSelectedNodes: (dx: number, dy: number) => void;

  // Project & System Operations
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
  setActiveDpiMode: (mode: DpiMode) => void;
  setCursorPos: (pos: { screenX: number; screenY: number; formX: number | null; formY: number | null }) => void;
  setFps: (fps: number) => void;
  setActiveLeftTab: (tab: 'solution' | 'toolbox' | 'tree' | 'outline') => void;
  setActiveRightTab: (tab: 'properties' | 'events' | 'code' | 'history') => void;
  setCodeDockOpen: (open: boolean) => void;
  setLiveRunOpen: (open: boolean) => void;
  setImportModalOpen: (open: boolean) => void;

  // Active Toolbox Drag Telemetry (Status bar & Canvas Ghost highlight)
  toolboxDragState: ToolboxDragStatus | null;
  setToolboxDragState: (status: Partial<ToolboxDragStatus> | null) => void;
}

const getInitialProject = (): DesignerProjectState => {
  const tpl = createMultiFormTemplate();
  tpl.version = CURRENT_SCHEMA_VERSION;
  tpl.projectName = `Проект_${new Date().toLocaleDateString().replace(/\./g, '_')}`;
  return tpl;
};

const initialProject = getInitialProject();
const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

export const useDesignerStore = create<DesignerStoreState>((set, get) => ({
  // Flat Entity Store initialization
  nodes: initialProject.nodes,
  rootFormId: initialProject.rootFormId,
  activeFormId: initialProject.activeFormId || initialProject.rootFormId,
  formZOrder: Object.values(initialProject.nodes).filter(n => n.type === 'Form').map(n => n.id),
  globalTheme: initialProject.canvasSettings?.globalTheme || 'Win11Mica',
  gridStep: initialProject.canvasSettings?.gridStep || 8,
  selectedNodeIds: initialProject.selectedNodeIds || [initialProject.rootFormId],
  version: initialProject.version || '1.0.0',
  projectName: initialProject.projectName || 'MultiFormStudio',
  targetFramework: initialProject.targetFramework || 'WinForms',

  undoStack: [],
  redoStack: [],
  historyJournal: [],
  redoJournal: [],
  transactionBaseState: null,
  historyPanelOpen: false,
  setHistoryPanelOpen: (open: boolean) => set({ historyPanelOpen: open }),
  hasUnsavedChanges: false,
  storageStatusInfo: debouncedStorage.getStatusInfo(),

  zoom: 1,
  panOffset: { x: 0, y: 0 },
  snapToGrid: true,
  gridSize: 8,
  showGrid: true,
  snapGuides: [],
  equidistantTicks: [],
  snapTelemetry: null,
  isPanMode: false,
  activeDpiMode: 'standard-96',

  cursorPos: { screenX: 0, screenY: 0, formX: null, formY: null },
  fps: 60,
  dpi: Math.round(96 * dpr),
  dpr,

  activeLeftTab: 'toolbox',
  activeRightTab: 'properties',
  codeDockOpen: false,
  liveRunOpen: false,
  importModalOpen: false,
  toolboxDragState: null,

  // Microsoft VS Standards State
  isTabOrderMode: false,
  nextTabOrderIndex: 0,
  errorListOpen: false,
  solutionBuildConfiguration: 'Debug',
  solutionBuildPlatform: 'Any CPU',

  // 🌟 5 NextGen Mechanics State
  wires: initialProject.wires || [],
  showWiring: true,
  pendingWireStart: null,
  xrayMode: false,
  radialHaloNodeId: null,
  morphicMode: 'absolute',

  appMode: typeof window !== 'undefined' && !localStorage.getItem('devos_active_project_id') ? 'welcome' : 'designer',
  exitToWelcomeHub: () => {
    get().saveProject();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('devos_active_project_id');
    }
    set({ appMode: 'welcome' });
  },
  consoleLogs: [
    {
      id: 'init-1',
      time: getTimestamp(),
      category: 'System',
      text: 'Форма инициализирована в среде эмуляции .NET WinForms / Avalonia.',
    },
  ],
  messageBoxModal: null,
  setMessageBoxModal: (modal: { isOpen: boolean; title: string; text: string } | null) =>
    set({ messageBoxModal: modal }),
  eventStudioModal: null,
  setEventStudioModal: (modal: { isOpen: boolean; nodeId?: string; controlName?: string; eventName?: string; initialCode?: string } | null) =>
    set({ eventStudioModal: modal }),

  orphanedHandlers: initialProject.orphanedHandlers || [],
  rawCustomLines: initialProject.rawCustomLines || [],

  // Getters
  getProject: () => {
    const s = get();
    return {
      version: s.version,
      projectName: s.projectName,
      rootFormId: s.rootFormId,
      activeFormId: s.activeFormId,
      formIds: s.formZOrder,
      canvasSettings: {
        gridStep: s.gridStep,
        snapToGrid: s.snapToGrid,
        globalTheme: s.globalTheme,
        showGrid: s.showGrid,
      },
      nodes: s.nodes,
      selectedNodeIds: s.selectedNodeIds,
      targetFramework: s.targetFramework,
      rawCustomLines: s.rawCustomLines,
      orphanedHandlers: s.orphanedHandlers,
      wires: s.wires,
      morphicMode: s.morphicMode,
      xrayMode: s.xrayMode,
      showWiring: s.showWiring,
    };
  },

  getSelectedNode: () => {
    const { nodes, selectedNodeIds, activeFormId, rootFormId } = get();
    if (selectedNodeIds && selectedNodeIds.length > 0) {
      const targetId = selectedNodeIds[0];
      if (nodes[targetId]) return nodes[targetId];
      // Fallback: search by control name
      const byName = Object.values(nodes).find(n => n.properties.name === targetId);
      if (byName) return byName;
    }
    // Fallback to active or root form if nothing valid selected
    return nodes[activeFormId] || nodes[rootFormId] || Object.values(nodes)[0] || null;
  },

  getSelectedNodes: () => {
    const { nodes, selectedNodeIds, activeFormId, rootFormId } = get();
    if (!selectedNodeIds || selectedNodeIds.length === 0) {
      const fallback = nodes[activeFormId] || nodes[rootFormId];
      return fallback ? [fallback] : [];
    }
    const resolved = selectedNodeIds
      .map(id => nodes[id] || Object.values(nodes).find(n => n.properties.name === id))
      .filter((n): n is DesignerNode => Boolean(n));
    if (resolved.length === 0) {
      const fallback = nodes[activeFormId] || nodes[rootFormId];
      return fallback ? [fallback] : [];
    }
    return resolved;
  },

  getWasmStatus: () => {
    return validateProjectAst(get().getProject());
  },

  // Selection
  selectNode: (id: string, multi = false) => {
    set(state => {
      const targetNode = state.nodes[id] || Object.values(state.nodes).find(n => n.properties.name === id);
      if (!targetNode) return state;
      const actualId = targetNode.id;
      let newSelection: string[];
      if (multi) {
        if (state.selectedNodeIds.includes(actualId)) {
          newSelection = state.selectedNodeIds.filter(i => i !== actualId);
        } else {
          newSelection = [...state.selectedNodeIds, actualId];
        }
      } else {
        newSelection = [actualId];
      }
      return {
        selectedNodeIds: newSelection.length > 0 ? newSelection : [actualId],
      };
    });
  },

  clearSelection: () => {
    set(state => ({
      selectedNodeIds: [state.rootFormId],
    }));
  },

  // O(1) Bounds Update - Direct Key Lookup and Mutation
  updateNodeBounds: (id: string, bounds: Partial<LayoutBounds>, recordHistory = true) => {
    set(state => {
      const node = state.nodes[id];
      if (!node) return state;

      const prevProject = state.getProject();
      const nextNodes = {
        ...state.nodes,
        [id]: {
          ...node,
          bounds: {
            ...node.bounds,
            ...bounds,
          },
        },
      };

      let nextHistory = state.historyJournal;
      if (recordHistory) {
        const isResize = bounds.width !== undefined || bounds.height !== undefined;
        const desc = isResize
          ? `Изменение размера ${node.properties.name} (${Math.round(bounds.width || node.bounds.width)}×${Math.round(bounds.height || node.bounds.height)})`
          : `Перемещение ${node.properties.name} в (X:${Math.round(bounds.x ?? node.bounds.x)}, Y:${Math.round(bounds.y ?? node.bounds.y)})`;

        const nextProject: DesignerProjectState = {
          ...prevProject,
          nodes: nextNodes,
        };
        const cmd = createHistoryCommand(
          prevProject,
          nextProject,
          desc,
          isResize ? 'resize' : 'move',
          state.historyJournal.length + 1
        );
        nextHistory = [...state.historyJournal, cmd].slice(-100);
      }

      return {
        nodes: nextNodes,
        historyJournal: nextHistory,
        redoJournal: recordHistory ? [] : state.redoJournal,
        undoStack: recordHistory ? [...state.undoStack.slice(-30), prevProject] : state.undoStack,
        redoStack: recordHistory ? [] : state.redoStack,
        hasUnsavedChanges: true,
      };
    });
  },

  // Atomic Multi-Node Bounds Update (Fix 4.2: Relative Delta Grouping)
  updateMultipleNodeBounds: (updates: Record<string, Partial<LayoutBounds>>, recordHistory = true) => {
    set(state => {
      const nextNodes = { ...state.nodes };
      let changed = false;

      Object.entries(updates).forEach(([id, bounds]) => {
        const node = nextNodes[id];
        if (node) {
          nextNodes[id] = {
            ...node,
            bounds: {
              ...node.bounds,
              ...bounds,
            },
          };
          changed = true;
        }
      });

      if (!changed) return state;

      const prevProject = state.getProject();
      let nextHistory = state.historyJournal;
      if (recordHistory) {
        const count = Object.keys(updates).length;
        const desc = `Перемещение ${count} элементов`;
        const nextProject: DesignerProjectState = { ...prevProject, nodes: nextNodes };
        const cmd = createHistoryCommand(
          prevProject,
          nextProject,
          desc,
          'move',
          state.historyJournal.length + 1
        );
        nextHistory = [...state.historyJournal, cmd].slice(-100);
      }

      return {
        nodes: nextNodes,
        historyJournal: nextHistory,
        redoJournal: recordHistory ? [] : state.redoJournal,
        undoStack: recordHistory ? [...state.undoStack.slice(-30), prevProject] : state.undoStack,
        redoStack: recordHistory ? [] : state.redoStack,
        hasUnsavedChanges: true,
      };
    });
  },

  // O(1) Properties Update
  updateNodeProperties: (id: string, props: Partial<NodeProperties>, recordHistory = true) => {
    set(state => {
      const node = state.nodes[id];
      if (!node) return state;

      const prevProject = state.getProject();
      const updatedProps = { ...props };
      if (updatedProps.name !== undefined) {
        const otherNames = Object.values(state.nodes)
          .filter(n => n.id !== id)
          .map(n => n.properties.name);
        const { sanitized } = sanitizeCsIdentifier(updatedProps.name, node.type, otherNames);
        updatedProps.name = sanitized;
      }

      const nextNodes = {
        ...state.nodes,
        [id]: {
          ...node,
          properties: {
            ...node.properties,
            ...updatedProps,
          },
        },
      };

      let nextHistory = state.historyJournal;
      if (recordHistory) {
        const propKeys = Object.keys(props).join(', ');
        const desc = `Смена ${propKeys} (${node.properties.name})`;
        const nextProject: DesignerProjectState = { ...prevProject, nodes: nextNodes };
        const cmd = createHistoryCommand(
          prevProject,
          nextProject,
          desc,
          'property',
          state.historyJournal.length + 1
        );
        nextHistory = [...state.historyJournal, cmd].slice(-100);
      }

      return {
        nodes: nextNodes,
        historyJournal: nextHistory,
        redoJournal: recordHistory ? [] : state.redoJournal,
        undoStack: recordHistory ? [...state.undoStack.slice(-30), prevProject] : state.undoStack,
        redoStack: recordHistory ? [] : state.redoStack,
        hasUnsavedChanges: true,
      };
    });
  },

  // Atomic Multi-Node Properties Update (Pravka 10.2: Atomic Batch Command)
  updateMultipleNodesProperties: (nodeIds: string[], props: Partial<NodeProperties>, recordHistory = true) => {
    set(state => {
      const prevProject = state.getProject();
      const nextNodes = { ...state.nodes };
      let changed = false;

      nodeIds.forEach(id => {
        const node = nextNodes[id];
        if (node) {
          nextNodes[id] = {
            ...node,
            properties: {
              ...node.properties,
              ...props,
            },
          };
          changed = true;
        }
      });

      if (!changed) return state;

      let nextHistory = state.historyJournal;
      if (recordHistory) {
        const propKeys = Object.keys(props).join(', ');
        const desc = nodeIds.length === 1
          ? `Смена ${propKeys} (${nextNodes[nodeIds[0]]?.properties.name || ''})`
          : `Смена ${propKeys} (${nodeIds.length} элементов)`;
        const nextProject: DesignerProjectState = { ...prevProject, nodes: nextNodes };
        const cmd = createHistoryCommand(
          prevProject,
          nextProject,
          desc,
          'property',
          state.historyJournal.length + 1
        );
        nextHistory = [...state.historyJournal, cmd].slice(-100);
      }

      return {
        nodes: nextNodes,
        historyJournal: nextHistory,
        redoJournal: recordHistory ? [] : state.redoJournal,
        undoStack: recordHistory ? [...state.undoStack.slice(-30), prevProject] : state.undoStack,
        redoStack: recordHistory ? [] : state.redoStack,
        hasUnsavedChanges: true,
      };
    });
  },

  // O(1) Events Update
  updateNodeEvents: (id: string, events: Partial<NodeEvents>) => {
    set(state => {
      const node = state.nodes[id];
      if (!node) return state;

      const prevProject = state.getProject();
      const updatedEvents: NodeEvents = { ...node.events };
      Object.entries(events).forEach(([k, v]) => {
        if (v !== undefined) {
          updatedEvents[k] = v;
        } else {
          delete updatedEvents[k];
        }
      });

      const nextNodes = {
        ...state.nodes,
        [id]: {
          ...node,
          events: updatedEvents,
        },
      };

      const evtKeys = Object.keys(events).join(', ');
      const desc = `Привязка события ${evtKeys} (${node.properties.name})`;
      const nextProject: DesignerProjectState = { ...prevProject, nodes: nextNodes };
      const cmd = createHistoryCommand(
        prevProject,
        nextProject,
        desc,
        'event',
        state.historyJournal.length + 1
      );

      return {
        nodes: nextNodes,
        historyJournal: [...state.historyJournal, cmd].slice(-100),
        redoJournal: [],
        undoStack: [...state.undoStack.slice(-30), prevProject],
        redoStack: [],
        hasUnsavedChanges: true,
      };
    });
  },

  // O(1) Add Control
  addControl: (type: ControlType, targetParentId?: string, position?: { x: number; y: number }): string => {
    let createdId = '';
    set(state => {
      const prevProject = state.getProject();
      const parentId = targetParentId && state.nodes[targetParentId]
        ? targetParentId
        : (state.activeFormId && state.nodes[state.activeFormId] ? state.activeFormId : state.rootFormId);
      const count = Object.values(state.nodes).filter(n => n.type === type).length + 1;
      const varName = `${type.charAt(0).toLowerCase()}${type.slice(1)}${count}`;
      createdId = `node_${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const parentNode = state.nodes[parentId];
      const defaultPos = position || {
        x: Math.min(60 + (count * 16) % 200, (parentNode?.bounds.width || 400) - 140),
        y: Math.min(60 + (count * 20) % 200, (parentNode?.bounds.height || 300) - 60),
      };

      const meta = COMPONENT_REGISTRY[type];
      const defaultW = meta?.defaultSize.width || getDefaultWidth(type);
      const defaultH = meta?.defaultSize.height || getDefaultHeight(type);

      const initialProps: NodeProperties = {
        name: varName,
        enabled: true,
        visible: true,
        fontSize: 9,
        fontFamily: 'Segoe UI',
        tabIndex: Object.keys(state.nodes).length,
        ...(meta?.defaultProps || {}),
      };

      if (['Button', 'Label', 'CheckBox', 'RadioButton', 'GroupBox'].includes(type)) {
        initialProps.text = varName;
      }

      const newNode: DesignerNode = {
        id: createdId,
        type,
        bounds: {
          x: Math.round(defaultPos.x),
          y: Math.round(defaultPos.y),
          width: defaultW,
          height: defaultH,
        },
        properties: initialProps,
        events: type === 'Button' ? { Click: `${varName}_Click` } : {},
        parentId,
        childrenIds: [],
      };

      const updatedParent: DesignerNode = {
        ...parentNode,
        childrenIds: [...(parentNode.childrenIds || []), createdId],
      };

      const nextNodes = {
        ...state.nodes,
        [parentId]: updatedParent,
        [createdId]: newNode,
      };

      const desc = `Создание ${varName} (${type})`;
      const nextProject: DesignerProjectState = {
        ...prevProject,
        nodes: nextNodes,
        selectedNodeIds: [createdId],
      };
      const cmd = createHistoryCommand(
        prevProject,
        nextProject,
        desc,
        'create',
        state.historyJournal.length + 1
      );

      return {
        nodes: nextNodes,
        selectedNodeIds: [createdId],
        historyJournal: [...state.historyJournal, cmd].slice(-100),
        redoJournal: [],
        undoStack: [...state.undoStack.slice(-30), prevProject],
        redoStack: [],
        hasUnsavedChanges: true,
      };
    });
    return createdId;
  },

  // 1-Click Quick Template Injectors (Развилка Б)
  applyQuickTemplate: (type, targetParentId, position) => {
    set(state => {
      const proj = state.getProject();
      let res;
      if (type === 'login') {
        res = insertLoginBlock(proj, targetParentId, position);
      } else if (type === 'tableFilter') {
        res = insertTableFilterBlock(proj, targetParentId, position);
      } else {
        res = insertConfirmationDialogBlock(proj, targetParentId, position);
      }

      const desc = `Вставка шаблона '${type}'`;
      const nextProject: DesignerProjectState = {
        ...proj,
        nodes: res.nextNodes,
        selectedNodeIds: [res.containerId],
      };
      const cmd = createHistoryCommand(
        proj,
        nextProject,
        desc,
        'template',
        state.historyJournal.length + 1
      );

      return {
        nodes: res.nextNodes,
        selectedNodeIds: [res.containerId],
        historyJournal: [...state.historyJournal, cmd].slice(-100),
        redoJournal: [],
        undoStack: [...state.undoStack.slice(-30), proj],
        redoStack: [],
        hasUnsavedChanges: true,
      };
    });
  },

  // Delete (with Orphan Handler Protection - Pravka 9.1)
  deleteSelectedNodes: () => {
    set(state => {
      const idsToDelete = state.selectedNodeIds.filter(id => id !== state.rootFormId);
      if (idsToDelete.length === 0) return state;

      const prevProject = state.getProject();
      const newNodes = { ...state.nodes };
      const allToDelete = new Set<string>();

      const collectChildren = (id: string) => {
        allToDelete.add(id);
        const node = newNodes[id];
        if (node?.childrenIds) {
          node.childrenIds.forEach(collectChildren);
        }
      };
      idsToDelete.forEach(collectChildren);

      // Collect orphaned event handlers to protect student/user code logic (Pravka 9.1)
      const orphanedToAdd: OrphanedEventHandler[] = [];
      allToDelete.forEach(id => {
        const node = newNodes[id];
        if (node && node.events) {
          Object.entries(node.events).forEach(([evtName, handlerName]) => {
            if (handlerName && handlerName.trim()) {
              orphanedToAdd.push({
                handlerName: handlerName.trim(),
                eventName: evtName,
                formerControlName: node.properties.name,
                formerControlType: node.type,
                deletedAt: new Date().toLocaleTimeString(),
              });
            }
          });
        }
      });

      // O(1) clean up parent links
      Object.values(newNodes).forEach(node => {
        if (node.childrenIds.some(cid => allToDelete.has(cid))) {
          newNodes[node.id] = {
            ...node,
            childrenIds: node.childrenIds.filter(cid => !allToDelete.has(cid)),
          };
        }
      });

      allToDelete.forEach(id => {
        delete newNodes[id];
      });

      const nextOrphaned = [...state.orphanedHandlers, ...orphanedToAdd];
      const desc = `Удаление ${idsToDelete.length} ${idsToDelete.length === 1 ? 'элемента' : 'элементов'}`;
      const nextProject: DesignerProjectState = {
        ...prevProject,
        nodes: newNodes,
        orphanedHandlers: nextOrphaned,
        selectedNodeIds: [state.rootFormId],
      };
      const cmd = createHistoryCommand(
        prevProject,
        nextProject,
        desc,
        'delete',
        state.historyJournal.length + 1
      );

      return {
        nodes: newNodes,
        orphanedHandlers: nextOrphaned,
        selectedNodeIds: [state.rootFormId],
        historyJournal: [...state.historyJournal, cmd].slice(-100),
        redoJournal: [],
        undoStack: [...state.undoStack.slice(-30), prevProject],
        redoStack: [],
        hasUnsavedChanges: true,
      };
    });
  },

  // Reparent
  reparentNode: (nodeId: string, newParentId: string) => {
    set(state => {
      if (nodeId === state.rootFormId || nodeId === newParentId) return state;
      const node = state.nodes[nodeId];
      const newParent = state.nodes[newParentId];
      if (!node || !newParent) return state;

      const oldParentId = node.parentId;
      const newNodes = { ...state.nodes };

      if (oldParentId && newNodes[oldParentId]) {
        newNodes[oldParentId] = {
          ...newNodes[oldParentId],
          childrenIds: newNodes[oldParentId].childrenIds.filter(id => id !== nodeId),
        };
      }

      newNodes[newParentId] = {
        ...newParent,
        childrenIds: [...(newParent.childrenIds || []), nodeId],
      };

      newNodes[nodeId] = {
        ...node,
        parentId: newParentId,
      };

      return {
        nodes: newNodes,
        undoStack: [...state.undoStack.slice(-30), state.getProject()],
        redoStack: [],
        hasUnsavedChanges: true,
      };
    });
  },

  // Duplicate
  duplicateSelectedNodes: () => {
    set(state => {
      const ids = state.selectedNodeIds.filter(id => id !== state.rootFormId);
      if (ids.length === 0) return state;

      const prevProject = state.getProject();
      const newNodes = { ...state.nodes };
      const newSelected: string[] = [];

      ids.forEach(id => {
        const node = newNodes[id];
        if (!node) return;
        const newId = `node_${node.type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const newName = `${node.properties.name}_copy`;

        const clonedNode: DesignerNode = {
          ...node,
          id: newId,
          bounds: {
            ...node.bounds,
            x: node.bounds.x + 16,
            y: node.bounds.y + 16,
          },
          properties: {
            ...node.properties,
            name: newName,
          },
          childrenIds: [],
        };

        newNodes[newId] = clonedNode;
        newSelected.push(newId);

        if (node.parentId && newNodes[node.parentId]) {
          newNodes[node.parentId] = {
            ...newNodes[node.parentId],
            childrenIds: [...newNodes[node.parentId].childrenIds, newId],
          };
        }
      });

      const desc = `Дублирование ${ids.length} элементов`;
      const nextProject: DesignerProjectState = {
        ...prevProject,
        nodes: newNodes,
        selectedNodeIds: newSelected,
      };
      const cmd = createHistoryCommand(
        prevProject,
        nextProject,
        desc,
        'duplicate',
        state.historyJournal.length + 1
      );

      return {
        nodes: newNodes,
        selectedNodeIds: newSelected,
        historyJournal: [...state.historyJournal, cmd].slice(-100),
        redoJournal: [],
        undoStack: [...state.undoStack.slice(-30), prevProject],
        redoStack: [],
        hasUnsavedChanges: true,
      };
    });
  },

  // Align
  alignSelectedNodes: (alignment) => {
    set(state => {
      const targets = state.selectedNodeIds.filter(id => id !== state.rootFormId).map(id => state.nodes[id]).filter(Boolean);
      if (targets.length === 0) return state;

      const prevProject = state.getProject();
      const newNodes = { ...state.nodes };

      if (alignment === 'bringForward' || alignment === 'sendBackward') {
        const target = targets[0];
        if (target.parentId && newNodes[target.parentId]) {
          const parent = newNodes[target.parentId];
          const curIndex = parent.childrenIds.indexOf(target.id);
          if (curIndex !== -1) {
            const arr = [...parent.childrenIds];
            if (alignment === 'bringForward' && curIndex < arr.length - 1) {
              arr.splice(curIndex, 1);
              arr.push(target.id);
            } else if (alignment === 'sendBackward' && curIndex > 0) {
              arr.splice(curIndex, 1);
              arr.unshift(target.id);
            }
            newNodes[target.parentId] = { ...parent, childrenIds: arr };
          }
        }
        const desc = alignment === 'bringForward' ? 'На передний план' : 'На задний план';
        const nextProject: DesignerProjectState = { ...prevProject, nodes: newNodes };
        const cmd = createHistoryCommand(
          prevProject,
          nextProject,
          desc,
          'order',
          state.historyJournal.length + 1
        );
        return {
          nodes: newNodes,
          historyJournal: [...state.historyJournal, cmd].slice(-100),
          redoJournal: [],
          undoStack: [...state.undoStack.slice(-30), prevProject],
          redoStack: [],
          hasUnsavedChanges: true,
        };
      }

      if (targets.length === 1) {
        const target = targets[0];
        const parent = newNodes[target.parentId || state.rootFormId];
        const pw = parent?.bounds.width || 600;
        const ph = parent?.bounds.height || 400;

        let nx = target.bounds.x;
        let ny = target.bounds.y;

        if (alignment === 'left') nx = 16;
        if (alignment === 'center') nx = Math.round((pw - target.bounds.width) / 2);
        if (alignment === 'right') nx = pw - target.bounds.width - 16;
        if (alignment === 'top') ny = 16;
        if (alignment === 'middle') ny = Math.round((ph - target.bounds.height) / 2);
        if (alignment === 'bottom') ny = ph - target.bounds.height - 16;

        newNodes[target.id] = {
          ...target,
          bounds: { ...target.bounds, x: Math.max(0, nx), y: Math.max(0, ny) },
        };
      } else {
        const primary = targets[0];
        targets.forEach(t => {
          const nb = { ...t.bounds };
          if (alignment === 'left') nb.x = primary.bounds.x;
          if (alignment === 'right') nb.x = primary.bounds.x + primary.bounds.width - t.bounds.width;
          if (alignment === 'center') nb.x = Math.round(primary.bounds.x + (primary.bounds.width - t.bounds.width) / 2);
          if (alignment === 'top') nb.y = primary.bounds.y;
          if (alignment === 'bottom') nb.y = primary.bounds.y + primary.bounds.height - t.bounds.height;
          if (alignment === 'middle') nb.y = Math.round(primary.bounds.y + (primary.bounds.height - t.bounds.height) / 2);
          if (alignment === 'sameWidth') nb.width = primary.bounds.width;
          if (alignment === 'sameHeight') nb.height = primary.bounds.height;

          newNodes[t.id] = { ...t, bounds: nb };
        });
      }

      const desc = `Выравнивание: ${alignment}`;
      const nextProject: DesignerProjectState = { ...prevProject, nodes: newNodes };
      const cmd = createHistoryCommand(
        prevProject,
        nextProject,
        desc,
        'align',
        state.historyJournal.length + 1
      );

      return {
        nodes: newNodes,
        historyJournal: [...state.historyJournal, cmd].slice(-100),
        redoJournal: [],
        undoStack: [...state.undoStack.slice(-30), prevProject],
        redoStack: [],
        hasUnsavedChanges: true,
      };
    });
  },

  // Nudge
  nudgeSelectedNodes: (dx: number, dy: number) => {
    set(state => {
      const ids = state.selectedNodeIds.filter(id => id !== state.rootFormId);
      if (ids.length === 0) return state;

      const newNodes = { ...state.nodes };
      ids.forEach(id => {
        const node = newNodes[id];
        if (node) {
          newNodes[id] = {
            ...node,
            bounds: {
              ...node.bounds,
              x: Math.max(0, node.bounds.x + dx),
              y: Math.max(0, node.bounds.y + dy),
            },
          };
        }
      });

      return {
        nodes: newNodes,
        undoStack: [...state.undoStack.slice(-30), state.getProject()],
        redoStack: [],
        hasUnsavedChanges: true,
      };
    });
  },

  setTargetFramework: (targetFramework) => {
    set({ targetFramework });
  },

  setProjectState: (newState) => {
    const { state: migrated } = migrateProjectSchema(newState);
    set(state => ({
      nodes: migrated.nodes,
      rootFormId: migrated.rootFormId,
      activeFormId: migrated.activeFormId || migrated.rootFormId,
      formZOrder: migrated.formZOrder || Object.values(migrated.nodes).filter(n => n.type === 'Form').map(n => n.id),
      selectedNodeIds: migrated.selectedNodeIds || [migrated.rootFormId],
      version: migrated.version || CURRENT_SCHEMA_VERSION,
      projectName: migrated.projectName || 'WinFormsApp1',
      targetFramework: migrated.targetFramework || 'WinForms',
      globalTheme: migrated.canvasSettings?.globalTheme || state.globalTheme,
      gridStep: migrated.canvasSettings?.gridStep || state.gridStep,
      orphanedHandlers: migrated.orphanedHandlers || [],
      undoStack: [...state.undoStack.slice(-30), state.getProject()],
      redoStack: [],
      hasUnsavedChanges: true,
    }));
    broadcastProjectUpdate(migrated);
  },

  saveProject: () => {
    debouncedStorage.flushSync();
    const current = get().getProject();
    const dirHandle = getActiveDirectoryHandle();
    if (dirHandle) {
      syncProjectToLocalDirectory(dirHandle, current).catch(err => {
        console.warn('Could not auto-write to disk on save:', err);
      });
    }
    broadcastProjectSaved(current.projectName || 'WinFormsApp1');
    set({ hasUnsavedChanges: false });
  },

  undo: () => {
    const s = get();
    const { historyJournal, redoJournal, undoStack, redoStack } = s;
    if (historyJournal.length === 0 && undoStack.length === 0) return;

    const currentProject = s.getProject();

    if (historyJournal.length > 0) {
      const command = historyJournal[historyJournal.length - 1];
      const rolledBack = applyHistoryPatches(currentProject, command.inversePatches);
      const validSelected = (command.selectedNodeIdsBefore || []).filter(id => !!rolledBack.nodes[id]);
      rolledBack.selectedNodeIds = validSelected.length > 0 ? validSelected : [rolledBack.rootFormId];

      set({
        nodes: rolledBack.nodes,
        rootFormId: rolledBack.rootFormId,
        selectedNodeIds: rolledBack.selectedNodeIds,
        version: rolledBack.version,
        projectName: rolledBack.projectName,
        targetFramework: rolledBack.targetFramework,
        orphanedHandlers: rolledBack.orphanedHandlers || [],
        historyJournal: historyJournal.slice(0, -1),
        redoJournal: [command, ...redoJournal],
        undoStack: undoStack.slice(0, -1),
        redoStack: [...redoStack, currentProject],
        hasUnsavedChanges: true,
      });
    } else {
      const prev = undoStack[undoStack.length - 1];
      const validSelected = (prev.selectedNodeIds || []).filter(id => !!prev.nodes[id]);
      set({
        nodes: prev.nodes,
        rootFormId: prev.rootFormId,
        selectedNodeIds: validSelected.length > 0 ? validSelected : [prev.rootFormId],
        version: prev.version,
        projectName: prev.projectName,
        targetFramework: prev.targetFramework,
        undoStack: undoStack.slice(0, -1),
        redoStack: [...redoStack, currentProject],
        hasUnsavedChanges: true,
      });
    }
  },

  redo: () => {
    const s = get();
    const { historyJournal, redoJournal, undoStack, redoStack } = s;
    if (redoJournal.length === 0 && redoStack.length === 0) return;

    const currentProject = s.getProject();

    if (redoJournal.length > 0) {
      const command = redoJournal[0];
      const reapplied = applyHistoryPatches(currentProject, command.forwardPatches);
      const validSelected = (command.selectedNodeIdsAfter || []).filter(id => !!reapplied.nodes[id]);
      reapplied.selectedNodeIds = validSelected.length > 0 ? validSelected : [reapplied.rootFormId];

      set({
        nodes: reapplied.nodes,
        rootFormId: reapplied.rootFormId,
        selectedNodeIds: reapplied.selectedNodeIds,
        version: reapplied.version,
        projectName: reapplied.projectName,
        targetFramework: reapplied.targetFramework,
        orphanedHandlers: reapplied.orphanedHandlers || [],
        historyJournal: [...historyJournal, command],
        redoJournal: redoJournal.slice(1),
        redoStack: redoStack.slice(0, -1),
        undoStack: [...undoStack, currentProject],
        hasUnsavedChanges: true,
      });
    } else {
      const next = redoStack[redoStack.length - 1];
      const validSelected = (next.selectedNodeIds || []).filter(id => !!next.nodes[id]);
      set({
        nodes: next.nodes,
        rootFormId: next.rootFormId,
        selectedNodeIds: validSelected.length > 0 ? validSelected : [next.rootFormId],
        version: next.version,
        projectName: next.projectName,
        targetFramework: next.targetFramework,
        redoStack: redoStack.slice(0, -1),
        undoStack: [...undoStack, currentProject],
        hasUnsavedChanges: true,
      });
    }
  },

  jumpToHistoryStep: (targetStepNumber: number) => {
    const s = get();
    const currentStep = s.historyJournal.length;
    if (targetStepNumber === currentStep) return;

    if (targetStepNumber < currentStep) {
      const stepsToUndo = currentStep - targetStepNumber;
      for (let i = 0; i < stepsToUndo; i++) {
        get().undo();
      }
    } else {
      const stepsToRedo = targetStepNumber - currentStep;
      for (let i = 0; i < stepsToRedo; i++) {
        get().redo();
      }
    }
  },

  beginTransaction: () => {
    set(state => ({
      transactionBaseState: state.transactionBaseState || state.getProject(),
    }));
  },

  commitTransaction: (description: string, category: HistoryCommand['category'] = 'property') => {
    set(state => {
      if (!state.transactionBaseState) return state;
      const prevProject = state.transactionBaseState;
      const currentProject = state.getProject();

      const cmd = createHistoryCommand(
        prevProject,
        currentProject,
        description,
        category,
        state.historyJournal.length + 1
      );

      if (cmd.forwardPatches.length === 0 && cmd.inversePatches.length === 0) {
        return { transactionBaseState: null };
      }

      return {
        transactionBaseState: null,
        historyJournal: [...state.historyJournal, cmd].slice(-100),
        redoJournal: [],
        undoStack: [...state.undoStack.slice(-30), prevProject],
        redoStack: [],
        hasUnsavedChanges: true,
      };
    });
  },

  cancelTransaction: () => {
    set(state => {
      if (!state.transactionBaseState) return state;
      const base = state.transactionBaseState;
      return {
        nodes: base.nodes,
        selectedNodeIds: base.selectedNodeIds,
        rootFormId: base.rootFormId,
        activeFormId: base.activeFormId,
        transactionBaseState: null,
      };
    });
  },

  createCheckpoint: (customLabel?: string) => {
    const s = get();
    const curProject = s.getProject();
    const label = customLabel?.trim() || `Точка сохранения #${s.historyJournal.length + 1}`;
    const cmd = createHistoryCommand(
      curProject,
      curProject,
      label,
      'checkpoint',
      s.historyJournal.length + 1,
      true
    );
    set(state => ({
      historyJournal: [...state.historyJournal, cmd].slice(-100),
    }));
  },

  getHistoryMemorySizeKb: () => {
    const s = get();
    return calculateHistoryMemoryKb(s.historyJournal, s.redoJournal);
  },

  setZoom: (z) => {
    set(state => ({
      zoom: typeof z === 'function' ? z(state.zoom) : z,
    }));
  },

  setPanOffset: (pan) => {
    set(state => ({
      panOffset: typeof pan === 'function' ? pan(state.panOffset) : pan,
    }));
  },

  resetView: () => set({ zoom: 1, panOffset: { x: 0, y: 0 } }),
  setSnapToGrid: (val) => set({ snapToGrid: val }),
  setShowGrid: (val) => set({ showGrid: val }),
  setSnapGuides: (guides) => set({ snapGuides: guides }),
  setEquidistantTicks: (ticks) => set({ equidistantTicks: ticks }),
  setSnapTelemetry: (telemetry) => set({ snapTelemetry: telemetry }),
  setIsPanMode: (val) => set({ isPanMode: val }),
  setActiveDpiMode: (mode) => set({ activeDpiMode: mode }),
  setCursorPos: (pos) => set({ cursorPos: pos }),
  setFps: (fps) => set({ fps }),
  setActiveLeftTab: (tab) => set({ activeLeftTab: tab }),
  setActiveRightTab: (tab) => set({ activeRightTab: tab }),
  setCodeDockOpen: (open) => set({ codeDockOpen: open }),
  setLiveRunOpen: (open) => set({ liveRunOpen: open }),
  setImportModalOpen: (open) => set({ importModalOpen: open }),

  // Microsoft VS Standards Methods
  setTabOrderMode: (active: boolean) => set({ isTabOrderMode: active, nextTabOrderIndex: 0 }),
  setNextTabOrderIndex: (index: number) => set({ nextTabOrderIndex: index }),
  assignTabIndex: (nodeId: string) => {
    set(state => {
      const node = state.nodes[nodeId];
      if (!node || node.type === 'Form') return state;
      const currentIndex = state.nextTabOrderIndex;
      const updatedProps = { ...node.properties, tabIndex: currentIndex };
      const updatedNodes = {
        ...state.nodes,
        [nodeId]: {
          ...node,
          properties: updatedProps,
        },
      };
      return {
        nodes: updatedNodes,
        nextTabOrderIndex: currentIndex + 1,
        hasUnsavedChanges: true,
      };
    });
  },
  resetTabOrder: () => {
    set(state => {
      const updatedNodes = { ...state.nodes };
      Object.keys(updatedNodes).forEach(id => {
        if (updatedNodes[id].type !== 'Form') {
          updatedNodes[id] = {
            ...updatedNodes[id],
            properties: { ...updatedNodes[id].properties, tabIndex: undefined },
          };
        }
      });
      return {
        nodes: updatedNodes,
        nextTabOrderIndex: 0,
        hasUnsavedChanges: true,
      };
    });
  },

  setErrorListOpen: (open: boolean) => set({ errorListOpen: open }),

  setSolutionBuildConfiguration: (config) => set({ solutionBuildConfiguration: config }),
  setSolutionBuildPlatform: (platform) => set({ solutionBuildPlatform: platform }),

  bringNodeToFront: (nodeId: string) => {
    set(state => {
      const node = state.nodes[nodeId];
      if (!node || !node.parentId || !state.nodes[node.parentId]) return state;
      const parent = state.nodes[node.parentId];
      const curIndex = parent.childrenIds.indexOf(nodeId);
      if (curIndex === -1 || curIndex === parent.childrenIds.length - 1) return state;
      const nextChildren = parent.childrenIds.filter(id => id !== nodeId);
      nextChildren.push(nodeId);
      return {
        nodes: {
          ...state.nodes,
          [node.parentId]: { ...parent, childrenIds: nextChildren },
        },
        hasUnsavedChanges: true,
      };
    });
  },

  sendNodeToBack: (nodeId: string) => {
    set(state => {
      const node = state.nodes[nodeId];
      if (!node || !node.parentId || !state.nodes[node.parentId]) return state;
      const parent = state.nodes[node.parentId];
      const curIndex = parent.childrenIds.indexOf(nodeId);
      if (curIndex === -1 || curIndex === 0) return state;
      const nextChildren = parent.childrenIds.filter(id => id !== nodeId);
      nextChildren.unshift(nodeId);
      return {
        nodes: {
          ...state.nodes,
          [node.parentId]: { ...parent, childrenIds: nextChildren },
        },
        hasUnsavedChanges: true,
      };
    });
  },

  moveNodeOrder: (nodeId: string, direction: 'up' | 'down') => {
    set(state => {
      const node = state.nodes[nodeId];
      if (!node || !node.parentId || !state.nodes[node.parentId]) return state;
      const parent = state.nodes[node.parentId];
      const curIndex = parent.childrenIds.indexOf(nodeId);
      if (curIndex === -1) return state;
      const targetIndex = direction === 'up' ? curIndex - 1 : curIndex + 1;
      if (targetIndex < 0 || targetIndex >= parent.childrenIds.length) return state;
      const nextChildren = [...parent.childrenIds];
      const [removed] = nextChildren.splice(curIndex, 1);
      nextChildren.splice(targetIndex, 0, removed);
      return {
        nodes: {
          ...state.nodes,
          [node.parentId]: { ...parent, childrenIds: nextChildren },
        },
        hasUnsavedChanges: true,
      };
    });
  },

  // 🌟 5 NextGen Mechanics Implementation
  // 1. Visual Signal-Wiring
  setShowWiring: (show: boolean) => set({ showWiring: show }),
  toggleShowWiring: () => set(state => ({ showWiring: !state.showWiring })),
  addWire: (wire: WireConnection) => set(state => {
    const filtered = state.wires.filter(w => !(w.from.nodeId === wire.from.nodeId && w.from.name === wire.from.name && w.to.nodeId === wire.to.nodeId && w.to.name === wire.to.name));
    return {
      wires: [...filtered, wire],
      hasUnsavedChanges: true,
      pendingWireStart: null,
    };
  }),
  removeWire: (wireId: string) => set(state => ({
    wires: state.wires.filter(w => w.id !== wireId),
    hasUnsavedChanges: true,
  })),
  clearWires: () => set({ wires: [], hasUnsavedChanges: true }),
  setPendingWireStart: (port: SignalPort | null) => set({ pendingWireStart: port }),

  // 2. 2.5D X-Ray Layering
  setXrayMode: (enabled: boolean) => set({ xrayMode: enabled }),
  toggleXrayMode: () => set(state => ({ xrayMode: !state.xrayMode })),

  // 3. Radial Action Halo
  setRadialHaloNodeId: (nodeId: string | null) => set({ radialHaloNodeId: nodeId }),

  // 4. Morphic Layout Engine
  setMorphicMode: (mode: 'absolute' | 'adaptive') => set({ morphicMode: mode }),
  toggleMorphicMode: () => set(state => ({ morphicMode: state.morphicMode === 'absolute' ? 'adaptive' : 'absolute' })),

  // 5. Quantum Loop 4-in-1: Inject SQLite table directly as connected DataGridView
  injectTableAsGrid: (tableName: string, columns: string[]) => {
    const state = get();
    const activeForm = state.nodes[state.activeFormId] || state.nodes[state.rootFormId];
    if (!activeForm) return;

    const gridId = `dgv_${tableName.toLowerCase()}_${Date.now().toString().slice(-4)}`;
    const gridNode: DesignerNode = {
      id: gridId,
      type: 'DataGridView',
      parentId: activeForm.id,
      childrenIds: [],
      bounds: {
        x: 32,
        y: 48,
        width: Math.min(520, activeForm.bounds.width - 64),
        height: Math.min(260, activeForm.bounds.height - 80),
      },
      properties: {
        name: `dgv${tableName}`,
        text: `Таблица: ${tableName}`,
        columns: columns && columns.length > 0 ? columns : ['Id', 'Название', 'Дата'],
        dock: 'None',
        allowUserToAddRows: true,
        autoSize: true,
        enabled: true,
        visible: true,
      },
      events: {},
    };

    set(s => ({
      nodes: {
        ...s.nodes,
        [gridId]: gridNode,
        [activeForm.id]: {
          ...activeForm,
          childrenIds: [...activeForm.childrenIds, gridId],
        },
      },
      selectedNodeIds: [gridId],
      activeRightTab: 'properties',
      hasUnsavedChanges: true,
    }));

    get().addConsoleLog('System', `Квантовый контур 4-в-1: Таблица SQLite '${tableName}' внедрена как DataGridView 'dgv${tableName}'`);
  },

  setToolboxDragState: (status) => set(state => ({
    toolboxDragState: status ? { ...(state.toolboxDragState || { isDragging: false, controlType: null, targetContainerId: null, targetContainerName: null, futureName: null, localPos: null, screenPos: null }), ...status } : null,
  })),

  setAppMode: (mode) => {
    set(state => {
      const logs = [...state.consoleLogs];
      if (mode === 'emulator') {
        logs.unshift({
          id: Math.random().toString(),
          time: getTimestamp(),
          category: 'System',
          text: `Форма инициализирована в режиме эмуляции. Целевая платформа: ${state.targetFramework}`,
        });
      } else {
        logs.unshift({
          id: Math.random().toString(),
          time: getTimestamp(),
          category: 'System',
          text: 'Переключение в режим визуального редактора (Дизайнер).',
        });
      }
      return { appMode: mode, consoleLogs: logs.slice(0, 100) };
    });
  },

  addConsoleLog: (category, text, details) => {
    set(state => ({
      consoleLogs: [
        {
          id: Math.random().toString(),
          time: getTimestamp(),
          category,
          text,
          details,
        },
        ...state.consoleLogs.slice(0, 99),
      ],
    }));
  },

  clearConsoleLogs: () => set({ consoleLogs: [] }),

  // Form Focus Arbiter & Z-Index Virtualization (Pravka 2.6)
  bringFormToFront: (formId: string) => {
    const state = get();
    const formNode = state.nodes[formId];
    if (!formNode || formNode.type !== 'Form') return;

    const currentZ = state.formZOrder.filter(id => id !== formId);
    currentZ.push(formId);

    set({
      formZOrder: currentZ,
      activeFormId: formId,
      selectedNodeIds: [formId], // Instantly bind Property Inspector to active window
      activeRightTab: 'properties',
    });
  },

  setActiveFormId: (id: string) => {
    get().bringFormToFront(id);
  },

  setGlobalTheme: (theme: OSFrameTheme) => {
    set({ globalTheme: theme });
  },

  setGridStep: (step: GridStep) => {
    set({ gridStep: step, gridSize: step });
  },

  getAllForms: () => {
    return Object.values(get().nodes).filter(n => n.type === 'Form');
  },

  addForm: (className?: string, title?: string, bounds?: Partial<LayoutBounds>, theme?: OSFrameTheme): string => {
    const state = get();
    const id = `form_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;
    const allForms = Object.values(state.nodes).filter(n => n.type === 'Form');
    const nextIdx = allForms.length + 1;
    const finalClassName = sanitizeCsIdentifier(className || `Form${nextIdx}`).sanitized;
    const finalTitle = title || finalClassName;

    // Position new form next to the furthest form
    let startX = 40;
    if (allForms.length > 0) {
      const maxX = Math.max(...allForms.map(f => f.bounds.x + f.bounds.width));
      startX = maxX + 64;
    }

    const newForm: DesignerNode = {
      id,
      type: 'Form',
      bounds: {
        x: bounds?.x ?? startX,
        y: bounds?.y ?? 40,
        width: bounds?.width ?? 520,
        height: bounds?.height ?? 380,
      },
      properties: {
        name: finalClassName,
        text: finalTitle,
        enabled: true,
        visible: true,
        backColor: '#FFFFFF',
        foreColor: '#0F172A',
        fontFamily: 'Segoe UI',
        fontSize: 9,
        customProps: {
          themeOverride: theme || state.globalTheme,
          isMainWindow: false,
        },
      },
      events: {
        Load: `${finalClassName}_Load`,
      },
      parentId: null,
      childrenIds: [],
    };

    set(s => ({
      nodes: {
        ...s.nodes,
        [id]: newForm,
      },
      activeFormId: id,
      formZOrder: [...s.formZOrder.filter(fid => fid !== id), id],
      selectedNodeIds: [id],
      activeRightTab: 'properties',
      consoleLogs: [
        {
          id: Math.random().toString(),
          time: getTimestamp(),
          category: 'System',
          text: `[System] Добавлена новая форма: ${finalClassName} (${newForm.bounds.width}×${newForm.bounds.height} px)`,
        },
        ...s.consoleLogs.slice(0, 99),
      ],
    }));

    return id;
  },

  removeForm: (formId: string) => {
    const state = get();
    const allForms = Object.values(state.nodes).filter(n => n.type === 'Form');
    if (allForms.length <= 1) return; // Cannot delete the only remaining form

    const formNode = state.nodes[formId];
    if (!formNode) return;

    // Collect all descendant ids
    const toDelete = new Set<string>([formId]);
    const collectChildren = (parentId: string) => {
      const p = state.nodes[parentId];
      if (p?.childrenIds) {
        p.childrenIds.forEach(cId => {
          toDelete.add(cId);
          collectChildren(cId);
        });
      }
    };
    collectChildren(formId);

    const nextNodes = { ...state.nodes };
    toDelete.forEach(id => delete nextNodes[id]);

    const remainingForms = Object.values(nextNodes).filter(n => n.type === 'Form');
    const nextRootId = formId === state.rootFormId ? remainingForms[0]?.id || '' : state.rootFormId;
    const nextActiveId = formId === state.activeFormId ? remainingForms[0]?.id || '' : state.activeFormId;
    const nextZOrder = state.formZOrder.filter(id => id !== formId);

    set({
      nodes: nextNodes,
      rootFormId: nextRootId,
      activeFormId: nextActiveId,
      formZOrder: nextZOrder,
      selectedNodeIds: [nextActiveId],
    });
  },
}));

// Subscribe debounced storage persistence to store changes (250ms buffer)
useDesignerStore.subscribe((state, prevState) => {
  if (state.nodes !== prevState.nodes || state.rootFormId !== prevState.rootFormId) {
    debouncedStorage.scheduleSave({
      version: state.version,
      projectName: state.projectName,
      rootFormId: state.rootFormId,
      nodes: state.nodes,
      selectedNodeIds: state.selectedNodeIds,
      targetFramework: state.targetFramework,
    });
  }
});

// Sync store state with debounced storage status updates
debouncedStorage.subscribe(info => {
  useDesignerStore.setState({
    storageStatusInfo: info,
    hasUnsavedChanges: info.status !== 'saved',
  });
});

function getDefaultWidth(type: ControlType): number {
  return COMPONENT_REGISTRY[type]?.defaultSize.width || 120;
}

function getDefaultHeight(type: ControlType): number {
  return COMPONENT_REGISTRY[type]?.defaultSize.height || 35;
}
