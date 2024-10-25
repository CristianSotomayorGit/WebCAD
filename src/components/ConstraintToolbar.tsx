import React from 'react';
import { ConstraintManager } from '../domain/managers/ConstraintManager';
import { ConstraintType } from '../domain/constraints/ConstraintTypes';

interface ConstraintToolbarProps {
  constraintToolbarRef: React.MutableRefObject<ConstraintManager | undefined>;
  isSnapChecked: boolean;
  setIsSnapChecked: (value: boolean) => void;
  isOrthoChecked: boolean;
  setIsOrthoChecked: (value: boolean) => void;
}

const ConstraintToolbar: React.FC<ConstraintToolbarProps> = ({
  constraintToolbarRef,
  isSnapChecked,
  setIsSnapChecked,
  isOrthoChecked,
  setIsOrthoChecked,
}) => {
  const handleSnapChange = () => {
    setIsSnapChecked(!isSnapChecked);
    constraintToolbarRef.current?.toggleConstraint(ConstraintType.Snap, 'both');
  };

  const handleOrthoChange = () => {
    setIsOrthoChecked(!isOrthoChecked);
    constraintToolbarRef.current?.toggleConstraint(ConstraintType.Orthogonal, 'both');
  };

  return (
    <div style={toolbarStyle}>
      <label className="checkbox-container">Ortho
        <input type="checkbox" checked={isOrthoChecked} onChange={handleOrthoChange} />
        <span className="checkmark"></span>
      </label>
      <label className="checkbox-container">Snap
        <input type="checkbox" checked={isSnapChecked} onChange={handleSnapChange} />
        <span className="checkmark"></span>
      </label>
    </div>
  );
};

const toolbarStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  width: 'auto',
  backgroundColor: '#2c3e50',
  color: '#ecf0f1',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '14px',
  boxSizing: 'border-box',
  zIndex: 1000,
  gap: '10px',
  padding: '10px',
  borderRadius: '4px',
};

export default ConstraintToolbar;
