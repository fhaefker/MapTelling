/**
 * ControlManager - Handles map controls and UI interactions
 */
class ControlManager {
    constructor(map, app) {
        this.map = map;
        this.app = app;
        this.controls = {};
        
        this.initializeControls();
    }

    /**
     * Initialize all map controls
     */
    initializeControls() {
        this.addNavigationControl();
        this.addModeToggleControl();
    }

    /**
     * Add standard navigation control
     */
    addNavigationControl() {
        const nav = new mapboxgl.NavigationControl();
        this.map.addControl(nav, 'top-left');
        this.controls.navigation = nav;
    }

    /**
     * Add mode toggle control
     */
    addModeToggleControl() {
        const modeToggle = new ModeToggleControl(this.app);
        this.map.addControl(modeToggle, 'top-left');
        this.controls.modeToggle = modeToggle;
    }

    /**
     * Update toggle button text and state
     * @param {boolean} isStoryMode - Current mode state
     */
    updateToggleButton(isStoryMode) {
        const button = document.getElementById('toggleControlButton');
        if (button) {
            if (isStoryMode) {
                button.innerText = 'Free Navigation';
                button.title = 'Switch to free map navigation';
                button.setAttribute('aria-label', 'Switch to free navigation mode');
            } else {
                button.innerText = 'Story Mode';
                button.title = 'Switch to automatic story navigation';
                button.setAttribute('aria-label', 'Switch to story mode');
            }
        }
    }

    /**
     * Remove all controls
     */
    removeAllControls() {
        Object.values(this.controls).forEach(control => {
            try {
                this.map.removeControl(control);
            } catch (error) {
                console.warn('Error removing control:', error);
            }
        });
        this.controls = {};
    }

    /**
     * Get control by name
     * @param {string} name - Control name
     * @returns {Object|null} Control instance or null
     */
    getControl(name) {
        return this.controls[name] || null;
    }
}

/**
 * Custom Mode Toggle Control
 */
class ModeToggleControl {
    constructor(app) {
        this.app = app;
        this.container = null;
        this.button = null;
    }

    /**
     * Called when control is added to map
     * @param {Object} map - Mapbox map instance
     * @returns {HTMLElement} Control container
     */
    onAdd(map) {
        this.map = map;
        this.container = document.createElement('div');
        this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
        
        this.button = document.createElement('button');
        this.button.id = 'toggleControlButton';
        this.button.innerText = 'Free Navigation';
        this.button.title = 'Switch to free map navigation';
        this.button.setAttribute('aria-label', 'Switch to free navigation mode');
        this.button.type = 'button';
        
        // Add click event listener
        this.button.addEventListener('click', () => {
            this.handleToggle();
        });
        
        // Add keyboard support
        this.button.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.handleToggle();
            }
        });
        
        this.container.appendChild(this.button);
        return this.container;
    }

    /**
     * Called when control is removed from map
     */
    onRemove() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.map = undefined;
        this.container = null;
        this.button = null;
    }

    /**
     * Handle toggle button click
     */
    handleToggle() {
        try {
            this.app.toggleMode();
            
            // Add visual feedback
            this.button.classList.add('clicked');
            setTimeout(() => {
                if (this.button) {
                    this.button.classList.remove('clicked');
                }
            }, 150);
            
        } catch (error) {
            console.error('Error toggling mode:', error);
        }
    }

    /**
     * Update button state
     * @param {boolean} isStoryMode - Current mode state
     */
    updateState(isStoryMode) {
        if (!this.button) return;
        
        if (isStoryMode) {
            this.button.innerText = 'Free Navigation';
            this.button.title = 'Switch to free map navigation';
            this.button.setAttribute('aria-label', 'Switch to free navigation mode');
        } else {
            this.button.innerText = 'Story Mode';
            this.button.title = 'Switch to automatic story navigation';
            this.button.setAttribute('aria-label', 'Switch to story mode');
        }
    }

    /**
     * Disable the control
     */
    disable() {
        if (this.button) {
            this.button.disabled = true;
            this.button.setAttribute('aria-disabled', 'true');
        }
    }

    /**
     * Enable the control
     */
    enable() {
        if (this.button) {
            this.button.disabled = false;
            this.button.setAttribute('aria-disabled', 'false');
        }
    }
}
