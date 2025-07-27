import React from 'react';

const Spinner = ({ 
  size = 20, 
  color = '#2563eb', 
  borderWidth = 2,
  speed = '0.8s',
  className = '',
  style = {} 
}) => {
  return (
    <>
      <div 
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: `${borderWidth}px solid transparent`,
          borderTop: `${borderWidth}px solid ${color}`,
          borderRight: `${borderWidth}px solid ${color}`,
          borderRadius: '50%',
          animation: `spin ${speed} linear infinite`,
          boxShadow: `0 0 ${size * 0.4}px ${color}30`,
          ...style
        }}
      />
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

// Different spinner variations
export const PulseSpinner = ({ 
  size = 20, 
  color = '#2563eb',
  speed = '1.5s',
  className = '',
  style = {} 
}) => {
  return (
    <>
      <div 
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          borderRadius: '50%',
          animation: `pulse ${speed} ease-in-out infinite`,
          ...style
        }}
      />
      <style>
        {`
          @keyframes pulse {
            0%, 100% { 
              transform: scale(0.8);
              opacity: 1;
            }
            50% { 
              transform: scale(1.2);
              opacity: 0.5;
            }
          }
        `}
      </style>
    </>
  );
};

// Dots spinner
export const DotsSpinner = ({ 
  size = 8, 
  color = '#2563eb',
  speed = '1.4s',
  className = '',
  style = {} 
}) => {
  return (
    <>
      <div 
        className={className}
        style={{
          display: 'flex',
          gap: `${size * 0.5}px`,
          alignItems: 'center',
          ...style
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius: '50%',
              animation: `bounce ${speed} ease-in-out ${i * 0.16}s infinite`
            }}
          />
        ))}
      </div>
      <style>
        {`
          @keyframes bounce {
            0%, 80%, 100% { 
              transform: scale(0);
              opacity: 0.5;
            }
            40% { 
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </>
  );
};

export default Spinner;
