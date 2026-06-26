import React from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  AtSign,
  Award,
  BadgeCheck,
  Bell,
  Book,
  BookOpen,
  Bookmark,
  Brain,
  CalendarCheck,
  Calendar,
  Camera,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  CircleAlert,
  CircleCheck,
  CircleCheckBig,
  CircleHelp,
  CircleMinus,
  CirclePlus,
  CircleX,
  ClipboardList,
  Clock,
  Code,
  CodeXml,
  Coffee,
  Compass,
  Copy,
  Crown,
  Download,
  Dumbbell,
  Ellipsis,
  EllipsisVertical,
  Eye,
  EyeOff,
  FileText,
  Flag,
  Flame,
  Folder,
  Funnel,
  Gift,
  Globe,
  GraduationCap,
  Grid2x2,
  Hash,
  Heart,
  House,
  Image as ImageIcon,
  Info,
  Layers,
  Lightbulb,
  Link,
  List,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Medal,
  Minus,
  Moon,
  NotebookPen,
  Pause,
  PenLine,
  Pencil,
  Pin,
  Play,
  Plus,
  Repeat,
  RefreshCw,
  RotateCw,
  Rocket,
  Save,
  Search,
  Send,
  Settings,
  Share2,
  Smile,
  Sparkles,
  Square,
  SquareCheck,
  SquareCheckBig,
  SquarePen,
  Star,
  Sun,
  Tag as TagIcon,
  Target,
  ThumbsUp,
  Timer,
  Trash2,
  TrendingUp,
  Trophy,
  Upload,
  User,
  Volume2,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { colors, type ColorToken } from '@/theme/tokens';

/**
 * Curated, app-relevant icon registry.
 *
 * Keys are stable semantic names (the public API). Values are the underlying
 * lucide-react-native glyph. Screens import by semantic name only — if we ever
 * swap the icon library, this map is the single place that changes.
 */
const REGISTRY = {
  // Navigation / structure
  home: House,
  layers: Layers,
  list: List,
  grid: Grid2x2,
  folder: Folder,
  compass: Compass,
  globe: Globe,
  menu: Ellipsis,
  'more-horizontal': Ellipsis,
  'more-vertical': EllipsisVertical,

  // Chevrons / arrows
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,

  // Status / checks
  check: Check,
  'check-circle': CircleCheck,
  'check-circle-filled': CircleCheckBig,
  'check-square': SquareCheck,
  'check-square-filled': SquareCheckBig,
  'badge-check': BadgeCheck,
  x: X,
  'x-circle': CircleX,
  plus: Plus,
  'plus-circle': CirclePlus,
  minus: Minus,
  'minus-circle': CircleMinus,
  info: Info,
  alert: CircleAlert,
  help: CircleHelp,
  circle: Circle,
  square: Square,

  // Time / habits
  calendar: Calendar,
  'calendar-check': CalendarCheck,
  clock: Clock,
  timer: Timer,
  repeat: Repeat,
  refresh: RefreshCw,
  rotate: RotateCw,
  flame: Flame,

  // Achievement / motivation
  trophy: Trophy,
  award: Award,
  medal: Medal,
  crown: Crown,
  star: Star,
  target: Target,
  zap: Zap,
  sparkles: Sparkles,
  'trending-up': TrendingUp,
  rocket: Rocket,
  gift: Gift,

  // Learning / content
  book: Book,
  'book-open': BookOpen,
  'notebook-pen': NotebookPen,
  brain: Brain,
  lightbulb: Lightbulb,
  'graduation-cap': GraduationCap,
  code: Code,
  'code-xml': CodeXml,
  'file-text': FileText,
  clipboard: ClipboardList,
  dumbbell: Dumbbell,
  coffee: Coffee,
  chart: ChartColumn,
  activity: Activity,

  // Actions
  edit: SquarePen,
  'edit-line': Pencil,
  pen: PenLine,
  trash: Trash2,
  save: Save,
  copy: Copy,
  download: Download,
  upload: Upload,
  share: Share2,
  send: Send,
  link: Link,
  search: Search,
  filter: Funnel,
  bookmark: Bookmark,
  pin: Pin,
  flag: Flag,
  play: Play,
  pause: Pause,
  'volume-up': Volume2,

  // People / account
  user: User,
  settings: Settings,
  bell: Bell,
  'log-out': LogOut,
  lock: Lock,
  mail: Mail,
  wallet: Wallet,
  heart: Heart,
  'thumbs-up': ThumbsUp,
  smile: Smile,
  tag: TagIcon,
  hash: Hash,
  'at-sign': AtSign,

  // Media / misc
  camera: Camera,
  image: ImageIcon,
  'map-pin': MapPin,
  eye: Eye,
  'eye-off': EyeOff,
  sun: Sun,
  moon: Moon,
} satisfies Record<string, LucideIcon>;

/** The full set of valid icon names. */
export type IconName = keyof typeof REGISTRY;

export type IconProps = {
  /** Semantic icon name from the curated registry. */
  name: IconName;
  /** Glyph size in px (square). */
  size?: number;
  /** A color token (e.g. 'highlighter') OR any hex/rgba string. Defaults to carbon ink. */
  color?: ColorToken | (string & {});
  /** Stroke width — 2 is the lucide default; 2.5 reads bolder, 1.75 lighter. */
  strokeWidth?: number;
  /** Optional fill for "filled" looks (most lucide icons are stroke-only). */
  fill?: ColorToken | (string & {});
};

function resolveColor(value: string): string {
  return value in colors ? colors[value as ColorToken] : value;
}

/**
 * The single icon wrapper for the whole app.
 *
 * Renders a curated lucide-react-native glyph (built on react-native-svg).
 * Always reach for this instead of an emoji or a raw lucide import so the
 * icon language stays consistent and centrally swappable.
 */
export function Icon({
  name,
  size = 22,
  color = 'carbon',
  strokeWidth = 2,
  fill = 'none',
}: IconProps) {
  const Glyph = REGISTRY[name];
  return (
    <Glyph
      size={size}
      color={resolveColor(color)}
      strokeWidth={strokeWidth}
      fill={fill === 'none' ? 'none' : resolveColor(fill)}
    />
  );
}

export default Icon;
