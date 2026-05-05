import { describe, expect, it } from 'vitest';
import { buildAskUserQuestionOutput, canSubmitAskUserQuestion, truncateHeader } from './askUserQuestion';
import type { IAskUserQuestion } from '@/models';

const Q_AUTH: IAskUserQuestion = {
  header: 'Auth',
  question: 'Which auth method?',
  options: [
    { label: 'OAuth', description: 'Delegated' },
    { label: 'Session', description: 'Cookie-based' },
    { label: 'API key', description: 'Static' }
  ]
};

const Q_FEATURES: IAskUserQuestion = {
  header: 'Features',
  question: 'Which features?',
  multiSelect: true,
  options: [
    { label: 'search', description: 'Full-text' },
    { label: 'compose', description: 'Editor' },
    { label: 'sync', description: 'Background' }
  ]
};

describe('buildAskUserQuestionOutput', () => {
  it('emits a single-select answer in the JSON contract shape', () => {
    const raw = buildAskUserQuestionOutput([Q_AUTH], { 0: 'OAuth' }, {}, '');
    expect(JSON.parse(raw)).toEqual({
      answers: { 'Which auth method?': 'OAuth' },
      other: null
    });
  });

  it('emits a multi-select answer as an array', () => {
    const raw = buildAskUserQuestionOutput([Q_FEATURES], {}, { 0: ['search', 'compose'] }, '');
    expect(JSON.parse(raw)).toEqual({
      answers: { 'Which features?': ['search', 'compose'] },
      other: null
    });
  });

  it('combines single + multi questions and the Other free-text', () => {
    const raw = buildAskUserQuestionOutput([Q_AUTH, Q_FEATURES], { 0: 'API key' }, { 1: ['sync'] }, 'tone: terse');
    expect(JSON.parse(raw)).toEqual({
      answers: {
        'Which auth method?': 'API key',
        'Which features?': ['sync']
      },
      other: 'tone: terse'
    });
  });

  it('omits questions with no selection and trims `other`', () => {
    const raw = buildAskUserQuestionOutput([Q_AUTH, Q_FEATURES], {}, {}, '   ');
    expect(JSON.parse(raw)).toEqual({ answers: {}, other: null });
  });
});

describe('canSubmitAskUserQuestion', () => {
  it('disabled when nothing is filled', () => {
    expect(canSubmitAskUserQuestion({}, {}, '')).toBe(false);
  });

  it('enabled with a single-select choice only', () => {
    expect(canSubmitAskUserQuestion({ 0: 'OAuth' }, {}, '')).toBe(true);
  });

  it('enabled with a multi-select choice only', () => {
    expect(canSubmitAskUserQuestion({}, { 1: ['search'] }, '')).toBe(true);
  });

  it('enabled with Other free-text only (no option picked)', () => {
    expect(canSubmitAskUserQuestion({}, {}, 'something custom')).toBe(true);
  });

  it('disabled with whitespace-only Other and no selection', () => {
    expect(canSubmitAskUserQuestion({}, {}, '   ')).toBe(false);
  });

  it('disabled when multi-select map has empty arrays', () => {
    expect(canSubmitAskUserQuestion({}, { 0: [] }, '')).toBe(false);
  });
});

describe('truncateHeader', () => {
  it('returns short headers unchanged', () => {
    expect(truncateHeader('Auth')).toBe('Auth');
  });

  it('truncates headers over 12 chars with ellipsis', () => {
    // 11 retained chars + ellipsis = 12 chars total per contract.
    expect(truncateHeader('NotAVeryShortHeader')).toBe('NotAVerySho…');
  });

  it('handles empty input', () => {
    expect(truncateHeader('')).toBe('');
  });
});
