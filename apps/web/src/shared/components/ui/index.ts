/** Barrel for the shared UI kit. Import from `@/shared/components/ui`. */

export { Alert, type AlertProps, type AlertTone } from './alert';
export { Badge, type BadgeProps, type BadgeTone } from './badge';
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from './button';
export { Card, CardHeader, type CardHeaderProps, type CardProps } from './card';
export { ConfirmDialog, type ConfirmDialogProps, type ConfirmTone } from './confirm-dialog';
export { EmptyState, type EmptyStateProps } from './empty-state';
export { ErrorState, type ErrorStateProps } from './error-state';
export { FormField, useFieldContext, type FormFieldProps } from './form-field';
export { Input, PasswordInput, type InputProps, type PasswordInputProps } from './input';
export { Modal, type ModalProps, type ModalSize } from './modal';
export { Pagination, buildPageRange, type PaginationProps } from './pagination';
export { SearchInput, type SearchInputProps } from './search-input';
export { Select, type SelectOption, type SelectProps } from './select';
export {
  CardSkeleton,
  ChartSkeleton,
  Skeleton,
  SkeletonRegion,
  TableSkeleton,
  type SkeletonProps,
} from './skeleton';
export {
  Table,
  TableAvatar,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrapper,
  type TableProps,
} from './table';
export { Textarea, type TextareaProps } from './textarea';
export {
  ToastItem,
  ToastProvider,
  ToastViewport,
  useToast,
  type Toast,
  type ToastTone,
} from './toast';
export { ToggleSwitch, type ToggleSwitchProps } from './toggle-switch';
