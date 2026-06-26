/**
 * A tiny, dependency-free Markdown renderer tuned for the Kivo neumorphic look.
 *
 * Supports the subset the Notes mock actually uses:
 *  - `#` / `##` / `###` headings
 *  - fenced ``` code blocks (rendered in an inset "code well" with monospace)
 *  - `> ` blockquotes (accent rail + muted ink)
 *  - `-` / `*` unordered and `1.` ordered lists
 *  - GFM tables (| a | b |)
 *  - paragraphs with inline **bold**, *italic* and `inline code`
 *
 * This is intentionally not a full CommonMark engine — just enough to make the
 * note bodies read beautifully without pulling in a markdown dependency.
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView, type StyleProp, type ViewStyle } from 'react-native';
import { Neumorph } from '@/components/ui/Neumorph';
import { colors, fonts } from '@/theme/tokens';
import type { Accent } from './notesMeta';
import { ACCENT_HEX } from './notesMeta';

const MONO = 'monospace';

type Block =
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'code'; lang: string; lines: string[] }
  | { kind: 'quote'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'table'; header: string[]; rows: string[][] }
  | { kind: 'p'; text: string }
  | { kind: 'space' };

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

function parse(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  const isTableRow = (s: string) => /^\s*\|.*\|\s*$/.test(s);
  const isDivider = (s: string) => /^\s*\|?[\s:|-]+\|?\s*$/.test(s) && s.includes('-');
  const splitCells = (s: string) =>
    s
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1] ?? '';
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        body.push(lines[i]);
        i++;
      }
      i++; // consume closing fence
      blocks.push({ kind: 'code', lang, lines: body });
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      blocks.push({ kind: 'space' });
      i++;
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      blocks.push({ kind: 'heading', level: h[1].length as 1 | 2 | 3, text: h[2].trim() });
      i++;
      continue;
    }

    // Blockquote (collapse consecutive)
    if (/^>\s?/.test(line)) {
      const parts: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        parts.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ kind: 'quote', text: parts.join(' ') });
      continue;
    }

    // Table
    if (isTableRow(line) && i + 1 < lines.length && isDivider(lines[i + 1])) {
      const header = splitCells(line);
      i += 2; // header + divider
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitCells(lines[i]));
        i++;
      }
      blocks.push({ kind: 'table', header, rows });
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }

    // Paragraph (gather until blank / structural line)
    const para: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !isTableRow(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push({ kind: 'p', text: para.join(' ') });
  }

  return blocks;
}

/* ------------------------------------------------------------------ */
/* Inline spans (**bold**, *italic*, `code`)                           */
/* ------------------------------------------------------------------ */

type Span = { text: string; bold?: boolean; italic?: boolean; code?: boolean };

function parseInline(text: string): Span[] {
  const spans: Span[] = [];
  // Split on the three inline tokens, keeping the delimiters.
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) spans.push({ text: text.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith('`')) {
      spans.push({ text: tok.slice(1, -1), code: true });
    } else if (tok.startsWith('**')) {
      spans.push({ text: tok.slice(2, -2), bold: true });
    } else {
      spans.push({ text: tok.slice(1, -1), italic: true });
    }
    last = m.index + tok.length;
  }
  if (last < text.length) spans.push({ text: text.slice(last) });
  return spans;
}

function InlineText({
  text,
  size = 15,
  color = colors.carbon,
  weight,
  lineHeight,
}: {
  text: string;
  size?: number;
  color?: string;
  weight?: string;
  lineHeight?: number;
}) {
  const spans = useMemo(() => parseInline(text), [text]);
  return (
    <Text style={{ fontSize: size, lineHeight: lineHeight ?? size * 1.55, color }}>
      {spans.map((s, idx) => {
        if (s.code) {
          return (
            <Text
              key={idx}
              style={{
                fontFamily: MONO,
                fontSize: size - 1.5,
                color: colors.signal,
                backgroundColor: '#e7ecfb',
              }}
            >
              {` ${s.text} `}
            </Text>
          );
        }
        const fam = s.bold
          ? fonts.bodyBold
          : weight === 'medium'
            ? fonts.bodyMedium
            : fonts.body;
        return (
          <Text
            key={idx}
            style={{
              fontFamily: fam,
              fontStyle: s.italic ? 'italic' : 'normal',
              color,
            }}
          >
            {s.text}
          </Text>
        );
      })}
    </Text>
  );
}

/* ------------------------------------------------------------------ */
/* Code block — inset "code well"                                      */
/* ------------------------------------------------------------------ */

function CodeBlock({ lang, lines }: { lang: string; lines: string[] }) {
  return (
    <View style={{ marginVertical: 8 }}>
      <Neumorph variant="inset" radius={16}>
        <View style={{ backgroundColor: '#1d1d24', borderRadius: 16, overflow: 'hidden' }}>
          {/* Window chrome */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Dot color="#ff5f57" />
              <Dot color="#febc2e" />
              <Dot color="#28c840" />
            </View>
            {lang ? (
              <Text
                style={{
                  fontFamily: fonts.bodyMedium,
                  fontSize: 11,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                {lang}
              </Text>
            ) : null}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, minWidth: '100%' }}>
              {lines.map((ln, idx) => (
                <Text
                  key={idx}
                  style={{
                    fontFamily: MONO,
                    fontSize: 13,
                    lineHeight: 20,
                    color: '#e6e6e6',
                  }}
                >
                  {ln.length ? ln : ' '}
                </Text>
              ))}
            </View>
          </ScrollView>
        </View>
      </Neumorph>
    </View>
  );
}

function Dot({ color }: { color: string }) {
  return <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />;
}

/* ------------------------------------------------------------------ */
/* Table                                                               */
/* ------------------------------------------------------------------ */

function Table({ header, rows }: { header: string[]; rows: string[][] }) {
  return (
    <View
      style={{
        marginVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.hairline,
        overflow: 'hidden',
        backgroundColor: colors.paper,
      }}
    >
      <View style={{ flexDirection: 'row', backgroundColor: '#efefef' }}>
        {header.map((c, idx) => (
          <View key={idx} style={{ flex: 1, padding: 10 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.carbon }}>
              {c}
            </Text>
          </View>
        ))}
      </View>
      {rows.map((row, rIdx) => (
        <View
          key={rIdx}
          style={{
            flexDirection: 'row',
            borderTopWidth: 1,
            borderTopColor: colors.hairline,
          }}
        >
          {row.map((c, cIdx) => (
            <View key={cIdx} style={{ flex: 1, padding: 10 }}>
              <InlineText text={c} size={13} color={colors.textMuted} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Public                                                              */
/* ------------------------------------------------------------------ */

export type MarkdownViewProps = {
  source: string;
  /** Accent used for headings + blockquote rail. */
  accent?: Accent;
  style?: StyleProp<ViewStyle>;
};

const HEADING = {
  1: { size: 22, mt: 10, mb: 6 },
  2: { size: 18, mt: 14, mb: 4 },
  3: { size: 16, mt: 10, mb: 2 },
} as const;

export function MarkdownView({ source, accent = 'highlighter', style }: MarkdownViewProps) {
  const blocks = useMemo(() => parse(source), [source]);
  const rail = ACCENT_HEX[accent] as string;

  return (
    <View style={style}>
      {blocks.map((b, idx) => {
        switch (b.kind) {
          case 'space':
            return <View key={idx} style={{ height: 8 }} />;
          case 'heading': {
            const h = HEADING[b.level];
            return (
              <View
                key={idx}
                style={{
                  marginTop: h.mt,
                  marginBottom: h.mb,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {b.level <= 2 ? (
                  <View
                    style={{
                      width: 4,
                      height: h.size,
                      borderRadius: 2,
                      backgroundColor: rail,
                    }}
                  />
                ) : null}
                <Text
                  style={{
                    flex: 1,
                    fontFamily: fonts.displayBold,
                    fontSize: h.size,
                    letterSpacing: -0.4,
                    color: colors.carbon,
                  }}
                >
                  {b.text}
                </Text>
              </View>
            );
          }
          case 'code':
            return <CodeBlock key={idx} lang={b.lang} lines={b.lines} />;
          case 'quote':
            return (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  marginVertical: 8,
                  paddingVertical: 4,
                }}
              >
                <View style={{ width: 4, borderRadius: 2, backgroundColor: rail }} />
                <View style={{ flex: 1 }}>
                  <InlineText text={b.text} size={15} color={colors.textMuted} />
                </View>
              </View>
            );
          case 'ul':
            return (
              <View key={idx} style={{ marginVertical: 4, gap: 6 }}>
                {b.items.map((it, j) => (
                  <View key={j} style={{ flexDirection: 'row', gap: 10 }}>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        marginTop: 9,
                        backgroundColor: rail,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <InlineText text={it} />
                    </View>
                  </View>
                ))}
              </View>
            );
          case 'ol':
            return (
              <View key={idx} style={{ marginVertical: 4, gap: 6 }}>
                {b.items.map((it, j) => (
                  <View key={j} style={{ flexDirection: 'row', gap: 10 }}>
                    <Text
                      style={{
                        fontFamily: fonts.bodyBold,
                        fontSize: 14,
                        lineHeight: 23,
                        color: colors.carbon,
                        minWidth: 16,
                      }}
                    >
                      {j + 1}.
                    </Text>
                    <View style={{ flex: 1 }}>
                      <InlineText text={it} />
                    </View>
                  </View>
                ))}
              </View>
            );
          case 'table':
            return <Table key={idx} header={b.header} rows={b.rows} />;
          case 'p':
            return (
              <View key={idx} style={{ marginVertical: 3 }}>
                <InlineText text={b.text} />
              </View>
            );
          default:
            return null;
        }
      })}
    </View>
  );
}

export default MarkdownView;
