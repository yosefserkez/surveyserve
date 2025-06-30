import { SurveySchema, Question, ScoringRule } from '../types/survey';

export class ScoringEngine {
  private schema: SurveySchema;
  private responses: Record<string, any>;

  constructor(schema: SurveySchema, responses: Record<string, any>) {
    this.schema = schema;
    this.responses = responses;
  }

  private getQuestionValue(questionId: string): number {
    const question = this.schema.questions.find(q => q.id === questionId);
    const rawValue = this.responses[questionId];
    
    if (rawValue === undefined || rawValue === null) {
      return 0;
    }

    let value = typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue;
    
    // Apply reverse scoring if needed
    if (question?.reverse_score && question?.options) {
      const maxValue = Math.max(...question.options.map(opt => Number(opt.value)));
      const minValue = Math.min(...question.options.map(opt => Number(opt.value)));
      value = maxValue + minValue - value;
    }

    return value;
  }

  private evaluateFormula(formula: string, computedScores: Record<string, any>): number {
    // Replace score names with actual values in formulas
    let evaluableFormula = formula;
    
    // Sort by length (longest first) to avoid partial replacements
    const sortedKeys = Object.keys(computedScores).sort((a, b) => b.length - a.length);
    
    for (const key of sortedKeys) {
      const value = computedScores[key];
      if (typeof value === 'number') {
        // Use word boundaries to avoid partial replacements
        evaluableFormula = evaluableFormula.replace(
          new RegExp(`\\b${key}\\b`, 'g'),
          String(value)
        );
      }
    }

    try {
      // Using Function constructor for safe evaluation of mathematical expressions
      const result = new Function(`return ${evaluableFormula}`)();
      return typeof result === 'number' && !isNaN(result) ? result : 0;
    } catch (error) {
      console.warn('Formula evaluation failed:', formula, 'with values:', computedScores);
      return 0;
    }
  }

  private evaluateCondition(condition: string, computedScores: Record<string, any>): boolean {
    // Replace score names with actual values
    let evaluableCondition = condition;
    
    // Sort by length (longest first) to avoid partial replacements
    const sortedKeys = Object.keys(computedScores).sort((a, b) => b.length - a.length);
    
    for (const key of sortedKeys) {
      const value = computedScores[key];
      if (typeof value === 'number') {
        evaluableCondition = evaluableCondition.replace(
          new RegExp(`\\b${key}\\b`, 'g'),
          String(value)
        );
      }
    }

    try {
      // Using Function constructor for safe evaluation of boolean expressions
      return Boolean(new Function(`return ${evaluableCondition}`)());
    } catch {
      return false;
    }
  }

  public computeScores(): Record<string, any> {
    const computedScores: Record<string, any> = {};

    // Sort scoring rules to ensure dependencies are computed first
    const sortedRules = this.sortRulesByDependencies();

    for (const [scoreName, rule] of sortedRules) {
      try {
        computedScores[scoreName] = this.computeScore(rule, computedScores);
      } catch (error) {
        console.warn(`Error computing score ${scoreName}:`, error);
        computedScores[scoreName] = null;
      }
    }

    return computedScores;
  }

  private sortRulesByDependencies(): Array<[string, ScoringRule]> {
    const rules = Object.entries(this.schema.scoring_rules);
    const sorted: Array<[string, ScoringRule]> = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (ruleName: string, rule: ScoringRule) => {
      if (visiting.has(ruleName)) {
        // Circular dependency detected, add to end
        return;
      }
      if (visited.has(ruleName)) {
        return;
      }

      visiting.add(ruleName);

      // Find dependencies
      const dependencies = this.getRuleDependencies(rule);
      for (const dep of dependencies) {
        const depRule = this.schema.scoring_rules[dep];
        if (depRule) {
          visit(dep, depRule);
        }
      }

      visiting.delete(ruleName);
      visited.add(ruleName);
      sorted.push([ruleName, rule]);
    };

    for (const [ruleName, rule] of rules) {
      visit(ruleName, rule);
    }

    return sorted;
  }

  private getRuleDependencies(rule: ScoringRule): string[] {
    const dependencies: string[] = [];

    // Check input field
    if (rule.input) {
      dependencies.push(rule.input);
    }

    // Check formula for references to other scores
    if (rule.formula) {
      const scoreNames = Object.keys(this.schema.scoring_rules);
      for (const scoreName of scoreNames) {
        if (new RegExp(`\\b${scoreName}\\b`).test(rule.formula)) {
          dependencies.push(scoreName);
        }
      }
    }

    // Check condition for references to other scores
    if (rule.condition) {
      const scoreNames = Object.keys(this.schema.scoring_rules);
      for (const scoreName of scoreNames) {
        if (new RegExp(`\\b${scoreName}\\b`).test(rule.condition)) {
          dependencies.push(scoreName);
        }
      }
    }

    return dependencies;
  }

  private computeScore(rule: ScoringRule, computedScores: Record<string, any>): any {
    switch (rule.type) {
      case 'sum':
        if (!rule.questions) return 0;
        const sumResult = rule.questions.reduce((sum, qId) => sum + this.getQuestionValue(qId), 0);
        
        // Apply formula if present
        if (rule.formula) {
          // Create temporary scope with the sum result
          const tempScores = { ...computedScores, sum: sumResult };
          return this.evaluateFormula(rule.formula.replace(/\bsum\b/g, 'sum'), tempScores);
        }
        
        return sumResult;

      case 'average':
        if (!rule.questions || rule.questions.length === 0) return 0;
        const sum = rule.questions.reduce((total, qId) => total + this.getQuestionValue(qId), 0);
        const avgResult = sum / rule.questions.length;
        
        // Apply formula if present
        if (rule.formula) {
          // Create temporary scope with the average result
          const tempScores = { ...computedScores, average: avgResult };
          return this.evaluateFormula(rule.formula.replace(/\baverage\b/g, 'average'), tempScores);
        }
        
        return avgResult;

      case 'computed':
        // New rule type for pure formula-based calculations
        if (!rule.formula) return 0;
        return this.evaluateFormula(rule.formula, computedScores);

      case 'threshold':
        if (!rule.input) return null;
        
        let inputValue = computedScores[rule.input];
        if (inputValue === undefined || inputValue === null) return null;
        
        // Apply formula to input if present
        if (rule.formula) {
          // If there's a formula but no thresholds, this is really a computed score
          if (!rule.thresholds) {
            // Create temporary scope with the input value
            const tempScores = { ...computedScores, [rule.input]: inputValue };
            return this.evaluateFormula(rule.formula, tempScores);
          }
          
          // Apply formula to get the value for threshold comparison
          const tempScores = { ...computedScores, [rule.input]: inputValue };
          inputValue = this.evaluateFormula(rule.formula, tempScores);
        }
        
        // Apply thresholds if present
        if (rule.thresholds) {
          const threshold = rule.thresholds.find(t => inputValue >= t.min && inputValue <= t.max);
          return threshold ? threshold.label : 'Unknown';
        }
        
        // If no thresholds and no formula, just return the input value
        return inputValue;

      case 'flag':
        if (!rule.condition) return false;
        return this.evaluateCondition(rule.condition, computedScores);

      default:
        return null;
    }
  }
}

export function scoreResponse(schema: SurveySchema, rawResponses: Record<string, any>): Record<string, any> {
  const engine = new ScoringEngine(schema, rawResponses);
  return engine.computeScores();
}