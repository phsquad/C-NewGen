import { DesignerNode } from '../types/ast';

export interface SignalPort {
  nodeId: string;
  portType: 'property_out' | 'event_out' | 'property_in' | 'action_in';
  name: string; // e.g. "Text", "Click", "Value", "Enabled", "Visible", "Close", "Clear"
  dataType: 'string' | 'bool' | 'int' | 'event' | 'void' | 'any';
}

export interface WireConnection {
  id: string;
  from: SignalPort;
  to: SignalPort;
  transformerExpr?: string; // e.g. `$"Привет, {val}!"`
}

export class SignalWireEngine {
  /**
   * Retrieves available input/output ports for any given control node
   */
  public static getDefaultPorts(node: DesignerNode): { outPorts: SignalPort[]; inPorts: SignalPort[] } {
    const outPorts: SignalPort[] = [];
    const inPorts: SignalPort[] = [];

    // Common properties & actions
    inPorts.push({ nodeId: node.id, portType: 'property_in', name: 'Enabled', dataType: 'bool' });
    inPorts.push({ nodeId: node.id, portType: 'property_in', name: 'Visible', dataType: 'bool' });

    switch (node.type) {
      case 'TextBox':
      case 'RichTextBox':
        outPorts.push({ nodeId: node.id, portType: 'property_out', name: 'Text', dataType: 'string' });
        inPorts.push({ nodeId: node.id, portType: 'property_in', name: 'Text', dataType: 'string' });
        inPorts.push({ nodeId: node.id, portType: 'action_in', name: 'Clear', dataType: 'void' });
        break;

      case 'Button':
      case 'IconButton':
        outPorts.push({ nodeId: node.id, portType: 'event_out', name: 'Click', dataType: 'event' });
        inPorts.push({ nodeId: node.id, portType: 'property_in', name: 'Text', dataType: 'string' });
        break;

      case 'Label':
        inPorts.push({ nodeId: node.id, portType: 'property_in', name: 'Text', dataType: 'string' });
        break;

      case 'CheckBox':
      case 'RadioButton':
      case 'ToggleSwitch':
        outPorts.push({ nodeId: node.id, portType: 'property_out', name: 'Checked', dataType: 'bool' });
        inPorts.push({ nodeId: node.id, portType: 'property_in', name: 'Checked', dataType: 'bool' });
        break;

      case 'NumericUpDown':
      case 'ProgressBar':
      case 'TrackBar':
        outPorts.push({ nodeId: node.id, portType: 'property_out', name: 'Value', dataType: 'int' });
        inPorts.push({ nodeId: node.id, portType: 'property_in', name: 'Value', dataType: 'int' });
        break;

      case 'ComboBox':
      case 'ListBox':
        outPorts.push({ nodeId: node.id, portType: 'property_out', name: 'SelectedItem', dataType: 'string' });
        inPorts.push({ nodeId: node.id, portType: 'action_in', name: 'Clear', dataType: 'void' });
        break;

      case 'DataGridView':
        inPorts.push({ nodeId: node.id, portType: 'action_in', name: 'ClearSelection', dataType: 'void' });
        outPorts.push({ nodeId: node.id, portType: 'event_out', name: 'SelectionChanged', dataType: 'event' });
        break;

      case 'Form':
        inPorts.push({ nodeId: node.id, portType: 'action_in', name: 'Close', dataType: 'void' });
        inPorts.push({ nodeId: node.id, portType: 'action_in', name: 'Hide', dataType: 'void' });
        outPorts.push({ nodeId: node.id, portType: 'event_out', name: 'Load', dataType: 'event' });
        break;

      default:
        inPorts.push({ nodeId: node.id, portType: 'property_in', name: 'Text', dataType: 'string' });
        break;
    }

    return { outPorts, inPorts };
  }

  /**
   * Generates clean C# reactive binding code for all active signal wires
   */
  public static compileWiresToCSharp(wires: WireConnection[], nodes: Record<string, DesignerNode>): string {
    if (!wires || wires.length === 0) return '';

    const lines: string[] = [];
    lines.push('            // --- ⚡️ Реактивные нити данных (Visual Signal-Wiring) ---');

    wires.forEach(wire => {
      const sourceNode = nodes[wire.from.nodeId];
      const targetNode = nodes[wire.to.nodeId];
      if (!sourceNode || !targetNode) return;

      const sName = sourceNode.properties.name || 'source';
      const tName = targetNode.properties.name || 'target';

      // 1. Event -> Action: e.g. btnSubmit.Click -> Form.Close()
      if (wire.from.portType === 'event_out' && wire.to.portType === 'action_in') {
        if (targetNode.type === 'Form') {
          lines.push(`            this.${sName}.${wire.from.name} += (s, e) => this.${wire.to.name}();`);
        } else {
          lines.push(`            this.${sName}.${wire.from.name} += (s, e) => this.${tName}.${wire.to.name}();`);
        }
      }
      // 2. Event -> Property: e.g. btnSubmit.Click -> target.Visible = false / target.Text = "..."
      else if (wire.from.portType === 'event_out' && wire.to.portType === 'property_in') {
        if (wire.to.name === 'Enabled' || wire.to.name === 'Visible') {
          lines.push(`            this.${sName}.${wire.from.name} += (s, e) => this.${tName}.${wire.to.name} = !this.${tName}.${wire.to.name};`);
        } else {
          lines.push(`            this.${sName}.${wire.from.name} += (s, e) => this.${tName}.${wire.to.name} = "${wire.transformerExpr || 'Action Done'}";`);
        }
      }
      // 3. Property -> Property: e.g. txtLogin.Text -> lblWelcome.Text
      else if (wire.from.portType === 'property_out' && wire.to.portType === 'property_in') {
        if (wire.from.name === 'Text' && wire.to.name === 'Text') {
          if (wire.transformerExpr && wire.transformerExpr.includes('{val}')) {
            const template = wire.transformerExpr.replace('{val}', `{this.${sName}.Text}`);
            lines.push(`            this.${sName}.TextChanged += (s, e) => this.${tName}.Text = $"${template.replace(/"/g, '\\"')}";`);
          } else if (wire.transformerExpr) {
            lines.push(`            this.${sName}.TextChanged += (s, e) => this.${tName}.Text = $"Привет, {this.${sName}.Text}!";`);
          } else {
            lines.push(`            this.${sName}.TextChanged += (s, e) => this.${tName}.Text = this.${sName}.Text;`);
          }
        } else if (wire.from.name === 'Checked' && (wire.to.name === 'Enabled' || wire.to.name === 'Visible')) {
          lines.push(`            this.${sName}.CheckedChanged += (s, e) => this.${tName}.${wire.to.name} = this.${sName}.Checked;`);
        } else if (wire.from.name === 'Value' && (wire.to.name === 'Value' || wire.to.name === 'Text')) {
          const evt = sourceNode.type === 'TrackBar' ? 'Scroll' : 'ValueChanged';
          if (wire.to.name === 'Text') {
            lines.push(`            this.${sName}.${evt} += (s, e) => this.${tName}.Text = this.${sName}.Value.ToString();`);
          } else {
            lines.push(`            this.${sName}.${evt} += (s, e) => this.${tName}.Value = this.${sName}.Value;`);
          }
        } else {
          lines.push(`            this.${sName}.TextChanged += (s, e) => this.${tName}.${wire.to.name} = this.${sName}.${wire.from.name};`);
        }
      }
    });

    return lines.join('\n');
  }
}
