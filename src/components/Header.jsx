import React from 'react';

export default function Header({ index, setIndex, count, kpiLabels = [], startColor = '#d4f9d0', endColor = '#27e7b8', minValue, maxValue }) {
  const handleKpiChange = (event) => {
    setIndex(parseInt(event.target.value, 10));
  };

  return (
    <header className="header">
      {/* Left: Title and KPI Selector */}
      <div className="header-left">
        <h1 className="header-title">DMA Heatmap</h1>
        <div className="header-kpi-selector">
          <select 
            value={index}
            onChange={handleKpiChange}
            className="header-select"
            disabled={count <= 1}
          >
            {kpiLabels.map((label, idx) => (
              <option key={idx} value={idx}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Right: Gradient Bar */}
      <div className="header-gradient-bar">
        {minValue !== undefined && (
          <span className="header-min">{minValue}</span>
        )}
        <div
          className="header-gradient"
          style={{ background: `linear-gradient(90deg, ${startColor} 0%, ${endColor} 100%)` }}
        />
        {maxValue !== undefined && (
          <span className="header-max">{maxValue}</span>
        )}
      </div>
    </header>
  );
}
