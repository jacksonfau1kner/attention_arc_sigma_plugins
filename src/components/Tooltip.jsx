import React from 'react';

function TooltipText({ info }) {
  const { coordinates, tooltips } = info
  return (
    <>
      <div className="tooltipPoint">
        {Array.isArray(coordinates) && coordinates.length >= 2
          ? `Lat: ${coordinates[1]}, Long: ${coordinates[0]}`
          : 'No coordinates'}
      </div>
      {
        tooltips && Array.isArray(tooltips) ? tooltips.map(({ key, value }) => (
          <div key={key} className="tooltipDetails">{`${key}: ${value}`}</div>  
        )) : null
      }
    </>
  )
}

export function renderTooltip(info) {
  if (!info) return null;
  const { object, x, y, coordinate } = info;

  // Always use the DeckGL event's coordinate for the tooltip
  const tooltipCoordinates = coordinate && Array.isArray(coordinate) && coordinate.length === 2 ? coordinate : null;

  if (info.objects) {
    return (
      <div className="tooltip interactive" style={{position: 'fixed', left: x, top: y}}>
        {info.objects.map((obj, index) => (
          <TooltipText key={index} info={{...obj, coordinates: tooltipCoordinates}} />
        ))}
      </div>
    );
  }

  if (!object) {
    return null;
  }

  return object.cluster ? (
    <div className="tooltip" style={{position: 'fixed', left: x, top: y}}>
      {object.point_count} records
      <br />
      (click to see details)
    </div>
  ) : (
    <div className="tooltip" style={{position: 'fixed', left: x, top: y}}>
      <TooltipText info={{...object, coordinates: tooltipCoordinates}} />
    </div>
  );
}