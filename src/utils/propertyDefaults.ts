import { ControlType, NodeProperties, LayoutBounds } from '../types/ast';
import { COMPONENT_REGISTRY } from './componentRegistry';

/**
 * Standard .NET Default Properties Map per Control Type
 */
export const STANDARD_NET_DEFAULTS: Record<string, Partial<NodeProperties>> = {
  Button: {
    backColor: '#2563EB',
    foreColor: '#FFFFFF',
    fontFamily: 'Segoe UI',
    fontSize: 9,
    fontBold: false,
    enabled: true,
    visible: true,
    anchor: ['Top', 'Left'],
    dock: 'None',
    flatStyle: 'Standard',
    locked: false,
    tabIndex: 0,
  },
  TextBox: {
    backColor: '#FFFFFF',
    foreColor: '#000000',
    fontFamily: 'Segoe UI',
    fontSize: 9,
    fontBold: false,
    enabled: true,
    visible: true,
    anchor: ['Top', 'Left'],
    dock: 'None',
    borderStyle: 'Fixed3D',
    placeholder: '',
    locked: false,
    tabIndex: 0,
  },
  Label: {
    backColor: 'transparent',
    foreColor: '#111827',
    fontFamily: 'Segoe UI',
    fontSize: 9,
    fontBold: false,
    enabled: true,
    visible: true,
    anchor: ['Top', 'Left'],
    dock: 'None',
    autoSize: true,
    locked: false,
    tabIndex: 0,
  },
  CheckBox: {
    backColor: 'transparent',
    foreColor: '#111827',
    fontFamily: 'Segoe UI',
    fontSize: 9,
    fontBold: false,
    checked: false,
    enabled: true,
    visible: true,
    anchor: ['Top', 'Left'],
    dock: 'None',
    locked: false,
    tabIndex: 0,
  },
  RadioButton: {
    backColor: 'transparent',
    foreColor: '#111827',
    fontFamily: 'Segoe UI',
    fontSize: 9,
    fontBold: false,
    checked: false,
    enabled: true,
    visible: true,
    anchor: ['Top', 'Left'],
    dock: 'None',
    locked: false,
    tabIndex: 0,
  },
  ComboBox: {
    backColor: '#FFFFFF',
    foreColor: '#111827',
    fontFamily: 'Segoe UI',
    fontSize: 9,
    fontBold: false,
    dropDownStyle: 'DropDown',
    enabled: true,
    visible: true,
    anchor: ['Top', 'Left'],
    dock: 'None',
    locked: false,
    tabIndex: 0,
  },
  ListBox: {
    backColor: '#FFFFFF',
    foreColor: '#111827',
    fontFamily: 'Segoe UI',
    fontSize: 9,
    fontBold: false,
    selectionMode: 'One',
    enabled: true,
    visible: true,
    anchor: ['Top', 'Left'],
    dock: 'None',
    locked: false,
    tabIndex: 0,
  },
  ProgressBar: {
    progressValue: 30,
    minimum: 0,
    maximum: 100,
    style: 'Continuous',
    enabled: true,
    visible: true,
    anchor: ['Top', 'Left'],
    dock: 'None',
    locked: false,
  },
  Panel: {
    backColor: '#F3F4F6',
    borderStyle: 'None',
    enabled: true,
    visible: true,
    anchor: ['Top', 'Left'],
    dock: 'None',
    locked: false,
  },
  Form: {
    backColor: '#F3F4F6',
    foreColor: '#111827',
    fontFamily: 'Segoe UI',
    fontSize: 9,
    fontBold: false,
    enabled: true,
    visible: true,
    autoScroll: false,
  },
};

/**
 * Returns the standard .NET default value for a property key on a given control type
 */
export function getDefaultPropertyValue(type: ControlType | string, propKey: string): any {
  const typeDefaults = STANDARD_NET_DEFAULTS[type] || STANDARD_NET_DEFAULTS.Button;
  if (propKey in typeDefaults) {
    return (typeDefaults as any)[propKey];
  }

  // Fallback defaults
  switch (propKey) {
    case 'anchor': return ['Top', 'Left'];
    case 'dock': return 'None';
    case 'enabled': return true;
    case 'visible': return true;
    case 'locked': return false;
    case 'tabIndex': return 0;
    case 'fontFamily': return 'Segoe UI';
    case 'fontSize': return 9;
    case 'fontBold': return false;
    case 'backColor': return '#F3F4F6';
    case 'foreColor': return '#111827';
    case 'flatStyle': return 'Standard';
    case 'borderStyle': return 'FixedSingle';
    default: return undefined;
  }
}

/**
 * Checks if a property is modified (dirty) compared to standard .NET defaults
 */
export function isPropertyDirty(type: ControlType | string, propKey: string, currentValue: any): boolean {
  if (currentValue === undefined) return false;
  const defVal = getDefaultPropertyValue(type, propKey);
  if (defVal === undefined) return false;

  // Array comparison (e.g. anchor)
  if (Array.isArray(currentValue) && Array.isArray(defVal)) {
    if (currentValue.length !== defVal.length) return true;
    const sortedCur = [...currentValue].sort().join(',');
    const sortedDef = [...defVal].sort().join(',');
    return sortedCur !== sortedDef;
  }

  // Color normalization
  if (propKey === 'backColor' || propKey === 'foreColor') {
    if (typeof currentValue === 'string' && typeof defVal === 'string') {
      return currentValue.toLowerCase() !== defVal.toLowerCase();
    }
  }

  return currentValue !== defVal;
}
