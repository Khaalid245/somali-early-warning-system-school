import { useState, useCallback } from 'react';

export const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = useCallback((fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return '';

    for (const rule of rules) {
      const error = rule(value, values);
      if (error) return error;
    }
    return '';
  }, [validationRules, values]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validate(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validate]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validate(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validate]);

  const validateAll = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validate(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(Object.keys(validationRules).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    return isValid;
  }, [validationRules, values, validate]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setValues
  };
};

// Common validation rules
export const validators = {
  required: (message = 'This field is required') => (value) => {
    return !value || value.trim() === '' ? message : '';
  },

  email: (message = 'Please enter a valid email address') => (value) => {
    if (!value) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(value) ? message : '';
  },

  minLength: (min, message) => (value) => {
    if (!value) return '';
    return value.length < min ? message || `Must be at least ${min} characters` : '';
  },

  maxLength: (max, message) => (value) => {
    if (!value) return '';
    return value.length > max ? message || `Must be no more than ${max} characters` : '';
  },

  pattern: (regex, message = 'Invalid format') => (value) => {
    if (!value) return '';
    return !regex.test(value) ? message : '';
  },

  number: (message = 'Must be a valid number') => (value) => {
    if (!value) return '';
    return isNaN(value) ? message : '';
  },

  min: (minValue, message) => (value) => {
    if (!value) return '';
    return Number(value) < minValue ? message || `Must be at least ${minValue}` : '';
  },

  max: (maxValue, message) => (value) => {
    if (!value) return '';
    return Number(value) > maxValue ? message || `Must be no more than ${maxValue}` : '';
  },

  match: (fieldName, message = 'Fields do not match') => (value, allValues) => {
    return value !== allValues[fieldName] ? message : '';
  }
};

// Form field component with validation
export function FormField({ 
  label, 
  name, 
  type = 'text', 
  value, 
  error, 
  touched, 
  onChange, 
  onBlur,
  required = false,
  placeholder,
  disabled = false,
  className = ''
}) {
  const showError = touched && error;

  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={name} className=\"block text-sm font-medium text-gray-700 mb-1\">
        {label}
        {required && <span className=\"text-red-500 ml-1\">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
          showError ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {showError && (
        <p className=\"mt-1 text-sm text-red-600 flex items-center gap-1\">
          <span>⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}

// Textarea field component
export function TextAreaField({ 
  label, 
  name, 
  value, 
  error, 
  touched, 
  onChange, 
  onBlur,
  required = false,
  placeholder,
  rows = 4,
  disabled = false,
  className = ''
}) {
  const showError = touched && error;

  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={name} className=\"block text-sm font-medium text-gray-700 mb-1\">
        {label}
        {required && <span className=\"text-red-500 ml-1\">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
          showError ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {showError && (
        <p className=\"mt-1 text-sm text-red-600 flex items-center gap-1\">
          <span>⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}

// Select field component
export function SelectField({ 
  label, 
  name, 
  value, 
  error, 
  touched, 
  onChange, 
  onBlur,
  required = false,
  options = [],
  disabled = false,
  className = ''
}) {
  const showError = touched && error;

  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={name} className=\"block text-sm font-medium text-gray-700 mb-1\">
        {label}
        {required && <span className=\"text-red-500 ml-1\">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
          showError ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        <option value=\"\">Select {label}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {showError && (
        <p className=\"mt-1 text-sm text-red-600 flex items-center gap-1\">
          <span>⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}
