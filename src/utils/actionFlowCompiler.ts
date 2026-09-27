import { ActionStep } from '../types/actions';
import { ACTIONS_REGISTRY } from './actionRegistry';

/**
 * Compiles a list of ActionSteps into clean, indented C# code
 */
export function compileActionStepsToCSharp(steps: ActionStep[], indent = '            '): string {
  if (!steps || steps.length === 0) {
    return `${indent}// (Действий не настроено)`;
  }

  const lines: string[] = [];

  steps.forEach((step, index) => {
    const actDef = ACTIONS_REGISTRY.find(a => a.num === step.actionNum || a.id === step.actionId);
    const p = step.params || {};

    lines.push(`${indent}// [Шаг ${index + 1}: ${actDef?.title || 'Действие'}]`);

    switch (step.actionNum) {
      // 1-10: Окна и навигация
      case 1: {
        const form = p.targetForm || 'Form2';
        if (p.mode === 'ShowDialog') {
          lines.push(`${indent}using (var dlg = new ${form}()) { dlg.ShowDialog(); }`);
        } else {
          lines.push(`${indent}new ${form}().Show();`);
        }
        break;
      }
      case 2:
        lines.push(`${indent}this.Close();`);
        break;
      case 3:
        lines.push(`${indent}this.Hide();`);
        break;
      case 4:
        lines.push(`${indent}${p.targetForm || 'Form2'}.Show();`);
        break;
      case 5:
        lines.push(`${indent}this.CenterToScreen();`);
        break;
      case 6:
        lines.push(`${indent}this.WindowState = System.Windows.Forms.FormWindowState.Minimized;`);
        break;
      case 7:
        lines.push(`${indent}this.WindowState = System.Windows.Forms.FormWindowState.Maximized;`);
        break;
      case 8:
        lines.push(`${indent}this.${p.targetControl || 'tabControl1'}.SelectedIndex = ${p.tabIndex || 0};`);
        break;
      case 9:
        lines.push(`${indent}System.Windows.Forms.Application.Restart();`);
        break;
      case 10:
        lines.push(`${indent}System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("${p.url || 'https://google.com'}") { UseShellExecute = true });`);
        break;

      // 11-20: Свойства элементов
      case 11:
        lines.push(`${indent}this.${p.targetControl || 'lblResult'}.Text = "${escapeCs(p.textValue || '')}";`);
        break;
      case 12:
        lines.push(`${indent}this.${p.targetControl || 'textBox1'}.Clear();`);
        break;
      case 13:
        if (p.state === 'toggle') {
          lines.push(`${indent}this.${p.targetControl || 'button1'}.Enabled = !this.${p.targetControl || 'button1'}.Enabled;`);
        } else {
          lines.push(`${indent}this.${p.targetControl || 'button1'}.Enabled = ${p.state === 'true'};`);
        }
        break;
      case 14:
        if (p.state === 'toggle') {
          lines.push(`${indent}this.${p.targetControl || 'panel1'}.Visible = !this.${p.targetControl || 'panel1'}.Visible;`);
        } else {
          lines.push(`${indent}this.${p.targetControl || 'panel1'}.Visible = ${p.state === 'true'};`);
        }
        break;
      case 15:
        lines.push(`${indent}this.${p.targetControl || 'button1'}.BackColor = System.Drawing.ColorTranslator.FromHtml("${p.color || '#2563EB'}");`);
        break;
      case 16:
        lines.push(`${indent}this.${p.targetControl || 'lblStatus'}.ForeColor = System.Drawing.ColorTranslator.FromHtml("${p.color || '#EF4444'}");`);
        break;
      case 17:
        lines.push(`${indent}this.${p.targetControl || 'txtLogin'}.Focus();`);
        break;
      case 18:
        lines.push(`${indent}System.Windows.Forms.Clipboard.SetText(this.${p.targetControl || 'textBox1'}.Text);`);
        break;
      case 19:
        lines.push(`${indent}this.${p.targetControl || 'textBox1'}.Text = System.Windows.Forms.Clipboard.GetText();`);
        break;
      case 20:
        lines.push(`${indent}this.${p.targetControl || 'progressBar1'}.Value = ${p.val ?? 100};`);
        break;

      // 21-30: Диалоги и сообщения
      case 21:
        lines.push(`${indent}System.Windows.Forms.MessageBox.Show("${escapeCs(p.text || 'Сообщение')}", "${escapeCs(p.title || 'Инфо')}", System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.${p.icon || 'Information'});`);
        break;
      case 22: {
        lines.push(`${indent}if (System.Windows.Forms.MessageBox.Show("${escapeCs(p.question || 'Продолжить?')}", "${escapeCs(p.title || 'Подтверждение')}", System.Windows.Forms.MessageBoxButtons.YesNo, System.Windows.Forms.MessageBoxIcon.Question) == System.Windows.Forms.DialogResult.Yes)`);
        lines.push(`${indent}{`);
        lines.push(compileActionStepsToCSharp(step.thenBranch || [], indent + '    '));
        lines.push(`${indent}}`);
        if (step.elseBranch && step.elseBranch.length > 0) {
          lines.push(`${indent}else`);
          lines.push(`${indent}{`);
          lines.push(compileActionStepsToCSharp(step.elseBranch, indent + '    '));
          lines.push(`${indent}}`);
        }
        break;
      }
      case 23:
        lines.push(`${indent}using (var ofd = new System.Windows.Forms.OpenFileDialog() { Filter = "${escapeCs(p.filter || '*.*')}" })`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    if (ofd.ShowDialog() == System.Windows.Forms.DialogResult.OK)`);
        lines.push(`${indent}    {`);
        lines.push(`${indent}        this.${p.targetControl || 'txtFilePath'}.Text = ofd.FileName;`);
        lines.push(`${indent}    }`);
        lines.push(`${indent}}`);
        break;
      case 24:
        lines.push(`${indent}using (var sfd = new System.Windows.Forms.SaveFileDialog() { Filter = "${escapeCs(p.filter || '*.*')}", FileName = "${escapeCs(p.defaultName || 'file.txt')}" })`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    if (sfd.ShowDialog() == System.Windows.Forms.DialogResult.OK)`);
        lines.push(`${indent}    {`);
        lines.push(`${indent}        this.${p.targetControl || 'txtSavePath'}.Text = sfd.FileName;`);
        lines.push(`${indent}    }`);
        lines.push(`${indent}}`);
        break;
      case 25:
        lines.push(`${indent}using (var fbd = new System.Windows.Forms.FolderBrowserDialog() { Description = "${escapeCs(p.description || 'Выберите папку')}" })`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    if (fbd.ShowDialog() == System.Windows.Forms.DialogResult.OK)`);
        lines.push(`${indent}    {`);
        lines.push(`${indent}        this.${p.targetControl || 'txtFolderPath'}.Text = fbd.SelectedPath;`);
        lines.push(`${indent}    }`);
        lines.push(`${indent}}`);
        break;
      case 26:
        lines.push(`${indent}using (var cd = new System.Windows.Forms.ColorDialog())`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    if (cd.ShowDialog() == System.Windows.Forms.DialogResult.OK)`);
        lines.push(`${indent}    {`);
        lines.push(`${indent}        this.${p.targetControl || 'btnSample'}.BackColor = cd.Color;`);
        lines.push(`${indent}    }`);
        lines.push(`${indent}}`);
        break;
      case 27:
        lines.push(`${indent}using (var fd = new System.Windows.Forms.FontDialog())`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    if (fd.ShowDialog() == System.Windows.Forms.DialogResult.OK)`);
        lines.push(`${indent}    {`);
        lines.push(`${indent}        this.${p.targetControl || 'txtContent'}.Font = fd.Font;`);
        lines.push(`${indent}    }`);
        lines.push(`${indent}}`);
        break;
      case 28:
        lines.push(`${indent}string inputVal = Microsoft.VisualBasic.Interaction.InputBox("${escapeCs(p.prompt || 'Введите значение:')}", "${escapeCs(p.title || 'Ввод')}");`);
        lines.push(`${indent}if (!string.IsNullOrEmpty(inputVal)) this.${p.targetControl || 'txtName'}.Text = inputVal;`);
        break;
      case 29:
        lines.push(`${indent}System.Media.SystemSounds.${p.soundType || 'Asterisk'}.Play();`);
        break;
      case 30:
        lines.push(`${indent}// Привлечение внимания миганием окна в панели задач`);
        lines.push(`${indent}this.Activate();`);
        break;

      // 31-40: Переменные и логика
      case 31:
        lines.push(`${indent}var ${p.varName || 'tempVar'} = "${escapeCs(p.varValue || '')}";`);
        break;
      case 32:
        lines.push(`${indent}if (int.TryParse(this.${p.targetControl || 'lblCounter'}.Text, out int cnt))`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    this.${p.targetControl || 'lblCounter'}.Text = (cnt + (${p.step || 1})).ToString();`);
        lines.push(`${indent}}`);
        break;
      case 33: {
        const op = p.operator || '==';
        let condStr = '';
        if (op === 'contains') {
          condStr = `this.${p.sourceControl || 'txtPassword'}.Text.Contains("${escapeCs(p.compareValue || '')}")`;
        } else {
          condStr = `this.${p.sourceControl || 'txtPassword'}.Text ${op} "${escapeCs(p.compareValue || '')}"`;
        }

        lines.push(`${indent}if (${condStr})`);
        lines.push(`${indent}{`);
        lines.push(compileActionStepsToCSharp(step.thenBranch || [], indent + '    '));
        lines.push(`${indent}}`);
        if (step.elseBranch && step.elseBranch.length > 0) {
          lines.push(`${indent}else`);
          lines.push(`${indent}{`);
          lines.push(compileActionStepsToCSharp(step.elseBranch, indent + '    '));
          lines.push(`${indent}}`);
        }
        break;
      }
      case 34: {
        const op = p.op || '+';
        lines.push(`${indent}if (double.TryParse(this.${p.inputA || 'txtNumberA'}.Text, out double valA) && double.TryParse(this.${p.inputB || 'txtNumberB'}.Text, out double valB))`);
        lines.push(`${indent}{`);
        if (op === '^') {
          lines.push(`${indent}    this.${p.targetResult || 'lblResult'}.Text = Math.Pow(valA, valB).ToString();`);
        } else {
          lines.push(`${indent}    this.${p.targetResult || 'lblResult'}.Text = (valA ${op} valB).ToString();`);
        }
        lines.push(`${indent}}`);
        break;
      }
      case 35:
        lines.push(`${indent}this.${p.targetControl || 'lblRandomResult'}.Text = new System.Random().Next(${p.minVal || 1}, ${p.maxVal || 100} + 1).ToString();`);
        break;
      case 36:
        lines.push(`${indent}this.${p.targetControl || 'chkOption'}.Checked = !this.${p.targetControl || 'chkOption'}.Checked;`);
        break;
      case 37:
        lines.push(`${indent}this.${p.targetControl || 'lblWelcome'}.Text = $"${(p.template || 'Привет, {val}!').replace('{val}', `{this.${p.sourceControl || 'txtName'}.Text}`)}";`);
        break;
      case 38:
        if (p.caseType === 'ToLower') {
          lines.push(`${indent}this.${p.targetControl || 'txtInput'}.Text = this.${p.targetControl || 'txtInput'}.Text.ToLower();`);
        } else if (p.caseType === 'Trim') {
          lines.push(`${indent}this.${p.targetControl || 'txtInput'}.Text = this.${p.targetControl || 'txtInput'}.Text.Trim();`);
        } else {
          lines.push(`${indent}this.${p.targetControl || 'txtInput'}.Text = this.${p.targetControl || 'txtInput'}.Text.ToUpper();`);
        }
        break;
      case 39:
        lines.push(`${indent}if (int.TryParse(this.${p.targetControl || 'numInput'}.Text, out int clampVal))`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    this.${p.targetControl || 'numInput'}.Text = Math.Clamp(clampVal, ${p.min || 0}, ${p.max || 100}).ToString();`);
        lines.push(`${indent}}`);
        break;
      case 40:
        lines.push(`${indent}if (string.IsNullOrWhiteSpace(this.${p.targetControl || 'txtUsername'}.Text))`);
        lines.push(`${indent}{`);
        lines.push(compileActionStepsToCSharp(step.thenBranch || [], indent + '    '));
        lines.push(`${indent}}`);
        if (step.elseBranch && step.elseBranch.length > 0) {
          lines.push(`${indent}else`);
          lines.push(`${indent}{`);
          lines.push(compileActionStepsToCSharp(step.elseBranch, indent + '    '));
          lines.push(`${indent}}`);
        }
        break;

      // 41-50: SQLite базы данных
      case 41:
        lines.push(`${indent}// SQLite INSERT операция`);
        lines.push(`${indent}using (var cmd = new Microsoft.Data.Sqlite.SqliteCommand("INSERT INTO ${p.tableName || 'Users'} DEFAULT VALUES", sqliteConn))`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    cmd.ExecuteNonQuery();`);
        lines.push(`${indent}}`);
        break;
      case 42:
        lines.push(`${indent}// Загрузка таблицы '${p.tableName || 'Users'}' в ${p.gridControl || 'dgvProducts'}`);
        lines.push(`${indent}var dt = new System.Data.DataTable();`);
        lines.push(`${indent}using (var da = new Microsoft.Data.Sqlite.SqliteDataAdapter("SELECT * FROM ${p.tableName || 'Users'}", sqliteConn))`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    da.Fill(dt);`);
        lines.push(`${indent}    this.${p.gridControl || 'dgvProducts'}.DataSource = dt;`);
        lines.push(`${indent}}`);
        break;
      case 43:
        lines.push(`${indent}if (this.${p.gridControl || 'dgvProducts'}.CurrentRow != null)`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    var id = this.${p.gridControl || 'dgvProducts'}.CurrentRow.Cells[0].Value;`);
        lines.push(`${indent}    using (var cmd = new Microsoft.Data.Sqlite.SqliteCommand($"DELETE FROM ${p.tableName || 'Users'} WHERE Id = {id}", sqliteConn))`);
        lines.push(`${indent}    {`);
        lines.push(`${indent}        cmd.ExecuteNonQuery();`);
        lines.push(`${indent}    }`);
        lines.push(`${indent}}`);
        break;
      case 44:
        lines.push(`${indent}using (var cmd = new Microsoft.Data.Sqlite.SqliteCommand("UPDATE ${p.tableName || 'Users'} SET UpdatedAt = datetime('now')", sqliteConn))`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    cmd.ExecuteNonQuery();`);
        lines.push(`${indent}}`);
        break;
      case 45:
        lines.push(`${indent}if (this.${p.gridControl || 'dgvProducts'}.DataSource is System.Data.DataTable dtView)`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    dtView.DefaultView.RowFilter = $"${p.searchColumn || 'Name'} LIKE '%{this.${p.searchControl || 'txtSearchQuery'}.Text}%'";`);
        lines.push(`${indent}}`);
        break;
      case 46:
        lines.push(`${indent}using (var cmd = new Microsoft.Data.Sqlite.SqliteCommand("SELECT COUNT(*) FROM ${p.tableName || 'Products'}", sqliteConn))`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    this.${p.targetLabel || 'lblTotalCount'}.Text = $"Записей: {cmd.ExecuteScalar()}";`);
        lines.push(`${indent}}`);
        break;
      case 47:
        lines.push(`${indent}using (var cmd = new Microsoft.Data.Sqlite.SqliteCommand("DELETE FROM ${p.tableName || 'Logs'};", sqliteConn))`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    cmd.ExecuteNonQuery();`);
        lines.push(`${indent}}`);
        break;
      case 48:
        lines.push(`${indent}// Экспорт строк DataGridView в ${p.fileName || 'export.csv'}`);
        lines.push(`${indent}var sb = new System.Text.StringBuilder();`);
        lines.push(`${indent}foreach (System.Windows.Forms.DataGridViewRow row in this.${p.gridControl || 'dgvProducts'}.Rows)`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    var cells = row.Cells.Cast<System.Windows.Forms.DataGridViewCell>().Select(c => c.Value?.ToString() ?? "");`);
        lines.push(`${indent}    sb.AppendLine(string.Join(";", cells));`);
        lines.push(`${indent}}`);
        lines.push(`${indent}System.IO.File.WriteAllText("${escapeCs(p.fileName || 'export.csv')}", sb.ToString());`);
        break;
      case 49:
        lines.push(`${indent}// Импорт CSV файла '${p.filePath || 'import.csv'}' в таблицу SQLite`);
        break;
      case 50:
        lines.push(`${indent}using (var cmd = new Microsoft.Data.Sqlite.SqliteCommand("${escapeCs(p.query || 'SELECT 1')}", sqliteConn))`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    cmd.ExecuteNonQuery();`);
        lines.push(`${indent}}`);
        break;

      // 51-60: Сеть и API
      case 51:
        lines.push(`${indent}using (var client = new System.Net.Http.HttpClient())`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    var resp = await client.GetStringAsync("${p.url || 'https://api.site.com'}");`);
        lines.push(`${indent}    this.${p.targetControl || 'txtApiResponse'}.Text = resp;`);
        lines.push(`${indent}}`);
        break;
      case 52:
        lines.push(`${indent}using (var client = new System.Net.Http.HttpClient())`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    var content = new System.Net.Http.StringContent("${escapeCs(p.jsonPayload || '{}')}", System.Text.Encoding.UTF8, "application/json");`);
        lines.push(`${indent}    var postResp = await client.PostAsync("${p.url || 'https://api.site.com'}", content);`);
        lines.push(`${indent}}`);
        break;
      case 53:
        lines.push(`${indent}using (var client = new System.Net.Http.HttpClient())`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    var data = await client.GetByteArrayAsync("${p.url || 'https://site.com/file.zip'}");`);
        lines.push(`${indent}    await System.IO.File.WriteAllBytesAsync("${escapeCs(p.destPath || 'downloaded.zip')}", data);`);
        lines.push(`${indent}}`);
        break;
      case 54:
        lines.push(`${indent}if (System.Net.NetworkInformation.NetworkInterface.GetIsNetworkAvailable())`);
        lines.push(`${indent}{`);
        lines.push(compileActionStepsToCSharp(step.thenBranch || [], indent + '    '));
        lines.push(`${indent}}`);
        if (step.elseBranch && step.elseBranch.length > 0) {
          lines.push(`${indent}else`);
          lines.push(`${indent}{`);
          lines.push(compileActionStepsToCSharp(step.elseBranch, indent + '    '));
          lines.push(`${indent}}`);
        }
        break;
      case 55:
        lines.push(`${indent}try`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    using (var doc = System.Text.Json.JsonDocument.Parse(this.${p.jsonSource || 'txtApiResponse'}.Text))`);
        lines.push(`${indent}    {`);
        lines.push(`${indent}        this.${p.targetControl || 'lblResult'}.Text = doc.RootElement.GetProperty("${p.jsonKey || 'temperature'}").ToString();`);
        lines.push(`${indent}    }`);
        lines.push(`${indent}} catch { }`);
        break;
      case 56:
        lines.push(`${indent}this.${p.targetControl || 'pictureBox1'}.LoadAsync("${p.url || 'https://images.unsplash.com'}");`);
        break;
      case 57:
        lines.push(`${indent}using (var client = new System.Net.Http.HttpClient())`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    await client.GetAsync($"https://api.telegram.org/bot${p.botToken}/sendMessage?chat_id=${p.chatId}&text={Uri.EscapeDataString("${escapeCs(p.messageText || 'Уведомление')}")}");`);
        lines.push(`${indent}}`);
        break;
      case 58:
        lines.push(`${indent}var ws = new System.Net.WebSockets.ClientWebSocket();`);
        lines.push(`${indent}await ws.ConnectAsync(new Uri("${p.wsUrl || 'wss://echo.websocket.org'}"), System.Threading.CancellationToken.None);`);
        break;
      case 59:
        lines.push(`${indent}var buffer = System.Text.Encoding.UTF8.GetBytes("${escapeCs(p.message || 'ping')}");`);
        lines.push(`${indent}await ws.SendAsync(new ArraySegment<byte>(buffer), System.Net.WebSockets.WebSocketMessageType.Text, true, System.Threading.CancellationToken.None);`);
        break;
      case 60:
        lines.push(`${indent}using (var client = new System.Net.Http.HttpClient())`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    this.${p.targetControl || 'lblIpAddress'}.Text = await client.GetStringAsync("https://api.ipify.org");`);
        lines.push(`${indent}}`);
        break;

      // 61-70: Таймеры и анимации
      case 61:
        lines.push(`${indent}this.${p.timerName || 'timer1'}.Interval = ${p.intervalMs || 1000};`);
        lines.push(`${indent}this.${p.timerName || 'timer1'}.Start();`);
        break;
      case 62:
        lines.push(`${indent}this.${p.timerName || 'timer1'}.Stop();`);
        break;
      case 63:
        lines.push(`${indent}await System.Threading.Tasks.Task.Delay(${p.delayMs || 1000});`);
        break;
      case 64:
        lines.push(`${indent}this.${p.targetControl || 'lblTime'}.Text = System.DateTime.Now.ToString("${p.format || 'HH:mm:ss'}");`);
        break;
      case 65:
        lines.push(`${indent}if (int.TryParse(this.${p.targetControl || 'lblSecondsLeft'}.Text, out int sec) && sec > 0)`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    this.${p.targetControl || 'lblSecondsLeft'}.Text = (sec - 1).ToString();`);
        lines.push(`${indent}}`);
        break;
      case 66:
        lines.push(`${indent}int days = (this.${p.pickerB || 'dateTimePicker2'}.Value - this.${p.pickerA || 'dateTimePicker1'}.Value).Days;`);
        lines.push(`${indent}this.${p.targetControl || 'lblDaysDiff'}.Text = $"{days} дн.";`);
        break;
      case 67:
        lines.push(`${indent}for (double op = 0; op <= 1.0; op += 0.05) { this.Opacity = op; await System.Threading.Tasks.Task.Delay(${p.speedMs || 20}); }`);
        break;
      case 68:
        lines.push(`${indent}for (double op = 1.0; op >= 0.0; op -= 0.05) { this.Opacity = op; await System.Threading.Tasks.Task.Delay(${p.speedMs || 20}); }`);
        break;
      case 69:
        lines.push(`${indent}for (int i = 0; i < 8; i++) { this.Left += (i % 2 == 0 ? ${p.intensity || 10} : -${p.intensity || 10}); await System.Threading.Tasks.Task.Delay(25); }`);
        break;
      case 70:
        lines.push(`${indent}if ("${p.actionType || 'Start'}" == "Start") stopwatch.Start(); else if ("${p.actionType}" == "Stop") stopwatch.Stop(); else stopwatch.Reset();`);
        break;

      // 71-80: Списки и таблицы
      case 71:
        lines.push(`${indent}this.${p.targetControl || 'listBox1'}.Items.Add(this.${p.sourceControl || 'txtNewItem'}.Text);`);
        break;
      case 72:
        lines.push(`${indent}if (this.${p.targetControl || 'listBox1'}.SelectedIndex != -1)`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    this.${p.targetControl || 'listBox1'}.Items.RemoveAt(this.${p.targetControl || 'listBox1'}.SelectedIndex);`);
        lines.push(`${indent}}`);
        break;
      case 73:
        lines.push(`${indent}this.${p.targetControl || 'listBox1'}.Items.Clear();`);
        break;
      case 74:
        lines.push(`${indent}this.${p.targetControl || 'listBox1'}.Sorted = true;`);
        break;
      case 75:
        lines.push(`${indent}this.${p.targetControl || 'txtSelectedItem'}.Text = this.${p.sourceControl || 'listBox1'}.SelectedItem?.ToString() ?? "";`);
        break;
      case 76:
        lines.push(`${indent}if (this.${p.targetControl || 'comboBox1'}.Items.Count > ${p.index || 0})`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    this.${p.targetControl || 'comboBox1'}.SelectedIndex = ${p.index || 0};`);
        lines.push(`${indent}}`);
        break;
      case 77:
        lines.push(`${indent}if (this.${p.targetControl || 'listBox1'}.Items.Contains("${escapeCs(p.searchText || 'Admin')}"))`);
        lines.push(`${indent}{`);
        lines.push(compileActionStepsToCSharp(step.thenBranch || [], indent + '    '));
        lines.push(`${indent}}`);
        if (step.elseBranch && step.elseBranch.length > 0) {
          lines.push(`${indent}else`);
          lines.push(`${indent}{`);
          lines.push(compileActionStepsToCSharp(step.elseBranch, indent + '    '));
          lines.push(`${indent}}`);
        }
        break;
      case 78:
        lines.push(`${indent}if (this.${p.treeControl || 'treeView1'}.SelectedNode != null)`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    this.${p.treeControl || 'treeView1'}.SelectedNode.Nodes.Add("${escapeCs(p.nodeText || 'Новая папка')}");`);
        lines.push(`${indent}}`);
        break;
      case 79:
        lines.push(`${indent}var shuffled = this.${p.targetControl || 'listBox1'}.Items.Cast<object>().OrderBy(x => System.Guid.NewGuid()).ToArray();`);
        lines.push(`${indent}this.${p.targetControl || 'listBox1'}.Items.Clear();`);
        lines.push(`${indent}this.${p.targetControl || 'listBox1'}.Items.AddRange(shuffled);`);
        break;
      case 80:
        lines.push(`${indent}System.IO.File.WriteAllLines("${escapeCs(p.filePath || 'list.txt')}", this.${p.sourceControl || 'listBox1'}.Items.Cast<string>());`);
        break;

      // 81-90: Файлы и диск
      case 81:
        lines.push(`${indent}if (System.IO.File.Exists("${escapeCs(p.filePath || 'data.txt')}"))`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    this.${p.targetControl || 'txtFileContent'}.Text = System.IO.File.ReadAllText("${escapeCs(p.filePath || 'data.txt')}");`);
        lines.push(`${indent}}`);
        break;
      case 82:
        lines.push(`${indent}System.IO.File.WriteAllText("${escapeCs(p.filePath || 'data.txt')}", this.${p.sourceControl || 'txtFileContent'}.Text);`);
        break;
      case 83:
        lines.push(`${indent}System.IO.File.AppendAllText("${escapeCs(p.filePath || 'log.txt')}", $"{DateTime.Now}: ${escapeCs(p.logMessage || '')}\\n");`);
        break;
      case 84:
        lines.push(`${indent}if (System.IO.File.Exists("${escapeCs(p.filePath || 'config.json')}"))`);
        lines.push(`${indent}{`);
        lines.push(compileActionStepsToCSharp(step.thenBranch || [], indent + '    '));
        lines.push(`${indent}}`);
        if (step.elseBranch && step.elseBranch.length > 0) {
          lines.push(`${indent}else`);
          lines.push(`${indent}{`);
          lines.push(compileActionStepsToCSharp(step.elseBranch, indent + '    '));
          lines.push(`${indent}}`);
        }
        break;
      case 85:
        lines.push(`${indent}if (System.IO.File.Exists("${escapeCs(p.filePath || 'temp.txt')}"))`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    System.IO.File.Delete("${escapeCs(p.filePath || 'temp.txt')}");`);
        lines.push(`${indent}}`);
        break;
      case 86:
        lines.push(`${indent}System.IO.Directory.CreateDirectory("${escapeCs(p.dirPath || 'Reports')}");`);
        break;
      case 87:
        lines.push(`${indent}if (System.IO.Directory.Exists("${escapeCs(p.folderPath || './Documents')}"))`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    this.${p.targetList || 'listBox1'}.Items.Clear();`);
        lines.push(`${indent}    this.${p.targetList || 'listBox1'}.Items.AddRange(System.IO.Directory.GetFiles("${escapeCs(p.folderPath || './Documents')}"));`);
        lines.push(`${indent}}`);
        break;
      case 88:
        lines.push(`${indent}if (System.IO.File.Exists("${escapeCs(p.filePath || 'image.png')}"))`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    this.${p.targetControl || 'lblFileSize'}.Text = $"{new System.IO.FileInfo("${escapeCs(p.filePath || 'image.png')}").Length / 1024} KB";`);
        lines.push(`${indent}}`);
        break;
      case 89:
        lines.push(`${indent}// Сохранение параметра '${p.settingKey || 'Theme'}' = '${p.settingValue || 'Dark'}'`);
        break;
      case 90:
        lines.push(`${indent}// Чтение параметра '${p.settingKey || 'Theme'}'`);
        break;

      // 91-100: Звук, медиа и система
      case 91:
        lines.push(`${indent}using (var sp = new System.Media.SoundPlayer("${escapeCs(p.soundPath || 'click.wav')}"))`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    sp.Play();`);
        lines.push(`${indent}}`);
        break;
      case 92:
        lines.push(`${indent}// Остановка звукового потока`);
        break;
      case 93:
        lines.push(`${indent}using (var bmp = new System.Drawing.Bitmap(this.Width, this.Height))`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    this.DrawToBitmap(bmp, new System.Drawing.Rectangle(0, 0, this.Width, this.Height));`);
        lines.push(`${indent}    this.${p.targetPicture || 'pictureBox1'}.Image = (System.Drawing.Image)bmp.Clone();`);
        lines.push(`${indent}}`);
        break;
      case 94:
        lines.push(`${indent}System.Diagnostics.Process.Start("${escapeCs(p.programName || 'calc.exe')}");`);
        break;
      case 95:
        lines.push(`${indent}this.${p.targetControl || 'lblUserName'}.Text = System.Environment.UserName;`);
        break;
      case 96:
        lines.push(`${indent}this.${p.targetControl || 'lblResolution'}.Text = $"{System.Windows.Forms.Screen.PrimaryScreen.Bounds.Width}x{System.Windows.Forms.Screen.PrimaryScreen.Bounds.Height}";`);
        break;
      case 97:
        lines.push(`${indent}this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedSingle;`);
        lines.push(`${indent}this.MaximizeBox = false;`);
        break;
      case 98:
        lines.push(`${indent}this.TopMost = ${p.isTopMost !== 'false'};`);
        break;
      case 99:
        lines.push(`${indent}if (this.${p.targetPicture || 'pictureBox1'}.Image != null)`);
        lines.push(`${indent}{`);
        lines.push(`${indent}    this.${p.targetPicture || 'pictureBox1'}.Image.RotateFlip(System.Drawing.RotateFlipType.${p.angle || 'Rotate90FlipNone'});`);
        lines.push(`${indent}    this.${p.targetPicture || 'pictureBox1'}.Refresh();`);
        lines.push(`${indent}}`);
        break;
      case 100:
        lines.push(`${indent}System.Environment.Exit(0);`);
        break;

      default:
        lines.push(`${indent}// Выполнение действия #${step.actionNum} (${actDef?.title || 'Unknown'})`);
        break;
    }
  });

  return lines.join('\n');
}

function escapeCs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
