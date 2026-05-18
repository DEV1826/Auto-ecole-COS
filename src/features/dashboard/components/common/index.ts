/**
 * @module features/dashboard/components/common
 * @description Composants communs pour le tableau de bord  Auto-École COS.
 */

export { ActivityChart } from './ActivityChart';
export type { ActivityChartProps, ActivityChartType } from './ActivityChart';

export { DateRangePicker } from './DateRangePicker';
export type { DateRangePickerProps, CalendarEvent } from './DateRangePicker';

export { EmptyState } from './EmptyState';
export type {
  EmptyStateProps,
  EmptyStateAction,
  EmptyStateVariant,
  EmptyStateSize,
} from './EmptyState';

export { LoadingSkeleton } from './LoadingSkeleton';
export type { LoadingSkeletonProps, SkeletonType } from './LoadingSkeleton';

export { StatsCard } from './StatsCard';
export type { StatsCardProps } from './StatsCard';

export { WelcomeHeader } from './WelcomeHeader';
export type { WelcomeHeaderProps, WelcomeAction, ContextSegment } from './WelcomeHeader';
