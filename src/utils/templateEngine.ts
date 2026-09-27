import { DesignerProjectState } from '../types/ast';
import { TEMPLATES_CATALOG, TemplateDefinition, instantiateTemplateProject } from './templatesCatalog';
import { generateDesignerCs, generateCodeBehindCs } from './codeGenerators';
import { useDesignerStore } from '../store/designerStore';

export interface CreatedProjectResult {
  project: DesignerProjectState;
  designerCs: string;
  codeBehindCs: string;
  formCs: string;
  sqlSchema: string;
  template: TemplateDefinition;
}

export interface TemplateCustomizationOptions {
  customTitle?: string;
  projectName?: string;
  theme?: 'dark' | 'light' | 'blue' | 'purple' | 'emerald';
  primaryColor?: string;
  enableDatabase?: boolean;
  seedRecordCount?: number;
  fontSize?: number;
}

/**
 * Generates an initial SQLite DDL schema string for a template
 */
export const generateTemplateSqlSchema = (
  tpl: TemplateDefinition,
  customOptions?: TemplateCustomizationOptions
): string => {
  const tableName = tpl.dbTableName || 'AppDataRecord';
  const seedCount = customOptions?.seedRecordCount ?? 3;

  const seedRows: string[] = [];
  for (let i = 1; i <= seedCount; i++) {
    seedRows.push(
      `    ('${tpl.title} - Запись #${i}', '${tpl.categoryTitle}', ${(i * 45.5).toFixed(1)}, 'Active', '{"seed_index": ${i}, "status": "ok"}')`
    );
  }

  return `-- ==============================================================================
-- SQLite Schema DDL for Template #${tpl.num}: ${tpl.title}
-- Category: ${tpl.categoryTitle}
-- Target Engine: SQLite WASM / .NET 8 Microsoft.Data.Sqlite
-- ==============================================================================

CREATE TABLE IF NOT EXISTS ${tableName} (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    Category TEXT DEFAULT '${tpl.categoryTitle}',
    Value REAL DEFAULT 0.0,
    Status TEXT DEFAULT 'Active',
    PayloadJson TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for high-performance lookup
CREATE INDEX IF NOT EXISTS IX_${tableName}_Category ON ${tableName}(Category);
CREATE INDEX IF NOT EXISTS IX_${tableName}_CreatedAt ON ${tableName}(CreatedAt);

-- Initial Data Seed (${seedCount} records)
INSERT INTO ${tableName} (Title, Category, Value, Status, PayloadJson) VALUES
${seedRows.join(',\n')};
`;
};

/**
 * Creates a full project object from templateId with ready UI-AST, C# code for Form1.cs,
 * and initial SQL schema. Updates the Zustand store via setProjectState.
 */
export const createProjectFromTemplate = (
  templateId: string,
  autoUpdateStore: boolean = true,
  customOptions?: TemplateCustomizationOptions
): CreatedProjectResult => {
  // 1. Retrieve template definition
  const tpl = TEMPLATES_CATALOG.find((t) => t.id === templateId) || TEMPLATES_CATALOG[0];

  // 2. Instantiate full UI-AST project state
  const project = instantiateTemplateProject(tpl.id);

  // Apply customizations to AST project
  if (customOptions) {
    if (customOptions.projectName) {
      project.projectName = customOptions.projectName.replace(/[^a-zA-Z0-9_]/g, '');
    }

    const rootForm = project.nodes[project.rootFormId];
    if (rootForm) {
      if (customOptions.customTitle) {
        rootForm.properties.text = `${customOptions.customTitle} - NextGen IDE`;
      }

      if (customOptions.fontSize) {
        rootForm.properties.fontSize = customOptions.fontSize;
      }

      // Theme application
      if (customOptions.theme === 'light') {
        rootForm.properties.backColor = '#F3F4F6';
        rootForm.properties.foreColor = '#111827';
      } else if (customOptions.theme === 'blue') {
        rootForm.properties.backColor = '#0F172A';
        rootForm.properties.foreColor = '#F8FAFC';
      } else if (customOptions.theme === 'purple') {
        rootForm.properties.backColor = '#1E1B4B';
        rootForm.properties.foreColor = '#EEF2FF';
      } else if (customOptions.theme === 'emerald') {
        rootForm.properties.backColor = '#064E3B';
        rootForm.properties.foreColor = '#ECFDF5';
      } else if (customOptions.theme === 'dark') {
        rootForm.properties.backColor = '#18181B';
        rootForm.properties.foreColor = '#F4F4F5';
      }
    }
  }

  // 3. Generate C# WinForms .NET 8 code
  const designerCs = generateDesignerCs(project);
  const codeBehindCs = generateCodeBehindCs(project);
  const formCs = codeBehindCs; // Alias for Form1.cs

  // 4. Generate initial SQL schema
  const sqlSchema = generateTemplateSqlSchema(tpl, customOptions);

  // 5. Update Zustand Store if requested
  if (autoUpdateStore) {
    const store = useDesignerStore.getState();

    // Instantly update Zustand state via setProjectState
    store.setProjectState(project);

    // If template has SQLite database enabled, inject default table & grid structure
    const shouldEnableDb = customOptions?.enableDatabase ?? tpl.hasDatabase;
    if (shouldEnableDb && tpl.dbTableName) {
      const seedCount = customOptions?.seedRecordCount ?? 3;
      const rows = Array.from({ length: seedCount }, (_, idx) => ({
        Id: idx + 1,
        Title: `${customOptions?.customTitle || tpl.title} #${idx + 1}`,
        Category: tpl.categoryTitle,
        Value: (idx + 1) * 120.0,
        Status: idx % 2 === 0 ? 'Active' : 'Pending',
        CreatedAt: new Date(Date.now() - idx * 86400000).toISOString().split('T')[0],
      }));

      store.injectTableAsGrid(
        tpl.dbTableName,
        ['Id', 'Title', 'Category', 'Value', 'Status', 'CreatedAt'],
        rows
      );
    }

    // Add console notification & history transaction
    store.addConsoleLog(
      'System',
      `Развернут и кастомизирован проект из шаблона #${tpl.num}: "${customOptions?.customTitle || tpl.title}" (${tpl.categoryTitle}). C# и SQLite сгенерированы.`,
      `Designer.cs: ${designerCs.split('\n').length} строк, Form.cs: ${codeBehindCs.split('\n').length} строк`
    );
    store.commitTransaction(`Развертывание шаблона: ${customOptions?.customTitle || tpl.title}`);

    // Set app mode to designer
    store.setAppMode('designer');
  }

  return {
    project,
    designerCs,
    codeBehindCs,
    formCs,
    sqlSchema,
    template: tpl,
  };
};

export const getTemplateList = (): TemplateDefinition[] => TEMPLATES_CATALOG;

export const getTemplateById = (templateId: string): TemplateDefinition | undefined =>
  TEMPLATES_CATALOG.find((t) => t.id === templateId);
