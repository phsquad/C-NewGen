import { ActionCategoryMeta, ActionDefinition, ActionCategoryId } from '../types/actions';

export const ACTION_CATEGORIES: ActionCategoryMeta[] = [
  {
    id: 'windows_nav',
    title: 'Окна, формы и навигация',
    emoji: '🗔',
    description: 'Управление окнами, модальными диалогами, вкладками и навигацией',
    range: '1–10',
    color: '#3b82f6', // blue
  },
  {
    id: 'elements_props',
    title: 'Управление элементами и свойствами',
    emoji: '🎨',
    description: 'Изменение текста, цвета, видимости, доступности и фокуса',
    range: '11–20',
    color: '#10b981', // emerald
  },
  {
    id: 'dialogs_msg',
    title: 'Диалоги, сообщения и уведомления',
    emoji: '💬',
    description: 'Всплывающие окна MessageBox, выбор файлов, палитры и звуки',
    range: '21–30',
    color: '#f59e0b', // amber
  },
  {
    id: 'vars_math_logic',
    title: 'Переменные, математика и логика',
    emoji: '🧠',
    description: 'Ветвление ЕСЛИ/ИНАЧЕ, вычисления A+B, генератор Random и счетчики',
    range: '31–40',
    color: '#8b5cf6', // purple
  },
  {
    id: 'sqlite_db',
    title: 'Базы данных SQLite',
    emoji: '🗄',
    description: 'Запись в таблицы, DataGridView, живой поиск, экспорт и SQL запросы',
    range: '41–50',
    color: '#06b6d4', // cyan
  },
  {
    id: 'network_api',
    title: 'Интернет, API и сетевые запросы',
    emoji: '🌐',
    description: 'GET/POST запросы, JSON парсинг, скачивание файлов и Telegram боты',
    range: '51–60',
    color: '#ec4899', // pink
  },
  {
    id: 'timers_anim',
    title: 'Таймеры, время и анимации',
    emoji: '⏱',
    description: 'Таймеры, задержка Wait, плавный FadeIn/FadeOut, тряска Shake и секундомер',
    range: '61–70',
    color: '#f97316', // orange
  },
  {
    id: 'lists_tables',
    title: 'Списки, выпадающие меню и таблицы',
    emoji: '📋',
    description: 'Управление элементами ListBox, ComboBox, TreeView и сортировка',
    range: '71–80',
    color: '#6366f1', // indigo
  },
  {
    id: 'files_disk',
    title: 'Файлы, папки и диск',
    emoji: '📁',
    description: 'Чтение и запись файлов, создание папок, проверки и конфиги INI/JSON',
    range: '81–90',
    color: '#14b8a6', // teal
  },
  {
    id: 'sound_system',
    title: 'Звук, мультимедиа и система',
    emoji: '🎬',
    description: 'Воспроизведение звуков, скриншоты, инфо о ПК, запуск программ и выход',
    range: '91–100',
    color: '#ef4444', // red
  },
];

export const ACTIONS_REGISTRY: ActionDefinition[] = [
  // ==========================================
  // КАТЕГОРИЯ 1: ОКНА, ФОРМЫ И НАВИГАЦИЯ (1–10)
  // ==========================================
  {
    num: 1,
    id: 'ACT_01_OPEN_FORM',
    title: 'Открыть другое окно',
    category: 'windows_nav',
    description: 'Открывает выбранную форму в обычном или модальном режиме (ShowDialog)',
    icon: 'AppWindow',
    paramsSchema: [
      { key: 'targetForm', label: 'Целевая форма', type: 'form', defaultValue: 'Form2' },
      {
        key: 'mode',
        label: 'Режим открытия',
        type: 'select',
        options: [
          { value: 'Show', label: 'Обычный (Show)' },
          { value: 'ShowDialog', label: 'Модальный диалог (ShowDialog)' },
        ],
        defaultValue: 'Show',
      },
    ],
  },
  {
    num: 2,
    id: 'ACT_02_CLOSE_FORM',
    title: 'Закрыть текущее окно',
    category: 'windows_nav',
    description: 'Закрывает активную форму и освобождает ресурсы',
    icon: 'X',
    paramsSchema: [
      { key: 'targetForm', label: 'Какую форму закрыть', type: 'form', defaultValue: 'this' },
    ],
  },
  {
    num: 3,
    id: 'ACT_03_HIDE_FORM',
    title: 'Скрыть окно (Hide)',
    category: 'windows_nav',
    description: 'Делает форму невидимой без выгрузки из памяти',
    icon: 'EyeOff',
    paramsSchema: [
      { key: 'targetForm', label: 'Какую форму скрыть', type: 'form', defaultValue: 'this' },
    ],
  },
  {
    num: 4,
    id: 'ACT_04_SHOW_FORM',
    title: 'Показать скрытое окно',
    category: 'windows_nav',
    description: 'Делает ранее скрытую форму снова видимой',
    icon: 'Eye',
    paramsSchema: [
      { key: 'targetForm', label: 'Какую форму показать', type: 'form', defaultValue: 'Form2' },
    ],
  },
  {
    num: 5,
    id: 'ACT_05_CENTER_FORM',
    title: 'Центрировать окно',
    category: 'windows_nav',
    description: 'Перемещает окно точно в центр экрана',
    icon: 'Maximize2',
    paramsSchema: [
      {
        key: 'alignMode',
        label: 'Тип центрирования',
        type: 'select',
        options: [
          { value: 'CenterToScreen', label: 'По центру экрана' },
          { value: 'CenterToParent', label: 'По центру родителя' },
        ],
        defaultValue: 'CenterToScreen',
      },
    ],
  },
  {
    num: 6,
    id: 'ACT_06_MINIMIZE_FORM',
    title: 'Свернуть окно',
    category: 'windows_nav',
    description: 'Сворачивает форму в панель задач',
    icon: 'Minus',
    paramsSchema: [],
  },
  {
    num: 7,
    id: 'ACT_07_MAXIMIZE_FORM',
    title: 'Развернуть на весь экран',
    category: 'windows_nav',
    description: 'Разворачивает окно на весь рабочий стол (Maximized)',
    icon: 'Maximize',
    paramsSchema: [],
  },
  {
    num: 8,
    id: 'ACT_08_SWITCH_TAB',
    title: 'Сменить вкладку TabControl',
    category: 'windows_nav',
    description: 'Переключает активную страницу контейнера вкладок',
    icon: 'Layers',
    paramsSchema: [
      { key: 'targetControl', label: 'TabControl', type: 'control', defaultValue: 'tabControl1' },
      { key: 'tabIndex', label: 'Номер вкладки (индекс с 0)', type: 'number', defaultValue: 1 },
    ],
  },
  {
    num: 9,
    id: 'ACT_09_RESTART_APP',
    title: 'Перезапустить программу',
    category: 'windows_nav',
    description: 'Полный перезапуск приложения (Application.Restart)',
    icon: 'RefreshCw',
    paramsSchema: [],
  },
  {
    num: 10,
    id: 'ACT_10_OPEN_URL',
    title: 'Открыть сайт / Веб-ссылку',
    category: 'windows_nav',
    description: 'Открывает указанную веб-ссылку в браузере по умолчанию',
    icon: 'ExternalLink',
    paramsSchema: [
      { key: 'url', label: 'URL-адрес сайта', type: 'text', defaultValue: 'https://google.com', placeholder: 'https://...' },
    ],
  },

  // ==========================================
  // КАТЕГОРИЯ 2: УПРАВЛЕНИЕ ЭЛЕМЕНТАМИ И СВОЙСТВАМИ (11–20)
  // ==========================================
  {
    num: 11,
    id: 'ACT_11_SET_TEXT',
    title: 'Изменить текст элемента',
    category: 'elements_props',
    description: 'Задает новое текстовое значение для метки, кнопки или поля',
    icon: 'Type',
    paramsSchema: [
      { key: 'targetControl', label: 'Элемент', type: 'control', defaultValue: 'lblResult' },
      { key: 'textValue', label: 'Новый текст', type: 'text', defaultValue: 'Успешно!', placeholder: 'Введите текст...' },
    ],
  },
  {
    num: 12,
    id: 'ACT_12_CLEAR_INPUT',
    title: 'Очистить поле ввода',
    category: 'elements_props',
    description: 'Стирает весь текст в поле TextBox или RichTextBox',
    icon: 'Eraser',
    paramsSchema: [
      { key: 'targetControl', label: 'Поле ввода', type: 'control', defaultValue: 'txtLogin' },
    ],
  },
  {
    num: 13,
    id: 'ACT_13_SET_ENABLED',
    title: 'Включить / Заблокировать (Enable)',
    category: 'elements_props',
    description: 'Управляет доступностью элемента (активен / заблокирован)',
    icon: 'CheckSquare',
    paramsSchema: [
      { key: 'targetControl', label: 'Элемент', type: 'control', defaultValue: 'btnSubmit' },
      {
        key: 'state',
        label: 'Состояние',
        type: 'select',
        options: [
          { value: 'true', label: 'Включить (Активен)' },
          { value: 'false', label: 'Заблокировать (Disabled)' },
          { value: 'toggle', label: 'Инвертировать (!Enabled)' },
        ],
        defaultValue: 'true',
      },
    ],
  },
  {
    num: 14,
    id: 'ACT_14_SET_VISIBLE',
    title: 'Показать / Скрыть (Visible)',
    category: 'elements_props',
    description: 'Управляет видимостью элемента на форме',
    icon: 'Eye',
    paramsSchema: [
      { key: 'targetControl', label: 'Элемент', type: 'control', defaultValue: 'panel1' },
      {
        key: 'state',
        label: 'Состояние',
        type: 'select',
        options: [
          { value: 'true', label: 'Показать (Visible = true)' },
          { value: 'false', label: 'Скрыть (Visible = false)' },
          { value: 'toggle', label: 'Переключить видимость' },
        ],
        defaultValue: 'toggle',
      },
    ],
  },
  {
    num: 15,
    id: 'ACT_15_SET_BACK_COLOR',
    title: 'Сменить цвет фона',
    category: 'elements_props',
    description: 'Устанавливает цвет фона для элемента или формы',
    icon: 'Palette',
    paramsSchema: [
      { key: 'targetControl', label: 'Элемент', type: 'control', defaultValue: 'btnSubmit' },
      { key: 'color', label: 'Цвет фона (HEX)', type: 'color', defaultValue: '#2563EB' },
    ],
  },
  {
    num: 16,
    id: 'ACT_16_SET_FORE_COLOR',
    title: 'Сменить цвет текста',
    category: 'elements_props',
    description: 'Устанавливает цвет шрифта для текста элемента',
    icon: 'Type',
    paramsSchema: [
      { key: 'targetControl', label: 'Элемент', type: 'control', defaultValue: 'lblStatus' },
      { key: 'color', label: 'Цвет текста (HEX)', type: 'color', defaultValue: '#EF4444' },
    ],
  },
  {
    num: 17,
    id: 'ACT_17_SET_FOCUS',
    title: 'Установить фокус (Курсор)',
    category: 'elements_props',
    description: 'Перемещает курсор клавиатуры в выбранное поле ввода',
    icon: 'MousePointer',
    paramsSchema: [
      { key: 'targetControl', label: 'Поле ввода', type: 'control', defaultValue: 'txtUsername' },
    ],
  },
  {
    num: 18,
    id: 'ACT_18_COPY_CLIPBOARD',
    title: 'Скопировать текст в буфер',
    category: 'elements_props',
    description: 'Копирует текст поля в буфер обмена Windows',
    icon: 'Copy',
    paramsSchema: [
      { key: 'targetControl', label: 'Откуда скопировать текст', type: 'control', defaultValue: 'txtResult' },
    ],
  },
  {
    num: 19,
    id: 'ACT_19_PASTE_CLIPBOARD',
    title: 'Вставить текст из буфера',
    category: 'elements_props',
    description: 'Вставляет содержимое буфера обмена в поле ввода',
    icon: 'Clipboard',
    paramsSchema: [
      { key: 'targetControl', label: 'Куда вставить текст', type: 'control', defaultValue: 'txtInput' },
    ],
  },
  {
    num: 20,
    id: 'ACT_20_SET_PROGRESS_BAR',
    title: 'Установить ProgressBar',
    category: 'elements_props',
    description: 'Задает значение шкалы прогресса (от 0 до 100%)',
    icon: 'Sliders',
    paramsSchema: [
      { key: 'targetControl', label: 'Шкала прогресса', type: 'control', defaultValue: 'progressBar1' },
      { key: 'val', label: 'Значение (0..100)', type: 'number', defaultValue: 100 },
    ],
  },

  // ==========================================
  // КАТЕГОРИЯ 3: ДИАЛОГИ, СООБЩЕНИЯ И УВЕДОМЛЕНИЯ (21–30)
  // ==========================================
  {
    num: 21,
    id: 'ACT_21_SHOW_MESSAGE',
    title: 'Показать всплывающее сообщение (MessageBox)',
    category: 'dialogs_msg',
    description: 'Показывает стандартное диалоговое окно сообщения',
    icon: 'MessageSquare',
    paramsSchema: [
      { key: 'text', label: 'Текст сообщения', type: 'text', defaultValue: 'Операция успешно завершена!' },
      { key: 'title', label: 'Заголовок окна', type: 'text', defaultValue: 'Информация' },
      {
        key: 'icon',
        label: 'Иконка сообщения',
        type: 'select',
        options: [
          { value: 'Information', label: 'ℹ️ Информация' },
          { value: 'Warning', label: '⚠️ Предупреждение' },
          { value: 'Error', label: '❌ Ошибка' },
          { value: 'Question', label: '❓ Вопрос' },
        ],
        defaultValue: 'Information',
      },
    ],
  },
  {
    num: 22,
    id: 'ACT_22_CONFIRM_DIALOG',
    title: 'Диалог подтверждения (Да / Нет)',
    category: 'dialogs_msg',
    description: 'Задает вопрос пользователю с ветвлением: Если Да / Если Нет',
    icon: 'HelpCircle',
    hasBranching: true,
    paramsSchema: [
      { key: 'question', label: 'Текст вопроса', type: 'text', defaultValue: 'Вы уверены, что хотите удалить запись?' },
      { key: 'title', label: 'Заголовок', type: 'text', defaultValue: 'Подтверждение' },
    ],
  },
  {
    num: 23,
    id: 'ACT_23_OPEN_FILE_DIALOG',
    title: 'Диалог выбора файла (OpenFileDialog)',
    category: 'dialogs_msg',
    description: 'Открывает системный проводник для выбора существующего файла',
    icon: 'FolderOpen',
    paramsSchema: [
      { key: 'filter', label: 'Фильтр файлов', type: 'text', defaultValue: 'Все файлы (*.*)|*.*|Текстовые (*.txt)|*.txt' },
      { key: 'targetControl', label: 'Куда записать путь к файлу', type: 'control', defaultValue: 'txtFilePath' },
    ],
  },
  {
    num: 24,
    id: 'ACT_24_SAVE_FILE_DIALOG',
    title: 'Диалог сохранения файла (SaveFileDialog)',
    category: 'dialogs_msg',
    description: 'Открывает окно для выбора места и имени сохраняемого файла',
    icon: 'Download',
    paramsSchema: [
      { key: 'filter', label: 'Фильтр файлов', type: 'text', defaultValue: 'Текстовые документы (*.txt)|*.txt' },
      { key: 'defaultName', label: 'Имя файла по умолчанию', type: 'text', defaultValue: 'Document1.txt' },
      { key: 'targetControl', label: 'Куда записать путь', type: 'control', defaultValue: 'txtSavePath' },
    ],
  },
  {
    num: 25,
    id: 'ACT_25_FOLDER_BROWSER',
    title: 'Выбор папки на компьютере',
    category: 'dialogs_msg',
    description: 'Открывает окно обзора каталогов диска',
    icon: 'Folder',
    paramsSchema: [
      { key: 'description', label: 'Описание диалога', type: 'text', defaultValue: 'Выберите рабочую папку:' },
      { key: 'targetControl', label: 'Куда записать путь к папке', type: 'control', defaultValue: 'txtFolderPath' },
    ],
  },
  {
    num: 26,
    id: 'ACT_26_COLOR_DIALOG',
    title: 'Диалог палитры цветов (ColorDialog)',
    category: 'dialogs_msg',
    description: 'Открывает системную палитру и применяет цвет к элементу',
    icon: 'Palette',
    paramsSchema: [
      { key: 'targetControl', label: 'Куда применить выбранный цвет', type: 'control', defaultValue: 'btnSample' },
    ],
  },
  {
    num: 27,
    id: 'ACT_27_FONT_DIALOG',
    title: 'Диалог выбора шрифта (FontDialog)',
    category: 'dialogs_msg',
    description: 'Позволяет пользователю настроить гарнитуру, размер и стиль шрифта',
    icon: 'Type',
    paramsSchema: [
      { key: 'targetControl', label: 'К какому контролу применить шрифт', type: 'control', defaultValue: 'txtContent' },
    ],
  },
  {
    num: 28,
    id: 'ACT_28_INPUT_BOX',
    title: 'Запрос ввода строки (InputBox)',
    category: 'dialogs_msg',
    description: 'Показывает диалог с полем ввода и сохраняет ответ в контрол',
    icon: 'Edit3',
    paramsSchema: [
      { key: 'prompt', label: 'Текст вопроса', type: 'text', defaultValue: 'Введите ваше имя:' },
      { key: 'title', label: 'Заголовок', type: 'text', defaultValue: 'Ввод данных' },
      { key: 'targetControl', label: 'Куда записать ответ', type: 'control', defaultValue: 'txtName' },
    ],
  },
  {
    num: 29,
    id: 'ACT_29_PLAY_SYSTEM_SOUND',
    title: 'Воспроизвести системный звук',
    category: 'dialogs_msg',
    description: 'Проигрывает звуковой сигнал Windows (клик, ошибка, звонок)',
    icon: 'Volume2',
    paramsSchema: [
      {
        key: 'soundType',
        label: 'Тип звука',
        type: 'select',
        options: [
          { value: 'Asterisk', label: '🔔 Asterisk (Инфо)' },
          { value: 'Beep', label: '📟 Beep (Клик)' },
          { value: 'Hand', label: '❌ Hand (Критическая ошибка)' },
          { value: 'Exclamation', label: '⚠️ Exclamation (Предупреждение)' },
        ],
        defaultValue: 'Asterisk',
      },
    ],
  },
  {
    num: 30,
    id: 'ACT_30_FLASH_WINDOW',
    title: 'Мигание окна (Flash Window)',
    category: 'dialogs_msg',
    description: 'Привлекает внимание пользователя миганием кнопки окна в таскбаре',
    icon: 'Sparkles',
    paramsSchema: [],
  },

  // ==========================================
  // КАТЕГОРИЯ 4: ПЕРЕМЕННЫЕ, МАТЕМАТИКА И ЛОГИКА (31–40)
  // ==========================================
  {
    num: 31,
    id: 'ACT_31_SET_VARIABLE',
    title: 'Создать / Задать переменную',
    category: 'vars_math_logic',
    description: 'Задает значение числовой или текстовой переменной программы',
    icon: 'Code',
    paramsSchema: [
      { key: 'varName', label: 'Имя переменной', type: 'text', defaultValue: 'userScore' },
      { key: 'varValue', label: 'Значение', type: 'text', defaultValue: '100' },
    ],
  },
  {
    num: 32,
    id: 'ACT_32_INCREMENT_COUNTER',
    title: 'Прибавить к счетчику (+1 / -1)',
    category: 'vars_math_logic',
    description: 'Увеличивает или уменьшает числовое значение в метке или переменной',
    icon: 'PlusCircle',
    paramsSchema: [
      { key: 'targetControl', label: 'Контрол счетчика', type: 'control', defaultValue: 'lblCounter' },
      { key: 'step', label: 'Шаг изменения', type: 'number', defaultValue: 1 },
    ],
  },
  {
    num: 33,
    id: 'ACT_33_IF_ELSE_CONDITION',
    title: 'Условие ЕСЛИ / ИНАЧЕ (If/Else)',
    category: 'vars_math_logic',
    description: 'Сравнивает значение поля ввода с образцом и разделяет логику на УСПЕХ и ОШИБКУ',
    icon: 'GitBranch',
    hasBranching: true,
    paramsSchema: [
      { key: 'sourceControl', label: 'Поле для проверки', type: 'control', defaultValue: 'txtPassword' },
      {
        key: 'operator',
        label: 'Оператор сравнения',
        type: 'select',
        options: [
          { value: '==', label: 'РАВНО (==)' },
          { value: '!=', label: 'НЕ РАВНО (!=)' },
          { value: '>', label: 'БОЛЬШЕ (>)' },
          { value: '>=', label: 'БОЛЬШЕ ИЛИ РАВНО (>=)' },
          { value: '<', label: 'МЕНЬШЕ (<)' },
          { value: '<=', label: 'МЕНЬШЕ ИЛИ РАВНО (<=)' },
          { value: 'contains', label: 'СОДЕРЖИТ ПОДСТРОКУ' },
        ],
        defaultValue: '==',
      },
      { key: 'compareValue', label: 'С чем сравнивать', type: 'text', defaultValue: '12345' },
    ],
  },
  {
    num: 34,
    id: 'ACT_34_MATH_CALCULATION',
    title: 'Математический расчет (A + B)',
    category: 'vars_math_logic',
    description: 'Выполняет арифметическую операцию над двумя полями и выводит результат',
    icon: 'Calculator',
    paramsSchema: [
      { key: 'inputA', label: 'Поле А', type: 'control', defaultValue: 'txtNumberA' },
      {
        key: 'op',
        label: 'Операция',
        type: 'select',
        options: [
          { value: '+', label: 'Сложение (+)' },
          { value: '-', label: 'Вычитание (-)' },
          { value: '*', label: 'Умножение (*)' },
          { value: '/', label: 'Деление (/)' },
          { value: '%', label: 'Остаток от деления (%)' },
          { value: '^', label: 'Возведение в степень (^)' },
        ],
        defaultValue: '+',
      },
      { key: 'inputB', label: 'Поле Б', type: 'control', defaultValue: 'txtNumberB' },
      { key: 'targetResult', label: 'Поле вывода результата', type: 'control', defaultValue: 'lblResult' },
    ],
  },
  {
    num: 35,
    id: 'ACT_35_RANDOM_NUMBER',
    title: 'Случайное число (Random)',
    category: 'vars_math_logic',
    description: 'Генерирует случайное число в заданном диапазоне от Min до Max',
    icon: 'Shuffle',
    paramsSchema: [
      { key: 'minVal', label: 'От (Минимум)', type: 'number', defaultValue: 1 },
      { key: 'maxVal', label: 'До (Максимум)', type: 'number', defaultValue: 100 },
      { key: 'targetControl', label: 'Куда записать результат', type: 'control', defaultValue: 'lblRandomResult' },
    ],
  },
  {
    num: 36,
    id: 'ACT_36_NOT_BOOLEAN',
    title: 'Инвертировать флажок (NOT)',
    category: 'vars_math_logic',
    description: 'Меняет значение CheckBox или булевой переменной на противоположное',
    icon: 'ToggleLeft',
    paramsSchema: [
      { key: 'targetControl', label: 'CheckBox / Toggle', type: 'control', defaultValue: 'chkOption' },
    ],
  },
  {
    num: 37,
    id: 'ACT_37_CONCAT_STRINGS',
    title: 'Склеить строки (Текст + Текст)',
    category: 'vars_math_logic',
    description: 'Формирует итоговый текст по шаблону (например: "Здравствуйте, {Имя}!")',
    icon: 'FileText',
    paramsSchema: [
      { key: 'template', label: 'Шаблон (используйте {val})', type: 'text', defaultValue: 'Здравствуйте, {val}!' },
      { key: 'sourceControl', label: 'Откуда взять {val}', type: 'control', defaultValue: 'txtName' },
      { key: 'targetControl', label: 'Куда записать', type: 'control', defaultValue: 'lblWelcome' },
    ],
  },
  {
    num: 38,
    id: 'ACT_38_TRANSFORM_CASE',
    title: 'Преобразовать регистр букв',
    category: 'vars_math_logic',
    description: 'Переводит текст поля в верхний регистр (ЗАГЛАВНЫЕ) или строчные',
    icon: 'Type',
    paramsSchema: [
      { key: 'targetControl', label: 'Поле ввода', type: 'control', defaultValue: 'txtInput' },
      {
        key: 'caseType',
        label: 'Регистр',
        type: 'select',
        options: [
          { value: 'ToUpper', label: 'ВСЕ ЗАГЛАВНЫЕ (ToUpper)' },
          { value: 'ToLower', label: 'все строчные (ToLower)' },
          { value: 'Trim', label: 'Удалить лишние пробелы (Trim)' },
        ],
        defaultValue: 'ToUpper',
      },
    ],
  },
  {
    num: 39,
    id: 'ACT_39_CLAMP_NUMBER',
    title: 'Ограничить число (Clamp)',
    category: 'vars_math_logic',
    description: 'Удерживает числовое значение строго в границах от Min до Max',
    icon: 'Sliders',
    paramsSchema: [
      { key: 'targetControl', label: 'Поле с числом', type: 'control', defaultValue: 'numInput' },
      { key: 'min', label: 'Нижняя граница', type: 'number', defaultValue: 0 },
      { key: 'max', label: 'Верхняя граница', type: 'number', defaultValue: 100 },
    ],
  },
  {
    num: 40,
    id: 'ACT_40_CHECK_EMPTY',
    title: 'Проверить на пустоту (IsEmpty)',
    category: 'vars_math_logic',
    description: 'Проверяет, заполнил ли пользователь поле, с ветвлением ЕСЛИ ПУСТО',
    icon: 'AlertCircle',
    hasBranching: true,
    paramsSchema: [
      { key: 'targetControl', label: 'Поле для проверки', type: 'control', defaultValue: 'txtUsername' },
    ],
  },

  // ==========================================
  // КАТЕГОРИЯ 5: БАЗЫ ДАННЫХ SQLITE (41–50)
  // ==========================================
  {
    num: 41,
    id: 'ACT_41_SQLITE_INSERT',
    title: 'Сохранить поля формы в базу SQLite',
    category: 'sqlite_db',
    description: 'Вставляет новую запись в таблицу SQLite из полей ввода формы',
    icon: 'Database',
    paramsSchema: [
      { key: 'tableName', label: 'Имя таблицы', type: 'text', defaultValue: 'Users' },
      { key: 'columnMapping', label: 'Связка полей (колонка=контрол)', type: 'text', defaultValue: 'Name=txtUsername, Role=cmbRole', placeholder: 'Column1=txt1, Column2=txt2' },
    ],
  },
  {
    num: 42,
    id: 'ACT_42_SQLITE_LOAD_GRID',
    title: 'Загрузить таблицу в DataGridView',
    category: 'sqlite_db',
    description: 'Отображает все записи таблицы SQLite в таблице DataGridView',
    icon: 'Grid',
    paramsSchema: [
      { key: 'tableName', label: 'Имя таблицы SQLite', type: 'text', defaultValue: 'Users' },
      { key: 'gridControl', label: 'DataGridView', type: 'control', defaultValue: 'dgvProducts' },
    ],
  },
  {
    num: 43,
    id: 'ACT_43_SQLITE_DELETE_ROW',
    title: 'Удалить выбранную строку из БД',
    category: 'sqlite_db',
    description: 'Удаляет активную строку из таблицы SQLite по идентификатору ID',
    icon: 'Trash2',
    paramsSchema: [
      { key: 'tableName', label: 'Имя таблицы', type: 'text', defaultValue: 'Users' },
      { key: 'gridControl', label: 'DataGridView', type: 'control', defaultValue: 'dgvProducts' },
    ],
  },
  {
    num: 44,
    id: 'ACT_44_SQLITE_UPDATE_ROW',
    title: 'Обновить данные записи (Update)',
    category: 'sqlite_db',
    description: 'Записывает отредактированные поля в существующую строку таблицы',
    icon: 'Edit',
    paramsSchema: [
      { key: 'tableName', label: 'Таблица', type: 'text', defaultValue: 'Users' },
      { key: 'updateMapping', label: 'Обновления (колонка=контрол)', type: 'text', defaultValue: 'Name=txtUsername, Price=numPrice' },
    ],
  },
  {
    num: 45,
    id: 'ACT_45_SQLITE_FILTER_GRID',
    title: 'Живой поиск / Фильтр таблицы',
    category: 'sqlite_db',
    description: 'Мгновенно фильтрует строки DataGridView по тексту из поля поиска',
    icon: 'Search',
    paramsSchema: [
      { key: 'gridControl', label: 'DataGridView', type: 'control', defaultValue: 'dgvProducts' },
      { key: 'searchColumn', label: 'Колонка для поиска', type: 'text', defaultValue: 'Наименование' },
      { key: 'searchControl', label: 'Поле ввода поиска', type: 'control', defaultValue: 'txtSearchQuery' },
    ],
  },
  {
    num: 46,
    id: 'ACT_46_SQLITE_COUNT_ROWS',
    title: 'Посчитать количество записей (COUNT)',
    category: 'sqlite_db',
    description: 'Считает общее число строк в таблице и выводит в метку',
    icon: 'Hash',
    paramsSchema: [
      { key: 'tableName', label: 'Таблица', type: 'text', defaultValue: 'Products' },
      { key: 'targetLabel', label: 'Куда вывести сумму', type: 'control', defaultValue: 'lblTotalCount' },
    ],
  },
  {
    num: 47,
    id: 'ACT_47_SQLITE_TRUNCATE',
    title: 'Очистить всю таблицу (Truncate)',
    category: 'sqlite_db',
    description: 'Полное удаление всех строк из выбранной таблицы базы данных',
    icon: 'Trash',
    paramsSchema: [
      { key: 'tableName', label: 'Имя таблицы для очистки', type: 'text', defaultValue: 'Logs' },
    ],
  },
  {
    num: 48,
    id: 'ACT_48_SQLITE_EXPORT_CSV',
    title: 'Экспорт таблицы в файл CSV / Excel',
    category: 'sqlite_db',
    description: 'Выгружает все данные DataGridView в файл электронной таблицы CSV',
    icon: 'Download',
    paramsSchema: [
      { key: 'gridControl', label: 'DataGridView', type: 'control', defaultValue: 'dgvProducts' },
      { key: 'fileName', label: 'Имя файла', type: 'text', defaultValue: 'export_data.csv' },
    ],
  },
  {
    num: 49,
    id: 'ACT_49_SQLITE_IMPORT_CSV',
    title: 'Импорт CSV в базу данных',
    category: 'sqlite_db',
    description: 'Загружает строки из файла CSV в таблицу SQLite',
    icon: 'Upload',
    paramsSchema: [
      { key: 'filePath', label: 'Путь к CSV файлу', type: 'text', defaultValue: 'import.csv' },
      { key: 'tableName', label: 'Таблица SQLite', type: 'text', defaultValue: 'Users' },
    ],
  },
  {
    num: 50,
    id: 'ACT_50_SQLITE_CUSTOM_QUERY',
    title: 'Выполнить произвольный SQL-запрос',
    category: 'sqlite_db',
    description: 'Выполняет команду SQL (SELECT / INSERT / UPDATE / DELETE)',
    icon: 'Terminal',
    paramsSchema: [
      { key: 'query', label: 'SQL Запрос', type: 'textarea', defaultValue: 'SELECT * FROM Users WHERE Role = "Admin"' },
    ],
  },

  // ==========================================
  // КАТЕГОРИЯ 6: ИНТЕРНЕТ, API И СЕТЕВЫЕ ЗАПРОСЫ (51–60)
  // ==========================================
  {
    num: 51,
    id: 'ACT_51_HTTP_GET',
    title: 'Отправить GET-запрос по API',
    category: 'network_api',
    description: 'Отправляет HTTP GET запрос и сохраняет ответ сервера в текстовое поле',
    icon: 'Globe',
    paramsSchema: [
      { key: 'url', label: 'URL-адрес API', type: 'text', defaultValue: 'https://api.github.com' },
      { key: 'targetControl', label: 'Куда записать ответ', type: 'control', defaultValue: 'txtApiResponse' },
    ],
  },
  {
    num: 52,
    id: 'ACT_52_HTTP_POST_JSON',
    title: 'Отправить POST-запрос с JSON',
    category: 'network_api',
    description: 'Упаковывает поля формы в JSON тело и отправляет на сервер',
    icon: 'Send',
    paramsSchema: [
      { key: 'url', label: 'URL-адрес API', type: 'text', defaultValue: 'https://api.site.com/auth' },
      { key: 'jsonPayload', label: 'JSON тело', type: 'textarea', defaultValue: '{\n  "login": "{txtLogin}",\n  "password": "{txtPassword}"\n}' },
    ],
  },
  {
    num: 53,
    id: 'ACT_53_DOWNLOAD_FILE',
    title: 'Скачать файл из интернета',
    category: 'network_api',
    description: 'Асинхронно скачивает файл по ссылке и сохраняет на локальный диск',
    icon: 'DownloadCloud',
    paramsSchema: [
      { key: 'url', label: 'Прямая ссылка на файл', type: 'text', defaultValue: 'https://site.com/archive.zip' },
      { key: 'destPath', label: 'Имя локального файла', type: 'text', defaultValue: 'downloaded.zip' },
    ],
  },
  {
    num: 54,
    id: 'ACT_54_CHECK_INTERNET',
    title: 'Проверить наличие интернета',
    category: 'network_api',
    description: 'Проверяет статус сетевого адаптера с ветвлением Онлайн / Офлайн',
    icon: 'Wifi',
    hasBranching: true,
    paramsSchema: [],
  },
  {
    num: 55,
    id: 'ACT_55_EXTRACT_JSON_KEY',
    title: 'Извлечь поле из JSON-ответа',
    category: 'network_api',
    description: 'Парсит JSON строку и извлекает значение конкретного ключа в метку',
    icon: 'Code2',
    paramsSchema: [
      { key: 'jsonSource', label: 'Поле с JSON строкой', type: 'control', defaultValue: 'txtApiResponse' },
      { key: 'jsonKey', label: 'Имя ключа (напр: temp или user.name)', type: 'text', defaultValue: 'temperature' },
      { key: 'targetControl', label: 'Куда записать значение', type: 'control', defaultValue: 'lblResult' },
    ],
  },
  {
    num: 56,
    id: 'ACT_56_LOAD_IMAGE_URL',
    title: 'Загрузить картинку по URL',
    category: 'network_api',
    description: 'Загружает изображение из интернета прямо в PictureBox',
    icon: 'Image',
    paramsSchema: [
      { key: 'targetControl', label: 'PictureBox', type: 'control', defaultValue: 'pictureBox1' },
      { key: 'url', label: 'Ссылка на изображение', type: 'text', defaultValue: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe' },
    ],
  },
  {
    num: 57,
    id: 'ACT_57_SEND_TELEGRAM',
    title: 'Отправить сообщение в Telegram',
    category: 'network_api',
    description: 'Отправляет текстовое оповещение в Telegram чат через бота',
    icon: 'Send',
    paramsSchema: [
      { key: 'botToken', label: 'Токен бота (Bot Token)', type: 'text', defaultValue: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11' },
      { key: 'chatId', label: 'Chat ID', type: 'text', defaultValue: '123456789' },
      { key: 'messageText', label: 'Текст сообщения', type: 'text', defaultValue: 'Новая заявка с формы!' },
    ],
  },
  {
    num: 58,
    id: 'ACT_58_WEBSOCKET_CONNECT',
    title: 'Подключиться к WebSocket',
    category: 'network_api',
    description: 'Устанавливает соединение с реальным WebSocket сервером',
    icon: 'Radio',
    paramsSchema: [
      { key: 'wsUrl', label: 'Адрес сокета (wss://)', type: 'text', defaultValue: 'wss://echo.websocket.org' },
    ],
  },
  {
    num: 59,
    id: 'ACT_59_WEBSOCKET_SEND',
    title: 'Отправить команду в WebSocket',
    category: 'network_api',
    description: 'Отправляет сообщение в открытый WebSocket канал',
    icon: 'ArrowUpRight',
    paramsSchema: [
      { key: 'message', label: 'Текст команды / JSON', type: 'text', defaultValue: 'ping' },
    ],
  },
  {
    num: 60,
    id: 'ACT_60_GET_PUBLIC_IP',
    title: 'Получить внешний IP-адрес',
    category: 'network_api',
    description: 'Узнает публичный IP-адрес компьютера через сервис ipify',
    icon: 'Shield',
    paramsSchema: [
      { key: 'targetControl', label: 'Куда вывести IP', type: 'control', defaultValue: 'lblIpAddress' },
    ],
  },

  // ==========================================
  // КАТЕГОРИЯ 7: ТАЙМЕРЫ, ВРЕМЯ И АНИМАЦИИ (61–70)
  // ==========================================
  {
    num: 61,
    id: 'ACT_61_START_TIMER',
    title: 'Запустить таймер (Start)',
    category: 'timers_anim',
    description: 'Запускает периодический таймер с заданным интервалом',
    icon: 'Play',
    paramsSchema: [
      { key: 'timerName', label: 'Имя таймера', type: 'text', defaultValue: 'timer1' },
      { key: 'intervalMs', label: 'Интервал в миллисекундах', type: 'number', defaultValue: 1000 },
    ],
  },
  {
    num: 62,
    id: 'ACT_62_STOP_TIMER',
    title: 'Остановить таймер (Stop)',
    category: 'timers_anim',
    description: 'Останавливает работу таймера',
    icon: 'Square',
    paramsSchema: [
      { key: 'timerName', label: 'Имя таймера', type: 'text', defaultValue: 'timer1' },
    ],
  },
  {
    num: 63,
    id: 'ACT_63_WAIT_DELAY',
    title: 'Пауза / Задержка (Wait)',
    category: 'timers_anim',
    description: 'Делает асинхронную паузу выполнения, не блокируя интерфейс формы',
    icon: 'Clock',
    paramsSchema: [
      { key: 'delayMs', label: 'Время ожидания (миллисекунды)', type: 'number', defaultValue: 1000 },
    ],
  },
  {
    num: 64,
    id: 'ACT_64_SHOW_CURRENT_TIME',
    title: 'Показать текущее время / дату',
    category: 'timers_anim',
    description: 'Записывает текущее системное время в выбранную метку',
    icon: 'Watch',
    paramsSchema: [
      { key: 'targetControl', label: 'Метка для вывода', type: 'control', defaultValue: 'lblTime' },
      {
        key: 'format',
        label: 'Формат',
        type: 'select',
        options: [
          { value: 'HH:mm:ss', label: 'Время (ЧЧ:ММ:СС)' },
          { value: 'dd.MM.yyyy', label: 'Дата (ДД.ММ.ГГГГ)' },
          { value: 'dd.MM.yyyy HH:mm:ss', label: 'Дата и Время' },
        ],
        defaultValue: 'HH:mm:ss',
      },
    ],
  },
  {
    num: 65,
    id: 'ACT_65_COUNTDOWN_TICK',
    title: 'Обратный отсчет (Таймер)',
    category: 'timers_anim',
    description: 'Уменьшает счетчик времени и выполняет действие при достижении 0',
    icon: 'Hourglass',
    paramsSchema: [
      { key: 'targetControl', label: 'Метка счетчика', type: 'control', defaultValue: 'lblSecondsLeft' },
    ],
  },
  {
    num: 66,
    id: 'ACT_66_DATE_DIFFERENCE',
    title: 'Вычислить разницу дат',
    category: 'timers_anim',
    description: 'Вычисляет разницу в днях между двумя датами DateTimePicker',
    icon: 'Calendar',
    paramsSchema: [
      { key: 'pickerA', label: 'Начальная дата', type: 'control', defaultValue: 'dateTimePicker1' },
      { key: 'pickerB', label: 'Конечная дата', type: 'control', defaultValue: 'dateTimePicker2' },
      { key: 'targetControl', label: 'Куда вывести количество дней', type: 'control', defaultValue: 'lblDaysDiff' },
    ],
  },
  {
    num: 67,
    id: 'ACT_67_FADE_IN_ANIMATION',
    title: 'Плавное появление формы (FadeIn)',
    category: 'timers_anim',
    description: 'Плавное нарастание прозрачности окна от 0% до 100%',
    icon: 'Sun',
    paramsSchema: [
      { key: 'speedMs', label: 'Длительность шага (мс)', type: 'number', defaultValue: 20 },
    ],
  },
  {
    num: 68,
    id: 'ACT_68_FADE_OUT_ANIMATION',
    title: 'Плавное исчезновение (FadeOut)',
    category: 'timers_anim',
    description: 'Плавное растворение прозрачности перед закрытием окна',
    icon: 'Moon',
    paramsSchema: [
      { key: 'speedMs', label: 'Длительность шага (мс)', type: 'number', defaultValue: 20 },
    ],
  },
  {
    num: 69,
    id: 'ACT_69_SHAKE_WINDOW',
    title: 'Тряска окна при ошибке (Shake)',
    category: 'timers_anim',
    description: 'Эффект горизонтального дрожания формы при неверном вводе пароля',
    icon: 'Activity',
    paramsSchema: [
      { key: 'intensity', label: 'Интенсивность смещения (px)', type: 'number', defaultValue: 10 },
    ],
  },
  {
    num: 70,
    id: 'ACT_70_STOPWATCH_TOGGLE',
    title: 'Секундомер (Старт / Стоп / Сброс)',
    category: 'timers_anim',
    description: 'Управляет высокоточным секундомером Stopwatch',
    icon: 'Timer',
    paramsSchema: [
      {
        key: 'actionType',
        label: 'Действие',
        type: 'select',
        options: [
          { value: 'Start', label: 'Запустить' },
          { value: 'Stop', label: 'Остановить' },
          { value: 'Reset', label: 'Сбросить' },
        ],
        defaultValue: 'Start',
      },
    ],
  },

  // ==========================================
  // КАТЕГОРИЯ 8: СПИСКИ, ВЫПАДАЮЩИЕ МЕНЮ И ТАБЛИЦЫ (71–80)
  // ==========================================
  {
    num: 71,
    id: 'ACT_71_ADD_LIST_ITEM',
    title: 'Добавить строку в список (ListBox / ComboBox)',
    category: 'lists_tables',
    description: 'Добавляет новый элемент в список из текстового поля',
    icon: 'Plus',
    paramsSchema: [
      { key: 'targetControl', label: 'ListBox или ComboBox', type: 'control', defaultValue: 'listBox1' },
      { key: 'sourceControl', label: 'Откуда взять текст', type: 'control', defaultValue: 'txtNewItem' },
    ],
  },
  {
    num: 72,
    id: 'ACT_72_REMOVE_LIST_ITEM',
    title: 'Удалить выбранную строку',
    category: 'lists_tables',
    description: 'Удаляет текущий выделенный пункт из списка',
    icon: 'Minus',
    paramsSchema: [
      { key: 'targetControl', label: 'ListBox или ComboBox', type: 'control', defaultValue: 'listBox1' },
    ],
  },
  {
    num: 73,
    id: 'ACT_73_CLEAR_LIST_ITEMS',
    title: 'Очистить весь список',
    category: 'lists_tables',
    description: 'Удаляет все элементы из ListBox или ComboBox',
    icon: 'Trash2',
    paramsSchema: [
      { key: 'targetControl', label: 'Список', type: 'control', defaultValue: 'listBox1' },
    ],
  },
  {
    num: 74,
    id: 'ACT_74_SORT_LIST',
    title: 'Сортировать список (А–Я)',
    category: 'lists_tables',
    description: 'Сортирует элементы списка в алфавитном порядке',
    icon: 'ArrowDownAZ',
    paramsSchema: [
      { key: 'targetControl', label: 'Список', type: 'control', defaultValue: 'listBox1' },
    ],
  },
  {
    num: 75,
    id: 'ACT_75_GET_SELECTED_TEXT',
    title: 'Получить выбранный текст',
    category: 'lists_tables',
    description: 'Переносит текст выделенного пункта списка в текстовое поле',
    icon: 'Check',
    paramsSchema: [
      { key: 'sourceControl', label: 'Список', type: 'control', defaultValue: 'listBox1' },
      { key: 'targetControl', label: 'Куда записать', type: 'control', defaultValue: 'txtSelectedItem' },
    ],
  },
  {
    num: 76,
    id: 'ACT_76_SELECT_BY_INDEX',
    title: 'Выбрать элемент по номеру',
    category: 'lists_tables',
    description: 'Устанавливает выбранным элемент с указанным индексом (0 — первый)',
    icon: 'ListOrdered',
    paramsSchema: [
      { key: 'targetControl', label: 'Список / Меню', type: 'control', defaultValue: 'comboBox1' },
      { key: 'index', label: 'Индекс строки (с 0)', type: 'number', defaultValue: 0 },
    ],
  },
  {
    num: 77,
    id: 'ACT_77_CHECK_LIST_CONTAINS',
    title: 'Проверить наличие в списке',
    category: 'lists_tables',
    description: 'Проверяет, есть ли элемент в списке, с ветвлением Найдено / Не найдено',
    icon: 'Search',
    hasBranching: true,
    paramsSchema: [
      { key: 'targetControl', label: 'Список', type: 'control', defaultValue: 'listBox1' },
      { key: 'searchText', label: 'Искомый текст', type: 'text', defaultValue: 'Admin' },
    ],
  },
  {
    num: 78,
    id: 'ACT_78_ADD_TREE_NODE',
    title: 'Добавить узел в дерево TreeView',
    category: 'lists_tables',
    description: 'Добавляет дочерний узел к выбранной ветке дерева TreeView',
    icon: 'FolderTree',
    paramsSchema: [
      { key: 'treeControl', label: 'TreeView', type: 'control', defaultValue: 'treeView1' },
      { key: 'nodeText', label: 'Название узла', type: 'text', defaultValue: 'Новая папка' },
    ],
  },
  {
    num: 79,
    id: 'ACT_79_SHUFFLE_LIST',
    title: 'Перемешать элементы случайно',
    category: 'lists_tables',
    description: 'Случайно перемешивает порядок строк списка (для викторин и тестов)',
    icon: 'Shuffle',
    paramsSchema: [
      { key: 'targetControl', label: 'Список', type: 'control', defaultValue: 'listBox1' },
    ],
  },
  {
    num: 80,
    id: 'ACT_80_SAVE_LIST_TXT',
    title: 'Сохранить список в файл TXT',
    category: 'lists_tables',
    description: 'Выгружает все строки списка в текстовый файл на диске',
    icon: 'Save',
    paramsSchema: [
      { key: 'sourceControl', label: 'Список', type: 'control', defaultValue: 'listBox1' },
      { key: 'filePath', label: 'Имя файла', type: 'text', defaultValue: 'list.txt' },
    ],
  },

  // ==========================================
  // КАТЕГОРИЯ 9: ФАЙЛЫ, ПАПКИ И ДИСК (81–90)
  // ==========================================
  {
    num: 81,
    id: 'ACT_81_READ_TEXT_FILE',
    title: 'Прочитать текстовый файл',
    category: 'files_disk',
    description: 'Считывает всё содержимое файла с диска и помещает в TextBox',
    icon: 'FileText',
    paramsSchema: [
      { key: 'filePath', label: 'Путь к файлу', type: 'text', defaultValue: 'data.txt' },
      { key: 'targetControl', label: 'Куда записать текст', type: 'control', defaultValue: 'txtFileContent' },
    ],
  },
  {
    num: 82,
    id: 'ACT_82_WRITE_TEXT_FILE',
    title: 'Записать текст в файл',
    category: 'files_disk',
    description: 'Записывает текст из поля ввода в файл (перезапись)',
    icon: 'Save',
    paramsSchema: [
      { key: 'filePath', label: 'Путь к файлу', type: 'text', defaultValue: 'data.txt' },
      { key: 'sourceControl', label: 'Откуда взять текст', type: 'control', defaultValue: 'txtFileContent' },
    ],
  },
  {
    num: 83,
    id: 'ACT_83_APPEND_TEXT_FILE',
    title: 'Дописать строку в конец файла',
    category: 'files_disk',
    description: 'Добавляет новую строку в файл без стирания старых записей (логгирование)',
    icon: 'FilePlus',
    paramsSchema: [
      { key: 'filePath', label: 'Путь к файлу лога', type: 'text', defaultValue: 'log.txt' },
      { key: 'logMessage', label: 'Текст для записи', type: 'text', defaultValue: 'Пользователь вошел в систему' },
    ],
  },
  {
    num: 84,
    id: 'ACT_84_CHECK_FILE_EXISTS',
    title: 'Проверить существование файла',
    category: 'files_disk',
    description: 'Проверяет наличие файла на диске с ветвлением Есть / Нет',
    icon: 'FileCheck',
    hasBranching: true,
    paramsSchema: [
      { key: 'filePath', label: 'Путь к файлу', type: 'text', defaultValue: 'config.json' },
    ],
  },
  {
    num: 85,
    id: 'ACT_85_DELETE_FILE',
    title: 'Удалить файл с диска',
    category: 'files_disk',
    description: 'Удаляет указанный файл с дискового накопителя',
    icon: 'FileX',
    paramsSchema: [
      { key: 'filePath', label: 'Путь к файлу для удаления', type: 'text', defaultValue: 'temp.txt' },
    ],
  },
  {
    num: 86,
    id: 'ACT_86_CREATE_DIRECTORY',
    title: 'Создать новую папку',
    category: 'files_disk',
    description: 'Создает новую директорию на диске',
    icon: 'FolderPlus',
    paramsSchema: [
      { key: 'dirPath', label: 'Имя папки', type: 'text', defaultValue: 'Reports' },
    ],
  },
  {
    num: 87,
    id: 'ACT_87_GET_DIR_FILES',
    title: 'Получить список файлов в папке',
    category: 'files_disk',
    description: 'Загружает все имена файлов из указанной папки в ListBox',
    icon: 'Folder',
    paramsSchema: [
      { key: 'folderPath', label: 'Путь к папке', type: 'text', defaultValue: './Documents' },
      { key: 'targetList', label: 'Целевой ListBox', type: 'control', defaultValue: 'listBox1' },
    ],
  },
  {
    num: 88,
    id: 'ACT_88_GET_FILE_SIZE',
    title: 'Узнать размер файла',
    category: 'files_disk',
    description: 'Определяет размер файла в килобайтах и выводит в метку',
    icon: 'HardDrive',
    paramsSchema: [
      { key: 'filePath', label: 'Путь к файлу', type: 'text', defaultValue: 'image.png' },
      { key: 'targetControl', label: 'Метка для вывода размера', type: 'control', defaultValue: 'lblFileSize' },
    ],
  },
  {
    num: 89,
    id: 'ACT_89_SAVE_SETTING_INI',
    title: 'Сохранить настройку в INI / JSON',
    category: 'files_disk',
    description: 'Сохраняет пару Ключ-Значение в локальный конфигурационный файл',
    icon: 'Settings',
    paramsSchema: [
      { key: 'settingKey', label: 'Ключ настройки', type: 'text', defaultValue: 'Theme' },
      { key: 'settingValue', label: 'Значение', type: 'text', defaultValue: 'Dark' },
    ],
  },
  {
    num: 90,
    id: 'ACT_90_LOAD_SETTING_INI',
    title: 'Прочитать настройку из INI / JSON',
    category: 'files_disk',
    description: 'Считывает сохраненную настройку по ключу и применяет к полю',
    icon: 'FileCode',
    paramsSchema: [
      { key: 'settingKey', label: 'Ключ настройки', type: 'text', defaultValue: 'Theme' },
      { key: 'targetControl', label: 'Куда применить значение', type: 'control', defaultValue: 'cmbTheme' },
    ],
  },

  // ==========================================
  // КАТЕГОРИЯ 10: ЗВУК, МУЛЬТИМЕДИА И СИСТЕМА (91–100)
  // ==========================================
  {
    num: 91,
    id: 'ACT_91_PLAY_SOUND_FILE',
    title: 'Воспроизвести звук WAV / MP3',
    category: 'sound_system',
    description: 'Проигрывает звуковой аудиофайл с диска через SoundPlayer',
    icon: 'Music',
    paramsSchema: [
      { key: 'soundPath', label: 'Путь к аудиофайлу (.wav)', type: 'text', defaultValue: 'click.wav' },
    ],
  },
  {
    num: 92,
    id: 'ACT_92_STOP_SOUND',
    title: 'Остановить воспроизведение',
    category: 'sound_system',
    description: 'Останавливает текущий играющий звуковой поток',
    icon: 'VolumeX',
    paramsSchema: [],
  },
  {
    num: 93,
    id: 'ACT_93_TAKE_SCREENSHOT',
    title: 'Сделать скриншот окна / экрана',
    category: 'sound_system',
    description: 'Делает снимок окна приложения и сохраняет в PictureBox или файл',
    icon: 'Camera',
    paramsSchema: [
      { key: 'targetPicture', label: 'Куда поместить снимок (PictureBox)', type: 'control', defaultValue: 'pictureBox1' },
    ],
  },
  {
    num: 94,
    id: 'ACT_94_LAUNCH_PROCESS',
    title: 'Запустить внешнюю программу',
    category: 'sound_system',
    description: 'Запускает внешнее приложение ОС (напр. calc.exe, notepad.exe)',
    icon: 'PlaySquare',
    paramsSchema: [
      { key: 'programName', label: 'Имя программы или путь (.exe)', type: 'text', defaultValue: 'calc.exe' },
    ],
  },
  {
    num: 95,
    id: 'ACT_95_GET_USERNAME',
    title: 'Узнать имя пользователя ПК',
    category: 'sound_system',
    description: 'Определяет логин текущей учетной записи Windows (Environment.UserName)',
    icon: 'User',
    paramsSchema: [
      { key: 'targetControl', label: 'Метка для вывода логина', type: 'control', defaultValue: 'lblUserName' },
    ],
  },
  {
    num: 96,
    id: 'ACT_96_GET_SCREEN_RESOLUTION',
    title: 'Узнать разрешение монитора',
    category: 'sound_system',
    description: 'Определяет ширину и высоту экрана в пикселях (напр. 1920x1080)',
    icon: 'Monitor',
    paramsSchema: [
      { key: 'targetControl', label: 'Куда записать разрешение', type: 'control', defaultValue: 'lblResolution' },
    ],
  },
  {
    num: 97,
    id: 'ACT_97_LOCK_RESIZING',
    title: 'Заблокировать изменение размера окна',
    category: 'sound_system',
    description: 'Фиксирует размер формы и убирает кнопку развертывания на весь экран',
    icon: 'Lock',
    paramsSchema: [],
  },
  {
    num: 98,
    id: 'ACT_98_SET_TOP_MOST',
    title: 'Сделать окно поверх всех (TopMost)',
    category: 'sound_system',
    description: 'Закрепляет форму поверх всех остальных открытых программ',
    icon: 'Pin',
    paramsSchema: [
      {
        key: 'isTopMost',
        label: 'Поверх всех',
        type: 'select',
        options: [
          { value: 'true', label: 'Да (TopMost = true)' },
          { value: 'false', label: 'Нет (TopMost = false)' },
        ],
        defaultValue: 'true',
      },
    ],
  },
  {
    num: 99,
    id: 'ACT_99_ROTATE_IMAGE',
    title: 'Повернуть картинку PictureBox',
    category: 'sound_system',
    description: 'Поворачивает изображение в PictureBox на 90, 180 или 270 градусов',
    icon: 'RotateCw',
    paramsSchema: [
      { key: 'targetPicture', label: 'PictureBox', type: 'control', defaultValue: 'pictureBox1' },
      {
        key: 'angle',
        label: 'Угол поворота',
        type: 'select',
        options: [
          { value: 'Rotate90FlipNone', label: '90° по часовой' },
          { value: 'Rotate180FlipNone', label: '180°' },
          { value: 'Rotate270FlipNone', label: '270°' },
        ],
        defaultValue: 'Rotate90FlipNone',
      },
    ],
  },
  {
    num: 100,
    id: 'ACT_100_EXIT_APPLICATION',
    title: 'Полный выход из программы (Kill)',
    category: 'sound_system',
    description: 'Мгновенно завершает все процессы приложения (Environment.Exit(0))',
    icon: 'Power',
    paramsSchema: [],
  },
];
