import { useState } from 'react';
import type { LayerEffect, PhotoLayerExtended, DropShadowSettings, StrokeSettings, OuterGlowSettings, InnerGlowSettings } from '../types';
import { createLayerEffect, effectLabels, availableEffects } from '../utils/layerEffectsRenderer';

interface LayerEffectsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  layer: PhotoLayerExtended | null;
  onEffectsChange: (effects: LayerEffect[]) => void;
}

export default function LayerEffectsPanel({
  isOpen,
  onClose,
  layer,
  onEffectsChange,
}: LayerEffectsPanelProps) {
  const [activeEffectId, setActiveEffectId] = useState<string | null>(null);

  if (!isOpen || !layer) return null;

  const effects = layer.effects || [];
  const activeEffect = effects.find(e => e.id === activeEffectId);

  const handleAddEffect = (type: LayerEffect['type']) => {
    const newEffect = createLayerEffect(type);
    onEffectsChange([...effects, newEffect]);
    setActiveEffectId(newEffect.id);
  };

  const handleRemoveEffect = (effectId: string) => {
    onEffectsChange(effects.filter(e => e.id !== effectId));
    if (activeEffectId === effectId) {
      setActiveEffectId(null);
    }
  };

  const handleToggleEffect = (effectId: string) => {
    onEffectsChange(effects.map(e =>
      e.id === effectId ? { ...e, enabled: !e.enabled } : e
    ));
  };

  const handleUpdateEffect = (effectId: string, settings: Partial<any>) => {
    onEffectsChange(effects.map(e =>
      e.id === effectId ? { ...e, settings: { ...e.settings, ...settings } } : e
    ));
  };

  const renderDropShadowSettings = (effect: LayerEffect) => {
    const settings = effect.settings as DropShadowSettings;
    return (
      <div className="space-y-4">
        {/* Color */}
        <div className="flex items-center gap-3">
          <label className="text-[9px] font-bold uppercase text-slate-500 w-20">Color</label>
          <input
            type="color"
            value={settings.color}
            onChange={(e) => handleUpdateEffect(effect.id, { color: e.target.value })}
            className="w-8 h-8 rounded border border-white/20 cursor-pointer"
          />
          <span className="text-[10px] font-mono text-slate-400">{settings.color}</span>
        </div>

        {/* Opacity */}
        <SliderRow
          label="Opacity"
          value={settings.opacity}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => handleUpdateEffect(effect.id, { opacity: v })}
        />

        {/* Angle */}
        <SliderRow
          label="Angle"
          value={settings.angle}
          min={0}
          max={360}
          unit="°"
          onChange={(v) => handleUpdateEffect(effect.id, { angle: v })}
        />

        {/* Distance */}
        <SliderRow
          label="Distance"
          value={settings.distance}
          min={0}
          max={100}
          unit="px"
          onChange={(v) => handleUpdateEffect(effect.id, { distance: v })}
        />

        {/* Spread */}
        <SliderRow
          label="Spread"
          value={settings.spread}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => handleUpdateEffect(effect.id, { spread: v })}
        />

        {/* Size (Blur) */}
        <SliderRow
          label="Size"
          value={settings.size}
          min={0}
          max={100}
          unit="px"
          onChange={(v) => handleUpdateEffect(effect.id, { size: v })}
        />
      </div>
    );
  };

  const renderStrokeSettings = (effect: LayerEffect) => {
    const settings = effect.settings as StrokeSettings;
    return (
      <div className="space-y-4">
        {/* Color */}
        <div className="flex items-center gap-3">
          <label className="text-[9px] font-bold uppercase text-slate-500 w-20">Color</label>
          <input
            type="color"
            value={settings.color}
            onChange={(e) => handleUpdateEffect(effect.id, { color: e.target.value })}
            className="w-8 h-8 rounded border border-white/20 cursor-pointer"
          />
        </div>

        {/* Size */}
        <SliderRow
          label="Size"
          value={settings.size}
          min={1}
          max={50}
          unit="px"
          onChange={(v) => handleUpdateEffect(effect.id, { size: v })}
        />

        {/* Position */}
        <div className="flex items-center gap-3">
          <label className="text-[9px] font-bold uppercase text-slate-500 w-20">Position</label>
          <div className="flex gap-1">
            {(['outside', 'inside', 'center'] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => handleUpdateEffect(effect.id, { position: pos })}
                className={`
                  px-2 py-1 rounded text-[9px] font-bold uppercase
                  ${settings.position === pos
                    ? 'bg-accent/20 text-accent'
                    : 'bg-white/5 text-slate-500 hover:text-white'
                  }
                `}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Opacity */}
        <SliderRow
          label="Opacity"
          value={settings.opacity}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => handleUpdateEffect(effect.id, { opacity: v })}
        />
      </div>
    );
  };

  const renderGlowSettings = (effect: LayerEffect, isInner: boolean) => {
    const settings = effect.settings as (OuterGlowSettings | InnerGlowSettings);
    return (
      <div className="space-y-4">
        {/* Color */}
        <div className="flex items-center gap-3">
          <label className="text-[9px] font-bold uppercase text-slate-500 w-20">Color</label>
          <input
            type="color"
            value={settings.color}
            onChange={(e) => handleUpdateEffect(effect.id, { color: e.target.value })}
            className="w-8 h-8 rounded border border-white/20 cursor-pointer"
          />
        </div>

        {/* Opacity */}
        <SliderRow
          label="Opacity"
          value={settings.opacity}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => handleUpdateEffect(effect.id, { opacity: v })}
        />

        {/* Technique */}
        <div className="flex items-center gap-3">
          <label className="text-[9px] font-bold uppercase text-slate-500 w-20">Technique</label>
          <div className="flex gap-1">
            {(['softer', 'precise'] as const).map((tech) => (
              <button
                key={tech}
                onClick={() => handleUpdateEffect(effect.id, { technique: tech })}
                className={`
                  px-2 py-1 rounded text-[9px] font-bold uppercase
                  ${settings.technique === tech
                    ? 'bg-accent/20 text-accent'
                    : 'bg-white/5 text-slate-500 hover:text-white'
                  }
                `}
              >
                {tech}
              </button>
            ))}
          </div>
        </div>

        {/* Spread/Choke */}
        <SliderRow
          label={isInner ? 'Choke' : 'Spread'}
          value={isInner ? (settings as InnerGlowSettings).choke : (settings as OuterGlowSettings).spread}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => handleUpdateEffect(effect.id, isInner ? { choke: v } : { spread: v })}
        />

        {/* Size */}
        <SliderRow
          label="Size"
          value={settings.size}
          min={0}
          max={100}
          unit="px"
          onChange={(v) => handleUpdateEffect(effect.id, { size: v })}
        />
      </div>
    );
  };

  const renderEffectSettings = (effect: LayerEffect) => {
    switch (effect.type) {
      case 'dropShadow':
      case 'innerShadow':
        return renderDropShadowSettings(effect);
      case 'stroke':
        return renderStrokeSettings(effect);
      case 'outerGlow':
        return renderGlowSettings(effect, false);
      case 'innerGlow':
        return renderGlowSettings(effect, true);
      default:
        return <p className="text-slate-500 text-[10px]">Settings not available</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[600px] max-h-[80vh] bg-[#1E1E1E] rounded-xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#252526] border-b border-black/40 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Layer Effects</h2>
            <p className="text-[10px] text-slate-500">{layer.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Effects List */}
          <div className="w-48 border-r border-black/40 flex flex-col">
            <div className="p-3 border-b border-black/20">
              <p className="text-[9px] font-bold uppercase text-slate-500 mb-2">Add Effect</p>
              <div className="space-y-1">
                {availableEffects.map((effectDef) => {
                  const hasEffect = effects.some(e => e.type === effectDef.type);
                  return (
                    <button
                      key={effectDef.type}
                      onClick={() => handleAddEffect(effectDef.type)}
                      disabled={hasEffect}
                      className={`
                        w-full px-2 py-1.5 rounded flex items-center gap-2 text-left
                        ${hasEffect
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:bg-white/5 text-slate-400 hover:text-white'
                        }
                      `}
                    >
                      <i className={`fas ${effectDef.icon} text-[10px] w-4`} />
                      <span className="text-[10px]">{effectDef.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Effects */}
            <div className="flex-1 overflow-y-auto">
              <p className="px-3 py-2 text-[9px] font-bold uppercase text-slate-500">Active Effects</p>
              {effects.length === 0 ? (
                <p className="px-3 py-2 text-[10px] text-slate-600">No effects applied</p>
              ) : (
                effects.map((effect) => (
                  <div
                    key={effect.id}
                    onClick={() => setActiveEffectId(effect.id)}
                    className={`
                      px-3 py-2 flex items-center gap-2 cursor-pointer border-l-2
                      ${activeEffectId === effect.id
                        ? 'bg-white/5 border-l-accent'
                        : 'border-l-transparent hover:bg-white/5'
                      }
                    `}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleEffect(effect.id);
                      }}
                      className={`w-4 ${effect.enabled ? 'text-accent' : 'text-slate-600'}`}
                    >
                      <i className={`fas ${effect.enabled ? 'fa-eye' : 'fa-eye-slash'} text-[10px]`} />
                    </button>
                    <span className={`flex-1 text-[10px] ${effect.enabled ? 'text-white' : 'text-slate-500'}`}>
                      {effectLabels[effect.type]}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveEffect(effect.id);
                      }}
                      className="text-slate-600 hover:text-red-400"
                    >
                      <i className="fas fa-trash text-[9px]" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Effect Settings */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeEffect ? (
              <div>
                <h3 className="text-xs font-bold text-white mb-4">
                  {effectLabels[activeEffect.type]} Settings
                </h3>
                {renderEffectSettings(activeEffect)}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-500 text-[10px]">Select an effect to edit</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#252526] border-t border-black/40 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-400"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-accent hover:brightness-110 text-[11px] font-bold text-white"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper component for slider rows
function SliderRow({
  label,
  value,
  min,
  max,
  unit = '',
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-[9px] font-bold uppercase text-slate-500 w-20">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-accent"
      />
      <span className="text-[10px] font-mono text-slate-400 w-12 text-right">
        {value}{unit}
      </span>
    </div>
  );
}
