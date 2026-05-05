import { describe, expect, it } from 'vitest';
import { OTHER_VALUE, buildAskUserQuestionOutput, canAdvanceQuestion, truncateHeader } from './askUserQuestion';
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
  it('emits a single-select answer in the wizard contract shape', () => {
    const raw = buildAskUserQuestionOutput([Q_AUTH], { 0: 'OAuth' }, {}, {});
    expect(JSON.parse(raw)).toEqual({
      answers: { 'Which auth method?': 'OAuth' }
    });
  });

  it('emits a multi-select answer as an array', () => {
    const raw = buildAskUserQuestionOutput([Q_FEATURES], {}, { 0: ['search', 'compose'] }, {});
    expect(JSON.parse(raw)).toEqual({
      answers: { 'Which features?': ['search', 'compose'] }
    });
  });

  it('combines single + multi questions', () => {
    const raw = buildAskUserQuestionOutput([Q_AUTH, Q_FEATURES], { 0: 'API key' }, { 1: ['sync'] }, {});
    expect(JSON.parse(raw)).toEqual({
      answers: {
        'Which auth method?': 'API key',
        'Which features?': ['sync']
      }
    });
  });

  it('omits questions with no selection', () => {
    const raw = buildAskUserQuestionOutput([Q_AUTH, Q_FEATURES], {}, {}, {});
    expect(JSON.parse(raw)).toEqual({ answers: {} });
  });

  it('rewrites a single-select Other into "Other: <text>"', () => {
    const raw = buildAskUserQuestionOutput([Q_AUTH], { 0: OTHER_VALUE }, {}, { 0: '  custom value  ' });
    expect(JSON.parse(raw)).toEqual({
      answers: { 'Which auth method?': 'Other: custom value' }
    });
  });

  it('appends a multi-select Other to the array', () => {
    const raw = buildAskUserQuestionOutput([Q_FEATURES], {}, { 0: ['search', OTHER_VALUE] }, { 0: 'tagging' });
    expect(JSON.parse(raw)).toEqual({
      answers: { 'Which features?': ['search', 'Other: tagging'] }
    });
  });

  it('drops Other from the output when its text is blank', () => {
    const raw1 = buildAskUserQuestionOutput([Q_AUTH], { 0: OTHER_VALUE }, {}, { 0: '   ' });
    expect(JSON.parse(raw1)).toEqual({ answers: {} });

    const raw2 = buildAskUserQuestionOutput([Q_FEATURES], {}, { 0: ['search', OTHER_VALUE] }, { 0: '' });
    expect(JSON.parse(raw2)).toEqual({ answers: { 'Which features?': ['search'] } });
  });
});

describe('canAdvanceQuestion', () => {
  it('disabled on a fresh single-select question', () => {
    expect(canAdvanceQuestion(Q_AUTH, 0, {}, {}, {})).toBe(false);
  });

  it('enabled once a single-select option is picked', () => {
    expect(canAdvanceQuestion(Q_AUTH, 0, { 0: 'OAuth' }, {}, {})).toBe(true);
  });

  it('disabled when single-select Other has no text', () => {
    expect(canAdvanceQuestion(Q_AUTH, 0, { 0: OTHER_VALUE }, {}, { 0: '   ' })).toBe(false);
  });

  it('enabled when single-select Other has text', () => {
    expect(canAdvanceQuestion(Q_AUTH, 0, { 0: OTHER_VALUE }, {}, { 0: 'JWT' })).toBe(true);
  });

  it('disabled on a fresh multi-select question', () => {
    expect(canAdvanceQuestion(Q_FEATURES, 0, {}, {}, {})).toBe(false);
  });

  it('enabled once a multi-select box is ticked', () => {
    expect(canAdvanceQuestion(Q_FEATURES, 0, {}, { 0: ['search'] }, {})).toBe(true);
  });

  it('disabled when multi-select includes Other but no text', () => {
    expect(canAdvanceQuestion(Q_FEATURES, 0, {}, { 0: ['search', OTHER_VALUE] }, { 0: '' })).toBe(false);
  });

  it('enabled when multi-select Other has text', () => {
    expect(canAdvanceQuestion(Q_FEATURES, 0, {}, { 0: [OTHER_VALUE] }, { 0: 'tagging' })).toBe(true);
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
