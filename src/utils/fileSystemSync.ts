import { DesignerProjectState } from '../types/ast';
import {
  generateCsproj,
  generateProgramCs,
  generateCodeBehindCs,
  generateDesignerCs,
} from './codeGenerators';

export interface FileSystemSyncState {
  isSupported: boolean;
  isBound: boolean;
  folderName: string | null;
  lastSyncTime: number | null;
  statusText: string;
}

let activeDirectoryHandle: FileSystemDirectoryHandle | null = null;

/**
 * Checks if File System Access API is supported in the current environment
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Prompt user to select a local folder on their PC
 */
export async function connectLocalDirectory(): Promise<{ handle: FileSystemDirectoryHandle; name: string } | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API не поддерживается в этом браузере.');
  }

  try {
    const dirHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
    });
    activeDirectoryHandle = dirHandle;
    return { handle: dirHandle, name: dirHandle.name };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return null; // User cancelled
    }
    throw err;
  }
}

export function getActiveDirectoryHandle(): FileSystemDirectoryHandle | null {
  return activeDirectoryHandle;
}

export function disconnectLocalDirectory(): void {
  activeDirectoryHandle = null;
}

/**
 * Synchronize full C# WinForms solution directly into the connected PC folder
 */
export async function syncProjectToLocalDirectory(
  dirHandle: FileSystemDirectoryHandle | null,
  project: DesignerProjectState
): Promise<{ success: boolean; filesWritten: string[] }> {
  const targetHandle = dirHandle || activeDirectoryHandle;
  if (!targetHandle) {
    throw new Error('Папка на диске не подключена');
  }

  const filesWritten: string[] = [];

  const writeFile = async (filename: string, content: string) => {
    const fileHandle = await targetHandle.getFileHandle(filename, { create: true });
    const writable = await (fileHandle as any).createWritable();
    await writable.write(content);
    await writable.close();
    filesWritten.push(filename);
  };

  const cleanProjectName = (project.projectName || 'MyWinFormsApp').replace(/[^a-zA-Z0-9_-]/g, '_');

  // 1. Csproj
  const csprojContent = generateCsproj(project);
  await writeFile(`${cleanProjectName}.csproj`, csprojContent);

  // 2. Program.cs
  const programCsContent = generateProgramCs(project);
  await writeFile('Program.cs', programCsContent);

  // 3. For each Form: Form.cs & Form.Designer.cs
  const formNodes = Object.values(project.nodes).filter(n => n.type === 'Form');
  for (const formNode of formNodes) {
    const formName = formNode.properties.name || 'Form1';
    const designerContent = generateDesignerCs(project, formNode.id);
    const codeBehindContent = generateCodeBehindCs(project, formNode.id);

    await writeFile(`${formName}.Designer.cs`, designerContent);
    await writeFile(`${formName}.cs`, codeBehindContent);
  }

  // 4. UI-AST State file for lossless 100% roundtrip restoration
  const stateJson = JSON.stringify(project, null, 2);
  await writeFile('project.designer.json', stateJson);

  return { success: true, filesWritten };
}
