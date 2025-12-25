# StatsCardWidget TDD Test Documentation

## Overview
This document describes the comprehensive TDD test suite for the StatsCardWidget component. Following Test-Driven Development principles, all tests are written FIRST (RED phase) before implementation.

## Test Philosophy
- **RED**: Write failing tests that define expected behavior
- **GREEN**: Implement minimal code to pass tests
- **REFACTOR**: Improve code while keeping tests green

## Test Coverage Summary

### 1. Component Rendering (10 tests)
Tests basic rendering functionality and DOM output:
- ✗ Renders with title prop
- ✗ Renders with custom title text
- ✗ Renders all metric cards in grid layout
- ✗ Renders metric values after data loads
- ✗ Applies responsive grid classes (1/2/4 columns)
- ✗ Renders empty state for no metrics

**Purpose**: Ensures component renders correctly with various props and data states.

### 2. Loading States (3 tests)
Tests loading behavior and skeleton screens:
- ✗ Shows skeleton cards during initial load
- ✗ Hides skeleton cards after data loads
- ✗ Shows loading indicator on refresh button during load

**Purpose**: Validates loading UX and prevents layout shift.

### 3. Real-time Updates (3 tests)
Tests automatic data refresh functionality:
- ✗ Auto-refreshes at default 5-second interval
- ✗ Uses custom refresh interval when provided
- ✗ Stops auto-refresh on component unmount

**Purpose**: Ensures data stays fresh and prevents memory leaks.

### 4. Interactive Controls - Refresh Button (3 tests)
Tests manual refresh functionality:
- ✗ Renders refresh button with proper label
- ✗ Refreshes all metrics when clicked
- ✗ Has accessible ARIA label

**Purpose**: Provides manual control over data updates.

### 5. Interactive Controls - Pause/Resume (5 tests)
Tests play/pause functionality:
- ✗ Renders pause button initially
- ✗ Pauses auto-refresh when clicked
- ✗ Shows resume button after pause
- ✗ Resumes auto-refresh when resume clicked
- ✗ Has accessible ARIA labels

**Purpose**: Allows users to control automatic updates.

### 6. Interactive Controls - Time Period Selector (5 tests)
Tests time period filtering:
- ✗ Renders all period buttons (1h, 24h, 7d, 30d)
- ✗ Highlights initial period when provided
- ✗ Changes active period on button click
- ✗ Refreshes data when period changes
- ✗ Passes selected period to fetchData function

**Purpose**: Enables time-based data filtering.

### 7. Error Handling (5 tests)
Tests error scenarios and recovery:
- ✗ Displays error message on fetch failure
- ✗ Calls onError callback when error occurs
- ✗ Shows error toast notification
- ✗ Allows retry after error
- ✗ Continues auto-refresh after error resolution

**Purpose**: Provides robust error handling and recovery.

### 8. Accessibility (7 tests)
Tests WCAG 2.1 AA compliance:
- ✗ Proper ARIA labels on all interactive elements
- ✗ Region landmark for stats grid
- ✗ Full keyboard navigation support
- ✗ Announces loading state to screen readers
- ✗ Announces errors to screen readers
- ✗ Proper button states for disabled controls
- ✗ Focus management

**Purpose**: Ensures component is accessible to all users.

### 9. Dark Mode Support (2 tests)
Tests dark mode styling:
- ✗ Applies dark mode classes when active
- ✗ Maintains proper contrast in dark mode

**Purpose**: Supports user theme preferences.

### 10. Responsive Layout (3 tests)
Tests responsive grid behavior:
- ✗ Single column on mobile (< 768px)
- ✗ Two columns on tablet (768px - 1024px)
- ✗ Four columns on desktop (>= 1024px)

**Purpose**: Ensures optimal layout across devices.

### 11. Animation Behavior (3 tests)
Tests Framer Motion animations:
- ✗ Animates card entrance on mount
- ✗ Animates value changes
- ✗ Staggered animation for multiple cards

**Purpose**: Provides smooth, professional animations.

### 12. Data Formatting (4 tests)
Tests value formatting and display:
- ✗ Formats values using custom formatter
- ✗ Displays percentage change
- ✗ Shows trend indicator (up/down)
- ✗ Handles negative trend

**Purpose**: Displays data in user-friendly format.

### 13. Component Props Validation (4 tests)
Tests TypeScript prop types:
- ✗ Accepts all required props
- ✗ Accepts optional refreshInterval
- ✗ Accepts optional onError callback
- ✗ Accepts optional initialPeriod

**Purpose**: Validates component API contract.

### 14. Performance Optimizations (3 tests)
Tests performance safeguards:
- ✗ Prevents duplicate fetches while loading
- ✗ Debounces rapid period changes
- ✗ Cleans up timers and subscriptions on unmount

**Purpose**: Prevents unnecessary API calls and memory leaks.

## Total Test Count: 60 Tests

## Test Execution Strategy

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/components/StatsCardWidget.test.tsx

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Expected Initial Result
All 60 tests should **FAIL** because the component is not yet implemented. This is expected and correct for TDD.

### Test Dependencies
- `vitest` - Test runner
- `@testing-library/react` - React component testing utilities
- `@testing-library/user-event` - User interaction simulation
- `@testing-library/jest-dom` - DOM matchers
- `happy-dom` - Lightweight DOM implementation

### Mocked Dependencies
- `framer-motion` - Mocked to avoid animation complexity in tests
- Timer functions (`setInterval`, `setTimeout`) - Controlled via `vi.useFakeTimers()`
- Data fetch functions - Mocked via `vi.fn()`

## Implementation Checklist

Once tests are verified to fail, implement features in this order:

1. [ ] Basic component structure and props
2. [ ] Metric card rendering
3. [ ] Data fetching and state management
4. [ ] Loading states and skeleton screens
5. [ ] Refresh button functionality
6. [ ] Pause/resume controls
7. [ ] Time period selector
8. [ ] Real-time auto-refresh
9. [ ] Error handling and recovery
10. [ ] Responsive grid layout
11. [ ] Dark mode styling
12. [ ] Animations with Framer Motion
13. [ ] Accessibility features (ARIA, keyboard nav)
14. [ ] Performance optimizations
15. [ ] Data formatting and trend indicators

## Key Testing Patterns Used

### 1. Fake Timers
```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});
```
Allows precise control over time-based functionality.

### 2. User Event Simulation
```typescript
const user = userEvent.setup({ delay: null });
await user.click(button);
```
Simulates real user interactions.

### 3. Async Data Loading
```typescript
await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```
Handles asynchronous state updates.

### 4. Mock Functions
```typescript
const mockFetch = vi.fn();
mockFetch.mockResolvedValue({ value: 100 });
```
Isolates component from external dependencies.

### 5. Accessibility Testing
```typescript
expect(button).toHaveAttribute('aria-label');
expect(screen.getByRole('region')).toBeInTheDocument();
```
Ensures WCAG compliance.

## Test Maintenance

### Adding New Tests
1. Write failing test first
2. Verify it fails for the right reason
3. Implement minimal code to pass
4. Refactor if needed
5. Update this documentation

### Updating Existing Tests
- Keep tests isolated and independent
- Avoid test interdependencies
- Mock external dependencies
- Clean up after each test

## Coverage Goals
- **Statements**: > 95%
- **Branches**: > 90%
- **Functions**: > 95%
- **Lines**: > 95%

## Notes for Developers

### Why These Tests Matter
1. **Documentation**: Tests serve as living documentation of component behavior
2. **Confidence**: Refactor fearlessly knowing tests catch regressions
3. **Design**: Writing tests first improves component API design
4. **Quality**: Comprehensive coverage ensures reliability

### Common Pitfalls to Avoid
1. Don't skip the RED phase - verify tests fail first
2. Don't test implementation details - test behavior
3. Don't make tests dependent on each other
4. Don't forget to clean up (timers, mocks, DOM)
5. Don't ignore accessibility tests

### TDD Red-Green-Refactor Cycle
1. **RED**: Run tests and verify they fail (we are here)
2. **GREEN**: Write minimal implementation to pass tests
3. **REFACTOR**: Improve code quality while keeping tests green
4. **REPEAT**: Add new tests for new features

## Next Steps

1. ✓ Write comprehensive failing tests (COMPLETE)
2. → Run tests and verify all failures are expected
3. → Implement StatsCardWidget component to pass tests
4. → Verify all tests pass (GREEN phase)
5. → Refactor for code quality
6. → Document component usage

---

**Last Updated**: 2025-12-24
**Test Suite Version**: 1.0.0
**Component Version**: 0.0.1 (stub)
