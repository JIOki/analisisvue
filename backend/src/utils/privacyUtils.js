/**
 * Utility functions for privacy and data sanitization
 * Handles removal of personally identifiable information (PII) from text
 */

/**
 * Sanitizes text by removing or masking personally identifiable information
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized text with PII removed or masked
 */
export const sanitizeText = (text) => {
    if (!text || typeof text !== 'string') {
        return '';
    }

    let sanitized = text;

    // Remove email addresses
    sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');

    // Remove phone numbers (various formats)
    sanitized = sanitized.replace(/(\+\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?(\d{3}[-.\s]?\d{4})/g, '[PHONE_REDACTED]');

    // Remove SSN-like patterns
    sanitized = sanitized.replace(/\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, '[SSN_REDACTED]');

    // Remove credit card numbers (basic pattern)
    sanitized = sanitized.replace(/\b(?:\d{4}[-.\s]?){3}\d{4}\b/g, '[CREDIT_CARD_REDACTED]');

    // Remove IPv4 addresses
    sanitized = sanitized.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP_REDACTED]');

    // Remove dates of birth patterns
    sanitized = sanitized.replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g, '[DATE_REDACTED]');

    // Remove Mexican CURP patterns
    sanitized = sanitized.replace(/\b[A-Z]{4}\d{6}[A-Z]{6}[A-Z0-9]\b/gi, '[CURP_REDACTED]');

    // Remove Mexican RFC patterns
    sanitized = sanitized.replace(/\b[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}\b/gi, '[RFC_REDACTED]');

    // Remove passport numbers
    sanitized = sanitized.replace(/\b[A-Z]{1,2}\d{6,9}\b/g, '[PASSPORT_REDACTED]');

    // Remove potential names (simple heuristic - capitalized words following common patterns)
    // This is conservative to avoid over-sanitization
    sanitized = sanitized.replace(/\b(Mr\.|Mrs\.|Ms\.|Dr\.|Ing\.|Lic\.)?\s*([A-ZÁÉÍÓÚ][a-záéíóú]+)\s+([A-ZÁÉÍÓÚ][a-záéíóú]+)\b/g, '[NAME_REDACTED]');

    // Remove addresses (basic patterns)
    sanitized = sanitized.replace(/\b\d{1,5}\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]+\s+){1,4}(Calle|Avenida|Av\.|Boulevard|Blvd\.|Colonia|Fraccionamiento|Residencial|Delegacion|Municipio)\b/gi, '[ADDRESS_REDACTED]');

    // Remove ZIP codes
    sanitized = sanitized.replace(/\b\d{5}(-\d{4})?\b/g, '[ZIP_REDACTED]');

    // Remove bank account numbers
    sanitized = sanitized.replace(/\b\d{10,18}\b/g, '[ACCOUNT_REDACTED]');

    // Remove Clabe interbancaria (Mexico)
    sanitized = sanitized.replace(/\b\d{18}\b/g, '[CLABE_REDACTED]');

    return sanitized.trim();
};

/**
 * Checks if text potentially contains sensitive information
 * @param {string} text - The text to check
 * @returns {object} - Object with sensitive type flags
 */
export const checkForSensitiveInfo = (text) => {
    if (!text || typeof text !== 'string') {
        return { hasSensitiveInfo: false };
    }

    const findings = {
        hasEmail: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text),
        hasPhone: /(\+\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?(\d{3}[-.\s]?\d{4})/.test(text),
        hasSSN: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/.test(text),
        hasCreditCard: /\b(?:\d{4}[-.\s]?){3}\d{4}\b/.test(text),
        hasIPAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(text),
        hasCURP: /[A-Z]{4}\d{6}[A-Z]{6}[A-Z0-9]/i.test(text),
        hasRFC: /[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}/i.test(text),
        hasPassport: /[A-Z]{1,2}\d{6,9}/.test(text)
    };

    findings.hasSensitiveInfo = Object.values(findings).some(val => val);

    return findings;
};

/**
 * Masks sensitive information with placeholders
 * @param {string} text - The text containing sensitive info
 * @param {string} maskChar - Character to use for masking (default: '*')
 * @returns {string} - Text with sensitive info masked
 */
export const maskSensitiveInfo = (text, maskChar = '*') => {
    if (!text || typeof text !== 'string') {
        return '';
    }

    let masked = text;

    // Mask email (show first 2 chars and domain)
    masked = masked.replace(/([a-zA-Z0-9._%+-]{2})([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
        (match, p1, p2, p3) => {
            return `${p1}${'*'.repeat(5)}@${p3}`;
        });

    // Mask phone (show last 4 digits)
    masked = masked.replace(/(\+\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?(\d{3}[-.\s]?\d{4})/g,
        (match) => {
            const digits = match.replace(/\D/g, '');
            if (digits.length >= 4) {
                return '*'.repeat(match.length - 4) + digits.slice(-4);
            }
            return '*'.repeat(match.length);
        });

    return masked;
};

export default {
    sanitizeText,
    checkForSensitiveInfo,
    maskSensitiveInfo
};
