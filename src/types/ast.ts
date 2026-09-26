/**
 * Unified UI-AST (Abstract Syntax Tree) Data Specification
 * Platform-agnostic intermediate representation for C# Form Designers
 */

export type ControlType =
  | 'Form'
  | 'Button'
  | 'TextBox'
  | 'Label'
  | 'Panel'
  | 'CheckBox'
  | 'RadioButton'
  | 'ComboBox'
  | 'ListBox'
  | 'NumericUpDown'
  | 'DateTimePicker'
  | 'ProgressBar'
  | 'PictureBox'
  | 'GroupBox'
  | 'FlowLayoutPanel'
  | 'TabControl'
  | 'DataGridView'
  | 'MenuStrip'
  | 'ToolStrip'
  | 'StatusStrip'
  | 'TreeView'
  | 'ListView'
  | 'RichTextBox'
  | 'DataChart'
  | 'OpenFileDialog'
  | 'ToggleSwitch'
  | 'IconButton'
  | 'SplitButton'
  | 'PasswordBox'
  | 'TrackBar'
  | 'ContextMenuStrip'
  | 'SplitContainer'
  | 'Timer'
  | 'BackgroundWorker'
  | 'SaveFileDialog'
  | 'ColorPicker'
  | 'RepeatButton'
  | 'CheckedListBox';

export interface MenuItemNode {
  id: string;
  text: string;                // Заголовок (напр. "Файл", "Сохранить")
  shortcut?: string;           // Горячая клавиша (напр. "Ctrl+S")
  icon?: string;               // Иконка пункта
  isSeparator?: boolean;       // Разделительная черта (---)
  clickEvent?: string;         // Имя метода в C# (напр. "saveToolStripMenuItem_Click")
  children?: MenuItemNode[];   // Вложенные выпадающие подменю
}

export interface ToolStripItemNode {
  id: string;
  text: string;
  icon?: string;
  isSeparator?: boolean;
  clickEvent?: string;
  toolTip?: string;
}

export interface StatusStripItemNode {
  id: string;
  text: string;
  type?: 'Label' | 'ProgressBar' | 'DropDownButton';
  progressValue?: number;
  isSpring?: boolean;
}

export interface TreeNodeItem {
  id: string;
  text: string;
  icon?: string;
  isExpanded?: boolean;
  children?: TreeNodeItem[];
}

export interface ListViewColumn {
  text: string;
  width: number;
}

export interface ListViewItem {
  id: string;
  text: string;
  subItems?: string[];
  icon?: string;
}

export interface LayoutBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NodeProperties {
  name: string;                // C# identifier, e.g. "btnSubmit"
  text?: string;               // Display text or button label
  enabled: boolean;            // Is enabled
  visible: boolean;            // Is visible
  backColor?: string;          // Hex color (e.g. "#2563EB" or "#F3F4F6")
  foreColor?: string;          // Hex text color (e.g. "#FFFFFF")
  fontFamily?: string;         // Font family
  fontSize?: number;           // Font size in pt
  fontBold?: boolean;          // Bold style
  anchor?: ('Top' | 'Bottom' | 'Left' | 'Right')[]; // Anchor sides
  dock?: 'None' | 'Top' | 'Bottom' | 'Left' | 'Right' | 'Fill'; // Docking
  tabIndex?: number;           // Tab order
  locked?: boolean;            // Prevent designer dragging
  flatStyle?: 'Standard' | 'Flat' | 'Popup' | 'System';
  borderStyle?: 'None' | 'FixedSingle' | 'Fixed3D';
  placeholder?: string;        // TextBox placeholder
  checked?: boolean;           // CheckBox / Radio checked
  progressValue?: number;      // ProgressBar percentage (0 - 100)
  items?: string[];            // ComboBox / ListBox items
  imageSrc?: string;           // PictureBox image URL or base64
  tabTitles?: string[];        // TabControl tabs
  activeTabIndex?: number;     // TabControl active index
  useVisualStyleBackColor?: boolean;
  useSystemPasswordChar?: boolean;
  autoSize?: boolean;
  dropDownStyle?: 'DropDown' | 'DropDownList' | 'Simple';
  selectionMode?: 'One' | 'MultiSimple' | 'MultiExtended' | 'None';
  value?: number | string;
  minimum?: number;
  maximum?: number;
  format?: 'Long' | 'Short' | 'Time' | 'Custom';
  sizeMode?: 'Normal' | 'StretchImage' | 'AutoSize' | 'CenterImage' | 'Zoom';
  style?: 'Continuous' | 'Blocks' | 'Marquee';
  autoScroll?: boolean;
  tabPages?: string[];
  allowUserToAddRows?: boolean;
  columns?: string[];
  menuItems?: MenuItemNode[];
  toolStripItems?: ToolStripItemNode[];
  statusStripItems?: StatusStripItemNode[];
  treeNodes?: TreeNodeItem[];
  listViewColumns?: ListViewColumn[];
  listViewItems?: ListViewItem[];
  richTextRtf?: string;
  chartSeries?: { name: string; values: number[]; color?: string }[];
  chartType?: 'Bar' | 'Line' | 'Pie' | 'Area';
  rawCustomLines?: string[];
  customProps?: Record<string, any>;
}

export interface NodeEvents {
  [eventName: string]: string; // E.g. { "Click": "btnSubmit_Click", "TextChanged": "txtLogin_TextChanged" }
}

export interface DesignerNode {
  id: string;                  // Unique UUID
  type: ControlType;           // Component type
  bounds: LayoutBounds;        // Coordinates relative to parent
  properties: NodeProperties;  // Component properties
  events: NodeEvents;          // Event handlers
  parentId: string | null;     // ID of parent node (Form or container)
  childrenIds: string[];       // Ordered list of child node IDs
}

export type TargetFramework = 'WinForms' | 'Avalonia' | 'NetForms' | 'WebForms';

// OS Window Frame Skins
export type OSFrameTheme = 'Win11Mica' | 'Win32Classic' | 'LinuxGTK';
export type GridStep = 4 | 8 | 16;

export interface FormContainerNode {
  id: string;                   // UUID формы
  className: string;            // Имя C#-класса (напр. "Form1", "LoginForm")
  title: string;                // Текст заголовка окна
  worldBounds: { x: number; y: number }; // Позиция формы на общем бесконечном холсте
  clientSize: { width: number; height: number }; // Реальный размер окна в C# (напр. 800x450)
  themeOverride?: OSFrameTheme; // Индивидуальный скин для формы
  isMainWindow: boolean;        // Главная форма проекта (запускается в Program.cs)
  childControlIds: string[];    // ID контролов внутри этой формы
}

export interface CanvasSettings {
  gridStep: GridStep;
  snapToGrid: boolean;
  globalTheme: OSFrameTheme;
  showGrid: boolean;
}

export interface OrphanedEventHandler {
  handlerName: string;
  eventName: string;
  formerControlName: string;
  formerControlType: string;
  deletedAt?: string;
  customBodySnippet?: string;
}

export interface DesignerProjectState {
  version: string;             // Schema version (e.g. "1.0.0")
  projectName: string;         // Project name
  namespace?: string;          // Project namespace (e.g. "University.Mathematics.Lab1")
  author?: string;             // Author/Developer name
  description?: string;        // Project description/purpose
  polyglotTarget?: 'winforms' | 'python' | 'web'; // Target primary language
  rootFormId: string;          // Main Form node ID
  activeFormId?: string;       // Currently focused form on the multi-form canvas
  formIds?: string[];          // List of all forms on the canvas
  formZOrder?: string[];       // Z-index ordering of forms on canvas
  canvasSettings?: CanvasSettings; // Global canvas viewport settings
  nodes: Record<string, DesignerNode>; // Flat lookup table (O(1) access)
  selectedNodeIds: string[];   // Currently selected node IDs
  targetFramework: TargetFramework; // Target generation stack
  rawCustomLines?: string[];   // Preserved user custom statements & comments
  orphanedHandlers?: OrphanedEventHandler[]; // Preserved methods from deleted controls (Pravka 9.1)
}

export type SnapGuideKind = 'edge' | 'center' | 'margin' | 'gap';

export interface EquidistantTick {
  type: 'x' | 'y';
  startPos: number;
  endPos: number;
  crossCoord: number;
  distance: number;
  label?: string;
}

export interface SnapGuide {
  type: 'x' | 'y';
  position: number;
  start: number;
  end: number;
  kind?: SnapGuideKind;
  label?: string;
  color?: string;
  targetName?: string;
}

export interface SnapTargetTelemetry {
  targetName?: string;
  alignSummary: string;
  isMagneticActive: boolean;
  deltaX: number;
  deltaY: number;
}
