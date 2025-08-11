import React from 'react';

export default function Carousel({ children, index, count }) {
  if (count === 0) return null;
  return (
    <div style={{ width: '100%', height: '100%' }}>
      {React.Children.toArray(children)[index]}
    </div>
  );
}
