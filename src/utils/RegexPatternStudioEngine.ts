export interface RegexMatchDetail {
  index: number;
  length: number;
  value: string;
  groups: {
    index: number;
    name: string;
    value: string;
    start: number;
    end: number;
  }[];
}

export interface RegexPresetPattern {
  id: string;
  name: string;
  category: 'Validation' | 'Data Extraction' | 'Security' | 'Code & Syntax' | 'Web & Networking';
  pattern: string;
  flags: string;
  description: string;
  sampleInput: string;
}

export interface RegexAnalysisResult {
  isValid: boolean;
  errorMessage?: string;
  matches: RegexMatchDetail[];
  matchCount: number;
  executionTimeMs: number;
  replacedText: string;
  csharpSnippet: string;
  explanationTokens: { token: string; type: string; explanation: string }[];
}

export const REGEX_PRESETS: RegexPresetPattern[] = [
  {
    id: 'email',
    name: 'Email Address (RFC 5322)',
    category: 'Validation',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    flags: 'i',
    description: 'Стандартная валидация адресов электронной почты с доменом и TLD.',
    sampleInput: 'alice@domain.com, invalid-email@, dev.lead@company.org',
  },
  {
    id: 'phone-ru',
    name: 'Russian Phone (+7 / 8)',
    category: 'Validation',
    pattern: '^(\\+7|8)[\\s\\-]?\\(?([0-9]{3})\\)?[\\s\\-]?([0-9]{3})[\\s\\-]?([0-9]{2})[\\s\\-]?([0-9]{2})$',
    flags: '',
    description: 'Номера телефонов РФ в форматах +7 (999) 000-00-00, 89990000000.',
    sampleInput: '+7 (999) 123-45-67\n89123456789\n+7 999 888 77 66',
  },
  {
    id: 'ipv4',
    name: 'IPv4 Address with Port',
    category: 'Web & Networking',
    pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?::[0-9]{1,5})?\\b',
    flags: '',
    description: 'IPv4 адреса с опциональным TCP/UDP портом.',
    sampleInput: 'Server 127.0.0.1:8080 connected to 192.168.1.254 and DNS 8.8.8.8',
  },
  {
    id: 'guid',
    name: 'UUID / GUID Format',
    category: 'Data Extraction',
    pattern: '\\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\\b',
    flags: 'i',
    description: '128-битный глобальный уникальный идентификатор (GUID) в C#.',
    sampleInput: 'SessionID: 8a669d91-c467-49dc-893d-c4ed11c29be1 was generated at 10:00.',
  },
  {
    id: 'csharp-prop',
    name: 'C# Auto-Property Signature',
    category: 'Code & Syntax',
    pattern: '(?:public|private|protected|internal)\\s+([a-zA-Z0-9_<>]+)\\s+([a-zA-Z0-9_]+)\\s*\\{\\s*get;\\s*(?:set|init);\\s*\\}',
    flags: 'g',
    description: 'Обнаружение авто-свойств в коде C# с захватом типа и имени.',
    sampleInput: 'public string UserName { get; set; }\nprivate int Age { get; init; }',
  },
  {
    id: 'hex-color',
    name: 'HEX Color (#RGB / #RRGGBB)',
    category: 'Web & Networking',
    pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b',
    flags: 'i',
    description: '16-ричные цвета интерфейса Form (например #FFFFFF, #2563EB).',
    sampleInput: 'Primary: #2563EB, Surface: #1E293B, Accent: #F59E0B',
  },
  {
    id: 'password-strong',
    name: 'Strong Password Policy',
    category: 'Security',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    flags: '',
    description: 'Минимум 8 символов, заглавная, строчная, цифра и спецсимвол.',
    sampleInput: 'Passw0rd!2024 (Valid), weakpass (Invalid)',
  },
];

export class RegexPatternStudioEngine {
  /**
   * Evaluates regular expression against input text with performance metrics and token decomposition
   */
  public static evaluate(
    pattern: string,
    inputText: string,
    flags: string = 'g',
    replacement: string = ''
  ): RegexAnalysisResult {
    const startTime = performance.now();

    if (!pattern) {
      return {
        isValid: true,
        matches: [],
        matchCount: 0,
        executionTimeMs: 0,
        replacedText: inputText,
        csharpSnippet: '// Введите регулярное выражение для генерации C# кода',
        explanationTokens: [],
      };
    }

    try {
      // Ensure 'g' flag is included for matching all occurrences
      const activeFlags = flags.includes('g') ? flags : flags + 'g';
      const jsRegex = new RegExp(pattern, activeFlags);

      const matches: RegexMatchDetail[] = [];
      let match: RegExpExecArray | null;

      // Safe iteration with max match safety limit
      let loopGuard = 0;
      while ((match = jsRegex.exec(inputText)) !== null && loopGuard < 500) {
        loopGuard++;
        const groups: RegexMatchDetail['groups'] = [];

        // Group 0 is whole match
        groups.push({
          index: 0,
          name: '0 (Full Match)',
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
        });

        // Capture groups 1..N
        for (let i = 1; i < match.length; i++) {
          const groupVal = match[i];
          if (groupVal !== undefined) {
            groups.push({
              index: i,
              name: `$${i}`,
              value: groupVal,
              start: match.index, // approx
              end: match.index + groupVal.length,
            });
          }
        }

        matches.push({
          index: match.index,
          length: match[0].length,
          value: match[0],
          groups,
        });

        // Break zero-length matches infinite loop
        if (match[0].length === 0) {
          jsRegex.lastIndex++;
        }
      }

      const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

      // Replaced string
      let replacedText = inputText;
      if (replacement !== undefined) {
        try {
          const replaceRegex = new RegExp(pattern, activeFlags);
          replacedText = inputText.replace(replaceRegex, replacement);
        } catch {
          replacedText = inputText;
        }
      }

      // Generate C# Snippet
      const csharpOptions: string[] = ['RegexOptions.Compiled'];
      if (flags.includes('i')) csharpOptions.push('RegexOptions.IgnoreCase');
      if (flags.includes('m')) csharpOptions.push('RegexOptions.Multiline');
      if (flags.includes('s')) csharpOptions.push('RegexOptions.Singleline');

      const escapedPattern = pattern.replace(/"/g, '""');
      const csharpSnippet = `using System.Text.RegularExpressions;

// Roslyn Regex Engine
var pattern = @"${escapedPattern}";
var options = ${csharpOptions.join(' | ')};
var regex = new Regex(pattern, options);

// Проверка соответствия
bool isMatch = regex.IsMatch(inputString);

// Извлечение совпадений
MatchCollection matches = regex.Matches(inputString);
foreach (Match m in matches)
{
    Console.WriteLine($"Найдено: '{m.Value}' на позиции {m.Index}");
    for (int g = 1; g < m.Groups.Count; g++)
    {
        Console.WriteLine($"  Группа {g}: '{m.Groups[g].Value}'");
    }
}`;

      // Explanation tokens
      const explanationTokens = this.decomposeTokens(pattern);

      return {
        isValid: true,
        matches,
        matchCount: matches.length,
        executionTimeMs,
        replacedText,
        csharpSnippet,
        explanationTokens,
      };
    } catch (err: any) {
      return {
        isValid: false,
        errorMessage: err.message || 'Синтаксическая ошибка в регулярном выражении',
        matches: [],
        matchCount: 0,
        executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
        replacedText: inputText,
        csharpSnippet: `// Ошибка: ${err.message}`,
        explanationTokens: [],
      };
    }
  }

  /**
   * Decomposes regex into explainable visual tokens for Railroad/FSM visualizer
   */
  private static decomposeTokens(pattern: string): { token: string; type: string; explanation: string }[] {
    const tokens: { token: string; type: string; explanation: string }[] = [];
    let i = 0;

    while (i < pattern.length) {
      const char = pattern[i];

      if (char === '^') {
        tokens.push({ token: '^', type: 'Anchor', explanation: 'Начало строки или строки в многострочном режиме' });
        i++;
      } else if (char === '$') {
        tokens.push({ token: '$', type: 'Anchor', explanation: 'Конец строки' });
        i++;
      } else if (char === '\\' && i + 1 < pattern.length) {
        const next = pattern[i + 1];
        const esc = '\\' + next;
        if (next === 'd') tokens.push({ token: '\\d', type: 'Character Class', explanation: 'Любая цифра [0-9]' });
        else if (next === 'w') tokens.push({ token: '\\w', type: 'Character Class', explanation: 'Буква, цифра или подчёркивание [a-zA-Z0-9_]' });
        else if (next === 's') tokens.push({ token: '\\s', type: 'Character Class', explanation: 'Любой пробельный символ (пробел, таб, перенос)' });
        else if (next === 'b') tokens.push({ token: '\\b', type: 'Anchor', explanation: 'Граница слова' });
        else tokens.push({ token: esc, type: 'Escaped Literal', explanation: `Экранированный спецсимвол '${next}'` });
        i += 2;
      } else if (char === '[') {
        const closeIdx = pattern.indexOf(']', i);
        if (closeIdx !== -1) {
          const setStr = pattern.substring(i, closeIdx + 1);
          tokens.push({ token: setStr, type: 'Character Set', explanation: `Один символ из набора ${setStr}` });
          i = closeIdx + 1;
        } else {
          tokens.push({ token: '[', type: 'Literal', explanation: 'Символ [' });
          i++;
        }
      } else if (char === '(') {
        if (pattern.startsWith('(?:', i)) {
          tokens.push({ token: '(?:...)', type: 'Non-Capturing Group', explanation: 'Группа без захвата' });
          i += 3;
        } else if (pattern.startsWith('(?=', i)) {
          tokens.push({ token: '(?=...)', type: 'Lookahead', explanation: 'Позитивный опережающий просмотр' });
          i += 3;
        } else {
          tokens.push({ token: '(', type: 'Group Start', explanation: 'Начало захватывающей группы' });
          i++;
        }
      } else if (char === ')') {
        tokens.push({ token: ')', type: 'Group End', explanation: 'Конец группы' });
        i++;
      } else if (char === '+' || char === '*' || char === '?') {
        const expl = char === '+' ? '1 или более раз (жадный квантификатор)' : char === '*' ? '0 или более раз' : '0 или 1 раз (опционально)';
        tokens.push({ token: char, type: 'Quantifier', explanation: expl });
        i++;
      } else if (char === '{') {
        const closeIdx = pattern.indexOf('}', i);
        if (closeIdx !== -1) {
          const qStr = pattern.substring(i, closeIdx + 1);
          tokens.push({ token: qStr, type: 'Quantifier', explanation: `Повторение в диапазоне ${qStr}` });
          i = closeIdx + 1;
        } else {
          tokens.push({ token: '{', type: 'Literal', explanation: 'Символ {' });
          i++;
        }
      } else if (char === '|') {
        tokens.push({ token: '|', type: 'Alternation', explanation: 'Логическое ИЛИ (сопоставление любого из вариантов)' });
        i++;
      } else if (char === '.') {
        tokens.push({ token: '.', type: 'Wildcard', explanation: 'Любой символ (кроме переноса строки)' });
        i++;
      } else {
        tokens.push({ token: char, type: 'Literal', explanation: `Символ '${char}'` });
        i++;
      }
    }

    return tokens;
  }
}
