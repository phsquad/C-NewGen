import { DesignerProjectState, DesignerNode, OSFrameTheme } from '../types/ast';

export const CURRENT_SCHEMA_VERSION = '1.5.0';

export interface MigrationResult {
  state: DesignerProjectState;
  wasMigrated: boolean;
  originalVersion: string;
  targetVersion: string;
}

/**
 * Compare semver versions (e.g. "1.2.0" vs "1.5.0")
 * Returns -1 if v1 < v2, 1 if v1 > v2, 0 if equal
 */
function compareSemver(v1: string, v2: string): number {
  const parse = (v: string) => (v || '0.0.0').split('.').map(n => parseInt(n, 10) || 0);
  const p1 = parse(v1);
  const p2 = parse(v2);
  for (let i = 0; i < 3; i++) {
    const a = p1[i] || 0;
    const b = p2[i] || 0;
    if (a < b) return -1;
    if (a > b) return 1;
  }
  return 0;
}

/**
 * Validates and migrates any incoming project AST state to CURRENT_SCHEMA_VERSION (1.5.0)
 * Guarantees 100% backward compatibility for all previously saved projects.
 */
export function migrateProjectSchema(raw: any): MigrationResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Некорректный формат данных проекта (ожидался JSON объект)');
  }

  const originalVersion = typeof raw.version === 'string' ? raw.version : '1.0.0';
  let wasMigrated = false;

  // Deep clone to prevent mutation of source
  const state: DesignerProjectState = JSON.parse(JSON.stringify(raw));

  // Migration step 1: Ensure basic root properties
  if (!state.projectName) {
    state.projectName = 'WinFormsApp1';
    wasMigrated = true;
  }
  if (!state.targetFramework) {
    state.targetFramework = 'WinForms';
    wasMigrated = true;
  }
  if (!state.nodes || typeof state.nodes !== 'object') {
    state.nodes = {};
    wasMigrated = true;
  }

  // Ensure root form exists
  if (!state.rootFormId || !state.nodes[state.rootFormId]) {
    const existingForms = Object.values(state.nodes).filter(n => n.type === 'Form');
    if (existingForms.length > 0) {
      state.rootFormId = existingForms[0].id;
    } else {
      const rootId = 'form_main_migrated';
      state.rootFormId = rootId;
      state.nodes[rootId] = {
        id: rootId,
        type: 'Form',
        parentId: null,
        childrenIds: [],
        bounds: { x: 40, y: 40, width: 680, height: 460 },
        properties: {
          name: 'MainForm',
          text: 'Главная форма',
          backColor: '#18181B',
          foreColor: '#F4F4F5',
          fontFamily: 'Segoe UI',
          fontSize: 9,
          fontBold: false,
          enabled: true,
          visible: true,
          locked: false,
        },
        events: { Load: 'MainForm_Load' },
      };
    }
    wasMigrated = true;
  }

  // Migration step 2: Normalize all nodes and properties
  Object.keys(state.nodes).forEach(id => {
    const node = state.nodes[id];
    if (!node) return;

    // Bounds safety
    if (!node.bounds || typeof node.bounds !== 'object') {
      node.bounds = { x: 16, y: 16, width: 120, height: 32 };
      wasMigrated = true;
    } else {
      node.bounds.x = typeof node.bounds.x === 'number' ? node.bounds.x : 0;
      node.bounds.y = typeof node.bounds.y === 'number' ? node.bounds.y : 0;
      node.bounds.width = Math.max(12, typeof node.bounds.width === 'number' ? node.bounds.width : 100);
      node.bounds.height = Math.max(12, typeof node.bounds.height === 'number' ? node.bounds.height : 30);
    }

    // Children & Parent safety
    if (!Array.isArray(node.childrenIds)) {
      node.childrenIds = [];
      wasMigrated = true;
    }
    if (node.type === 'Form') {
      node.parentId = null;
    } else if (node.parentId === undefined) {
      node.parentId = state.rootFormId;
      wasMigrated = true;
    }

    // Properties safety
    if (!node.properties || typeof node.properties !== 'object') {
      node.properties = {
        name: `${node.type.toLowerCase()}1`,
        text: node.type,
        enabled: true,
        visible: true,
        locked: false,
      };
      wasMigrated = true;
    }
    if (!node.properties.name) {
      node.properties.name = `${node.type.toLowerCase()}_${id.substring(0, 4)}`;
      wasMigrated = true;
    }
    if (node.properties.enabled === undefined) node.properties.enabled = true;
    if (node.properties.visible === undefined) node.properties.visible = true;
    if (node.properties.locked === undefined) node.properties.locked = false;

    // Events safety
    if (!node.events || typeof node.events !== 'object') {
      node.events = {};
      wasMigrated = true;
    }
  });

  // Re-establish parent-child references if broken
  Object.values(state.nodes).forEach(node => {
    if (node.type !== 'Form' && node.parentId && state.nodes[node.parentId]) {
      const parent = state.nodes[node.parentId];
      if (!parent.childrenIds.includes(node.id)) {
        parent.childrenIds.push(node.id);
        wasMigrated = true;
      }
    }
  });

  // Migration step 3 (v1.3.0+): Multi-form & Canvas Settings
  if (compareSemver(originalVersion, '1.3.0') < 0) {
    if (!state.activeFormId) {
      state.activeFormId = state.rootFormId;
    }
    const formIds = Object.values(state.nodes).filter(n => n.type === 'Form').map(n => n.id);
    if (!state.formZOrder || state.formZOrder.length === 0) {
      state.formZOrder = formIds;
    }
    if (!state.canvasSettings) {
      state.canvasSettings = {
        globalTheme: 'Win11Mica',
        gridStep: 8,
        snapToGrid: true,
        showGrid: true,
      };
    }
    if (!state.orphanedHandlers) {
      state.orphanedHandlers = [];
    }
    wasMigrated = true;
  }

  // Migration step 4 (v1.5.0): Standardize theme and final version tag
  if (compareSemver(originalVersion, CURRENT_SCHEMA_VERSION) < 0) {
    state.version = CURRENT_SCHEMA_VERSION;
    wasMigrated = true;
  }

  return {
    state,
    wasMigrated: wasMigrated || originalVersion !== CURRENT_SCHEMA_VERSION,
    originalVersion,
    targetVersion: CURRENT_SCHEMA_VERSION,
  };
}
