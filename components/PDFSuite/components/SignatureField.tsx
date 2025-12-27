// ============================================
// SignatureField Component
// Digital signature capture with canvas
// ============================================

import React, { useCallback, useState, useRef, useEffect } from 'react';
import type { PDFFormField } from '../types';

interface SignatureFieldProps {
  field: PDFFormField;
  value: string; // Base64 image data
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isSelected?: boolean;
  isEditing?: boolean;
  errors?: string[];
  zoom?: number;
  strokeColor?: string;
  strokeWidth?: number;
  className?: string;
}

export const SignatureField: React.FC<SignatureFieldProps> = ({
  field,
  value,
  onChange,
  onFocus,
  onBlur,
  isSelected = false,
  isEditing = false,
  errors = [],
  zoom = 1,
  strokeColor = '#000000',
  strokeWidth = 2,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Get canvas context
  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  // Initialize canvas
  useEffect(() => {
    if (isModalOpen && signatureMode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = 400;
      canvas.height = 150;

      // Set drawing style
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [isModalOpen, signatureMode, strokeColor, strokeWidth]);

  // Get coordinates from event
  const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      if (!touch) return null;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    lastPointRef.current = coords;
  }, [getCoordinates]);

  // Draw
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords || !lastPointRef.current) return;

    const ctx = getContext();
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPointRef.current = coords;
  }, [isDrawing, getCoordinates, getContext]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPointRef.current = null;
  }, []);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [getContext]);

  // Save signature
  const saveSignature = useCallback(() => {
    if (signatureMode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    } else if (signatureMode === 'type' && typedSignature) {
      // Create canvas with typed signature
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = 'italic 48px "Brush Script MT", "Segoe Script", cursive';
      ctx.fillStyle = strokeColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);

      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }

    setIsModalOpen(false);
    onBlur?.();
  }, [signatureMode, typedSignature, strokeColor, onChange, onBlur]);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onChange(dataUrl);
      setIsModalOpen(false);
      onBlur?.();
    };
    reader.readAsDataURL(file);
  }, [onChange, onBlur]);

  // Clear signature
  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const hasErrors = errors.length > 0;

  return (
    <>
      <div
        className={`form-field-container ${className}`}
        style={{
          position: 'absolute',
          left: field.rect.x * zoom,
          top: field.rect.y * zoom,
          width: field.rect.width * zoom,
        }}
      >
        {/* Label */}
        {field.label && (
          <label
            style={{
              display: 'block',
              marginBottom: 4 * zoom,
              fontSize: 11 * zoom,
              fontWeight: 500,
              color: hasErrors ? '#ef4444' : '#475569',
            }}
          >
            {field.label}
            {field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
          </label>
        )}

        {/* Signature box */}
        <div
          onClick={() => !field.readOnly && !value && setIsModalOpen(true)}
          style={{
            width: '100%',
            height: field.rect.height * zoom,
            backgroundColor: field.backgroundColor || '#ffffff',
            border: `${field.borderWidth || 1}px ${value ? 'solid' : 'dashed'} ${
              hasErrors
                ? '#ef4444'
                : isSelected
                ? '#6366f1'
                : field.borderColor || '#cccccc'
            }`,
            borderRadius: (field.borderRadius || 4) * zoom,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: field.readOnly ? 'not-allowed' : 'pointer',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: isSelected
              ? `0 0 0 ${3 * zoom}px rgba(99, 102, 241, 0.2)`
              : 'none',
            opacity: field.readOnly ? 0.6 : 1,
          }}
          onFocus={onFocus}
        >
          {value ? (
            <>
              <img
                src={value}
                alt="Signature"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
              {!field.readOnly && (
                <div
                  style={{
                    position: 'absolute',
                    top: 4 * zoom,
                    right: 4 * zoom,
                    display: 'flex',
                    gap: 4 * zoom,
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsModalOpen(true);
                    }}
                    style={{
                      width: 24 * zoom,
                      height: 24 * zoom,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f1f5f9',
                      border: 'none',
                      borderRadius: 4 * zoom,
                      cursor: 'pointer',
                      color: '#64748b',
                    }}
                  >
                    <i className="fas fa-edit" style={{ fontSize: 10 * zoom }}></i>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                    style={{
                      width: 24 * zoom,
                      height: 24 * zoom,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#fef2f2',
                      border: 'none',
                      borderRadius: 4 * zoom,
                      cursor: 'pointer',
                      color: '#ef4444',
                    }}
                  >
                    <i className="fas fa-times" style={{ fontSize: 10 * zoom }}></i>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <i className="fas fa-signature" style={{ fontSize: 24 * zoom, marginBottom: 8 * zoom, display: 'block' }}></i>
              <span style={{ fontSize: 12 * zoom }}>Click to sign</span>
            </div>
          )}
        </div>

        {/* Error message */}
        {hasErrors && (
          <div
            style={{
              marginTop: 4 * zoom,
              fontSize: 10 * zoom,
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: 4 * zoom,
            }}
          >
            <i className="fas fa-exclamation-circle"></i>
            {errors[0]}
          </div>
        )}
      </div>

      {/* Signature Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 24,
              width: 480,
              maxWidth: '90vw',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                Add Signature
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 8,
                  color: '#64748b',
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                { id: 'draw', label: 'Draw', icon: 'fa-pen' },
                { id: 'type', label: 'Type', icon: 'fa-keyboard' },
                { id: 'upload', label: 'Upload', icon: 'fa-upload' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSignatureMode(mode.id as typeof signatureMode)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: signatureMode === mode.id ? '#6366f1' : '#64748b',
                    backgroundColor: signatureMode === mode.id ? '#eef2ff' : '#f8fafc',
                    border: `2px solid ${signatureMode === mode.id ? '#6366f1' : 'transparent'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <i className={`fas ${mode.icon}`}></i>
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Content area */}
            <div style={{ marginBottom: 20 }}>
              {signatureMode === 'draw' && (
                <div>
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{
                      width: '100%',
                      height: 150,
                      border: '2px solid #e2e8f0',
                      borderRadius: 8,
                      cursor: 'crosshair',
                      touchAction: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={clearCanvas}
                    style={{
                      marginTop: 8,
                      padding: '8px 16px',
                      fontSize: 12,
                      color: '#64748b',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <i className="fas fa-eraser" style={{ marginRight: 6 }}></i>
                    Clear
                  </button>
                </div>
              )}

              {signatureMode === 'type' && (
                <div>
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Type your name..."
                    style={{
                      width: '100%',
                      padding: 16,
                      fontSize: 32,
                      fontFamily: '"Brush Script MT", "Segoe Script", cursive',
                      fontStyle: 'italic',
                      textAlign: 'center',
                      border: '2px solid #e2e8f0',
                      borderRadius: 8,
                      outline: 'none',
                    }}
                  />
                  <p style={{ marginTop: 8, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                    Your signature will appear in a handwriting style
                  </p>
                </div>
              )}

              {signatureMode === 'upload' && (
                <div
                  style={{
                    border: '2px dashed #e2e8f0',
                    borderRadius: 8,
                    padding: 40,
                    textAlign: 'center',
                  }}
                >
                  <i className="fas fa-cloud-upload-alt" style={{ fontSize: 40, color: '#cbd5e1', marginBottom: 16, display: 'block' }}></i>
                  <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                    Upload an image of your signature
                  </p>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 20px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#ffffff',
                      backgroundColor: '#6366f1',
                      borderRadius: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <i className="fas fa-upload"></i>
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '10px 20px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#64748b',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSignature}
                disabled={signatureMode === 'type' && !typedSignature}
                style={{
                  padding: '10px 20px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: '#6366f1',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  opacity: signatureMode === 'type' && !typedSignature ? 0.5 : 1,
                }}
              >
                <i className="fas fa-check" style={{ marginRight: 8 }}></i>
                Apply Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SignatureField;
