import * as React from 'react';
import {
  client,
  useConfig,
  useElementData,
} from "@sigmacomputing/plugin";

import './App.css';
import Map from './components/Map';

// Initialize the editor panel inside of the sigma editor
// This allows the user to select columns via native sigma tools to populate graph. 
// Think of it like Sigma is serving the backend for the graph based on the user's selection. 
client.config.configureEditorPanel([
  { name: "source", type: "element" },
  { name: "dma_id", type: "column", source: "source", allowMultiple: false, allowedTypes: ['number', 'integer', 'string']},
  { name: "dma_name", type: "column", source: "source", allowMultiple: false, allowedTypes: ['text'] },
  { name: "kpi", type: "column", source: "source", allowMultiple: false, allowedTypes: ['number', 'integer'] },
]);

// This is the main app component that renders the map and traffics data to the map from the sigma data.
function App() {
  // Helper to get URL param
  function getUrlParam(name) {
    const value = new URLSearchParams(window.location.search).get(name);
    if (value == null) return value;
    if (value.startsWith('{') || value.startsWith('[') || value.startsWith('"')) {
      try {
        return JSON.parse(value);
      } catch {
        // fallback to raw value
      }
    }
    try {
      return JSON.parse('"' + value.replace(/"/g, '\\"') + '"');
    } catch {
      return value;
    }
  }
  const kpiLabelFromUrl = getUrlParam('kpiLabel');

  const config = useConfig();
  const sigmaData = useElementData(config.source);

  // Always use the last column in sigmaData as the numeric KPI column
  const sigmaKeys = Object.keys(sigmaData || {});
  const numericKpiKey = sigmaKeys.length > 0 ? sigmaKeys[sigmaKeys.length - 1] : null;

  // Detect which UID column is present in the data
  const dmaIdCol = config.dma_id;
  const dmaNameCol = config.dma_name;
  const dmaIdArray = dmaIdCol && sigmaData && sigmaData[dmaIdCol];
  const dmaNameArray = dmaNameCol && sigmaData && sigmaData[dmaNameCol];
  const hasDmaId = dmaIdArray && dmaIdArray.some(v => v != null);
  const hasDmaName = dmaNameArray && dmaNameArray.some(v => v != null);
  const uidType = hasDmaId ? 'dma_id' : hasDmaName ? 'dma_name' : null;
  const uidCol = config[uidType];

  // Compute current KPI color range for the legend
  let headerStartColor = '#d4f9d0';
  let headerEndColor = '#27e7b8';
  let minValue = undefined;
  let maxValue = undefined;
  if (numericKpiKey && sigmaData && sigmaData[numericKpiKey]) {
    const values = sigmaData[numericKpiKey].filter(v => v != null && !isNaN(v));
    if (values.length > 0) {
      minValue = Math.min(...values);
      maxValue = Math.max(...values);
    }
  }

  // Error state for missing config/data
  let errorMsg = '';
  if (!sigmaData || Object.keys(sigmaData).length === 0) {
    errorMsg = 'No Sigma data received.';
  } else if (!numericKpiKey || !sigmaData[numericKpiKey]) {
    errorMsg = 'No numeric KPI column found in Sigma data.';
  } else if (!config.dma_id && !config.dma_name) {
    errorMsg = 'No DMA ID or DMA Name column selected. Please re-select columns in the Sigma plugin configuration panel.';
  }

  // Build sigmaData array for the map: [{ uid, numeric_value }]
  const mapSigmaData = React.useMemo(() => {
    if (!uidCol || !sigmaData?.[uidCol]) return [];
    const arr = [];
    for (let i = 0; i < sigmaData[uidCol].length; i++) {
      const row = { uid: sigmaData[uidCol][i] };
      if (numericKpiKey && sigmaData[numericKpiKey]) {
        row['numeric_value'] = sigmaData[numericKpiKey][i];
      }
      arr.push(row);
    }
    return arr;
  }, [uidCol, sigmaData, numericKpiKey]);

  // Helper to get display name from Sigma column key
  const getDisplayName = (colKey) => {
    if (colKey === 'dma') return 'DMA';
    const colName = config[colKey];
    if (!colName) return colKey;
    if (colName.includes('/')) {
      const parts = colName.split('/');
      return parts[parts.length - 1];
    }
    return 'Calculated Field';
  };

  return (
    <div className="App" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, padding: 0, overflow: 'auto', width: '100%' }}>
        {!numericKpiKey && (
          <div style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>[No Numeric KPI Available]</div>
        )}
        {numericKpiKey && (
          <div className="map-container">
            <div className="map-container-map">
              <Map
                sigmaData={mapSigmaData}
                config={config}
                selectedKpi={numericKpiKey}
                colorRange={{ startColor: headerStartColor, endColor: headerEndColor }}
                kpiLabel={kpiLabelFromUrl || 'KPI'}
                uidType={uidType}
              />
              {/* Right-side vertical legend overlay */}
              <div className="legend-panel legend-vertical">
                <span className="legend-max">{maxValue !== undefined ? maxValue : ''}</span>
                <div
                  className="legend-gradient-vertical"
                  style={{ background: `linear-gradient(180deg, ${headerEndColor} 0%, ${headerStartColor} 100%)` }}
                />
                <span className="legend-min">{minValue !== undefined ? minValue : ''}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;