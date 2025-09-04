// Basic translation catalog for initial i18n scaffold (Step 7)
export type Locale = 'de' | 'en';

type Catalog = Record<string, Record<string, string>>;

export const translations: Catalog = {
  de: {
    'nav.groupLabel': 'Kapitel Navigation',
    'nav.tablistLabel': 'Kapitel Auswahl',
    'nav.previous': 'Vorheriges Kapitel',
    'nav.next': 'Nächstes Kapitel',
    'nav.play': 'Abspielen',
    'nav.pause': 'Pause',
    'mode.story': 'Story Modus',
    'mode.free': 'Freie Navigation',
    'mode.story.aria': 'Zu Story Modus wechseln',
    'mode.free.aria': 'Zu freier Navigation wechseln',
    'terrain.enable': 'Terrain aktivieren',
    'terrain.disable': 'Terrain deaktivieren',
    'skip.toContent': 'Zum Inhalt springen',
    'chapter.position': 'Kapitel {current} von {total}',
  },
  en: {
    'nav.groupLabel': 'Chapter Navigation',
    'nav.tablistLabel': 'Chapter Selection',
    'nav.previous': 'Previous Chapter',
    'nav.next': 'Next Chapter',
    'nav.play': 'Play',
    'nav.pause': 'Pause',
    'mode.story': 'Story Mode',
    'mode.free': 'Free Navigation',
    'mode.story.aria': 'Switch to story mode',
    'mode.free.aria': 'Switch to free navigation mode',
    'terrain.enable': 'Enable Terrain',
    'terrain.disable': 'Disable Terrain',
    'skip.toContent': 'Skip to content',
    'chapter.position': 'Chapter {current} of {total}',
  }
};

export const fallbackLocale: Locale = 'de';
