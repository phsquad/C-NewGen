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

/**
 * Generates an initial SQLite DDL schema string for a template
 */
export const generateTemplateSqlSchema = (tpl: TemplateDefinition): string => {
  const tableName = tpl.dbTableName || 'AppDataRecord';

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

-- Initial Mock Data Seed
INSERT INTO ${tableName} (Title, Category, Value, Status, PayloadJson) VALUES
    ('${tpl.title} - Запись Alpha', '${tpl.categoryTitle}', 100.0, 'Active', '{"version": 1, "note": "Initial template seed"}'),
    ('${tpl.title} - Запись Beta', '${tpl.categoryTitle}', 250.5, 'Active', '{"version": 1, "note": "Sample record"}'),
    ('${tpl.title} - Запись Gamma', '${tpl.categoryTitle}', 42.0, 'Archived', '{"version": 1, "note": "Archived entry"}');
`;
};

/**
 * Creates a full project object from templateId with ready UI-AST, C# code for Form1.cs,
 * and initial SQL schema. Updates the Zustand store via setProjectState.
 */
export const createProjectFromTemplate = (
  templateId: string,
  autoUpdateStore: boolean = true
): CreatedProjectResult => {
  // 1. Retrieve template definition
  const tpl = TEMPLATES_CATALOG.find((t) => t.id === templateId) || TEMPLATES_CATALOG[0];

  // 2. Instantiate full UI-AST project state
  const project = instantiateTemplateProject(tpl.id);

  // 3. Generate C# WinForms .NET 8 code
  const designerCs = generateDesignerCs(project);
  const codeBehindCs = generateCodeBehindCs(project);
  const formCs = codeBehindCs; // Alias for Form1.cs

  // 4. Generate initial SQL schema
  const sqlSchema = generateTemplateSqlSchema(tpl);

  // 5. Update Zustand Store if requested
  if (autoUpdateStore) {
    const store = useDesignerStore.getState();

    // Instantly update Zustand state via setProjectState
    store.setProjectState(project);

    // If template has SQLite database, inject default table & grid structure
    if (tpl.hasDatabase && tpl.dbTableName) {
      store.injectTableAsGrid(
        tpl.dbTableName,
        ['Id', 'Title', 'Category', 'Value', 'Status', 'CreatedAt'],
        [
          { Id: 1, Title: `${tpl.title} #1`, Category: tpl.categoryTitle, Value: 100.0, Status: 'Active', CreatedAt: '2026-09-01' },
          { Id: 2, Title: `${tpl.title} #2`, Category: tpl.categoryTitle, Value: 250.5, Status: 'Active', CreatedAt: '2026-09-05' },
          { Id: 3, Title: `${tpl.title} #3`, Category: tpl.categoryTitle, Value: 42.0, Status: 'Archived', CreatedAt: '2026-09-12' },
        ]
      );
    }

    // Add console notification & history transaction
    store.addConsoleLog(
      'System',
      `Развернут проект из шаблона #${tpl.num}: "${tpl.title}" (${tpl.categoryTitle}). C# и SQLite сгенерированы.`,
      `Designer.cs: ${designerCs.split('\n').length} строк, Form.cs: ${codeBehindCs.split('\n').length} строк`
    );
    store.commitTransaction(`Развертывание шаблона: ${tpl.title}`);

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
