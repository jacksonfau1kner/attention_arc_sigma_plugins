import React from 'react';
import copyToClipboard from 'copy-to-clipboard';

function handleCopy(info, kpiLabel = 'Value') {
  const objects = info.objects ? info.objects : [info.object];
  // Only one of the dma_name should be in the data
  const headers = ['DMA', kpiLabel];
  const contents = objects.map(data => {
    const dma = data.properties?.dma_name ?? data.dma_name ?? data.dma ?? '';
    const value = data.numeric_value ?? data.value ?? '';
    return [dma, value].join(',');
  });

  const text = [headers.join(','), ...contents].join('\n');
  copyToClipboard(text);
}

export function renderContextMenu(info, kpiLabel = 'Value') {
  if (!info) return null;
  const { x, y, object } = info;
  const dmaName = object?.properties?.dma_name ?? object?.dma_name ?? object?.dma ?? '';
  const kpiValue = object?.numeric_value ?? object?.value ?? '';

  return (
    <ul className="contextMenu" style={{position: 'fixed', left: x, top: y}}>
      <li style={{pointerEvents: 'none', fontWeight: 'bold'}}>DMA: {dmaName}</li>
      <li style={{pointerEvents: 'none'}}>{kpiLabel}: {kpiValue}</li>
      <li onClick={() => handleCopy(info, kpiLabel)}>Copy data</li>
    </ul>
  )
}