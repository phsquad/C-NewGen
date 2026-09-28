import { TEMPLATES_CATALOG, TemplateDefinition as BaseTemplateDefinition } from '../utils/templatesCatalog';

export type TemplateCategory =
  | 'all'
  | 'business'
  | 'education'
  | 'tools'
  | 'media'
  | 'network'
  | 'text'
  | 'games'
  | 'security'
  | 'automation'
  | 'iot';

export interface CategoryMetadata {
  id: TemplateCategory;
  title: string;
  shortTitle: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  count: number;
}

export interface PreviewLayoutConfig {
  headerHeight: number;
  layoutType:
    | 'datagrid'
    | 'grid3x3'
    | 'terminal'
    | 'chart'
    | 'editor'
    | 'form_inputs'
    | 'dashboard'
    | 'media_player'
    | 'network_inspector';
  hasSidebar: boolean;
  sidebarSide: 'left' | 'right';
  theme: {
    bg: string;
    surface: string;
    border: string;
    accent: string;
    text: string;
    subtext: string;
  };
  sampleControls: Array<{
    type: string;
    name: string;
    label: string;
    badge?: string;
  }>;
}

export interface TemplateDefinition extends BaseTemplateDefinition {
  difficulty: 'Начальный' | 'Средний' | 'Продвинутый';
  framework: string;
  accentColor: string;
  isPopular?: boolean;
  isFeatured?: boolean;
  previewLayout: PreviewLayoutConfig;
}

export const CATEGORY_METADATA_LIST: CategoryMetadata[] = [
  {
    id: 'all',
    title: '⭐ Все шаблоны',
    shortTitle: 'Все (100)',
    icon: '⭐',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    description: 'Полный каталог из 100 готовых архитектур приложений .NET 9 WinForms',
    count: 100,
  },
  {
    id: 'business',
    title: '💼 Бизнес, Склад и CRM',
    shortTitle: 'Бизнес & Склад',
    icon: '💼',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    description: 'Учет остатков, кассы, накладные, заказы клиентов и таблицы SQLite',
    count: 10,
  },
  {
    id: 'education',
    title: '🎓 Учеба и Лабораторные',
    shortTitle: 'Лабы / Учеба',
    icon: '🎓',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    description: 'Численные методы, матричные расчеты, графики функций и тестирование',
    count: 10,
  },
  {
    id: 'tools',
    title: '🛠 Системные Утилиты',
    shortTitle: 'Утилиты',
    icon: '🛠',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    description: 'Мониторинг ресурсов, конвертеры, пакетный ренейминг и файловые инструменты',
    count: 10,
  },
  {
    id: 'media',
    title: '🎬 Медиа и Аудио',
    shortTitle: 'Медиа / Звук',
    icon: '🎬',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    description: 'Видеоплееры, генераторы звуковых волн, эквалайзеры и обработка графики',
    count: 10,
  },
  {
    id: 'network',
    title: '🌐 Сети, HTTP и API',
    shortTitle: 'Сети & API',
    icon: '🌐',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    description: 'REST API клиенты, Ping/Traceroute, сканеры портов и WebSocket клиенты',
    count: 10,
  },
  {
    id: 'text',
    title: '📝 Текст и Редакторы',
    shortTitle: 'Текст / Редакторы',
    icon: '📝',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    description: 'Блокноты с подсветкой, Markdown парсеры, Regex студии и текстовые метрики',
    count: 10,
  },
  {
    id: 'games',
    title: '🎮 Игры и Аркады',
    shortTitle: 'Игры / Аркады',
    icon: '🎮',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
    description: 'Крестики-нолики с ИИ Minimax, CS:GO Aim Trainer, Сапер, Змейка и Пятнашки',
    count: 10,
  },
  {
    id: 'security',
    title: '🔒 Безопасность и Шифрование',
    shortTitle: 'Безопасность',
    icon: '🔒',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
    description: 'AES/RSA криптография, генераторы паролей, хэширование SHA256 и стеганография',
    count: 10,
  },
  {
    id: 'automation',
    title: '🤖 Автоматизация и Скриптинг',
    shortTitle: 'Автоматизация',
    icon: '🤖',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    description: 'Планировщики задач, автокликеры, парсеры данных и конвейеры обработки',
    count: 10,
  },
  {
    id: 'iot',
    title: '⚡️ Инженерия и IoT',
    shortTitle: 'IoT & Датчики',
    icon: '⚡️',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20',
    description: 'Виртуальные COM-порты, телеметрия датчиков, Modbus симуляторы и осциллограф',
    count: 10,
  },
];

/**
 * Determine dynamic preview configuration based on template characteristics
 */
function resolvePreviewLayout(baseTpl: BaseTemplateDefinition): PreviewLayoutConfig {
  const cat = baseTpl.category;
  const isGames = cat === 'games';
  const isBusiness = cat === 'business' || baseTpl.hasDatabase;
  const isNetwork = cat === 'network';
  const isText = cat === 'text';
  const isMedia = cat === 'media';
  const isIoT = cat === 'iot';

  let layoutType: PreviewLayoutConfig['layoutType'] = 'form_inputs';
  if (baseTpl.id === 'tpl_61') {
    layoutType = 'grid3x3';
  } else if (isGames) {
    layoutType = 'grid3x3';
  } else if (isBusiness) {
    layoutType = 'datagrid';
  } else if (isNetwork) {
    layoutType = 'network_inspector';
  } else if (isText) {
    layoutType = 'editor';
  } else if (isMedia) {
    layoutType = 'media_player';
  } else if (isIoT) {
    layoutType = 'chart';
  } else if (cat === 'tools') {
    layoutType = 'terminal';
  }

  const sampleControls = baseTpl.controlsList.map((ctl) => {
    const [type, ...rest] = ctl.split(' ');
    return {
      type: type || 'Control',
      name: ctl.replace(/[^a-zA-Z0-9]/g, ''),
      label: rest.join(' ') || ctl,
      badge: baseTpl.hasDatabase ? 'SQLite' : undefined,
    };
  });

  return {
    headerHeight: 56,
    layoutType,
    hasSidebar: true,
    sidebarSide: 'right',
    theme: {
      bg: '#18181B',
      surface: '#27272A',
      border: '#3F3F46',
      accent: getCategoryAccentColor(cat),
      text: '#FAFAFA',
      subtext: '#A1A1AA',
    },
    sampleControls,
  };
}

function getCategoryAccentColor(cat: string): string {
  switch (cat) {
    case 'business':
      return '#3B82F6';
    case 'education':
      return '#10B981';
    case 'tools':
      return '#F97316';
    case 'media':
      return '#EC4899';
    case 'network':
      return '#06B6D4';
    case 'text':
      return '#EAB308';
    case 'games':
      return '#6366F1';
    case 'security':
      return '#F43F5E';
    case 'automation':
      return '#A855F7';
    case 'iot':
      return '#14B8A6';
    default:
      return '#3B82F6';
  }
}

/**
 * Enhanced full list of 100 template definitions with high-fidelity preview layouts and metadata
 */
export const TEMPLATES_DEFINITIONS: TemplateDefinition[] = TEMPLATES_CATALOG.map((base) => {
  const previewLayout = resolvePreviewLayout(base);
  const isPopular = [1, 2, 11, 21, 61, 62, 71, 91].includes(base.num);
  const isFeatured = [1, 11, 61, 62, 71].includes(base.num);
  let difficulty: 'Начальный' | 'Средний' | 'Продвинутый' = 'Начальный';
  if (base.controlsCount > 10 || base.hasDatabase) {
    difficulty = base.controlsCount > 12 ? 'Продвинутый' : 'Средний';
  }

  return {
    ...base,
    difficulty,
    framework: '.NET 9 WinForms',
    accentColor: getCategoryAccentColor(base.category),
    isPopular,
    isFeatured,
    previewLayout,
  };
});

/**
 * Helper to fetch a template definition by ID
 */
export const getTemplateDefinition = (id: string): TemplateDefinition | undefined => {
  return TEMPLATES_DEFINITIONS.find((t) => t.id === id);
};

/**
 * Filter templates by multiple criteria
 */
export interface TemplateFilterOptions {
  category?: TemplateCategory;
  searchQuery?: string;
  hasDatabaseOnly?: boolean;
  difficulty?: string;
  popularOnly?: boolean;
}

export const filterTemplateDefinitions = (options: TemplateFilterOptions): TemplateDefinition[] => {
  const { category = 'all', searchQuery = '', hasDatabaseOnly = false, difficulty, popularOnly = false } = options;

  const query = searchQuery.trim().toLowerCase();

  return TEMPLATES_DEFINITIONS.filter((tpl) => {
    // 1. Category match
    if (category !== 'all' && tpl.category !== category) {
      return false;
    }

    // 2. Database filter
    if (hasDatabaseOnly && !tpl.hasDatabase) {
      return false;
    }

    // 3. Difficulty
    if (difficulty && difficulty !== 'all' && tpl.difficulty !== difficulty) {
      return false;
    }

    // 4. Popular
    if (popularOnly && !tpl.isPopular) {
      return false;
    }

    // 5. Query match
    if (query) {
      const matchNum = String(tpl.num) === query || `#${tpl.num}` === query;
      const matchTitle = tpl.title.toLowerCase().includes(query);
      const matchDesc = tpl.description.toLowerCase().includes(query);
      const matchCsharp = tpl.csharpSummary.toLowerCase().includes(query);
      const matchTags = tpl.tags.some((t) => t.toLowerCase().includes(query));
      const matchControls = tpl.controlsList.some((c) => c.toLowerCase().includes(query));

      if (!matchNum && !matchTitle && !matchDesc && !matchCsharp && !matchTags && !matchControls) {
        return false;
      }
    }

    return true;
  });
};
