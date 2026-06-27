/**
 * Barrel for the Kivo STEEP design kit (flat, editorial, premium).
 * Import primitives from '@/components/ui' rather than deep paths.
 *
 * Legacy export names (SoftCard / SoftButton / Neumorph ...) are preserved so
 * existing screens keep compiling; they now render flat Steep components.
 * New code should prefer the Steep names noted below.
 */
export { Neumorph, type NeumorphProps } from './Neumorph';

// Cards — SoftCard is the flat white Card. Card/WarmCard/CoolCard are Steep.
export {
  SoftCard,
  Card,
  WarmCard,
  CoolCard,
  type SoftCardProps,
  type CardProps,
} from './SoftCard';

// Buttons — the single Ink filled pill + TextLink for secondary actions.
export { SoftButton, type SoftButtonProps, type SoftButtonVariant } from './SoftButton';
export { SoftIconButton, type SoftIconButtonProps } from './SoftIconButton';
export { SoftInput, type SoftInputProps } from './SoftInput';
export { SoftToggle, type SoftToggleProps } from './SoftToggle';
export {
  PillButton,
  PillPair,
  TextLink,
  type PillButtonProps,
  type PillVariant,
  type TextLinkProps,
} from './PillButton';

export { Tag, type TagProps, type TagTone } from './Tag';
export { AppText, type AppTextProps } from './Typography';
export {
  DotGridBackground,
  type DotGridBackgroundProps,
} from './DotGridBackground';

// Icon system (phosphor, thin outline)
export { Icon, type IconProps, type IconName } from './Icon';

// App header (small, refined; optional gray brand mark)
export { AppHeader, GrayMark, type AppHeaderProps } from './AppHeader';

// Form primitives
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
