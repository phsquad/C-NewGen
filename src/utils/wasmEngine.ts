import { DesignerProjectState } from '../types/ast';

export interface DiagnosticItem {
  id: string;
  severity: 'Error' | 'Warning' | 'Info';
  code: string;
  message: string;
  target?: string;
}

export interface WasmEngineStatus {
  status: 'READY' | 'ANALYZING' | 'ERROR';
  engineName: string;
  runtimeVersion: string;
  errorCount: number;
  warningCount: number;
  diagnostics: DiagnosticItem[];
}

export const validateProjectAst = (project: DesignerProjectState): WasmEngineStatus => {
  const diagnostics: DiagnosticItem[] = [];
  const nameOccurrences = new Map<string, string[]>();

  // Check all node names
  Object.values(project.nodes).forEach(node => {
    const name = node.properties.name?.trim();

    // Check valid C# identifier
    if (!name || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      diagnostics.push({
        id: `err_name_${node.id}`,
        severity: 'Error',
        code: 'CS0103',
        message: `Недопустимый C# идентификатор имени элемента: "${name}"`,
        target: node.id,
      });
    }

    // Check duplicate names
    if (name) {
      const existing = nameOccurrences.get(name) || [];
      existing.push(node.id);
      nameOccurrences.set(name, existing);
    }

    // Check event handler names
    if (node.events) {
      Object.entries(node.events).forEach(([evt, handler]) => {
        if (handler && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(handler.trim())) {
          diagnostics.push({
            id: `err_evt_${node.id}_${evt}`,
            severity: 'Error',
            code: 'CS0117',
            message: `Недопустимое имя метода события ${evt}: "${handler}"`,
            target: node.id,
          });
        }
      });
    }

    // Check bounds
    if (node.bounds.width <= 0 || node.bounds.height <= 0) {
      diagnostics.push({
        id: `warn_size_${node.id}`,
        severity: 'Warning',
        code: 'CS0168',
        message: `Элемент ${name} имеет нулевой или отрицательный размер`,
        target: node.id,
      });
    }

    // Check out of bounds relative to parent
    if (node.parentId && project.nodes[node.parentId]) {
      const parent = project.nodes[node.parentId];
      if (node.bounds.x + node.bounds.width > parent.bounds.width + 100 || node.bounds.y + node.bounds.height > parent.bounds.height + 100) {
        diagnostics.push({
          id: `info_oob_${node.id}`,
          severity: 'Info',
          code: 'LAYOUT001',
          message: `Элемент ${name} выходит за видимые границы родительского контейнера`,
          target: node.id,
        });
      }
    }
  });

  // Report duplicate names
  nameOccurrences.forEach((ids, name) => {
    if (ids.length > 1) {
      ids.forEach(id => {
        diagnostics.push({
          id: `err_dup_${id}`,
          severity: 'Error',
          code: 'CS0102',
          message: `Конфликт имен: элемент с именем "${name}" уже объявлен в форме`,
          target: id,
        });
      });
    }
  });

  const errorCount = diagnostics.filter(d => d.severity === 'Error').length;
  const warningCount = diagnostics.filter(d => d.severity === 'Warning').length;

  return {
    status: errorCount > 0 ? 'ERROR' : 'READY',
    engineName: 'Roslyn C# AST Engine (WASM v9.0)',
    runtimeVersion: '.NET 8/9 CoreCLR',
    errorCount,
    warningCount,
    diagnostics,
  };
};
