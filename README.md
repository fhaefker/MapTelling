# MapTelling

An interactive storytelling map application showcasing the Cape Wrath Trail hiking experience in Scotland.

🌐 **Live Demo:** https://fhaefker.github.io/MapTelling/

## 🚀 Features

- **Interactive Storytelling**: Scroll-based narrative with automatic map navigation
- **Dual Navigation Modes**: Toggle between story mode and free exploration
- **3D Terrain**: Enhanced map visualization with elevation data
- **Responsive Design**: Optimized for desktop and mobile devices
- **Modern Architecture**: Modular, maintainable codebase

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Mapping**: Mapbox GL JS v3.7.0
- **Scrolling**: Scrollama v3.2.0
- **Data Visualization**: D3.js v7
- **Architecture**: Object-oriented, modular design

## 📁 Project Structure

```
MapTelling/
├── index.html              # Main HTML file
├── README.md               # Project documentation
├── assets/                 # Media assets
│   ├── *.jpg              # Story images
│   └── *.geojson          # GPS track data
└── src/
    ├── config.js          # Application configuration
    ├── css/
    │   └── styles.css     # Application styles
    └── js/
        ├── MapTelling.js      # Main application class
        ├── LayerManager.js    # Map layer management
        ├── StoryManager.js    # Story content & scrolling
        ├── ControlManager.js  # UI controls
        └── Utils.js           # Utility functions
```

## 🔧 Configuration

Edit `src/config.js` to customize:

- **Map Settings**: Style, access token, initial view
- **Story Content**: Chapters, titles, descriptions, images
- **Feature Flags**: 3D terrain, inset map, themes

## 🎨 Customization

### Adding New Chapters

```javascript
{
    id: 'unique-chapter-id',
    alignment: 'left|center|right|full',
    title: 'Chapter Title',
    image: './assets/image.jpg',
    description: 'Chapter description...',
    location: {
        center: [longitude, latitude],
        zoom: 12,
        pitch: 0,
        bearing: 0
    },
    onChapterEnter: [],
    onChapterExit: []
}
```

### Styling

Modify CSS variables in `src/css/styles.css`:

```css
:root {
    --primary-color: #3FB1CE;
    --background-overlay: rgba(255, 255, 255, 0.95);
    --border-radius: 8px;
    --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

## 🚀 Development

### Local Development

1. Clone the repository
2. Serve files using a local web server (required for CORS)
3. Open `index.html` in your browser

### Building

No build process required - pure client-side application.

## 📱 Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔗 Dependencies

- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) - Interactive maps
- [Scrollama](https://github.com/russellgoldenberg/scrollama) - Scroll-driven storytelling
- [D3.js](https://d3js.org/) - Data visualization utilities

## 🏞️ About the Story

This application tells the story of a 17-day hiking adventure on the Cape Wrath Trail in Scotland, covering 433km with 11,857m of elevation gain. The trail is known for its challenging terrain, particularly the infamous mud sections.

**Photos by Frederik Häfker**

## 📄 License

Based on [Mapbox Storytelling Template](https://github.com/mapbox/storytelling)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🐛 Issues

Report bugs and feature requests on the [GitHub Issues](https://github.com/fhaefker/MapTelling/issues) page.
