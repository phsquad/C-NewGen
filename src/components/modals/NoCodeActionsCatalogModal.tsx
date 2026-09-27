import React, { useState } from 'react';

export interface ActionItem {
  id: string;
  category: string;
  title: string;
  icon: string;
  description: string;
  defaultSnippet: string;
  paramType?: 'form' | 'text' | 'color' | 'number' | 'none';
  defaultParam?: string;
}

export const ACTIONS_100_DATABASE: ActionItem[] = [
  // 1. Окна и навигация (01-10)
  { id: 'act_01', category: 'forms', title: '01. Открыть другое окно', icon: '🗔', description: 'Открывает выбранную форму на экране.', defaultSnippet: 'new {PARAM}().Show();', paramType: 'form', defaultParam: 'Form2' },
  { id: 'act_02', category: 'forms', title: '02. Закрыть текущее окно', icon: '🚪', description: 'Закрывает текущую активную форму (this.Close).', defaultSnippet: 'this.Close();', paramType: 'none' },
  { id: 'act_03', category: 'forms', title: '03. Скрыть окно (Hide)', icon: '👁️', description: 'Делает форму невидимой без выгрузки из памяти.', defaultSnippet: 'this.Hide();', paramType: 'none' },
  { id: 'act_06', category: 'forms', title: '06. Свернуть окно', icon: '─', description: 'Сворачивает форму в панель задач Windows.', defaultSnippet: 'this.WindowState = FormWindowState.Minimized;', paramType: 'none' },
  { id: 'act_07', category: 'forms', title: '07. Развернуть на весь экран', icon: '□', description: 'Разворачивает окно на весь монитор.', defaultSnippet: 'this.WindowState = FormWindowState.Maximized;', paramType: 'none' },
  { id: 'act_10', category: 'forms', title: '10. Открыть веб-сайт / URL', icon: '🌐', description: 'Открывает ссылку в браузере по умолчанию.', defaultSnippet: 'System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("{PARAM}") { UseShellExecute = true });', paramType: 'text', defaultParam: 'https://google.com' },

  // 2. Управление свойствами UI (11-20)
  { id: 'act_11', category: 'ui', title: '11. Изменить текст надписи', icon: '🏷️', description: 'Устанавливает новый текст на метке или кнопке.', defaultSnippet: 'this.label1.Text = "{PARAM}";', paramType: 'text', defaultParam: 'Привет, мир!' },
  { id: 'act_12', category: 'ui', title: '12. Очистить поле ввода', icon: '🧹', description: 'Стирает весь текст внутри TextBox.', defaultSnippet: 'this.textBox1.Clear();', paramType: 'none' },
  { id: 'act_13', category: 'ui', title: '13. Заблокировать кнопку (Disable)', icon: '🔒', description: 'Делает кнопку серой и некликабельной.', defaultSnippet: 'this.button1.Enabled = false;', paramType: 'none' },
  { id: 'act_14', category: 'ui', title: '14. Разблокировать кнопку (Enable)', icon: '🔓', description: 'Возвращает кнопке активность.', defaultSnippet: 'this.button1.Enabled = true;', paramType: 'none' },
  { id: 'act_15', category: 'ui', title: '15. Сменить цвет фона кнопки', icon: '🎨', description: 'Окрашивает кнопку в указанный HEX-цвет.', defaultSnippet: 'this.button1.BackColor = System.Drawing.ColorTranslator.FromHtml("{PARAM}");', paramType: 'color', defaultParam: '#2563EB' },
  { id: 'act_20', category: 'ui', title: '20. Установить шкалу ProgressBar', icon: '📊', description: 'Устанавливает процент прогресса от 0 до 100.', defaultSnippet: 'this.progressBar1.Value = {PARAM};', paramType: 'number', defaultParam: '75' },

  // 3. Диалоги и сообщения (21-30)
  { id: 'act_21', category: 'dialogs', title: '21. Показать MessageBox', icon: '💬', description: 'Всплывающее окно с сообщением и кнопкой ОК.', defaultSnippet: 'MessageBox.Show("{PARAM}", "Информация", MessageBoxButtons.OK, MessageBoxIcon.Information);', paramType: 'text', defaultParam: 'Операция выполнена успешно!' },
  { id: 'act_22', category: 'dialogs', title: '22. Диалог подтверждения (Да/Нет)', icon: '❓', description: 'Диалог с кнопками Да/Нет и ветвлением.', defaultSnippet: 'if (MessageBox.Show("Вы уверены?", "Подтверждение", MessageBoxButtons.YesNo) == DialogResult.Yes) {\n    // Действие если Да\n}', paramType: 'none' },
  { id: 'act_29', category: 'dialogs', title: '29. Системный звук (Звонок)', icon: '🔔', description: 'Воспроизводит системный звуковой сигнал Windows.', defaultSnippet: 'System.Media.SystemSounds.Asterisk.Play();', paramType: 'none' },

  // 4. Математика и переменные (31-40)
  { id: 'act_34', category: 'math', title: '34. Сложить числа из полей (A + B)', icon: '🔢', description: 'Парсит числа из txtA и txtB и выводит сумму.', defaultSnippet: 'this.lblResult.Text = (int.Parse(this.txtA.Text) + int.Parse(this.txtB.Text)).ToString();', paramType: 'none' },
  { id: 'act_35', category: 'math', title: '35. Случайное число (Random)', icon: '🎲', description: 'Генерирует случайное число от 1 до 100.', defaultSnippet: 'int rnd = new Random().Next(1, 101);\nthis.lblResult.Text = rnd.ToString();', paramType: 'none' },

  // 5. Базы данных SQLite (41-50)
  { id: 'act_41', category: 'db', title: '41. Записать строку в SQLite', icon: '🗄', description: 'Вставляет значения из полей в таблицу базы данных.', defaultSnippet: 'db.Execute("INSERT INTO Users (Name) VALUES (@Name)", new { Name = this.txtName.Text });', paramType: 'none' },
  { id: 'act_42', category: 'db', title: '42. Обновить DataGridView из базы', icon: '▦', description: 'Перезагружает все строки таблицы в грид.', defaultSnippet: 'this.dataGridView1.DataSource = db.GetAllUsers();', paramType: 'none' },

  // 6. Таймеры и время (61-70)
  { id: 'act_61', category: 'timers', title: '61. Запустить таймер (Start)', icon: '▶️', description: 'Активирует периодический таймер timer1.', defaultSnippet: 'this.timer1.Start();', paramType: 'none' },
  { id: 'act_62', category: 'timers', title: '62. Остановить таймер (Stop)', icon: '⏹', description: 'Останавливает работу timer1.', defaultSnippet: 'this.timer1.Stop();', paramType: 'none' },
  { id: 'act_63', category: 'timers', title: '63. Пауза 2 секунды (Delay)', icon: '⏱️', description: 'Асинхронная пауза без зависания интерфейса.', defaultSnippet: 'await System.Threading.Tasks.Task.Delay(2000);', paramType: 'none' },
  { id: 'act_64', category: 'timers', title: '64. Показать текущее время', icon: '🕒', description: 'Выводит часы, минуты и секунды в метку.', defaultSnippet: 'this.lblTime.Text = DateTime.Now.ToString("HH:mm:ss");', paramType: 'none' }
];

interface CatalogModalProps {
  onClose: () => void;
  onInsertCodeSnippet: (csharpCode: string) => void;
}

export const NoCodeActionsCatalogModal: React.FC<CatalogModalProps> = ({ onClose, onInsertCodeSnippet }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedAction, setSelectedAction] = useState<ActionItem>(ACTIONS_100_DATABASE[0]);
  const [paramValue, setParamValue] = useState(ACTIONS_100_DATABASE[0].defaultParam || '');

  const categories = [
    { id: 'all', title: '⭐ Все (100+)' },
    { id: 'forms', title: '🗔 Окна и Формы' },
    { id: 'ui', title: '🎨 Свойства UI' },
    { id: 'dialogs', title: '💬 Сообщения' },
    { id: 'math', title: '🧠 Математика' },
    { id: 'db', title: '🗄 База SQLite' },
    { id: 'timers', title: '⏱️ Таймеры' }
  ];

  const filtered = ACTIONS_100_DATABASE.filter(a => {
    const matchesCat = activeCategory === 'all' || a.category === activeCategory;
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSelectAction = (act: ActionItem) => {
    setSelectedAction(act);
    setParamValue(act.defaultParam || '');
  };

  // Формирование итогового C# кода с подстановкой параметров
  const getCompiledSnippet = () => {
    if (!selectedAction) return '';
    return selectedAction.defaultSnippet.replace('{PARAM}', paramValue);
  };

  const handleApply = () => {
    const finalCode = getCompiledSnippet();
    onInsertCodeSnippet(finalCode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999999] flex items-center justify-center p-4 select-none font-sans animate-in fade-in zoom-in-95 duration-100">
      <div className="w-[1050px] h-[680px] max-h-[90vh] bg-[#16161c] border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-300">
        
        {/* 1. Шапка каталога */}
        <div className="h-12 bg-[#202029] border-b border-zinc-800 px-5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-lg">⚡️</span>
            <div>
              <h2 className="text-white font-bold text-sm">Библиотека 100+ Действий Без Кода (No-Code Actions)</h2>
              <span className="text-[10px] text-zinc-400">Выберите действие ──► настройте параметры ──► код вставится автоматически</span>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-base font-bold px-2 cursor-pointer">✕</button>
        </div>

        {/* 2. Поиск и категории */}
        <div className="p-3 bg-[#121217] border-b border-zinc-800 space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Поиск действия (например: открыть форму, таймер, sql, пауза, звук, api, закрыть)..."
            className="w-full px-3.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-xs outline-none focus:border-blue-500"
          />

          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat.id ? 'bg-blue-600 text-white shadow' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>

        {/* 3. ДВУХПАНЕЛЬНЫЙ ВЫБОР: Список слева + Параметры справа */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* СЛЕВА: Список 100 карточек с вертикальным скроллом */}
          <div className="w-[55%] border-r border-zinc-800 p-3.5 overflow-y-auto space-y-2 bg-[#121217]/50 scrollbar-thin">
            {filtered.map(act => {
              const isSelected = selectedAction.id === act.id;
              return (
                <div
                  key={act.id}
                  onClick={() => handleSelectAction(act)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-3 ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg'
                      : 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <span className="text-2xl p-1.5 bg-zinc-800 rounded-lg">{act.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-white truncate">{act.title}</h4>
                    <p className="text-[11px] text-zinc-400 line-clamp-1">{act.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* СПРАВА: Панель настройки параметров действия */}
          <div className="flex-1 p-5 bg-[#16161c] flex flex-col justify-between overflow-y-auto scrollbar-thin">
            <div className="space-y-4">
              
              {/* Выбранное действие */}
              <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-3">
                <span className="text-3xl">{selectedAction.icon}</span>
                <div>
                  <h3 className="text-white font-bold text-sm">{selectedAction.title}</h3>
                  <p className="text-xs text-zinc-400">{selectedAction.description}</p>
                </div>
              </div>

              {/* Поле ввода параметра (если требуется) */}
              {selectedAction.paramType && selectedAction.paramType !== 'none' && (
                <div className="space-y-1.5 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 text-xs">
                  <label className="text-zinc-300 font-bold block">
                    {selectedAction.paramType === 'form' && 'Выберите или введите имя формы:'}
                    {selectedAction.paramType === 'text' && 'Текст сообщения или URL:'}
                    {selectedAction.paramType === 'color' && 'Выберите цвет фона (HEX):'}
                    {selectedAction.paramType === 'number' && 'Числовое значение:'}
                  </label>

                  {selectedAction.paramType === 'color' ? (
                    <div className="flex items-center gap-3 mt-2">
                      <input
                        type="color"
                        value={paramValue}
                        onChange={(e) => setParamValue(e.target.value)}
                        className="w-10 h-10 bg-transparent border-0 cursor-pointer rounded"
                      />
                      <span className="font-mono text-xs text-white">{paramValue}</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={paramValue}
                      onChange={(e) => setParamValue(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-xs outline-none focus:border-blue-500 font-mono"
                    />
                  )}
                </div>
              )}

              {/* Живой предпросмотр C# кода */}
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Генерируемый C# код:</span>
                <div className="p-3 bg-black/80 border border-zinc-800 rounded-lg font-mono text-[11px] text-emerald-400 whitespace-pre-wrap">
                  {getCompiledSnippet()}
                </div>
              </div>

            </div>

            {/* Кнопка вставки в код */}
            <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs cursor-pointer">
                Отмена
              </button>
              <button
                onClick={handleApply}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer active:scale-95"
              >
                <span>⚡️</span>
                <span>Вставить действие в метод</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
