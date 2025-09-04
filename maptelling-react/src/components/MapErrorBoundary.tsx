import React from 'react';

interface MapErrorBoundaryState { hasError: boolean; error?: Error; }

export class MapErrorBoundary extends React.Component<React.PropsWithChildren, MapErrorBoundaryState> {
  state: MapErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(error: Error): MapErrorBoundaryState { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: any) {
    // eslint-disable-next-line no-console
    console.error('[MapErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{position:'absolute',top:0,left:0,right:0,padding:16,background:'#ffefef',color:'#900',zIndex:9999,fontFamily:'sans-serif'}} role="alert" aria-live="assertive">
          <strong>Ein Fehler ist aufgetreten.</strong> Bitte neu laden. {this.state.error?.message}
        </div>
      );
    }
    return this.props.children;
  }
}

export default MapErrorBoundary;
