// ==============================================================================
// 🎓 Category 2: Education, Science & University Labs Real C# Implementations (11-20)
// ==============================================================================

export const EDUCATION_TEMPLATES_CODE: Record<string, (formName: string, projectName: string) => string> = {
  // tpl_11: Матричный калькулятор 4x4
  tpl_11: (formName, projectName) => `// ==============================================================================
// Template #11: Матричный калькулятор 4x4 (.NET 8 WinForms)
// Category: 🎓 Университет и Лабы
// ==============================================================================
using System;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        private double[,] matrixA = new double[4, 4]
        {
            { 2, 1, 0, 0 },
            { 1, 2, 1, 0 },
            { 0, 1, 2, 1 },
            { 0, 0, 1, 2 }
        };

        private double[,] matrixB = new double[4, 4]
        {
            { 1, 0, 0, 0 },
            { 0, 1, 0, 0 },
            { 0, 0, 1, 0 },
            { 0, 0, 0, 1 }
        };

        public ${formName}()
        {
            InitializeComponent();
        }

        private void ${formName}_Load(object sender, EventArgs e)
        {
            DisplayMatrices();
        }

        private void DisplayMatrices()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== ИСХОДНАЯ МАТРИЦА A (4x4) ===");
            AppendMatrix(sb, matrixA);
            sb.AppendLine();
            sb.AppendLine("=== ИСХОДНАЯ МАТРИЦА B (4x4) ===");
            AppendMatrix(sb, matrixB);

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
            {
                rtb.Text = sb.ToString();
            }
        }

        private void btnCalculate_Click(object sender, EventArgs e)
        {
            double detA = CalculateDeterminant4x4(matrixA);
            double[,] product = MultiplyMatrices(matrixA, matrixB);
            double[,] transposed = TransposeMatrix(matrixA);

            var sb = new StringBuilder();
            sb.AppendLine($"📊 ВЫЧИСЛЕНИЯ ВЫСШЕЙ АЛГЕБРЫ (МАТРИЦЫ 4x4):");
            sb.AppendLine($"• Определитель det(A) = {detA:F4}");
            sb.AppendLine($"• След матрицы tr(A) = {matrixA[0,0] + matrixA[1,1] + matrixA[2,2] + matrixA[3,3]}");
            sb.AppendLine();
            sb.AppendLine("• Произведение A × B (4x4):");
            AppendMatrix(sb, product);
            sb.AppendLine();
            sb.AppendLine("• Транспонированная матрица A^T:");
            AppendMatrix(sb, transposed);

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
            {
                rtb.Text = sb.ToString();
            }

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
            {
                lbl.Text = $"✅ Расчет завершен: det(A) = {detA:F2} | Метод Гаусса с выбором ведущего элемента";
            }
        }

        private double CalculateDeterminant4x4(double[,] mat)
        {
            double[,] a = (double[,])mat.Clone();
            int n = 4;
            double det = 1;

            for (int i = 0; i < n; i++)
            {
                int pivot = i;
                for (int j = i + 1; j < n; j++)
                {
                    if (Math.Abs(a[j, i]) > Math.Abs(a[pivot, i]))
                        pivot = j;
                }
                if (Math.Abs(a[pivot, i]) < 1e-9) return 0.0;

                if (pivot != i)
                {
                    for (int k = i; k < n; k++)
                    {
                        double tmp = a[i, k];
                        a[i, k] = a[pivot, k];
                        a[pivot, k] = tmp;
                    }
                    det = -det;
                }
                det *= a[i, i];

                for (int j = i + 1; j < n; j++)
                {
                    double factor = a[j, i] / a[i, i];
                    for (int k = i; k < n; k++)
                    {
                        a[j, k] -= factor * a[i, k];
                    }
                }
            }
            return det;
        }

        private double[,] MultiplyMatrices(double[,] a, double[,] b)
        {
            double[,] res = new double[4, 4];
            for (int i = 0; i < 4; i++)
                for (int j = 0; j < 4; j++)
                    for (int k = 0; k < 4; k++)
                        res[i, j] += a[i, k] * b[k, j];
            return res;
        }

        private double[,] TransposeMatrix(double[,] a)
        {
            double[,] res = new double[4, 4];
            for (int i = 0; i < 4; i++)
                for (int j = 0; j < 4; j++)
                    res[j, i] = a[i, j];
            return res;
        }

        private void AppendMatrix(StringBuilder sb, double[,] m)
        {
            for (int r = 0; r < 4; r++)
            {
                sb.Append("  [ ");
                for (int c = 0; c < 4; c++)
                {
                    sb.Append(string.Format("{0,7:F2} ", m[r, c]));
                }
                sb.AppendLine("]");
            }
        }
    }
}
`,

  // tpl_12: Численное интегрирование
  tpl_12: (formName, projectName) => `// ==============================================================================
// Template #12: Численное интегрирование (.NET 8 WinForms)
// Category: 🎓 Университет и Лабы
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

        private void ${formName}_Load(object sender, EventArgs e)
        {
            RunIntegration();
        }

        private double TestFunction(double x)
        {
            // f(x) = sin(x) * e^(-x/5) + x^2 / 10
            return Math.Sin(x) * Math.Exp(-x / 5.0) + (x * x) / 10.0;
        }

        private void btnCalculate_Click(object sender, EventArgs e)
        {
            RunIntegration();
        }

        private void RunIntegration()
        {
            double a = 0.0;
            double b = 5.0;
            int n = 1000;

            if (this.Controls.Find("txtInputA", true).FirstOrDefault() is TextBox tA && double.TryParse(tA.Text, out var pA))
                a = pA;
            if (this.Controls.Find("txtInputB", true).FirstOrDefault() is TextBox tB && double.TryParse(tB.Text, out var pB))
                b = pB;

            double h = (b - a) / n;

            // Метод прямоугольников (средних)
            double rectSum = 0;
            for (int i = 0; i < n; i++)
                rectSum += TestFunction(a + (i + 0.5) * h);
            double rectIntegral = rectSum * h;

            // Метод трапеций
            double trapSum = 0.5 * (TestFunction(a) + TestFunction(b));
            for (int i = 1; i < n; i++)
                trapSum += TestFunction(a + i * h);
            double trapIntegral = trapSum * h;

            // Метод Симпсона (парабол)
            double simpsonSum = TestFunction(a) + TestFunction(b);
            for (int i = 1; i < n; i++)
            {
                double x = a + i * h;
                simpsonSum += (i % 2 == 1 ? 4 : 2) * TestFunction(x);
            }
            double simpsonIntegral = (h / 3.0) * simpsonSum;

            var sb = new StringBuilder();
            sb.AppendLine("=== ЧИСЛЕННОЕ ИНТЕГРИРОВАНИЕ МАТЕМАТИЧЕСКИХ ФУНКЦИЙ ===");
            sb.AppendLine($"Функция: f(x) = sin(x)*e^(-x/5) + x²/10");
            sb.AppendLine($"Пределы: a = {a:F2}, b = {b:F2}, разбиений n = {n}");
            sb.AppendLine($"Шаг сетки: h = {h:F6}");
            sb.AppendLine("-------------------------------------------------------");
            sb.AppendLine($"1. Метод средних прямоугольников: {rectIntegral:F8}");
            sb.AppendLine($"2. Метод трапеций:                {trapIntegral:F8}");
            sb.AppendLine($"3. Метод Симпсона (парабол):      {simpsonIntegral:F8} ★ (наивысшая точность O(h⁴))");
            sb.AppendLine("-------------------------------------------------------");
            sb.AppendLine($"Разница Симпсон vs Трапеции: {Math.Abs(simpsonIntegral - trapIntegral):E4}");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = $"Интеграл = {simpsonIntegral:F6} | Метод Симпсона n={n}";
        }
    }
}
`,

  // tpl_13: Физический маятник
  tpl_13: (formName, projectName) => `// ==============================================================================
// Template #13: Физический маятник (.NET 8 WinForms)
// Category: 🎓 Университет и Лабы
// ==============================================================================
using System;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        private double _length = 1.0;     // Длина нити L (м)
        private double _gravity = 9.81;    // Ускорение свободного падения g (м/с²)
        private double _damping = 0.05;    // Коэффициент затухания
        private double _theta = Math.PI / 4; // Начальный угол (45 градусов)
        private double _omega = 0.0;       // Угловая скорость

        public ${formName}()
        {
            InitializeComponent();
        }

        private void ${formName}_Load(object sender, EventArgs e) => RunSimulation();

        private void btnCalculate_Click(object sender, EventArgs e) => RunSimulation();

        private void RunSimulation()
        {
            if (this.Controls.Find("txtInputA", true).FirstOrDefault() is TextBox tA && double.TryParse(tA.Text, out var pL) && pL > 0)
                _length = pL;
            if (this.Controls.Find("txtInputB", true).FirstOrDefault() is TextBox tB && double.TryParse(tB.Text, out var pD))
                _damping = pD;

            double periodT = 2 * Math.PI * Math.Sqrt(_length / _gravity);
            double freqF = 1.0 / periodT;

            // Интегрирование Рунге-Кутта 4 порядка на 10 шагов вперед
            double dt = 0.05;
            var sb = new StringBuilder();
            sb.AppendLine("=== ФИЗИЧЕСКИЙ МАЯТНИК (СИМУЛЯЦИЯ РУНГЕ-КУТТЫ RK4) ===");
            sb.AppendLine($"Параметры: L = {_length:F2} м, g = {_gravity} м/с², Затухание k = {_damping:F3}");
            sb.AppendLine($"Теоретический период малых колебаний: T = {periodT:F3} с");
            sb.AppendLine($"Собственная циклическая частота: ω0 = {Math.Sqrt(_gravity / _length):F3} рад/с ({freqF:F3} Гц)");
            sb.AppendLine("------------------------------------------------------------------");
            sb.AppendLine(" Время t (с) | Угол θ (рад) | Угол θ (град) | Скорость ω (рад/с) | Энергия (Дж)");
            sb.AppendLine("------------------------------------------------------------------");

            double t = 0;
            double curTheta = _theta;
            double curOmega = _omega;

            for (int step = 0; step <= 10; step++)
            {
                double deg = curTheta * (180.0 / Math.PI);
                double energy = 0.5 * curOmega * curOmega + (_gravity / _length) * (1 - Math.Cos(curTheta));
                sb.AppendLine($"{t,11:F2} | {curTheta,11:F4} | {deg,12:F2}° | {curOmega,17:F4} | {energy,11:F4}");

                // RK4 step
                double k1v = -(_gravity / _length) * Math.Sin(curTheta) - _damping * curOmega;
                double k1x = curOmega;

                double k2v = -(_gravity / _length) * Math.Sin(curTheta + 0.5 * dt * k1x) - _damping * (curOmega + 0.5 * dt * k1v);
                double k2x = curOmega + 0.5 * dt * k1v;

                double k3v = -(_gravity / _length) * Math.Sin(curTheta + 0.5 * dt * k2x) - _damping * (curOmega + 0.5 * dt * k2v);
                double k3x = curOmega + 0.5 * dt * k2v;

                double k4v = -(_gravity / _length) * Math.Sin(curTheta + dt * k3x) - _damping * (curOmega + dt * k3v);
                double k4x = curOmega + dt * k3v;

                curOmega += (dt / 6.0) * (k1v + 2 * k2v + 2 * k3v + k4v);
                curTheta += (dt / 6.0) * (k1x + 2 * k2x + 2 * k3x + k4x);
                t += dt;
            }

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = $"Период T = {periodT:F2} с | Затухание: {_damping:F3} | Моделирование RK4 стабильно";
        }
    }
}
`,

  // tpl_14: Журнал успеваемости (GPA)
  tpl_14: (formName, projectName) => `// ==============================================================================
// Template #14: Журнал успеваемости (GPA) (.NET 8 WinForms)
// Category: 🎓 Университет и Лабы
// ==============================================================================
using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public class GradeRecord
        {
            public string Subject { get; set; } = string.Empty;
            public int Credits { get; set; }
            public int Score100 { get; set; }
            public string EctsGrade => Score100 switch
            {
                >= 90 => "A (Отлично)",
                >= 82 => "B (Очень хорошо)",
                >= 75 => "C (Хорошо)",
                >= 67 => "D (Удовл.)",
                >= 60 => "E (Посредственно)",
                _ => "F (Неудовлетворительно)"
            };
            public double GradePoint => Score100 switch
            {
                >= 90 => 4.0,
                >= 82 => 3.5,
                >= 75 => 3.0,
                >= 67 => 2.5,
                >= 60 => 2.0,
                _ => 0.0
            };
        }

        private readonly List<GradeRecord> _grades = new();
        private readonly BindingSource _bindingSource = new();

        public ${formName}()
        {
            InitializeComponent();
            InitGrades();
        }

        private void InitGrades()
        {
            _grades.Add(new GradeRecord { Subject = "Математический анализ", Credits = 5, Score100 = 94 });
            _grades.Add(new GradeRecord { Subject = "Программирование на C#", Credits = 6, Score100 = 98 });
            _grades.Add(new GradeRecord { Subject = "Базы данных (SQL)", Credits = 4, Score100 = 85 });
            _grades.Add(new GradeRecord { Subject = "Операционные системы", Credits = 4, Score100 = 78 });
            _grades.Add(new GradeRecord { Subject = "Теория вероятностей", Credits = 3, Score100 = 88 });

            _bindingSource.DataSource = _grades;
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv)
            {
                dgv.DataSource = _bindingSource;
                dgv.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            }
            RecalculateGpa();
        }

        private void RecalculateGpa()
        {
            int totalCredits = _grades.Sum(g => g.Credits);
            double weightedPoints = _grades.Sum(g => g.GradePoint * g.Credits);
            double gpa = totalCredits > 0 ? weightedPoints / totalCredits : 0;
            double avgScore = _grades.Average(g => g.Score100);

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
            {
                lbl.Text = $"🎓 Итоговый GPA: {gpa:F2} / 4.0 | Средний балл: {avgScore:F1} / 100 | Всего кредитов ECTS: {totalCredits}";
            }
        }

        private void ${formName}_Load(object sender, EventArgs e) => RecalculateGpa();

        private void btnAdd_Click(object sender, EventArgs e)
        {
            _grades.Add(new GradeRecord
            {
                Subject = $"Дисциплина #{_grades.Count + 1}",
                Credits = Random.Shared.Next(3, 6),
                Score100 = Random.Shared.Next(65, 100)
            });
            _bindingSource.ResetBindings(false);
            RecalculateGpa();
        }

        private void btnDelete_Click(object sender, EventArgs e)
        {
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv && dgv.CurrentRow?.DataBoundItem is GradeRecord g)
            {
                _grades.Remove(g);
                _bindingSource.ResetBindings(false);
                RecalculateGpa();
            }
        }

        private void btnExport_Click(object sender, EventArgs e)
        {
            MessageBox.Show($"Академическая ведомость студента сформирована. Средневзвешенный балл GPA: {(_grades.Sum(g => g.GradePoint * g.Credits) / _grades.Sum(g => g.Credits)):F2}.",
                "Деканат", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void dgvItems_SelectionChanged(object sender, EventArgs e)
        {
            if (this.Controls.Find("dgvItems", true).FirstOrDefault() is DataGridView dgv && dgv.CurrentRow?.DataBoundItem is GradeRecord g)
            {
                if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                {
                    lbl.Text = $"Предмет: {g.Subject} ({g.Credits} ECTS) | Оценка: {g.Score100} б. -> {g.EctsGrade}";
                }
            }
        }
    }
}
`,

  // tpl_15: Генератор экзаменационных тестов
  tpl_15: (formName, projectName) => `// ==============================================================================
// Template #15: Генератор экзаменационных тестов (.NET 8 WinForms)
// Category: 🎓 Университет и Лабы
// ==============================================================================
using System;
using System.Collections.Generic;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        public record QuizQuestion(string Question, string[] Options, int CorrectIndex);

        private readonly List<QuizQuestion> _bank = new()
        {
            new("Какое ключевое слово используется для наследования класса в C#?", new[] { "extends", ":", "implements", "inherits" }, 1),
            new("Какой тип данных является ссылочным (Reference Type) в CLR?", new[] { "int", "struct", "string", "bool" }, 2),
            new("Сложность поиска элемента в сбалансированном красно-черном дереве:", new[] { "O(1)", "O(n)", "O(log n)", "O(n log n)" }, 2),
            new("Какой модификатор запрещает дальнейшее переопределение виртуального метода?", new[] { "sealed", "static", "readonly", "const" }, 0),
            new("Какая сборка мусора (GC) включена по умолчанию в ASP.NET Core?", new[] { "Workstation GC", "Server GC", "Concurrent GC", "None" }, 1)
        };

        private int _currentIdx = 0;
        private int _score = 0;

        public ${formName}()
        {
            InitializeComponent();
        }

        private void ${formName}_Load(object sender, EventArgs e) => DisplayQuestion();

        private void DisplayQuestion()
        {
            if (_currentIdx < _bank.Count)
            {
                var q = _bank[_currentIdx];
                var sb = new StringBuilder();
                sb.AppendLine($"Вопрос {_currentIdx + 1} из {_bank.Count}:");
                sb.AppendLine(q.Question);
                sb.AppendLine();
                for (int i = 0; i < q.Options.Length; i++)
                {
                    sb.AppendLine($"  [{i + 1}] {q.Options[i]}");
                }
                sb.AppendLine();
                sb.AppendLine($"Введите номер правильного ответа (1..4) в поле ввода и нажмите 'Выполнить расчет'.");

                if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                    rtb.Text = sb.ToString();

                if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                    lbl.Text = $"Тестирование: Вопрос {_currentIdx + 1}/{_bank.Count} | Текущий балл: {_score}";
            }
            else
            {
                double pct = (_score * 100.0) / _bank.Count;
                string mark = pct switch { >= 85 => "ОТЛИЧНО (5)", >= 70 => "ХОРОШО (4)", >= 50 => "УДОВЛ (3)", _ => "НЕУД (2)" };

                var sb = new StringBuilder();
                sb.AppendLine("🎓 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО!");
                sb.AppendLine($"Правильных ответов: {_score} из {_bank.Count} ({pct:F1}%)");
                sb.AppendLine($"ИТОГОВАЯ ОЦЕНКА: {mark}");

                if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                    rtb.Text = sb.ToString();

                if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                    lbl.Text = $"Экзамен сдан! Оценка: {mark}";
            }
        }

        private void btnCalculate_Click(object sender, EventArgs e)
        {
            if (_currentIdx >= _bank.Count)
            {
                _currentIdx = 0;
                _score = 0;
                DisplayQuestion();
                return;
            }

            int selected = 1;
            if (this.Controls.Find("txtInputA", true).FirstOrDefault() is TextBox tA && int.TryParse(tA.Text, out var val))
                selected = val;

            int chosenIndex = selected - 1;
            if (chosenIndex == _bank[_currentIdx].CorrectIndex)
            {
                _score++;
                MessageBox.Show("Верно! +1 балл.", "Экзаменатор", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            else
            {
                MessageBox.Show($"Неверно. Правильный ответ: {_bank[_currentIdx].Options[_bank[_currentIdx].CorrectIndex]}", "Экзаменатор", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }

            _currentIdx++;
            DisplayQuestion();
        }
    }
}
`,

  // tpl_16: Графы и алгоритм Дейкстры
  tpl_16: (formName, projectName) => `// ==============================================================================
// Template #16: Графы и алгоритм Дейкстры (.NET 8 WinForms)
// Category: 🎓 Университет и Лабы
// ==============================================================================
using System;
using System.Collections.Generic;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        // 6 вершин: A(0), B(1), C(2), D(3), E(4), F(5)
        private readonly int[,] _graph = new int[6, 6]
        {
            { 0, 4, 2, 0, 0, 0 },
            { 4, 0, 1, 5, 0, 0 },
            { 2, 1, 0, 8, 10, 0 },
            { 0, 5, 8, 0, 2, 6 },
            { 0, 0, 10, 2, 0, 3 },
            { 0, 0, 0, 6, 3, 0 }
        };

        private readonly string[] _names = { "A", "B", "C", "D", "E", "F" };

        public ${formName}()
        {
            InitializeComponent();
        }

        private void ${formName}_Load(object sender, EventArgs e) => RunDijkstra(0);

        private void btnCalculate_Click(object sender, EventArgs e)
        {
            int startNode = 0;
            if (this.Controls.Find("txtInputA", true).FirstOrDefault() is TextBox tA && int.TryParse(tA.Text, out var nodeVal))
                startNode = Math.Clamp(nodeVal, 0, 5);

            RunDijkstra(startNode);
        }

        private void RunDijkstra(int start)
        {
            int n = 6;
            int[] dist = new int[n];
            bool[] visited = new bool[n];
            int[] prev = new int[n];

            for (int i = 0; i < n; i++)
            {
                dist[i] = int.MaxValue;
                prev[i] = -1;
            }
            dist[start] = 0;

            for (int count = 0; count < n - 1; count++)
            {
                int min = int.MaxValue;
                int u = -1;
                for (int v = 0; v < n; v++)
                {
                    if (!visited[v] && dist[v] <= min)
                    {
                        min = dist[v];
                        u = v;
                    }
                }

                if (u == -1) break;
                visited[u] = true;

                for (int v = 0; v < n; v++)
                {
                    if (!visited[v] && _graph[u, v] != 0 && dist[u] != int.MaxValue && dist[u] + _graph[u, v] < dist[v])
                    {
                        dist[v] = dist[u] + _graph[u, v];
                        prev[v] = u;
                    }
                }
            }

            var sb = new StringBuilder();
            sb.AppendLine($"=== АЛГОРИТМ ДЕЙКСТРЫ: КРАТЧАЙШИЕ ПУТИ ИЗ ВЕРШИНЫ {_names[start]} ===");
            sb.AppendLine("Вершина | Дистанция | Маршрут следования");
            sb.AppendLine("----------------------------------------");
            for (int i = 0; i < n; i++)
            {
                var path = new List<string>();
                int curr = i;
                while (curr != -1)
                {
                    path.Insert(0, _names[curr]);
                    curr = prev[curr];
                }
                sb.AppendLine($"  {_names[i],-5} | {dist[i],9} | {string.Join(" ➔ ", path)}");
            }

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = $"Граф Дейкстры: найдено 6 кратчайших путей из вершины {_names[start]}";
        }
    }
}
`,

  // tpl_17: Таблица Менделеева
  tpl_17: (formName, projectName) => `// ==============================================================================
// Template #17: Таблица Менделеева (.NET 8 WinForms)
// Category: 🎓 Университет и Лабы
// ==============================================================================
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        private static readonly Dictionary<string, (string Name, double Weight, int Number)> Elements = new()
        {
            ["H"]  = ("Водород", 1.008, 1),
            ["He"] = ("Гелий", 4.0026, 2),
            ["C"]  = ("Углерод", 12.011, 6),
            ["N"]  = ("Азот", 14.007, 7),
            ["O"]  = ("Кислород", 15.999, 8),
            ["Na"] = ("Натрий", 22.990, 11),
            ["Mg"] = ("Магний", 24.305, 12),
            ["Al"] = ("Алюминий", 26.982, 13),
            ["Si"] = ("Кремний", 28.085, 14),
            ["P"]  = ("Фосфор", 30.974, 15),
            ["S"]  = ("Сера", 32.06, 16),
            ["Cl"] = ("Хлор", 35.45, 17),
            ["K"]  = ("Калий", 39.098, 19),
            ["Ca"] = ("Кальций", 40.078, 20),
            ["Fe"] = ("Железо", 55.845, 26),
            ["Cu"] = ("Медь", 63.546, 29),
            ["Ag"] = ("Серебро", 107.868, 47),
            ["Au"] = ("Золото", 196.967, 79)
        };

        public ${formName}()
        {
            InitializeComponent();
        }

        private void ${formName}_Load(object sender, EventArgs e) => CalculateMolarMass("H2SO4");

        private void btnCalculate_Click(object sender, EventArgs e)
        {
            string formula = "H2SO4";
            if (this.Controls.Find("txtInputA", true).FirstOrDefault() is TextBox tA && !string.IsNullOrWhiteSpace(tA.Text))
                formula = tA.Text.Trim();

            CalculateMolarMass(formula);
        }

        private void CalculateMolarMass(string formula)
        {
            var regex = new Regex(@"([A-Z][a-z]?)(\d*)");
            var matches = regex.Matches(formula);

            double totalMass = 0;
            var sb = new StringBuilder();
            sb.AppendLine($"=== ХИМИЧЕСКИЙ АНАЛИЗ ФОРМУЛЫ: {formula} ===");
            sb.AppendLine("Элемент | Номер Z | Название    | Атомный вес | Кол-во | Масса в веществе");
            sb.AppendLine("----------------------------------------------------------------------");

            foreach (Match m in matches)
            {
                string symbol = m.Groups[1].Value;
                int count = string.IsNullOrEmpty(m.Groups[2].Value) ? 1 : int.Parse(m.Groups[2].Value);

                if (Elements.TryGetValue(symbol, out var info))
                {
                    double partMass = info.Weight * count;
                    totalMass += partMass;
                    sb.AppendLine($"  {symbol,-5} | {info.Number,7} | {info.Name,-11} | {info.Weight,11:F3} | {count,6} | {partMass,16:F3} г/моль");
                }
            }

            sb.AppendLine("----------------------------------------------------------------------");
            sb.AppendLine($"ИТОГОВАЯ МОЛЯРНАЯ МАССА: {totalMass:F3} г/моль (Дальтон)");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = $"M({formula}) = {totalMass:F3} г/моль";
        }
    }
}
`,

  // tpl_18: Статистика и регрессия
  tpl_18: (formName, projectName) => `// ==============================================================================
// Template #18: Статистика и регрессия (.NET 8 WinForms)
// Category: 🎓 Университет и Лабы
// ==============================================================================
using System;
using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace ${projectName}
{
    public partial class ${formName} : Form
    {
        private readonly double[] _x = { 1, 2, 3, 4, 5, 6, 7, 8 };
        private readonly double[] _y = { 2.1, 3.9, 6.2, 8.1, 10.3, 11.9, 14.2, 16.0 };

        public ${formName}()
        {
            InitializeComponent();
        }

        private void ${formName}_Load(object sender, EventArgs e) => ComputeRegression();

        private void btnCalculate_Click(object sender, EventArgs e) => ComputeRegression();

        private void ComputeRegression()
        {
            int n = _x.Length;
            double sumX = _x.Sum();
            double sumY = _y.Sum();
            double sumXY = _x.Zip(_y, (a, b) => a * b).Sum();
            double sumX2 = _x.Select(a => a * a).Sum();
            double sumY2 = _y.Select(b => b * b).Sum();

            // Линейная регрессия МНК: y = slope * x + intercept
            double slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            double intercept = (sumY - slope * sumX) / n;

            // Коэффициент корреляции Пирсона r
            double numerator = n * sumXY - sumX * sumY;
            double denominator = Math.Sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
            double r = numerator / denominator;
            double r2 = r * r;

            var sb = new StringBuilder();
            sb.AppendLine("=== СТАТИСТИЧЕСКИЙ АНАЛИЗ И ЛИНЕЙНАЯ РЕГРЕССИЯ (МНК) ===");
            sb.AppendLine($"Объем выборки n = {n}");
            sb.AppendLine($"Среднее X: {sumX / n:F3}, Среднее Y: {sumY / n:F3}");
            sb.AppendLine("-------------------------------------------------------");
            sb.AppendLine($"Уравнение регрессии: y = {slope:F4} * x + ({intercept:F4})");
            sb.AppendLine($"Коэффициент Пирсона r:       {r:F4} (очень сильная связь)");
            sb.AppendLine($"Коэффициент детерминации R²: {r2:F4} ({r2 * 100:F1}% объясненной дисперсии)");
            sb.AppendLine("-------------------------------------------------------");
            sb.AppendLine(" Точка | X факт | Y факт | Y модель (МНК) | Ошибка e");
            for (int i = 0; i < n; i++)
            {
                double pred = slope * _x[i] + intercept;
                sb.AppendLine($"  #{i + 1}   | {_x[i],6:F1} | {_y[i],6:F1} | {pred,14:F2} | {Math.Abs(_y[i] - pred),8:F2}");
            }

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = $"МНК: y = {slope:F2}x + {intercept:F2} | R² = {r2:F3}";
        }
    }
}
`,

  // tpl_19: Конвертер систем счисления
  tpl_19: (formName, projectName) => `// ==============================================================================
// Template #19: Конвертер систем счисления (.NET 8 WinForms)
// Category: 🎓 Университет и Лабы
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

        private void ${formName}_Load(object sender, EventArgs e) => ConvertNumber(4242);

        private void btnCalculate_Click(object sender, EventArgs e)
        {
            long num = 255;
            if (this.Controls.Find("txtInputA", true).FirstOrDefault() is TextBox tA && long.TryParse(tA.Text, out var val))
                num = val;

            ConvertNumber(num);
        }

        private void ConvertNumber(long dec)
        {
            string bin = Convert.ToString(dec, 2);
            string oct = Convert.ToString(dec, 8);
            string hex = Convert.ToString(dec, 16).ToUpper();

            var sb = new StringBuilder();
            sb.AppendLine("=== КОНВЕРТЕР СИСТЕМ СЧИСЛЕНИЯ И БИТОВЫЕ МАСКИ ===");
            sb.AppendLine($"Десятичное (DEC, Base-10):  {dec}");
            sb.AppendLine($"Шестнадцатеричное (HEX):    0x{hex}");
            sb.AppendLine($"Восьмеричное (OCT, Base-8):  0o{oct}");
            sb.AppendLine($"Двоичное (BIN, Base-2):     0b_{FormatBinary(bin)}");
            sb.AppendLine("--------------------------------------------------");
            sb.AppendLine($"Байт 0 (Low):  0x{((byte)(dec & 0xFF)):X2} ({dec & 0xFF})");
            sb.AppendLine($"Байт 1 (High): 0x{((byte)((dec >> 8) & 0xFF)):X2} ({(dec >> 8) & 0xFF})");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = $"DEC {dec} = HEX 0x{hex} = BIN {bin}";
        }

        private string FormatBinary(string bin)
        {
            int pad = (4 - (bin.Length % 4)) % 4;
            string padded = new string('0', pad) + bin;
            var parts = new System.Collections.Generic.List<string>();
            for (int i = 0; i < padded.Length; i += 4)
                parts.Add(padded.Substring(i, 4));
            return string.Join("_", parts);
        }
    }
}
`,

  // tpl_20: Симулятор логических схем
  tpl_20: (formName, projectName) => `// ==============================================================================
// Template #20: Симулятор логических схем (.NET 8 WinForms)
// Category: 🎓 Университет и Лабы
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

        private void ${formName}_Load(object sender, EventArgs e) => GenerateTruthTable();

        private void btnCalculate_Click(object sender, EventArgs e) => GenerateTruthTable();

        private void GenerateTruthTable()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== ТАБЛИЦА ИСТИННОСТИ БАЗОВЫХ ЛОГИЧЕСКИХ ВЕНТИЛЕЙ ===");
            sb.AppendLine(" Вход A | Вход B | AND (И) | OR (ИЛИ) | XOR (Сложение) | NAND | NOR");
            sb.AppendLine("-------------------------------------------------------------------");

            bool[] bools = { false, true };
            foreach (bool a in bools)
            {
                foreach (bool b in bools)
                {
                    int ia = a ? 1 : 0;
                    int ib = b ? 1 : 0;
                    int andVal = (a && b) ? 1 : 0;
                    int orVal = (a || b) ? 1 : 0;
                    int xorVal = (a ^ b) ? 1 : 0;
                    int nandVal = (!(a && b)) ? 1 : 0;
                    int norVal = (!(a || b)) ? 1 : 0;

                    sb.AppendLine($"   {ia,3}  |   {ib,3}  |   {andVal,3}   |   {orVal,3}  |     {xorVal,3}        |  {nandVal,3} | {norVal,3}");
                }
            }

            sb.AppendLine("-------------------------------------------------------------------");
            sb.AppendLine("Полусумматор (Half-Adder): Sum = A XOR B, Carry = A AND B");

            if (this.Controls.Find("txtResultLog", true).FirstOrDefault() is RichTextBox rtb)
                rtb.Text = sb.ToString();

            if (this.Controls.Find("lblStatus", true).FirstOrDefault() is Label lbl)
                lbl.Text = "Логическая матрица истинности рассчитана";
        }
    }
}
`,
};
