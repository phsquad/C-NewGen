/**
 * C# Interactive Code Folding Engine for Monaco Editor
 * Accurately detects and calculates collapsible ranges for:
 * - Namespaces (namespace Foo { ... })
 * - Classes, Structs, Interfaces, Records
 * - Methods, Constructors, and Event Handlers
 * - #region ... #endregion blocks (e.g. Windows Form Designer generated code)
 * - Using directives block (using System; ...)
 * - XML Documentation and Block comments
 * - General multi-line braced blocks
 */

export interface CSharpFoldingBlock {
  start: number; // 1-based start line
  end: number;   // 1-based end line
  kind?: 'comment' | 'imports' | 'region';
  category: 'namespace' | 'class' | 'method' | 'region' | 'imports' | 'comment' | 'block';
  label: string;
}

export class CSharpFoldingEngine {
  /**
   * Parse C# source code and compute all folding ranges
   */
  public static computeFoldingRanges(code: string): CSharpFoldingBlock[] {
    const lines = code.split('\n');
    const ranges: CSharpFoldingBlock[] = [];

    // 1. Detect Top-Level Using Directives
    let usingStart = -1;
    let usingEnd = -1;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('using ') && trimmed.endsWith(';')) {
        if (usingStart === -1) usingStart = i + 1;
        usingEnd = i + 1;
      } else if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
        // Stop checking imports once code or namespace begins
        break;
      }
    }
    if (usingStart !== -1 && usingEnd > usingStart) {
      ranges.push({
        start: usingStart,
        end: usingEnd,
        kind: 'imports',
        category: 'imports',
        label: 'using ...',
      });
    }

    // 2. Detect #region ... #endregion blocks (supporting arbitrary nesting)
    const regionStack: { line: number; name: string }[] = [];
    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const trimmed = lines[i].trim();

      if (trimmed.startsWith('#region')) {
        const regionName = trimmed.replace(/^#region\s*/, '').trim() || 'Region';
        regionStack.push({ line: lineNum, name: regionName });
      } else if (trimmed.startsWith('#endregion')) {
        const top = regionStack.pop();
        if (top && lineNum > top.line) {
          ranges.push({
            start: top.line,
            end: lineNum,
            kind: 'region',
            category: 'region',
            label: top.name,
          });
        }
      }
    }

    // 3. Detect Multi-line Block Comments and XML Comments
    let inBlockComment = false;
    let blockCommentStart = -1;
    let xmlCommentStart = -1;
    let xmlCommentEnd = -1;

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const trimmed = lines[i].trim();

      // Block comment /* ... */
      if (!inBlockComment && trimmed.includes('/*')) {
        inBlockComment = true;
        blockCommentStart = lineNum;
      }
      if (inBlockComment && trimmed.includes('*/')) {
        inBlockComment = false;
        if (lineNum > blockCommentStart) {
          ranges.push({
            start: blockCommentStart,
            end: lineNum,
            kind: 'comment',
            category: 'comment',
            label: '/* ... */',
          });
        }
      }

      // XML Doc comment /// ...
      if (trimmed.startsWith('///')) {
        if (xmlCommentStart === -1) xmlCommentStart = lineNum;
        xmlCommentEnd = lineNum;
      } else {
        if (xmlCommentStart !== -1 && xmlCommentEnd > xmlCommentStart) {
          ranges.push({
            start: xmlCommentStart,
            end: xmlCommentEnd,
            kind: 'comment',
            category: 'comment',
            label: '/// <summary> ...',
          });
        }
        xmlCommentStart = -1;
        xmlCommentEnd = -1;
      }
    }
    // Flush trailing XML comment
    if (xmlCommentStart !== -1 && xmlCommentEnd > xmlCommentStart) {
      ranges.push({
        start: xmlCommentStart,
        end: xmlCommentEnd,
        kind: 'comment',
        category: 'comment',
        label: '/// <summary> ...',
      });
    }

    // 4. Token-aware Brace Matching for Namespaces, Classes, Structs, Methods, and Blocks
    // We ignore braces inside strings and comments
    interface BraceTarget {
      startLine: number;
      category: 'namespace' | 'class' | 'method' | 'block';
      label: string;
    }

    const braceStack: BraceTarget[] = [];

    // Helper regexes
    const namespaceRegex = /\bnamespace\s+([a-zA-Z0-9_.]+)/;
    const classRegex = /\b(class|struct|interface|record)\s+([a-zA-Z0-9_]+)/;
    const methodRegex = /(?:public|private|protected|internal|static|async|override|virtual|abstract|partial|\s)+\s+([a-zA-Z0-9_<>\[\]?,]+)\s+([a-zA-Z0-9_]+)\s*(?:<[^>]+>)?\s*\(/;
    const ctorRegex = /(?:public|private|protected|internal)\s+([a-zA-Z0-9_]+)\s*\(/;

    // Scan lines to find header definitions associated with upcoming '{'
    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];

      // Parse characters on this line while respecting string literals and comments
      let inString = false;
      let stringChar = '';
      let isVerbatim = false;
      let isInterpolated = false;

      // Find leading definition on this line if any
      let pendingCategory: 'namespace' | 'class' | 'method' | 'block' = 'block';
      let pendingLabel = '';

      const trimmed = line.trim();
      const nsMatch = trimmed.match(namespaceRegex);
      const classMatch = trimmed.match(classRegex);
      const ctorMatch = trimmed.match(ctorRegex);
      const methodMatch = trimmed.match(methodRegex);

      if (nsMatch) {
        pendingCategory = 'namespace';
        pendingLabel = `namespace ${nsMatch[1]}`;
      } else if (classMatch) {
        pendingCategory = 'class';
        pendingLabel = `${classMatch[1]} ${classMatch[2]}`;
      } else if (ctorMatch && !ctorMatch[1].match(/^(if|for|while|switch|catch)$/)) {
        pendingCategory = 'method';
        pendingLabel = `${ctorMatch[1]}() constructor`;
      } else if (methodMatch && !methodMatch[2].match(/^(if|for|while|switch|catch)$/)) {
        pendingCategory = 'method';
        pendingLabel = `${methodMatch[2]}() method`;
      }

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const prevChar = j > 0 ? line[j - 1] : '';
        const nextChar = j < line.length - 1 ? line[j + 1] : '';

        // Check for line comments
        if (!inString && char === '/' && nextChar === '/') {
          break; // Rest of line is comment
        }

        // Check for string boundaries
        if (!inString && (char === '"' || char === "'")) {
          inString = true;
          stringChar = char;
          isVerbatim = prevChar === '@';
          isInterpolated = prevChar === '$' || (j > 1 && line[j - 2] === '$');
          continue;
        } else if (inString && char === stringChar) {
          if (isVerbatim && nextChar === '"') {
            j++; // Escaped quote in verbatim string
            continue;
          }
          if (prevChar !== '\\' || (prevChar === '\\' && j > 1 && line[j - 2] === '\\')) {
            inString = false;
            continue;
          }
        }

        if (inString) {
          continue;
        }

        // Match Open Brace '{'
        if (char === '{') {
          // Look backwards for multi-line method/class declarations if pendingLabel was empty
          let category = pendingCategory;
          let label = pendingLabel;

          if (category === 'block' && i > 0) {
            // Check preceding 1-3 lines for definition
            for (let k = i - 1; k >= Math.max(0, i - 3); k--) {
              const prevTrimmed = lines[k].trim();
              const prevNs = prevTrimmed.match(namespaceRegex);
              const prevClass = prevTrimmed.match(classRegex);
              const prevCtor = prevTrimmed.match(ctorRegex);
              const prevMethod = prevTrimmed.match(methodRegex);

              if (prevNs) {
                category = 'namespace';
                label = `namespace ${prevNs[1]}`;
                break;
              } else if (prevClass) {
                category = 'class';
                label = `${prevClass[1]} ${prevClass[2]}`;
                break;
              } else if (prevCtor && !prevCtor[1].match(/^(if|for|while|switch|catch)$/)) {
                category = 'method';
                label = `${prevCtor[1]}() constructor`;
                break;
              } else if (prevMethod && !prevMethod[2].match(/^(if|for|while|switch|catch)$/)) {
                category = 'method';
                label = `${prevMethod[2]}() method`;
                break;
              }
            }
          }

          braceStack.push({
            startLine: lineNum,
            category,
            label: label || '{ ... }',
          });
          // Reset pending for subsequent braces on same line
          pendingCategory = 'block';
          pendingLabel = '';
        }

        // Match Closing Brace '}'
        if (char === '}') {
          const top = braceStack.pop();
          if (top && lineNum > top.startLine) {
            ranges.push({
              start: top.startLine,
              end: lineNum,
              category: top.category,
              label: top.label,
            });
          }
        }
      }
    }

    // Sort ranges ascending by start line
    return ranges.sort((a, b) => a.start - b.start || b.end - a.end);
  }

  /**
   * Register custom C# FoldingRangeProvider in Monaco
   */
  public static registerMonacoFoldingProvider(monaco: any): { dispose: () => void } {
    try {
      const disposable = monaco.languages.registerFoldingRangeProvider('csharp', {
        provideFoldingRanges: (model: any) => {
          const code = model.getValue();
          const blocks = CSharpFoldingEngine.computeFoldingRanges(code);

          const monacoRanges = blocks.map(b => {
            let kind: any;
            if (b.kind === 'comment') {
              kind = monaco.languages.FoldingRangeKind.Comment;
            } else if (b.kind === 'imports') {
              kind = monaco.languages.FoldingRangeKind.Imports;
            } else if (b.kind === 'region') {
              kind = monaco.languages.FoldingRangeKind.Region;
            }

            return {
              start: b.start,
              end: b.end,
              kind,
            };
          });

          return monacoRanges;
        },
      });

      return disposable;
    } catch (e) {
      console.warn('Monaco C# Folding Provider registration error:', e);
      return { dispose: () => {} };
    }
  }

  /**
   * Target specific line folding via Monaco editor
   */
  public static foldTargetLines(editor: any, targetLines: number[], fold = true): void {
    if (!editor || targetLines.length === 0) return;

    try {
      const originalPos = editor.getPosition();
      const selections = targetLines.map(line => ({
        selectionStartLineNumber: line,
        selectionStartColumn: 1,
        positionLineNumber: line,
        positionColumn: 1,
      }));

      editor.setSelections(selections);
      const actionName = fold ? 'editor.fold' : 'editor.unfold';
      editor.getAction(actionName)?.run();

      if (originalPos) {
        editor.setPosition(originalPos);
      }
    } catch (err) {
      console.warn('Error executing folding action:', err);
    }
  }
}
