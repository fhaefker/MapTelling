import { Component, ReactNode, ErrorInfo } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { WHEREGROUP_COLORS } from '../../lib/constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary Component
 * 
 * Global error handling for React component errors.
 * 
 * ✅ WhereGroup Principles:
 * - User-friendly error messages
 * - Configuration over Code
 * 
 * ✅ Accessibility:
 * - ARIA role="alert"
 * - Clear error messaging
 * - Reload option
 * 
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            bgcolor: '#f5f5f5'
          }}
          role="alert"
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              textAlign: 'center'
            }}
          >
            <ErrorOutlineIcon 
              sx={{ fontSize: 64, color: 'error.main', mb: 2 }} 
            />
            <Typography variant="h5" gutterBottom sx={{ color: WHEREGROUP_COLORS.blue.primary }}>
              Ein Fehler ist aufgetreten
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {this.state.error?.message || 'Unbekannter Fehler'}
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{
                bgcolor: WHEREGROUP_COLORS.blue.primary,
                '&:hover': {
                  bgcolor: WHEREGROUP_COLORS.blue.light
                }
              }}
            >
              Seite neu laden
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
