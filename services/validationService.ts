import { FieldDefinition } from '../types';

export const validationService = {
  validateField: (value: any, field: FieldDefinition): string | null => {
    // 1. Check Required
    if (field.required) {
      const isEmpty = value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
      if (isEmpty) return `${field.label} is required`;
    }

    // Skip further validation if empty (unless required, handled above)
    if (value === null || value === undefined || value === '') return null;

    const rules = field.validation;
    if (!rules) return null;

    // 2. Check Number Ranges
    if (field.type === 'number') {
      const numVal = Number(value);
      if (isNaN(numVal)) return `${field.label} must be a number`;
      
      if (rules.min !== undefined && numVal < rules.min) {
        return rules.customErrorMessage || `${field.label} must be at least ${rules.min}`;
      }
      if (rules.max !== undefined && numVal > rules.max) {
        return rules.customErrorMessage || `${field.label} must be at most ${rules.max}`;
      }
    }

    // 3. Check Regex Pattern (Text/Textarea)
    if (rules.pattern && (field.type === 'text' || field.type === 'textarea')) {
      try {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(value)) {
          return rules.customErrorMessage || `${field.label} format is invalid`;
        }
      } catch (e) {
        console.warn("Invalid regex pattern", rules.pattern);
      }
    }

    return null;
  },

  validateRecord: (data: any, fields: FieldDefinition[]): { [key: string]: string } => {
    const errors: { [key: string]: string } = {};
    fields.forEach(field => {
      const error = validationService.validateField(data[field.id], field);
      if (error) {
        errors[field.id] = error;
      }
    });
    return errors;
  }
};