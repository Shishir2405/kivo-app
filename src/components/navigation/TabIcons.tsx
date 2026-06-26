import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

/**
 * Minimal stroke icons for the bottom tab bar, drawn inline with
 * react-native-svg so they inherit the active/inactive `color`. They follow the
 * Aaply line-weight language (rounded caps, ~2px stroke). The brand SVG set
 * doesn't include a full nav icon set, so these are the canonical tab glyphs.
 */
export type TabIconProps = {
  color: string;
  size?: number;
  /** Slightly heavier stroke when active. */
  active?: boolean;
};

function sw(active?: boolean): number {
  return active ? 2.4 : 2;
}

/** Dashboard — 2x2 panel grid. */
export function DashboardIcon({ color, size = 24, active }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={7.5} height={7.5} rx={2} stroke={color} strokeWidth={sw(active)} />
      <Rect x={13.5} y={3} width={7.5} height={7.5} rx={2} stroke={color} strokeWidth={sw(active)} />
      <Rect x={3} y={13.5} width={7.5} height={7.5} rx={2} stroke={color} strokeWidth={sw(active)} />
      <Rect x={13.5} y={13.5} width={7.5} height={7.5} rx={2} stroke={color} strokeWidth={sw(active)} />
    </Svg>
  );
}

/** DSA — code brackets. */
export function DsaIcon({ color, size = 24, active }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.5 6 3.5 12l5 6"
        stroke={color}
        strokeWidth={sw(active)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.5 6l5 6-5 6"
        stroke={color}
        strokeWidth={sw(active)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1={13.2} y1={4.5} x2={10.8} y2={19.5} stroke={color} strokeWidth={sw(active)} strokeLinecap="round" />
    </Svg>
  );
}

/** Revisions — circular refresh / repeat arrows. */
export function RevisionsIcon({ color, size = 24, active }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 11a8 8 0 0 0-13.7-5L4 8"
        stroke={color}
        strokeWidth={sw(active)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4 4v4h4" stroke={color} strokeWidth={sw(active)} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M4 13a8 8 0 0 0 13.7 5L20 16"
        stroke={color}
        strokeWidth={sw(active)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M20 20v-4h-4" stroke={color} strokeWidth={sw(active)} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Tracker — bar chart / activity. */
export function TrackerIcon({ color, size = 24, active }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1={6} y1={20} x2={6} y2={13} stroke={color} strokeWidth={sw(active)} strokeLinecap="round" />
      <Line x1={12} y1={20} x2={12} y2={4} stroke={color} strokeWidth={sw(active)} strokeLinecap="round" />
      <Line x1={18} y1={20} x2={18} y2={9} stroke={color} strokeWidth={sw(active)} strokeLinecap="round" />
    </Svg>
  );
}

/** Profile — head + shoulders. */
export function ProfileIcon({ color, size = 24, active }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={sw(active)} />
      <Path
        d="M4.5 20a7.5 7.5 0 0 1 15 0"
        stroke={color}
        strokeWidth={sw(active)}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export const TAB_ICONS = {
  index: DashboardIcon,
  dsa: DsaIcon,
  revisions: RevisionsIcon,
  tracker: TrackerIcon,
  profile: ProfileIcon,
} as const;

export type TabRouteName = keyof typeof TAB_ICONS;
