import * as React from 'react';
import {
  client,
  useConfig,
  useElementData,
} from "@sigmacomputing/plugin";

import './App.css';
import Map from './components/Map';
import Header from './components/Header';
// import AttentionArcLogo from './assets/ATTENTION_ARC_LOGO.svg';

// Initialize the editor panel inside of the sigma editor
// This allows the user to select columns via native sigma tools to populate graph. 
// Think of it like Sigma is serving the backend for the graph based on the user's selection. 
client.config.configureEditorPanel([
  { name: "source", type: "element" },
  { name: "dma_id", type: "column", source: "source", allowMultiple: false, allowedTypes: ['number', 'integer', 'string']},
  { name: "dma_name", type: "column", source: "source", allowMultiple: false, allowedTypes: ['number', 'integer', 'text'] },
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
      return JSON.parse('"' + value.replace(/"/g, '\"') + '"');
    } catch {
      return value;
    }
  }
  const kpiLabelFromUrl = getUrlParam('kpiLabel');

  const config = useConfig();
  const sigmaData = useElementData(config.source);

  // Debug: Show user's public IP
  const [userIp, setUserIp] = React.useState(null);
  React.useEffect(() => {
    fetch('https://api64.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setUserIp(data.ip))
      .catch(() => setUserIp('Error fetching IP'));
  }, []);

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

  // Build array of KPI display names for the carousel
  const kpiLabels = [kpiLabelFromUrl || 'KPI'];

  // Compute current KPI color range for the header
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

  const [showSigmaData, setShowSigmaData] = React.useState(false);

  React.useEffect(() => {
    if (sigmaData) setShowSigmaData(true);
  }, [sigmaData]);

  return (
    <div className="App" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {showSigmaData && sigmaData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, maxWidth: '80vw', maxHeight: '80vh', overflow: 'auto' }}>
            <button style={{ float: 'right', fontSize: 18 }} onClick={() => setShowSigmaData(false)}>Close</button>
            <h3>Raw Sigma Data</h3>
            <pre style={{ fontSize: 12, maxHeight: '70vh', overflow: 'auto' }}>{JSON.stringify(sigmaData, null, 2)}</pre>
          </div>
        </div>
      )}
      <Header index={0} setIndex={() => {}} count={1} kpiLabels={kpiLabels} startColor={headerStartColor} endColor={headerEndColor} minValue={minValue} maxValue={maxValue} />
      <div style={{ flex: 1, minHeight: 0, padding: 0, overflow: 'auto', width: '100%' }}>
        {!numericKpiKey && (
          <div style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>[No Numeric KPI Available]</div>
        )}
        {numericKpiKey && (
          <div className="map-container">
            <div className="map-container-label">{kpiLabelFromUrl || 'KPI'}</div>
            <div className="map-container-map">
              <Map
                sigmaData={mapSigmaData}
                config={config}
                selectedKpi={numericKpiKey}
                colorRange={{ startColor: headerStartColor, endColor: headerEndColor }}
                kpiLabel={kpiLabelFromUrl || 'KPI'}
                uidType={uidType}
              />
            </div>
            {/* Color gradient key */}
            <div style={{ margin: '16px 0 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 240, height: 18, background: `linear-gradient(90deg, ${headerStartColor} 0%, ${headerEndColor} 100%)`, borderRadius: 6, border: '1px solid #eee' }} />
              <div style={{ width: 240, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginTop: 2 }}>
                <span>Min</span>
                <span>Max</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;