/**
 * C# Import Organizer (Organize Usings / Missing References Analyzer)
 * Microsoft Roslyn & Visual Studio standard:
 * 1. Scans code for unresolved / referenced types and detects missing 'using' directives
 * 2. Identifies unused 'using' directives in the active file
 * 3. Sorts and cleans 'using' statements according to Microsoft standard conventions:
 *    - System namespaces first (alphabetical)
 *    - Microsoft namespaces second (alphabetical)
 *    - 3rd-party and custom project namespaces (alphabetical)
 * 4. Provides atomic code actions and full file organizing
 */

export interface MissingReference {
  symbol: string;
  namespace: string;
  line: number;
  description: string;
}

export interface OrganizeResult {
  originalCode: string;
  organizedCode: string;
  addedUsings: string[];
  removedUsings: string[];
  allUsings: string[];
  missingReferences: MissingReference[];
  hasChanges: boolean;
  summary: string;
}

interface TypeNamespaceMapping {
  namespace: string;
  types: string[];
  methodSignatures?: string[];
  regex?: RegExp;
}

export class CSharpImportOrganizer {
  // Database of common .NET BCL & Framework Types mapped to their defining namespace
  private static TYPE_REGISTRY: TypeNamespaceMapping[] = [
    {
      namespace: 'System',
      types: [
        'Console', 'Math', 'DateTime', 'DateTimeOffset', 'TimeSpan', 'Guid',
        'Random', 'Uri', 'Environment', 'Convert', 'Byte', 'SByte', 'Int16',
        'Int32', 'Int64', 'UInt16', 'UInt32', 'UInt64', 'Single', 'Double',
        'Decimal', 'String', 'Boolean', 'Char', 'Object', 'Exception',
        'ArgumentException', 'ArgumentNullException', 'ArgumentOutOfRangeException',
        'InvalidOperationException', 'NotSupportedException', 'NotImplementedException',
        'NullReferenceException', 'IndexOutOfRangeException', 'FormatException',
        'EventHandler', 'EventArgs', 'Action', 'Func', 'Predicate', 'IDisposable'
      ],
    },
    {
      namespace: 'System.Collections.Generic',
      types: [
        'List', 'Dictionary', 'HashSet', 'Queue', 'Stack', 'LinkedList',
        'SortedDictionary', 'SortedList', 'SortedSet', 'KeyValuePair',
        'IEnumerable', 'ICollection', 'IList', 'IDictionary', 'ISet',
        'IReadOnlyList', 'IReadOnlyCollection', 'IReadOnlyDictionary',
        'IComparer', 'IEqualityComparer'
      ],
    },
    {
      namespace: 'System.Collections',
      types: ['ArrayList', 'Hashtable', 'BitArray', 'IEnumerator'],
    },
    {
      namespace: 'System.Collections.ObjectModel',
      types: ['ObservableCollection', 'ReadOnlyCollection', 'KeyedCollection'],
    },
    {
      namespace: 'System.ComponentModel',
      types: [
        'INotifyPropertyChanged', 'PropertyChangedEventHandler', 'PropertyChangedEventArgs',
        'Component', 'IContainer', 'BackgroundWorker', 'CancelEventArgs',
        'BindingList', 'DisplayNameAttribute', 'DefaultValueAttribute'
      ],
    },
    {
      namespace: 'System.Data',
      types: [
        'DataTable', 'DataSet', 'DataRow', 'DataColumn', 'DataView',
        'DbCommand', 'DbConnection', 'DbDataReader', 'IDbConnection',
        'IDbCommand', 'IDataReader', 'IsolationLevel', 'CommandType',
        'Constraint', 'ForeignKeyConstraint', 'UniqueConstraint'
      ],
    },
    {
      namespace: 'System.Diagnostics',
      types: [
        'Stopwatch', 'Process', 'ProcessStartInfo', 'Debug', 'Trace',
        'FileVersionInfo', 'StackTrace', 'StackFrame', 'PerformanceCounter'
      ],
    },
    {
      namespace: 'System.Drawing',
      types: [
        'Color', 'Font', 'FontFamily', 'FontStyle', 'GraphicsUnit',
        'Bitmap', 'Image', 'Graphics', 'Pen', 'Pens', 'Brush', 'Brushes',
        'SolidBrush', 'TextureBrush', 'LinearGradientBrush', 'Point',
        'PointF', 'Size', 'SizeF', 'Rectangle', 'RectangleF', 'Icon',
        'SystemColors', 'KnownColor'
      ],
    },
    {
      namespace: 'System.Globalization',
      types: ['CultureInfo', 'NumberStyles', 'DateTimeStyles', 'TextInfo', 'RegionInfo'],
    },
    {
      namespace: 'System.IO',
      types: [
        'File', 'Directory', 'Path', 'Stream', 'FileStream', 'MemoryStream',
        'StreamReader', 'StreamWriter', 'BinaryReader', 'BinaryWriter',
        'FileInfo', 'DirectoryInfo', 'DriveInfo', 'SeekOrigin', 'FileMode',
        'FileAccess', 'FileShare', 'BufferedStream', 'StringReader', 'StringWriter'
      ],
    },
    {
      namespace: 'System.Linq',
      types: ['Enumerable', 'IQueryable', 'Queryable'],
      // Standard LINQ extension methods on collections
      methodSignatures: [
        'Where', 'Select', 'OrderBy', 'OrderByDescending', 'ThenBy', 'ThenByDescending',
        'GroupBy', 'FirstOrDefault', 'LastOrDefault', 'SingleOrDefault', 'Any',
        'All', 'Count', 'Sum', 'Average', 'Min', 'Max', 'Distinct', 'ToList',
        'ToArray', 'ToDictionary', 'Take', 'Skip', 'Concat', 'Union', 'Intersect'
      ],
    },
    {
      namespace: 'System.Net.Http',
      types: [
        'HttpClient', 'HttpRequestMessage', 'HttpResponseMessage', 'HttpContent',
        'StringContent', 'ByteArrayContent', 'StreamContent', 'HttpMethod',
        'HttpStatusCode', 'SocketsHttpHandler', 'HttpClientHandler'
      ],
    },
    {
      namespace: 'System.Net',
      types: ['IPAddress', 'IPEndPoint', 'Dns', 'WebClient', 'NetworkCredential', 'Cookie', 'Socket'],
    },
    {
      namespace: 'System.Reflection',
      types: [
        'Assembly', 'TypeInfo', 'MethodInfo', 'PropertyInfo', 'FieldInfo',
        'ConstructorInfo', 'ParameterInfo', 'BindingFlags', 'MemberInfo'
      ],
    },
    {
      namespace: 'System.Text',
      types: ['StringBuilder', 'Encoding', 'Decoder', 'Encoder', 'ASCIIEncoding', 'UTF8Encoding'],
    },
    {
      namespace: 'System.Text.Json',
      types: [
        'JsonSerializer', 'JsonDocument', 'JsonElement', 'JsonProperty',
        'JsonSerializerOptions', 'JsonNamingPolicy', 'Utf8JsonWriter', 'Utf8JsonReader'
      ],
    },
    {
      namespace: 'System.Text.RegularExpressions',
      types: ['Regex', 'Match', 'MatchCollection', 'Capture', 'RegexOptions', 'Group', 'RegexMatchTimeoutException'],
    },
    {
      namespace: 'System.Threading',
      types: [
        'Thread', 'ThreadStart', 'ParameterizedThreadStart', 'Monitor', 'Mutex',
        'Semaphore', 'AutoResetEvent', 'ManualResetEvent', 'Interlocked',
        'Timeout', 'Timer', 'WaitHandle'
      ],
    },
    {
      namespace: 'System.Threading.Tasks',
      types: [
        'Task', 'TaskCompletionSource', 'ValueTask', 'Parallel',
        'CancellationToken', 'CancellationTokenSource', 'ParallelLoopResult'
      ],
    },
    {
      namespace: 'System.Windows.Forms',
      types: [
        'Form', 'Button', 'TextBox', 'Label', 'CheckBox', 'RadioButton',
        'ComboBox', 'ListBox', 'CheckedListBox', 'ListView', 'TreeView',
        'ProgressBar', 'NumericUpDown', 'DateTimePicker', 'MonthCalendar',
        'PictureBox', 'Panel', 'FlowLayoutPanel', 'TableLayoutPanel',
        'SplitContainer', 'GroupBox', 'TabControl', 'TabPage', 'DataGridView',
        'DataGridViewColumn', 'DataGridViewRow', 'DataGridViewCell',
        'MenuStrip', 'ContextMenuStrip', 'ToolStrip', 'StatusStrip',
        'ToolStripButton', 'ToolStripMenuItem', 'ToolStripLabel',
        'ToolTip', 'Timer', 'MessageBox', 'MessageBoxButtons', 'MessageBoxIcon',
        'DialogResult', 'AnchorStyles', 'DockStyle', 'ScrollBars',
        'HorizontalAlignment', 'KeyEventArgs', 'MouseEventArgs', 'PaintEventArgs',
        'Application', 'Control', 'UserControl', 'Cursor', 'Cursors',
        'FolderBrowserDialog', 'OpenFileDialog', 'SaveFileDialog', 'ColorDialog'
      ],
    },
    {
      namespace: 'System.Xml',
      types: ['XmlDocument', 'XmlElement', 'XmlNode', 'XmlReader', 'XmlWriter', 'XmlAttribute'],
    },
    {
      namespace: 'System.Xml.Linq',
      types: ['XDocument', 'XElement', 'XAttribute', 'XNamespace', 'XNode'],
    },
    {
      namespace: 'Microsoft.Data.Sqlite',
      types: ['SqliteConnection', 'SqliteCommand', 'SqliteDataReader', 'SqliteParameter'],
    },
    {
      namespace: 'Microsoft.Win32',
      types: ['Registry', 'RegistryKey', 'RegistryValueKind'],
    },
  ];

  /**
   * Extract existing 'using' statements from C# source code
   */
  public static extractExistingUsings(code: string): { namespace: string; fullLine: string; lineNumber: number }[] {
    const lines = code.split('\n');
    const usings: { namespace: string; fullLine: string; lineNumber: number }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Stop once we hit namespace or class or outside comments
      if (
        trimmed.startsWith('namespace ') ||
        trimmed.startsWith('public ') ||
        trimmed.startsWith('internal ') ||
        trimmed.startsWith('class ')
      ) {
        break;
      }

      // Match 'using Name.Space;' (ignore alias or static using for simple collection)
      const match = trimmed.match(/^using\s+([a-zA-Z0-9_.]+)\s*;$/);
      if (match) {
        usings.push({
          namespace: match[1],
          fullLine: trimmed,
          lineNumber: i + 1,
        });
      }
    }

    return usings;
  }

  /**
   * Detect missing references in C# code that require 'using' directives
   */
  public static detectMissingReferences(code: string): MissingReference[] {
    const existing = new Set(this.extractExistingUsings(code).map(u => u.namespace));
    const missing: MissingReference[] = [];
    const detectedNamespaces = new Set<string>();

    const lines = code.split('\n');

    // Strip comments and strings for accurate token checking
    const sanitizedCode = code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
      .replace(/"(?:[^"\\]|\\.)*"/g, '""');

    for (const reg of this.TYPE_REGISTRY) {
      if (existing.has(reg.namespace) || detectedNamespaces.has(reg.namespace)) {
        continue; // Already included
      }

      // 1. Check for type names with boundary checks: e.g. \bRegex\b, \bList\b
      let foundSymbol: string | null = null;
      let symbolLine = 1;

      for (const typeName of reg.types) {
        const regex = new RegExp(`\\b${typeName}\\b`, 'g');
        if (regex.test(sanitizedCode)) {
          foundSymbol = typeName;
          // Find first line number
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(typeName) && !lines[i].trim().startsWith('using ')) {
              symbolLine = i + 1;
              break;
            }
          }
          break;
        }
      }

      // 2. Check for LINQ extension methods if not matched by type
      if (!foundSymbol && reg.methodSignatures) {
        for (const method of reg.methodSignatures) {
          const regex = new RegExp(`\\.${method}\\s*(?:<[^>]+>)?\\s*\\(`, 'g');
          if (regex.test(sanitizedCode)) {
            foundSymbol = `.${method}()`;
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes(`.${method}(`)) {
                symbolLine = i + 1;
                break;
              }
            }
            break;
          }
        }
      }

      if (foundSymbol) {
        detectedNamespaces.add(reg.namespace);
        missing.push({
          symbol: foundSymbol,
          namespace: reg.namespace,
          line: symbolLine,
          description: `Использование '${foundSymbol}' требует подключения пространства имен '${reg.namespace}'`,
        });
      }
    }

    return missing;
  }

  /**
   * Detect unused 'using' directives in the C# file
   */
  public static detectUnusedUsings(code: string): string[] {
    const existing = this.extractExistingUsings(code);
    if (existing.length === 0) return [];

    const lines = code.split('\n');
    // Remove all using lines to get code body
    const bodyCode = lines
      .filter(l => !l.trim().startsWith('using '))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '');

    const unused: string[] = [];

    // Always preserve essential foundation usings if WinForms is detected
    const isWinFormsFile = code.includes(': Form') || code.includes('InitializeComponent') || code.includes('Windows.Forms');

    for (const item of existing) {
      const ns = item.namespace;

      // Essential protected namespaces
      if (ns === 'System' || (isWinFormsFile && (ns === 'System.Drawing' || ns === 'System.Windows.Forms'))) {
        continue;
      }

      // Check registry types
      const mapping = this.TYPE_REGISTRY.find(r => r.namespace === ns);
      let isReferenced = false;

      if (mapping) {
        for (const typeName of mapping.types) {
          const regex = new RegExp(`\\b${typeName}\\b`);
          if (regex.test(bodyCode)) {
            isReferenced = true;
            break;
          }
        }

        if (!isReferenced && mapping.methodSignatures) {
          for (const method of mapping.methodSignatures) {
            const regex = new RegExp(`\\.${method}\\s*(?:<[^>]+>)?\\s*\\(`);
            if (regex.test(bodyCode)) {
              isReferenced = true;
              break;
            }
          }
        }
      } else {
        // Unknown namespace: check if the last token or full name is referenced
        const lastPart = ns.split('.').pop() || ns;
        const regex = new RegExp(`\\b${lastPart}\\b`);
        isReferenced = regex.test(bodyCode);
      }

      if (!isReferenced) {
        unused.push(ns);
      }
    }

    return unused;
  }

  /**
   * Sort usings alphabetically with System.* first, Microsoft.* second, and others third
   */
  public static sortUsings(namespaces: string[]): string[] {
    const unique = Array.from(new Set(namespaces));

    return unique.sort((a, b) => {
      const isSysA = a === 'System' || a.startsWith('System.');
      const isSysB = b === 'System' || b.startsWith('System.');
      const isMsA = a.startsWith('Microsoft.');
      const isMsB = b.startsWith('Microsoft.');

      if (isSysA && !isSysB) return -1;
      if (!isSysA && isSysB) return 1;

      if (isMsA && !isMsB) return -1;
      if (!isMsA && isMsB) return 1;

      // System always before System.*
      if (a === 'System') return -1;
      if (b === 'System') return 1;

      return a.localeCompare(b);
    });
  }

  /**
   * Perform complete Organize Imports (Add missing, Remove unused, Sort & Clean)
   */
  public static organize(code: string, options: { removeUnused?: boolean; addMissing?: boolean } = {}): OrganizeResult {
    const removeUnused = options.removeUnused !== false;
    const addMissing = options.addMissing !== false;

    const existingUsings = this.extractExistingUsings(code).map(u => u.namespace);
    const missingReferences = addMissing ? this.detectMissingReferences(code) : [];
    const unusedUsings = removeUnused ? this.detectUnusedUsings(code) : [];

    const addedUsings: string[] = missingReferences.map(m => m.namespace);
    const removedUsings: string[] = unusedUsings;

    // Build target namespaces list
    let targetNamespaces = [...existingUsings];

    // Remove unused
    if (removeUnused && removedUsings.length > 0) {
      const removeSet = new Set(removedUsings);
      targetNamespaces = targetNamespaces.filter(ns => !removeSet.has(ns));
    }

    // Add missing
    if (addMissing && addedUsings.length > 0) {
      for (const added of addedUsings) {
        if (!targetNamespaces.includes(added)) {
          targetNamespaces.push(added);
        }
      }
    }

    // Always ensure System is present if any System types are used
    if (!targetNamespaces.includes('System')) {
      targetNamespaces.unshift('System');
    }

    // Sort according to Roslyn conventions
    const sorted = this.sortUsings(targetNamespaces);

    // Reconstruct file code
    const lines = code.split('\n');
    let firstUsingIdx = -1;
    let lastUsingIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('using ') && trimmed.endsWith(';')) {
        if (firstUsingIdx === -1) firstUsingIdx = i;
        lastUsingIdx = i;
      } else if (firstUsingIdx !== -1 && trimmed && !trimmed.startsWith('//')) {
        break;
      }
    }

    const formattedUsingBlock = sorted.map(ns => `using ${ns};`).join('\n');
    let organizedCode: string;

    if (firstUsingIdx !== -1 && lastUsingIdx !== -1) {
      // Replace existing using block
      const before = lines.slice(0, firstUsingIdx);
      // Skip empty line immediately after usings if present
      let afterIdx = lastUsingIdx + 1;
      while (afterIdx < lines.length && lines[afterIdx].trim() === '') {
        afterIdx++;
      }
      const after = lines.slice(afterIdx);

      const beforeText = before.length > 0 ? before.join('\n') + '\n' : '';
      organizedCode = `${beforeText}${formattedUsingBlock}\n\n${after.join('\n')}`;
    } else {
      // No existing using statements found, prepend at top
      organizedCode = `${formattedUsingBlock}\n\n${code}`;
    }

    const hasChanges = organizedCode !== code;

    const parts: string[] = [];
    if (addedUsings.length > 0) {
      parts.push(`Добавлено ${addedUsings.length} missing using (${addedUsings.join(', ')})`);
    }
    if (removedUsings.length > 0) {
      parts.push(`Удалено ${removedUsings.length} неиспользуемых (${removedUsings.join(', ')})`);
    }
    if (hasChanges && addedUsings.length === 0 && removedUsings.length === 0) {
      parts.push('Упорядочены директивы using по стандарту Microsoft');
    }
    if (!hasChanges) {
      parts.push('Все директивы using актуальны и упорядочены');
    }

    return {
      originalCode: code,
      organizedCode,
      addedUsings,
      removedUsings,
      allUsings: sorted,
      missingReferences,
      hasChanges,
      summary: parts.join(' • '),
    };
  }

  /**
   * Register Monaco Editor CodeActionProvider for automatic Quick Fix suggestions
   */
  public static registerMonacoCodeActionProvider(monaco: any): { dispose: () => void } {
    try {
      const disposable = monaco.languages.registerCodeActionProvider('csharp', {
        provideCodeActions: (model: any, range: any) => {
          const code = model.getValue();
          const missingRefs = CSharpImportOrganizer.detectMissingReferences(code);
          const currentLine = range.startLineNumber;

          const actions: any[] = [];

          // 1. Missing references on/near current line
          const relevantMissing = missingRefs.filter(m => Math.abs(m.line - currentLine) <= 3);
          const targetRefs = relevantMissing.length > 0 ? relevantMissing : missingRefs.slice(0, 3);

          targetRefs.forEach(missing => {
            actions.push({
              title: `💡 using ${missing.namespace}; (для '${missing.symbol}')`,
              kind: 'quickfix',
              isPreferred: true,
              edit: {
                edits: [
                  {
                    resource: model.uri,
                    textEdit: {
                      range: new monaco.Range(1, 1, 1, 1),
                      text: `using ${missing.namespace};\n`,
                    },
                  },
                ],
              },
            });
          });

          // 2. Full "Organize Usings" Action (Shift+Alt+O)
          actions.push({
            title: `🧹 Организовать using (Organize Usings: удалить лишние, добавить недостающие, отсортировать)`,
            kind: 'source.organizeImports',
            command: {
              id: 'csharp.organizeImports',
              title: 'Organize Usings',
            },
          });

          return {
            actions,
            dispose: () => {},
          };
        },
      });

      return disposable;
    } catch (e) {
      console.warn('Monaco CodeActionProvider error:', e);
      return { dispose: () => {} };
    }
  }
}
