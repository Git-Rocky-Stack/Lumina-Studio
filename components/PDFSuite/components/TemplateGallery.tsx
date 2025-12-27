// ============================================
// TemplateGallery Component
// Pre-built form templates browser
// ============================================

import React, { useState, useCallback, useMemo } from 'react';
import type { PDFFormField, FormFieldType } from '../types';

// Template categories
export type TemplateCategory = 'contracts' | 'applications' | 'surveys' | 'business' | 'personal';

// Template definition
export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail: string; // Icon class
  fields: Omit<PDFFormField, 'id' | 'createdAt' | 'modifiedAt'>[];
  tags: string[];
  popularity: number;
}

// Pre-built templates
const TEMPLATES: FormTemplate[] = [
  // CONTRACTS
  {
    id: 'nda-simple',
    name: 'Simple NDA',
    description: 'Basic non-disclosure agreement with essential fields',
    category: 'contracts',
    thumbnail: 'fa-file-contract',
    tags: ['legal', 'confidential', 'agreement'],
    popularity: 95,
    fields: [
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 100, width: 300, height: 32 }, name: 'disclosing_party', label: 'Disclosing Party', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 160, width: 300, height: 32 }, name: 'receiving_party', label: 'Receiving Party', required: true },
      { type: 'date', pageNumber: 1, rect: { x: 50, y: 220, width: 150, height: 32 }, name: 'effective_date', label: 'Effective Date', required: true },
      { type: 'dropdown', pageNumber: 1, rect: { x: 50, y: 280, width: 200, height: 32 }, name: 'duration', label: 'Duration', required: true, options: [{ value: '1', label: '1 Year' }, { value: '2', label: '2 Years' }, { value: '5', label: '5 Years' }, { value: 'indefinite', label: 'Indefinite' }] },
      { type: 'signature', pageNumber: 1, rect: { x: 50, y: 400, width: 250, height: 80 }, name: 'disclosing_signature', label: 'Disclosing Party Signature', required: true },
      { type: 'signature', pageNumber: 1, rect: { x: 350, y: 400, width: 250, height: 80 }, name: 'receiving_signature', label: 'Receiving Party Signature', required: true },
    ],
  },
  {
    id: 'service-agreement',
    name: 'Service Agreement',
    description: 'Professional service contract with scope and terms',
    category: 'contracts',
    thumbnail: 'fa-handshake',
    tags: ['legal', 'service', 'professional'],
    popularity: 88,
    fields: [
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 80, width: 300, height: 32 }, name: 'service_provider', label: 'Service Provider', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 130, width: 300, height: 32 }, name: 'client_name', label: 'Client Name', required: true },
      { type: 'textarea', pageNumber: 1, rect: { x: 50, y: 180, width: 500, height: 100 }, name: 'scope_of_work', label: 'Scope of Work', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 300, width: 150, height: 32 }, name: 'compensation', label: 'Compensation Amount', required: true },
      { type: 'dropdown', pageNumber: 1, rect: { x: 220, y: 300, width: 150, height: 32 }, name: 'payment_terms', label: 'Payment Terms', options: [{ value: 'upfront', label: 'Upfront' }, { value: 'monthly', label: 'Monthly' }, { value: 'milestone', label: 'Per Milestone' }, { value: 'completion', label: 'Upon Completion' }] },
      { type: 'date', pageNumber: 1, rect: { x: 50, y: 360, width: 150, height: 32 }, name: 'start_date', label: 'Start Date', required: true },
      { type: 'date', pageNumber: 1, rect: { x: 220, y: 360, width: 150, height: 32 }, name: 'end_date', label: 'End Date' },
      { type: 'signature', pageNumber: 1, rect: { x: 50, y: 450, width: 250, height: 80 }, name: 'provider_signature', label: 'Provider Signature', required: true },
      { type: 'signature', pageNumber: 1, rect: { x: 350, y: 450, width: 250, height: 80 }, name: 'client_signature', label: 'Client Signature', required: true },
    ],
  },
  {
    id: 'employment-contract',
    name: 'Employment Contract',
    description: 'Standard employment agreement template',
    category: 'contracts',
    thumbnail: 'fa-user-tie',
    tags: ['employment', 'hr', 'job'],
    popularity: 92,
    fields: [
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 80, width: 300, height: 32 }, name: 'employee_name', label: 'Employee Name', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 130, width: 300, height: 32 }, name: 'job_title', label: 'Job Title', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 180, width: 200, height: 32 }, name: 'department', label: 'Department' },
      { type: 'date', pageNumber: 1, rect: { x: 50, y: 230, width: 150, height: 32 }, name: 'start_date', label: 'Start Date', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 280, width: 150, height: 32 }, name: 'salary', label: 'Annual Salary', required: true },
      { type: 'dropdown', pageNumber: 1, rect: { x: 220, y: 280, width: 150, height: 32 }, name: 'employment_type', label: 'Type', options: [{ value: 'full-time', label: 'Full-Time' }, { value: 'part-time', label: 'Part-Time' }, { value: 'contract', label: 'Contract' }] },
      { type: 'checkbox', pageNumber: 1, rect: { x: 50, y: 340, width: 24, height: 24 }, name: 'benefits', label: 'Includes Benefits Package' },
      { type: 'signature', pageNumber: 1, rect: { x: 50, y: 420, width: 250, height: 80 }, name: 'employee_signature', label: 'Employee Signature', required: true },
      { type: 'signature', pageNumber: 1, rect: { x: 350, y: 420, width: 250, height: 80 }, name: 'employer_signature', label: 'Employer Signature', required: true },
    ],
  },

  // APPLICATIONS
  {
    id: 'job-application',
    name: 'Job Application',
    description: 'Standard job application form',
    category: 'applications',
    thumbnail: 'fa-briefcase',
    tags: ['employment', 'hiring', 'recruitment'],
    popularity: 90,
    fields: [
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 80, width: 200, height: 32 }, name: 'first_name', label: 'First Name', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 270, y: 80, width: 200, height: 32 }, name: 'last_name', label: 'Last Name', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 130, width: 300, height: 32 }, name: 'email', label: 'Email Address', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 180, width: 200, height: 32 }, name: 'phone', label: 'Phone Number', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 230, width: 300, height: 32 }, name: 'position', label: 'Position Applied For', required: true },
      { type: 'date', pageNumber: 1, rect: { x: 50, y: 280, width: 150, height: 32 }, name: 'available_date', label: 'Available Start Date' },
      { type: 'textarea', pageNumber: 1, rect: { x: 50, y: 330, width: 500, height: 120 }, name: 'experience', label: 'Relevant Experience', required: true },
      { type: 'checkbox', pageNumber: 1, rect: { x: 50, y: 470, width: 24, height: 24 }, name: 'terms_accepted', label: 'I certify that all information is accurate', required: true },
      { type: 'signature', pageNumber: 1, rect: { x: 50, y: 520, width: 250, height: 80 }, name: 'applicant_signature', label: 'Signature', required: true },
    ],
  },
  {
    id: 'loan-application',
    name: 'Loan Application',
    description: 'Personal or business loan request form',
    category: 'applications',
    thumbnail: 'fa-money-check-alt',
    tags: ['finance', 'loan', 'banking'],
    popularity: 75,
    fields: [
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 80, width: 300, height: 32 }, name: 'applicant_name', label: 'Full Legal Name', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 130, width: 200, height: 32 }, name: 'ssn', label: 'Social Security Number', required: true },
      { type: 'date', pageNumber: 1, rect: { x: 270, y: 130, width: 150, height: 32 }, name: 'dob', label: 'Date of Birth', required: true },
      { type: 'textarea', pageNumber: 1, rect: { x: 50, y: 180, width: 400, height: 60 }, name: 'address', label: 'Current Address', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 260, width: 150, height: 32 }, name: 'loan_amount', label: 'Loan Amount Requested', required: true },
      { type: 'dropdown', pageNumber: 1, rect: { x: 220, y: 260, width: 180, height: 32 }, name: 'loan_purpose', label: 'Purpose', required: true, options: [{ value: 'home', label: 'Home Purchase' }, { value: 'auto', label: 'Auto' }, { value: 'education', label: 'Education' }, { value: 'personal', label: 'Personal' }, { value: 'business', label: 'Business' }] },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 310, width: 200, height: 32 }, name: 'employer', label: 'Current Employer' },
      { type: 'text', pageNumber: 1, rect: { x: 270, y: 310, width: 150, height: 32 }, name: 'annual_income', label: 'Annual Income', required: true },
      { type: 'checkbox', pageNumber: 1, rect: { x: 50, y: 370, width: 24, height: 24 }, name: 'credit_check_auth', label: 'I authorize a credit check', required: true },
      { type: 'signature', pageNumber: 1, rect: { x: 50, y: 420, width: 250, height: 80 }, name: 'applicant_signature', label: 'Applicant Signature', required: true },
    ],
  },

  // SURVEYS
  {
    id: 'customer-feedback',
    name: 'Customer Feedback',
    description: 'Customer satisfaction survey form',
    category: 'surveys',
    thumbnail: 'fa-star',
    tags: ['feedback', 'customer', 'satisfaction'],
    popularity: 85,
    fields: [
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 80, width: 300, height: 32 }, name: 'customer_name', label: 'Name (Optional)' },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 130, width: 300, height: 32 }, name: 'email', label: 'Email (Optional)' },
      { type: 'date', pageNumber: 1, rect: { x: 50, y: 180, width: 150, height: 32 }, name: 'visit_date', label: 'Date of Visit' },
      { type: 'dropdown', pageNumber: 1, rect: { x: 50, y: 230, width: 250, height: 32 }, name: 'overall_rating', label: 'Overall Experience', required: true, options: [{ value: '5', label: 'Excellent' }, { value: '4', label: 'Very Good' }, { value: '3', label: 'Good' }, { value: '2', label: 'Fair' }, { value: '1', label: 'Poor' }] },
      { type: 'dropdown', pageNumber: 1, rect: { x: 50, y: 280, width: 250, height: 32 }, name: 'service_rating', label: 'Service Quality', options: [{ value: '5', label: 'Excellent' }, { value: '4', label: 'Very Good' }, { value: '3', label: 'Good' }, { value: '2', label: 'Fair' }, { value: '1', label: 'Poor' }] },
      { type: 'textarea', pageNumber: 1, rect: { x: 50, y: 330, width: 500, height: 100 }, name: 'comments', label: 'Additional Comments' },
      { type: 'checkbox', pageNumber: 1, rect: { x: 50, y: 450, width: 24, height: 24 }, name: 'would_recommend', label: 'Would you recommend us to others?' },
      { type: 'checkbox', pageNumber: 1, rect: { x: 50, y: 490, width: 24, height: 24 }, name: 'contact_me', label: 'Contact me about my feedback' },
    ],
  },
  {
    id: 'event-registration',
    name: 'Event Registration',
    description: 'Event or workshop registration form',
    category: 'surveys',
    thumbnail: 'fa-calendar-check',
    tags: ['event', 'registration', 'workshop'],
    popularity: 80,
    fields: [
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 80, width: 200, height: 32 }, name: 'first_name', label: 'First Name', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 270, y: 80, width: 200, height: 32 }, name: 'last_name', label: 'Last Name', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 130, width: 300, height: 32 }, name: 'email', label: 'Email', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 180, width: 200, height: 32 }, name: 'phone', label: 'Phone Number' },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 230, width: 300, height: 32 }, name: 'organization', label: 'Organization/Company' },
      { type: 'dropdown', pageNumber: 1, rect: { x: 50, y: 280, width: 200, height: 32 }, name: 'ticket_type', label: 'Ticket Type', required: true, options: [{ value: 'standard', label: 'Standard' }, { value: 'vip', label: 'VIP' }, { value: 'student', label: 'Student' }, { value: 'group', label: 'Group (5+)' }] },
      { type: 'text', pageNumber: 1, rect: { x: 270, y: 280, width: 100, height: 32 }, name: 'quantity', label: 'Quantity' },
      { type: 'textarea', pageNumber: 1, rect: { x: 50, y: 330, width: 400, height: 60 }, name: 'dietary_restrictions', label: 'Dietary Restrictions' },
      { type: 'checkbox', pageNumber: 1, rect: { x: 50, y: 410, width: 24, height: 24 }, name: 'newsletter', label: 'Subscribe to newsletter' },
      { type: 'checkbox', pageNumber: 1, rect: { x: 50, y: 450, width: 24, height: 24 }, name: 'terms_accepted', label: 'I agree to the terms and conditions', required: true },
    ],
  },

  // BUSINESS
  {
    id: 'invoice',
    name: 'Invoice',
    description: 'Professional invoice template',
    category: 'business',
    thumbnail: 'fa-file-invoice-dollar',
    tags: ['billing', 'payment', 'business'],
    popularity: 94,
    fields: [
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 80, width: 150, height: 32 }, name: 'invoice_number', label: 'Invoice #', required: true },
      { type: 'date', pageNumber: 1, rect: { x: 220, y: 80, width: 150, height: 32 }, name: 'invoice_date', label: 'Date', required: true },
      { type: 'date', pageNumber: 1, rect: { x: 390, y: 80, width: 150, height: 32 }, name: 'due_date', label: 'Due Date', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 150, width: 300, height: 32 }, name: 'client_name', label: 'Bill To', required: true },
      { type: 'textarea', pageNumber: 1, rect: { x: 50, y: 200, width: 300, height: 60 }, name: 'client_address', label: 'Client Address' },
      { type: 'textarea', pageNumber: 1, rect: { x: 50, y: 290, width: 500, height: 150 }, name: 'line_items', label: 'Items/Services', placeholder: 'Description | Qty | Rate | Amount', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 400, y: 460, width: 150, height: 32 }, name: 'subtotal', label: 'Subtotal' },
      { type: 'text', pageNumber: 1, rect: { x: 400, y: 500, width: 150, height: 32 }, name: 'tax', label: 'Tax' },
      { type: 'text', pageNumber: 1, rect: { x: 400, y: 540, width: 150, height: 32 }, name: 'total', label: 'Total', required: true },
      { type: 'textarea', pageNumber: 1, rect: { x: 50, y: 480, width: 300, height: 60 }, name: 'notes', label: 'Notes/Terms' },
    ],
  },
  {
    id: 'expense-report',
    name: 'Expense Report',
    description: 'Employee expense reimbursement form',
    category: 'business',
    thumbnail: 'fa-receipt',
    tags: ['expense', 'reimbursement', 'finance'],
    popularity: 78,
    fields: [
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 80, width: 250, height: 32 }, name: 'employee_name', label: 'Employee Name', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 320, y: 80, width: 150, height: 32 }, name: 'department', label: 'Department' },
      { type: 'date', pageNumber: 1, rect: { x: 50, y: 130, width: 150, height: 32 }, name: 'report_period_start', label: 'Period Start', required: true },
      { type: 'date', pageNumber: 1, rect: { x: 220, y: 130, width: 150, height: 32 }, name: 'report_period_end', label: 'Period End', required: true },
      { type: 'textarea', pageNumber: 1, rect: { x: 50, y: 190, width: 500, height: 200 }, name: 'expenses', label: 'Expense Details', placeholder: 'Date | Description | Category | Amount', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 400, y: 410, width: 150, height: 32 }, name: 'total_amount', label: 'Total', required: true },
      { type: 'checkbox', pageNumber: 1, rect: { x: 50, y: 420, width: 24, height: 24 }, name: 'receipts_attached', label: 'All receipts attached' },
      { type: 'signature', pageNumber: 1, rect: { x: 50, y: 470, width: 200, height: 70 }, name: 'employee_signature', label: 'Employee Signature', required: true },
      { type: 'signature', pageNumber: 1, rect: { x: 300, y: 470, width: 200, height: 70 }, name: 'manager_signature', label: 'Manager Approval' },
    ],
  },

  // PERSONAL
  {
    id: 'contact-form',
    name: 'Contact Form',
    description: 'Simple contact information form',
    category: 'personal',
    thumbnail: 'fa-address-card',
    tags: ['contact', 'info', 'personal'],
    popularity: 70,
    fields: [
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 80, width: 200, height: 32 }, name: 'first_name', label: 'First Name', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 270, y: 80, width: 200, height: 32 }, name: 'last_name', label: 'Last Name', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 130, width: 300, height: 32 }, name: 'email', label: 'Email', required: true },
      { type: 'text', pageNumber: 1, rect: { x: 50, y: 180, width: 200, height: 32 }, name: 'phone', label: 'Phone' },
      { type: 'textarea', pageNumber: 1, rect: { x: 50, y: 230, width: 400, height: 100 }, name: 'message', label: 'Message', required: true },
    ],
  },
];

// Category info
const CATEGORIES: { id: TemplateCategory; label: string; icon: string }[] = [
  { id: 'contracts', label: 'Contracts', icon: 'fa-file-contract' },
  { id: 'applications', label: 'Applications', icon: 'fa-file-alt' },
  { id: 'surveys', label: 'Surveys', icon: 'fa-poll' },
  { id: 'business', label: 'Business', icon: 'fa-building' },
  { id: 'personal', label: 'Personal', icon: 'fa-user' },
];

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: FormTemplate) => void;
  className?: string;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let templates = TEMPLATES;

    // Category filter
    if (activeCategory !== 'all') {
      templates = templates.filter((t) => t.category === activeCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Sort by popularity
    return templates.sort((a, b) => b.popularity - a.popularity);
  }, [activeCategory, searchQuery]);

  // Handle template select
  const handleSelect = useCallback(
    (template: FormTemplate) => {
      onSelectTemplate(template);
      onClose();
    },
    [onSelectTemplate, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[900px] max-w-[90vw] max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-black text-slate-800">Template Gallery</h2>
            <p className="text-sm text-slate-500">Choose a pre-built form template to get started</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Category tabs */}
            <div className="flex gap-1">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeCategory === 'all'
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeCategory === cat.id
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <i className={`fas ${cat.icon} text-[10px]`}></i>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="group border-2 border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleSelect(template)}
                  onMouseEnter={() => setPreviewTemplate(template)}
                  onMouseLeave={() => setPreviewTemplate(null)}
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <i className={`fas ${template.thumbnail} text-white text-lg`}></i>
                  </div>

                  {/* Title and description */}
                  <h3 className="font-bold text-slate-800 mb-1">{template.name}</h3>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{template.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Field count */}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      <i className="fas fa-th-list mr-1"></i>
                      {template.fields.length} fields
                    </span>
                    <span className="text-indigo-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Use Template →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <i className="fas fa-search text-4xl mb-4"></i>
              <p className="text-lg font-medium">No templates found</p>
              <p className="text-sm">Try a different search or category</p>
            </div>
          )}
        </div>

        {/* Preview sidebar (shows on hover) */}
        {previewTemplate && (
          <div className="absolute right-0 top-0 w-64 h-full bg-white border-l border-slate-200 shadow-xl p-4 overflow-y-auto">
            <h4 className="font-bold text-slate-800 mb-2">{previewTemplate.name}</h4>
            <p className="text-xs text-slate-500 mb-4">{previewTemplate.description}</p>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Fields</p>
            <div className="space-y-1">
              {previewTemplate.fields.map((field, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                  <i className={`fas ${getFieldIcon(field.type)} text-slate-400 w-4`}></i>
                  <span className="truncate">{field.label || field.name}</span>
                  {field.required && <span className="text-rose-500">*</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {filteredTemplates.length} templates available
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper to get field icon
function getFieldIcon(type: FormFieldType): string {
  const icons: Record<FormFieldType, string> = {
    text: 'fa-font',
    textarea: 'fa-align-left',
    checkbox: 'fa-check-square',
    radio: 'fa-circle-dot',
    dropdown: 'fa-caret-down',
    date: 'fa-calendar',
    signature: 'fa-signature',
    button: 'fa-square',
  };
  return icons[type] || 'fa-square';
}

export default TemplateGallery;
export { TEMPLATES };
