// ============================================
// FormFieldCreator Component
// Create interactive form fields for PDF forms
// ============================================

import React, { useState, useCallback } from 'react';
import type { PDFFormField } from '../types';

export type FormFieldType = 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature' | 'date' | 'button';

interface FormFieldCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateField: (field: Partial<PDFFormField>) => void;
  selectedFieldType: FormFieldType | null;
  onFieldTypeChange: (type: FormFieldType) => void;
  className?: string;
}

interface FieldTypeOption {
  type: FormFieldType;
  label: string;
  icon: string;
  description: string;
}

const FIELD_TYPES: FieldTypeOption[] = [
  { type: 'text', label: 'Text Field', icon: 'fa-font', description: 'Single or multi-line text input' },
  { type: 'checkbox', label: 'Checkbox', icon: 'fa-check-square', description: 'Toggleable on/off option' },
  { type: 'radio', label: 'Radio Button', icon: 'fa-dot-circle', description: 'Select one from a group' },
  { type: 'dropdown', label: 'Dropdown', icon: 'fa-caret-square-down', description: 'Select from a list' },
  { type: 'signature', label: 'Signature', icon: 'fa-signature', description: 'Digital signature field' },
  { type: 'date', label: 'Date Field', icon: 'fa-calendar-alt', description: 'Date picker input' },
  { type: 'button', label: 'Button', icon: 'fa-square', description: 'Submit or reset button' },
];

export const FormFieldCreator: React.FC<FormFieldCreatorProps> = ({
  isOpen,
  onClose,
  onCreateField,
  selectedFieldType,
  onFieldTypeChange,
  className = '',
}) => {
  const [fieldName, setFieldName] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isMultiline, setIsMultiline] = useState(false);
  const [maxLength, setMaxLength] = useState<number | undefined>();
  const [options, setOptions] = useState<string[]>(['Option 1', 'Option 2', 'Option 3']);
  const [groupName, setGroupName] = useState('group1');
  const [buttonType, setButtonType] = useState<'submit' | 'reset'>('submit');
  const [buttonLabel, setButtonLabel] = useState('Submit');

  const addOption = useCallback(() => {
    setOptions((prev) => [...prev, `Option ${prev.length + 1}`]);
  }, []);

  const removeOption = useCallback((index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateOption = useCallback((index: number, value: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  }, []);

  const handleCreate = useCallback(() => {
    const baseField: Partial<PDFFormField> = {
      id: `field-${Date.now()}`,
      name: fieldName || `${selectedFieldType}_${Date.now()}`,
      type: selectedFieldType as any,
      required: isRequired,
      placeholder,
    };

    switch (selectedFieldType) {
      case 'text':
        onCreateField({
          ...baseField,
          multiline: isMultiline,
          maxLength,
        });
        break;
      case 'checkbox':
        onCreateField({
          ...baseField,
          checked: false,
        });
        break;
      case 'radio':
        onCreateField({
          ...baseField,
          group: groupName,
          options,
        });
        break;
      case 'dropdown':
        onCreateField({
          ...baseField,
          options,
        });
        break;
      case 'signature':
        onCreateField({
          ...baseField,
        });
        break;
      case 'date':
        onCreateField({
          ...baseField,
        });
        break;
      case 'button':
        onCreateField({
          ...baseField,
          buttonType,
          label: buttonLabel,
        });
        break;
      default:
        onCreateField(baseField);
    }

    // Reset form
    setFieldName('');
    setPlaceholder('');
    setIsRequired(false);
  }, [
    selectedFieldType,
    fieldName,
    placeholder,
    isRequired,
    isMultiline,
    maxLength,
    options,
    groupName,
    buttonType,
    buttonLabel,
    onCreateField,
  ]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="bg-white rounded-2xl shadow-2xl w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-wpforms text-violet-600"></i>
            </div>
            <div>
              <h2 className="type-section text-slate-800">Create Form Field</h2>
              <p className="type-caption text-slate-500">Add interactive fields to your PDF form</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex">
            {/* Field type selector */}
            <div className="w-56 border-r border-slate-200 p-4 bg-slate-50">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Field Types</h3>
              <div className="space-y-1">
                {FIELD_TYPES.map((field) => (
                  <button
                    key={field.type}
                    onClick={() => onFieldTypeChange(field.type)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                      selectedFieldType === field.type
                        ? 'bg-violet-100 text-violet-700 shadow-sm'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <i className={`fas ${field.icon} w-5 text-center`}></i>
                      <div>
                        <div className="text-sm font-medium">{field.label}</div>
                        <div className="text-xs text-slate-400">{field.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Field configuration */}
            <div className="flex-1 p-6">
              {selectedFieldType ? (
                <div className="space-y-5">
                  {/* Field name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Field Name</label>
                    <input
                      type="text"
                      value={fieldName}
                      onChange={(e) => setFieldName(e.target.value)}
                      placeholder={`${selectedFieldType}_field`}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  {/* Placeholder (for text fields) */}
                  {(selectedFieldType === 'text' || selectedFieldType === 'date') && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Placeholder Text</label>
                      <input
                        type="text"
                        value={placeholder}
                        onChange={(e) => setPlaceholder(e.target.value)}
                        placeholder="Enter placeholder text..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {/* Text field options */}
                  {selectedFieldType === 'text' && (
                    <>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isMultiline}
                            onChange={(e) => setIsMultiline(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          />
                          <span className="text-sm text-slate-700">Multi-line text</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isRequired}
                            onChange={(e) => setIsRequired(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          />
                          <span className="text-sm text-slate-700">Required field</span>
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Max Length (optional)</label>
                        <input
                          type="number"
                          value={maxLength || ''}
                          onChange={(e) => setMaxLength(e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="Unlimited"
                          min="1"
                          className="w-32 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
                    </>
                  )}

                  {/* Radio button options */}
                  {selectedFieldType === 'radio' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Group Name</label>
                        <input
                          type="text"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          placeholder="radioGroup1"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Options</label>
                        <div className="space-y-2">
                          {options.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <i className="fas fa-dot-circle text-slate-400"></i>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(index, e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                              />
                              {options.length > 2 && (
                                <button
                                  onClick={() => removeOption(index)}
                                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={addOption}
                            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                          >
                            <i className="fas fa-plus mr-1"></i>
                            Add option
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Dropdown options */}
                  {selectedFieldType === 'dropdown' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Options</label>
                      <div className="space-y-2">
                        {options.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="w-6 text-center text-xs text-slate-400">{index + 1}.</span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(index, e.target.value)}
                              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            {options.length > 1 && (
                              <button
                                onClick={() => removeOption(index)}
                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={addOption}
                          className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                        >
                          <i className="fas fa-plus mr-1"></i>
                          Add option
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Checkbox options */}
                  {selectedFieldType === 'checkbox' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isRequired}
                        onChange={(e) => setIsRequired(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm text-slate-700">Required field</span>
                    </div>
                  )}

                  {/* Button options */}
                  {selectedFieldType === 'button' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Button Type</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setButtonType('submit')}
                            className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                              buttonType === 'submit'
                                ? 'bg-violet-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Submit
                          </button>
                          <button
                            onClick={() => setButtonType('reset')}
                            className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                              buttonType === 'reset'
                                ? 'bg-violet-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Button Label</label>
                        <input
                          type="text"
                          value={buttonLabel}
                          onChange={(e) => setButtonLabel(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
                    </>
                  )}

                  {/* Signature info */}
                  {selectedFieldType === 'signature' && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <i className="fas fa-info-circle text-amber-500 mt-0.5"></i>
                        <div>
                          <p className="text-sm text-amber-700 font-medium">Signature Field</p>
                          <p className="text-xs text-amber-600 mt-1">
                            Users will be able to sign this field with their digital signature.
                            Click on the document to place the signature area.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Date info */}
                  {selectedFieldType === 'date' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isRequired}
                        onChange={(e) => setIsRequired(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm text-slate-700">Required field</span>
                    </div>
                  )}

                  {/* Preview */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Preview</label>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      {selectedFieldType === 'text' && (
                        <input
                          type={isMultiline ? 'text' : 'text'}
                          placeholder={placeholder || 'Enter text...'}
                          disabled
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                        />
                      )}
                      {selectedFieldType === 'checkbox' && (
                        <label className="flex items-center gap-2">
                          <input type="checkbox" disabled className="w-4 h-4 rounded" />
                          <span className="text-sm text-slate-600">{fieldName || 'Checkbox field'}</span>
                          {isRequired && <span className="text-rose-500">*</span>}
                        </label>
                      )}
                      {selectedFieldType === 'radio' && (
                        <div className="space-y-2">
                          {options.map((opt, i) => (
                            <label key={i} className="flex items-center gap-2">
                              <input type="radio" disabled name="preview" className="w-4 h-4" />
                              <span className="text-sm text-slate-600">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {selectedFieldType === 'dropdown' && (
                        <select disabled className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm">
                          <option>Select an option</option>
                          {options.map((opt, i) => (
                            <option key={i}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {selectedFieldType === 'signature' && (
                        <div className="h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400">
                          <i className="fas fa-signature text-2xl"></i>
                        </div>
                      )}
                      {selectedFieldType === 'date' && (
                        <input
                          type="date"
                          disabled
                          className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                        />
                      )}
                      {selectedFieldType === 'button' && (
                        <button
                          disabled
                          className={`px-6 py-2 rounded-lg font-medium ${
                            buttonType === 'submit'
                              ? 'bg-violet-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {buttonLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center py-12">
                  <div>
                    <i className="fas fa-arrow-left text-4xl text-slate-200 mb-4"></i>
                    <p className="text-slate-500">Select a field type from the left panel</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-slate-500 text-sm">
            <i className="fas fa-info-circle mr-2"></i>
            Click on the document to place the field after creation
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!selectedFieldType}
              className={`px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${
                selectedFieldType
                  ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <i className="fas fa-plus"></i>
              Create Field
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormFieldCreator;
