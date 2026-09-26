import JSZip from 'jszip';
import { DesignerProjectState } from '../types/ast';
import {
  generateDesignerCs,
  generateCodeBehindCs,
  generateProgramCs,
  generateCsproj,
  generateReadme,
  generateAvaloniaAxaml,
  generateAvaloniaAxamlCs,
  generateAvaloniaProgramCs,
  generateAvaloniaCsproj,
} from './codeGenerators';
import {
  generatePythonCustomTkinter,
  generateWebHtml,
  generateWebCss,
  generateWebJs,
} from './polyglotGenerators';
import { generateGithubWorkflow } from './githubWorkflowGenerator';
import { ProjectASTLinter } from './astLinter';

/**
 * Generates and downloads a complete, 100% compilable .NET solution + Polyglot (Python/Web) + CI/CD .ZIP archive
 * (Правка 15.1: Pre-Export Guard Auto-Repair)
 */
export async function downloadFullProjectZip(projectState: DesignerProjectState): Promise<void> {
  // Pre-Export Guard: Auto-fix duplicate name collisions and geometry issues before zipping
  const issues = ProjectASTLinter.validateProject(projectState);
  const project = ProjectASTLinter.autoFixAll(projectState, issues);

  const zip = new JSZip();
  const formName = project.nodes[project.rootFormId]?.properties.name || 'Form1';
  const projectName = project.projectName || `${formName}App`;
  const isAvalonia = project.targetFramework === 'Avalonia';

  if (isAvalonia) {
    const csFolder = zip.folder('csharp_avalonia');
    if (csFolder) {
      csFolder.file(`${projectName}.csproj`, generateAvaloniaCsproj(projectName));
      csFolder.file('Program.cs', generateAvaloniaProgramCs(project));
      csFolder.file('App.axaml', `<Application xmlns="https://github.com/avaloniaui"
               xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
               x:Class="${projectName}.App"
               RequestedThemeVariant="Default">
      <Application.Styles>
          <FluentTheme />
      </Application.Styles>
  </Application>`);
      csFolder.file('App.axaml.cs', `using Avalonia;
  using Avalonia.Controls.ApplicationLifetimes;
  using Avalonia.Markup.Xaml;

  namespace ${projectName};

  public partial class App : Application
  {
      public override void Initialize()
      {
          AvaloniaXamlLoader.Load(this);
      }

      public override void OnFrameworkInitializationCompleted()
      {
          if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
          {
              desktop.MainWindow = new MainWindow();
          }
          base.OnFrameworkInitializationCompleted();
      }
  }`);
      csFolder.file('MainWindow.axaml', generateAvaloniaAxaml(project));
      csFolder.file('MainWindow.axaml.cs', generateAvaloniaAxamlCs(project));
    }
  } else {
    // Windows Forms Solution Structure (.NET 8.0/9.0)
    const csFolder = zip.folder('csharp_winforms_net8');
    if (csFolder) {
      csFolder.file(`${projectName}.csproj`, generateCsproj(projectName));
      csFolder.file('Program.cs', generateProgramCs(project));
      csFolder.file(`${formName}.cs`, generateCodeBehindCs(project));
      csFolder.file(`${formName}.Designer.cs`, generateDesignerCs(project));
    }
  }

  // Add Polyglot Python CustomTkinter export folder
  const pyFolder = zip.folder('python_customtkinter');
  if (pyFolder) {
    pyFolder.file('app.py', generatePythonCustomTkinter(project));
    pyFolder.file('requirements.txt', 'customtkinter>=5.2.0\npillow>=10.0.0\n');
  }

  // Add Polyglot Web HTML/CSS/JS export folder
  const webFolder = zip.folder('web_html5_standalone');
  if (webFolder) {
    webFolder.file('index.html', generateWebHtml(project));
    webFolder.file('styles.css', generateWebCss(project));
    webFolder.file('app.js', generateWebJs(project));
  }

  // Add GitHub Actions CI/CD Pipeline
  const githubFolder = zip.folder('.github');
  if (githubFolder) {
    const workflowsFolder = githubFolder.folder('workflows');
    if (workflowsFolder) {
      workflowsFolder.file('deploy.yml', generateGithubWorkflow(projectName));
    }
  }

  // Add UI-AST JSON for bidirectional re-import
  zip.file('shared_schema_ast.json', JSON.stringify(project, null, 2));
  zip.file('README.md', generateReadme(projectName, isAvalonia ? 'Avalonia' : 'WinForms'));

  // Generate blob and trigger browser download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
