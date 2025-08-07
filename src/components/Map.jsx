import React from 'react';
import { StaticMap } from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import { MapView } from '@deck.gl/core';
import { GeoJsonLayer } from '@deck.gl/layers';

import ZoomIn from '../assets/add.svg?react';
import ZoomOut from '../assets/negative.svg?react';
import Center from '../assets/reticle.svg?react';
import dmaGeoJson from './dmamap/nielsengeo.json';

const MAP_VIEW = new MapView({ repeat: true });
const INITIAL_VIEW_STATE = {
  latitude: 40.2,
  longitude: -95.8,
  zoom: 3.40,
  minZoom: 0,
  maxZoom: 20,
  pitch: 0,
  bearing: 0
};
const ZOOM_STEP = 0.5;

const MAPBOX_TOKEN =
  'pk.eyJ1IjoiamZyYW50eSIsImEiOiJjam91bzF2YWUxZTFzM3FydnBncWs3dnoyIn0.cXRBg3Vcetu9d-gjstnGig';

// Utility to interpolate between two hex colors
function interpolateColor(hex1, hex2, t) {
  // Convert hex to rgb
  const h2r = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const rgb1 = h2r(hex1);
  const rgb2 = h2r(hex2);
  return [
    Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * t),
    Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * t),
    Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * t)
  ];
}

// Get diverging color bins: white -> endColor
function getColorBins(bins = 50, startColor = '#ffffff', endColor = '#d4f9d0') {
  return Array.from({ length: bins }, (_, i) =>
    interpolateColor(startColor, endColor, i / (bins - 1))
  );
}

function Map(props) {
  const { sigmaData, config, selectedKpi, colorRange, kpiLabel, uidType } = props;
  const [viewState, setViewState] = React.useState({ ...INITIAL_VIEW_STATE });
  const [hoverInfo, setHoverInfo] = React.useState(null);
  const [contextMenuInfo, setContextMenuInfo] = React.useState(null);
  const [hoveredDmaId, setHoveredDmaId] = React.useState(null);

  React.useEffect(() => {
    if (sigmaData && Array.isArray(sigmaData) && sigmaData.length > 0) {
      console.log('MAPBOX_TOKEN:', MAPBOX_TOKEN);
    }
  }, [sigmaData]);

  // Debug: Log key props and computed values
  console.log('Map debug:', { sigmaData, selectedKpi });

  // Build DMA value map from Sigma data, using row.numeric_value
  const dmaValueMap = React.useMemo(() => {
    const map = {};
    if (Array.isArray(sigmaData)) {
      sigmaData.forEach(row => {
        if (row.uid != null && row.numeric_value != null) {
          map[row.uid] = row.numeric_value;
        }
      });
    }
    return map;
  }, [sigmaData]);

  console.log('dmaValueMap:', dmaValueMap);

  // Heat map layer using Sigma data
  const dmaLayer = React.useMemo(() => {
    const values = Object.values(dmaValueMap);
    if (!values.length) return null;
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    // Use more color bins for smoother gradation
    const COLOR_BINS = getColorBins(50, colorRange?.startColor || '#ffffff', colorRange?.endColor || '#d4f9d0');
    function getColorForValue(value, min, max) {
      const bin = Math.floor(((value - min) / (max - min + 1e-9)) * COLOR_BINS.length);
      return COLOR_BINS[Math.min(bin, COLOR_BINS.length - 1)];
    }
    return new GeoJsonLayer({
      id: 'dma-polygons-' + selectedKpi,
      data: dmaGeoJson,
      pickable: true,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 1,
      getFillColor: f => {
        const dmaUid = f.properties && f.properties[uidType] != null ? f.properties[uidType] : f[uidType];
        const value = dmaValueMap[dmaUid];
        if (value == null) return [200, 200, 200, 40];
        // Highlight fill color on hover (slightly brighter)
        const color = getColorForValue(value, minVal, maxVal);
        if (dmaUid === hoveredDmaId) {
          return [
            Math.min(color[0] + 40, 255),
            Math.min(color[1] + 40, 255),
            Math.min(color[2] + 40, 255),
            180
          ];
        }
        return [...color, 120]; // higher alpha for all
      },
      getLineColor: f => {
        const dmaUid = f.properties && f.properties[uidType] != null ? f.properties[uidType] : f[uidType];
        // Make hovered border black but more transparent
        if (dmaUid === hoveredDmaId) {
          return [200, 200, 200, 50]; // white, more transparent
        }
        return [210, 210, 210, 120]; // white, fully opaque
      },
    });
  }, [dmaGeoJson, dmaValueMap, colorRange, selectedKpi, hoveredDmaId, uidType]);

  const hideTooltip = () => {
    setHoverInfo(null);
    setContextMenuInfo(null);
    setHoveredDmaId(null);
  };

  const handleClick = (info, event) => {
    // Only handle clicks on DMA polygons
    if (info && info.object && info.object.type === 'Feature' && info.layer && info.layer.id.startsWith('dma-polygons')) {
      // Get DMA uid
      const dmaUid = info.object.properties && info.object.properties[uidType] != null ? info.object.properties[uidType] : info.object[uidType];
      const value = dmaValueMap[dmaUid];
      setHoverInfo({
        x: info.x,
        y: info.y,
        dmaUid,
        value
      });
      setContextMenuInfo(null);
    } else {
      setContextMenuInfo(null);
      setHoverInfo(null);
    }
  };

  // Add onHover handler for DeckGL
  const handleHover = info => {
    if (info && info.object && info.object.type === 'Feature' && info.layer && info.layer.id.startsWith('dma-polygons')) {
      const dmaUid = info.object.properties && info.object.properties[uidType] != null ? info.object.properties[uidType] : info.object[uidType];
      setHoveredDmaId(dmaUid);
      // Optionally, update tooltip position live here if you want
    } else {
      setHoveredDmaId(null);
    }
  };

  const adjustZoom = (delta) => {
    setViewState(viewState => {
      return {
        ...viewState,
        zoom: Math.max(
          viewState.minZoom,
          Math.min(viewState.maxZoom, viewState.zoom + delta),
        ),
      }
    });
  }

  return (
    <div onContextMenu={e => {
      e.preventDefault();
      e.stopPropagation();
    }}>
      <DeckGL
        layers={dmaLayer ? [dmaLayer] : []}
        views={MAP_VIEW}
        viewState={viewState}
        controller={{ dragRotate: false }}
        onViewStateChange={({ viewState }) => {
          setViewState(viewState);
          hideTooltip();
        }}
        onClick={handleClick}
        onHover={handleHover}
      >
        <StaticMap
          key={MAPBOX_TOKEN}
          reuseMaps
          mapboxApiAccessToken={MAPBOX_TOKEN}
          preventStyleDiffing
        />
        {/* Only show tooltip for DMA polygons */}
        {hoverInfo && (
          <div className="tooltip" style={{ position: 'fixed', left: hoverInfo.x, top: hoverInfo.y }}>
            <div>{uidType === 'dma_id' ? 'DMA ID' : 'DMA Name'}: {hoverInfo.dmaUid}</div>
            <div>{kpiLabel || 'KPI'}: {hoverInfo.value}</div>
          </div>
        )}
      </DeckGL>
      {/* icons */}
      <section className="iconsSection">
        <div className="icons">
          <button title="Center data" onClick={() => setViewState({ ...INITIAL_VIEW_STATE })}>
            <Center />
          </button>
        </div>
        <div className="icons" style={{ marginTop: '8px' }}>
          <button title="Zoom in" onClick={() => adjustZoom(ZOOM_STEP)}>
            <ZoomIn />
          </button>
          <div className="divider"></div>
          <button title="Zoom out" onClick={() => adjustZoom(-1 * ZOOM_STEP)}>
            <ZoomOut />
          </button>
        </div>
      </section>
    </div>
  );
}

export default Map;
