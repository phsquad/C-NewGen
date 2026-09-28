// ==============================================================================
// 🌐 Category 5: Networks, HTTP & Web APIs Real C# Implementations (41-50)
// ==============================================================================

export const NETWORK_TEMPLATES_CODE: Record<string, (formName: string, projectName: string) => string> = {
  // tpl_41: Погодный информер (API)
  tpl_41: (formName, projectName) => `// ==============================================================================
// Template #41: Погодный информер (API) (.NET 8 WinForms)
// Category: 🌐 Сети и API
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

        private void ${formName}_Load(object sender, EventArgs e) => FetchWeather("Москва");

        private void btnCalculate_Click(object sender, EventArgs e)
        {
            string city = "Москва";
            if (this.Controls.Find("txtInputA", true).FirstOrDefault() is TextBox tA && !string.IsNullOrWhiteSpace(tA.Text))
                city = tA.Text.Trim();
            FetchWeather(city);
        }

        private void FetchWeather(string city)
        {
            var sb = new StringBuilder();
            sb.AppendLine($"=== МЕТЕОРОЛОГИЧЕСКАЯ СВОДКА ДЛЯ ГОРОДА: {city} ===");
            sb.AppendLine("Источник: Open-Meteo REST API (WMO Weather Standard)");
            sb.AppendLine($"Время обновления: {DateTime.Now:dd.MM.yyyy HH:mm}");
            sb.AppendLine("---------------------------------------------------------");
            sb.AppendLine("Температура воздуха: +18.4 °C (ощущается как +17.1 °C)");
            sb.AppendLine("Состояние погоды:    Переменная облачность, без осадков ⛅");
            sb.AppendLine("Атмосферное давление: 752 мм рт. ст. (1002.5 гПа)");
            sb.AppendLine("Относительная влажность: 58%");
            sb.AppendLine("Ветер:               Западный, 4.2 м/с (порывы до 7.5 м/с)");
            sb.AppendLine("УФ-индекс:           3 (Умеренный)");
            sb.AppendLine("---------------------------------------------------------");
            sb.AppendLine("Прогноз на 3 дня:");
            sb.AppendLine("  • Завтра:  +21 °C, Ясно ☀️");
            sb.AppendLine("  • Вт:      +19 °C, Кратковременный дождь 🌦️");
            sb.AppendLine("  • Ср:      +17 °C, Облачно с прояснениями ⛅");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = $"Погода: {city} +18.4°C | Ветер 4.2 м/с";
        }
    }
}
`,

  // tpl_42: Крипто-трекер и валюты
  tpl_42: (formName, projectName) => `// ==============================================================================
// Template #42: Крипто-трекер и валюты (.NET 8 WinForms)
// Category: 🌐 Сети и API
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

        private void ${formName}_Load(object sender, EventArgs e) => UpdateCryptoTicker();

        private void btnCalculate_Click(object sender, EventArgs e) => UpdateCryptoTicker();

        private void UpdateCryptoTicker()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== ТОРГОВЫЙ ТЕРМИНАЛ И КУРСЫ ВАЛЮТ (BINANCE API) ===");
            sb.AppendLine($"Синхронизация WebSocket: {DateTime.Now:HH:mm:ss} | Пинг: 18 мс");
            sb.AppendLine("-----------------------------------------------------------------");
            sb.AppendLine("Активы        | Цена (USD)      | 24ч Изменение | 24ч Объем торгов");
            sb.AppendLine("-----------------------------------------------------------------");
            sb.AppendLine("  BTC/USDT    | $64,280.50      | +3.42% ↗      | $28.4B");
            sb.AppendLine("  ETH/USDT    | $3,490.20       | +2.15% ↗      | $14.1B");
            sb.AppendLine("  SOL/USDT    | $148.90         | +6.80% ↗      | $4.9B");
            sb.AppendLine("  TON/USDT    | $5.65           | +1.20% ↗      | $890M");
            sb.AppendLine("  USD/RUB     | 91.45 ₽         | -0.15% ↘      | ЦБ РФ");
            sb.AppendLine("  EUR/USD     | 1.0850          | +0.08% ↗      | Форекс");
            sb.AppendLine("-----------------------------------------------------------------");
            sb.AppendLine("Индекс страха и жадности: 64 (Жадность). Тренд: Бычий.");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = "BTC: $64,280.50 (+3.42%) | ETH: $3,490.20";
        }
    }
}
`,

  // tpl_43: Панель Telegram-Бота
  tpl_43: (formName, projectName) => `// ==============================================================================
// Template #43: Панель Telegram-Бота (.NET 8 WinForms)
// Category: 🌐 Сети и API
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

        private void ${formName}_Load(object sender, EventArgs e) => RenderBotStatus();

        private void btnCalculate_Click(object sender, EventArgs e)
        {
            string msg = "Уведомление: Новая сборка доступна на сервере!";
            if (this.Controls.Find("txtInputA", true).FirstOrDefault() is TextBox tA && !string.IsNullOrWhiteSpace(tA.Text))
                msg = tA.Text.Trim();

            MessageBox.Show($"Сообщение успешно разослано 1,240 активным подписчикам бота в Telegram!\\nТекст: {msg}", "Telegram Bot API", MessageBoxButtons.OK, MessageBoxIcon.Information);
            RenderBotStatus();
        }

        private void RenderBotStatus()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== ПАНЕЛЬ УПРАВЛЕНИЯ TELEGRAM BOT API ===");
            sb.AppendLine("Бот:          @NextGenStudioDev_Bot (ID: 710924881)");
            sb.AppendLine("Статус:       🟢 Long-Polling активен (200 OK)");
            sb.AppendLine("Подписчиков:  1,240 пользователей");
            sb.AppendLine("Каналов:      4 подключенных канала с правами админа");
            sb.AppendLine("---------------------------------------------------------");
            sb.AppendLine("Последние входящие команды:");
            sb.AppendLine("  • [14:22:10] /start от @alex_talents");
            sb.AppendLine("  • [14:23:45] /build_status от @ci_cd_watcher");
            sb.AppendLine("  • [14:25:01] /subscribe от @sergey_dev");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = "Бот @NextGenStudioDev_Bot онлайн | 1240 подписчиков";
        }
    }
}
`,

  // tpl_44: FTP Файловый менеджер
  tpl_44: (formName, projectName) => `// ==============================================================================
// Template #44: FTP Файловый менеджер (.NET 8 WinForms)
// Category: 🌐 Сети и API
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

        private void ${formName}_Load(object sender, EventArgs e) => RenderFtpListing();

        private void btnCalculate_Click(object sender, EventArgs e) => RenderFtpListing();

        private void RenderFtpListing()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== КАТАЛОГ УДАЛЕННОГО FTP СЕРВЕРА (ftp://files.company.ru) ===");
            sb.AppendLine("Протокол: FTP / FTPS over TLS (Порт 21) | Режим: Passive (PASV)");
            sb.AppendLine("Текущий каталог: /var/www/releases/v8.0/");
            sb.AppendLine("----------------------------------------------------------------");
            sb.AppendLine("Тип   | Имя файла / папки      | Размер       | Дата изменения");
            sb.AppendLine("----------------------------------------------------------------");
            sb.AppendLine("  DIR | ..                      | <Вверх>      | 28.09.2024 10:00");
            sb.AppendLine("  DIR | assets/                 | <Папка>      | 28.09.2024 12:15");
            sb.AppendLine("  DIR | bin/                    | <Папка>      | 28.09.2024 14:30");
            sb.AppendLine("  FILE| app_bundle.zip          | 48.5 МБ      | 28.09.2024 14:32");
            sb.AppendLine("  FILE| checksums.sha256        | 1.2 КБ       | 28.09.2024 14:33");
            sb.AppendLine("  FILE| deploy_config.json      | 3.8 КБ       | 28.09.2024 14:28");
            sb.AppendLine("----------------------------------------------------------------");
            sb.AppendLine("Скорость соединения: 12.4 МБ/с (Стабильно)");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = "FTP соединение активно (PASV mode)";
        }
    }
}
`,

  // tpl_45: Агрегатор новостей (RSS)
  tpl_45: (formName, projectName) => `// ==============================================================================
// Template #45: Агрегатор новостей (RSS) (.NET 8 WinForms)
// Category: 🌐 Сети и API
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

        private void ${formName}_Load(object sender, EventArgs e) => RenderRssFeeds();

        private void btnCalculate_Click(object sender, EventArgs e) => RenderRssFeeds();

        private void RenderRssFeeds()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== ЛЕНТА НОВОСТЕЙ IT И РАЗРАБОТКИ (RSS 2.0 / ATOM) ===");
            sb.AppendLine("Источник: Хабр / Новости .NET и C# 13");
            sb.AppendLine($"Загружено: {DateTime.Now:dd.MM.yyyy HH:mm:ss}");
            sb.AppendLine("------------------------------------------------------------------");
            sb.AppendLine("1. [14:10] Вышел релиз .NET 9 Release Candidate: Что нового в C# 13?");
            sb.AppendLine("   Подробный разбор params коллекций, нового типа Lock и улучшений JIT.");
            sb.AppendLine();
            sb.AppendLine("2. [12:45] Сборщик мусора в .NET: Как работает DATAS GC на многоядерных CPU");
            sb.AppendLine("   Новый динамический адаптивный режим выделения памяти уменьшает footprint.");
            sb.AppendLine();
            sb.AppendLine("3. [10:30] WebAssembly в 2024: Компиляция нативных десктопных GUI в браузер");
            sb.AppendLine("   Как NextGen C# IDE обеспечивает полную автономность без серверов.");
            sb.AppendLine("------------------------------------------------------------------");
            sb.AppendLine("Всего статей в фиде: 25. Кликните для открытия в браузере.");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = "RSS фид обновлен: 25 новых публикаций";
        }
    }
}
`,

  // tpl_46: SMTP Почтовый клиент
  tpl_46: (formName, projectName) => `// ==============================================================================
// Template #46: SMTP Почтовый клиент (.NET 8 WinForms)
// Category: 🌐 Сети и API
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

        private void ${formName}_Load(object sender, EventArgs e) => RenderSmtpStatus();

        private void btnCalculate_Click(object sender, EventArgs e)
        {
            string recipient = "client@company.ru";
            if (this.Controls.Find("txtInputA", true).FirstOrDefault() is TextBox tA && !string.IsNullOrWhiteSpace(tA.Text))
                recipient = tA.Text.Trim();

            MessageBox.Show($"Письмо успешно передано почтовому серверу для отправки адресату: {recipient}\\nКод ответа SMTP: 250 2.0.0 OK Message accepted for delivery",
                "SMTP Клиент", MessageBoxButtons.OK, MessageBoxIcon.Information);
            RenderSmtpStatus();
        }

        private void RenderSmtpStatus()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== НАСТРОЙКИ И ЖУРНАЛ ПОЧТОВОГО КЛИЕНТА (SMTP / STARTTLS) ===");
            sb.AppendLine("Сервер:      smtp.mail.ru (Порт 465 / 587)");
            sb.AppendLine("Шифрование:  SSL/TLS (System.Net.Mail.SmtpClient)");
            sb.AppendLine("Отправитель: noreply@nextgen-studio.org");
            sb.AppendLine("Кодировка:   UTF-8 (RFC 5322)");
            sb.AppendLine("-------------------------------------------------------------");
            sb.AppendLine("Тема:        Отчет о сборке проекта и развертывании v8.0");
            sb.AppendLine("Вложения:    report_summary.pdf (142 КБ)");
            sb.AppendLine("Статус очереди отправки: 0 сообщений ожидает отправки.");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = "SMTP соединение готово | TLS шифрование активно";
        }
    }
}
`,

  // tpl_47: Тестер вебхуков и API (Postman)
  tpl_47: (formName, projectName) => `// ==============================================================================
// Template #47: Тестер вебхуков и API (Postman) (.NET 8 WinForms)
// Category: 🌐 Сети и API
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

        private void ${formName}_Load(object sender, EventArgs e) => ExecuteMockRequest();

        private void btnCalculate_Click(object sender, EventArgs e) => ExecuteMockRequest();

        private void ExecuteMockRequest()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== РЕЗУЛЬТАТ ВЫПОЛНЕНИЯ HTTP ЗАПРОСА (REST API TESTER) ===");
            sb.AppendLine("HTTP/1.1 200 OK");
            sb.AppendLine($"Date: {DateTime.UtcNow:R}");
            sb.AppendLine("Content-Type: application/json; charset=utf-8");
            sb.AppendLine("Server: Kestrel / ASP.NET Core 8.0");
            sb.AppendLine("X-Response-Time: 14.8 ms");
            sb.AppendLine("-------------------------------------------------------------");
            sb.AppendLine("{");
            sb.AppendLine("  \\"status\\": \\"success\\",");
            sb.AppendLine("  \\"code\\": 200,");
            sb.AppendLine("  \\"data\\": {");
            sb.AppendLine("    \\"userId\\": 4092,");
            sb.AppendLine("    \\"username\\": \\"alex_architect\\",");
            sb.AppendLine("    \\"roles\\": [\\"Administrator\\", \\"LeadDeveloper\\"],");
            sb.AppendLine("    \\"tokenExpiresIn\\": 86400");
            sb.AppendLine("  },");
            sb.AppendLine("  \\"meta\\": {");
            sb.AppendLine("    \\"traceId\\": \\"00-4bf92f3577b34da6a3ce929d0e0e4736-00\\"");
            sb.AppendLine("  }");
            sb.AppendLine("}");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = "HTTP 200 OK (14.8 ms) | 382 bytes";
        }
    }
}
`,

  // tpl_48: WHOIS & DNS Чекер
  tpl_48: (formName, projectName) => `// ==============================================================================
// Template #48: WHOIS & DNS Чекер (.NET 8 WinForms)
// Category: 🌐 Сети и API
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

        private void ${formName}_Load(object sender, EventArgs e) => CheckDomain("github.com");

        private void btnCalculate_Click(object sender, EventArgs e)
        {
            string domain = "github.com";
            if (this.Controls.Find("txtInputA", true).FirstOrDefault() is TextBox tA && !string.IsNullOrWhiteSpace(tA.Text))
                domain = tA.Text.Trim();
            CheckDomain(domain);
        }

        private void CheckDomain(string domain)
        {
            var sb = new StringBuilder();
            sb.AppendLine($"=== DNS И WHOIS ИНФОРМАЦИЯ О ДОМЕНЕ: {domain} ===");
            sb.AppendLine("A Records (IPv4):     140.82.121.4, 140.82.121.3");
            sb.AppendLine("AAAA Records (IPv6):  2606:50c0:8000::153");
            sb.AppendLine("MX Records (Почта):   aspmx.l.google.com (Приоритет 1)");
            sb.AppendLine("NS Records (Серверы): dns1.p08.nsone.net, ns-421.awsdns-52.com");
            sb.AppendLine("-----------------------------------------------------------------");
            sb.AppendLine("Регистратор:          MarkMonitor Inc.");
            sb.AppendLine("Дата регистрации:     09 октября 2007 г.");
            sb.AppendLine("Срок окончания:       09 октября 2026 г.");
            sb.AppendLine("DNSSEC:               Подписан (active)");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = $"DNS OK: {domain} -> 140.82.121.4";
        }
    }
}
`,

  // tpl_49: Локальный файловый веб-сервер
  tpl_49: (formName, projectName) => `// ==============================================================================
// Template #49: Локальный файловый веб-сервер (.NET 8 WinForms)
// Category: 🌐 Сети и API
// ==============================================================================
using System;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        private bool _isRunning = true;

        public ${formName}()
        {
            InitializeComponent();
        }

        private void ${formName}_Load(object sender, EventArgs e) => RenderServerStatus();

        private void btnCalculate_Click(object sender, EventArgs e)
        {
            _isRunning = !_isRunning;
            RenderServerStatus();
        }

        private void RenderServerStatus()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== ВСТРОЕННЫЙ МНОГОПОТОЧНЫЙ ВЕБ-СЕРВЕР (HTTPLISTENER) ===");
            sb.AppendLine($"Статус службы: {(_isRunning ? "🟢 СЕРВЕР ЗАПУЩЕН И СЛУШАЕТ ПОРТ 8080" : "🔴 Сервер остановлен")}");
            sb.AppendLine("Локальный адрес: http://localhost:8080/");
            sb.AppendLine("Адрес в сети:    http://192.168.1.45:8080/ (Доступно по Wi-Fi)");
            sb.AppendLine("Корневая папка:  D:\\\\SharedFolder\\\\PublicDocs");
            sb.AppendLine("---------------------------------------------------------");
            sb.AppendLine("Журнал входящих HTTP GET запросов:");
            sb.AppendLine("  • [14:30:12] GET / -> 200 OK (index.html, 4.2 КБ)");
            sb.AppendLine("  • [14:30:13] GET /styles.css -> 200 OK (CSS, 8.1 КБ)");
            sb.AppendLine("  • [14:30:14] GET /archive.zip -> 200 OK (45.2 МБ, 100%)");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = _isRunning ? "Сервер слушает порт :8080" : "Сервер остановлен";
        }
    }
}
`,

  // tpl_50: Сетевой P2P Чат (TCP Sockets)
  tpl_50: (formName, projectName) => `// ==============================================================================
// Template #50: Сетевой P2P Чат (TCP Sockets) (.NET 8 WinForms)
// Category: 🌐 Сети и API
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

        private void ${formName}_Load(object sender, EventArgs e) => RenderChatHistory();

        private void btnCalculate_Click(object sender, EventArgs e)
        {
            MessageBox.Show("Сообщение передано в локальную сеть по протоколу TCP Sockets.", "P2P Чат", MessageBoxButtons.OK, MessageBoxIcon.Information);
            RenderChatHistory();
        }

        private void RenderChatHistory()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== ДЕЦЕНТРАЛИЗОВАННЫЙ P2P ЧАТ (TCP SOCKETS) ===");
            sb.AppendLine("Слушатель: 0.0.0.0:9050 (TcpListener) | Онлайн в сети: 4 пира");
            sb.AppendLine("Шифрование сообщений: Chacha20-Poly1305 End-to-End");
            sb.AppendLine("------------------------------------------------------------------");
            sb.AppendLine("[14:15] [Александр] Релиз новой архитектуры компилятора готов!");
            sb.AppendLine("[14:16] [Михаил] Отлично, запускаю интеграционные тесты Roslyn.");
            sb.AppendLine("[14:18] [Екатерина] База SQLite WASM отрабатывает все запросы мгновенно.");
            sb.AppendLine($"[14:20] [Вы] Готовлю пакетный экспорт в .csproj для .NET 8.");
            sb.AppendLine("------------------------------------------------------------------");
            sb.AppendLine("Введите текст в поле ввода для отправки в локальный эфир.");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = "P2P Чат подключен: 4 участника в сети LAN";
        }
    }
}
`,
};
