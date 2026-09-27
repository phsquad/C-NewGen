import { DesignerProjectState, DesignerNode } from '../types/ast';

/**
 * Generates WinForms Form1.Designer.cs compatible with .NET 8/9
 */
export const generateDesignerCs = (project: DesignerProjectState, targetFormId?: string): string => {
  const formId = targetFormId || project.activeFormId || project.rootFormId;
  const rootForm = project.nodes[formId] || project.nodes[project.rootFormId];
  if (!rootForm) return '// Error: Root form not found';

  const formName = rootForm.properties.name || 'Form1';

  // Collect descendants belonging strictly to this form
  const formDescendantIds = new Set<string>();
  const collect = (pId: string) => {
    const p = project.nodes[pId];
    if (p?.childrenIds) {
      p.childrenIds.forEach(cId => {
        formDescendantIds.add(cId);
        collect(cId);
      });
    }
  };
  collect(rootForm.id);

  const childNodes = Object.values(project.nodes).filter(n => formDescendantIds.has(n.id));

  // Field declarations
  const declarations = childNodes
    .map(n => {
      const typeName = getWinFormsTypeName(n.type);
      return `        private System.Windows.Forms.${typeName} ${n.properties.name};`;
    })
    .join('\n');

  // Control initializations
  const instantiations = childNodes
    .map(n => {
      const typeName = getWinFormsTypeName(n.type);
      return `            this.${n.properties.name} = new System.Windows.Forms.${typeName}();`;
    })
    .join('\n');

  // Control properties configuration
  const controlConfigs = childNodes
    .map(n => {
      const lines: string[] = [];
      const varName = `this.${n.properties.name}`;
      lines.push(`            // `);
      lines.push(`            // ${n.properties.name}`);
      lines.push(`            // `);

      // Location & Size
      lines.push(`            ${varName}.Location = new System.Drawing.Point(${Math.round(n.bounds.x)}, ${Math.round(n.bounds.y)});`);
      lines.push(`            ${varName}.Name = "${n.properties.name}";`);
      lines.push(`            ${varName}.Size = new System.Drawing.Size(${Math.round(n.bounds.width)}, ${Math.round(n.bounds.height)});`);

      if (n.properties.tabIndex !== undefined) {
        lines.push(`            ${varName}.TabIndex = ${n.properties.tabIndex};`);
      }

      if (n.properties.text !== undefined && n.type !== 'Panel') {
        lines.push(`            ${varName}.Text = "${escapeCsString(n.properties.text)}";`);
      }

      if (n.properties.backColor && n.properties.backColor !== '#FFFFFF') {
        lines.push(`            ${varName}.BackColor = System.Drawing.ColorTranslator.FromHtml("${n.properties.backColor}");`);
      }

      if (n.properties.foreColor && n.properties.foreColor !== '#000000') {
        lines.push(`            ${varName}.ForeColor = System.Drawing.ColorTranslator.FromHtml("${n.properties.foreColor}");`);
      }

      if (n.properties.fontSize || n.properties.fontBold) {
        const fontName = n.properties.fontFamily ? `"${n.properties.fontFamily}"` : `this.Font.FontFamily.Name`;
        const fontSize = (n.properties.fontSize || 9).toFixed(1) + 'F';
        const fontStyle = n.properties.fontBold ? 'System.Drawing.FontStyle.Bold' : 'System.Drawing.FontStyle.Regular';
        lines.push(`            ${varName}.Font = new System.Drawing.Font(${fontName}, ${fontSize}, ${fontStyle}, System.Drawing.GraphicsUnit.Point);`);
      }

      if (n.properties.dock && n.properties.dock !== 'None') {
        lines.push(`            ${varName}.Dock = System.Windows.Forms.DockStyle.${n.properties.dock};`);
      }

      if (n.properties.anchor && n.properties.anchor.length > 0) {
        const anchors = n.properties.anchor.map(a => `System.Windows.Forms.AnchorStyles.${a}`).join(' | ');
        lines.push(`            ${varName}.Anchor = (System.Windows.Forms.AnchorStyles)(${anchors});`);
      }

      if (n.properties.enabled === false) {
        lines.push(`            ${varName}.Enabled = false;`);
      }
      if (n.properties.visible === false) {
        lines.push(`            ${varName}.Visible = false;`);
      }
      if (n.properties.tabIndex !== undefined) {
        lines.push(`            ${varName}.TabIndex = ${n.properties.tabIndex};`);
      }

      if (n.type === 'Button') {
        lines.push(`            ${varName}.UseVisualStyleBackColor = ${n.properties.useVisualStyleBackColor !== false ? 'true' : 'false'};`);
      }

      if (n.type === 'Label') {
        lines.push(`            ${varName}.AutoSize = ${n.properties.autoSize !== false ? 'true' : 'false'};`);
      }

      if (n.type === 'CheckBox' || n.type === 'RadioButton') {
        if (n.properties.checked) {
          lines.push(`            ${varName}.Checked = true;`);
        }
      }

      if (n.type === 'NumericUpDown') {
        const val = n.properties.value ?? 0;
        const min = n.properties.minimum ?? 0;
        const max = n.properties.maximum ?? 100;
        lines.push(`            ${varName}.Minimum = new decimal(new int[] { ${min}, 0, 0, 0 });`);
        lines.push(`            ${varName}.Maximum = new decimal(new int[] { ${max}, 0, 0, 0 });`);
        lines.push(`            ${varName}.Value = new decimal(new int[] { ${val}, 0, 0, 0 });`);
      }

      if (n.type === 'DateTimePicker') {
        lines.push(`            ${varName}.Format = System.Windows.Forms.DateTimePickerFormat.${n.properties.format || 'Long'};`);
      }

      if (n.type === 'PictureBox') {
        lines.push(`            ${varName}.SizeMode = System.Windows.Forms.PictureBoxSizeMode.${n.properties.sizeMode || 'Zoom'};`);
        lines.push(`            ${varName}.BorderStyle = System.Windows.Forms.BorderStyle.${n.properties.borderStyle || 'FixedSingle'};`);
      }

      if (n.type === 'ProgressBar' && n.properties.progressValue !== undefined) {
        lines.push(`            ${varName}.Value = ${n.properties.progressValue};`);
        lines.push(`            ${varName}.Style = System.Windows.Forms.ProgressBarStyle.${n.properties.style || 'Continuous'};`);
      }

      if (n.type === 'Panel') {
        lines.push(`            ${varName}.AutoScroll = ${n.properties.autoScroll !== false ? 'true' : 'false'};`);
        lines.push(`            ${varName}.BorderStyle = System.Windows.Forms.BorderStyle.${n.properties.borderStyle || 'FixedSingle'};`);
      }

      if (n.type === 'DataGridView') {
        lines.push(`            ${varName}.AllowUserToAddRows = ${n.properties.allowUserToAddRows !== false ? 'true' : 'false'};`);
        lines.push(`            ${varName}.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;`);
      }

      if (n.type === 'RichTextBox' && n.properties.richTextRtf) {
        lines.push(`            ${varName}.Rtf = @"${n.properties.richTextRtf.replace(/"/g, '""')}";`);
      }

      if (n.type === 'MenuStrip' && n.properties.menuItems) {
        // Generate MenuStrip ToolStripMenuItems hierarchy
        n.properties.menuItems.forEach((topItem, idx) => {
          const topVar = `${n.properties.name}_item_${idx}`;
          lines.push(`            var ${topVar} = new System.Windows.Forms.ToolStripMenuItem("${escapeCsString(topItem.text)}");`);
          if (topItem.children && topItem.children.length > 0) {
            topItem.children.forEach((sub, subIdx) => {
              if (sub.isSeparator) {
                lines.push(`            ${topVar}.DropDownItems.Add(new System.Windows.Forms.ToolStripSeparator());`);
              } else {
                const subVar = `${topVar}_sub_${subIdx}`;
                lines.push(`            var ${subVar} = new System.Windows.Forms.ToolStripMenuItem("${escapeCsString(sub.text)}");`);
                if (sub.shortcut) {
                  lines.push(`            // Shortcut: ${sub.shortcut}`);
                }
                if (sub.clickEvent) {
                  lines.push(`            ${subVar}.Click += (s, e) => this.${sub.clickEvent}(s, e);`);
                }
                lines.push(`            ${topVar}.DropDownItems.Add(${subVar});`);
              }
            });
          }
          lines.push(`            ${varName}.Items.Add(${topVar});`);
        });
      }

      if (n.type === 'ToolStrip' && n.properties.toolStripItems) {
        n.properties.toolStripItems.forEach((tsItem, idx) => {
          if (tsItem.isSeparator) {
            lines.push(`            ${varName}.Items.Add(new System.Windows.Forms.ToolStripSeparator());`);
          } else {
            const btnVar = `${n.properties.name}_btn_${idx}`;
            lines.push(`            var ${btnVar} = new System.Windows.Forms.ToolStripButton("${escapeCsString(tsItem.text)}");`);
            if (tsItem.toolTip) {
              lines.push(`            ${btnVar}.ToolTipText = "${escapeCsString(tsItem.toolTip)}";`);
            }
            if (tsItem.clickEvent) {
              lines.push(`            ${btnVar}.Click += (s, e) => this.${tsItem.clickEvent}(s, e);`);
            }
            lines.push(`            ${varName}.Items.Add(${btnVar});`);
          }
        });
      }

      if (n.type === 'StatusStrip' && n.properties.statusStripItems) {
        n.properties.statusStripItems.forEach((ssItem, idx) => {
          if (ssItem.type === 'ProgressBar') {
            const pbVar = `${n.properties.name}_prog_${idx}`;
            lines.push(`            var ${pbVar} = new System.Windows.Forms.ToolStripProgressBar();`);
            lines.push(`            ${pbVar}.Value = ${ssItem.progressValue || 100};`);
            lines.push(`            ${varName}.Items.Add(${pbVar});`);
          } else {
            const lblVar = `${n.properties.name}_lbl_${idx}`;
            lines.push(`            var ${lblVar} = new System.Windows.Forms.ToolStripStatusLabel("${escapeCsString(ssItem.text)}");`);
            if (ssItem.isSpring) {
              lines.push(`            ${lblVar}.Spring = true;`);
            }
            lines.push(`            ${varName}.Items.Add(${lblVar});`);
          }
        });
      }

      if (n.type === 'TreeView' && n.properties.treeNodes) {
        n.properties.treeNodes.forEach((node, idx) => {
          const rootNodeVar = `${n.properties.name}_node_${idx}`;
          lines.push(`            var ${rootNodeVar} = new System.Windows.Forms.TreeNode("${escapeCsString(node.text)}");`);
          if (node.children) {
            node.children.forEach((c1, c1Idx) => {
              const c1Var = `${rootNodeVar}_c_${c1Idx}`;
              lines.push(`            var ${c1Var} = new System.Windows.Forms.TreeNode("${escapeCsString(c1.text)}");`);
              if (c1.children) {
                c1.children.forEach((c2) => {
                  lines.push(`            ${c1Var}.Nodes.Add(new System.Windows.Forms.TreeNode("${escapeCsString(c2.text)}"));`);
                });
              }
              lines.push(`            ${rootNodeVar}.Nodes.Add(${c1Var});`);
            });
          }
          lines.push(`            ${varName}.Nodes.Add(${rootNodeVar});`);
        });
        lines.push(`            ${varName}.ExpandAll();`);
      }

      if (n.type === 'ListView') {
        lines.push(`            ${varName}.View = System.Windows.Forms.View.Details;`);
        lines.push(`            ${varName}.FullRowSelect = true;`);
        lines.push(`            ${varName}.GridLines = true;`);
        if (n.properties.listViewColumns) {
          n.properties.listViewColumns.forEach(col => {
            lines.push(`            ${varName}.Columns.Add("${escapeCsString(col.text)}", ${col.width});`);
          });
        }
        if (n.properties.listViewItems) {
          n.properties.listViewItems.forEach(item => {
            const itemVar = `${n.properties.name}_item_${item.id}`;
            lines.push(`            var ${itemVar} = new System.Windows.Forms.ListViewItem("${escapeCsString(item.text)}");`);
            if (item.subItems) {
              item.subItems.forEach(sub => {
                lines.push(`            ${itemVar}.SubItems.Add("${escapeCsString(sub)}");`);
              });
            }
            lines.push(`            ${varName}.Items.Add(${itemVar});`);
          });
        }
      }

      if (n.properties.placeholder) {
        lines.push(`            ${varName}.PlaceholderText = "${escapeCsString(n.properties.placeholder)}";`);
      }

      if (n.properties.items && n.properties.items.length > 0) {
        lines.push(`            ${varName}.Items.AddRange(new object[] {`);
        n.properties.items.forEach(item => {
          lines.push(`                "${escapeCsString(item)}",`);
        });
        lines.push(`            });`);
      }

      // Event listeners
      if (n.events) {
        Object.entries(n.events).forEach(([evtName, handler]) => {
          if (handler && handler.trim()) {
            const evtHandlerType = getEventHandlerDelegate(evtName);
            lines.push(`            ${varName}.${evtName} += new ${evtHandlerType}(this.${handler});`);
          }
        });
      }

      return lines.join('\n');
    })
    .join('\n\n');

  // Hierarchy building: container.Controls.Add(child);
  const containerAdds = Object.values(project.nodes)
    .filter(n => n.childrenIds && n.childrenIds.length > 0)
    .map(parent => {
      const parentVar = parent.id === project.rootFormId ? 'this' : `this.${parent.properties.name}`;
      const adds = parent.childrenIds
        .map(cid => {
          const child = project.nodes[cid];
          return child ? `            ${parentVar}.Controls.Add(this.${child.properties.name});` : '';
        })
        .filter(Boolean)
        .join('\n');
      return `            // Adds to ${parent.properties.name}\n${adds}`;
    })
    .join('\n\n');

  // Root Form properties
  const formEvents = rootForm.events
    ? Object.entries(rootForm.events)
        .map(([evt, handler]) => `            this.${evt} += new System.EventHandler(this.${handler});`)
        .join('\n')
    : '';

  return `//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated by NextGen C# Designer (.NET 8/9).
//     Changes to this file may cause incorrect behavior and will be lost if
//     the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace ${project.projectName || 'WinFormsApp1'}
{
    partial class ${formName}
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
${instantiations}
            this.SuspendLayout();
            // 
${controlConfigs}
            // 
            // ${formName}
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 15F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(${Math.round(rootForm.bounds.width)}, ${Math.round(rootForm.bounds.height)});
            this.Name = "${formName}";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "${escapeCsString(rootForm.properties.text || formName)}";
${rootForm.properties.backColor ? `            this.BackColor = System.Drawing.ColorTranslator.FromHtml("${rootForm.properties.backColor}");\n` : ''}${formEvents ? formEvents + '\n' : ''}
${containerAdds}
${project.rawCustomLines && project.rawCustomLines.length > 0 ? `
            // 
            // [Custom User Statements & Logic (Preserved)]
            // 
            ${project.rawCustomLines.join('\n            ')}` : ''}

            this.ResumeLayout(false);
            this.PerformLayout();
        }

        #endregion

${declarations}
    }
}
`;
};

/**
 * Generates Form1.cs code-behind with event handlers
 */
export const generateCodeBehindCs = (project: DesignerProjectState, targetFormId?: string): string => {
  const formId = targetFormId || project.activeFormId || project.rootFormId;
  const rootForm = project.nodes[formId] || project.nodes[project.rootFormId];
  const formName = rootForm?.properties.name || 'Form1';

  // Collect descendants belonging strictly to this form
  const formDescendantIds = new Set<string>();
  const collect = (pId: string) => {
    const p = project.nodes[pId];
    if (p?.childrenIds) {
      p.childrenIds.forEach(cId => {
        formDescendantIds.add(cId);
        collect(cId);
      });
    }
  };
  if (rootForm) collect(rootForm.id);

  // Collect all events across this form and its controls (Pravka 9.3: Shared Handler deduplication)
  const seenHandlers = new Set<string>();
  const activeMethodBlocks: string[] = [];

  if (rootForm?.events) {
    Object.entries(rootForm.events).forEach(([eventName, handlerName]) => {
      const trimmed = handlerName?.trim();
      if (trimmed && !seenHandlers.has(trimmed)) {
        seenHandlers.add(trimmed);
        const body = getSampleEventHandlerBody(formName, eventName, 'Form');
        activeMethodBlocks.push(`        private void ${trimmed}(object sender, EventArgs e)
        {
${body}
        }`);
      }
    });
  }

  Object.values(project.nodes).forEach(n => {
    if (formDescendantIds.has(n.id) && n.events) {
      Object.entries(n.events).forEach(([eventName, handlerName]) => {
        const trimmed = handlerName?.trim();
        if (trimmed && !seenHandlers.has(trimmed)) {
          seenHandlers.add(trimmed);
          const body = getSampleEventHandlerBody(n.properties.name, eventName, n.type);
          activeMethodBlocks.push(`        private void ${trimmed}(object sender, EventArgs e)
        {
${body}
        }`);
        }
      });
    }
  });

  // Pravka 9.1: Orphan Handler Protection in Form1.cs
  const orphanedMethodBlocks: string[] = [];
  if (project.orphanedHandlers && project.orphanedHandlers.length > 0) {
    project.orphanedHandlers.forEach(orph => {
      const trimmed = orph.handlerName.trim();
      if (trimmed && !seenHandlers.has(trimmed)) {
        seenHandlers.add(trimmed);
        orphanedMethodBlocks.push(`        // 
        // [Orphaned Handler: контрол '${orph.formerControlName}' (${orph.formerControlType}) был удален, логика сохранена]
        // 
        private void ${trimmed}(object sender, EventArgs e)
        {
            // TODO: Сохраненный пользовательский код логики:
            MessageBox.Show("Обработчик сохранен для безопасности проекта", "${orph.formerControlName}");
        }`);
      }
    });
  }

  const allMethods = [...activeMethodBlocks, ...orphanedMethodBlocks].join('\n\n');

  const headerComment = `// ================================================================================================
// Project:     ${project.projectName || 'MyWinFormsApp'}
// Namespace:   ${project.namespace || 'University.Mathematics.Lab1'}
// Author:      ${project.author || 'Александр Талентс'}
// Description: ${project.description || 'Программа спроектирована в NextGen Visual Designer'}
// Generated:   NextGen Visual Designer (GitHub Pages Edition)
// ================================================================================================`;

  return `${headerComment}
using System;
using System.Drawing;
using System.Windows.Forms;

namespace ${project.namespace || project.projectName || 'WinFormsApp1'}
{
    public partial class ${formName} : Form
    {
        public ${formName}()
        {
            InitializeComponent();
        }

${allMethods}
    }
}
`;
};

/**
 * Generates Program.cs entry point (.NET 8/9)
 */
export const generateProgramCs = (project: DesignerProjectState): string => {
  // Select main form
  const forms = Object.values(project.nodes).filter(n => n.type === 'Form');
  const mainForm = forms.find(f => f.properties.customProps?.isMainWindow) || forms[0] || project.nodes[project.rootFormId];
  const formName = mainForm?.properties.name || 'Form1';

  return `namespace ${project.projectName || 'WinFormsApp1'}
{
    internal static class Program
    {
        /// <summary>
        ///  The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            // To customize application configuration such as set high DPI settings or default font,
            // see https://aka.ms/applicationconfiguration.
            ApplicationConfiguration.Initialize();
            Application.Run(new ${formName}());
        }
    }
}
`;
};

/**
 * Generates .csproj targeting .NET 8.0-windows (WinForms)
 */
export const generateCsproj = (projectOrName: DesignerProjectState | string = 'MyFormApp'): string => {
  const projectName = typeof projectOrName === 'string'
    ? projectOrName
    : (projectOrName.projectName || 'WinFormsApp1');

  return `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0-windows</TargetFramework>
    <Nullable>enable</Nullable>
    <UseWindowsForms>true</UseWindowsForms>
    <ImplicitUsings>enable</ImplicitUsings>
    <RootNamespace>${projectName}</RootNamespace>
    <AssemblyName>${projectName}</AssemblyName>
  </PropertyGroup>

</Project>
`;
};

/**
 * Generates Avalonia AXAML Window representation
 */
export const generateAvaloniaAxaml = (project: DesignerProjectState, targetFormId?: string): string => {
  const formId = targetFormId || project.activeFormId || project.rootFormId;
  const rootForm = project.nodes[formId] || project.nodes[project.rootFormId];
  const formName = rootForm?.properties.name || 'MainWindow';

  const formDescendantIds = new Set<string>();
  const collect = (pId: string) => {
    const p = project.nodes[pId];
    if (p?.childrenIds) {
      p.childrenIds.forEach(cId => {
        formDescendantIds.add(cId);
        collect(cId);
      });
    }
  };
  if (rootForm) collect(rootForm.id);

  const childElements = Object.values(project.nodes)
    .filter(n => formDescendantIds.has(n.id))
    .map(n => {
      const axamlTag = getAvaloniaTagName(n.type);
      const lines: string[] = [];
      lines.push(`        <${axamlTag} Name="${n.properties.name}"`);

      // Content vs Text depending on Avalonia control
      if (n.properties.text) {
        if (n.type === 'TextBox' || n.type === 'Label') {
          lines.push(`                 Text="${escapeCsString(n.properties.text)}"`);
        } else if (n.type === 'Button' || n.type === 'CheckBox' || n.type === 'RadioButton') {
          lines.push(`                 Content="${escapeCsString(n.properties.text)}"`);
        } else if (n.type === 'GroupBox') {
          lines.push(`                 Header="${escapeCsString(n.properties.text)}"`);
        }
      }

      if (n.properties.placeholder && n.type === 'TextBox') {
        lines.push(`                 Watermark="${escapeCsString(n.properties.placeholder)}"`);
      }

      lines.push(`                 Canvas.Left="${Math.round(n.bounds.x)}"`);
      lines.push(`                 Canvas.Top="${Math.round(n.bounds.y)}"`);
      lines.push(`                 Width="${Math.round(n.bounds.width)}"`);
      lines.push(`                 Height="${Math.round(n.bounds.height)}"`);

      if (n.properties.backColor && n.properties.backColor !== '#FFFFFF') {
        lines.push(`                 Background="${n.properties.backColor}"`);
      }
      if (n.properties.foreColor && n.properties.foreColor !== '#000000') {
        lines.push(`                 Foreground="${n.properties.foreColor}"`);
      }
      if (n.properties.enabled === false) {
        lines.push(`                 IsEnabled="False"`);
      }
      if (n.properties.visible === false) {
        lines.push(`                 IsVisible="False"`);
      }
      if (n.type === 'ProgressBar' && n.properties.progressValue !== undefined) {
        lines.push(`                 Value="${n.properties.progressValue}"`);
      }
      if (n.properties.checked && (n.type === 'CheckBox' || n.type === 'RadioButton')) {
        lines.push(`                 IsChecked="True"`);
      }

      // Events
      if (n.events?.Click) {
        lines.push(`                 Click="${n.events.Click}"`);
      }
      if (n.events?.TextChanged) {
        lines.push(`                 TextChanged="${n.events.TextChanged}"`);
      }

      lines[lines.length - 1] += ' />';
      return lines.join('\n');
    })
    .join('\n');

  return `<Window xmlns="https://github.com/avaloniaui"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        x:Class="${project.projectName || 'AvaloniaApp'}.${formName}"
        Title="${escapeCsString(rootForm?.properties.text || formName)}"
        Width="${Math.round(rootForm?.bounds.width || 800)}"
        Height="${Math.round(rootForm?.bounds.height || 450)}"
        WindowStartupLocation="CenterScreen">
    <Canvas>
${childElements}
    </Canvas>
</Window>
`;
};

/**
 * Generates Avalonia AXAML Code-Behind (MainWindow.axaml.cs)
 */
export const generateAvaloniaAxamlCs = (project: DesignerProjectState, targetFormId?: string): string => {
  const formId = targetFormId || project.activeFormId || project.rootFormId;
  const rootForm = project.nodes[formId] || project.nodes[project.rootFormId];
  const formName = rootForm?.properties.name || 'MainWindow';

  const formDescendantIds = new Set<string>();
  const collect = (pId: string) => {
    const p = project.nodes[pId];
    if (p?.childrenIds) {
      p.childrenIds.forEach(cId => {
        formDescendantIds.add(cId);
        collect(cId);
      });
    }
  };
  if (rootForm) collect(rootForm.id);

  const childNodes = Object.values(project.nodes).filter(n => formDescendantIds.has(n.id));

  // Collect event handlers
  const eventEntries: { controlName: string; eventName: string; handlerName: string; type: string }[] = [];
  childNodes.forEach(node => {
    Object.entries(node.events || {}).forEach(([eventName, handlerName]) => {
      if (handlerName) {
        eventEntries.push({
          controlName: node.properties.name,
          eventName,
          handlerName,
          type: node.type,
        });
      }
    });
  });

  const methods = eventEntries.length > 0
    ? eventEntries
        .map(e => {
          let body = `            // Обработчик события ${e.eventName} для ${e.controlName}\n            System.Console.WriteLine($"[Avalonia] Сработало событие: ${e.handlerName}");`;
          if (e.eventName === 'Click') {
            body = `            System.Console.WriteLine($"[Avalonia] Нажата кнопка: ${e.controlName}");`;
          }
          return `        private void ${e.handlerName}(object? sender, RoutedEventArgs e)\n        {\n${body}\n        }`;
        })
        .join('\n\n')
    : `        // Обработчики событий элементов управления формы`;

  return `using System;
using Avalonia.Controls;
using Avalonia.Interactivity;

namespace ${project.projectName || 'AvaloniaApp'}
{
    public partial class ${formName} : Window
    {
        public ${formName}()
        {
            InitializeComponent();
        }

${methods}
    }
}
`;
};

/**
 * Generates .csproj project configuration for Avalonia UI
 */
export const generateAvaloniaCsproj = (projectName: string = 'MyAvaloniaApp'): string => {
  return `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <BuiltInComInteropSupport>true</BuiltInComInteropSupport>
    <ApplicationManifest>app.manifest</ApplicationManifest>
    <AvaloniaUseCompiledBindingsByDefault>true</AvaloniaUseCompiledBindingsByDefault>
    <RootNamespace>${projectName}</RootNamespace>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Avalonia" Version="11.1.0" />
    <PackageReference Include="Avalonia.Desktop" Version="11.1.0" />
    <PackageReference Include="Avalonia.Themes.Fluent" Version="11.1.0" />
    <PackageReference Include="Avalonia.Fonts.Inter" Version="11.1.0" />
  </ItemGroup>

</Project>
`;
};

/**
 * Generates Program.cs entry point for Avalonia UI
 */
export const generateAvaloniaProgramCs = (project: DesignerProjectState): string => {
  const formName = project.nodes[project.rootFormId]?.properties.name || 'MainWindow';
  const projectName = project.projectName || `${formName}App`;

  return `using System;
using Avalonia;

namespace ${projectName};

sealed class Program
{
    // Initialization code. Don't use any Avalonia, third-party APIs or any
    // SynchronizationContext-reliant code before AppMain is called: things aren't initialized
    // yet and stuff might break.
    [STAThread]
    public static void Main(string[] args) => BuildAvaloniaApp()
        .StartWithClassicDesktopLifetime(args);

    // Avalonia configuration, don't remove; also used by visual designer.
    public static AppBuilder BuildAvaloniaApp()
        => AppBuilder.Configure<App>()
            .UsePlatformDetect()
            .WithInterFont()
            .LogToTrace();
}
`;
};

/**
 * Generates README.md with run instructions
 */
export const generateReadme = (projectName: string = 'MyFormApp', framework: 'WinForms' | 'Avalonia' = 'WinForms'): string => {
  return `# ${projectName}

Сгенерировано с помощью **NextGen C# Visual Form Designer**.

## 🚀 Быстрый запуск проекта (.NET 8 / 9)

Убедитесь, что у вас установлен [.NET SDK](https://dotnet.microsoft.com/download) версии 8.0 или выше.

1. Распакуйте архив в любую папку.
2. Откройте терминал в папке с файлом \`${projectName}.csproj\`.
3. Запустите проект командой:
\`\`\`bash
dotnet run
\`\`\`

## 📁 Структура решения
${
  framework === 'WinForms'
    ? `- **\`${projectName}.csproj\`** — конфигурация проекта Windows Forms для .NET 8.0/9.0.
- **\`Program.cs\`** — точка входа в приложение (\`Application.Run\`).
- **\`Form1.cs\`** — класс логики формы и пользовательские обработчики событий.
- **\`Form1.Designer.cs\`** — автоматически сгенерированный визуальный дизайнер компонентов.`
    : `- **\`${projectName}.csproj\`** — конфигурация проекта Avalonia UI для .NET 8.0/9.0.
- **\`Program.cs\`** — запуск жизненного цикла десктопного приложения Avalonia.
- **\`App.axaml / App.axaml.cs\`** — глобальная тема FluentTheme и конфигурация приложения.
- **\`MainWindow.axaml / MainWindow.axaml.cs\`** — декларативная XAML разметка окна и C# Code-Behind.`
}
`;
};

// Helper methods
function getWinFormsTypeName(type: string): string {
  switch (type) {
    case 'Form': return 'Form';
    case 'Button': return 'Button';
    case 'TextBox': return 'TextBox';
    case 'Label': return 'Label';
    case 'Panel': return 'Panel';
    case 'CheckBox': return 'CheckBox';
    case 'RadioButton': return 'RadioButton';
    case 'ComboBox': return 'ComboBox';
    case 'ListBox': return 'ListBox';
    case 'NumericUpDown': return 'NumericUpDown';
    case 'DateTimePicker': return 'DateTimePicker';
    case 'ProgressBar': return 'ProgressBar';
    case 'PictureBox': return 'PictureBox';
    case 'GroupBox': return 'GroupBox';
    case 'FlowLayoutPanel': return 'FlowLayoutPanel';
    case 'TabControl': return 'TabControl';
    case 'DataGridView': return 'DataGridView';
    case 'MenuStrip': return 'MenuStrip';
    case 'ToolStrip': return 'ToolStrip';
    case 'StatusStrip': return 'StatusStrip';
    case 'TreeView': return 'TreeView';
    case 'ListView': return 'ListView';
    case 'RichTextBox': return 'RichTextBox';
    case 'DataChart': return 'DataVisualization.Charting.Chart';
    default: return 'Control';
  }
}

function getAvaloniaTagName(type: string): string {
  switch (type) {
    case 'Button': return 'Button';
    case 'TextBox': return 'TextBox';
    case 'Label': return 'TextBlock';
    case 'Panel': return 'Panel';
    case 'CheckBox': return 'CheckBox';
    case 'RadioButton': return 'RadioButton';
    case 'ComboBox': return 'ComboBox';
    case 'ListBox': return 'ListBox';
    case 'NumericUpDown': return 'NumericUpDown';
    case 'DateTimePicker': return 'DatePicker';
    case 'ProgressBar': return 'ProgressBar';
    case 'PictureBox': return 'Image';
    case 'GroupBox': return 'HeaderedContentControl';
    case 'TabControl': return 'TabControl';
    case 'DataGridView': return 'DataGrid';
    default: return 'Control';
  }
}

function getEventHandlerDelegate(eventName: string): string {
  switch (eventName) {
    case 'Click':
    case 'MouseEnter':
    case 'MouseLeave':
    case 'TextChanged':
    case 'CheckedChanged':
    case 'SelectedIndexChanged':
    case 'Load':
    case 'Resize':
    default:
      return 'System.EventHandler';
  }
}

function getSampleEventHandlerBody(controlName: string, eventName: string, controlType: string): string {
  if (eventName === 'Click') {
    return `            MessageBox.Show($"Действие успешно выполнено: ${controlName}", "NextGen C# Designer", MessageBoxButtons.OK, MessageBoxIcon.Information);`;
  }
  if (eventName === 'TextChanged') {
    return `            // Обработка изменения текста в поле ${controlName}\n            string currentText = ${controlName}.Text;`;
  }
  if (eventName === 'CheckedChanged') {
    return `            // Обработка переключения флажка ${controlName}\n            bool isChecked = ${controlName}.Checked;`;
  }
  if (eventName === 'Load') {
    return `            // Инициализация данных при загрузке формы\n            this.Text += " [Активна]";`;
  }
  return `            // Реализация обработчика события ${eventName} для ${controlName}`;
}

function escapeCsString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}
