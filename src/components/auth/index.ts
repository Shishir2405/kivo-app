/**
 * Auth-domain components for the Kivo onboarding flow.
 * Owned by the auth screens (welcome / login / register).
 */
export { AvatarStack, type AvatarStackProps } from './AvatarStack';
export { FeatureRow, type FeatureRowProps, type FeatureItem } from './FeatureRow';
export {
  AuthScaffold,
  type AuthScaffoldProps,
} from './AuthScaffold';
export {
  PasswordField,
  scorePassword,
  type PasswordFieldProps,
  type PasswordStrength,
} from './PasswordField';
export { SwitchAuthLink, type SwitchAuthLinkProps } from './SwitchAuthLink';
export {
  GoogleSignInButton,
  type GoogleSignInButtonProps,
} from './GoogleSignInButton';
