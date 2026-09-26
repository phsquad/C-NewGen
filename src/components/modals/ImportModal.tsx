import React, { useState, useMemo, useRef } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { CSharpDesignerParser, ParseReportResult } from '../../utils/designerCsParser';
import {
  Upload,
  X,
  FileCode,
  AlertCircle,
  CheckCircle2,
  FileText,
  Zap,
  Minus,
  Square,
  ArrowRight,
  ShieldAlert,
  Clock,
  Code2,
  ChevronDown,
  ChevronRight,
  Wrench,
} from 'lucide-react';

const SAMPLE_LOGIN_FORM = `namespace WinFormsAuth
{
    partial class LoginForm
    {
        private System.Windows.Forms.Label lblHeader;
        private System.Windows.Forms.Label lblLogin;
        private System.Windows.Forms.TextBox txtLogin;
        private System.Windows.Forms.Label lblPassword;
        private System.Windows.Forms.TextBox txtPassword;
        private System.Windows.Forms.CheckBox chkRemember;
        private System.Windows.Forms.Button btnSubmit;
        private System.Windows.Forms.Button btnCancel;
        private System.Windows.Forms.ProgressBar pbLogin;

        private void InitializeComponent()
        {
            this.lblHeader = new System.Windows.Forms.Label();
            this.lblLogin = new System.Windows.Forms.Label();
            this.txtLogin = new System.Windows.Forms.TextBox();
            this.lblPassword = new System.Windows.Forms.Label();
            this.txtPassword = new System.Windows.Forms.TextBox();
            this.chkRemember = new System.Windows.Forms.CheckBox();
            this.btnSubmit = new System.Windows.Forms.Button();
            this.btnCancel = new System.Windows.Forms.Button();
            this.pbLogin = new System.Windows.Forms.ProgressBar();
            this.SuspendLayout();

            // lblHeader
            this.lblHeader.Location = new System.Drawing.Point(40, 24);
            this.lblHeader.Name = "lblHeader";
            this.lblHeader.Size = new System.Drawing.Size(320, 28);
            this.lblHeader.Text = "Вход в учетную запись";
            this.lblHeader.Font = new System.Drawing.Font("Segoe UI", 12F, System.Drawing.FontStyle.Bold);

            // lblLogin
            this.lblLogin.Location = new System.Drawing.Point(40, 68);
            this.lblLogin.Name = "lblLogin";
            this.lblLogin.Size = new System.Drawing.Size(120, 20);
            this.lblLogin.Text = "Имя пользователя:";

            // txtLogin
            this.txtLogin.Location = new System.Drawing.Point(40, 92);
            this.txtLogin.Name = "txtLogin";
            this.txtLogin.Size = new System.Drawing.Size(320, 32);
            this.txtLogin.Text = "admin@company.com";
            this.txtLogin.TextChanged += new System.EventHandler(this.txtLogin_TextChanged);

            // lblPassword
            this.lblPassword.Location = new System.Drawing.Point(40, 134);
            this.lblPassword.Name = "lblPassword";
            this.lblPassword.Size = new System.Drawing.Size(120, 20);
            this.lblPassword.Text = "Пароль доступа:";

            // txtPassword
            this.txtPassword.Location = new System.Drawing.Point(40, 158);
            this.txtPassword.Name = "txtPassword";
            this.txtPassword.Size = new System.Drawing.Size(320, 32);
            this.txtPassword.Text = "••••••••••••";

            // chkRemember
            this.chkRemember.Location = new System.Drawing.Point(40, 202);
            this.chkRemember.Name = "chkRemember";
            this.chkRemember.Size = new System.Drawing.Size(320, 24);
            this.chkRemember.Text = "Запомнить сессию на этом устройстве";
            this.chkRemember.Checked = true;

            // btnSubmit
            this.btnSubmit.Location = new System.Drawing.Point(40, 240);
            this.btnSubmit.Name = "btnSubmit";
            this.btnSubmit.Size = new System.Drawing.Size(180, 38);
            this.btnSubmit.Text = "Авторизоваться";
            this.btnSubmit.BackColor = System.Drawing.ColorTranslator.FromHtml("#2563EB");
            this.btnSubmit.ForeColor = System.Drawing.ColorTranslator.FromHtml("#FFFFFF");
            this.btnSubmit.Click += new System.EventHandler(this.btnSubmit_Click);

            // btnCancel
            this.btnCancel.Location = new System.Drawing.Point(230, 240);
            this.btnCancel.Name = "btnCancel";
            this.btnCancel.Size = new System.Drawing.Size(130, 38);
            this.btnCancel.Text = "Отмена";
            this.btnCancel.Click += new System.EventHandler(this.btnCancel_Click);

            // pbLogin
            this.pbLogin.Location = new System.Drawing.Point(40, 290);
            this.pbLogin.Name = "pbLogin";
            this.pbLogin.Size = new System.Drawing.Size(320, 12);
            this.pbLogin.Value = 65;

            // TODO: [Custom] Дополнительная инициализация безопасности
            // ApplyCustomTheme(this);

            // LoginForm
            this.ClientSize = new System.Drawing.Size(400, 330);
            this.Name = "LoginForm";
            this.Text = "Авторизация пользователя";
            this.Controls.Add(this.lblHeader);
            this.Controls.Add(this.lblLogin);
            this.Controls.Add(this.txtLogin);
            this.Controls.Add(this.lblPassword);
            this.Controls.Add(this.txtPassword);
            this.Controls.Add(this.chkRemember);
            this.Controls.Add(this.btnSubmit);
            this.Controls.Add(this.btnCancel);
            this.Controls.Add(this.pbLogin);
            this.ResumeLayout(false);
            this.PerformLayout();
        }
    }
}`;

const SAMPLE_FAULTY_FORM = `namespace BrokenSyntaxDemo
{
    partial class FaultyForm
    {
        private System.Windows.Forms.Button btnOk;
        private System.Windows.Forms.TextBox txtInput;
        private System.Windows.Forms.Label lblPrompt;

        private void InitializeComponent()
        {
            this.btnOk = new System.Windows.Forms.Button()
            this.txtInput = new System.Windows.Forms.TextBox();
            this.lblPrompt = new System.Windows.Forms.Label();

            // Пропущена точка с запятой в следующей строке:
            this.btnOk.Location = new System.Drawing.Point(50, 100)
            this.btnOk.Size = new System.Drawing.Size(140, 40);
            this.btnOk.Text = "Подтвердить"

            this.txtInput.Location = new System.Drawing.Point(50, 50);
            this.txtInput.Size = new System.Drawing.Size(200, 30);
            this.txtInput.Text = "Тестовое значение";

            this.lblPrompt.Location = new System.Drawing.Point(50, 20);
            this.lblPrompt.Size = new System.Drawing.Size(200, 24);
            this.lblPrompt.Text = "Введите имя:";

            // TODO: Ручная инициализация логгера
            // for (int i = 0; i < 3; i++) { Console.WriteLine("Init"); }

            this.ClientSize = new System.Drawing.Size(420, 220);
            this.Name = "FaultyForm";
            this.Text = "Восстановление поврежденного C# кода";
            this.Controls.Add(this.btnOk);
            this.Controls.Add(this.txtInput);
            this.Controls.Add(this.lblPrompt);
            this.ResumeLayout(false);
        }
    }
}`;

export const ImportModal: React.FC = () => {
  const { importModalOpen, setImportModalOpen, setProjectState, setSnapTelemetry } = useDesigner();
  const [code, setCode] = useState(SAMPLE_LOGIN_FORM);
  const [dragOver, setDragOver] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [showPreserved, setShowPreserved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parser = useMemo(() => new CSharpDesignerParser(), []);

  // Real-time Parser Report analysis (Pravka 7.1: Light Lexer <= 5ms)
  const parseReport: ParseReportResult = useMemo(() => {
    if (!code.trim()) {
      return {
        projectState: {} as any,
        formName: 'Form1',
        formSize: { width: 800, height: 450 },
        formTitle: 'Form1',
        controlsCount: 0,
        controlTypesSummary: {},
        eventsCount: 0,
        eventsList: [],
        syntaxErrorsCount: 0,
        warnings: [],
        preservedLines: [],
        preservedLinesCount: 0,
        autoRepairedErrorsCount: 0,
        executionTimeMs: 0,
        isValid: false,
      };
    }
    return parser.parseDesignerCode(code);
  }, [code, parser]);

  if (!importModalOpen) return null;

  const handleDeployToCanvas = () => {
    if (!parseReport.isValid || parseReport.controlsCount === 0) {
      return;
    }
    setProjectState(parseReport.projectState);
    setImportModalOpen(false);

    // Update live status bar telemetry
    setSnapTelemetry({
      targetName: parseReport.formName,
      alignSummary: `C# Ingestion: [${parseReport.controlsCount} контролов перенесено] | Сохранено строк: [${parseReport.preservedLinesCount}] | Скорость: [${parseReport.executionTimeMs} ms]`,
      isMagneticActive: true,
      deltaX: 0,
      deltaY: 0,
    });
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      if (content) {
        setCode(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const codeLines = code.split('\n');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="flex flex-col max-w-4xl w-full max-h-[92vh] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
        {/* WinForms Style Dialog Header */}
        <div className="h-10 px-3 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between select-none">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-100 font-sans">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>📥 Импорт C# Кода формы (.Designer.cs / UI-AST)</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-400">
            <button
              type="button"
              onClick={() => setImportModalOpen(false)}
              className="p-1 rounded hover:bg-zinc-700 hover:text-white cursor-pointer"
              title="Свернуть"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="p-1 rounded hover:bg-zinc-700 hover:text-white cursor-pointer"
              title="Развернуть"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setImportModalOpen(false)}
              className="p-1 rounded hover:bg-red-600 hover:text-white transition-colors ml-1 cursor-pointer"
              title="Закрыть"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* File Upload Zone & Presets Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Drag-and-Drop Zone */}
            <div
              onDragOver={e => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 border-2 border-dashed rounded-lg p-2 flex items-center justify-center gap-2 cursor-pointer transition-all ${
                dragOver
                  ? 'border-blue-500 bg-blue-950/40 text-blue-200 shadow-md'
                  : 'border-zinc-700 hover:border-zinc-500 bg-zinc-950/60 text-zinc-300'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-blue-400">[ 📄 Загрузить Form1.Designer.cs ]</span>{' '}
                <span className="text-zinc-500">или перетащите файл в эту область...</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".cs,.json,.txt"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                }}
                className="hidden"
              />
            </div>

            {/* Quick Sample Presets */}
            <div className="flex items-center gap-1.5 shrink-0 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <span className="text-[10px] text-zinc-500 font-medium px-1">Примеры:</span>
              <button
                type="button"
                onClick={() => setCode(SAMPLE_LOGIN_FORM)}
                className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                  code.includes('LoginForm')
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                🔐 Авторизация
              </button>
              <button
                type="button"
                onClick={() => setCode(SAMPLE_FAULTY_FORM)}
                title="Тест авто-восстановления пропущенных точек с запятой"
                className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                  code.includes('BrokenSyntaxDemo')
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                🔧 Тест Tolerance Engine
              </button>
            </div>
          </div>

          {/* Code Area with Line Numbering */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                📋 Исходный код метода InitializeComponent():
              </span>
              <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <Clock className="w-3 h-3" />
                  {parseReport.executionTimeMs} ms (Light Lexer)
                </span>
                <span>{codeLines.length} строк | {code.length} симв.</span>
              </div>
            </div>

            <div className="relative border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 flex h-60 font-mono text-xs shadow-inner">
              {/* Line Numbers Gutter */}
              <div className="w-10 bg-zinc-900 border-r border-zinc-800 py-2 select-none text-right pr-2 text-zinc-600 shrink-0 font-mono text-[11px] overflow-hidden">
                {codeLines.map((_, i) => (
                  <div key={i} className="leading-5">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Editable Code Textarea */}
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="// Вставьте код метода InitializeComponent()..."
                spellCheck={false}
                className="flex-1 bg-transparent p-2 text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden leading-5 resize-none overflow-auto font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Real-time Parser Inspection Report Box */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <span>🔍 Отчет C# парсера AST:</span>
                <span className="text-[10px] text-zinc-500 font-mono font-normal">
                  (Light Lexer + Tolerance Pipeline)
                </span>
              </span>
              <div className="flex items-center gap-2">
                {parseReport.autoRepairedErrorsCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-amber-950/60 border border-amber-800 text-amber-300 flex items-center gap-1">
                    <Wrench className="w-3 h-3" />
                    <span>Исправлено: {parseReport.autoRepairedErrorsCount}</span>
                  </span>
                )}
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                  parseReport.isValid
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                    : 'bg-red-950/60 border border-red-800 text-red-300'
                }`}>
                  {parseReport.isValid ? `✔ Разобрано за ${parseReport.executionTimeMs} ms` : '⚠️ Ошибка синтаксиса'}
                </span>
              </div>
            </div>

            {parseReport.isValid ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                  {/* 1. Form Dimensions */}
                  <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800/80 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-zinc-400 text-[11px]">Форма:</div>
                      <div className="font-semibold text-zinc-100 font-mono truncate max-w-[140px]">
                        [{parseReport.formName}]
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {parseReport.formSize.width}×{parseReport.formSize.height} px
                      </div>
                    </div>
                  </div>

                  {/* 2. Restored Controls */}
                  <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800/80 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-zinc-400 text-[11px]">Контролов:</div>
                      <div className="font-semibold text-cyan-300 font-mono">
                        [{parseReport.controlsCount} элементов]
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate max-w-[140px]">
                        {Object.entries(parseReport.controlTypesSummary)
                          .map(([t, count]) => `${count} ${t}`)
                          .join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* 3. Restored Events */}
                  <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800/80 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-zinc-400 text-[11px]">Связок событий:</div>
                      <div className="font-semibold text-amber-300 font-mono">
                        [{parseReport.eventsCount} метода]
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate max-w-[140px]">
                        {parseReport.eventsList.slice(0, 2).map(e => e.handlerName).join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* 4. Pravka 7.2: Preserved Custom Lines */}
                  <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800/80 flex items-start gap-2">
                    <Code2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-zinc-400 text-[11px]">Ручные вставки:</div>
                      <div className="font-semibold text-purple-300 font-mono">
                        [{parseReport.preservedLinesCount} строк]
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {parseReport.preservedLinesCount > 0 ? 'Сохранены в AST' : 'Нет вставок'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warnings / Auto-Repair collapsible panel (Pravka 7.3) */}
                {parseReport.warnings.length > 0 && (
                  <div className="border border-amber-900/50 rounded bg-amber-950/30 overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setShowWarnings(!showWarnings)}
                      className="w-full flex items-center justify-between px-2.5 py-1 text-amber-300 font-medium hover:bg-amber-950/40 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-amber-400" />
                        <span>Автоматически исправлено {parseReport.warnings.length} предупреждений</span>
                      </span>
                      {showWarnings ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {showWarnings && (
                      <div className="p-2 bg-zinc-950/80 border-t border-amber-900/50 space-y-1 text-[11px] text-amber-200 font-mono max-h-24 overflow-y-auto">
                        {parseReport.warnings.map((w, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="text-amber-500">⚠</span>
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Preserved Lines collapsible preview (Pravka 7.2) */}
                {parseReport.preservedLinesCount > 0 && (
                  <div className="border border-purple-900/50 rounded bg-purple-950/20 overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setShowPreserved(!showPreserved)}
                      className="w-full flex items-center justify-between px-2.5 py-1 text-purple-300 font-medium hover:bg-purple-950/30 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Сохраненные пользовательские комментарии и ручной код ({parseReport.preservedLinesCount})</span>
                      </span>
                      {showPreserved ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {showPreserved && (
                      <div className="p-2 bg-zinc-950/90 border-t border-purple-900/50 space-y-1 text-[11px] text-purple-200 font-mono max-h-24 overflow-y-auto">
                        {parseReport.preservedLines.map((line, idx) => (
                          <div key={idx} className="truncate">
                            <span className="text-zinc-600 mr-2">{idx + 1}</span>
                            <span className="text-emerald-400">{line}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2 bg-zinc-900 rounded text-xs text-zinc-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Вставьте корректный код C# метода InitializeComponent() для генерации UI-AST.</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3 bg-zinc-850 border-t border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setImportModalOpen(false)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
          >
            Отмена
          </button>

          <button
            type="button"
            disabled={!parseReport.isValid || parseReport.controlsCount === 0}
            onClick={handleDeployToCanvas}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-lg cursor-pointer ${
              parseReport.isValid && parseReport.controlsCount > 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/60'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400 fill-current" />
            <span>⚡️ РАЗВЕРНУТЬ НА ХОЛСТЕ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
