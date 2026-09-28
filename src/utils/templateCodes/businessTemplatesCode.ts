// ==============================================================================
// 💼 Category 1: Business, Warehouse & CRM Templates Real C# Implementations (01-10)
// ==============================================================================

export const BUSINESS_TEMPLATES_CODE: Record<string, (formName: string, projectName: string) => string> = {
  // tpl_01: Учет склада и остатков
  tpl_01: (formName, projectName) => `// ==============================================================================
// Template #1: Учет склада и остатков (.NET 8 WinForms)
// Category: 💼 Бизнес и Склад
// ==============================================================================
using System;
using System.Collections.Generic;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public class InventoryItem
        {
            public int Id { get; set; }
            public string Sku { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public string Category { get; set; } = string.Empty;
            public decimal UnitPrice { get; set; }
            public int Quantity { get; set; }
            public decimal TotalValue => UnitPrice * Quantity;
            public DateTime LastUpdated { get; set; } = DateTime.Now;
        }

        private readonly List<InventoryItem> _inventory = new();
        private readonly BindingSource _bindingSource = new();
        private int _nextId = 101;

        public ${formName}()
        {
            InitializeComponent();
            InitializeInventoryData();
        }

        private void InitializeInventoryData()
        {
            _inventory.Add(new InventoryItem { Id = _nextId++, Sku = "SKU-9021", Name = "Материнская плата B760-Plus", Category = "Комплектующие", UnitPrice = 14500m, Quantity = 14 });
            _inventory.Add(new InventoryItem { Id = _nextId++, Sku = "SKU-4412", Name = "Оперативная память DDR5 32GB", Category = "Память", UnitPrice = 9800m, Quantity = 28 });
            _inventory.Add(new InventoryItem { Id = _nextId++, Sku = "SKU-7730", Name = "SSD NVMe M.2 1TB Gen4", Category = "Накопители", UnitPrice = 7200m, Quantity = 45 });
            _inventory.Add(new InventoryItem { Id = _nextId++, Sku = "SKU-1055", Name = "Блок питания 750W Gold", Category = "Питание", UnitPrice = 8900m, Quantity = 19 });
            _inventory.Add(new InventoryItem { Id = _nextId++, Sku = "SKU-3129", Name = "Кулер для процессора 220W", Category = "Охлаждение", UnitPrice = 3400m, Quantity = 32 });

            _bindingSource.DataSource = _inventory;
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv)
            {
                dgv.DataSource = _bindingSource;
                dgv.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            }
            RecalculateWarehouseMetrics();
        }

        private void RecalculateWarehouseMetrics()
        {
            int totalPositions = _inventory.Count;
            int totalUnits = _inventory.Sum(x => x.Quantity);
            decimal totalCost = _inventory.Sum(x => x.TotalValue);

            string statusMsg = $"📦 Позиций: {totalPositions} | Всего единиц: {totalUnits} шт. | Общая стоимость склада: {totalCost:N2} ₽";
            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
            {
                lbl.Text = statusMsg;
            }
        }

        private void ${formName}_Load(object sender, EventArgs e)
        {
            RecalculateWarehouseMetrics();
        }

        private void btnAdd_Click(object sender, EventArgs e)
        {
            var newItem = new InventoryItem
            {
                Id = _nextId++,
                Sku = $"SKU-{Random.Shared.Next(1000, 9999)}",
                Name = $"Товар склада #{_nextId}",
                Category = "Общая номенклатура",
                UnitPrice = Math.Round((decimal)(Random.Shared.Next(500, 15000) + Random.Shared.NextDouble()), 2),
                Quantity = Random.Shared.Next(5, 50),
                LastUpdated = DateTime.Now
            };

            _inventory.Add(newItem);
            _bindingSource.ResetBindings(false);
            RecalculateWarehouseMetrics();

            MessageBox.Show($"Позиция '{newItem.Name}' успешно добавлена на склад.\\nАртикул: {newItem.Sku}, Остаток: {newItem.Quantity} шт., Цена: {newItem.UnitPrice:N2} ₽",
                "Учет склада", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void btnDelete_Click(object sender, EventArgs e)
        {
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv && dgv.CurrentRow != null)
            {
                if (dgv.CurrentRow.DataBoundItem is InventoryItem item)
                {
                    var result = MessageBox.Show($"Вы действительно хотите списать со склада позицию '{item.Name}' ({item.Sku})?",
                        "Подтверждение списания", MessageBoxButtons.YesNo, MessageBoxIcon.Warning);

                    if (result == DialogResult.Yes)
                    {
                        _inventory.Remove(item);
                        _bindingSource.ResetBindings(false);
                        RecalculateWarehouseMetrics();
                    }
                }
            }
            else if (_inventory.Count > 0)
            {
                _inventory.RemoveAt(_inventory.Count - 1);
                _bindingSource.ResetBindings(false);
                RecalculateWarehouseMetrics();
            }
        }

        private void btnExport_Click(object sender, EventArgs e)
        {
            var sb = new StringBuilder();
            sb.AppendLine("ID;Артикул;Наименование;Категория;Цена (₽);Остаток (шт);Стоимость (₽);Дата обновления");
            foreach (var item in _inventory)
            {
                sb.AppendLine($"{item.Id};{item.Sku};\\"{item.Name}\\";{item.Category};{item.UnitPrice:F2};{item.Quantity};{item.TotalValue:F2};{item.LastUpdated:yyyy-MM-dd HH:mm}");
            }

            using var sfd = new SaveFileDialog
            {
                Filter = "CSV Таблица (*.csv)|*.csv|Текстовый отчет (*.txt)|*.txt",
                FileName = $"Склад_Остатки_{DateTime.Now:yyyyMMdd_HHmm}.csv"
            };

            if (sfd.ShowDialog() == DialogResult.OK)
            {
                System.IO.File.WriteAllText(sfd.FileName, sb.ToString(), Encoding.UTF8);
                MessageBox.Show($"Отчет по остаткам успешно выгружен в:\\n{sfd.FileName}", "Экспорт завершен", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
        }

        private void dgvItems_SelectionChanged(object sender, EventArgs e)
        {
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv && dgv.CurrentRow?.DataBoundItem is InventoryItem item)
            {
                if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                {
                    lbl.Text = $"🔍 Выбрано: {item.Name} ({item.Sku}) | В наличии: {item.Quantity} шт. | Стоимость партии: {item.TotalValue:N2} ₽";
                }
            }
        }
    }
}
`,

  // tpl_02: CRM клиентов и заказов
  tpl_02: (formName, projectName) => `// ==============================================================================
// Template #2: CRM клиентов и заказов (.NET 8 WinForms)
// Category: 💼 Бизнес и Склад
// ==============================================================================
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public class CrmClient
        {
            public int ClientId { get; set; }
            public string FullName { get; set; } = string.Empty;
            public string Company { get; set; } = string.Empty;
            public string Phone { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public decimal TotalPurchases { get; set; }
            public string Status { get; set; } = "В обработке";
        }

        private readonly List<CrmClient> _clients = new();
        private readonly BindingSource _bindingSource = new();
        private int _counter = 1;

        public ${formName}()
        {
            InitializeComponent();
            SeedCrmData();
        }

        private void SeedCrmData()
        {
            _clients.Add(new CrmClient { ClientId = _counter++, FullName = "Иванов Сергей Павлович", Company = "ООO 'ТехноПром'", Phone = "+7 (916) 244-11-22", Email = "ivanov@technoprom.ru", TotalPurchases = 450000m, Status = "Постоянный" });
            _clients.Add(new CrmClient { ClientId = _counter++, FullName = "Смирнова Елена Дмитриевна", Company = "ИП Смирнова", Phone = "+7 (903) 811-90-44", Email = "elena@smirnova-design.ru", TotalPurchases = 89000m, Status = "В обработке" });
            _clients.Add(new CrmClient { ClientId = _counter++, FullName = "Кузнецов Артем Васильевич", Company = "АО 'Альянс Логистик'", Phone = "+7 (495) 777-30-20", Email = "kuznetsov@allog.com", TotalPurchases = 1200000m, Status = "VIP Партнер" });
            _clients.Add(new CrmClient { ClientId = _counter++, FullName = "Петрова Анна Сергеевна", Company = "ООО 'МедиаГрупп'", Phone = "+7 (926) 330-15-88", Email = "petrova@mediagroup.org", TotalPurchases = 210000m, Status = "Оплачен" });

            _bindingSource.DataSource = _clients;
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv)
            {
                dgv.DataSource = _bindingSource;
                dgv.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            }
            UpdateCrmSummary();
        }

        private void UpdateCrmSummary()
        {
            decimal totalTurnover = _clients.Sum(c => c.TotalPurchases);
            int vipCount = _clients.Count(c => c.Status == "VIP Партнер");
            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
            {
                lbl.Text = $"👥 Клиентов в базе: {_clients.Count} | Оборот: {totalTurnover:N2} ₽ | VIP клиентов: {vipCount}";
            }
        }

        private void ${formName}_Load(object sender, EventArgs e) => UpdateCrmSummary();

        private void btnAdd_Click(object sender, EventArgs e)
        {
            var newClient = new CrmClient
            {
                ClientId = _counter++,
                FullName = $"Новый Клиент #{_counter}",
                Company = $"ООО 'Компания-{_counter}'",
                Phone = $"+7 (9{Random.Shared.Next(10, 99)}) {Random.Shared.Next(100, 999)}-{Random.Shared.Next(10, 99)}-{Random.Shared.Next(10, 99)}",
                Email = $"client{_counter}@business.net",
                TotalPurchases = Random.Shared.Next(50000, 300000),
                Status = "В обработке"
            };
            _clients.Add(newClient);
            _bindingSource.ResetBindings(false);
            UpdateCrmSummary();
        }

        private void btnDelete_Click(object sender, EventArgs e)
        {
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv && dgv.CurrentRow?.DataBoundItem is CrmClient c)
            {
                _clients.Remove(c);
                _bindingSource.ResetBindings(false);
                UpdateCrmSummary();
            }
        }

        private void btnExport_Click(object sender, EventArgs e)
        {
            var sb = new StringBuilder();
            sb.AppendLine("ID,ФИО,Компания,Телефон,Email,Сумма покупок,Статус");
            foreach (var c in _clients)
            {
                sb.AppendLine($"{c.ClientId},\\"{c.FullName}\\",\\"{c.Company}\\",{c.Phone},{c.Email},{c.TotalPurchases:F2},{c.Status}");
            }
            Clipboard.SetText(sb.ToString());
            MessageBox.Show("Данные CRM успешно скопированы в буфер обмена в формате CSV!", "Экспорт CRM", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void dgvItems_SelectionChanged(object sender, EventArgs e)
        {
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv && dgv.CurrentRow?.DataBoundItem is CrmClient c)
            {
                if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                {
                    lbl.Text = $"Клиент: {c.FullName} ({c.Company}) | Оборот: {c.TotalPurchases:N2} ₽ | Статус: {c.Status}";
                }
            }
        }
    }
}
`,

  // tpl_03: Генератор счетов-фактур
  tpl_03: (formName, projectName) => `// ==============================================================================
// Template #3: Генератор счетов-фактур (.NET 8 WinForms)
// Category: 💼 Бизнес и Склад
// ==============================================================================
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public record InvoiceItem(string Description, int Quantity, decimal UnitPrice, decimal Total);

        private readonly List<InvoiceItem> _items = new();

        public ${formName}()
        {
            InitializeComponent();
            LoadDefaultInvoiceData();
        }

        private void LoadDefaultInvoiceData()
        {
            _items.Add(new InvoiceItem("Проектирование архитектуры ПО", 1, 150000m, 150000m));
            _items.Add(new InvoiceItem("Разработка пользовательского интерфейса", 1, 85000m, 85000m));
            _items.Add(new InvoiceItem("Интеграция с локальной базой SQLite", 2, 45000m, 90000m));
            _items.Add(new InvoiceItem("Комплексное тестирование и развертывание", 1, 35000m, 35000m));
            RenderInvoicePreview();
        }

        private void RenderInvoicePreview()
        {
            decimal subtotal = _items.Sum(i => i.Total);
            decimal vat20 = subtotal * 0.20m;
            decimal grandTotal = subtotal + vat20;

            var sb = new StringBuilder();
            sb.AppendLine("================================================================================");
            sb.AppendLine("                              СЧЕТ НА ОПЛАТУ № 24-0982                          ");
            sb.AppendLine($"                    Дата выставления: {DateTime.Now:dd MMMM yyyy} г.            ");
            sb.AppendLine("================================================================================");
            sb.AppendLine("Поставщик:  ООО \\"НЕКСТГЕН ТЕХНОЛОДЖИЗ\\"  ИНН 7701234567 / КПП 770101001");
            sb.AppendLine("Покупатель: ПАО \\"ИНДУСТРИАЛЬНЫЕ СИСТЕМЫ\\" ИНН 7812987654 / КПП 781201001");
            sb.AppendLine("--------------------------------------------------------------------------------");
            sb.AppendLine(string.Format("{0,-4} | {1,-38} | {2,5} | {3,12} | {4,14}", "№", "Наименование товаров/услуг", "Кол", "Цена (₽)", "Сумма (₽)"));
            sb.AppendLine("--------------------------------------------------------------------------------");

            int index = 1;
            foreach (var item in _items)
            {
                sb.AppendLine(string.Format("{0,-4} | {1,-38} | {2,5} | {3,12:N2} | {4,14:N2}", index++, item.Description, item.Quantity, item.UnitPrice, item.Total));
            }

            sb.AppendLine("--------------------------------------------------------------------------------");
            sb.AppendLine(string.Format("{0,65}: {1,14:N2} ₽", "Итого без учета НДС", subtotal));
            sb.AppendLine(string.Format("{0,65}: {1,14:N2} ₽", "НДС (ставка 20%)", vat20));
            sb.AppendLine(string.Format("{0,65}: {1,14:N2} ₽", "ВСЕГО К ОПЛАТЕ", grandTotal));
            sb.AppendLine("================================================================================");
            sb.AppendLine($"Всего наименований {_items.Count}, на сумму {grandTotal:N2} рублей.");
            sb.AppendLine("Счет действителен к оплате в течение 5 банковских дней.");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
            {
                rtb.Text = sb.ToString();
            }
        }

        private void ${formName}_Load(object sender, EventArgs e) => RenderInvoicePreview();

        private void btnCalculate_Click(object sender, EventArgs e)
        {
            string name = "Дополнительный модуль безопасности";
            decimal price = 28000m;
            int qty = 1;

            if (this.Controls.Find("txtInputA", true).FirstOrDefault() is TextBox tA && decimal.TryParse(tA.Text, out var parsedPrice))
            {
                price = parsedPrice;
            }
            if (this.Controls.Find("txtInputB", true).FirstOrDefault() is TextBox tB && int.TryParse(tB.Text, out var parsedQty))
            {
                qty = parsedQty;
            }

            _items.Add(new InvoiceItem(name, qty, price, price * qty));
            RenderInvoicePreview();
            MessageBox.Show($"Позиция '{name}' добавлена в счет! Сумма счета пересчитана с учетом НДС 20%.", "Счет обновлен", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
    }
}
`,

  // tpl_04: Табель учета сотрудников
  tpl_04: (formName, projectName) => `// ==============================================================================
// Template #4: Табель учета сотрудников (.NET 8 WinForms)
// Category: 💼 Бизнес и Склад
// ==============================================================================
using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public class EmployeeTimesheetRecord
        {
            public int EmployeeId { get; set; }
            public string FullName { get; set; } = string.Empty;
            public string Department { get; set; } = string.Empty;
            public int StandardHours { get; set; }
            public int OvertimeHours { get; set; }
            public int SickLeaveDays { get; set; }
            public decimal HourlyRate { get; set; }
            public decimal TotalSalary => (StandardHours * HourlyRate) + (OvertimeHours * HourlyRate * 1.5m);
        }

        private readonly List<EmployeeTimesheetRecord> _timesheet = new();
        private readonly BindingSource _bindingSource = new();

        public ${formName}()
        {
            InitializeComponent();
            InitTimesheet();
        }

        private void InitTimesheet()
        {
            _timesheet.Add(new EmployeeTimesheetRecord { EmployeeId = 101, FullName = "Васильев Олег Игоревич", Department = "IT отдел", StandardHours = 168, OvertimeHours = 14, SickLeaveDays = 0, HourlyRate = 950m });
            _timesheet.Add(new EmployeeTimesheetRecord { EmployeeId = 102, FullName = "Кузнецова Марина Юрьевна", Department = "Бухгалтерия", StandardHours = 160, OvertimeHours = 4, SickLeaveDays = 2, HourlyRate = 750m });
            _timesheet.Add(new EmployeeTimesheetRecord { EmployeeId = 103, FullName = "Дмитриев Денис Сергеевич", Department = "Логистика", StandardHours = 168, OvertimeHours = 22, SickLeaveDays = 0, HourlyRate = 600m });
            _timesheet.Add(new EmployeeTimesheetRecord { EmployeeId = 104, FullName = "Морозова Светлана Павловна", Department = "Маркетинг", StandardHours = 152, OvertimeHours = 0, SickLeaveDays = 4, HourlyRate = 800m });

            _bindingSource.DataSource = _timesheet;
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv)
            {
                dgv.DataSource = _bindingSource;
                dgv.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            }
            UpdatePayrollSummary();
        }

        private void UpdatePayrollSummary()
        {
            decimal totalPayroll = _timesheet.Sum(x => x.TotalSalary);
            int totalOvertime = _timesheet.Sum(x => x.OvertimeHours);
            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
            {
                lbl.Text = $"💼 Сотрудников: {_timesheet.Count} | Сверхурочные: {totalOvertime} ч. | Общий ФОТ за месяц: {totalPayroll:N2} ₽";
            }
        }

        private void ${formName}_Load(object sender, EventArgs e) => UpdatePayrollSummary();

        private void btnAdd_Click(object sender, EventArgs e)
        {
            int id = 100 + _timesheet.Count + 1;
            var emp = new EmployeeTimesheetRecord
            {
                EmployeeId = id,
                FullName = $"Сотрудник #{id}",
                Department = "Отдел разработки",
                StandardHours = 168,
                OvertimeHours = Random.Shared.Next(0, 20),
                SickLeaveDays = 0,
                HourlyRate = 850m
            };
            _timesheet.Add(emp);
            _bindingSource.ResetBindings(false);
            UpdatePayrollSummary();
        }

        private void btnDelete_Click(object sender, EventArgs e)
        {
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv && dgv.CurrentRow?.DataBoundItem is EmployeeTimesheetRecord rec)
            {
                _timesheet.Remove(rec);
                _bindingSource.ResetBindings(false);
                UpdatePayrollSummary();
            }
        }

        private void btnExport_Click(object sender, EventArgs e)
        {
            MessageBox.Show($"Ведомость расчета зарплаты за текущий месяц готова к отправке в бухгалтерию.\\nВсего к выплате: {_timesheet.Sum(x => x.TotalSalary):N2} ₽",
                "Табель учета рабочего времени", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void dgvItems_SelectionChanged(object sender, EventArgs e)
        {
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv && dgv.CurrentRow?.DataBoundItem is EmployeeTimesheetRecord rec)
            {
                if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                {
                    lbl.Text = $"👤 {rec.FullName} ({rec.Department}) | Отработано: {rec.StandardHours} ч. | Оплата: {rec.TotalSalary:N2} ₽";
                }
            }
        }
    }
}
`,

  // tpl_05: Бюджет доходов и расходов
  tpl_05: (formName, projectName) => `// ==============================================================================
// Template #5: Бюджет доходов и расходов (.NET 8 WinForms)
// Category: 💼 Бизнес и Склад
// ==============================================================================
using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public record BudgetItem(int Id, string Category, string Description, decimal Amount, bool IsIncome, DateTime Date);

        private readonly List<BudgetItem> _items = new();
        private readonly BindingSource _bindingSource = new();
        private int _counter = 1;

        public ${formName}()
        {
            InitializeComponent();
            SeedBudget();
        }

        private void SeedBudget()
        {
            _items.Add(new BudgetItem(_counter++, "Продажи", "Оплата контракта №402", 480000m, true, DateTime.Now.AddDays(-5)));
            _items.Add(new BudgetItem(_counter++, "Аренда", "Аренда офисного помещения", 120000m, false, DateTime.Now.AddDays(-4)));
            _items.Add(new BudgetItem(_counter++, "Зарплата", "Аванс сотрудникам за месяц", 250000m, false, DateTime.Now.AddDays(-3)));
            _items.Add(new BudgetItem(_counter++, "Сервисы", "Облачная инфраструктура и сервера", 34000m, false, DateTime.Now.AddDays(-2)));
            _items.Add(new BudgetItem(_counter++, "Консалтинг", "Услуги аудита проекта", 95000m, true, DateTime.Now.AddDays(-1)));

            _bindingSource.DataSource = _items;
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv)
            {
                dgv.DataSource = _bindingSource;
                dgv.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            }
            RecalculateBudgetMetrics();
        }

        private void RecalculateBudgetMetrics()
        {
            decimal totalIncome = _items.Where(x => x.IsIncome).Sum(x => x.Amount);
            decimal totalExpense = _items.Where(x => !x.IsIncome).Sum(x => x.Amount);
            decimal balance = totalIncome - totalExpense;

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
            {
                lbl.Text = $"💰 Доходы: +{totalIncome:N2} ₽ | Расходы: -{totalExpense:N2} ₽ | Чистый баланс: {balance:N2} ₽";
                lbl.ForeColor = balance >= 0 ? System.Drawing.Color.LightGreen : System.Drawing.Color.Salmon;
            }
        }

        private void ${formName}_Load(object sender, EventArgs e) => RecalculateBudgetMetrics();

        private void btnAdd_Click(object sender, EventArgs e)
        {
            bool isInc = Random.Shared.Next(0, 2) == 1;
            decimal amount = Random.Shared.Next(15000, 150000);
            string cat = isInc ? "Дополнительные услуги" : "Офисные расходы";

            _items.Add(new BudgetItem(_counter++, cat, $"Проводка #{_counter}", amount, isInc, DateTime.Now));
            _bindingSource.ResetBindings(false);
            RecalculateBudgetMetrics();
        }

        private void btnDelete_Click(object sender, EventArgs e)
        {
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv && dgv.CurrentRow?.DataBoundItem is BudgetItem itm)
            {
                _items.Remove(itm);
                _bindingSource.ResetBindings(false);
                RecalculateBudgetMetrics();
            }
        }

        private void btnExport_Click(object sender, EventArgs e)
        {
            decimal income = _items.Where(x => x.IsIncome).Sum(x => x.Amount);
            decimal expense = _items.Where(x => !x.IsIncome).Sum(x => x.Amount);
            MessageBox.Show($"Финансовый отчет сформирован:\\nДоходы: {income:N2} ₽\\nРасходы: {expense:N2} ₽\\nСальдо: {(income - expense):N2} ₽",
                "Отчет о прибылях и убытках", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void dgvItems_SelectionChanged(object sender, EventArgs e)
        {
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv && dgv.CurrentRow?.DataBoundItem is BudgetItem itm)
            {
                if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                {
                    lbl.Text = $"Категория: {itm.Category} | {itm.Description} | Сумма: {(itm.IsIncome ? "+" : "-")}{itm.Amount:N2} ₽";
                }
            }
        }
    }
}
`,

  // tpl_06: Автопарк и путевые листы
  tpl_06: (formName, projectName) => `// ==============================================================================
// Template #6: Автопарк и путевые листы (.NET 8 WinForms)
// Category: 💼 Бизнес и Склад
// ==============================================================================
using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public class VehicleLog
        {
            public string Plate { get; set; } = string.Empty;
            public string Model { get; set; } = string.Empty;
            public string Driver { get; set; } = string.Empty;
            public int MileageKm { get; set; }
            public double FuelConsumedLiters { get; set; }
            public double AvgConsumptionPer100Km => MileageKm > 0 ? (FuelConsumedLiters / MileageKm) * 100 : 0;
            public string MaintenanceStatus { get; set; } = "Готов к рейсу";
        }

        private readonly List<VehicleLog> _fleet = new();
        private readonly BindingSource _bindingSource = new();

        public ${formName}()
        {
            InitializeComponent();
            InitFleet();
        }

        private void InitFleet()
        {
            _fleet.Add(new VehicleLog { Plate = "А 402 ОВ 777", Model = "ГАЗель Next 2.8", Driver = "Сидоров В. К.", MileageKm = 1450, FuelConsumedLiters = 188.5, MaintenanceStatus = "Готов к рейсу" });
            _fleet.Add(new VehicleLog { Plate = "Е 919 МК 199", Model = "КамАЗ 5490 Neo", Driver = "Романов А. М.", MileageKm = 3800, FuelConsumedLiters = 1140.0, MaintenanceStatus = "Готов к рейсу" });
            _fleet.Add(new VehicleLog { Plate = "О 115 ТС 799", Model = "Lada Largus фургон", Driver = "Ильин П. Н.", MileageKm = 820, FuelConsumedLiters = 69.7, MaintenanceStatus = "Требует ТО-2" });

            _bindingSource.DataSource = _fleet;
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv)
            {
                dgv.DataSource = _bindingSource;
                dgv.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            }
            UpdateFleetSummary();
        }

        private void UpdateFleetSummary()
        {
            int totalKm = _fleet.Sum(x => x.MileageKm);
            double totalFuel = _fleet.Sum(x => x.FuelConsumedLiters);
            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
            {
                lbl.Text = $"🚚 Автопарк: {_fleet.Count} ТС | Общий пробег: {totalKm:N0} км | Израсходовано топлива: {totalFuel:N1} л";
            }
        }

        private void ${formName}_Load(object sender, EventArgs e) => UpdateFleetSummary();

        private void btnAdd_Click(object sender, EventArgs e)
        {
            _fleet.Add(new VehicleLog
            {
                Plate = $"В {Random.Shared.Next(100, 999)} ТТ 777",
                Model = "Ford Transit Custom",
                Driver = "Новый водитель",
                MileageKm = Random.Shared.Next(500, 2500),
                FuelConsumedLiters = Random.Shared.Next(50, 250),
                MaintenanceStatus = "Готов к рейсу"
            });
            _bindingSource.ResetBindings(false);
            UpdateFleetSummary();
        }

        private void btnDelete_Click(object sender, EventArgs e)
        {
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv && dgv.CurrentRow?.DataBoundItem is VehicleLog log)
            {
                _fleet.Remove(log);
                _bindingSource.ResetBindings(false);
                UpdateFleetSummary();
            }
        }

        private void btnExport_Click(object sender, EventArgs e)
        {
            MessageBox.Show($"Путевой лист сформирован. Средний расход по парку: {(_fleet.Sum(x => x.FuelConsumedLiters) / _fleet.Sum(x => x.MileageKm) * 100):F1} л / 100 км.",
                "Диспетчерская служба", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void dgvItems_SelectionChanged(object sender, EventArgs e)
        {
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv && dgv.CurrentRow?.DataBoundItem is VehicleLog log)
            {
                if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                {
                    lbl.Text = $"ТС: {log.Model} ({log.Plate}) | Водитель: {log.Driver} | Расход: {log.AvgConsumptionPer100Km:F1} л/100км";
                }
            }
        }
    }
}
`,

  // tpl_07: Регистратура медклиники
  tpl_07: (formName, projectName) => `// ==============================================================================
// Template #7: Регистратура медклиники (.NET 8 WinForms)
// Category: 💼 Бизнес и Склад
// ==============================================================================
using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public record MedicalAppointment(int Id, string PatientName, string DoctorSpecialty, string DoctorName, DateTime Time, string Status);

        private readonly List<MedicalAppointment> _appointments = new();
        private readonly BindingSource _bindingSource = new();
        private int _counter = 100;

        public ${formName}()
        {
            InitializeComponent();
            SeedAppointments();
        }

        private void SeedAppointments()
        {
            _appointments.Add(new MedicalAppointment(_counter++, "Григорьев Максим Андреевич", "Терапевт", "Д-р Соколова А. В.", DateTime.Today.AddHours(9), "Подтвержден"));
            _appointments.Add(new MedicalAppointment(_counter++, "Зайцева Ольга Николаевна", "Кардиолог", "Д-р Белов К. И.", DateTime.Today.AddHours(10).AddMinutes(30), "Ожидает"));
            _appointments.Add(new MedicalAppointment(_counter++, "Федоров Кирилл Сергеевич", "Офтальмолог", "Д-р Морозова Т. П.", DateTime.Today.AddHours(11).AddMinutes(45), "Завершен"));
            _appointments.Add(new MedicalAppointment(_counter++, "Алексеева Дарья Владимировна", "Невролог", "Д-р Ковалев И. М.", DateTime.Today.AddHours(14), "Подтвержден"));

            _bindingSource.DataSource = _appointments;
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv)
            {
                dgv.DataSource = _bindingSource;
                dgv.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            }
            UpdateStatus();
        }

        private void UpdateStatus()
        {
            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
            {
                lbl.Text = $"🏥 Записей на сегодня: {_appointments.Count} | Свободных слотов: {18 - _appointments.Count}";
            }
        }

        private void ${formName}_Load(object sender, EventArgs e) => UpdateStatus();

        private void btnAdd_Click(object sender, EventArgs e)
        {
            _appointments.Add(new MedicalAppointment(
                _counter++,
                $"Пациент #{_counter}",
                "Терапевт",
                "Д-р Соколова А. В.",
                DateTime.Today.AddHours(15 + Random.Shared.Next(0, 3)),
                "Подтвержден"
            ));
            _bindingSource.ResetBindings(false);
            UpdateStatus();
        }

        private void btnDelete_Click(object sender, EventArgs e)
        {
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv && dgv.CurrentRow?.DataBoundItem is MedicalAppointment a)
            {
                _appointments.Remove(a);
                _bindingSource.ResetBindings(false);
                UpdateStatus();
            }
        }

        private void btnExport_Click(object sender, EventArgs e)
        {
            MessageBox.Show($"Дневной реестр приемов сформирован для регистратуры.\\nВсего приемов: {_appointments.Count}",
                "Электронная регистратура", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void dgvItems_SelectionChanged(object sender, EventArgs e)
        {
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv && dgv.CurrentRow?.DataBoundItem is MedicalAppointment a)
            {
                if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                {
                    lbl.Text = $"Пациент: {a.PatientName} -> Врач: {a.DoctorName} ({a.DoctorSpecialty}) | Время: {a.Time:HH:mm}";
                }
            }
        }
    }
}
`,

  // tpl_08: Электронная библиотека
  tpl_08: (formName, projectName) => `// ==============================================================================
// Template #8: Электронная библиотека (.NET 8 WinForms)
// Category: 💼 Бизнес и Склад
// ==============================================================================
using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public record LibraryBook(int Id, string Title, string Author, string Isbn, int Year, string Status, int DaysOverdue);

        private readonly List<LibraryBook> _books = new();
        private readonly BindingSource _bindingSource = new();
        private int _counter = 1;

        public ${formName}()
        {
            InitializeComponent();
            InitBooks();
        }

        private void InitBooks()
        {
            _books.Add(new LibraryBook(_counter++, "CLR via C# (4-е издание)", "Джеффри Рихтер", "978-5-4461-1254-8", 2021, "Выдана", 0));
            _books.Add(new LibraryBook(_counter++, "Паттерны проектирования", "Банда четырех (GoF)", "978-5-4461-0106-1", 2020, "В фонде", 0));
            _books.Add(new LibraryBook(_counter++, "Чистый код", "Роберт Мартин", "978-5-4461-0960-9", 2019, "Просрочена", 8));
            _books.Add(new LibraryBook(_counter++, "Алгоритмы. Построение и анализ", "Томас Кормен", "978-5-8459-2016-4", 2022, "Выдана", 0));

            _bindingSource.DataSource = _books;
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv)
            {
                dgv.DataSource = _bindingSource;
                dgv.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            }
            UpdateStatus();
        }

        private void UpdateStatus()
        {
            int inLibrary = _books.Count(b => b.Status == "В фонде");
            int overdue = _books.Count(b => b.DaysOverdue > 0);
            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
            {
                lbl.Text = $"📖 Всего книг: {_books.Count} | В фонде: {inLibrary} | Выдано: {_books.Count - inLibrary} | Задолженностей: {overdue}";
            }
        }

        private void ${formName}_Load(object sender, EventArgs e) => UpdateStatus();

        private void btnAdd_Click(object sender, EventArgs e)
        {
            _books.Add(new LibraryBook(_counter++, $"Новое поступление #{_counter}", "Современный автор", $"978-5-{Random.Shared.Next(1000, 9999)}", 2024, "В фонде", 0));
            _bindingSource.ResetBindings(false);
            UpdateStatus();
        }

        private void btnDelete_Click(object sender, EventArgs e)
        {
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv && dgv.CurrentRow?.DataBoundItem is LibraryBook b)
            {
                _books.Remove(b);
                _bindingSource.ResetBindings(false);
                UpdateStatus();
            }
        }

        private void btnExport_Click(object sender, EventArgs e)
        {
            MessageBox.Show($"Каталожная карточка фонда экспортирована.\\nВсего экземпляров в библиотеке: {_books.Count}",
                "Библиотечный каталог", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void dgvItems_SelectionChanged(object sender, EventArgs e)
        {
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv && dgv.CurrentRow?.DataBoundItem is LibraryBook b)
            {
                if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                {
                    lbl.Text = $"Книга: «{b.Title}» — {b.Author} | Статус: {b.Status}" + (b.DaysOverdue > 0 ? $" (Просрочено {b.DaysOverdue} дн. Штраф: {b.DaysOverdue * 50} ₽)" : "");
                }
            }
        }
    }
}
`,

  // tpl_09: Бронирование номеров отеля
  tpl_09: (formName, projectName) => `// ==============================================================================
// Template #9: Бронирование номеров отеля (.NET 8 WinForms)
// Category: 💼 Бизнес и Склад
// ==============================================================================
using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public record HotelReservation(int RoomNumber, string RoomType, string GuestName, DateTime CheckIn, DateTime CheckOut, decimal TotalPrice, string Status);

        private readonly List<HotelReservation> _reservations = new();
        private readonly BindingSource _bindingSource = new();

        public ${formName}()
        {
            InitializeComponent();
            InitReservations();
        }

        private void InitReservations()
        {
            _reservations.Add(new HotelReservation(101, "Стандарт Single", "Соловьев Андрей", DateTime.Today, DateTime.Today.AddDays(3), 13500m, "Заселен"));
            _reservations.Add(new HotelReservation(205, "Комфорт Double", "Николаева Ирина", DateTime.Today.AddDays(1), DateTime.Today.AddDays(5), 26000m, "Бронь"));
            _reservations.Add(new HotelReservation(310, "Люкс Президентский", "Ван Линь", DateTime.Today, DateTime.Today.AddDays(7), 84000m, "Заселен"));

            _bindingSource.DataSource = _reservations;
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv)
            {
                dgv.DataSource = _bindingSource;
                dgv.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            }
            UpdateStatus();
        }

        private void UpdateStatus()
        {
            decimal revenue = _reservations.Sum(r => r.TotalPrice);
            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
            {
                lbl.Text = $"🏨 Активных броней: {_reservations.Count} | Занятость фонда: {(_reservations.Count * 100 / 30)}% | Общая выручка: {revenue:N2} ₽";
            }
        }

        private void ${formName}_Load(object sender, EventArgs e) => UpdateStatus();

        private void btnAdd_Click(object sender, EventArgs e)
        {
            int room = 100 + _reservations.Count + 10;
            _reservations.Add(new HotelReservation(room, "Комфорт Double", $"Гость #{room}", DateTime.Today, DateTime.Today.AddDays(4), 22000m, "Бронь"));
            _bindingSource.ResetBindings(false);
            UpdateStatus();
        }

        private void btnDelete_Click(object sender, EventArgs e)
        {
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv && dgv.CurrentRow?.DataBoundItem is HotelReservation res)
            {
                _reservations.Remove(res);
                _bindingSource.ResetBindings(false);
                UpdateStatus();
            }
        }

        private void btnExport_Click(object sender, EventArgs e)
        {
            MessageBox.Show("Сводная шахматка заселения номеров выгружена.", "Отельный сервис", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void dgvItems_SelectionChanged(object sender, EventArgs e)
        {
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv && dgv.CurrentRow?.DataBoundItem is HotelReservation res)
            {
                if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                {
                    lbl.Text = $"Номер №{res.RoomNumber} ({res.RoomType}) | Гость: {res.GuestName} | Сумма: {res.TotalPrice:N2} ₽";
                }
            }
        }
    }
}
`,

  // tpl_10: Кассовый POS-терминал
  tpl_10: (formName, projectName) => `// ==============================================================================
// Template #10: Кассовый POS-терминал (.NET 8 WinForms)
// Category: 💼 Бизнес и Склад
// ==============================================================================
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public record ReceiptItem(string Name, int Qty, decimal Price, decimal Subtotal);

        private readonly List<ReceiptItem> _cart = new();

        public ${formName}()
        {
            InitializeComponent();
            ResetCart();
        }

        private void ResetCart()
        {
            _cart.Clear();
            _cart.Add(new ReceiptItem("Кофе Американо 300мл", 1, 190m, 190m));
            _cart.Add(new ReceiptItem("Круассан с миндалем", 2, 140m, 280m));
            _cart.Add(new ReceiptItem("Сэндвич с ветчиной", 1, 260m, 260m));
            RefreshPosReceipt();
        }

        private void RefreshPosReceipt()
        {
            decimal total = _cart.Sum(x => x.Subtotal);
            var sb = new StringBuilder();
            sb.AppendLine("========================================");
            sb.AppendLine("             КАССОВЫЙ ЧЕК #0492         ");
            sb.AppendLine($"           {DateTime.Now:dd.MM.yyyy HH:mm:ss}          ");
            sb.AppendLine("========================================");
            foreach (var item in _cart)
            {
                sb.AppendLine($"{item.Name,-24} x{item.Qty,-2} = {item.Subtotal,7:N2} ₽");
            }
            sb.AppendLine("----------------------------------------");
            sb.AppendLine($"ИТОГ К ОПЛАТЕ:               {total,10:N2} ₽");
            sb.AppendLine("========================================");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
            {
                rtb.Text = sb.ToString();
            }

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
            {
                lbl.Text = $"🛒 В чеке позиций: {_cart.Count} | ИТОГО К ОПЛАТЕ: {total:N2} ₽";
            }
        }

        private void ${formName}_Load(object sender, EventArgs e) => RefreshPosReceipt();

        private void btnCalculate_Click(object sender, EventArgs e)
        {
            decimal cash = 1000m;
            if (this.Controls.Find("txtInputA", true).FirstOrDefault() is TextBox tA && decimal.TryParse(tA.Text, out var parsedCash))
            {
                cash = parsedCash;
            }

            decimal total = _cart.Sum(x => x.Subtotal);
            if (cash < total)
            {
                MessageBox.Show($"Недостаточно внесенных средств! Сумма чека: {total:N2} ₽, внесено: {cash:N2} ₽.", "Касса", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            decimal change = cash - total;
            MessageBox.Show($"ОПЛАТА ПРИНЯТА УСПЕШНО!\\nЧек на сумму: {total:N2} ₽\\nВнесено наличными: {cash:N2} ₽\\nСДАЧА: {change:N2} ₽\\n\\nЧек фискализирован в ОФД.",
                "Фискальный регистратор", MessageBoxButtons.OK, MessageBoxIcon.Information);

            ResetCart();
        }
    }
}
`,
};
