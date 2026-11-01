// Decorative ambient layer only; does not intercept links or clicks.
// Place <PhiFieldLivingOverlay /> inside a position:relative hero container.
import React from 'react';
import './phi-field-living-overlay.css';

const SPARKS = [
  [7,20,0],[18,74,3],[26,12,1],[34,65,4],[46,28,5],[53,81,2],
  [64,11,7],[72,52,4],[83,20,2],[91,77,6],[44,42,8],[77,89,1],
];

export default function PhiFieldLivingOverlay() {
  return (
    <div className="phi-living" aria-hidden="true">
      <div className="phi-living__aurora" />
      <div className="phi-living__haze" />
      <div className="phi-living__halo" />
      {SPARKS.map(([x,y,delay], i) => (
        <span key={i} className="phi-living__spark"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `-${delay}s` }} />
      ))}
    </div>
  );
}
