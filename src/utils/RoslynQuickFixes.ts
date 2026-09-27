export interface QuickFixItem {
  id: string;
  codeRule: string; // e.g. "CA1829", "IDE0058", "IDE0071"
  title: string;
  description: string;
  line: number;
  category: 'Modern C#' | 'Performance' | 'Safety' | 'Style' | 'Refactoring';
  beforeSnippet: string;
  afterSnippet: string;
  apply: (code: string) => string;
}

export class RoslynQuickFixes {
  /**
   * Scans C# source code for deterministic Roslyn Analyzer opportunities and quick fixes
   */
  public static analyzeCode(csharpCode: string, currentLine?: number): QuickFixItem[] {
    const fixes: QuickFixItem[] = [];
    const lines = csharpCode.split('\n');

    lines.forEach((lineText, lineIdx) => {
      const lineNum = lineIdx + 1;
      const trimmed = lineText.trim();

      // 1. Convert string concatenation to string interpolation (IDE0071)
      // e.g. "Total: " + sum + " items"
      const stringConcatRegex = /"[^"]*"\s*\+\s*([a-zA-Z0-9_.]+|\([^\)]+\))/;
      if (stringConcatRegex.test(trimmed) && !trimmed.startsWith('//')) {
        fixes.push({
          id: `fix-string-interpolation-${lineNum}`,
          codeRule: 'IDE0071',
          title: 'Использовать интерполяцию строк ($"...") вместо конкатенации (+)',
          description: 'Упрощает синтаксис и повышает производительность выделения памяти.',
          line: lineNum,
          category: 'Modern C#',
          beforeSnippet: trimmed,
          afterSnippet: trimmed.replace(/"([^"]*)"\s*\+\s*([a-zA-Z0-9_]+)/g, '$$"$1{$2}"'),
          apply: (code: string) => {
            const lns = code.split('\n');
            if (lns[lineIdx]) {
              lns[lineIdx] = lns[lineIdx].replace(/"([^"]*)"\s*\+\s*([a-zA-Z0-9_]+)/g, '$$"$1{$2}"');
            }
            return lns.join('\n');
          },
        });
      }

      // 2. Pattern Matching 'is' instead of 'as' + null check (IDE0019)
      // e.g. var btn = sender as Button; if (btn != null)
      if (trimmed.includes(' as ') && !trimmed.startsWith('//')) {
        const asMatch = trimmed.match(/(?:var|auto|\w+)\s+([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_]+)\s+as\s+([a-zA-Z0-9_]+);/);
        if (asMatch) {
          const varName = asMatch[1];
          const srcVar = asMatch[2];
          const targetType = asMatch[3];
          fixes.push({
            id: `fix-pattern-match-${lineNum}`,
            codeRule: 'IDE0019',
            title: `Использовать сопоставление с образцом: 'if (${srcVar} is ${targetType} ${varName})'`,
            description: 'Безопасное приведение типов C# 8+ без промежуточного null-состояния.',
            line: lineNum,
            category: 'Safety',
            beforeSnippet: trimmed,
            afterSnippet: `if (${srcVar} is ${targetType} ${varName})`,
            apply: (code: string) => {
              return code.replace(
                lineText,
                lineText.replace(asMatch[0], `// Pattern match refactored\n            if (${srcVar} is ${targetType} ${varName})`)
              );
            },
          });
        }
      }

      // 3. Simplify LINQ expression (IDE0058 / CA1829)
      // e.g. .Where(x => ...).FirstOrDefault() -> .FirstOrDefault(x => ...)
      if (trimmed.includes('.Where(') && trimmed.includes('.FirstOrDefault()')) {
        fixes.push({
          id: `fix-linq-simplify-${lineNum}`,
          codeRule: 'CA1829',
          title: 'Упростить вызов LINQ (.Where().FirstOrDefault() ➔ .FirstOrDefault(predicate))',
          description: 'Устраняет двойной проход и создание промежуточного итератора IEnumerable.',
          line: lineNum,
          category: 'Performance',
          beforeSnippet: trimmed,
          afterSnippet: trimmed.replace(/\.Where\(([^)]+)\)\.FirstOrDefault\(\)/, '.FirstOrDefault($1)'),
          apply: (code: string) => {
            const lns = code.split('\n');
            lns[lineIdx] = lns[lineIdx].replace(/\.Where\(([^)]+)\)\.FirstOrDefault\(\)/, '.FirstOrDefault($1)');
            return lns.join('\n');
          },
        });
      }

      // 4. Simplify .Count() == 0 to .Any() (CA1827)
      if (trimmed.includes('.Count() == 0') || trimmed.includes('.Count() > 0')) {
        const isZero = trimmed.includes('.Count() == 0');
        fixes.push({
          id: `fix-linq-any-${lineNum}`,
          codeRule: 'CA1827',
          title: isZero ? "Использовать '!collection.Any()' вместо '.Count() == 0'" : "Использовать 'collection.Any()' вместо '.Count() > 0'",
          description: 'Any() завершает проверку на первом же элементе (O(1) вместо полного перебора O(N)).',
          line: lineNum,
          category: 'Performance',
          beforeSnippet: trimmed,
          afterSnippet: isZero ? trimmed.replace(/\.Count\(\)\s*==\s*0/, '.Any() == false') : trimmed.replace(/\.Count\(\)\s*>\s*0/, '.Any()'),
          apply: (code: string) => {
            const lns = code.split('\n');
            lns[lineIdx] = isZero ? lns[lineIdx].replace(/\.Count\(\)\s*==\s*0/, '!$1.Any()') : lns[lineIdx].replace(/\.Count\(\)\s*>\s*0/, '.Any()');
            return lns.join('\n');
          },
        });
      }

      // 5. Add missing null-check / guard clause (CA1062)
      if (trimmed.includes('object sender, EventArgs e') && !trimmed.startsWith('//')) {
        fixes.push({
          id: `fix-guard-clause-${lineNum}`,
          codeRule: 'CA1062',
          title: 'Добавить защитное условие (Guard Clause) ArgumentNullException.ThrowIfNull',
          description: 'Предотвращает NullReferenceException в обработчиках событий.',
          line: lineNum,
          category: 'Safety',
          beforeSnippet: trimmed,
          afterSnippet: `${trimmed}\n            ArgumentNullException.ThrowIfNull(sender);`,
          apply: (code: string) => {
            const lns = code.split('\n');
            const indent = '            ';
            lns.splice(lineIdx + 2, 0, `${indent}ArgumentNullException.ThrowIfNull(sender);`);
            return lns.join('\n');
          },
        });
      }

      // 6. Use Expression-bodied Member (IDE0022)
      // e.g. { return a + b; }
      if (trimmed.startsWith('return ') && trimmed.endsWith(';') && lines[lineIdx - 1]?.trim() === '{' && lines[lineIdx + 1]?.trim() === '}') {
        const returnExpr = trimmed.substring(7, trimmed.length - 1).trim();
        fixes.push({
          id: `fix-expression-body-${lineNum}`,
          codeRule: 'IDE0022',
          title: 'Преобразовать метод в стрелочное тело (=> expression)',
          description: 'Компактный синтаксис C# 7+ для однострочных методов.',
          line: lineNum,
          category: 'Style',
          beforeSnippet: `{\n    return ${returnExpr};\n}`,
          afterSnippet: `=> ${returnExpr};`,
          apply: (code: string) => {
            const lns = code.split('\n');
            lns[lineIdx - 2] = lns[lineIdx - 2] + ` => ${returnExpr};`;
            lns.splice(lineIdx - 1, 3);
            return lns.join('\n');
          },
        });
      }
    });

    // 7. General Roslyn Fix: Add System.Text.Json or System.Linq if missing
    if (!csharpCode.includes('using System.Linq;') && csharpCode.includes('Where(')) {
      fixes.unshift({
        id: 'fix-add-linq-using',
        codeRule: 'CS0246',
        title: 'Добавить директиву using System.Linq;',
        description: 'Подключает пространство имен для методов расширения LINQ.',
        line: 1,
        category: 'Refactoring',
        beforeSnippet: 'using System;',
        afterSnippet: 'using System;\nusing System.Linq;',
        apply: (code: string) => `using System.Linq;\n${code}`,
      });
    }

    if (currentLine !== undefined) {
      // Prioritize fixes on or near the current line
      return fixes.sort((a, b) => {
        const distA = Math.abs(a.line - currentLine);
        const distB = Math.abs(b.line - currentLine);
        return distA - distB;
      });
    }

    return fixes;
  }
}
