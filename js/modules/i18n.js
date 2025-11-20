/**
 * Internationalization (i18n) Module
 * Provides multi-language support for the Aboard application
 * 
 * Supported Languages:
 * - zh-CN: Chinese (Simplified)
 * - en-US: English (United States)
 * - ja-JP: Japanese
 * - ko-KR: Korean
 * - fr-FR: French
 * - de-DE: German
 * - es-ES: Spanish
 */

class I18n {
    constructor() {
        this.currentLocale = 'zh-CN'; // Default language
        this.translations = {};
        this.fallbackLocale = 'zh-CN';
        
        // Available languages
        this.availableLocales = {
            'zh-CN': '中文简体',
            'en-US': 'English',
            'ja-JP': '日本語',
            'ko-KR': '한국어',
            'fr-FR': 'Français',
            'de-DE': 'Deutsch',
            'es-ES': 'Español'
        };
    }

    /**
     * Initialize i18n system
     */
    async init() {
        // Load saved language preference or detect browser language
        this.currentLocale = this.getSavedLocale() || this.detectBrowserLocale();
        
        // Load translation files
        await this.loadTranslations();
        
        // Apply translations to the page
        this.applyTranslations();
        
        // Update HTML lang attribute
        document.documentElement.lang = this.currentLocale;
    }

    /**
     * Get saved locale from localStorage
     */
    getSavedLocale() {
        return localStorage.getItem('locale');
    }

    /**
     * Save locale to localStorage
     */
    saveLocale(locale) {
        localStorage.setItem('locale', locale);
    }

    /**
     * Detect browser language
     */
    detectBrowserLocale() {
        const browserLang = navigator.language || navigator.userLanguage;
        
        // Check if we support the exact locale
        if (this.availableLocales[browserLang]) {
            return browserLang;
        }
        
        // Check if we support the language family (e.g., 'en' for 'en-GB')
        const langFamily = browserLang.split('-')[0];
        const matchingLocale = Object.keys(this.availableLocales).find(
            locale => locale.startsWith(langFamily)
        );
        
        return matchingLocale || this.fallbackLocale;
    }

    /**
     * Load translation files
     */
    async loadTranslations() {
        try {
            const response = await fetch(`js/locales/${this.currentLocale}.js`);
            if (!response.ok) {
                console.warn(`Failed to load ${this.currentLocale}, falling back to ${this.fallbackLocale}`);
                this.currentLocale = this.fallbackLocale;
                const fallbackResponse = await fetch(`js/locales/${this.fallbackLocale}.js`);
                const fallbackText = await fallbackResponse.text();
                eval(fallbackText);
            } else {
                const text = await response.text();
                eval(text);
            }
            
            // Translations are now in window.translations
            this.translations = window.translations || {};
        } catch (error) {
            console.error('Error loading translations:', error);
            this.translations = {};
        }
    }

    /**
     * Get translation for a key
     */
    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations;
        
        for (const k of keys) {
            value = value[k];
            if (value === undefined) {
                console.warn(`Translation missing for key: ${key}`);
                return key;
            }
        }
        
        // Replace parameters in translation
        if (typeof value === 'string') {
            return value.replace(/\{(\w+)\}/g, (match, param) => {
                return params[param] !== undefined ? params[param] : match;
            });
        }
        
        return value;
    }

    /**
     * Apply translations to all elements with data-i18n attribute
     */
    applyTranslations() {
        // Translate elements with data-i18n attribute for text content
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (translation !== key) {
                // Update element content based on element type
                if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit')) {
                    el.value = translation;
                } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    // For input elements, only update placeholder if specified
                    const placeholderKey = el.getAttribute('data-i18n-placeholder');
                    if (placeholderKey) {
                        el.placeholder = this.t(placeholderKey);
                    }
                } else {
                    // For regular elements, update text content
                    // Only update if element has no children with data-i18n attribute
                    if (!el.querySelector('[data-i18n]')) {
                        el.textContent = translation;
                    }
                }
            }
        });
        
        // Translate title attributes
        const titleElements = document.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const translation = this.t(key);
            if (translation !== key) {
                el.title = translation;
            }
        });
        
        // Update document title
        const titleKey = document.documentElement.getAttribute('data-i18n-title');
        if (titleKey) {
            document.title = this.t(titleKey);
        } else {
            // Default title translation
            document.title = this.t('app.title');
        }
        
        // Auto-translate common elements based on their ID or class
        this.autoTranslateElements();
    }
    
    /**
     * Auto-translate elements based on common patterns
     * This reduces the need to manually add data-i18n to every element
     */
    autoTranslateElements() {
        // Translate toolbar buttons
        const toolbarMappings = {
            'undo-btn': { span: 'toolbar.undo', title: 'toolbar.undo' },
            'redo-btn': { span: 'toolbar.redo', title: 'toolbar.redo' },
            'pen-btn': { span: 'toolbar.pen', title: 'toolbar.pen' },
            'pan-btn': { span: 'toolbar.move', title: 'toolbar.move' },
            'eraser-btn': { span: 'toolbar.eraser', title: 'toolbar.eraser' },
            'clear-btn': { span: 'toolbar.clear', title: 'toolbar.clear' },
            'background-btn': { span: 'toolbar.background', title: 'toolbar.background' },
            'more-btn': { span: 'toolbar.more', title: 'toolbar.more' },
            'settings-btn': { span: 'toolbar.settings', title: 'toolbar.settings' },
            'export-btn-top': { title: 'toolbar.export' },
            'zoom-out-btn': { title: 'toolbar.zoomOut' },
            'zoom-in-btn': { title: 'toolbar.zoomIn' },
            'fullscreen-btn': { title: 'toolbar.fullscreen' }
        };
        
        Object.entries(toolbarMappings).forEach(([id, mapping]) => {
            const el = document.getElementById(id);
            if (el) {
                if (mapping.span) {
                    const span = el.querySelector('span');
                    if (span) {
                        span.textContent = this.t(mapping.span);
                    }
                }
                if (mapping.title) {
                    el.title = this.t(mapping.title);
                }
            }
        });
        
        // Translate zoom input placeholder
        const zoomInput = document.getElementById('zoom-input');
        if (zoomInput) {
            zoomInput.title = this.t('toolbar.zoomPlaceholder');
        }
        
        // Translate configuration panel labels
        this.translateConfigPanels();
        
        // Translate settings modal
        this.translateSettingsModal();
        
        // Translate modals
        this.translateModals();
    }
    
    translateConfigPanels() {
        // Pen configuration
        const penTypeButtons = {
            'normal': 'tools.pen.normal',
            'pencil': 'tools.pen.pencil',
            'ballpoint': 'tools.pen.ballpoint',
            'fountain': 'tools.pen.fountain',
            'brush': 'tools.pen.brush'
        };
        
        document.querySelectorAll('.pen-type-btn').forEach(btn => {
            const penType = btn.getAttribute('data-pen-type');
            if (penType && penTypeButtons[penType]) {
                btn.textContent = this.t(penTypeButtons[penType]);
            }
        });
        
        // Eraser shape buttons
        const eraserShapes = {
            'circle': 'tools.eraser.shapeCircle',
            'rectangle': 'tools.eraser.shapeRectangle'
        };
        
        document.querySelectorAll('.eraser-shape-btn').forEach(btn => {
            const shape = btn.getAttribute('data-eraser-shape');
            if (shape) {
                btn.textContent = shape === 'circle' ? this.t('tools.eraser.shapeCircle') || '圆形' : this.t('tools.eraser.shapeRectangle') || '方形';
            }
        });
        
        // Background patterns
        const patterns = {
            'blank': 'background.blank',
            'dots': 'background.dots',
            'grid': 'background.grid',
            'tianzige': 'background.tianzige',
            'english-lines': 'background.english4line',
            'music-staff': 'background.musicStaff',
            'coordinate': 'background.coordinate'
        };
        
        document.querySelectorAll('.pattern-option-btn').forEach(btn => {
            const pattern = btn.getAttribute('data-pattern');
            if (pattern && patterns[pattern]) {
                btn.textContent = this.t(patterns[pattern]);
            }
        });
    }
    
    translateSettingsModal() {
        // Settings tab labels
        const tabs = document.querySelectorAll('.settings-tab-icon span');
        const tabNames = ['general', 'display', 'canvas', 'background', 'about', 'announcement', 'more'];
        
        tabs.forEach((span, index) => {
            if (tabNames[index]) {
                // Use the translated tab name
                const key = `settings.tabs.${tabNames[index]}`;
                const translation = this.t(key);
                if (translation !== key) {
                    span.textContent = translation;
                }
            }
        });
    }
    
    translateModals() {
        // Clear confirmation modal
        const confirmTitle = document.querySelector('#confirm-modal h2');
        if (confirmTitle) {
            confirmTitle.textContent = this.t('tools.clear.confirm');
        }
        
        const confirmMessage = document.querySelector('#confirm-modal .confirm-message');
        if (confirmMessage) {
            confirmMessage.textContent = this.t('tools.clear.message');
        }
        
        const confirmOk = document.getElementById('confirm-ok-btn');
        if (confirmOk) {
            confirmOk.textContent = this.t('common.confirm');
        }
        
        const confirmCancel = document.getElementById('confirm-cancel-btn');
        if (confirmCancel) {
            confirmCancel.textContent = this.t('common.cancel');
        }
    }

    /**
     * Change language
     */
    async changeLocale(newLocale) {
        if (!this.availableLocales[newLocale]) {
            console.error(`Locale ${newLocale} not supported`);
            return;
        }
        
        this.currentLocale = newLocale;
        this.saveLocale(newLocale);
        
        // Reload translations
        await this.loadTranslations();
        
        // Reapply translations
        this.applyTranslations();
        
        // Update HTML lang attribute
        document.documentElement.lang = newLocale;
        
        // Dispatch event for other modules to react to language change
        window.dispatchEvent(new CustomEvent('localeChanged', { detail: { locale: newLocale } }));
    }

    /**
     * Get current locale
     */
    getCurrentLocale() {
        return this.currentLocale;
    }

    /**
     * Get available locales
     */
    getAvailableLocales() {
        return this.availableLocales;
    }
}

// Create global i18n instance
window.i18n = new I18n();
