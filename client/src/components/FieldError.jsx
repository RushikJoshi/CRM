import React from "react";

/**
 * FieldError - Renders an inline error message under an input field.
 * @param {string} error - The error message to display.
 */
export const FieldError = ({ error }) => {
    if (!error) return null;
    return (
        <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <span role="img" aria-label="warning">⚠</span>
            {error}
        </p>
    );
};

export default FieldError;
