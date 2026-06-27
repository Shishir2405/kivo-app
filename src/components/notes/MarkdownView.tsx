/**
 * A tiny, dependency-free Markdown renderer tuned for the STEEP look.
 *
 * Editorial + flat: serif headings, Inter body, a Fog "code well" with a Dove
 * hairline (no dark window chrome), a Rust rail on blockquotes/headings (the one
 * warm key-data stroke), small compact spacing. Supports the subset the notes
 * actually use:
 *  - `#` / `##` / `###` headings
 *  - fenced ``` code blocks
 *  - `> ` blockquotes
 *  - `-` / `*` unordered and `1.` ordered lists
 *  - GFM tables (| a | b |)
 *  - paragraphs with inline **bold**, *italic* and `inline code`
 *
 * Intentionally not a full CommonMark engine — just enough to make note bodies
 * read beautifully without a markdown dependency.
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

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
  size = 13,
  color = colors.ash,
  lineHeight,
}: {
  text: string;
  size?: number;
  color?: string;
  lineHeight?: number;
}) {
  const spans = useMemo(() => parseInline(text), [text]);
  return (
    <Text style={{ fontSize: size, lineHeight: lineHeight ?? size * 1.55, color, letterSpacing: -0.1 }}>
      {spans.map((s, idx) => {
        if (s.code) {
          return (
            <Text
              key={idx}
              style={{
                fontFamily: MONO,
                fontSize: size - 1,
                color: colors.rust,
              }}
            >
              {` ${s.text} `}
            </Text>
          );
        }
        const fam = s.bold ? fonts.sansMedium : fonts.sans;
        return (
          <Text
            key={idx}
            style={{
              fontFamily: fam,
              fontStyle: s.italic ? 'italic' : 'normal',
              color: s.bold ? colors.ink : color,
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
/* Code block — flat Fog well, Dove hairline                           */
/* ------------------------------------------------------------------ */

function CodeBlock({ lang, lines }: { lang: string; lines: string[] }) {
  return (
    <View
      style={{
        marginVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.dove,
        backgroundColor: colors.fog,
        overflow: 'hidden',
      }}
    >
      {lang ? (
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderBottomWidth: 1,
            borderBottomColor: colors.dove,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.sansMedium,
              fontSize: 10,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: colors.graphite,
            }}
          >
            {lang}
          </Text>
        </View>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 12, paddingVertical: 10, minWidth: '100%' }}>
          {lines.map((ln, idx) => (
            <Text
              key={idx}
              style={{
                fontFamily: MONO,
                fontSize: 12,
                lineHeight: 19,
                color: colors.ink,
              }}
            >
              {ln.length ? ln : ' '}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Table                                                               */
/* ------------------------------------------------------------------ */

function Table({ header, rows }: { header: string[]; rows: string[][] }) {
  return (
    <View
      style={{
        marginVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.dove,
        overflow: 'hidden',
        backgroundColor: colors.white,
      }}
    >
      <View style={{ flexDirection: 'row', backgroundColor: colors.fog }}>
        {header.map((c, idx) => (
          <View key={idx} style={{ flex: 1, padding: 9 }}>
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink }}>
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
            borderTopColor: colors.fog,
          }}
        >
          {row.map((c, cIdx) => (
            <View key={cIdx} style={{ flex: 1, padding: 9 }}>
              <InlineText text={c} size={12} color={colors.ash} />
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
  /** Kept for back-compat; Steep always uses the single Rust rail. */
  accent?: string;
  style?: StyleProp<ViewStyle>;
};

const HEADING = {
  1: { size: 19, mt: 10, mb: 4 },
  2: { size: 16, mt: 12, mb: 3 },
  3: { size: 14, mt: 8, mb: 2 },
} as const;

export function MarkdownView({ source, style }: MarkdownViewProps) {
  const blocks = useMemo(() => parse(source), [source]);
  const rail = colors.rust;

  return (
    <View style={style}>
      {blocks.map((b, idx) => {
        switch (b.kind) {
          case 'space':
            return <View key={idx} style={{ height: 6 }} />;
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
                  <View style={{ width: 3, height: h.size, borderRadius: 2, backgroundColor: rail }} />
                ) : null}
                <Text
                  style={{
                    flex: 1,
                    fontFamily: b.level === 1 ? fonts.serifSemibold : fonts.serifMedium,
                    fontSize: h.size,
                    letterSpacing: -0.3,
                    color: colors.ink,
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
                style={{ flexDirection: 'row', gap: 10, marginVertical: 6, paddingVertical: 2 }}
              >
                <View style={{ width: 3, borderRadius: 2, backgroundColor: rail }} />
                <View style={{ flex: 1 }}>
                  <InlineText text={b.text} size={13} color={colors.graphite} />
                </View>
              </View>
            );
          case 'ul':
            return (
              <View key={idx} style={{ marginVertical: 3, gap: 5 }}>
                {b.items.map((it, j) => (
                  <View key={j} style={{ flexDirection: 'row', gap: 9 }}>
                    <View
                      style={{ width: 5, height: 5, borderRadius: 3, marginTop: 8, backgroundColor: rail }}
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
              <View key={idx} style={{ marginVertical: 3, gap: 5 }}>
                {b.items.map((it, j) => (
                  <View key={j} style={{ flexDirection: 'row', gap: 9 }}>
                    <Text
                      style={{
                        fontFamily: fonts.sansMedium,
                        fontSize: 13,
                        lineHeight: 20,
                        color: colors.rust,
                        minWidth: 15,
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
              <View key={idx} style={{ marginVertical: 2 }}>
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
