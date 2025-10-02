# MapTelling V2 - Konzept Teil 6: Design System & URL Sharing
## Floating Cards Design + Hybrid Sharing Strategy

**Version:** 2.0 | **Datum:** 2. Oktober 2025 | **Status:** Ready for Implementation

---

## 🎯 Anforderungen

### Design (6.1)
- **Desktop:** Floating Cards (transparent über Karte)
- **Mobile:** Fullscreen Story
- **Responsive:** Breakpoints bei 768px und 1024px

### Sharing (S.1)
- **Strategie:** Hybrid (Deep-Links + JSON Export)
- **Zielgruppe:** Freunde/Familie
- **Privacy:** NIEMALS Bilder auf fremden Servern
- **Priorität:** Einfachheit

---

## 📐 Design System

### 1. Responsive Layout Components

```tsx
// src/components/viewer/layouts/ResponsiveStoryLayout.tsx (neu)

interface ResponsiveStoryLayoutProps {
  photos: PhotoFeature[];
  activeIndex: number;
  onPhotoSelect: (index: number) => void;
  map: ReactNode; // Map Component
}

export const ResponsiveStoryLayout: React.FC<ResponsiveStoryLayoutProps> = ({
  photos,
  activeIndex,
  onPhotoSelect,
  map
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // <768px
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg')); // 768-1024px
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg')); // >1024px
  
  if (isMobile) {
    return (
      <MobileLayout
        photos={photos}
        activeIndex={activeIndex}
        onPhotoSelect={onPhotoSelect}
        map={map}
      />
    );
  }
  
  if (isTablet) {
    return (
      <TabletLayout
        photos={photos}
        activeIndex={activeIndex}
        onPhotoSelect={onPhotoSelect}
        map={map}
      />
    );
  }
  
  return (
    <DesktopLayout
      photos={photos}
      activeIndex={activeIndex}
      onPhotoSelect={onPhotoSelect}
      map={map}
    />
  );
};
```

---

### 2. Desktop Layout: Floating Cards

```tsx
// src/components/viewer/layouts/DesktopLayout.tsx (neu)

export const DesktopLayout: React.FC<LayoutProps> = ({
  photos,
  activeIndex,
  onPhotoSelect,
  map
}) => {
  const activePhoto = photos[activeIndex];
  
  return (
    <Box sx={{ position: 'relative', height: '100vh' }}>
      {/* Map (Full Screen Background) */}
      {map}
      
      {/* Floating Card (Center-Right) */}
      <Box
        sx={{
          position: 'absolute',
          right: 32,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 400,
          maxHeight: '80vh',
          zIndex: 1000,
          pointerEvents: 'none' // Map bleibt interaktiv
        }}
      >
        <Card
          elevation={8}
          sx={{
            pointerEvents: 'auto',
            backdropFilter: 'blur(20px)',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 3,
            overflow: 'hidden'
          }}
        >
          {/* Photo */}
          <Box
            sx={{
              width: '100%',
              height: 300,
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <img
              src={activePhoto.properties.imageUrl}
              alt={activePhoto.properties.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            
            {/* Photo Counter Overlay */}
            <Chip
              label={`${activeIndex + 1} / ${photos.length}`}
              size="small"
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                color: 'white'
              }}
            />
          </Box>
          
          {/* Content */}
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              {activePhoto.properties.title}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {activePhoto.properties.timestamp}
            </Typography>
            
            <Typography variant="body1" paragraph>
              {activePhoto.properties.description}
            </Typography>
            
            {/* Camera Info */}
            {activePhoto.properties.camera && (
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  📷 {activePhoto.properties.camera.make} {activePhoto.properties.camera.model}
                </Typography>
              </Box>
            )}
          </CardContent>
          
          {/* Navigation */}
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
            <IconButton
              onClick={() => onPhotoSelect(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
            >
              <ArrowBackIcon />
            </IconButton>
            
            <IconButton
              onClick={() => onPhotoSelect(Math.min(photos.length - 1, activeIndex + 1))}
              disabled={activeIndex === photos.length - 1}
            >
              <ArrowForwardIcon />
            </IconButton>
          </Box>
        </Card>
        
        {/* Thumbnail Carousel (Below Card) */}
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': {
              height: 6
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 3
            }
          }}
        >
          {photos.map((photo, idx) => (
            <Box
              key={photo.properties.id}
              onClick={() => onPhotoSelect(idx)}
              sx={{
                width: 80,
                height: 60,
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                border: idx === activeIndex ? 3 : 2,
                borderColor: idx === activeIndex ? 'primary.main' : 'transparent',
                opacity: idx === activeIndex ? 1 : 0.6,
                transition: 'all 0.2s',
                '&:hover': {
                  opacity: 1,
                  transform: 'scale(1.05)'
                }
              }}
            >
              <img
                src={photo.properties.thumbnailUrl}
                alt={photo.properties.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
```

---

### 3. Mobile Layout: Fullscreen Story

```tsx
// src/components/viewer/layouts/MobileLayout.tsx (neu)

export const MobileLayout: React.FC<LayoutProps> = ({
  photos,
  activeIndex,
  onPhotoSelect,
  map
}) => {
  const [showMap, setShowMap] = useState(false);
  const activePhoto = photos[activeIndex];
  
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Map Thumbnail (Expandable) */}
      <Box
        onClick={() => setShowMap(true)}
        sx={{
          height: showMap ? '100vh' : 120,
          transition: 'height 0.3s',
          position: 'relative',
          cursor: 'pointer'
        }}
      >
        {map}
        
        {!showMap && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: 2
            }}
          >
            <Typography variant="caption">
              Tippe um Karte zu öffnen ↑
            </Typography>
          </Box>
        )}
        
        {showMap && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setShowMap(false);
            }}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              bgcolor: 'white'
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      
      {/* Photo Content (Scrollable) */}
      {!showMap && (
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            bgcolor: 'background.paper'
          }}
        >
          {/* Photo */}
          <Box sx={{ width: '100%', aspectRatio: '4/3' }}>
            <img
              src={activePhoto.properties.imageUrl}
              alt={activePhoto.properties.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </Box>
          
          {/* Content */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              {activePhoto.properties.title}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {activePhoto.properties.timestamp}
            </Typography>
            
            <Typography variant="body1">
              {activePhoto.properties.description}
            </Typography>
          </Box>
          
          {/* Navigation (Bottom Fixed) */}
          <AppBar
            position="fixed"
            sx={{
              top: 'auto',
              bottom: 0,
              bgcolor: 'background.paper',
              color: 'text.primary'
            }}
          >
            <Toolbar>
              <IconButton
                onClick={() => onPhotoSelect(Math.max(0, activeIndex - 1))}
                disabled={activeIndex === 0}
              >
                <ArrowBackIcon />
              </IconButton>
              
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography variant="caption">
                  {activeIndex + 1} / {photos.length}
                </Typography>
              </Box>
              
              <IconButton
                onClick={() => onPhotoSelect(Math.min(photos.length - 1, activeIndex + 1))}
                disabled={activeIndex === photos.length - 1}
              >
                <ArrowForwardIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
        </Box>
      )}
    </Box>
  );
};
```

---

## 🔗 URL Sharing System

### 1. Deep-Link Strategy (Phase 1)

```typescript
// src/utils/sharing.ts (neu)

interface ShareOptions {
  type: 'photo' | 'story';
  photoIndex?: number;
  storyMetadata?: StoryMetadata;
}

export const generateShareUrl = (options: ShareOptions): string => {
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  
  if (options.type === 'photo' && options.photoIndex !== undefined) {
    // Deep-Link zu einzelnem Foto
    params.set('photo', options.photoIndex.toString());
  }
  
  if (options.type === 'story' && options.storyMetadata) {
    // Story-Metadaten (kein Bild-Upload!)
    const metadata = {
      title: options.storyMetadata.title,
      photoCount: options.storyMetadata.photoCount,
      bbox: options.storyMetadata.bbox
    };
    
    params.set('story', btoa(JSON.stringify(metadata)));
  }
  
  return `${baseUrl}?${params.toString()}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
};
```

---

### 2. Share Button Component

```tsx
// src/components/viewer/ShareButton.tsx (neu)

interface ShareButtonProps {
  photos: PhotoFeature[];
  activeIndex: number;
  story: PhotoStory;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  photos,
  activeIndex,
  story
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleSharePhoto = async () => {
    const url = generateShareUrl({
      type: 'photo',
      photoIndex: activeIndex
    });
    
    const success = await copyToClipboard(url);
    if (success) {
      toast.success('Link kopiert! 📋');
    }
    
    setAnchorEl(null);
  };
  
  const handleDownloadJSON = () => {
    const json = JSON.stringify(story, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.metadata.title || 'story'}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    toast.success('Story exportiert! 💾');
    
    setAnchorEl(null);
  };
  
  const handleGenerateQR = async () => {
    const url = generateShareUrl({
      type: 'photo',
      photoIndex: activeIndex
    });
    
    // QR-Code Generator (z.B. via qrcode.react)
    // Opens Modal with QR Code
    
    setAnchorEl(null);
  };
  
  return (
    <>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ bgcolor: 'background.paper' }}
      >
        <ShareIcon />
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={handleSharePhoto}>
          <ListItemIcon>
            <LinkIcon />
          </ListItemIcon>
          <ListItemText>Link zu diesem Foto</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleDownloadJSON}>
          <ListItemIcon>
            <DownloadIcon />
          </ListItemIcon>
          <ListItemText>Story als JSON exportieren</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleGenerateQR}>
          <ListItemIcon>
            <QrCodeIcon />
          </ListItemIcon>
          <ListItemText>QR-Code generieren</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem disabled>
          <ListItemText secondary="Bilder werden NICHT hochgeladen (Privacy by Design)" />
        </MenuItem>
      </Menu>
    </>
  );
};
```

---

### 3. QR Code Generator

```tsx
// src/components/shared/QRCodeModal.tsx (neu)

import QRCode from 'qrcode.react';

interface QRCodeModalProps {
  url: string;
  open: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  url,
  open,
  onClose
}) => {
  const handleDownloadQR = () => {
    const canvas = document.getElementById('qr-code') as HTMLCanvasElement;
    const image = canvas.toDataURL('image/png');
    
    const a = document.createElement('a');
    a.href = image;
    a.download = 'maptelling-qr.png';
    a.click();
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        QR-Code zum Teilen
      </DialogTitle>
      
      <DialogContent sx={{ textAlign: 'center' }}>
        <QRCode
          id="qr-code"
          value={url}
          size={256}
          level="H"
          includeMargin
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Scanne diesen Code mit deinem Smartphone
        </Typography>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleDownloadQR} startIcon={<DownloadIcon />}>
          Als Bild speichern
        </Button>
        <Button onClick={onClose}>
          Schließen
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

---

## ✅ Implementation Roadmap

### Phase 1: Design System (8-10h)
- Responsive Breakpoints & Hooks
- Desktop Layout (Floating Cards)
- Mobile Layout (Fullscreen)
- Tablet Layout (Hybrid)

### Phase 2: URL Sharing (4-6h)
- Deep-Link Generator
- Share Button UI
- Clipboard API Integration
- URL Parameter Parser

### Phase 3: QR Code (2-3h)
- QR Code Generator
- Download Funktion
- Modal UI

### Phase 4: Testing & Polish (3-4h)
- Responsive Tests (Cypress)
- Share Flow E2E
- Mobile Testing

**Gesamtaufwand:** ~17-23 Stunden

---

## 📖 User Documentation

### Sharing Guide

**Story teilen:**
1. Klicke auf Share-Button (oben rechts)
2. Wähle "Link zu diesem Foto"
3. Link wird in Zwischenablage kopiert
4. An Freunde senden!

**Wichtig:** Nur Position-Daten werden geteilt, KEINE Bilder (Privacy by Design).

**QR-Code erstellen:**
1. Share → "QR-Code generieren"
2. Code erscheint
3. Speichern oder direkt scannen

---

**Status:** ✅ Ready for Implementation  
**Complete:** Alle 6 Konzeptteile fertig! 🎉
