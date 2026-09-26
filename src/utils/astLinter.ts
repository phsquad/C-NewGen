import { DesignerProjectState, DesignerNode } from '../types/ast';

export interface DiagnosticIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  category: 'syntax' | 'geometry' | 'performance';
  message: string;
  nodeId?: string;
  nodeName?: string;
  autoFixAvailable: boolean;
  autoFixDescription?: string;
}

export class ProjectASTLinter {
  /**
   * Performs pre-flight static AST analysis on the project in 0ms (pure TypeScript)
   */
  public static validateProject(state: DesignerProjectState): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];
    const usedNames = new Map<string, string[]>(); // name -> array of nodeIds

    const rootForm = state.nodes[state.rootFormId];
    const allNodes = Object.values(state.nodes);

    // 1. Syntax & Variable Collision Check (C# CS0102 / Python AttributeError)
    allNodes.forEach(node => {
      const name = node.properties.name;
      if (!usedNames.has(name)) {
        usedNames.set(name, []);
      }
      usedNames.get(name)!.push(node.id);
    });

    usedNames.forEach((ids, name) => {
      if (ids.length > 1) {
        ids.slice(1).forEach(dupId => {
          const dupNode = state.nodes[dupId];
          issues.push({
            id: `issue_dup_${dupId}`,
            severity: 'error',
            code: 'CS_DUPLICATE_NAME',
            category: 'syntax',
            message: `Имя компонента '${name}' продублировано (${ids.length} раз). Это вызовет ошибку компиляции CS0102 / Python NameError.`,
            nodeId: dupId,
            nodeName: name,
            autoFixAvailable: true,
            autoFixDescription: `Присвоить уникальное имя '${name}_${dupId.slice(-4)}'`,
          });
        });
      }
    });

    // 2. Geometry & UX Overlap & Out-of-Bounds Check
    if (rootForm) {
      const formW = rootForm.bounds.width;
      const formH = rootForm.bounds.height;

      const nonFormNodes = allNodes.filter(n => n.type !== 'Form');

      nonFormNodes.forEach((node, i) => {
        const name = node.properties.name;

        // Out of Bounds check
        const nodeRight = node.bounds.x + node.bounds.width;
        const nodeBottom = node.bounds.y + node.bounds.height;

        if (nodeRight > formW || nodeBottom > formH || node.bounds.x < 0 || node.bounds.y < 0) {
          issues.push({
            id: `issue_oob_${node.id}`,
            severity: 'warning',
            code: 'UI_OUT_OF_BOUNDS',
            category: 'geometry',
            message: `Элемент '${name}' вылазит за границы формы (${Math.round(nodeRight)}x${Math.round(nodeBottom)}px при размере формы ${formW}x${formH}px).`,
            nodeId: node.id,
            nodeName: name,
            autoFixAvailable: true,
            autoFixDescription: 'Сдвинуть элемент внутрь рабочей области формы',
          });
        }

        // Overlap Check with other nodes in same parent
        for (let j = i + 1; j < nonFormNodes.length; j++) {
          const other = nonFormNodes[j];
          if (node.parentId === other.parentId) {
            const overlapX = Math.max(0, Math.min(nodeRight, other.bounds.x + other.bounds.width) - Math.max(node.bounds.x, other.bounds.x));
            const overlapY = Math.max(0, Math.min(nodeBottom, other.bounds.y + other.bounds.height) - Math.max(node.bounds.y, other.bounds.y));
            const overlapArea = overlapX * overlapY;

            if (overlapArea > 16) {
              issues.push({
                id: `issue_overlap_${node.id}_${other.id}`,
                severity: 'warning',
                code: 'UI_OVERLAP',
                category: 'geometry',
                message: `Элемент '${name}' перекрывает элемент '${other.properties.name}' (${Math.round(overlapX)}x${Math.round(overlapY)}px).`,
                nodeId: node.id,
                nodeName: name,
                autoFixAvailable: true,
                autoFixDescription: 'Сдвинуть перекрывающий элемент вниз',
              });
            }
          }
        }

        // Event handler check for buttons
        if (node.type === 'Button' && (!node.events?.Click || !node.events.Click.trim())) {
          issues.push({
            id: `issue_event_${node.id}`,
            severity: 'info',
            code: 'EVENT_UNHANDLED',
            category: 'syntax',
            message: `Кнопка '${name}' не имеет назначенного обработчика Click.`,
            nodeId: node.id,
            nodeName: name,
            autoFixAvailable: true,
            autoFixDescription: `Назначить стандартный метод ${name}_Click`,
          });
        }
      });
    }

    // 3. Performance & Bundle Info
    const totalNodes = allNodes.length;
    if (totalNodes > 300) {
      issues.push({
        id: 'issue_perf_dense',
        severity: 'warning',
        code: 'PERF_HIGH_DENSITY',
        category: 'performance',
        message: `Высокая плотность узлов (${totalNodes} элементов). Рекомендуется виртуализация контейнеров.`,
        autoFixAvailable: false,
      });
    }

    return issues;
  }

  /**
   * Applies auto-fix for a specific issue ID
   */
  public static autoFixIssue(state: DesignerProjectState, issue: DiagnosticIssue): DesignerProjectState {
    const nextState: DesignerProjectState = JSON.parse(JSON.stringify(state));

    if (!issue.nodeId || !nextState.nodes[issue.nodeId]) return nextState;

    const targetNode = nextState.nodes[issue.nodeId];

    switch (issue.code) {
      case 'CS_DUPLICATE_NAME': {
        const uniqueSuffix = Date.now().toString().slice(-4);
        targetNode.properties.name = `${targetNode.properties.name}_${uniqueSuffix}`;
        break;
      }
      case 'UI_OUT_OF_BOUNDS': {
        const rootForm = nextState.nodes[nextState.rootFormId];
        if (rootForm) {
          const maxAllowedX = Math.max(10, rootForm.bounds.width - targetNode.bounds.width - 10);
          const maxAllowedY = Math.max(10, rootForm.bounds.height - targetNode.bounds.height - 10);
          targetNode.bounds.x = Math.min(Math.max(10, targetNode.bounds.x), maxAllowedX);
          targetNode.bounds.y = Math.min(Math.max(10, targetNode.bounds.y), maxAllowedY);
        }
        break;
      }
      case 'UI_OVERLAP': {
        // Shift node downwards by 12px past overlapping bounds
        targetNode.bounds.y += Math.round(targetNode.bounds.height + 12);
        break;
      }
      case 'EVENT_UNHANDLED': {
        if (!targetNode.events) targetNode.events = {};
        targetNode.events.Click = `${targetNode.properties.name}_Click`;
        break;
      }
    }

    return nextState;
  }

  /**
   * Applies all auto-fixable issues at once
   */
  public static autoFixAll(state: DesignerProjectState, issues: DiagnosticIssue[]): DesignerProjectState {
    let currentState = state;
    const fixable = issues.filter(i => i.autoFixAvailable);

    fixable.forEach(issue => {
      currentState = this.autoFixIssue(currentState, issue);
    });

    return currentState;
  }
}
