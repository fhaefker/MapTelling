/**
 * LayerManager - Handles map layer operations
 */
class LayerManager {
    constructor(map) {
        this.map = map;
        this.layerTypes = {
            'fill': ['fill-opacity'],
            'line': ['line-opacity'],
            'circle': ['circle-opacity', 'circle-stroke-opacity'],
            'symbol': ['icon-opacity', 'text-opacity'],
            'raster': ['raster-opacity'],
            'fill-extrusion': ['fill-extrusion-opacity'],
            'heatmap': ['heatmap-opacity']
        };
    }

    /**
     * Get paint properties for a layer type
     * @param {string} layerId - The layer ID
     * @returns {Array|null} Array of paint properties or null
     */
    getLayerPaintType(layerId) {
        try {
            const layer = this.map.getLayer(layerId);
            return layer ? this.layerTypes[layer.type] : null;
        } catch (error) {
            console.warn(`Layer ${layerId} not found:`, error);
            return null;
        }
    }

    /**
     * Set opacity for a layer
     * @param {Object} layer - Layer configuration object
     * @param {string} layer.layer - Layer ID
     * @param {number} layer.opacity - Opacity value (0-1)
     */
    setLayerOpacity(layer) {
        if (!layer?.layer) {
            console.warn('Invalid layer configuration:', layer);
            return;
        }
        
        try {
            const paintProps = this.getLayerPaintType(layer.layer);
            if (paintProps) {
                paintProps.forEach(prop => {
                    this.map.setPaintProperty(layer.layer, prop, layer.opacity);
                });
            }
        } catch (error) {
            console.warn(`Error setting layer opacity for ${layer.layer}:`, error);
        }
    }

    /**
     * Process chapter enter events
     * @param {Array} onChapterEnter - Array of layer configurations
     */
    processChapterEnterEvents(onChapterEnter) {
        if (onChapterEnter && onChapterEnter.length > 0) {
            onChapterEnter.forEach(layerConfig => {
                this.setLayerOpacity(layerConfig);
            });
        }
    }

    /**
     * Process chapter exit events
     * @param {Array} onChapterExit - Array of layer configurations
     */
    processChapterExitEvents(onChapterExit) {
        if (onChapterExit && onChapterExit.length > 0) {
            onChapterExit.forEach(layerConfig => {
                this.setLayerOpacity(layerConfig);
            });
        }
    }

    /**
     * Add a data source to the map
     * @param {string} sourceId - Source ID
     * @param {Object} sourceConfig - Source configuration
     */
    addSource(sourceId, sourceConfig) {
        try {
            if (!this.map.getSource(sourceId)) {
                this.map.addSource(sourceId, sourceConfig);
            }
        } catch (error) {
            console.error(`Error adding source ${sourceId}:`, error);
        }
    }

    /**
     * Add a layer to the map
     * @param {Object} layerConfig - Layer configuration
     */
    addLayer(layerConfig) {
        try {
            if (!this.map.getLayer(layerConfig.id)) {
                this.map.addLayer(layerConfig);
            }
        } catch (error) {
            console.error(`Error adding layer ${layerConfig.id}:`, error);
        }
    }

    /**
     * Remove a layer from the map
     * @param {string} layerId - Layer ID to remove
     */
    removeLayer(layerId) {
        try {
            if (this.map.getLayer(layerId)) {
                this.map.removeLayer(layerId);
            }
        } catch (error) {
            console.error(`Error removing layer ${layerId}:`, error);
        }
    }

    /**
     * Check if a layer exists
     * @param {string} layerId - Layer ID to check
     * @returns {boolean} True if layer exists
     */
    layerExists(layerId) {
        try {
            return !!this.map.getLayer(layerId);
        } catch (error) {
            return false;
        }
    }
}
