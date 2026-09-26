/**
 * C# Safe-Naming & Strict Identifier Sanitizer
 * Automatically validates and normalizes identifiers into valid, idiomatic C# identifiers.
 */

// C# Language Reserved Keywords (C# 1.0 - C# 13)
export const CSHARP_RESERVED_KEYWORDS = new Set([
  'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked',
  'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else',
  'enum', 'event', 'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for',
  'foreach', 'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock',
  'long', 'namespace', 'new', 'null', 'object', 'operator', 'out', 'override', 'params',
  'private', 'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed',
  'short', 'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this',
  'throw', 'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort',
  'using', 'virtual', 'void', 'volatile', 'while', 'yield', 'var', 'dynamic', 'async',
  'await', 'record', 'init', 'nint', 'nuint', 'unmanaged', 'notnull', 'when', 'value',
]);

// Cyrillic to Latin Transliteration dictionary
const CYRILLIC_MAP: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
  'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
  'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
  'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
  'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
};

/**
 * Transliterates Russian / Cyrillic characters to Latin
 */
export const transliterateCyrillic = (text: string): string => {
  return text
    .split('')
    .map(char => CYRILLIC_MAP[char] !== undefined ? CYRILLIC_MAP[char] : char)
    .join('');
};

export interface SanitizationResult {
  original: string;
  sanitized: string;
  wasModified: boolean;
  reason?: string;
  isValidStrict: boolean;
  errorMessage?: string;
}

/**
 * Validates a C# identifier strictly against `^[a-zA-Z_][a-zA-Z0-9_]*$` and C# keywords.
 */
export const validateStrictCsIdentifier = (
  name: string,
  existingNames: string[] = []
): { isValid: boolean; errorMessage?: string } => {
  if (!name || !name.trim()) {
    return { isValid: false, errorMessage: 'Имя контрола не может быть пустым' };
  }

  const trimmed = name.trim();

  // 1. Check start with digit
  if (/^[0-9]/.test(trimmed)) {
    return { isValid: false, errorMessage: 'Идентификатор C# не может начинаться с цифры' };
  }

  // 2. Strict C# identifier regex
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    return {
      isValid: false,
      errorMessage: 'Недопустимые символы или пробелы (разрешены только a-z, A-Z, 0-9, _)',
    };
  }

  // 3. Reserved keyword check
  if (CSHARP_RESERVED_KEYWORDS.has(trimmed.toLowerCase())) {
    return {
      isValid: false,
      errorMessage: `"${trimmed}" является зарезервированным ключевым словом C#`,
    };
  }

  // 4. Duplicate name check
  if (existingNames.includes(trimmed)) {
    return {
      isValid: false,
      errorMessage: `Контрол с именем "${trimmed}" уже существует в этой форме`,
    };
  }

  return { isValid: true };
};

/**
 * Sanitizes any user input string into a valid, safe C# identifier on the fly.
 */
export const sanitizeCsIdentifier = (
  rawInput: string,
  controlType = 'Control',
  existingNames: string[] = []
): SanitizationResult => {
  const original = rawInput;
  const validation = validateStrictCsIdentifier(rawInput, existingNames);

  if (!rawInput || !rawInput.trim()) {
    const fallback = `${controlType.toLowerCase()}1`;
    const sanitized = ensureUnique(fallback, existingNames);
    return {
      original,
      sanitized,
      wasModified: true,
      reason: 'Пустое имя заменено на стандартное',
      isValidStrict: false,
      errorMessage: 'Имя не может быть пустым',
    };
  }

  let text = rawInput.trim();

  // 1. Transliterate Cyrillic characters to Latin
  text = transliterateCyrillic(text);

  // 2. Replace separators with CamelCase
  const parts = text
    .split(/[^A-Za-z0-9_]+/)
    .filter(Boolean);

  if (parts.length === 0) {
    const fallback = `${controlType.toLowerCase()}1`;
    const sanitized = ensureUnique(fallback, existingNames);
    return {
      original,
      sanitized,
      wasModified: true,
      reason: 'Не содержит допустимых символов',
      isValidStrict: false,
      errorMessage: 'Имя содержит только недопустимые символы',
    };
  }

  // 3. Reconstruct into CamelCase
  let candidate = parts[0];
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    candidate += part.charAt(0).toUpperCase() + part.slice(1);
  }

  // 4. Ensure identifier does not start with a digit
  if (/^[0-9]/.test(candidate)) {
    const prefix = getPrefixForType(controlType);
    candidate = `${prefix}${candidate}`;
  }

  // 5. Check if it's a C# reserved keyword
  if (CSHARP_RESERVED_KEYWORDS.has(candidate.toLowerCase())) {
    candidate = `${candidate}Control`;
  }

  // 6. Ensure unique if list provided
  const uniqueCandidate = ensureUnique(candidate, existingNames);

  const wasModified = original !== uniqueCandidate;
  let reason: string | undefined;
  if (wasModified) {
    if (/[А-Яа-яЁё]/.test(original)) {
      reason = 'Транслитерация кириллицы и удаление спецсимволов';
    } else if (/^[0-9]/.test(original)) {
      reason = 'Идентификатор C# не может начинаться с цифры (добавлен префикс)';
    } else if (/\s|[-!@#$%^&*()+=/\\|?:;,.]/.test(original)) {
      reason = 'Удалены пробелы и спецсимволы';
    } else if (CSHARP_RESERVED_KEYWORDS.has(original.toLowerCase())) {
      reason = 'Зарезервированное ключевое слово C# (добавлен суффикс Control)';
    } else if (existingNames.includes(original)) {
      reason = 'Дублирующееся имя (добавлен числовой суффикс)';
    }
  }

  return {
    original,
    sanitized: uniqueCandidate,
    wasModified,
    reason,
    isValidStrict: validation.isValid,
    errorMessage: validation.errorMessage,
  };
};

/**
 * Checks if a string is already a 100% valid C# identifier
 */
export const isValidCsIdentifier = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return false;
  if (CSHARP_RESERVED_KEYWORDS.has(name.toLowerCase())) return false;
  return true;
};

function getPrefixForType(type: string): string {
  switch (type) {
    case 'Button': return 'button';
    case 'TextBox': return 'text';
    case 'Label': return 'label';
    case 'Panel': return 'panel';
    case 'CheckBox': return 'check';
    case 'RadioButton': return 'radio';
    case 'ComboBox': return 'combo';
    case 'ListBox': return 'list';
    case 'ProgressBar': return 'progress';
    case 'PictureBox': return 'picture';
    case 'GroupBox': return 'group';
    case 'TabControl': return 'tab';
    case 'Form': return 'form';
    default: return 'item';
  }
}

function ensureUnique(name: string, existing: string[]): string {
  if (!existing || existing.length === 0 || !existing.includes(name)) {
    return name;
  }
  let counter = 1;
  let candidate = `${name}_${counter}`;
  while (existing.includes(candidate)) {
    counter++;
    candidate = `${name}_${counter}`;
  }
  return candidate;
}
