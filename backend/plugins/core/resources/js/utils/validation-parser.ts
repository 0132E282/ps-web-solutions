import type { TFunction } from "i18next";

/**
 * Parses Laravel-style validation strings (e.g., 'required|max:255')
 * into React Hook Form rules config.
 *
 * @param validationStr - The validation string from backend configs
 * @param required - Boolean indicating if the field is required from other props
 * @param t - The i18n translation function
 * @param existingRules - Any existing React Hook Form rules to merge with
 * @returns React Hook Form rules object
 */
export const parseValidationRules = (
  validationStr: string | unknown,
  required: boolean | undefined,
  t: TFunction,
  existingRules?: Record<string, unknown>
): Record<string, unknown> => {
  const rules: Record<string, unknown> = { ...(existingRules || {}) };

  if (typeof validationStr === 'string') {
    const parts = validationStr.split('|');
    parts.forEach(part => {
      const [rule, val] = part.split(':');

      if (rule === 'required') {
        rules.required = t('validation.required', { defaultValue: 'Field is required' });
      }

      if (rule === 'max' && val) {
        rules.maxLength = {
          value: parseInt(val, 10),
          message: t('validation.max_length', { max: val, defaultValue: `Maximum length is ${val}` })
        };
      }

      if (rule === 'min' && val) {
        rules.minLength = {
          value: parseInt(val, 10),
          message: t('validation.min_length', { min: val, defaultValue: `Minimum length is ${val}` })
        };
      }

      // Add more Laravel rule mappings here as needed
      // e.g. email, numeric, regex
    });
  }

  // Fallback to required prop if not explicitly in validation string
  if (required && !rules.required) {
    rules.required = t('validation.required', { defaultValue: 'Field is required' });
  }

  return rules;
};
