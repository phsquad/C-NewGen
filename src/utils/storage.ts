import JSZip from 'jszip';
import { DesignerProjectState } from '../types/ast';
import {
  generateDesignerCs,
  generateCodeBehindCs,
  generateProgramCs,
  generateCsproj,
} from './codeGenerators';

const STORAGE_KEY = 'nextgen_csharp_designer_project_v1';
const PROJECTS_LIST_KEY = 'nextgen_csharp_saved_projects_v1';

export interface LocalStorageSavedProject {
  id: string;
  name: string;
  updatedAt: number;
  createdAt: number;
  state: DesignerProjectState;
}

export const saveProjectToLocalStorageList = (project: DesignerProjectState): void => {
  try {
    const raw = localStorage.getItem(PROJECTS_LIST_KEY);
    const list: LocalStorageSavedProject[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const existingIndex = list.findIndex(p => p.name === project.projectName);

    if (existingIndex > -1) {
      list[existingIndex].updatedAt = now;
      list[existingIndex].state = project;
    } else {
      list.push({
        id: `local_proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: project.projectName || 'Новый Проект',
        createdAt: now,
        updatedAt: now,
        state: project,
      });
    }

    localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save project to localStorage list', err);
  }
};

export const loadProjectsFromLocalStorageList = (): LocalStorageSavedProject[] => {
  try {
    const raw = localStorage.getItem(PROJECTS_LIST_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load projects from localStorage list', err);
    return [];
  }
};

export const deleteProjectFromLocalStorageList = (id: string): void => {
  try {
    const raw = localStorage.getItem(PROJECTS_LIST_KEY);
    if (!raw) return;
    const list: LocalStorageSavedProject[] = JSON.parse(raw);
    const updated = list.filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete project from localStorage list', err);
  }
};

export const saveProjectToLocalStorage = (project: DesignerProjectState): number => {
  try {
    const serialized = JSON.stringify(project);
    localStorage.setItem(STORAGE_KEY, serialized);
    // Return size in bytes
    return new Blob([serialized]).size;
  } catch (err) {
    console.error('Failed to save project to localStorage', err);
    return 0;
  }
};

export const loadProjectFromLocalStorage = (): DesignerProjectState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.rootFormId && parsed.nodes) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load project from localStorage', err);
  }
  return null;
};

export const getStorageUsageInfo = (project: DesignerProjectState): { sizeKb: string; nodeCount: number } => {
  try {
    const serialized = JSON.stringify(project);
    const bytes = new Blob([serialized]).size;
    const kb = (bytes / 1024).toFixed(1);
    const nodeCount = Object.keys(project.nodes).length;
    return { sizeKb: `${kb} КБ`, nodeCount };
  } catch {
    return { sizeKb: '0.0 КБ', nodeCount: 0 };
  }
};

export const downloadFile = (filename: string, content: string, mimeType = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportProjectZip = async (project: DesignerProjectState): Promise<void> => {
  const zip = new JSZip();
  const projectName = (project.projectName || 'WinFormsApp1').replace(/[^a-zA-Z0-9_-]/g, '_');

  // Add .csproj and Program.cs
  zip.file(`${projectName}.csproj`, generateCsproj(project));
  zip.file('Program.cs', generateProgramCs(project));

  // Add all Form files (multi-form support)
  const formNodes = Object.values(project.nodes).filter(n => n.type === 'Form');
  if (formNodes.length === 0 && project.nodes[project.rootFormId]) {
    formNodes.push(project.nodes[project.rootFormId]);
  }

  formNodes.forEach(formNode => {
    const formName = formNode.properties.name || 'Form1';
    zip.file(`${formName}.cs`, generateCodeBehindCs(project, formNode.id));
    zip.file(`${formName}.Designer.cs`, generateDesignerCs(project, formNode.id));
  });

  zip.file('project.designer.json', JSON.stringify(project, null, 2));

  // Add README
  zip.file('README.md', `# ${projectName}\n\nGenerated with NextGen C# Designer.\n\n### Requirements:\n- .NET 8.0 SDK or .NET 9.0 SDK\n\n### Run:\n\`\`\`bash\ndotnet run\n\`\`\`\n`);

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName}_dotnet.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportProjectAsZip = exportProjectZip;
