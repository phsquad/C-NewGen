import React, { useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { CSharpCodeLensEngine } from '../../utils/CSharpCodeLensEngine';

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

  useEffect(() => {
    return () => {
      if (codeLensDisposableRef.current) {
        codeLensDisposableRef.current.dispose();
        codeLensDisposableRef.current = null;
      }
    };
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
          lineNumbersMinChars: 3,
          codeLens: enableCodeLens,
          codeLensFontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
          codeLensFontSize: 10,
        }}
      />
    </div>
  );
};
