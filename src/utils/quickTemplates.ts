/**
 * 1-Click Quick Template Injectors (Развилка Б)
 * Generates and inserts pre-configured compound control blocks directly into the active form or panel.
 */

import { DesignerProjectState, DesignerNode } from '../types/ast';

export interface QuickTemplateInsertionResult {
  nextNodes: Record<string, DesignerNode>;
  createdIds: string[];
  containerId: string;
}

export const insertLoginBlock = (
  project: DesignerProjectState,
  targetParentId?: string,
  dropPosition?: { x: number; y: number }
): QuickTemplateInsertionResult => {
  const parentId = targetParentId && project.nodes[targetParentId]
    ? targetParentId
    : (project.activeFormId && project.nodes[project.activeFormId] ? project.activeFormId : project.rootFormId);

  const parentNode = project.nodes[parentId];
  const count = Object.values(project.nodes).filter(n => n.type === 'Panel').length + 1;
  const uid = Date.now().toString(36);

  const pnlId = `pnlAuth_${uid}`;
  const lblTitleId = `lblAuthTitle_${uid}`;
  const lblLoginId = `lblLogin_${uid}`;
  const txtLoginId = `txtLogin_${uid}`;
  const lblPassId = `lblPass_${uid}`;
  const txtPassId = `txtPassword_${uid}`;
  const chkRememberId = `chkRemember_${uid}`;
  const btnLoginId = `btnLogin_${uid}`;
  const btnCancelId = `btnCancel_${uid}`;

  const posX = dropPosition?.x ?? Math.min(40 + (count * 20), (parentNode?.bounds.width || 600) - 300);
  const posY = dropPosition?.y ?? Math.min(40 + (count * 20), (parentNode?.bounds.height || 400) - 250);

  const newNodes: Record<string, DesignerNode> = { ...project.nodes };

  // Main Auth Panel
  newNodes[pnlId] = {
    id: pnlId,
    type: 'Panel',
    bounds: { x: posX, y: posY, width: 290, height: 230 },
    properties: {
      name: `pnlAuth${count}`,
      text: 'Авторизация',
      enabled: true,
      visible: true,
      backColor: '#FFFFFF',
      borderStyle: 'FixedSingle',
      fontSize: 9,
      fontFamily: 'Segoe UI',
    },
    events: {},
    parentId,
    childrenIds: [lblTitleId, lblLoginId, txtLoginId, lblPassId, txtPassId, chkRememberId, btnLoginId, btnCancelId],
  };

  // Header
  newNodes[lblTitleId] = {
    id: lblTitleId,
    type: 'Label',
    bounds: { x: 16, y: 12, width: 200, height: 20 },
    properties: {
      name: `lblTitle_${uid}`,
      text: 'Вход в систему',
      enabled: true,
      visible: true,
      fontBold: true,
      fontSize: 10,
      foreColor: '#1E293B',
    },
    events: {},
    parentId: pnlId,
    childrenIds: [],
  };

  // Login
  newNodes[lblLoginId] = {
    id: lblLoginId,
    type: 'Label',
    bounds: { x: 16, y: 40, width: 80, height: 16 },
    properties: { name: `lblUser_${uid}`, text: 'Логин / Email:', enabled: true, visible: true, fontSize: 8.5 },
    events: {},
    parentId: pnlId,
    childrenIds: [],
  };

  newNodes[txtLoginId] = {
    id: txtLoginId,
    type: 'TextBox',
    bounds: { x: 16, y: 58, width: 256, height: 26 },
    properties: { name: `txtLogin${count}`, text: 'admin@corp.net', placeholder: 'Введите логин...', enabled: true, visible: true },
    events: {},
    parentId: pnlId,
    childrenIds: [],
  };

  // Password
  newNodes[lblPassId] = {
    id: lblPassId,
    type: 'Label',
    bounds: { x: 16, y: 92, width: 80, height: 16 },
    properties: { name: `lblPassword_${uid}`, text: 'Пароль:', enabled: true, visible: true, fontSize: 8.5 },
    events: {},
    parentId: pnlId,
    childrenIds: [],
  };

  newNodes[txtPassId] = {
    id: txtPassId,
    type: 'TextBox',
    bounds: { x: 16, y: 110, width: 256, height: 26 },
    properties: { name: `txtPassword${count}`, text: '••••••••', placeholder: 'Пароль...', enabled: true, visible: true },
    events: {},
    parentId: pnlId,
    childrenIds: [],
  };

  // Remember
  newNodes[chkRememberId] = {
    id: chkRememberId,
    type: 'CheckBox',
    bounds: { x: 16, y: 144, width: 150, height: 20 },
    properties: { name: `chkRemember${count}`, text: 'Запомнить меня', checked: true, enabled: true, visible: true, fontSize: 8.5 },
    events: {},
    parentId: pnlId,
    childrenIds: [],
  };

  // Login Button
  newNodes[btnLoginId] = {
    id: btnLoginId,
    type: 'Button',
    bounds: { x: 16, y: 178, width: 140, height: 34 },
    properties: { name: `btnLogin${count}`, text: 'Войти в систему', backColor: '#2563EB', foreColor: '#FFFFFF', fontBold: true, enabled: true, visible: true },
    events: { Click: `btnLogin${count}_Click` },
    parentId: pnlId,
    childrenIds: [],
  };

  // Cancel Button
  newNodes[btnCancelId] = {
    id: btnCancelId,
    type: 'Button',
    bounds: { x: 164, y: 178, width: 108, height: 34 },
    properties: { name: `btnCancel${count}`, text: 'Отмена', backColor: '#E2E8F0', foreColor: '#334155', enabled: true, visible: true },
    events: { Click: `btnCancel${count}_Click` },
    parentId: pnlId,
    childrenIds: [],
  };

  // Link to parent
  if (newNodes[parentId]) {
    newNodes[parentId] = {
      ...newNodes[parentId],
      childrenIds: [...(newNodes[parentId].childrenIds || []), pnlId],
    };
  }

  return {
    nextNodes: newNodes,
    createdIds: [pnlId, lblTitleId, lblLoginId, txtLoginId, lblPassId, txtPassId, chkRememberId, btnLoginId, btnCancelId],
    containerId: pnlId,
  };
};

export const insertTableFilterBlock = (
  project: DesignerProjectState,
  targetParentId?: string,
  dropPosition?: { x: number; y: number }
): QuickTemplateInsertionResult => {
  const parentId = targetParentId && project.nodes[targetParentId]
    ? targetParentId
    : (project.activeFormId && project.nodes[project.activeFormId] ? project.activeFormId : project.rootFormId);

  const parentNode = project.nodes[parentId];
  const count = Object.values(project.nodes).filter(n => n.type === 'DataGridView').length + 1;
  const uid = Date.now().toString(36);

  const pnlId = `pnlTableFilter_${uid}`;
  const lblSearchId = `lblSearch_${uid}`;
  const txtSearchId = `txtSearch_${uid}`;
  const btnSearchId = `btnSearch_${uid}`;
  const btnResetId = `btnReset_${uid}`;
  const dgvId = `dgvRecords_${uid}`;

  const posX = dropPosition?.x ?? Math.min(30 + (count * 20), (parentNode?.bounds.width || 700) - 420);
  const posY = dropPosition?.y ?? Math.min(30 + (count * 20), (parentNode?.bounds.height || 450) - 280);

  const newNodes: Record<string, DesignerNode> = { ...project.nodes };

  newNodes[pnlId] = {
    id: pnlId,
    type: 'Panel',
    bounds: { x: posX, y: posY, width: 440, height: 260 },
    properties: {
      name: `pnlTableFilter${count}`,
      text: 'Таблица с фильтром',
      enabled: true,
      visible: true,
      backColor: '#FFFFFF',
      borderStyle: 'FixedSingle',
    },
    events: {},
    parentId,
    childrenIds: [lblSearchId, txtSearchId, btnSearchId, btnResetId, dgvId],
  };

  newNodes[lblSearchId] = {
    id: lblSearchId,
    type: 'Label',
    bounds: { x: 12, y: 14, width: 55, height: 20 },
    properties: { name: `lblFilter_${uid}`, text: 'Поиск:', fontBold: true, enabled: true, visible: true },
    events: {},
    parentId: pnlId,
    childrenIds: [],
  };

  newNodes[txtSearchId] = {
    id: txtSearchId,
    type: 'TextBox',
    bounds: { x: 68, y: 11, width: 190, height: 26 },
    properties: { name: `txtSearch${count}`, placeholder: 'Фильтр по имени или роли...', enabled: true, visible: true },
    events: {},
    parentId: pnlId,
    childrenIds: [],
  };

  newNodes[btnSearchId] = {
    id: btnSearchId,
    type: 'Button',
    bounds: { x: 264, y: 10, width: 85, height: 28 },
    properties: { name: `btnFind${count}`, text: '🔍 Найти', backColor: '#2563EB', foreColor: '#FFFFFF', fontBold: true, enabled: true, visible: true },
    events: { Click: `btnFind${count}_Click` },
    parentId: pnlId,
    childrenIds: [],
  };

  newNodes[btnResetId] = {
    id: btnResetId,
    type: 'Button',
    bounds: { x: 355, y: 10, width: 75, height: 28 },
    properties: { name: `btnReset${count}`, text: 'Сброс', backColor: '#F1F5F9', foreColor: '#475569', enabled: true, visible: true },
    events: { Click: `btnReset${count}_Click` },
    parentId: pnlId,
    childrenIds: [],
  };

  newNodes[dgvId] = {
    id: dgvId,
    type: 'DataGridView',
    bounds: { x: 12, y: 48, width: 416, height: 198 },
    properties: {
      name: `dgvRecords${count}`,
      columns: ['ID', 'ФИО', 'Должность', 'Статус'],
      allowUserToAddRows: true,
      enabled: true,
      visible: true,
    },
    events: {},
    parentId: pnlId,
    childrenIds: [],
  };

  if (newNodes[parentId]) {
    newNodes[parentId] = {
      ...newNodes[parentId],
      childrenIds: [...(newNodes[parentId].childrenIds || []), pnlId],
    };
  }

  return {
    nextNodes: newNodes,
    createdIds: [pnlId, lblSearchId, txtSearchId, btnSearchId, btnResetId, dgvId],
    containerId: pnlId,
  };
};

export const insertConfirmationDialogBlock = (
  project: DesignerProjectState,
  targetParentId?: string,
  dropPosition?: { x: number; y: number }
): QuickTemplateInsertionResult => {
  const parentId = targetParentId && project.nodes[targetParentId]
    ? targetParentId
    : (project.activeFormId && project.nodes[project.activeFormId] ? project.activeFormId : project.rootFormId);

  const parentNode = project.nodes[parentId];
  const count = Object.values(project.nodes).filter(n => n.type === 'GroupBox').length + 1;
  const uid = Date.now().toString(36);

  const grpId = `grpConfirm_${uid}`;
  const lblMsgId = `lblMsg_${uid}`;
  const btnConfirmId = `btnConfirm_${uid}`;
  const btnDismissId = `btnDismiss_${uid}`;

  const posX = dropPosition?.x ?? Math.min(50 + (count * 20), (parentNode?.bounds.width || 600) - 340);
  const posY = dropPosition?.y ?? Math.min(50 + (count * 20), (parentNode?.bounds.height || 400) - 160);

  const newNodes: Record<string, DesignerNode> = { ...project.nodes };

  newNodes[grpId] = {
    id: grpId,
    type: 'GroupBox',
    bounds: { x: posX, y: posY, width: 330, height: 140 },
    properties: {
      name: `grpConfirm${count}`,
      text: 'Диалог подтверждения',
      enabled: true,
      visible: true,
      backColor: '#FFFFFF',
    },
    events: {},
    parentId,
    childrenIds: [lblMsgId, btnConfirmId, btnDismissId],
  };

  newNodes[lblMsgId] = {
    id: lblMsgId,
    type: 'Label',
    bounds: { x: 18, y: 28, width: 290, height: 42 },
    properties: {
      name: `lblNotice_${uid}`,
      text: 'Вы действительно хотите применить изменения и продолжить выполнение операции?',
      foreColor: '#334155',
      enabled: true,
      visible: true,
    },
    events: {},
    parentId: grpId,
    childrenIds: [],
  };

  newNodes[btnConfirmId] = {
    id: btnConfirmId,
    type: 'Button',
    bounds: { x: 18, y: 84, width: 140, height: 36 },
    properties: {
      name: `btnConfirm${count}`,
      text: '✓ Да, продолжить',
      backColor: '#16A34A',
      foreColor: '#FFFFFF',
      fontBold: true,
      enabled: true,
      visible: true,
    },
    events: { Click: `btnConfirm${count}_Click` },
    parentId: grpId,
    childrenIds: [],
  };

  newNodes[btnDismissId] = {
    id: btnDismissId,
    type: 'Button',
    bounds: { x: 168, y: 84, width: 140, height: 36 },
    properties: {
      name: `btnDismiss${count}`,
      text: '✕ Отмена',
      backColor: '#F1F5F9',
      foreColor: '#475569',
      enabled: true,
      visible: true,
    },
    events: { Click: `btnDismiss${count}_Click` },
    parentId: grpId,
    childrenIds: [],
  };

  if (newNodes[parentId]) {
    newNodes[parentId] = {
      ...newNodes[parentId],
      childrenIds: [...(newNodes[parentId].childrenIds || []), grpId],
    };
  }

  return {
    nextNodes: newNodes,
    createdIds: [grpId, lblMsgId, btnConfirmId, btnDismissId],
    containerId: grpId,
  };
};
