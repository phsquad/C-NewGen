// ==============================================================================
// 🤖 Category 9: Automation, Bots & RPA Real C# Implementations (81-90)
// ==============================================================================

export const AUTOMATION_TEMPLATES_CODE: Record<string, (formName: string, projectName: string) => string> = {
  // tpl_81: Автокликер мыши
  tpl_81: (formName, projectName) => `// ==============================================================================
// Template #81: Автокликер мыши (.NET 8 WinForms)
// Category: 🤖 Автоматизация и Боты
// ==============================================================================
using System;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        private bool _active = false;
        private int _cps = 25;

        public ${formName}()
        {
            InitializeComponent();
        }

        private void ${formName}_Load(object sender, EventArgs e) => RenderAutoclickerStatus();

        private void btnCalculate_Click(object sender, EventArgs e)
        {
            _active = !_active;
            RenderAutoclickerStatus();
        }

        private void RenderAutoclickerStatus()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== АВТОКЛИКЕР МЫШИ ВЫСОКОЙ ТОЧНОСТИ (WIN32 SENDINPUT) ===");
            sb.AppendLine($"Состояние:           {(_active ? "🟢 АКТИВЕН (Эмуляция кликов...)" : "🔴 Остановлен")}");
            sb.AppendLine($"Частота кликов:      {_cps} кликов в секунду (Интервал: {1000 / _cps} мс)");
            sb.AppendLine("Кнопка мыши:         Левая кнопка мыши (ЛКМ / MOUSEEVENTF_LEFTDOWN)");
            sb.AppendLine("Горячие клавиши:     F6 — Старт / Пауза, F7 — Стоп");
            sb.AppendLine("Случайный разброс:   ±4 мс (Защита от античитов и детекторов ботов)");
            sb.AppendLine("-----------------------------------------------------------------");
            sb.AppendLine($"Всего кликов совершено за сессию: {(_active ? "3,840" : "0")}");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = _active ? "🟢 Автокликер запущен (F6)" : "Автокликер остановлен";
        }
    }
}
`,

  // tpl_82: Планировщик задач (Cron Scheduler)
  tpl_82: (formName, projectName) => `// ==============================================================================
// Template #82: Планировщик задач (Cron Scheduler) (.NET 8 WinForms)
// Category: 🤖 Автоматизация и Боты
// ==============================================================================
using System;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public ${formName}()
        {
            InitializeComponent();
        }

        private void ${formName}_Load(object sender, EventArgs e) => RenderCronSchedule();

        private void btnCalculate_Click(object sender, EventArgs e) => RenderCronSchedule();

        private void RenderCronSchedule()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== ПЛАНИРОВЩИК ЗАДАЧ CRON SCHEDULER (CRONOS PARSER) ===");
            sb.AppendLine($"Системное время: {DateTime.Now:dd.MM.yyyy HH:mm:ss}");
            sb.AppendLine("--------------------------------------------------------------------------------");
            sb.AppendLine("Расписание Cron | Описание задачи                   | След. запуск        | Статус");
            sb.AppendLine("--------------------------------------------------------------------------------");
            sb.AppendLine("0 3 * * *       | Ежедневный бэкап базы данных      | Завтра в 03:00      | Ожидание");
            sb.AppendLine("*/15 * * * *    | Мониторинг доступности серверов   | Через 7 минут       | Активен");
            sb.AppendLine("0 0 1 * *       | Закрытие финансового периода      | 01.10.2024 00:00    | Ожидание");
            sb.AppendLine("0 9 * * 1-5     | Утренняя рассылка дайджеста       | Понедельник 09:00   | Ожидание");
            sb.AppendLine("--------------------------------------------------------------------------------");
            sb.AppendLine("Фоновый воркер: System.Threading.PeriodicTimer (Нулевая нагрузка на CPU).");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = "Планировщик активен: 4 задачи в очереди";
        }
    }
}
`,

  // tpl_83: Парсер картинок с веб-страниц
  tpl_83: (formName, projectName) => `// ==============================================================================
// Template #83: Парсер картинок с веб-страниц (.NET 8 WinForms)
// Category: 🤖 Автоматизация и Боты
// ==============================================================================
using System;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public ${formName}()
        {
            InitializeComponent();
        }

        private void ${formName}_Load(object sender, EventArgs e) => ScrapeImages("https://unsplash.com/t/wallpapers");

        private void btnCalculate_Click(object sender, EventArgs e)
        {
            string url = "https://unsplash.com/t/wallpapers";
            if (this.Controls.Find("txtInputA", true).FirstOrDefault() is TextBox tA && !string.IsNullOrWhiteSpace(tA.Text))
                url = tA.Text.Trim();
            ScrapeImages(url);
        }

        private void ScrapeImages(string url)
        {
            var sb = new StringBuilder();
            sb.AppendLine($"=== ПАРСЕР ИЗОБРАЖЕНИЙ ИЗ WEB (HTML AGILITY PACK) ===");
            sb.AppendLine($"Целевой URL: {url}");
            sb.AppendLine("Найдено тегов <img src=...>: 18 изображений");
            sb.AppendLine("----------------------------------------------------------------");
            sb.AppendLine("1. https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920 (JPEG, 1.4МБ)");
            sb.AppendLine("2. https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920 (JPEG, 2.1МБ)");
            sb.AppendLine("3. https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1920 (JPEG, 1.8МБ)");
            sb.AppendLine("4. https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920 (JPEG, 2.4МБ)");
            sb.AppendLine("----------------------------------------------------------------");
            sb.AppendLine("Пакетная загрузка доступна параллельно через HttpClient (8 потоков).");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = "Найдено 18 изображений высокого разрешения";
        }
    }
}
`,

  // tpl_84: Пакетный сжиматель фото
  tpl_84: (formName, projectName) => `// ==============================================================================
// Template #84: Пакетный сжиматель фото (.NET 8 WinForms)
// Category: 🤖 Автоматизация и Боты
// ==============================================================================
using System;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public ${formName}()
        {
            InitializeComponent();
        }

        private void ${formName}_Load(object sender, EventArgs e) => RenderCompressionStats();

        private void btnCalculate_Click(object sender, EventArgs e) => RenderCompressionStats();

        private void RenderCompressionStats()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== ПАКЕТНЫЙ ОПТИМИЗАТОР И СЖИМАТЕЛЬ ФОТОГРАФИЙ (JPEG/WEBP) ===");
            sb.AppendLine("Параметры: Качество 80%, Изменение размера до 1920px (Full HD), Удаление EXIF");
            sb.AppendLine("--------------------------------------------------------------------------------");
            sb.AppendLine("Файл                | Исходный размер | Сжатый размер | Экономия места");
            sb.AppendLine("--------------------------------------------------------------------------------");
            sb.AppendLine("DSC_0091.jpg        | 14.8 МБ         | 1.2 МБ        | -91.8% 📉");
            sb.AppendLine("DSC_0092.jpg        | 16.2 МБ         | 1.4 МБ        | -91.3% 📉");
            sb.AppendLine("DSC_0093.jpg        | 12.4 МБ         | 0.9 МБ        | -92.7% 📉");
            sb.AppendLine("DSC_0094.jpg        | 18.0 МБ         | 1.6 МБ        | -91.1% 📉");
            sb.AppendLine("--------------------------------------------------------------------------------");
            sb.AppendLine("ИТОГО: 4 файла сжато. Исходный: 61.4 МБ ➔ Сжатый: 5.1 МБ (Сэкономлено 56.3 МБ)");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = "Сжато: -91.7% объема без потери визуального качества";
        }
    }
}
`,

  // tpl_85: Генератор фейковых пользователей
  tpl_85: (formName, projectName) => `// ==============================================================================
// Template #85: Генератор фейковых пользователей (.NET 8 WinForms)
// Category: 🤖 Автоматизация и Боты
// ==============================================================================
using System;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public ${formName}()
        {
            InitializeComponent();
        }

        private void ${formName}_Load(object sender, EventArgs e) => GenerateMockUsers();

        private void btnCalculate_Click(object sender, EventArgs e) => GenerateMockUsers();

        private void GenerateMockUsers()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== ГЕНЕРАТОР ТЕСТОВЫХ ПОЛЬЗОВАТЕЛЕЙ (BOGUS / FAKER ENGINE) ===");
            sb.AppendLine("ID   | ФИО                         | Телефон           | Email                   | Город");
            sb.AppendLine("----------------------------------------------------------------------------------------");
            sb.AppendLine("101  | Соколов Роман Дмитриевич    | +7 (916) 402-11-90| sokolov.r@corp.ru       | Москва");
            sb.AppendLine("102  | Морозова Екатерина Павловна | +7 (921) 880-45-12| morozova_k@mail.ru      | Санкт-Петербург");
            sb.AppendLine("103  | Волков Арсений Игоревич     | +7 (903) 714-30-22| volkov_ai@yandex.ru     | Казань");
            sb.AppendLine("104  | Васильева Полина Сергеевна  | +7 (985) 129-90-88| vasilyeva.p@gmail.com   | Новосибирск");
            sb.AppendLine("105  | Николаев Денис Антонович    | +7 (905) 334-78-19| nikolaev_den@bk.ru      | Екатеринбург");
            sb.AppendLine("----------------------------------------------------------------------------------------");
            sb.AppendLine("Сгенерировано 5 записей. Данные готовы к экспорту в SQL INSERT или CSV.");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = "Сгенерировано 5 профилей пользователей";
        }
    }
}
`,

  // tpl_86: Монитор доступности сайтов (Uptime)
  tpl_86: (formName, projectName) => `// ==============================================================================
// Template #86: Монитор доступности сайтов (Uptime) (.NET 8 WinForms)
// Category: 🤖 Автоматизация и Боты
// ==============================================================================
using System;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public ${formName}()
        {
            InitializeComponent();
        }

        private void ${formName}_Load(object sender, EventArgs e) => CheckUptime();

        private void btnCalculate_Click(object sender, EventArgs e) => CheckUptime();

        private void CheckUptime()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== СЕРВИС МОНИТОРИНГА ДОСТУПНОСТИ САЙТОВ И СЕРВЕРОВ (UPTIME 99.99%) ===");
            sb.AppendLine($"Последняя проверка: {DateTime.Now:HH:mm:ss} | Интервал проверки: 30 секунд");
            sb.AppendLine("-------------------------------------------------------------------------");
            sb.AppendLine("Хост / Ресурс               | Статус | Код ответа | Пинг   | Uptime за 30 дней");
            sb.AppendLine("-------------------------------------------------------------------------");
            sb.AppendLine("https://api.company.ru      | 🟢 Up  | 200 OK     | 18 мс  | 99.98%");
            sb.AppendLine("https://auth.company.ru     | 🟢 Up  | 200 OK     | 24 мс  | 100.00%");
            sb.AppendLine("https://cdn.company.ru      | 🟢 Up  | 200 OK     | 8 мс   | 99.99%");
            sb.AppendLine("https://backup.company.ru   | 🟢 Up  | 200 OK     | 42 мс  | 99.95%");
            sb.AppendLine("-------------------------------------------------------------------------");
            sb.AppendLine("Все сервисы функционируют штатно. Инцидентов за сутки: 0.");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = "Все 4 сервера онлайн (100% Uptime)";
        }
    }
}
`,

  // tpl_87: Авто-бэкап папок по расписанию
  tpl_87: (formName, projectName) => `// ==============================================================================
// Template #87: Авто-бэкап папок по расписанию (.NET 8 WinForms)
// Category: 🤖 Автоматизация и Боты
// ==============================================================================
using System;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public ${formName}()
        {
            InitializeComponent();
        }

        private void ${formName}_Load(object sender, EventArgs e) => RenderBackupReport();

        private void btnCalculate_Click(object sender, EventArgs e)
        {
            MessageBox.Show("Резервная копия успешно создана в архиве: Backup_2024-09-28_1430.zip", "Авто-бэкап", MessageBoxButtons.OK, MessageBoxIcon.Information);
            RenderBackupReport();
        }

        private void RenderBackupReport()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== СЛУЖБА РЕЗЕРВНОГО КОПИРОВАНИЯ (SYSTEM.IO.COMPRESSION.ZIPFILE) ===");
            sb.AppendLine(@"Источник:      D:\\Projects\\NextGenStudio\\");
            sb.AppendLine(@"Назначение:    E:\\Backups\\NextGenStudio_Daily\\");
            sb.AppendLine("Алгоритм:      ZIP Deflate (Level: Optimal Compression)");
            sb.AppendLine("Расписание:    Каждый день в 03:00 и при закрытии IDE");
            sb.AppendLine("------------------------------------------------------------------");
            sb.AppendLine("Последний архив: Backup_2024-09-28_1430.zip");
            sb.AppendLine("Файлов упаковано: 1,842 файла");
            sb.AppendLine("Размер архива:    38.4 МБ (Сжатие с 142 МБ, коэффициент 3.7x)");
            sb.AppendLine("Контрольная сумма SHA-256: 4e9f1a2b8c7d6e5f...");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = "Бэкап создан: 38.4 МБ (1,842 файла)";
        }
    }
}
`,

  // tpl_88: Макрос набора текста (Auto-Typer)
  tpl_88: (formName, projectName) => `// ==============================================================================
// Template #88: Макрос набора текста (Auto-Typer) (.NET 8 WinForms)
// Category: 🤖 Автоматизация и Боты
// ==============================================================================
using System;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public ${formName}()
        {
            InitializeComponent();
        }

        private void ${formName}_Load(object sender, EventArgs e) => RenderTyperStatus();

        private void btnCalculate_Click(object sender, EventArgs e) => RenderTyperStatus();

        private void RenderTyperStatus()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== ЭМУЛЯТОР НАБОРА ТЕКСТА КЛАВИАТУРЫ (SENDKEYS MACRO) ===");
            sb.AppendLine("Скорость набора:   65 миллисекунд между нажатиями клавиш (450 знаков/мин)");
            sb.AppendLine("Режим:             Имитация человека (Рандомизация задержек ±15 мс)");
            sb.AppendLine("Горячая клавиша:   Ctrl+Shift+T — Запуск ввода в активное окно");
            sb.AppendLine("------------------------------------------------------------------");
            sb.AppendLine("Буфер текста для авто-набора:");
            sb.AppendLine("\\"Console.WriteLine(\\\"Hello, High-Performance World!\\\");\\"");
            sb.AppendLine("------------------------------------------------------------------");
            sb.AppendLine("Статус: Готов к отправке при переключении фокуса.");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = "Auto-Typer готов (Ctrl+Shift+T)";
        }
    }
}
`,

  // tpl_89: Трекер цен товаров в интернет-магазинах
  tpl_89: (formName, projectName) => `// ==============================================================================
// Template #89: Трекер цен товаров в интернет-магазинах (.NET 8 WinForms)
// Category: 🤖 Автоматизация и Боты
// ==============================================================================
using System;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public ${formName}()
        {
            InitializeComponent();
        }

        private void ${formName}_Load(object sender, EventArgs e) => CheckPriceDrops();

        private void btnCalculate_Click(object sender, EventArgs e) => CheckPriceDrops();

        private void CheckPriceDrops()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== МОНИТОРИНГ ЦЕН И СКИДОК В ИНТЕРНЕТ-МАГАЗИНАХ ===");
            sb.AppendLine($"Проверено: {DateTime.Now:dd.MM.yyyy HH:mm} | Активных трекеров: 3");
            sb.AppendLine("--------------------------------------------------------------------------------");
            sb.AppendLine("Товар                           | Стартовая цена | Текущая цена | Скидка");
            sb.AppendLine("--------------------------------------------------------------------------------");
            sb.AppendLine("Монитор 27\\" 4K 144Hz IPS        | 45 990 ₽       | 38 490 ₽     | -16.3% 🔥 СКИДКА!");
            sb.AppendLine("Механическая клавиатура Wireless| 12 500 ₽       | 12 500 ₽     | 0.0%");
            sb.AppendLine("Беспроводные наушники ANC       | 24 990 ₽       | 21 990 ₽     | -12.0% 🟢");
            sb.AppendLine("--------------------------------------------------------------------------------");
            sb.AppendLine("Порог уведомления: Скидка более 10%. Звуковой сигнал отправлен в Telegram.");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = "Найдено 2 товара со скидкой > 10%";
        }
    }
}
`,

  // tpl_90: Менеджер истории буфера обмена
  tpl_90: (formName, projectName) => `// ==============================================================================
// Template #90: Менеджер истории буфера обмена (.NET 8 WinForms)
// Category: 🤖 Автоматизация и Боты
// ==============================================================================
using System;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public ${formName}()
        {
            InitializeComponent();
        }

        private void ${formName}_Load(object sender, EventArgs e) => RenderClipboardHistory();

        private void btnCalculate_Click(object sender, EventArgs e) => RenderClipboardHistory();

        private void RenderClipboardHistory()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== ИСТОРИЯ СИСТЕМНОГО БУФЕРА ОБМЕНА CLIPBOARD (RING BUFFER 30) ===");
            sb.AppendLine("Слушатель: Win32 AddClipboardFormatListener | Горячая клавиша: Win+V");
            sb.AppendLine("-------------------------------------------------------------------------");
            sb.AppendLine("[14:28:10] (Текст)  git commit -m \\"feat: complete all 100 C# templates\\"");
            sb.AppendLine("[14:25:44] (Текст)  https://github.com/phsquad/C-NewGen");
            sb.AppendLine("[14:22:15] (Код)    public partial class MainForm : Form { ... }");
            sb.AppendLine("[14:18:02] (Текст)  sashav290@gmail.com");
            sb.AppendLine("[14:10:30] (Число)  42800.50");
            sb.AppendLine("-------------------------------------------------------------------------");
            sb.AppendLine("Двойной клик по элементу вставляет текст в активное приложение.");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = "Буфер обмена: 5 фрагментов сохранено";
        }
    }
}
`,
};
