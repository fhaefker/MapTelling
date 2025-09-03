/**
 * MapTelling - Main Application Class
 * Interactive storytelling map application
 */
class MapTelling {
    constructor(config) {
        this.config = config;
        this.map = null;
        this.scroller = null;
        this.isStoryMode = true;
        this.layerManager = null;
        this.storyManager = null;
        this.controlManager = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            this.showLoading();
            await this.initializeMap();
            this.initializeManagers();
            this.setupEventListeners();
            this.hideLoading();
        } catch (error) {
            console.error('Failed to initialize MapTelling:', error);
            this.showError('Failed to load the application. Please refresh the page.');
        }
    }

    /**
     * Initialize the Mapbox map
     */
    async initializeMap() {
        mapboxgl.accessToken = this.config.accessToken;
        
        this.map = new mapboxgl.Map({
            container: 'map',
            style: this.config.style,
            center: [0, 0],
            zoom: 2
        });

        return new Promise((resolve) => {
            this.map.on('load', () => {
                this.setupInitialMapState();
                this.setup3DTerrain();
                resolve();
            });
        });
    }

    /**
     * Initialize manager classes
     */
    initializeManagers() {
        this.layerManager = new LayerManager(this.map);
        this.storyManager = new StoryManager(this.config, this.layerManager);
        this.controlManager = new ControlManager(this.map, this);
        
        // Create story content and initialize scrolling
        this.storyManager.createStoryContent();
        this.storyManager.initializeScrolling(this);
    }

    /**
     * Setup initial map state
     */
    setupInitialMapState() {
        // Disable free navigation initially (story mode)
        this.map.scrollZoom.disable();
        this.map.dragPan.disable();
        this.map.keyboard.disable();
        this.map.doubleClickZoom.disable();
        this.map.touchZoomRotate.disable();
    }

    /**
     * Setup 3D terrain if enabled
     */
    setup3DTerrain() {
        if (this.config.use3dTerrain) {
            this.map.addSource('mapbox-dem', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.terrain-dem-v1',
                'tileSize': 512,
                'maxzoom': 14
            });
            this.map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
        }
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        window.addEventListener('resize', () => {
            if (this.storyManager.scroller) {
                this.storyManager.scroller.resize();
            }
        });

        // Error handling
        window.addEventListener('error', (event) => {
            console.error('Application error:', event.error);
        });
    }

    /**
     * Toggle between story mode and free navigation mode
     */
    toggleMode() {
        this.isStoryMode = !this.isStoryMode;
        
        if (this.isStoryMode) {
            this.enableStoryMode();
        } else {
            this.enableFreeNavigation();
        }
        
        this.controlManager.updateToggleButton(this.isStoryMode);
    }

    /**
     * Enable story mode
     */
    enableStoryMode() {
        this.map.scrollZoom.disable();
        this.map.dragPan.disable();
        this.map.keyboard.disable();
        this.map.doubleClickZoom.disable();
        this.map.touchZoomRotate.disable();
        
        if (this.storyManager.scroller) {
            this.storyManager.scroller.enable();
        }
    }

    /**
     * Enable free navigation mode
     */
    enableFreeNavigation() {
        this.map.scrollZoom.enable();
        this.map.dragPan.enable();
        this.map.keyboard.enable();
        this.map.doubleClickZoom.enable();
        this.map.touchZoomRotate.enable();
        
        if (this.storyManager.scroller) {
            this.storyManager.scroller.disable();
        }
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'block';
            loadingElement.classList.remove('fade-out');
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.classList.add('fade-out');
            setTimeout(() => {
                loadingElement.style.display = 'none';
            }, 500);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.innerHTML = `<div style="color: red;">Error: ${message}</div>`;
        }
    }

    /**
     * Get current mode
     */
    getMode() {
        return this.isStoryMode ? 'story' : 'free';
    }
}
