/**
 * Utility functions for MapTelling
 */
class Utils {
    /**
     * Debounce function to limit function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @param {boolean} immediate - Execute immediately
     * @returns {Function} Debounced function
     */
    static debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    /**
     * Throttle function to limit function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Check if an element is in viewport
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} True if element is in viewport
     */
    static isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Get viewport dimensions
     * @returns {Object} Viewport width and height
     */
    static getViewportDimensions() {
        return {
            width: window.innerWidth || document.documentElement.clientWidth,
            height: window.innerHeight || document.documentElement.clientHeight
        };
    }

    /**
     * Check if device is mobile
     * @returns {boolean} True if mobile device
     */
    static isMobile() {
        return window.innerWidth <= 768;
    }

    /**
     * Check if device supports touch
     * @returns {boolean} True if touch is supported
     */
    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    /**
     * Get URL parameters
     * @returns {Object} URL parameters as key-value pairs
     */
    static getURLParameters() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        return params;
    }

    /**
     * Set URL parameter without page reload
     * @param {string} key - Parameter key
     * @param {string} value - Parameter value
     */
    static setURLParameter(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.replaceState({}, '', url);
    }

    /**
     * Validate configuration object
     * @param {Object} config - Configuration to validate
     * @returns {Object} Validation result
     */
    static validateConfig(config) {
        const errors = [];
        const warnings = [];

        // Required fields
        if (!config.accessToken) {
            errors.push('Missing required field: accessToken');
        }
        if (!config.style) {
            errors.push('Missing required field: style');
        }
        if (!config.title) {
            warnings.push('Missing recommended field: title');
        }
        if (!config.chapters || !Array.isArray(config.chapters)) {
            errors.push('Missing or invalid chapters array');
        } else if (config.chapters.length === 0) {
            warnings.push('No chapters defined');
        }

        // Validate chapters
        if (config.chapters) {
            config.chapters.forEach((chapter, index) => {
                if (!chapter.id) {
                    errors.push(`Chapter ${index}: Missing required field 'id'`);
                }
                if (!chapter.location) {
                    errors.push(`Chapter ${index}: Missing required field 'location'`);
                }
                if (chapter.location && !chapter.location.center) {
                    errors.push(`Chapter ${index}: Missing required field 'location.center'`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Load external script dynamically
     * @param {string} src - Script source URL
     * @returns {Promise} Promise that resolves when script is loaded
     */
    static loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Load external CSS dynamically
     * @param {string} href - CSS file URL
     * @returns {Promise} Promise that resolves when CSS is loaded
     */
    static loadCSS(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    /**
     * Format numbers with locale-specific formatting
     * @param {number} number - Number to format
     * @param {Object} options - Formatting options
     * @returns {string} Formatted number
     */
    static formatNumber(number, options = {}) {
        return new Intl.NumberFormat(options.locale || 'en-US', options).format(number);
    }

    /**
     * Calculate distance between two geographic points
     * @param {Array} point1 - [longitude, latitude] of first point
     * @param {Array} point2 - [longitude, latitude] of second point
     * @returns {number} Distance in kilometers
     */
    static calculateDistance(point1, point2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(point2[1] - point1[1]);
        const dLon = this.toRadians(point2[0] - point1[0]);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRadians(point1[1])) * Math.cos(this.toRadians(point2[1])) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees - Degrees to convert
     * @returns {number} Radians
     */
    static toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Create a deep copy of an object
     * @param {Object} obj - Object to copy
     * @returns {Object} Deep copy of the object
     */
    static deepCopy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Log information with timestamp
     * @param {string} message - Message to log
     * @param {string} level - Log level (info, warn, error)
     */
    static log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] MapTelling: ${message}`;
        
        switch (level) {
            case 'warn':
                console.warn(logMessage);
                break;
            case 'error':
                console.error(logMessage);
                break;
            default:
                console.log(logMessage);
        }
    }
}

// Deprecated: legacy Mapbox utility removed. Functionality replaced by React components.
