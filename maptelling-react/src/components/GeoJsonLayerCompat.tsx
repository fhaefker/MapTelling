import React from 'react';
import { MlGeoJsonLayer } from '@mapcomponents/react-maplibre';
import warnDeprecated from '../utils/deprecation';

// Minimal prop typing passthrough (avoid full upstream type dependency)
// We only care about deprecated 'paint' and 'layout'.
interface GeoJsonLayerCompatProps extends Record<string, any> {
  paint?: Record<string, any>; // deprecated
  layout?: Record<string, any>; // deprecated
  options?: any;
}

/**
 * GeoJsonLayerCompat
 * Wraps `MlGeoJsonLayer` and migrates deprecated top-level `paint` / `layout` props
 * into the modern `options.paint` / `options.layout` shape, emitting one-time warnings.
 */
export const GeoJsonLayerCompat: React.FC<GeoJsonLayerCompatProps> = (props) => {
  const { paint, layout, options, ...rest } = props;
  let finalOptions = options || {};
  if (paint) {
    warnDeprecated({ feature: 'MlGeoJsonLayer.paint', message: 'Use options={{ paint: { ... } }} instead.' });
    finalOptions = { ...finalOptions, paint: { ...(finalOptions?.paint || {}), ...paint } };
  }
  if (layout) {
    warnDeprecated({ feature: 'MlGeoJsonLayer.layout', message: 'Use options={{ layout: { ... } }} instead.' });
    finalOptions = { ...finalOptions, layout: { ...(finalOptions?.layout || {}), ...layout } };
  }
  return <MlGeoJsonLayer {...rest} options={finalOptions} />;
};

export default GeoJsonLayerCompat;
