/**
 * Visual Action Flow (No-Code Constructor) Specifications
 * 100 Visual Actions across 10 Categories
 */

export type ActionCategoryId =
  | 'windows_nav'      // 1. Окна, формы и навигация (1-10)
  | 'elements_props'   // 2. Управление элементами и свойствами (11-20)
  | 'dialogs_msg'      // 3. Диалоги, сообщения и уведомления (21-30)
  | 'vars_math_logic'  // 4. Переменные, математика и логика (31-40)
  | 'sqlite_db'        // 5. Базы данных SQLite (41-50)
  | 'network_api'      // 6. Интернет, API и сетевые запросы (51-60)
  | 'timers_anim'      // 7. Таймеры, время и анимации (61-70)
  | 'lists_tables'     // 8. Списки, выпадающие меню и таблицы (71-80)
  | 'files_disk'       // 9. Файлы, папки и диск (81-90)
  | 'sound_system';    // 10. Звук, мультимедиа и система (91-100)

export interface ActionCategoryMeta {
  id: ActionCategoryId;
  title: string;
  emoji: string;
  description: string;
  range: string; // e.g. "1–10"
  color: string;
}

export type ActionParamType =
  | 'text'
  | 'select'
  | 'control'
  | 'form'
  | 'color'
  | 'number'
  | 'boolean'
  | 'textarea'
  | 'condition';

export interface ActionParamSchema {
  key: string;
  label: string;
  type: ActionParamType;
  options?: { value: string; label: string }[] | string[];
  defaultValue?: any;
  placeholder?: string;
  description?: string;
}

export interface ActionDefinition {
  num: number; // 1 to 100
  id: string; // e.g. "ACT_01_OPEN_FORM"
  title: string;
  category: ActionCategoryId;
  description: string;
  icon: string;
  paramsSchema: ActionParamSchema[];
  hasBranching?: boolean; // If true, supports then/else sub-chains (e.g. If/Else, Confirm Dialog)
}

export interface ActionStep {
  id: string;
  actionNum: number;
  actionId: string;
  params: Record<string, any>;
  thenBranch?: ActionStep[];
  elseBranch?: ActionStep[];
}

export interface ActionFlow {
  id: string;
  triggerNodeId: string;
  triggerEvent: string; // e.g. "Click", "Load", "TextChanged", "SelectedIndexChanged"
  title?: string;
  steps: ActionStep[];
}
