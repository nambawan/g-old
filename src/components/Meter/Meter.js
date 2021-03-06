/* @flow */
// inspired by https://github.com/react-component/progress/blob/master/src/Line.js

import React from 'react';

type Props = {
  percent: number,
  strokeWidth: number,
  trailColor: string,
  trailWidth: number,
  className?: string,
  strokeColor?: string,
  strokeLinecap?: string,
};

const Meter = ({
  className,
  percent,
  strokeColor = '#540b97',
  strokeLinecap = 'round',
  strokeWidth,
  trailColor,
  trailWidth,
  ...restProps
}: Props) => {
  const pathStyle = {
    strokeDasharray: '100px, 100px',
    strokeDashoffset: `${100 - percent}px`,
    transition: 'stroke-dashoffset 0.3s ease 0s, stroke 0.3s linear',
  };

  const center = strokeWidth / 2;
  const right = 100 - strokeWidth / 2;
  const pathString = `M ${strokeLinecap === 'round' ? center : 0},${center}
           L ${strokeLinecap === 'round' ? right : 100},${center}`;
  const viewBoxString = `0 0 100 ${strokeWidth}`;

  return (
    <svg
      className={className}
      viewBox={viewBoxString}
      preserveAspectRatio="none"
      {...restProps}
    >
      <path
        d={pathString}
        strokeLinecap={strokeLinecap}
        stroke={trailColor}
        strokeWidth={trailWidth || strokeWidth}
        fillOpacity="0"
      />
      <path
        d={pathString}
        strokeLinecap={strokeLinecap}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fillOpacity="0"
        style={pathStyle}
      />
    </svg>
  );
};

Meter.defaultProps = {
  strokeColor: null,
  strokeLinecap: '',
  className: '',
};

export default Meter;
