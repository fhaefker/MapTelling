import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
}

/**
 * LoadingSpinner Component
 * 
 * Reusable loading indicator with optional message.
 * 
 * ✅ MapComponents Theme Integration
 * ✅ Accessibility: aria-label
 * 
 * @param {LoadingSpinnerProps} props - Component props
 * @returns {JSX.Element} Loading spinner with message
 * 
 * @example
 * <LoadingSpinner message="Lädt Story..." />
 */
export const LoadingSpinner = ({ 
  message = 'Lädt...', 
  size = 40 
}: LoadingSpinnerProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        height: '100%',
        width: '100%'
      }}
      role="status"
      aria-label={message}
    >
      <CircularProgress size={size} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};
