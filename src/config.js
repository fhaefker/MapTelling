var config = {
    style: 'mapbox://styles/mapbox/streets-v12',
    accessToken: 'pk.eyJ1IjoiZmhhZWZrZXIiLCJhIjoiY20ybjBtemFwMDB4djJsc2JpNXh0cXMycSJ9.11NVQ-o4GigSiiAtBYlsgg',
    showMarkers: true,
    markerColor: '#3FB1CE',
    inset: true,
    theme: 'light',
    use3dTerrain: true, // 3D-Terrain aktivieren
    auto: false,
    title: 'Cape Wrath Trail: 17 days hiking in Scotland',
    subtitle: 'a story of mud, rain, sun and quite an adventure',
    byline: 'by Frederik Häfker',
    footer: 'Source: source citations, etc. <br> Created using <a href="https://github.com/mapbox/storytelling" target="_blank">Mapbox Storytelling</a> template.',
    chapters: [
        {
            id: 'Day00_Overview',
            alignment: 'left',
            hidden: false,
            title: 'Cape Wrath Overview',
            image: './assets/day00.jpg',
            description: '17 Tage, Distanz: 433km, Aufstieg: 11.857m',
            location: {
                center: [-5.38018, 57.53349],
                zoom: 5,
                pitch: 0,
                bearing: 0
            },
            mapAnimation: 'flyTo',
            rotateAnimation: false,
            callback: '',
            onChapterEnter: [],
            onChapterExit: []
        },
        {
            id: 'Day01_FortWilliam',
            alignment: 'right',
            hidden: false,
            title: 'The Start in Fort William',
            image: './assets/day01.jpg',
            description: 'The first steps on 18.10.2024 around 10am. This one shows the unofficial start (after approximately 12 km from the ferry).',
            location: {
                center: [-5.18589, 56.80544],
                zoom: 10.8,
                pitch: 0,
                bearing: 0,
            },
            mapAnimation: 'flyTo',
            rotateAnimation: false,
            callback: '',
            onChapterEnter: [{"layer": "marker-layer",}],
            onChapterExit: [{"layer": "marker-layer"}],
            marker: {"coordinates": [-5.26066, 56.77998]}
        },
        {
            id: 'Day02-b_theMud',
            alignment: 'center',
            hidden: false,
            title: 'the cape wrath trail is a story of mud',
            image: './assets/day02_b.jpg',
            description: 'To show what I literally mean by "up to my knees in mud" (not just a figure of speech). Additional fact: my backpack weighs around 24kg at this time',
            location: {
                center: [-5.37895, 56.95760],
                zoom: 10,
                pitch: 0,
                bearing: 0,
            },
            mapAnimation: 'flyTo',
            rotateAnimation: false,
            callback: '',
            onChapterEnter: [{"layer": "marker-layer", "opacity": 1}],
            onChapterExit: [{"layer": "marker-layer", "opacity": 0}],
            marker: {"coordinates": [-5.36124, 56.94596]}
        },
        {
            id: 'Day02_goldenGrass',
            alignment: 'right',
            hidden: false,
            title: 'A field of golden grass',
            image: './assets/day02.jpg',
            description: 'This is a photo from day two, approximately 50 km after leaving Fort William. Day two had many wonderful moments (for example, the Hogwarts Steam Train on the aqueduct). It was difficult to select only one picture. But reaching this place, a field of gold, and camping alongside the river was simply too incredible not to share.',
            location: {
                center: [-5.35729, 56.96189],
                zoom: 12,
                pitch: 0,
                bearing: 0,
            },
            mapAnimation: 'flyTo',
            rotateAnimation: false,
            callback: '',
            onChapterEnter: [],
            onChapterExit: []
        },
        {
            id: 'Day03_InverieBay',
            alignment: 'full',
            hidden: false,
            title: 'The sunset over Inverie Bay',
            image: './assets/day03.jpg',
            description: 'On the third day, I left the classic Cape Wrath Trail and made a beeline for Inverie. It was the hardest day, especially down at Loch Nevis western part: I was knee-deep in mud. Later on, it was a common situation. However, my body was not yet fully accustomed to walking all day and fighting the mud. But in the end, the camping place I found was worth it all.',
            location: {
                center: [-5.63052, 57.02287],
                zoom: 12,
                pitch: 0,
                bearing: 0,
            },
            mapAnimation: 'flyTo',
            rotateAnimation: false,
            callback: '',
            onChapterEnter: [],
            onChapterExit: []
        }
    ]
};
