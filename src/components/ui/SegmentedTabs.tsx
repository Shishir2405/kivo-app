/**
 * SegmentedTabs — now a thin re-export of the NEW {@link SegmentedControl}.
 *
 * The old measured-slide implementation rendered inconsistently (cache + layout
 * desync), so every `import { SegmentedTabs }` now resolves to the rebuilt
 * SegmentedControl (bulletproof flex layout, clear active state in light + dark).
 * Kept as an alias so existing call sites don't need to change.
 */
export {
  SegmentedControl as SegmentedTabs,
  SegmentedControl as default,
  type SegmentedControlProps as SegmentedTabsProps,
  type SegmentedOption,
} from './SegmentedControl';
