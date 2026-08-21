import type { IServiceCostRule } from '@/models';

export type PricingBillingKind = 'free' | 'fixed' | 'linear' | 'calculated';

export interface PricingCondition {
  field: string;
  operator: 'equals' | 'oneOf' | 'atMost' | 'lessThan' | 'atLeast' | 'greaterThan' | 'either' | 'anyOf' | 'other';
  value: string;
  options?: PricingCondition[];
}

export interface ServicePricingRow {
  id: string;
  conditions: PricingCondition[];
  billingKind: PricingBillingKind;
  amount?: number;
  rateField?: string;
  unit?: string;
  remark?: string;
}

const CONDITION_OPERATORS = new Set(['==', '===', 'in', '<=', '<', '>=', '>']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getVariable(value: unknown): string | undefined {
  if (!isRecord(value) || !('var' in value)) return undefined;
  const variable = value.var;
  if (typeof variable === 'string') return variable;
  if (Array.isArray(variable) && typeof variable[0] === 'string') return variable[0];
  return undefined;
}

function displayValue(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value) && value.every((item) => ['string', 'number', 'boolean'].includes(typeof item))) {
    return value.map(String).join(', ');
  }
  return undefined;
}

function normalizeComparison(operator: string, operands: unknown[]): PricingCondition | undefined {
  if (operands.length < 2) return undefined;
  const leftField = getVariable(operands[0]);
  const rightField = getVariable(operands[1]);
  const field = leftField || rightField;
  if (!field) return undefined;

  const literal = leftField ? operands[1] : operands[0];
  const value = displayValue(literal);
  if (value === undefined) return undefined;

  if (operator === 'in') return { field, operator: 'oneOf', value };
  if (operator === '==' || operator === '===') return { field, operator: 'equals', value };

  const reversed = !leftField;
  const mapping: Record<string, PricingCondition['operator']> = reversed
    ? { '<=': 'atLeast', '<': 'greaterThan', '>=': 'atMost', '>': 'lessThan' }
    : { '<=': 'atMost', '<': 'lessThan', '>=': 'atLeast', '>': 'greaterThan' };
  return { field, operator: mapping[operator] || 'other', value };
}

function parseSpecialCondition(operator: string, operands: unknown[]): PricingCondition | undefined {
  if (operator !== 'some' || operands.length !== 2) return undefined;
  const [collection, predicate] = operands;
  if (getVariable(collection) !== 'content' || !isRecord(predicate) || !Array.isArray(predicate.in)) return undefined;
  const [role, roleVariable] = predicate.in;
  if (role !== 'reference_video' || getVariable(roleVariable) !== 'role') return undefined;
  return { field: 'referenceVideo', operator: 'equals', value: 'required' };
}

function parseConditions(value: unknown): PricingCondition[] | undefined {
  if (!isRecord(value) || Object.keys(value).length === 0) return [];
  const entries = Object.entries(value);
  if (entries.length !== 1) return undefined;
  const [operator, rawOperands] = entries[0];
  if (!Array.isArray(rawOperands)) return undefined;

  if (operator === 'and') {
    const parsed = rawOperands.map(parseConditions);
    if (parsed.some((item) => item === undefined)) return undefined;
    return parsed.flatMap((item) => item || []);
  }

  if (operator === 'or') {
    const parsed = rawOperands.map(parseConditions);
    if (parsed.some((item) => !item || item.length !== 1)) return undefined;
    const conditions = parsed.flatMap((item) => item || []);
    const first = conditions[0];
    if (!first) return undefined;
    if (conditions.every((item) => item.field === first.field)) {
      return [{ field: first.field, operator: 'either', value: conditions.map((item) => item.value).join(', ') }];
    }
    return [{ field: '', operator: 'anyOf', value: '', options: conditions }];
  }

  if (CONDITION_OPERATORS.has(operator)) {
    return [normalizeComparison(operator, rawOperands)].filter(Boolean) as PricingCondition[];
  }
  const special = parseSpecialCondition(operator, rawOperands);
  return special ? [special] : [{ field: '', operator: 'other', value: '' }];
}

function parseLinearConsumption(value: unknown): { amount: number; rateField: string } | undefined {
  if (!isRecord(value) || !Array.isArray(value['*']) || value['*'].length !== 2) return undefined;
  const [left, right] = value['*'];
  if (typeof left === 'number') {
    const rateField = getVariable(right);
    return rateField ? { amount: left, rateField } : undefined;
  }
  if (typeof right === 'number') {
    const rateField = getVariable(left);
    return rateField ? { amount: right, rateField } : undefined;
  }
  return undefined;
}

function applyRemarkOverrides(conditions: PricingCondition[], remark: IServiceCostRule['remark']): PricingCondition[] {
  if (!isRecord(remark)) return conditions;
  return conditions.map((condition) => {
    const override = remark[condition.field];
    return typeof override === 'string' ? { ...condition, value: override } : condition;
  });
}

export function formatCredits(value: number): string {
  if (value > 0 && value < 0.0001) return '<0.0001';
  if (value < 0.01) return value.toFixed(4);
  return value.toFixed(2);
}

export function normalizeServicePricing(rules: unknown): ServicePricingRow[] {
  if (!Array.isArray(rules)) return [];

  return rules.flatMap((candidate, index): ServicePricingRow[] => {
    if (!isRecord(candidate) || candidate.hidden === true) return [];
    const rule = candidate as unknown as IServiceCostRule;
    const parsedConditions = parseConditions(rule.conditions);
    const conditions = applyRemarkOverrides(
      parsedConditions ?? [{ field: '', operator: 'other', value: '' }],
      rule.remark
    );
    const common = {
      id: `pricing-rule-${index}`,
      conditions,
      unit: typeof rule.unit === 'string' ? rule.unit : undefined,
      remark: typeof rule.remark === 'string' ? rule.remark : undefined
    };

    if (typeof rule.consumption === 'number' && Number.isFinite(rule.consumption)) {
      return [{ ...common, billingKind: rule.consumption === 0 ? 'free' : 'fixed', amount: rule.consumption }];
    }

    const linear = parseLinearConsumption(rule.consumption);
    if (linear) return [{ ...common, billingKind: 'linear', ...linear }];
    return [{ ...common, billingKind: 'calculated' }];
  });
}

interface ModelRuleMatch {
  values: string[];
  defaultValue?: string;
}

function getVariableDefault(value: unknown): string | undefined {
  if (!isRecord(value) || !Array.isArray(value.var)) return undefined;
  const fallback = value.var[1];
  return typeof fallback === 'string' ? fallback : undefined;
}

function collectModelRuleMatches(value: unknown): ModelRuleMatch[] {
  if (!isRecord(value)) return [];
  const entries = Object.entries(value);
  if (entries.length !== 1) return [];
  const [operator, operands] = entries[0];
  if (!Array.isArray(operands)) return [];
  if (operator === 'and' || operator === 'or') return operands.flatMap(collectModelRuleMatches);
  if (operator !== '==' && operator !== '===' && operator !== 'in') return [];
  const variableIndex = operands.findIndex((operand) => getVariable(operand) === 'model');
  if (variableIndex < 0) return [];
  const literal = operands[variableIndex === 0 ? 1 : 0];
  const values = Array.isArray(literal)
    ? literal.filter((item): item is string => typeof item === 'string')
    : typeof literal === 'string'
      ? [literal]
      : [];
  return values.length ? [{ values, defaultValue: getVariableDefault(operands[variableIndex]) }] : [];
}

export function filterServicePricingRules(rules: unknown, models?: string[], modelDefault?: string): unknown[] {
  if (!Array.isArray(rules) || !models?.length) return Array.isArray(rules) ? rules : [];
  const allowed = new Set(models);
  return rules.filter((rule) => {
    if (!isRecord(rule)) return false;
    const matches = collectModelRuleMatches(rule.conditions);
    return matches.some(
      (match) =>
        (!modelDefault || match.defaultValue === modelDefault) && match.values.some((value) => allowed.has(value))
    );
  });
}

function filterModelCondition(condition: PricingCondition, allowed: Set<string>): PricingCondition | undefined {
  if (condition.operator === 'anyOf') {
    const options = (condition.options || [])
      .map((option) => filterModelCondition(option, allowed))
      .filter(Boolean) as PricingCondition[];
    return options.length ? { ...condition, options } : undefined;
  }
  if (condition.field !== 'model' && condition.field !== 'model_name') return condition;
  const values = condition.value.split(',').map((value) => value.trim());
  const matched = values.filter((value) => allowed.has(value));
  return matched.length ? { ...condition, value: matched.join(', ') } : undefined;
}

export function filterServicePricingRows(rows: ServicePricingRow[], models?: string[]): ServicePricingRow[] {
  if (!models?.length) return rows;
  const allowed = new Set(models);
  return rows.flatMap((row): ServicePricingRow[] => {
    const hasModelCondition = row.conditions.some(
      (condition) =>
        condition.field === 'model' ||
        condition.field === 'model_name' ||
        condition.options?.some((option) => option.field === 'model' || option.field === 'model_name')
    );
    if (!hasModelCondition) return [];
    const conditions = row.conditions
      .map((condition) => filterModelCondition(condition, allowed))
      .filter(Boolean) as PricingCondition[];
    const retainsModelCondition = conditions.some(
      (condition) =>
        condition.field === 'model' ||
        condition.field === 'model_name' ||
        condition.options?.some((option) => option.field === 'model' || option.field === 'model_name')
    );
    return retainsModelCondition ? [{ ...row, conditions }] : [];
  });
}
