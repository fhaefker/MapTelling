/**
 * StoryManager - Handles story content and scrolling
 */
class StoryManager {
    constructor(config, layerManager) {
        this.config = config;
        this.layerManager = layerManager;
        this.scroller = null;
        this.alignments = {
            'left': 'lefty',
            'center': 'centered',
            'right': 'righty',
            'full': 'fully'
        };
    }

    /**
     * Create story content from configuration
     */
    createStoryContent() {
        const storyDiv = document.getElementById('story');
        if (!storyDiv) {
            console.error('Story container not found');
            return;
        }

        // Clear existing content
        storyDiv.innerHTML = '';
        
        // Add header
        this.createHeader(storyDiv);
        
        // Add chapters
        this.createChapters(storyDiv);
        
        // Add footer
        this.createFooter(storyDiv);
    }

    /**
     * Create story header
     * @param {HTMLElement} container - Container element
     */
    createHeader(container) {
        const header = document.createElement('div');
        header.className = 'story-header';
        header.innerHTML = `
            <h1>${this.config.title}</h1>
            <h2>${this.config.subtitle}</h2>
            <p style="font-style: italic; margin: 0;">${this.config.byline}</p>
        `;
        container.appendChild(header);
    }

    /**
     * Create story chapters
     * @param {HTMLElement} container - Container element
     */
    createChapters(container) {
        if (!this.config.chapters || !Array.isArray(this.config.chapters)) {
            console.warn('No chapters found in configuration');
            return;
        }

        this.config.chapters.forEach((chapter, index) => {
            const chapterElement = this.createChapterElement(chapter, index);
            container.appendChild(chapterElement);
        });
    }

    /**
     * Create a single chapter element
     * @param {Object} chapter - Chapter configuration
     * @param {number} index - Chapter index
     * @returns {HTMLElement} Chapter element
     */
    createChapterElement(chapter, index) {
        const chapterDiv = document.createElement('div');
        chapterDiv.className = `step ${this.alignments[chapter.alignment] || 'centered'}`;
        chapterDiv.id = chapter.id;
        chapterDiv.setAttribute('data-chapter-index', index);
        
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = this.createChapterContent(chapter);
        
        chapterDiv.appendChild(contentDiv);
        return chapterDiv;
    }

    /**
     * Create chapter content HTML
     * @param {Object} chapter - Chapter configuration
     * @returns {string} HTML content
     */
    createChapterContent(chapter) {
        const imageHtml = chapter.image 
            ? `<img src="${chapter.image}" alt="${this.escapeHtml(chapter.title)}" loading="lazy">` 
            : '';
        
        return `
            <h3>${this.escapeHtml(chapter.title)}</h3>
            ${imageHtml}
            <p>${this.escapeHtml(chapter.description)}</p>
        `;
    }

    /**
     * Create story footer
     * @param {HTMLElement} container - Container element
     */
    createFooter(container) {
        const footer = document.createElement('div');
        footer.className = 'story-footer';
        footer.innerHTML = this.config.footer;
        container.appendChild(footer);
    }

    /**
     * Initialize scrolling functionality
     * @param {MapTelling} app - Main application instance
     */
    initializeScrolling(app) {
        try {
            this.scroller = scrollama();
            
            this.scroller
                .setup({
                    step: '.step',
                    offset: 0.5,
                    debug: false
                })
                .onStepEnter(response => {
                    this.handleStepEnter(response, app);
                })
                .onStepExit(response => {
                    this.handleStepExit(response, app);
                });

        } catch (error) {
            console.error('Failed to initialize scrolling:', error);
        }
    }

    /**
     * Handle step enter event
     * @param {Object} response - Scrollama response object
     * @param {MapTelling} app - Main application instance
     */
    handleStepEnter(response, app) {
        if (!app.isStoryMode) return;

        const chapter = this.findChapterById(response.element.id);
        if (!chapter) {
            console.warn(`Chapter not found: ${response.element.id}`);
            return;
        }

        try {
            // Fly to chapter location
            app.map.flyTo(chapter.location);
            
            // Handle chapter enter events
            this.layerManager.processChapterEnterEvents(chapter.onChapterEnter);
            
            // Mark chapter as active
            this.markChapterAsActive(response.element);
            
        } catch (error) {
            console.error('Error handling step enter:', error);
        }
    }

    /**
     * Handle step exit event
     * @param {Object} response - Scrollama response object
     * @param {MapTelling} app - Main application instance
     */
    handleStepExit(response, app) {
        if (!app.isStoryMode) return;

        const chapter = this.findChapterById(response.element.id);
        if (!chapter) return;

        try {
            // Handle chapter exit events
            this.layerManager.processChapterExitEvents(chapter.onChapterExit);
            
            // Remove active marking
            this.markChapterAsInactive(response.element);
            
        } catch (error) {
            console.error('Error handling step exit:', error);
        }
    }

    /**
     * Find chapter by ID
     * @param {string} chapterId - Chapter ID
     * @returns {Object|null} Chapter configuration or null
     */
    findChapterById(chapterId) {
        return this.config.chapters.find(chapter => chapter.id === chapterId) || null;
    }

    /**
     * Mark chapter as active
     * @param {HTMLElement} element - Chapter element
     */
    markChapterAsActive(element) {
        // Remove active class from all chapters
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Add active class to current chapter
        element.classList.add('active');
    }

    /**
     * Mark chapter as inactive
     * @param {HTMLElement} element - Chapter element
     */
    markChapterAsInactive(element) {
        element.classList.remove('active');
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get chapter count
     * @returns {number} Number of chapters
     */
    getChapterCount() {
        return this.config.chapters ? this.config.chapters.length : 0;
    }

    /**
     * Get chapter by index
     * @param {number} index - Chapter index
     * @returns {Object|null} Chapter configuration or null
     */
    getChapterByIndex(index) {
        if (!this.config.chapters || index < 0 || index >= this.config.chapters.length) {
            return null;
        }
        return this.config.chapters[index];
    }

    /**
     * Navigate to specific chapter
     * @param {number} chapterIndex - Chapter index
     * @param {MapTelling} app - Main application instance
     */
    navigateToChapter(chapterIndex, app) {
        const chapter = this.getChapterByIndex(chapterIndex);
        if (!chapter) {
            console.warn(`Chapter at index ${chapterIndex} not found`);
            return;
        }

        try {
            app.map.flyTo(chapter.location);
            
            // Scroll to chapter element
            const chapterElement = document.getElementById(chapter.id);
            if (chapterElement) {
                chapterElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        } catch (error) {
            console.error('Error navigating to chapter:', error);
        }
    }
}
