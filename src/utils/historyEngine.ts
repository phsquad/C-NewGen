import { compare, applyPatch, Operation } from 'fast-json-patch';
import { DesignerProjectState } from '../types/ast';

export interface HistoryCommand {
  id: string;
  index: number;
  timestamp: number;
  timeStr: string;
  description: string;
  category: 'create' | 'delete' | 'move' | 'resize' | 'property' | 'event' | 'theme' | 'align' | 'template' | 'checkpoint' | 'order' | 'duplicate';
  forwardPatches: Operation[];
  inversePatches: Operation[];
  selectedNodeIdsBefore: string[];
  selectedNodeIdsAfter: string[];
  isCheckpoint?: boolean;
}

/**
 * Creates an RFC 6902 history command with forward and inverse delta patches
 */
export function createHistoryCommand(
  prevState: DesignerProjectState,
  nextState: DesignerProjectState,
  description: string,
  category: HistoryCommand['category'] = 'property',
  index = 1,
  isCheckpoint = false
): HistoryCommand {
  // Strip transient or heavy properties if any before diffing
  const forwardPatches = compare(prevState, nextState);
  const inversePatches = compare(nextState, prevState);

  return {
    id: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    index,
    timestamp: Date.now(),
    timeStr: new Date().toLocaleTimeString(),
    description,
    category,
    forwardPatches,
    inversePatches,
    selectedNodeIdsBefore: prevState.selectedNodeIds || [],
    selectedNodeIdsAfter: nextState.selectedNodeIds || [],
    isCheckpoint,
  };
}

/**
 * Applies patches to a target project state
 */
export function applyHistoryPatches(
  currentState: DesignerProjectState,
  patches: Operation[]
): DesignerProjectState {
  if (!patches || patches.length === 0) return currentState;
  const cloned = JSON.parse(JSON.stringify(currentState));
  const result = applyPatch(cloned, patches);
  return result.newDocument || cloned;
}

/**
 * Calculates estimated memory in KB
 */
export function calculateHistoryMemoryKb(commands: HistoryCommand[], redoCommands: HistoryCommand[] = []): number {
  try {
    const raw = JSON.stringify({ c: commands, r: redoCommands });
    return Math.max(1, Math.round((raw.length * 2) / 1024));
  } catch {
    return (commands.length + redoCommands.length) * 3;
  }
}
