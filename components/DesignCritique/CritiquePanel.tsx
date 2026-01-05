// Design Critique Panel - Automated feedback on typography, spacing, accessibility
import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Type,
  Layout,
  Palette,
  Eye,
  Grid,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Zap,
  Target,
  Accessibility,
} from 'lucide-react';
import {
  designCritiqueService,
  CritiqueResult,
  DesignIssue,
  CritiqueCategory,
  CanvasElement,
} from '../../services/designCritiqueService';

interface CritiquePanelProps {
  elements: CanvasElement[];
  projectId?: string;
  onSelectElement?: (elementId: string) => void;
  onClose?: () => void;
}

export const CritiquePanel: React.FC<CritiquePanelProps> = ({
  elements,
  projectId,
  onSelectElement,
  onClose,
}) => {
  const [result, setResult] = useState<CritiqueResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['accessibility']));
  const [selectedAnalysis, setSelectedAnalysis] = useState<'full' | 'typography' | 'spacing' | 'accessibility' | 'color' | 'layout'>('full');

  // Run analysis
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    const critiqueResult = await designCritiqueService.analyzeDesign(
      elements,
      projectId,
      selectedAnalysis
    );
    setResult(critiqueResult);
    setIsAnalyzing(false);
  };

  // Auto-analyze on mount if elements exist
  useEffect(() => {
    if (elements.length > 0) {
      runAnalysis();
    }
  }, []);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Group issues by category
  const issuesByCategory = result?.issues.reduce((acc, issue) => {
    if (!acc[issue.category]) acc[issue.category] = [];
    acc[issue.category].push(issue);
    return acc;
  }, {} as Record<CritiqueCategory, DesignIssue[]>) || {};

  // Get severity icon
  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  // Get category icon
  const getCategoryIcon = (category: CritiqueCategory) => {
    switch (category) {
      case 'typography':
        return <Type className="w-4 h-4" />;
      case 'spacing':
        return <Grid className="w-4 h-4" />;
      case 'accessibility':
        return <Accessibility className="w-4 h-4" />;
      case 'color':
        return <Palette className="w-4 h-4" />;
      case 'layout':
      case 'alignment':
        return <Layout className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get score background
  const getScoreBg = (score: number): string => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Design Critique</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing || elements.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Analyze
              </>
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Analysis Type Selector */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <select
          value={selectedAnalysis}
          onChange={e => setSelectedAnalysis(e.target.value as typeof selectedAnalysis)}
          className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"
        >
          <option value="full">Full Analysis</option>
          <option value="typography">Typography Only</option>
          <option value="spacing">Spacing Only</option>
          <option value="accessibility">Accessibility Only</option>
          <option value="color">Color Only</option>
          <option value="layout">Layout Only</option>
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!result && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
            <Sparkles className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center text-sm">
              Click "Analyze" to get automated feedback on your design
            </p>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Analyzing your design...</p>
          </div>
        )}

        {result && !isAnalyzing && (
          <div className="p-4 space-y-4">
            {/* Overall Score */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Overall Score
                </span>
                <span
                  className={`text-2xl font-bold ${getScoreColor(result.overallScore)}`}
                >
                  {Math.round(result.overallScore * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${getScoreBg(result.overallScore)}`}
                  style={{ width: `${result.overallScore * 100}%` }}
                />
              </div>
            </div>

            {/* Category Scores */}
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'Type', score: result.typographyScore, icon: Type },
                { label: 'Space', score: result.spacingScore, icon: Grid },
                { label: 'A11y', score: result.accessibilityScore, icon: Eye },
                { label: 'Color', score: result.colorScore, icon: Palette },
                { label: 'Layout', score: result.layoutScore, icon: Layout },
              ].map(({ label, score, icon: Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <Icon className={`w-4 h-4 mb-1 ${getScoreColor(score)}`} />
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
                    {Math.round(score * 100)}
                  </span>
                </div>
              ))}
            </div>

            {/* WCAG Level */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Accessibility className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  WCAG Compliance
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  result.wcagLevel === 'AAA'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : result.wcagLevel === 'AA'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                Level {result.wcagLevel}
              </span>
            </div>

            {/* Issues by Category */}
            {result.issues.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Issues ({result.issues.length})
                </h3>

                {Object.entries(issuesByCategory).map(([category, issues]) => (
                  <div
                    key={category}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {getCategoryIcon(category as CritiqueCategory)}
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                        <span className="text-gray-400">({issues.length})</span>
                      </div>
                      {expandedCategories.has(category) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>

                    {expandedCategories.has(category) && (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {issues.map(issue => (
                          <div
                            key={issue.id}
                            className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            onClick={() => issue.elementId && onSelectElement?.(issue.elementId)}
                          >
                            <div className="flex items-start gap-2">
                              {getSeverityIcon(issue.severity)}
                              <div className="flex-1">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {issue.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {issue.suggestion}
                                </p>
                                {issue.autoFixable && (
                                  <button className="mt-2 text-xs text-purple-600 dark:text-purple-400 hover:underline">
                                    Auto-fix
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Suggestions
                </h3>
                <div className="space-y-2">
                  {result.suggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                    >
                      <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Issues */}
            {result.issues.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  Great job!
                </p>
                <p className="text-sm text-gray-500">
                  No issues found in your design.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CritiquePanel;
