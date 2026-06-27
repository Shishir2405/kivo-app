import React from 'react';
import {
  // phosphor-react-native v3 exports each glyph as `<Name>Icon`; alias to clean names.
  ArrowLeftIcon as ArrowLeft,
  ArrowRightIcon as ArrowRight,
  AtIcon as At,
  BarbellIcon as Barbell,
  BellIcon as Bell,
  BookOpenIcon as BookOpen,
  BookIcon as Book,
  BookmarkSimpleIcon as BookmarkSimple,
  BrainIcon as Brain,
  CalendarIcon as Calendar,
  CalendarCheckIcon as CalendarCheck,
  CameraIcon as Camera,
  CaretDownIcon as CaretDown,
  CaretLeftIcon as CaretLeft,
  CaretRightIcon as CaretRight,
  CaretUpIcon as CaretUp,
  ChartBarIcon as ChartBar,
  CheckIcon as Check,
  CheckCircleIcon as CheckCircle,
  CheckSquareIcon as CheckSquare,
  CircleIcon as Circle,
  ClipboardTextIcon as ClipboardText,
  ClockIcon as Clock,
  CodeIcon as Code,
  CoffeeIcon as Coffee,
  CompassIcon as Compass,
  CopyIcon as Copy,
  CrownIcon as Crown,
  DotsThreeIcon as DotsThree,
  DotsThreeVerticalIcon as DotsThreeVertical,
  DownloadSimpleIcon as DownloadSimple,
  EnvelopeIcon as Envelope,
  EyeIcon as Eye,
  EyeSlashIcon as EyeSlash,
  FileTextIcon as FileText,
  FlagIcon as Flag,
  FloppyDiskIcon as FloppyDisk,
  FireIcon as Fire,
  FolderIcon as Folder,
  FunnelIcon as Funnel,
  GearIcon as Gear,
  GiftIcon as Gift,
  GlobeIcon as Globe,
  GraduationCapIcon as GraduationCap,
  HashIcon as Hash,
  HeartIcon as Heart,
  HouseIcon as House,
  ImageIcon as ImageIcon,
  InfoIcon as Info,
  LightbulbIcon as Lightbulb,
  LightningIcon as Lightning,
  LinkIcon as Link,
  ListBulletsIcon as ListBullets,
  LockIcon as Lock,
  MagnifyingGlassIcon as MagnifyingGlass,
  MapPinIcon as MapPin,
  MedalIcon as Medal,
  MinusIcon as Minus,
  MinusCircleIcon as MinusCircle,
  MoonIcon as Moon,
  NotePencilIcon as NotePencil,
  PaperPlaneTiltIcon as PaperPlaneTilt,
  PauseIcon as Pause,
  PencilIcon as Pencil,
  PencilSimpleLineIcon as PencilSimpleLine,
  PencilSimpleIcon as PencilSimple,
  PlayIcon as Play,
  PlusIcon as Plus,
  PlusCircleIcon as PlusCircle,
  PulseIcon as Pulse,
  PushPinIcon as PushPin,
  QuestionIcon as Question,
  RepeatIcon as Repeat,
  RocketIcon as Rocket,
  SealCheckIcon as SealCheck,
  ShareNetworkIcon as ShareNetwork,
  SignOutIcon as SignOut,
  SmileyIcon as Smiley,
  SparkleIcon as Sparkle,
  SpeakerHighIcon as SpeakerHigh,
  SquareIcon as Square,
  SquaresFourIcon as SquaresFour,
  StarIcon as Star,
  SunIcon as Sun,
  TagIcon as TagIcon,
  TargetIcon as Target,
  ThumbsUpIcon as ThumbsUp,
  TimerIcon as Timer,
  TrashIcon as Trash,
  TrendUpIcon as TrendUp,
  TrophyIcon as Trophy,
  UploadSimpleIcon as UploadSimple,
  UserIcon as User,
  WalletIcon as Wallet,
  WarningCircleIcon as WarningCircle,
  XIcon as X,
  XCircleIcon as XCircle,
  type Icon as PhosphorIcon,
  type IconWeight,
} from 'phosphor-react-native';
import { type ColorToken, type AppColors } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeContext';

/**
 * The Steep icon registry — FEW, small, thin-outline, monochrome.
 *
 * Keys are stable semantic names (the public API, unchanged from before so
 * screens keep compiling). Values are phosphor-react-native glyphs rendered at
 * the LIGHT weight by default (thin outline). Icons are punctuation: small
 * (~16–18px), Graphite/Ink stroke only. Swap the library here in one place.
 */
const REGISTRY = {
  // Navigation / structure
  home: House,
  layers: SquaresFour,
  list: ListBullets,
  grid: SquaresFour,
  folder: Folder,
  compass: Compass,
  globe: Globe,
  menu: DotsThree,
  'more-horizontal': DotsThree,
  'more-vertical': DotsThreeVertical,

  // Chevrons / arrows
  'chevron-right': CaretRight,
  'chevron-left': CaretLeft,
  'chevron-down': CaretDown,
  'chevron-up': CaretUp,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,

  // Status / checks
  check: Check,
  'check-circle': CheckCircle,
  'check-circle-filled': CheckCircle,
  'check-square': CheckSquare,
  'check-square-filled': CheckSquare,
  'badge-check': SealCheck,
  x: X,
  'x-circle': XCircle,
  plus: Plus,
  'plus-circle': PlusCircle,
  minus: Minus,
  'minus-circle': MinusCircle,
  info: Info,
  alert: WarningCircle,
  help: Question,
  circle: Circle,
  square: Square,

  // Time / habits
  calendar: Calendar,
  'calendar-check': CalendarCheck,
  clock: Clock,
  timer: Timer,
  repeat: Repeat,
  refresh: Repeat,
  rotate: Repeat,
  flame: Fire,

  // Achievement / motivation
  trophy: Trophy,
  award: Medal,
  medal: Medal,
  crown: Crown,
  star: Star,
  target: Target,
  zap: Lightning,
  sparkles: Sparkle,
  'trending-up': TrendUp,
  rocket: Rocket,
  gift: Gift,

  // Learning / content
  book: Book,
  'book-open': BookOpen,
  'notebook-pen': NotePencil,
  brain: Brain,
  lightbulb: Lightbulb,
  'graduation-cap': GraduationCap,
  code: Code,
  'code-xml': Code,
  'file-text': FileText,
  clipboard: ClipboardText,
  dumbbell: Barbell,
  coffee: Coffee,
  chart: ChartBar,
  activity: Pulse,

  // Actions
  edit: PencilSimple,
  'edit-line': PencilSimpleLine,
  pen: Pencil,
  trash: Trash,
  save: FloppyDisk,
  copy: Copy,
  download: DownloadSimple,
  upload: UploadSimple,
  share: ShareNetwork,
  send: PaperPlaneTilt,
  link: Link,
  search: MagnifyingGlass,
  filter: Funnel,
  bookmark: BookmarkSimple,
  pin: PushPin,
  flag: Flag,
  play: Play,
  pause: Pause,
  'volume-up': SpeakerHigh,

  // People / account
  user: User,
  settings: Gear,
  bell: Bell,
  'log-out': SignOut,
  lock: Lock,
  mail: Envelope,
  wallet: Wallet,
  heart: Heart,
  'thumbs-up': ThumbsUp,
  smile: Smiley,
  tag: TagIcon,
  hash: Hash,
  'at-sign': At,

  // Media / misc
  camera: Camera,
  image: ImageIcon,
  'map-pin': MapPin,
  eye: Eye,
  'eye-off': EyeSlash,
  sun: Sun,
  moon: Moon,
} satisfies Record<string, PhosphorIcon>;

/** The full set of valid icon names. */
export type IconName = keyof typeof REGISTRY;

export type IconProps = {
  /** Semantic icon name from the curated registry. */
  name: IconName;
  /** Glyph size in px (square). Kivo default ~18. */
  size?: number;
  /** A color token (e.g. 'ink', 'primary', 'muted') OR any hex/rgba string. Defaults to muted. */
  color?: ColorToken | (string & {});
  /** Phosphor weight. Kivo default is 'regular' (clean outline). */
  weight?: IconWeight;
  /**
   * @deprecated Legacy lucide prop. Mapped onto phosphor `weight`:
   * >= 2.4 → 'regular', otherwise 'light'. Prefer `weight`.
   */
  strokeWidth?: number;
  /**
   * @deprecated Legacy lucide prop. A non-'none' value renders the 'fill'
   * weight. Prefer `weight="fill"`.
   */
  fill?: ColorToken | (string & {});
};

function resolveColor(value: string, palette: AppColors): string {
  // Legacy 'white'/'paper' on icons means "on a filled chip" → use the
  // inverted ink so it stays light on terracotta/ink fills in BOTH themes.
  if (value === 'white' || value === 'paper') return palette.inkInverted;
  return value in palette ? palette[value as ColorToken] : value;
}

/**
 * The single icon wrapper for the whole app (Kivo).
 *
 * Renders a curated phosphor-react-native glyph — clean outline, small, calm.
 * Color tokens resolve against the ACTIVE theme palette (dark-aware); pass a
 * hex/rgba string for anything off-palette (e.g. a wash accent). Always reach
 * for this instead of an emoji or a raw import so the icon language stays
 * consistent and centrally swappable.
 */
export function Icon({
  name,
  size = 18,
  color = 'muted',
  weight,
  strokeWidth,
  fill,
}: IconProps) {
  const { colors } = useTheme();
  const Glyph = REGISTRY[name];

  let resolvedWeight: IconWeight =
    weight ??
    (fill && fill !== 'none'
      ? 'fill'
      : strokeWidth != null && strokeWidth >= 2.4
        ? 'regular'
        : 'regular');

  return <Glyph size={size} color={resolveColor(color, colors)} weight={resolvedWeight} />;
}

export default Icon;
