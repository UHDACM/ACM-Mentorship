import React from 'react';
import { FaCheck } from 'react-icons/fa';

interface InputToggleProps {
  value?: boolean;
  onClick?: (value: boolean) => void;
  children?: React.ReactNode;
}

const InputToggle: React.FC<InputToggleProps> = ({ value, onClick, children }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
      <div
        onClick={() => onClick && onClick(!value)}
        style={{
          width: '2rem',
          height: '2rem',
          borderRadius: '0.5rem',
          border: '1px solid #555',
          backgroundColor: '#333',
          cursor: 'pointer',
          marginRight: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {value && <FaCheck size={'1.25rem'} color={"#2d2"} />}
      </div>
      {children}
    </div>
  );
};

export default InputToggle;