import { useState, useCallback } from "react";

// ── Validation rule functions ──────────────────────────────────────────────────
export const rules = {
    required: (label = "This field") =>
        (val) => (!val?.toString().trim() ? `${label} is required` : null),

    email: () =>
        (val) =>
            val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())
                ? "Enter a valid email address"
                : null,

    phone: () =>
        (val) =>
            val && !/^[6-9]\d{9}$/.test(val.replace(/\D/g, ""))
                ? "Enter a valid 10-digit Indian mobile number"
                : null,

    minLength: (n, label = "This field") =>
        (val) =>
            val && val.trim().length < n
                ? `${label} must be at least ${n} characters`
                : null,

    maxLength: (n, label = "This field") =>
        (val) =>
            val && val.trim().length > n
                ? `${label} must be at most ${n} characters`
                : null,

    passwordStrength: () =>
        (val) => {
            if (!val) return null;
            if (val.length < 8) return "Password must be at least 8 characters";
            return null;
        },

    url: () =>
        (val) =>
            val && !/^https?:\/\/.+\..+/.test(val.trim())
                ? "Enter a valid URL (e.g. https://example.com)"
                : null,

    match: (compareValue, label = "Fields") =>
        (val) => val !== compareValue ? `${label} do not match` : null,
};

// ── useFormValidation hook ────────────────────────────────────────────────────
/**
 * Usage:
 *   const { errors, validate, clearError } = useFormValidation({
 *     name:     [rules.required("Name"), rules.minLength(2)],
 *     email:    [rules.required("Email"), rules.email()],
 *     phone:    [rules.phone()],
 *     password: [rules.required("Password"), rules.passwordStrength()],
 *   });
 *
 *   const isValid = validate(formData);  // returns true/false, sets errors
 *   clearError("name");                  // clears a single field error on change
 */
const useFormValidation = (schema) => {
    const [errors, setErrors] = useState({});

    // Validate all fields at once (call on submit)
    const validate = useCallback(
        (data) => {
            const newErrors = {};
            let isValid = true;

            for (const field of Object.keys(schema)) {
                const fieldRules = schema[field];
                for (const rule of fieldRules) {
                    const error = rule(data[field]);
                    if (error) {
                        newErrors[field] = error;
                        isValid = false;
                        break; // stop at first error per field
                    }
                }
            }

            setErrors(newErrors);
            return isValid;
        },
        [schema]
    );

    // Validate a single field (call onChange for real-time feedback)
    const validateField = useCallback(
        (field, value) => {
            if (!schema[field]) return;
            for (const rule of schema[field]) {
                const error = rule(value);
                if (error) {
                    setErrors((prev) => ({ ...prev, [field]: error }));
                    return;
                }
            }
            setErrors((prev) => ({ ...prev, [field]: null }));
        },
        [schema]
    );

    // Clear a single field's error (use on field focus or when user starts typing)
    const clearError = useCallback((field) => {
        setErrors((prev) => ({ ...prev, [field]: null }));
    }, []);

    // Reset all errors
    const clearAllErrors = useCallback(() => setErrors({}), []);

    return { errors, validate, validateField, clearError, clearAllErrors };
};

export default useFormValidation;
