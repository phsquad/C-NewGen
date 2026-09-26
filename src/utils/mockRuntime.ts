/**
 * Mock System Runtime & Virtual C# Execution Engine
 * Simulates C# Form behavior, Console.WriteLine, and MessageBox.Show
 */

export interface VirtualConsoleLog {
  id: string;
  time: string;
  category: 'System' | 'Event' | 'Console.WriteLine' | 'MessageBox.Show';
  text: string;
  details?: string;
}

export const getTimestamp = (): string => {
  const now = new Date();
  return (
    now.toTimeString().split(' ')[0] +
    '.' +
    now.getMilliseconds().toString().padStart(3, '0')
  );
};
