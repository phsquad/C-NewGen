// ==============================================================================
// 🌟 Master Template Code Registry - Real C# Implementations for all 100 Templates
// ==============================================================================

import { BUSINESS_TEMPLATES_CODE } from './businessTemplatesCode';
import { EDUCATION_TEMPLATES_CODE } from './educationTemplatesCode';
import { TOOLS_TEMPLATES_CODE } from './toolsTemplatesCode';
import { MEDIA_TEMPLATES_CODE } from './mediaTemplatesCode';
import { NETWORK_TEMPLATES_CODE } from './networkTemplatesCode';
import { TEXT_TEMPLATES_CODE } from './textTemplatesCode';
import { GAMES_TEMPLATES_CODE } from './gamesTemplatesCode';
import { SECURITY_TEMPLATES_CODE } from './securityTemplatesCode';
import { AUTOMATION_TEMPLATES_CODE } from './automationTemplatesCode';
import { IOT_TEMPLATES_CODE } from './iotTemplatesCode';

export type TemplateCodeGenerator = (formName: string, projectName: string) => string;

const ALL_TEMPLATES_MAP: Record<string, TemplateCodeGenerator> = {
  ...BUSINESS_TEMPLATES_CODE,
  ...EDUCATION_TEMPLATES_CODE,
  ...TOOLS_TEMPLATES_CODE,
  ...MEDIA_TEMPLATES_CODE,
  ...NETWORK_TEMPLATES_CODE,
  ...TEXT_TEMPLATES_CODE,
  ...GAMES_TEMPLATES_CODE,
  ...SECURITY_TEMPLATES_CODE,
  ...AUTOMATION_TEMPLATES_CODE,
  ...IOT_TEMPLATES_CODE,
};

/**
 * Checks whether a template ID has a dedicated real C# implementation
 */
export const hasRealCSharpCodeForTemplate = (templateId: string): boolean => {
  return templateId in ALL_TEMPLATES_MAP;
};

/**
 * Returns real, compilable, non-dummy C# source code for any of the 100 templates
 */
export const getRealCSharpCodeForTemplate = (
  templateId: string,
  formName: string = 'Form1',
  projectName: string = 'WinFormsApp1'
): string | null => {
  const generator = ALL_TEMPLATES_MAP[templateId];
  if (!generator) return null;
  return generator(formName, projectName);
};

/**
 * Total count of verified production-grade templates
 */
export const getSupportedTemplatesCount = (): number => {
  return Object.keys(ALL_TEMPLATES_MAP).length;
};
