import React, { useState, useRef, useEffect } from 'react';
import { useDesigner } from '../../context/DesignerContext';
import { StorageManager } from '../../utils/StorageManager';
import { generateDesignerCs, generateCodeBehindCs } from '../../utils/codeGenerators';
import { generatePythonCustomTkinter, generateWebHtml } from '../../utils/polyglotGenerators';
import { InBrowserRoslynEngine } from '../../utils/InBrowserRoslynEngine';
import { Terminal as TerminalIcon, Trash2, CheckCircle2, Play, Cpu } from 'lucide-react';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'system';
  text: string;
}

export const DevOSTerminal: React.FC = () => {
  const { project, nodes, setLiveRunOpen } = useDesigner();
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<TerminalLine[]>([
    {
      id: '1',
      type: 'system',
      text: '🖥 DevOS CLI Terminal Runtime v17.0 (.NET 9.0 / Python 3.12 Engine)',
    },
    {
      id: '2',
      type: 'system',
      text: 'Введите "ls", "cat Form1.Designer.cs", "dotnet run", "rm -rf cache" или "help" для справки.',
    },
  ]);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    const newLines: TerminalLine[] = [
      ...history,
      { id: Date.now().toString(), type: 'input', text: `$ ${trimmed}` },
    ];

    const args = trimmed.split(/\s+/);
    const mainCommand = args[0].toLowerCase();

    if (mainCommand === 'clear' || mainCommand === 'cls') {
      setHistory([]);
      setInputVal('');
      return;
    }

    if (mainCommand === 'help') {
      newLines.push({
        id: (Date.now() + 1).toString(),
        type: 'output',
        text: `💡 Доступные команды DevOS CLI Virtual Shell:
  • ls, dir          - Показать виртуальные файлы VFS проекта
  • cat <file>       - Просмотреть реальный сгенерированный C# / Python / HTML код
  • dotnet run       - Скомпилировать и запустить форму в Live Sandbox (F5)
  • dotnet build     - Выполнить статический AST аудит элементов
  • python app.py    - Симуляция вызова Python CustomTkinter
  • rm -rf cache     - Очистить LocalStorage, SessionStorage и IndexedDB (0 ms)
  • clear            - Очистить консоль`,
      });
    } else if (mainCommand === 'ls' || mainCommand === 'dir') {
      const designerCode = generateDesignerCs(project);
      const codeBehindCode = generateCodeBehindCs(project);
      const pythonCode = generatePythonCustomTkinter(project);
      const htmlCode = generateWebHtml(project);

      const projName = project.projectName || 'MyLabApp';

      newLines.push({
        id: (Date.now() + 1).toString(),
        type: 'output',
        text: `📁 /workspace/${projName}/
  ├── 📄 Form1.Designer.cs   (${designerCode.length} bytes)
  ├── 📄 Form1.cs            (${codeBehindCode.length} bytes)
  ├── 📄 app.py              (${pythonCode.length} bytes)
  ├── 📄 index.html          (${htmlCode.length} bytes)
  └── 📄 ${projName}.csproj    (Build Project File)`,
      });
    } else if (mainCommand === 'cat') {
      const fileName = args[1];
      if (!fileName) {
        newLines.push({
          id: (Date.now() + 1).toString(),
          type: 'error',
          text: 'Ошибка: укажите файл. Пример: cat Form1.Designer.cs, cat Form1.cs, cat app.py',
        });
      } else {
        const fileLower = fileName.toLowerCase();
        if (fileLower.includes('designer')) {
          newLines.push({
            id: (Date.now() + 1).toString(),
            type: 'output',
            text: generateDesignerCs(project),
          });
        } else if (fileLower.includes('form1.cs') || fileLower.includes('.cs')) {
          newLines.push({
            id: (Date.now() + 1).toString(),
            type: 'output',
            text: generateCodeBehindCs(project),
          });
        } else if (fileLower.includes('.py') || fileLower.includes('app.py')) {
          newLines.push({
            id: (Date.now() + 1).toString(),
            type: 'output',
            text: generatePythonCustomTkinter(project),
          });
        } else if (fileLower.includes('html') || fileLower.includes('index.html')) {
          newLines.push({
            id: (Date.now() + 1).toString(),
            type: 'output',
            text: generateWebHtml(project),
          });
        } else if (fileLower.includes('csproj')) {
          const projName = project.projectName || 'MyLabApp';
          newLines.push({
            id: (Date.now() + 1).toString(),
            type: 'output',
            text: `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net9.0-windows</TargetFramework>
    <Nullable>enable</Nullable>
    <UseWindowsForms>true</UseWindowsForms>
    <AssemblyName>${projName}</AssemblyName>
  </PropertyGroup>
</Project>`,
          });
        } else {
          newLines.push({
            id: (Date.now() + 1).toString(),
            type: 'error',
            text: `Файл '${fileName}' не найден в VFS /workspace.`,
          });
        }
      }
    } else if (mainCommand === 'rm') {
      if ((args[1] === '-rf' || args[1] === '-f') && (args[2] === 'cache' || args[2] === 'storage' || args[2] === 'all')) {
        newLines.push({
          id: (Date.now() + 1).toString(),
          type: 'success',
          text: `[OK] LocalStorage, SessionStorage и база IndexedDB успешно очищены (0 ms)!`,
        });
        setTimeout(() => {
          StorageManager.hardResetAll();
        }, 300);
      } else {
        newLines.push({
          id: (Date.now() + 1).toString(),
          type: 'error',
          text: `Использование: rm -rf cache (для полной очистки сброса кэша)`,
        });
      }
    } else if (mainCommand === 'dotnet') {
      const sub = args[1]?.toLowerCase();
      if (sub === 'run' || sub === 'build') {
        const csharpCode = generateCodeBehindCs(project);
        
        newLines.push({
          id: (Date.now() + 1).toString(),
          type: 'output',
          text: `[ROSLYN] Сборка проекта '${project.projectName || 'MyLabApp'}.csproj'...`,
        });

        // Run Roslyn engine asynchronously
        InBrowserRoslynEngine.compileAndRun(csharpCode, project).then((res) => {
          const resultLines: TerminalLine[] = [...newLines];

          if (res.success) {
            resultLines.push({
              id: (Date.now() + 2).toString(),
              type: 'success',
              text: `[ROSLYN] Компиляция завершена успешно: 0 ошибок, 0 предупреждений (Время: ${res.compilationTimeMs} мс)`,
            });
            resultLines.push({
              id: (Date.now() + 3).toString(),
              type: 'output',
              text: `[RUNTIME] Инициализация Assembly в памяти (Размер: ${(res.assemblySizeBytes / 1024).toFixed(1)} КБ)...`,
            });

            res.executionLogs.forEach((log, idx) => {
              resultLines.push({
                id: (Date.now() + 10 + idx).toString(),
                type: 'output',
                text: log,
              });
            });

            if (res.isTimedOut) {
              resultLines.push({
                id: (Date.now() + 99).toString(),
                type: 'error',
                text: '🛑 [WATCHDOG GUARD] Выполнение процесса остановлено: превышен таймаут 3000ms. Браузер защищен от бесконечного цикла.',
              });
            } else if (res.isWaitingForInput) {
              resultLines.push({
                id: (Date.now() + 99).toString(),
                type: 'system',
                text: `⌨️ [Console.In Bridge] ${res.promptText || 'Ожидается ввод значения...'}. Введите ответ в поле выше и нажмите Enter.`,
              });
            }
          } else {
            resultLines.push({
              id: (Date.now() + 2).toString(),
              type: 'error',
              text: `[ROSLYN ERROR] Обнаружены ошибки компиляции (${res.diagnostics.length} шт):`,
            });
            res.diagnostics.forEach((diag, idx) => {
              resultLines.push({
                id: (Date.now() + 10 + idx).toString(),
                type: 'error',
                text: `  • [${diag.code}] Строка ${diag.line}, Столбец ${diag.column}: ${diag.message}`,
              });
            });
          }

          setHistory(resultLines);
        });

        setHistory(newLines);
        setInputVal('');
        return;
      } else {
        newLines.push({
          id: (Date.now() + 1).toString(),
          type: 'output',
          text: 'Использование: dotnet run | dotnet build',
        });
      }
    } else if (mainCommand === 'python' || mainCommand === 'python3') {
      newLines.push({
        id: (Date.now() + 1).toString(),
        type: 'output',
        text: `🐍 [PYTHON] Выполнение CustomTkinter app.py...`,
      });
      newLines.push({
        id: (Date.now() + 2).toString(),
        type: 'success',
        text: `Application process initialized. CustomTkinter GUI loop active (120 FPS).`,
      });
    } else if (mainCommand === 'info') {
      newLines.push({
        id: (Date.now() + 1).toString(),
        type: 'output',
        text: `ℹ️ Проект: ${project.projectName || 'MyLabApp'}\nАвтор: ${project.author || 'Студент'}\nВерсия: ${project.version || '1.0.0'}\nЦель: ${project.targetFramework || 'csharp_winforms'}`,
      });
    } else {
      newLines.push({
        id: (Date.now() + 1).toString(),
        type: 'error',
        text: `Команда '${mainCommand}' не распознана. Введите 'help' для списка команд.`,
      });
    }

    setHistory(newLines);
    setInputVal('');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 font-mono text-xs text-zinc-200 select-text overflow-hidden">
      {/* Header Bar */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-1.5 flex items-center justify-between text-[11px] text-zinc-400 select-none shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold text-zinc-200">DevOS Shell Runtime (VFS & dotnet CLI)</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-emerald-400 font-semibold">● VFS ONLINE</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">.NET 9.0 SDK</span>
        </div>
      </div>

      {/* Console output area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1.5 leading-relaxed selection:bg-emerald-900/60 selection:text-emerald-200">
        {history.map((line) => (
          <div
            key={line.id}
            className={`whitespace-pre-wrap ${
              line.type === 'input'
                ? 'text-emerald-400 font-bold'
                : line.type === 'error'
                ? 'text-red-400'
                : line.type === 'success'
                ? 'text-cyan-300'
                : line.type === 'system'
                ? 'text-zinc-500 italic'
                : 'text-zinc-300'
            }`}
          >
            {line.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input prompt */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCommand(inputVal);
        }}
        className="p-2.5 bg-zinc-900/80 border-t border-zinc-800 flex items-center gap-2 shrink-0"
      >
        <span className="text-emerald-400 font-bold select-none">$</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="cat Form1.Designer.cs, ls, dotnet run, rm -rf cache..."
          className="flex-1 bg-transparent border-none text-emerald-300 placeholder-zinc-600 focus:outline-none font-mono text-xs"
          autoFocus
        />
        <button
          type="submit"
          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded cursor-pointer transition-colors"
        >
          ENTER
        </button>
      </form>
    </div>
  );
};
