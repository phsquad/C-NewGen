import React, { useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { CSharpCodeLensEngine } from '../../utils/CSharpCodeLensEngine';
import { CSharpFoldingEngine } from '../../utils/CSharpFoldingEngine';
import { CSharpImportOrganizer } from '../../utils/CSharpImportOrganizer';

interface MonacoCodeEditorProps {
  value: string;
  language: string;
  fileName: string;
  onChange: (value: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  targetLine?: number | null;
  readOnly?: boolean;
  enableCodeLens?: boolean;
}

export const MonacoCodeEditor: React.FC<MonacoCodeEditorProps> = ({
  value,
  language,
  fileName,
  onChange,
  onCursorChange,
  targetLine,
  readOnly = false,
  enableCodeLens = true,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const codeLensDisposableRef = useRef<{ dispose: () => void } | null>(null);
  const foldingDisposableRef = useRef<{ dispose: () => void } | null>(null);
  const codeActionDisposableRef = useRef<{ dispose: () => void } | null>(null);

  useEffect(() => {
    return () => {
      if (codeLensDisposableRef.current) {
        codeLensDisposableRef.current.dispose();
        codeLensDisposableRef.current = null;
      }
      if (foldingDisposableRef.current) {
        foldingDisposableRef.current.dispose();
        foldingDisposableRef.current = null;
      }
      if (codeActionDisposableRef.current) {
        codeActionDisposableRef.current.dispose();
        codeActionDisposableRef.current = null;
      }
    };
  }, []);

  // External Folding Action Listener
  useEffect(() => {
    const handleFoldEvent = (e: any) => {
      if (!editorRef.current) return;
      const editor = editorRef.current;
      const action = e.detail?.action;
      const code = editor.getValue();
      const blocks = CSharpFoldingEngine.computeFoldingRanges(code);

      switch (action) {
        case 'foldAll':
          editor.getAction('editor.foldAll')?.run();
          break;
        case 'unfoldAll':
          editor.getAction('editor.unfoldAll')?.run();
          break;
        case 'foldMethods': {
          const methodLines = blocks.filter(b => b.category === 'method').map(b => b.start);
          CSharpFoldingEngine.foldTargetLines(editor, methodLines, true);
          break;
        }
        case 'unfoldMethods': {
          const methodLines = blocks.filter(b => b.category === 'method').map(b => b.start);
          CSharpFoldingEngine.foldTargetLines(editor, methodLines, false);
          break;
        }
        case 'foldClasses': {
          const classLines = blocks.filter(b => b.category === 'class').map(b => b.start);
          CSharpFoldingEngine.foldTargetLines(editor, classLines, true);
          break;
        }
        case 'unfoldClasses': {
          const classLines = blocks.filter(b => b.category === 'class').map(b => b.start);
          CSharpFoldingEngine.foldTargetLines(editor, classLines, false);
          break;
        }
        case 'foldNamespaces': {
          const nsLines = blocks.filter(b => b.category === 'namespace').map(b => b.start);
          CSharpFoldingEngine.foldTargetLines(editor, nsLines, true);
          break;
        }
        case 'foldRegions': {
          editor.getAction('editor.foldAllMarkerRegions')?.run();
          const regionLines = blocks.filter(b => b.category === 'region').map(b => b.start);
          CSharpFoldingEngine.foldTargetLines(editor, regionLines, true);
          break;
        }
        case 'foldImports': {
          const importLines = blocks.filter(b => b.category === 'imports').map(b => b.start);
          CSharpFoldingEngine.foldTargetLines(editor, importLines, true);
          break;
        }
        case 'foldComments': {
          editor.getAction('editor.foldAllBlockComments')?.run();
          break;
        }
      }
    };

    window.addEventListener('csharp-editor-fold' as any, handleFoldEvent);
    return () => window.removeEventListener('csharp-editor-fold' as any, handleFoldEvent);
  }, []);

  // Jump to target line if specified
  useEffect(() => {
    if (editorRef.current && targetLine && targetLine > 0) {
      editorRef.current.revealLineInCenter(targetLine);
      editorRef.current.setPosition({ lineNumber: targetLine, column: 1 });
      editorRef.current.focus();
    }
  }, [targetLine]);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Track cursor changes
    editor.onDidChangeCursorPosition((e: any) => {
      if (onCursorChange) {
        onCursorChange(e.position.lineNumber, e.position.column);
      }
    });

    // Register C# IntelliSense snippets once
    const csharpSnippets = [
      {
        label: 'cw',
        kind: monaco.languages.CompletionItemKind.Snippet,
        documentation: 'Console.WriteLine(value);',
        insertText: 'Console.WriteLine(${1:value});',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      },
      {
        label: 'prop',
        kind: monaco.languages.CompletionItemKind.Snippet,
        documentation: 'Auto-implemented Property',
        insertText: 'public ${1:int} ${2:MyProperty} { get; set; }',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      },
      {
        label: 'msg',
        kind: monaco.languages.CompletionItemKind.Snippet,
        documentation: 'MessageBox.Show with caption and icon',
        insertText: 'MessageBox.Show("${1:Текст}", "${2:Информация}", MessageBoxButtons.OK, MessageBoxIcon.Information);',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      },
      {
        label: 'for',
        kind: monaco.languages.CompletionItemKind.Snippet,
        documentation: 'Standard for loop',
        insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++)\n{\n    $0\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      },
      {
        label: 'foreach',
        kind: monaco.languages.CompletionItemKind.Snippet,
        documentation: 'foreach loop statement',
        insertText: 'foreach (var ${1:item} in ${2:collection})\n{\n    $0\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      },
      {
        label: 'if',
        kind: monaco.languages.CompletionItemKind.Snippet,
        documentation: 'if conditional branch',
        insertText: 'if (${1:condition})\n{\n    $0\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      },
      {
        label: 'try',
        kind: monaco.languages.CompletionItemKind.Snippet,
        documentation: 'try-catch block with MessageBox error handling',
        insertText: 'try\n{\n    $0\n}\ncatch (Exception ex)\n{\n    MessageBox.Show(ex.Message, "Ошибка", MessageBoxButtons.OK, MessageBoxIcon.Error);\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      },
      {
        label: 'btn_click',
        kind: monaco.languages.CompletionItemKind.Snippet,
        documentation: 'WinForms EventHandler method',
        insertText: 'private void ${1:btnAction}_Click(object sender, EventArgs e)\n{\n    $0\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      },
    ];

    try {
      monaco.languages.registerCompletionItemProvider('csharp', {
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          return {
            suggestions: csharpSnippets.map((s) => ({ ...s, range })),
          };
        },
      });
    } catch {
      // Provider already registered
    }

    // Register C# CodeLens provider (References, Test status, Git author details)
    if (enableCodeLens && !codeLensDisposableRef.current) {
      codeLensDisposableRef.current = CSharpCodeLensEngine.registerMonacoCodeLens(monaco);
    }

    // Register C# Folding Provider (Namespaces, Classes, Methods, #region, Imports)
    if (!foldingDisposableRef.current) {
      foldingDisposableRef.current = CSharpFoldingEngine.registerMonacoFoldingProvider(monaco);
    }

    // Register C# Import Organizer CodeAction Provider (💡 Quick Fix for missing references)
    if (!codeActionDisposableRef.current) {
      codeActionDisposableRef.current = CSharpImportOrganizer.registerMonacoCodeActionProvider(monaco);
    }

    // Register custom command for organize imports
    if (!(monaco.editor as any)._csharpOrganizeCommandRegistered) {
      (monaco.editor as any)._csharpOrganizeCommandRegistered = true;
      monaco.editor.registerCommand('csharp.organizeImports', () => {
        window.dispatchEvent(new CustomEvent('csharp-organize-imports'));
      });
    }

    // Bind Visual Studio & VS Code standard folding chords (Ctrl+K, Ctrl+0 / Ctrl+K, Ctrl+J)
    try {
      editor.addCommand(
        monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit0),
        () => editor.getAction('editor.foldAll')?.run()
      );
      editor.addCommand(
        monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ),
        () => editor.getAction('editor.unfoldAll')?.run()
      );

      // Organize Imports Shortcuts: Shift+Alt+O (VS Code) and Ctrl+R, Ctrl+G (Visual Studio)
      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyO,
        () => window.dispatchEvent(new CustomEvent('csharp-organize-imports'))
      );
      editor.addCommand(
        monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG),
        () => window.dispatchEvent(new CustomEvent('csharp-organize-imports'))
      );
    } catch {
      // Ignore if commands already bound
    }

    // Jump to line if initially provided
    if (targetLine && targetLine > 0) {
      editor.revealLineInCenter(targetLine);
      editor.setPosition({ lineNumber: targetLine, column: 1 });
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#1E1E24]">
      <Editor
        height="100%"
        width="100%"
        language={language}
        theme="vs-dark"
        value={value}
        path={fileName}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex items-center justify-center h-full text-zinc-400 font-mono text-xs gap-2">
            <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span>Загрузка ядра Monaco Editor...</span>
          </div>
        }
        options={{
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly,
          cursorStyle: 'line',
          automaticLayout: true,
          fontSize: 12,
          fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
          minimap: { enabled: true, maxColumn: 40 },
          scrollBeyondLastLine: false,
          tabSize: 4,
          insertSpaces: true,
          wordWrap: 'off',
          renderLineHighlight: 'all',
          smoothScrolling: true,
          contextmenu: true,
          formatOnPaste: true,
          formatOnType: true,
          folding: true,
          foldingStrategy: 'auto',
          showFoldingControls: 'always',
          foldingHighlight: true,
          unfoldOnClickAfterEndOfLine: true,
          foldingImportsByDefault: false,
          matchBrackets: 'always',
          lineNumbersMinChars: 3,
          codeLens: enableCodeLens,
          codeLensFontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
          codeLensFontSize: 10,
        }}
      />
    </div>
  );
};
