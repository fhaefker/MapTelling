/**
 * ShareButton Component
 * 
 * Button zum Teilen der Story via Deep-Link.
 * 
 * ✅ WhereGroup Principles:
 * - Privacy: Nur URL, keine Bilder auf fremden Servern
 * - Transparency: Klare Copy-to-Clipboard Feedback
 * - Maintainability: Wiederverwendbare Komponente
 * 
 * Features:
 * - Copy URL to Clipboard
 * - Visual Feedback (Snackbar)
 * - Share API Support (Mobile)
 * 
 * @module components/shared/ShareButton
 * @see CONCEPT_V2_06_DESIGN_SHARING.md
 */

import { useState } from 'react';
import { Button, Snackbar, Alert, Tooltip } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useURLParams } from '../../hooks/useURLParams';
import { log } from '../../utils/logger';

// ========================================
// TYPES
// ========================================

export interface ShareButtonProps {
  /** Aktueller Photo Index (optional) */
  photoIndex?: number;
  
  /** Story Titel für Share API */
  title?: string;
  
  /** Button Variante */
  variant?: 'text' | 'outlined' | 'contained';
  
  /** Button Size */
  size?: 'small' | 'medium' | 'large';
  
  /** Full Width? */
  fullWidth?: boolean;
}

// ========================================
// COMPONENT
// ========================================

/**
 * ShareButton Component
 * 
 * Features:
 * - Desktop: Copy URL to Clipboard
 * - Mobile: Native Share API (falls verfügbar)
 * - Feedback: Snackbar mit Success/Error Message
 * 
 * @example
 * <ShareButton 
 *   photoIndex={activeIndex}
 *   title="Meine Story"
 *   variant="contained"
 * />
 */
export const ShareButton: React.FC<ShareButtonProps> = ({
  photoIndex,
  title = 'MapTelling Story',
  variant = 'outlined',
  size = 'medium',
  fullWidth = false
}) => {
  const { getShareURL } = useURLParams();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // Check if Web Share API is available (Mobile)
  const canShare = typeof navigator !== 'undefined' && navigator.share !== undefined;
  
  /**
   * Handle Share
   */
  const handleShare = async () => {
    const shareURL = getShareURL(photoIndex);
    
    log.info('ShareButton', 'Share initiated', {
      shareURL,
      photoIndex,
      canShare
    });
    
    // Mobile: Native Share API
    if (canShare) {
      try {
        await navigator.share({
          title,
          text: `Schau dir diese Story an: ${title}`,
          url: shareURL
        });
        
        log.info('ShareButton', 'Native share successful');
        
        setSnackbarMessage('Story geteilt!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error) {
        // User cancelled or error
        if ((error as Error).name !== 'AbortError') {
          log.error('ShareButton', 'Native share failed', { error });
          
          setSnackbarMessage('Teilen fehlgeschlagen');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      }
      return;
    }
    
    // Desktop: Copy to Clipboard
    try {
      await navigator.clipboard.writeText(shareURL);
      
      log.info('ShareButton', 'URL copied to clipboard', { shareURL });
      
      setSnackbarMessage('Link kopiert!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      log.error('ShareButton', 'Clipboard copy failed', { error });
      
      // Fallback: Manual copy instruction
      setSnackbarMessage('Kopieren fehlgeschlagen. URL: ' + shareURL);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  return (
    <>
      <Tooltip
        title={canShare ? 'Story teilen' : 'Link kopieren'}
        placement="left"
      >
        <Button
          variant={variant}
          size={size}
          fullWidth={fullWidth}
          startIcon={canShare ? <ShareIcon /> : <ContentCopyIcon />}
          onClick={handleShare}
        >
          {canShare ? 'Teilen' : 'Link kopieren'}
        </Button>
      </Tooltip>
      
      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};
