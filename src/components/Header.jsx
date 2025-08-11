import React from 'react';

export default function Header({ kpiLabel, startColor = '#d4f9d0', endColor = '#27e7b8', minValue, maxValue }) {
  return (
      <header className="header">
        <div className="header-gradient-bar-integrated">
          {minValue !== undefined && (
            <span className="header-min-integrated">{minValue}</span>
          )}
          <div className="header-gradient-integrated">
            <span className="header-kpi-label-integrated">{kpiLabel}</span>
          </div>
          {maxValue !== undefined && (
            <span className="header-max-integrated">{maxValue}</span>
          )}
        </div>
      </header>
  );
}
