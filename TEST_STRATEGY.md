# Lumina Studio PDF Suite - Comprehensive Test Strategy

## Overview
This document outlines the comprehensive testing strategy for the Lumina Studio PDF annotation suite, covering unit tests, integration tests, component tests, E2E tests, and performance testing.

## Testing Stack
- **Unit & Integration Tests**: Vitest
- **Component Tests**: React Testing Library + Vitest
- **E2E Tests**: Playwright
- **Performance Tests**: Vitest + Custom Performance Utilities
- **Coverage Target**: 80% minimum

## Test Architecture

### Directory Structure
```
test/
├── unit/                     # Unit tests for services and utilities
│   ├── services/
│   │   ├── pdfService.test.ts
│   │   ├── annotationService.test.ts
│   │   ├── aiAnnotationService.test.ts
│   │   └── voiceNoteService.test.ts
│   ├── hooks/
│   │   ├── usePDFAnnotations.test.ts
│   │   ├── usePDFDocument.test.ts
│   │   └── usePDFHistory.test.ts
│   └── utils/
│       └── pdfUtils.test.ts
├── integration/              # Integration tests
│   ├── supabase/
│   │   ├── annotations.integration.test.ts
│   │   ├── layers.integration.test.ts
│   │   └── collaboration.integration.test.ts
│   └── realtime/
│       └── presence.integration.test.ts
├── component/                # React component tests
│   ├── PDFViewer.test.tsx
│   ├── PDFToolbar.test.tsx
│   ├── LayersPanel.test.tsx
│   ├── RichTextEditor.test.tsx
│   └── VoiceRecorder.test.tsx
├── e2e/                      # End-to-end tests
│   ├── annotation-workflow.spec.ts
│   ├── template-workflow.spec.ts
│   ├── collaboration.spec.ts
│   └── ai-suggestions.spec.ts
├── performance/              # Performance tests
│   ├── large-documents.perf.test.ts
│   ├── annotation-rendering.perf.test.ts
│   └── realtime-sync.perf.test.ts
├── fixtures/                 # Test data and fixtures
│   ├── pdfs/
│   ├── annotations.ts
│   ├── templates.ts
│   └── users.ts
├── mocks/                    # Mock implementations
│   ├── supabase.ts
│   ├── pdf.ts
│   └── ai.ts
├── helpers/                  # Test utilities
│   ├── pdf-helpers.ts
│   ├── render-helpers.tsx
│   └── assertion-helpers.ts
└── setup.ts                  # Global test setup

## 1. Unit Testing Strategy

### Services Testing

#### PDF Service Tests
- Document loading and parsing
- Page rendering and caching
- Text extraction accuracy
- Metadata operations
- Page manipulation (rotate, delete, reorder)

#### Annotation Service Tests
- CRUD operations for all annotation types
- Layer management
- Z-index ordering
- Annotation serialization/deserialization
- Batch operations

#### AI Annotation Service Tests
- Suggestion generation
- Context analysis
- Confidence scoring
- Error handling for API failures

#### Voice Note Service Tests
- Recording state management
- Audio format conversion
- Transcription integration
- Storage and retrieval

### Hooks Testing

#### usePDFAnnotations Tests
- Adding annotations
- Updating properties
- Deleting annotations
- Selection management
- Filtering by page/type
- Reply management

#### usePDFDocument Tests
- Document loading
- Page navigation
- Zoom controls
- Rotation handling
- Error states

### Test Coverage Goals
- Services: 85%+
- Hooks: 80%+
- Utilities: 90%+

## 2. Integration Testing Strategy

### Supabase Integration
- Real-time annotation sync
- Conflict resolution
- Offline mode handling
- Database schema validation
- RLS policy validation

### Collaboration Features
- Presence tracking
- Cursor sharing
- Annotation conflicts
- Permission management
- User mentions

### Test Data Management
- Setup: Create test database schema
- Teardown: Clean up test data
- Isolation: Each test has isolated data

## 3. Component Testing Strategy

### Component Test Focus Areas

#### PDFViewer Component
- Canvas rendering
- Annotation overlays
- Tool interactions
- Keyboard shortcuts
- Accessibility

#### LayersPanel Component
- Layer creation
- Visibility toggle
- Reordering
- Locking
- Deletion

#### RichTextEditor Component
- Text formatting
- Inline styles
- Link insertion
- Undo/redo
- Paste handling

#### VoiceRecorder Component
- Recording controls
- Waveform visualization
- Playback
- Transcription display

### Interaction Testing
- User events (click, drag, keyboard)
- Form submissions
- State updates
- Error boundaries

## 4. E2E Testing Strategy

### Critical User Workflows

#### Annotation Creation Workflow
1. Load PDF document
2. Select annotation tool
3. Create annotation
4. Edit properties
5. Save to database
6. Verify persistence

#### Template Application Workflow
1. Open template gallery
2. Select template
3. Apply to document
4. Customize fields
5. Save as new template

#### Collaboration Workflow
1. User A creates annotation
2. User B sees update in real-time
3. User B adds reply
4. User A receives notification
5. Conflict resolution

#### AI Suggestion Workflow
1. Request AI suggestions
2. Review suggestions
3. Accept/reject individual items
4. Apply accepted changes
5. Verify accuracy

### Cross-Browser Testing
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest version)
- Edge (latest version)

### Device Testing
- Desktop (1920x1080, 1366x768)
- Tablet (iPad, Android tablet)
- Mobile (iPhone, Android phone)

## 5. Performance Testing Strategy

### Performance Metrics

#### Load Performance
- Document load time < 2s (10-page PDF)
- Initial render < 500ms
- Annotation render < 100ms per annotation

#### Runtime Performance
- Scrolling: 60fps maintained
- Annotation drag: < 16ms per frame
- Search: < 500ms for 100-page document

#### Memory Management
- No memory leaks during 30min session
- Garbage collection efficiency
- Canvas resource cleanup

### Large Document Testing
- 100-page documents
- 1000+ annotations
- Real-time collaboration with 10+ users

### Stress Testing
- Rapid annotation creation
- Concurrent edits
- Network latency simulation
- Database connection drops

## 6. Test Data Strategy

### Fixtures
- Sample PDFs (various sizes, content types)
- Annotation datasets (all types, edge cases)
- User profiles (different permissions)
- Templates (common use cases)

### Factory Functions
```typescript
createAnnotation(overrides?: Partial<Annotation>)
createLayer(overrides?: Partial<Layer>)
createTemplate(overrides?: Partial<Template>)
createUser(overrides?: Partial<User>)
```

### Data Generation
- Realistic annotation patterns
- Edge cases (empty, very long text, special chars)
- Boundary conditions

## 7. Mock Strategy

### Supabase Mocking
- In-memory database simulation
- Realtime subscription mocking
- Storage API mocking
- Auth context mocking

### PDF.js Mocking
- Document proxy mocking
- Page rendering simulation
- Text content generation

### AI Service Mocking
- Predictable suggestions
- Configurable response times
- Error scenarios

## 8. CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  unit-tests:
    - Install dependencies
    - Run Vitest unit tests
    - Upload coverage

  component-tests:
    - Run React Testing Library tests
    - Generate coverage report

  e2e-tests:
    - Run Playwright tests
    - Record videos on failure
    - Upload artifacts

  performance-tests:
    - Run performance benchmarks
    - Compare with baseline
    - Fail if regression > 10%
```

### Quality Gates
- All tests must pass
- Coverage ≥ 80%
- No performance regressions
- No critical accessibility violations

## 9. Test Execution Strategy

### Local Development
```bash
npm test                    # Run all tests in watch mode
npm run test:unit          # Unit tests only
npm run test:component     # Component tests only
npm run test:e2e          # E2E tests (headed mode)
npm run test:coverage     # Generate coverage report
npm run test:perf         # Run performance benchmarks
```

### CI Pipeline
- Unit tests: Run on every commit
- Component tests: Run on every commit
- Integration tests: Run on every PR
- E2E tests: Run on PR to main
- Performance tests: Run nightly

### Test Parallelization
- Split by test suite
- Utilize multiple workers
- Optimize for fastest feedback

## 10. Maintenance Strategy

### Test Health Monitoring
- Track flaky tests
- Monitor execution time
- Update mocks with API changes
- Refactor brittle tests

### Documentation
- Update test plan quarterly
- Document complex test scenarios
- Maintain mock data catalog

### Test Reviews
- Include tests in code review
- Validate test quality
- Ensure proper coverage

## Success Metrics

### Quantitative
- Test coverage: 80%+
- Test execution time: < 5 min (unit + component)
- Flaky test rate: < 2%
- Bug escape rate: < 5%

### Qualitative
- Tests are easy to understand
- Tests catch real bugs
- Tests don't slow development
- Confidence in deployments

## Risk Mitigation

### High-Risk Areas
1. Real-time collaboration conflicts
2. Large document performance
3. Cross-browser compatibility
4. Mobile touch interactions
5. AI service reliability

### Testing Approach
- Extra coverage for high-risk areas
- Chaos testing for collaboration
- Performance profiling
- Visual regression testing
- Fallback behavior testing
