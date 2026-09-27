// store/useMasterEngineStore.ts
import { create } from 'zustand';
import Dexie, { Table } from 'dexie';

// 1. Core Interfaces
export interface DesignerNode {
  id: string;
  type: string;
  bounds: { x: number; y: number; width: number; height: number };
  properties: {
    name: string;
    text?: string;
    backColor?: string;
    foreColor?: string;
    fontFamily?: string;
    fontSize?: number;
    enabled?: boolean;
    visible?: boolean;
    tabIndex?: number;
    customProps?: Record<string, any>;
  };
  events: Record<string, string>;
  parentId: string | null;
  childrenIds: string[];
}

export interface ProjectEntity {
  id: string;
  name: string;
  namespace: string;
  author: string;
  targetStack: string;
  rootFormId: string;
  nodes: Record<string, DesignerNode>;
  updatedAt: number;
}

export interface AppWindow {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  bounds: { x: number; y: number; width: number; height: number };
}

// 2. Local IndexedDB Database
class MasterDatabase extends Dexie {
  public projects!: Table<ProjectEntity, string>;
  constructor() {
    super('NextGen_DevOS_MasterDB');
    this.version(1).stores({ projects: 'id, name, updatedAt' });
  }
}
export const masterDb = new MasterDatabase();

// 3. Master Engine State Interface
interface MasterEngineState {
  project: ProjectEntity | null;
  selectedNodeId: string | null;
  activeFileTab: string;
  vfsFiles: Record<string, string>;
  
  windows: Record<string, AppWindow>;
  topZIndex: number;

  networkRoom: string | null;
  connectedPeersCount: number;

  initProject: (project: ProjectEntity) => void;
  updateNodeProps: (nodeId: string, props: Partial<DesignerNode['properties']>) => void;
  updateNodeBounds: (nodeId: string, bounds: Partial<DesignerNode['bounds']>) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  
  updateFileContent: (fileName: string, content: string) => void;
  jumpToMethodInCode: (methodName: string) => void;

  openWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowBounds: (id: string, bounds: Partial<AppWindow['bounds']>) => void;

  saveToStorage: () => Promise<void>;
}

export const useMasterEngineStore = create<MasterEngineState>((set, get) => ({
  project: null,
  selectedNodeId: null,
  activeFileTab: 'Form1.cs',
  topZIndex: 100,
  networkRoom: null,
  connectedPeersCount: 0,
  vfsFiles: {},

  windows: {
    designer: {
      id: 'designer',
      title: '🛠 Дизайнер Форм',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 100,
      bounds: { x: 30, y: 20, width: 1150, height: 700 },
    },
    codeStudio: {
      id: 'codeStudio',
      title: '📝 Monaco Code Studio Pro',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 101,
      bounds: { x: 120, y: 60, width: 950, height: 620 },
    },
    sandbox: {
      id: 'sandbox',
      title: '⚡️ Живая Песочница (Omni-Runtime)',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 102,
      bounds: { x: 200, y: 80, width: 1000, height: 650 },
    },
    database: {
      id: 'database',
      title: '🗄 SQLite Studio',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 103,
      bounds: { x: 150, y: 70, width: 900, height: 550 },
    },
    builder: {
      id: 'builder',
      title: '🚀 Мастер Сборки .EXE',
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 104,
      bounds: { x: 250, y: 100, width: 750, height: 520 },
    },
  },

  // Project Initialization & VFS Code Generation
  initProject: (project) => {
    const designerCode = generateDesignerCs(project);
    const formCode = generateFormCs(project);
    const pyCode = generatePythonCode(project);
    const sqlCode = `CREATE TABLE IF NOT EXISTS Users (Id INTEGER PRIMARY KEY, Name TEXT, Role TEXT);\nINSERT INTO Users (Name, Role) VALUES ('admin', 'System Administrator');\n`;

    set({
      project,
      selectedNodeId: project.rootFormId,
      vfsFiles: {
        'Form1.cs': formCode,
        'Form1.Designer.cs': designerCode,
        'app.py': pyCode,
        'database.sql': sqlCode,
      },
    });

    localStorage.setItem('devos_active_project_id', project.id);
  },

  // Property Mutation (Canvas ──► Properties ──► Code Generator)
  updateNodeProps: (nodeId, newProps) => {
    const { project } = get();
    if (!project || !project.nodes[nodeId]) return;

    const updatedNode = {
      ...project.nodes[nodeId],
      properties: { ...project.nodes[nodeId].properties, ...newProps },
    };

    const updatedProject = {
      ...project,
      nodes: { ...project.nodes, [nodeId]: updatedNode },
      updatedAt: Date.now(),
    };

    const designerCode = generateDesignerCs(updatedProject);
    const pyCode = generatePythonCode(updatedProject);

    set((state) => ({
      project: updatedProject,
      vfsFiles: {
        ...state.vfsFiles,
        'Form1.Designer.cs': designerCode,
        'app.py': pyCode,
      },
    }));

    get().saveToStorage();
  },

  // Bounds Mutation (Drag / Resize ──► Update AST and C# Size/Point)
  updateNodeBounds: (nodeId, newBounds) => {
    const { project } = get();
    if (!project || !project.nodes[nodeId]) return;

    const updatedNode = {
      ...project.nodes[nodeId],
      bounds: { ...project.nodes[nodeId].bounds, ...newBounds },
    };

    const updatedProject = {
      ...project,
      nodes: { ...project.nodes, [nodeId]: updatedNode },
      updatedAt: Date.now(),
    };

    const designerCode = generateDesignerCs(updatedProject);

    set((state) => ({
      project: updatedProject,
      vfsFiles: { ...state.vfsFiles, 'Form1.Designer.cs': designerCode },
    }));

    get().saveToStorage();
  },

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  updateFileContent: (fileName, content) => {
    set((state) => ({
      vfsFiles: { ...state.vfsFiles, [fileName]: content },
    }));
  },

  // Jump from Double-Click on Canvas button straight to method line in Monaco
  jumpToMethodInCode: (methodName) => {
    const { openWindow, focusWindow } = get();
    openWindow('codeStudio');
    focusWindow('codeStudio');
    set({ activeFileTab: 'Form1.cs' });

    window.dispatchEvent(new CustomEvent('devos:jump_to_method', { detail: { methodName } }));
  },

  // DevOS Window Manager
  openWindow: (id) => {
    const { topZIndex } = get();
    set((state) => ({
      windows: {
        ...state.windows,
        [id]: {
          ...state.windows[id],
          isOpen: true,
          isMinimized: false,
          zIndex: topZIndex + 1,
        },
      },
      topZIndex: topZIndex + 1,
    }));
  },

  closeWindow: (id) => {
    set((state) => ({
      windows: { ...state.windows, [id]: { ...state.windows[id], isOpen: false } },
    }));
  },

  minimizeWindow: (id) => {
    set((state) => ({
      windows: { ...state.windows, [id]: { ...state.windows[id], isMinimized: true } },
    }));
  },

  focusWindow: (id) => {
    const { topZIndex } = get();
    set((state) => ({
      windows: {
        ...state.windows,
        [id]: { ...state.windows[id], zIndex: topZIndex + 1 },
      },
      topZIndex: topZIndex + 1,
    }));
  },

  updateWindowBounds: (id, bounds) => {
    set((state) => ({
      windows: {
        ...state.windows,
        [id]: { ...state.windows[id], bounds: { ...state.windows[id].bounds, ...bounds } },
      },
    }));
  },

  // Auto-Persist to IndexedDB
  saveToStorage: async () => {
    const { project } = get();
    if (project) {
      await masterDb.projects.put(project);
    }
  },
}));

// =========================================================================
// Code Generators (C# WinForms & Python CustomTkinter)
// =========================================================================
function generateDesignerCs(p: ProjectEntity): string {
  const root = p.nodes[p.rootFormId] ||
    Object.values(p.nodes).find((n) => n.type === 'Form') || {
      properties: { name: 'Form1', text: 'Form1' },
      bounds: { width: 600, height: 400 },
    };
  const rootName = root.properties?.name || 'Form1';
  let code = `namespace ${p.namespace || 'University.App'};\n\npartial class ${rootName} {\n    private System.ComponentModel.IContainer components = null;\n\n`;

  // Control Declarations
  Object.values(p.nodes).forEach((n) => {
    if (n.type !== 'Form') {
      code += `    private System.Windows.Forms.${n.type} ${n.properties?.name || n.id};\n`;
    }
  });

  code += `\n    private void InitializeComponent() {\n`;
  Object.values(p.nodes).forEach((n) => {
    if (n.type !== 'Form') {
      const name = n.properties?.name || n.id;
      code += `        this.${name} = new System.Windows.Forms.${n.type}();\n`;
    }
  });

  code += `        this.SuspendLayout();\n\n`;

  // Property Assignments
  Object.values(p.nodes).forEach((n) => {
    if (n.type !== 'Form') {
      const name = n.properties?.name || n.id;
      const bx = n.bounds?.x ?? 20;
      const by = n.bounds?.y ?? 20;
      const bw = n.bounds?.width ?? 120;
      const bh = n.bounds?.height ?? 36;

      code += `        // ${name}\n`;
      code += `        this.${name}.Location = new System.Drawing.Point(${bx}, ${by});\n`;
      code += `        this.${name}.Name = "${name}";\n`;
      code += `        this.${name}.Size = new System.Drawing.Size(${bw}, ${bh});\n`;
      if (n.properties?.text !== undefined) {
        code += `        this.${name}.Text = "${n.properties.text}";\n`;
      }
      if (n.properties?.backColor) {
        code += `        this.${name}.BackColor = System.Drawing.ColorTranslator.FromHtml("${n.properties.backColor}");\n`;
      }
      if (n.events?.Click) {
        code += `        this.${name}.Click += new System.EventHandler(this.${n.events.Click});\n`;
      }
      code += `        this.Controls.Add(this.${name});\n\n`;
    }
  });

  code += `        // ${rootName}\n`;
  code += `        this.ClientSize = new System.Drawing.Size(${root.bounds?.width ?? 640}, ${root.bounds?.height ?? 480});\n`;
  code += `        this.Name = "${rootName}";\n`;
  code += `        this.Text = "${root.properties?.text || 'Form1'}";\n`;
  code += `        this.ResumeLayout(false);\n    }\n}\n`;
  return code;
}

function generateFormCs(p: ProjectEntity): string {
  const root = p.nodes[p.rootFormId] ||
    Object.values(p.nodes).find((n) => n.type === 'Form') || {
      properties: { name: 'Form1' },
    };
  const rootName = root.properties?.name || 'Form1';
  return `using System;\nusing System.Windows.Forms;\n\nnamespace ${p.namespace || 'University.App'};\n\npublic partial class ${rootName} : Form {\n    public ${rootName}() {\n        InitializeComponent();\n    }\n\n    private void btnCalculate_Click(object? sender, EventArgs e) {\n        MessageBox.Show("Расчет выполнен успешно!", "Информация");\n    }\n}\n`;
}

function generatePythonCode(p: ProjectEntity): string {
  const root = p.nodes[p.rootFormId] ||
    Object.values(p.nodes).find((n) => n.type === 'Form') || {
      properties: { name: 'Form1', text: 'Form1' },
      bounds: { width: 600, height: 400 },
    };
  const rootName = root.properties?.name || 'Form1';
  let py = `import customtkinter as ctk\n\nclass ${rootName}(ctk.CTk):\n    def __init__(self):\n        super().__init__()\n        self.title("${root.properties?.text || 'Form1'}")\n        self.geometry("${root.bounds?.width ?? 640}x${root.bounds?.height ?? 480}")\n\n`;

  Object.values(p.nodes).forEach((n) => {
    if (n.type !== 'Form') {
      const name = n.properties?.name || n.id;
      const bx = n.bounds?.x ?? 20;
      const by = n.bounds?.y ?? 20;
      const bw = n.bounds?.width ?? 120;
      const bh = n.bounds?.height ?? 36;

      py += `        self.${name} = ctk.CTkButton(self, text="${n.properties?.text || ''}", width=${bw}, height=${bh})\n`;
      py += `        self.${name}.place(x=${bx}, y=${by})\n`;
    }
  });

  py += `\nif __name__ == "__main__":\n    app = ${rootName}()\n    app.mainloop()\n`;
  return py;
}
