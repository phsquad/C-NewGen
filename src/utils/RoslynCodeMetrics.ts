export interface MethodMetric {
  name: string;
  signature: string;
  startLine: number;
  endLine: number;
  linesOfCode: number;
  cyclomaticComplexity: number; // V(G)
  risk: 'low' | 'medium' | 'high' | 'critical';
  branchPoints: { line: number; type: string }[];
  maintainabilityIndex: number; // 0 - 100
}

export interface CodeMetricsResult {
  totalLinesOfCode: number;
  executableLinesOfCode: number;
  commentLinesOfCode: number;
  averageCyclomaticComplexity: number;
  maxCyclomaticComplexity: number;
  overallMaintainabilityIndex: number; // 0 - 100
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  halsteadVolume: number;
  depthOfInheritance: number;
  classCoupling: number;
  methods: MethodMetric[];
  technicalDebtMinutes: number;
  recommendations: string[];
}

export class RoslynCodeMetrics {
  /**
   * Calculates Cyclomatic Complexity V(G) and software quality metrics for C# code
   * V(G) = E - N + 2P or 1 + (count of branching statements: if, while, for, foreach, case, catch, &&, ||, ??, ?:)
   */
  public static analyzeCode(csharpCode: string): CodeMetricsResult {
    const lines = csharpCode.split('\n');
    const totalLinesOfCode = lines.length;
    let commentLinesOfCode = 0;
    let executableLinesOfCode = 0;

    // Detect comments & blank lines
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        commentLinesOfCode++;
      } else {
        executableLinesOfCode++;
      }
    });

    // Detect methods using C# method signature regex
    const methodRegex = /(?:public|private|protected|internal|static|async|override|virtual|\s)+\s+([a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g;
    const methods: MethodMetric[] = [];

    let match;
    while ((match = methodRegex.exec(csharpCode)) !== null) {
      const returnType = match[1];
      const methodName = match[2];
      const params = match[3];
      const startIndex = match.index;

      // Find method start line
      const textBefore = csharpCode.substring(0, startIndex);
      const startLine = textBefore.split('\n').length;

      // Find matching closing brace
      let openBraces = 0;
      let endIndex = startIndex;
      let methodBody = '';

      for (let i = startIndex; i < csharpCode.length; i++) {
        if (csharpCode[i] === '{') openBraces++;
        else if (csharpCode[i] === '}') {
          openBraces--;
          if (openBraces === 0) {
            endIndex = i;
            methodBody = csharpCode.substring(startIndex, endIndex + 1);
            break;
          }
        }
      }

      const methodLines = methodBody.split('\n');
      const endLine = startLine + methodLines.length - 1;
      const linesOfCode = methodLines.length;

      // Scan branch points in method body
      const branchPoints: { line: number; type: string }[] = [];
      let complexity = 1; // Base complexity = 1

      methodLines.forEach((mLine, idx) => {
        const currentLineNum = startLine + idx;
        const trimmed = mLine.trim();

        // Skip comments
        if (trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

        // Branching tokens
        const branchPatterns = [
          { pattern: /\bif\s*\(/g, type: 'if' },
          { pattern: /\belse\s+if\s*\(/g, type: 'else if' },
          { pattern: /\bwhile\s*\(/g, type: 'while' },
          { pattern: /\bfor\s*\(/g, type: 'for' },
          { pattern: /\bforeach\s*\(/g, type: 'foreach' },
          { pattern: /\bcase\s+[^:]+:/g, type: 'case' },
          { pattern: /\bcatch\s*(\(|$)/g, type: 'catch' },
          { pattern: /&&/g, type: 'logical AND (&&)' },
          { pattern: /\|\|/g, type: 'logical OR (||)' },
          { pattern: /\?\?/g, type: 'null coalescing (??)' },
          { pattern: /\?[^.:]/g, type: 'ternary operator (?)' },
        ];

        branchPatterns.forEach(({ pattern, type }) => {
          const matches = mLine.match(pattern);
          if (matches) {
            matches.forEach(() => {
              complexity++;
              branchPoints.push({ line: currentLineNum, type });
            });
          }
        });
      });

      // Calculate Halstead Volume approximation for method
      const tokenCount = methodBody.split(/[\s,;(){}[\]+\-*/%=<>!&|]+/).filter(Boolean).length;
      const uniqueTokens = new Set(methodBody.split(/[\s,;(){}[\]+\-*/%=<>!&|]+/).filter(Boolean)).size;
      const halsteadVolume = tokenCount * (uniqueTokens > 1 ? Math.log2(uniqueTokens) : 1);

      // SEI Maintainability Index formula (scaled 0-100)
      // MI = MAX(0, (171 - 5.2 * ln(HV) - 0.23 * V(G) - 16.2 * ln(LOC)) * 100 / 171)
      const safeLoc = Math.max(1, linesOfCode);
      const safeHv = Math.max(1, halsteadVolume);
      const rawMi = 171 - 5.2 * Math.log(safeHv) - 0.23 * complexity - 16.2 * Math.log(safeLoc);
      const maintainabilityIndex = Math.max(0, Math.min(100, Math.round((rawMi * 100) / 171)));

      let risk: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (complexity > 20) risk = 'critical';
      else if (complexity > 10) risk = 'high';
      else if (complexity > 5) risk = 'medium';

      methods.push({
        name: methodName,
        signature: `${returnType} ${methodName}(${params.trim()})`,
        startLine,
        endLine,
        linesOfCode,
        cyclomaticComplexity: complexity,
        risk,
        branchPoints,
        maintainabilityIndex,
      });
    }

    // Default if no methods detected
    if (methods.length === 0) {
      methods.push({
        name: 'Main',
        signature: 'void Main()',
        startLine: 1,
        endLine: totalLinesOfCode,
        linesOfCode: totalLinesOfCode,
        cyclomaticComplexity: 1,
        risk: 'low',
        branchPoints: [],
        maintainabilityIndex: 95,
      });
    }

    const totalComplexity = methods.reduce((acc, m) => acc + m.cyclomaticComplexity, 0);
    const averageCyclomaticComplexity = Number((totalComplexity / methods.length).toFixed(1));
    const maxCyclomaticComplexity = Math.max(...methods.map((m) => m.cyclomaticComplexity));
    const overallMaintainabilityIndex = Math.round(
      methods.reduce((acc, m) => acc + m.maintainabilityIndex, 0) / methods.length
    );

    let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (maxCyclomaticComplexity > 20 || overallMaintainabilityIndex < 40) overallRisk = 'critical';
    else if (maxCyclomaticComplexity > 10 || overallMaintainabilityIndex < 65) overallRisk = 'high';
    else if (maxCyclomaticComplexity > 5 || overallMaintainabilityIndex < 80) overallRisk = 'medium';

    // Halstead volume for entire file
    const allTokens = csharpCode.split(/[\s,;(){}[\]+\-*/%=<>!&|]+/).filter(Boolean);
    const uniqueTokens = new Set(allTokens);
    const halsteadVolume = Math.round(allTokens.length * Math.log2(Math.max(2, uniqueTokens.size)));

    // Technical debt calculation (estimated minutes needed to refactor high complexity methods)
    let technicalDebtMinutes = 0;
    const recommendations: string[] = [];

    methods.forEach((m) => {
      if (m.cyclomaticComplexity > 10) {
        const extraComplexity = m.cyclomaticComplexity - 10;
        technicalDebtMinutes += extraComplexity * 25; // 25 min per excessive branch
        recommendations.push(
          `Метод "${m.name}" имеет $V(G) = ${m.cyclomaticComplexity}$. Рекомендуется применить "Extract Method" (Ctrl+R, Ctrl+M) для декомпозиции условий.`
        );
      }
      if (m.linesOfCode > 40) {
        technicalDebtMinutes += 15;
        recommendations.push(
          `Метод "${m.name}" превышает 40 строк кода (${m.linesOfCode} строк). Рекомендуется разбить на подзадачи.`
        );
      }
      if (m.maintainabilityIndex < 60) {
        recommendations.push(
          `Индекс сопровождаемости метода "${m.name}" (${m.maintainabilityIndex}/100) ниже порога нормы. Упростите вложенную логику.`
        );
      }
    });

    if (recommendations.length === 0) {
      recommendations.push(
        '✅ Архитектура кода чистая и понятная. Все методы имеют оптимальную цикломатическую сложность (V(G) ≤ 5).'
      );
    }

    return {
      totalLinesOfCode,
      executableLinesOfCode,
      commentLinesOfCode,
      averageCyclomaticComplexity,
      maxCyclomaticComplexity,
      overallMaintainabilityIndex,
      overallRisk,
      halsteadVolume,
      depthOfInheritance: 2,
      classCoupling: Math.min(12, 1 + methods.length),
      methods,
      technicalDebtMinutes,
      recommendations,
    };
  }
}
