import JSZip from 'jszip';
import { DesignerProjectState } from '../types/ast';
import {
  generateDesignerCs,
  generateCodeBehindCs,
  generateProgramCs,
  generateReadme,
} from './codeGenerators';
import { generatePythonCustomTkinter, generateWebHtml, generateWebCss, generateWebJs } from './polyglotGenerators';
import { IcoGenerator } from './icoGenerator';

export interface BuildPublishConfig {
  outputName: string;
  companyName: string;
  authorName: string;
  version: string;
  description: string;
  copyright: string;
  targetOs: 'win-x64' | 'linux-x64' | 'python-exe' | 'web-pwa';
  singleFile: boolean;
  selfContained: boolean;
  trimUnused: boolean;
  embedDatabase: boolean;
  enableObfuscation: boolean;
  enableUpx: boolean;
  iconDataUrl?: string;
  iconBuffer?: ArrayBuffer;
}

export class BuildPublisher {
  /**
   * Generates single-file self-contained production .csproj
   */
  public static generateProductionCsproj(config: BuildPublishConfig): string {
    const isWindows = config.targetOs === 'win-x64';
    const targetFramework = isWindows ? 'net8.0-windows' : 'net8.0';

    return `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <!-- 1. Настройки исполняемого файла -->
    <OutputType>WinExe</OutputType>
    <TargetFramework>${targetFramework}</TargetFramework>
    <Nullable>enable</Nullable>
    ${isWindows ? '<UseWindowsForms>true</UseWindowsForms>' : ''}
    <ImplicitUsings>enable</ImplicitUsings>
    
    <!-- 2. Метаданные из Мастера Сборки -->
    <AssemblyName>${config.outputName}</AssemblyName>
    <RootNamespace>${config.outputName}</RootNamespace>
    <ApplicationIcon>app_icon.ico</ApplicationIcon>
    <Version>${config.version || '1.0.0.1'}</Version>
    <AssemblyVersion>${config.version || '1.0.0.1'}</AssemblyVersion>
    <FileVersion>${config.version || '1.0.0.1'}</FileVersion>
    <Company>${escapeXml(config.companyName || 'My Studio')}</Company>
    <Authors>${escapeXml(config.authorName || 'Developer')}</Authors>
    <Description>${escapeXml(config.description || 'Application created with NextGen Dev-OS Studio')}</Description>
    <Copyright>${escapeXml(config.copyright || `© 2026 ${config.companyName}`)}</Copyright>

    <!-- 3. Флаги упаковки в единый автономный EXE файл (Single-File Self-Contained) -->
    <PublishSingleFile>${config.singleFile ? 'true' : 'false'}</PublishSingleFile>
    <SelfContained>${config.selfContained ? 'true' : 'false'}</SelfContained>
    <RuntimeIdentifier>${config.targetOs === 'win-x64' ? 'win-x64' : 'linux-x64'}</RuntimeIdentifier>
    <PublishTrimmed>${config.trimUnused ? 'true' : 'false'}</PublishTrimmed>
    <IncludeNativeLibrariesForSelfExtract>true</IncludeNativeLibrariesForSelfExtract>
    <EnableCompressionInSingleFile>true</EnableCompressionInSingleFile>
    <PublishReadyToRun>true</PublishReadyToRun>
  </PropertyGroup>

  <!-- 4. Встраивание SQLite базы данных и ресурсов -->
  ${config.embedDatabase ? `<ItemGroup>
    <EmbeddedResource Include="app.db" Condition="Exists('app.db')" />
  </ItemGroup>` : ''}

</Project>
`;
  }

  /**
   * Generates 1-Click Windows build.bat batch script
   */
  public static generateWindowsBuildBat(config: BuildPublishConfig): string {
    return `@echo off
chcp 65001 > nul
cls
echo ====================================================================
echo  🚀 DevOS Standalone EXE Publisher (.NET 8.0 SDK / Native AOT)
echo  Проект: ${config.outputName} [Версия: ${config.version}]
echo ====================================================================
echo.

echo [1/3] Проверка .NET SDK и восстановление зависимостей...
dotnet restore
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Не удалось восстановить зависимости. Убедитесь, что установлен .NET 8 SDK.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Компиляция и сборка Single-File Self-Contained EXE...
dotnet publish -c Release -r ${config.targetOs === 'win-x64' ? 'win-x64' : 'win-x86'} --self-contained ${config.selfContained} -p:PublishSingleFile=${config.singleFile} -p:PublishTrimmed=${config.trimUnused} -p:EnableCompressionInSingleFile=true -o ./publish

if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Сборка завершилась с ошибкой.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ====================================================================
echo  ✨ [УСПЕХ] Программа собрана!
echo  Готовый файл: ./publish/${config.outputName}.exe
echo  (Файл полностью автономен и запустится на любом ПК без .NET)
echo ====================================================================
echo.
pause
`;
  }

  /**
   * Generates Linux/macOS build.sh script
   */
  public static generateLinuxBuildSh(config: BuildPublishConfig): string {
    return `#!/bin/bash
set -e
echo "===================================================================="
echo " 🚀 DevOS Linux Executable Builder (.NET 8.0 SDK)"
echo " Проект: ${config.outputName} [Версия: ${config.version}]"
echo "===================================================================="

dotnet restore
dotnet publish -c Release -r linux-x64 --self-contained ${config.selfContained} -p:PublishSingleFile=${config.singleFile} -p:PublishTrimmed=${config.trimUnused} -o ./publish

echo "✨ Сборка завершена! Исполняемый файл: ./publish/${config.outputName}"
`;
  }

  /**
   * Generates GitHub Actions workflow for automated Cloud EXE compilation
   */
  public static generateGithubWorkflow(config: BuildPublishConfig): string {
    return `name: Build Standalone Windows EXE

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build-exe:
    runs-on: windows-latest
    steps:
    - name: Checkout Repository
      uses: actions/checkout@v4

    - name: Setup .NET 8 SDK
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: '8.0.x'

    - name: Restore dependencies
      run: dotnet restore

    - name: Publish Standalone Single-File EXE
      run: |
        dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:PublishTrimmed=true -p:EnableCompressionInSingleFile=true -o ./artifacts

    - name: Upload Windows EXE Artifact
      uses: actions/upload-artifact@v4
      with:
        name: ${config.outputName}-win-x64
        path: ./artifacts/${config.outputName}.exe
`;
  }

  /**
   * Packages and triggers download of the complete Single-File Ready ZIP Bundle
   */
  public static async exportStandaloneBundleZip(
    project: DesignerProjectState,
    config: BuildPublishConfig
  ): Promise<void> {
    const zip = new JSZip();
    const formName = project.nodes[project.rootFormId]?.properties.name || 'Form1';
    const outputName = config.outputName || 'MyApplication';

    // 1. Solution Root Files
    zip.file(`${outputName}.csproj`, this.generateProductionCsproj(config));
    zip.file('Program.cs', generateProgramCs(project));
    zip.file(`${formName}.cs`, generateCodeBehindCs(project));
    zip.file(`${formName}.Designer.cs`, generateDesignerCs(project));
    zip.file('build.bat', this.generateWindowsBuildBat(config));
    zip.file('build.sh', this.generateLinuxBuildSh(config));
    zip.file('README.md', generateReadme(outputName, 'WinForms'));

    // 2. Icon File
    if (config.iconBuffer) {
      zip.file('app_icon.ico', config.iconBuffer);
    }

    // 3. SQLite Database file
    if (config.embedDatabase) {
      zip.file(
        'app.db',
        `-- SQLite Database created for ${outputName}\nCREATE TABLE IF NOT EXISTS Users (Id INTEGER PRIMARY KEY AUTOINCREMENT, Username TEXT, CreatedAt DATETIME);\nINSERT INTO Users (Username, CreatedAt) VALUES ('admin', DateTime('now'));`
      );
    }

    // 4. GitHub Actions CI/CD
    const githubFolder = zip.folder('.github');
    if (githubFolder) {
      const workflows = githubFolder.folder('workflows');
      if (workflows) {
        workflows.file('build-exe.yml', this.generateGithubWorkflow(config));
      }
    }

    // 5. Polyglot folders if requested
    if (config.targetOs === 'python-exe') {
      const pyFolder = zip.folder('python_src');
      if (pyFolder) {
        pyFolder.file('app.py', generatePythonCustomTkinter(project));
        pyFolder.file('requirements.txt', 'customtkinter>=5.2.0\npillow>=10.0.0\n');
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${outputName}_Standalone_Package.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
