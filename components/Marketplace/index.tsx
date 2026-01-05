// =============================================
// Marketplace Components Index
// Export all template marketplace UI components
// =============================================

export { TemplateCard } from './TemplateCard';
export { TemplateBrowser } from './TemplateBrowser';
export { TemplateDetailModal } from './TemplateDetailModal';

// Re-export types from service
export type {
  TemplateCategory,
  MarketplaceTemplate,
  TemplateReview,
  TemplatePurchase,
  TemplateCollection,
  SearchFilters,
} from '../../services/templateMarketplaceService';
