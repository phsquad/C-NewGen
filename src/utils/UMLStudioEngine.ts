export type UMLNodeType = 'Class' | 'Interface' | 'AbstractClass' | 'Enum' | 'Struct';
export type RelationType = 'Inheritance' | 'Implementation' | 'Aggregation' | 'Composition' | 'Association';

export interface UMLProperty {
  id: string;
  visibility: '+' | '-' | '#'; // public, private, protected
  name: string;
  type: string;
  defaultValue?: string;
}

export interface UMLMethod {
  id: string;
  visibility: '+' | '-' | '#';
  name: string;
  returnType: string;
  parameters: Array<{ name: string; type: string }>;
  existingBody?: string;
}

export interface UMLNode {
  id: string;
  type: UMLNodeType;
  name: string;
  namespace: string;
  properties: UMLProperty[];
  methods: UMLMethod[];
  position: { x: number; y: number };
  colorTag?: string;
}

export interface UMLRelation {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: RelationType;
  label?: string;
}

export class UMLStudioEngine {
  private static readonly STORAGE_KEY = 'devos_uml_studio_architecture_v1';

  /**
   * Initial default architecture schema for quick demonstration
   */
  public static getDefaultNodes(): { nodes: Record<string, UMLNode>; relations: UMLRelation[] } {
    const nodes: Record<string, UMLNode> = {
      person_node: {
        id: 'person_node',
        type: 'AbstractClass',
        name: 'Person',
        namespace: 'MyLabApp.Domain',
        properties: [
          { id: 'p1', visibility: '+', name: 'Name', type: 'string' },
          { id: 'p2', visibility: '+', name: 'Age', type: 'int' },
        ],
        methods: [
          {
            id: 'm1',
            visibility: '+',
            name: 'GetInfo',
            returnType: 'string',
            parameters: [],
            existingBody: 'return $"{Name}, {Age} лет";',
          },
        ],
        position: { x: 80, y: 50 },
        colorTag: '#2563eb',
      },
      student_node: {
        id: 'student_node',
        type: 'Class',
        name: 'Student',
        namespace: 'MyLabApp.Domain',
        properties: [
          { id: 'sp1', visibility: '+', name: 'GroupName', type: 'string' },
          { id: 'sp2', visibility: '+', name: 'Grades', type: 'List<int>' },
        ],
        methods: [
          {
            id: 'sm1',
            visibility: '+',
            name: 'CalculateAverage',
            returnType: 'double',
            parameters: [],
            existingBody: 'return Grades.Count > 0 ? Grades.Average() : 0.0;',
          },
        ],
        position: { x: 80, y: 280 },
        colorTag: '#10b981',
      },
      calculator_interface: {
        id: 'calculator_interface',
        type: 'Interface',
        name: 'IGradeCalculator',
        namespace: 'MyLabApp.Domain',
        properties: [],
        methods: [
          {
            id: 'im1',
            visibility: '+',
            name: 'CalculateAverage',
            returnType: 'double',
            parameters: [],
          },
        ],
        position: { x: 500, y: 160 },
        colorTag: '#8b5cf6',
      },
    };

    const relations: UMLRelation[] = [
      {
        id: 'r1',
        fromNodeId: 'student_node',
        toNodeId: 'person_node',
        type: 'Inheritance',
        label: ': Person',
      },
      {
        id: 'r2',
        fromNodeId: 'student_node',
        toNodeId: 'calculator_interface',
        type: 'Implementation',
        label: ': IGradeCalculator',
      },
    ];

    return { nodes, relations };
  }

  /**
   * 22.1 Non-Destructive Method Body Preservation Generator
   * Preserves hand-written C# logic inside methods during class metadata updates
   */
  public static generateCSharpCode(
    node: UMLNode,
    relations: UMLRelation[],
    allNodes: Record<string, UMLNode>,
    existingFileCode?: string
  ): string {
    const parentRel = relations.find((r) => r.fromNodeId === node.id && r.type === 'Inheritance');
    const interfaceRels = relations.filter((r) => r.fromNodeId === node.id && r.type === 'Implementation');

    const inheritanceList: string[] = [];
    if (parentRel && allNodes[parentRel.toNodeId]) {
      inheritanceList.push(allNodes[parentRel.toNodeId].name);
    }
    interfaceRels.forEach((rel) => {
      if (allNodes[rel.toNodeId]) {
        inheritanceList.push(allNodes[rel.toNodeId].name);
      }
    });

    const extendsClause = inheritanceList.length > 0 ? ` : ${inheritanceList.join(', ')}` : '';
    const classKind =
      node.type === 'Interface'
        ? 'interface'
        : node.type === 'AbstractClass'
        ? 'abstract class'
        : node.type === 'Enum'
        ? 'enum'
        : node.type === 'Struct'
        ? 'struct'
        : 'class';

    let code = `using System;\nusing System.Collections.Generic;\nusing System.Linq;\n\n`;
    code += `namespace ${node.namespace};\n\n`;
    code += `public ${classKind} ${node.name}${extendsClause} {\n`;

    if (node.type === 'Enum') {
      node.properties.forEach((p, idx) => {
        const isLast = idx === node.properties.length - 1;
        code += `    ${p.name}${p.defaultValue ? ` = ${p.defaultValue}` : ''}${isLast ? '' : ','}\n`;
      });
    } else {
      // Properties
      if (node.properties.length > 0) {
        node.properties.forEach((p) => {
          const vis = p.visibility === '+' ? 'public' : p.visibility === '-' ? 'private' : 'protected';
          code += `    ${vis} ${p.type} ${p.name} { get; set; }${p.defaultValue ? ` = ${p.defaultValue};` : ''}\n`;
        });
        code += `\n`;
      }

      // Methods
      node.methods.forEach((m) => {
        const vis = m.visibility === '+' ? 'public' : m.visibility === '-' ? 'private' : 'protected';
        const params = m.parameters.map((param) => `${param.type} ${param.name}`).join(', ');

        if (node.type === 'Interface') {
          code += `    ${m.returnType} ${m.name}(${params});\n`;
        } else {
          // Check for preserved existing body logic (Fix 22.1)
          let methodBody = m.existingBody;

          if (!methodBody && existingFileCode) {
            const bodyRegex = new RegExp(
              `${m.name}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\}`,
              'm'
            );
            const match = existingFileCode.match(bodyRegex);
            if (match && match[1]) {
              methodBody = match[1].trim();
            }
          }

          if (!methodBody) {
            if (m.returnType === 'void') {
              methodBody = '// TODO: Логика выполнения';
            } else if (m.returnType === 'int' || m.returnType === 'double') {
              methodBody = 'return 0;';
            } else if (m.returnType === 'string') {
              methodBody = 'return string.Empty;';
            } else if (m.returnType === 'bool') {
              methodBody = 'return true;';
            } else {
              methodBody = 'return default!;';
            }
          }

          code += `    ${vis} ${m.returnType} ${m.name}(${params}) {\n        ${methodBody.replace(/\n/g, '\n        ')}\n    }\n\n`;
        }
      });
    }

    code += `}\n`;
    return code;
  }

  /**
   * 22.2 Force-Directed Orthogonal Auto-Layout Algorithm
   * Automatically lays out UML nodes neatly top-to-bottom with hierarchical spacing
   */
  public static autoLayoutNodes(
    nodes: Record<string, UMLNode>,
    relations: UMLRelation[]
  ): Record<string, UMLNode> {
    const updated = JSON.parse(JSON.stringify(nodes)) as Record<string, UMLNode>;
    const nodeIds = Object.keys(updated);
    if (nodeIds.length === 0) return updated;

    // Build hierarchy levels: Parent classes top (y=50), Child classes bottom (y=280+)
    const levels: Record<string, number> = {};
    nodeIds.forEach((id) => (levels[id] = 0));

    relations.forEach((rel) => {
      if (rel.type === 'Inheritance' || rel.type === 'Implementation') {
        // Child is at lower level than Parent
        const childId = rel.fromNodeId;
        const parentId = rel.toNodeId;
        if (levels[childId] <= levels[parentId]) {
          levels[childId] = levels[parentId] + 1;
        }
      }
    });

    // Group nodes by level
    const levelGroups: Record<number, string[]> = {};
    Object.entries(levels).forEach(([id, lvl]) => {
      if (!levelGroups[lvl]) levelGroups[lvl] = [];
      levelGroups[lvl].push(id);
    });

    // Position each level horizontally
    Object.entries(levelGroups).forEach(([lvlStr, group]) => {
      const lvl = parseInt(lvlStr, 10);
      const startY = 60 + lvl * 220;
      const startX = 80;
      const spacingX = 340;

      group.forEach((nodeId, idx) => {
        if (updated[nodeId]) {
          updated[nodeId].position = {
            x: startX + idx * spacingX,
            y: startY,
          };
        }
      });
    });

    return updated;
  }

  /**
   * 22.3 GoF Design Pattern Synthesizer Generator
   */
  public static generateGoFPattern(
    patternType: 'singleton' | 'factory' | 'repository' | 'strategy' | 'observer',
    baseX: number,
    baseY: number
  ): { newNodes: UMLNode[]; newRelations: UMLRelation[] } {
    const timestamp = Date.now();

    if (patternType === 'singleton') {
      const node: UMLNode = {
        id: `singleton_${timestamp}`,
        type: 'Class',
        name: 'AppConfiguration',
        namespace: 'MyLabApp.Patterns',
        properties: [
          { id: 'sg_p1', visibility: '-', name: '_instance', type: 'Lazy<AppConfiguration>', defaultValue: 'new(() => new AppConfiguration())' },
          { id: 'sg_p2', visibility: '+', name: 'ConnectionString', type: 'string', defaultValue: '"Data Source=app.db"' },
        ],
        methods: [
          { id: 'sg_m1', visibility: '-', name: 'AppConfiguration', returnType: 'void', parameters: [] },
          { id: 'sg_m2', visibility: '+', name: 'Instance', returnType: 'AppConfiguration', parameters: [], existingBody: 'return _instance.Value;' },
        ],
        position: { x: baseX, y: baseY },
        colorTag: '#3b82f6',
      };
      return { newNodes: [node], newRelations: [] };
    }

    if (patternType === 'repository') {
      const interfaceNode: UMLNode = {
        id: `irepo_${timestamp}`,
        type: 'Interface',
        name: 'IRepository<T>',
        namespace: 'MyLabApp.Data',
        properties: [],
        methods: [
          { id: 'ir_m1', visibility: '+', name: 'GetAll', returnType: 'IEnumerable<T>', parameters: [] },
          { id: 'ir_m2', visibility: '+', name: 'GetById', returnType: 'T', parameters: [{ name: 'id', type: 'int' }] },
          { id: 'ir_m3', visibility: '+', name: 'Add', returnType: 'void', parameters: [{ name: 'entity', type: 'T' }] },
        ],
        position: { x: baseX, y: baseY },
        colorTag: '#8b5cf6',
      };

      const implNode: UMLNode = {
        id: `repo_impl_${timestamp}`,
        type: 'Class',
        name: 'SqliteRepository<T>',
        namespace: 'MyLabApp.Data',
        properties: [
          { id: 'sr_p1', visibility: '-', name: '_dbConnection', type: 'IDbConnection' },
        ],
        methods: [
          { id: 'sr_m1', visibility: '+', name: 'GetAll', returnType: 'IEnumerable<T>', parameters: [], existingBody: 'return _dbConnection.Query<T>($"SELECT * FROM {typeof(T).Name}");' },
          { id: 'sr_m2', visibility: '+', name: 'GetById', returnType: 'T', parameters: [{ name: 'id', type: 'int' }], existingBody: 'return _dbConnection.QueryFirstOrDefault<T>($"SELECT * FROM {typeof(T).Name} WHERE Id=@id", new { id });' },
          { id: 'sr_m3', visibility: '+', name: 'Add', returnType: 'void', parameters: [{ name: 'entity', type: 'T' }], existingBody: '// Insert record into SQLite' },
        ],
        position: { x: baseX, y: baseY + 220 },
        colorTag: '#10b981',
      };

      const relation: UMLRelation = {
        id: `rel_repo_${timestamp}`,
        fromNodeId: implNode.id,
        toNodeId: interfaceNode.id,
        type: 'Implementation',
        label: ': IRepository<T>',
      };

      return { newNodes: [interfaceNode, implNode], newRelations: [relation] };
    }

    if (patternType === 'factory') {
      const productInterface: UMLNode = {
        id: `iprod_${timestamp}`,
        type: 'Interface',
        name: 'INotificationService',
        namespace: 'MyLabApp.Services',
        properties: [],
        methods: [
          { id: 'ip_m1', visibility: '+', name: 'Send', returnType: 'void', parameters: [{ name: 'message', type: 'string' }] },
        ],
        position: { x: baseX, y: baseY },
        colorTag: '#8b5cf6',
      };

      const factoryClass: UMLNode = {
        id: `factory_${timestamp}`,
        type: 'Class',
        name: 'NotificationFactory',
        namespace: 'MyLabApp.Services',
        properties: [],
        methods: [
          { id: 'fc_m1', visibility: '+', name: 'CreateService', returnType: 'INotificationService', parameters: [{ name: 'channel', type: 'string' }], existingBody: 'return channel.ToLower() switch {\n    "email" => new EmailService(),\n    _ => new SmsService()\n};' },
        ],
        position: { x: baseX + 340, y: baseY },
        colorTag: '#f59e0b',
      };

      return { newNodes: [productInterface, factoryClass], newRelations: [] };
    }

    if (patternType === 'strategy') {
      const strategyInterface: UMLNode = {
        id: `istrat_${timestamp}`,
        type: 'Interface',
        name: 'IDiscountStrategy',
        namespace: 'MyLabApp.Strategies',
        properties: [],
        methods: [
          { id: 'st_m1', visibility: '+', name: 'ApplyDiscount', returnType: 'double', parameters: [{ name: 'amount', type: 'double' }] },
        ],
        position: { x: baseX, y: baseY },
        colorTag: '#8b5cf6',
      };

      const concreteStrategy: UMLNode = {
        id: `strat_impl_${timestamp}`,
        type: 'Class',
        name: 'StudentDiscountStrategy',
        namespace: 'MyLabApp.Strategies',
        properties: [],
        methods: [
          { id: 'st_m2', visibility: '+', name: 'ApplyDiscount', returnType: 'double', parameters: [{ name: 'amount', type: 'double' }], existingBody: 'return amount * 0.85; // 15% студентческая скидка' },
        ],
        position: { x: baseX, y: baseY + 200 },
        colorTag: '#10b981',
      };

      const rel: UMLRelation = {
        id: `rel_strat_${timestamp}`,
        fromNodeId: concreteStrategy.id,
        toNodeId: strategyInterface.id,
        type: 'Implementation',
      };

      return { newNodes: [strategyInterface, concreteStrategy], newRelations: [rel] };
    }

    // Default Observer pattern
    const observerInterface: UMLNode = {
      id: `iobs_${timestamp}`,
      type: 'Interface',
      name: 'IObserver',
      namespace: 'MyLabApp.Observer',
      properties: [],
      methods: [
        { id: 'ob_m1', visibility: '+', name: 'Update', returnType: 'void', parameters: [{ name: 'state', type: 'string' }] },
      ],
      position: { x: baseX, y: baseY },
      colorTag: '#8b5cf6',
    };

    return { newNodes: [observerInterface], newRelations: [] };
  }
}
