/**
 * Per-field auto-translate toggle — mirrors PlatformBackend's
 * ``/api/v1/translations/`` endpoints (see PRs ``feat/translations-api``
 * and ``feat/translations-serializer-bool``).
 *
 * The model + field pair is whitelisted server-side via the
 * ``capabilities`` endpoint; only those (model, field) combinations
 * may be flipped on/off. Enabling stores the literal into the
 * ``Translation`` table (zh-cn source) and replaces the column with a
 * ``$t(<key>)`` reference, which the ``translate.py`` cron then fans
 * out to 17 locales. Disabling deletes all 18 locale rows and writes
 * the literal back into the column.
 */

export interface ITranslationCapability {
  model: string;
  key_prefix: string;
  fields: string[];
}

export interface ITranslationCapabilitiesResponse {
  items: ITranslationCapability[];
}

export interface ITranslationEnableRequest {
  model: string;
  object_id: string;
  field: string;
  content: string;
}

export interface ITranslationEnableResponse {
  key: string;
  field_value: string;
  source: string;
  auto_translate: true;
}

export interface ITranslationDisableRequest {
  model: string;
  object_id: string;
  field: string;
}

export interface ITranslationDisableResponse {
  field_value: string | null;
  auto_translate: false;
}
