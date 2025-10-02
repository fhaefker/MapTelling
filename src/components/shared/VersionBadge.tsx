/**
 * VersionBadge Component
 * 
 * Zeigt die aktuelle Version der App (aus package.json).
 * Sichtbar in allen Views zur Debugging-Unterstützung.
 * 
 * ✅ WhereGroup Principles:
 * - Transparency: Klare Versionsinformation
 * - Maintainability: Auto-sync mit package.json
 * 
 * @module components/shared/VersionBadge
 */

import { Box, Typography } from '@mui/material';
import packageJson from '../../../package.json';

export interface VersionBadgeProps {
  /** Position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Optional zusätzlicher Text (z.B. "Editor", "Viewer") */
  label?: string;
}

/**
 * VersionBadge - Zeigt App-Version
 * 
 * Features:
 * - Version aus package.json
 * - Konfigurierbare Position
 * - Optional mit Label (z.B. "Editor v2.1.0")
 * - Semi-transparent Hintergrund
 * - High z-index (über allen anderen Elementen)
 * 
 * @example
 * <VersionBadge position="bottom-right" label="Editor" />
 */
export const VersionBadge: React.FC<VersionBadgeProps> = ({
  position = 'bottom-right',
  label
}) => {
  // Position Styles
  const positionStyles = {
    'top-left': { top: 8, left: 8 },
    'top-right': { top: 8, right: 8 },
    'bottom-left': { bottom: 8, left: 8 },
    'bottom-right': { bottom: 8, right: 8 }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 9999,
        bgcolor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        px: 1.5,
        py: 0.5,
        borderRadius: 1,
        fontSize: '0.75rem',
        fontFamily: 'monospace',
        pointerEvents: 'none',
        userSelect: 'none'
      }}
    >
      <Typography variant="caption" component="span" sx={{ fontFamily: 'inherit' }}>
        {label ? `${label} ` : ''}v{packageJson.version}
      </Typography>
    </Box>
  );
};
