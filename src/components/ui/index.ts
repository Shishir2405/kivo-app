/**
 * Barrel for the Kivo neumorphic design kit.
 * Import primitives from '@/components/ui' rather than deep paths.
 */
export { Neumorph, type NeumorphProps } from './Neumorph';
export { SoftCard, type SoftCardProps } from './SoftCard';
export { SoftButton, type SoftButtonProps, type SoftButtonVariant } from './SoftButton';
export { SoftIconButton, type SoftIconButtonProps } from './SoftIconButton';
export { SoftInput, type SoftInputProps } from './SoftInput';
export { SoftToggle, type SoftToggleProps } from './SoftToggle';
export {
  PillButton,
  PillPair,
  type PillButtonProps,
  type PillVariant,
} from './PillButton';
export { Tag, type TagProps, type TagTone } from './Tag';
export { AppText, type AppTextProps } from './Typography';
export {
  DotGridBackground,
  type DotGridBackgroundProps,
} from './DotGridBackground';

// Icon system
export { Icon, type IconProps, type IconName } from './Icon';

// App header (gray brand watermark near the status bar)
export { AppHeader, GrayMark, type AppHeaderProps } from './AppHeader';

// Custom neumorphic form primitives
export { Checkbox, type CheckboxProps } from './Checkbox';
export {
  Select,
  type SelectProps,
  type SelectOption,
} from './Select';
export {
  SegmentedTabs,
  type SegmentedTabsProps,
  type SegmentedOption,
} from './SegmentedTabs';
export {
  Chip,
  ChipGroup,
  type ChipProps,
  type ChipGroupProps,
  type ChipOption,
} from './Chip';
export { Stepper, type StepperProps } from './Stepper';
