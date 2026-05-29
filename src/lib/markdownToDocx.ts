import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  LevelFormat,
  TabStopType,
  TabStopPosition,
  Header,
  Footer,
  PageNumber,
  SectionType,
} from "docx";
import { saveAs } from "file-saver";

interface ParsedBlock {
  type: "heading1" | "heading2" | "heading3" | "paragraph" | "bullet" | "numbered" | "hr" | "blockquote";
  runs: ParsedRun[];
  raw?: string;
}

interface ParsedRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

function parseInlineFormatting(text: string): ParsedRun[] {
  const runs: ParsedRun[] = [];
  // Match **bold**, *italic*, ***bold+italic***, __underline__
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ text: text.slice(lastIndex, match.index) });
    }
    if (match[2]) {
      runs.push({ text: match[2], bold: true, italic: true });
    } else if (match[3]) {
      runs.push({ text: match[3], bold: true });
    } else if (match[4]) {
      runs.push({ text: match[4], italic: true });
    } else if (match[5]) {
      runs.push({ text: match[5], underline: true });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    runs.push({ text: text.slice(lastIndex) });
  }

  if (runs.length === 0 && text) {
    runs.push({ text });
  }

  return runs;
}

function parseMarkdownToBlocks(markdown: string): ParsedBlock[] {
  const lines = markdown.split("\n");
  const blocks: ParsedBlock[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) continue;

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "hr", runs: [] });
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "heading3", runs: parseInlineFormatting(trimmed.slice(4)) });
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "heading2", runs: parseInlineFormatting(trimmed.slice(3)) });
      continue;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push({ type: "heading1", runs: parseInlineFormatting(trimmed.slice(2)) });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      blocks.push({ type: "blockquote", runs: parseInlineFormatting(trimmed.slice(2)) });
      continue;
    }

    // Bullet list
    if (/^[-*+]\s/.test(trimmed)) {
      blocks.push({ type: "bullet", runs: parseInlineFormatting(trimmed.replace(/^[-*+]\s/, "")) });
      continue;
    }

    // Numbered list
    if (/^\d+[\.\)]\s/.test(trimmed)) {
      const content = trimmed.replace(/^\d+[\.\)]\s/, "");
      blocks.push({ type: "numbered", runs: parseInlineFormatting(content) });
      continue;
    }

    // Regular paragraph
    blocks.push({ type: "paragraph", runs: parseInlineFormatting(trimmed) });
  }

  return blocks;
}

function createDocxRuns(runs: ParsedRun[], overrides?: Partial<{ bold: boolean; italic: boolean; font: string; size: number; color: string }>): TextRun[] {
  return runs.map(
    (r) =>
      new TextRun({
        text: r.text,
        bold: overrides?.bold ?? r.bold,
        italics: overrides?.italic ?? r.italic,
        underline: r.underline ? {} : undefined,
        font: overrides?.font ?? "Calibri",
        size: overrides?.size ?? 22, // 11pt
        color: overrides?.color,
      })
  );
}

export async function exportMarkdownAsDocx(markdown: string, filename: string) {
  const blocks = parseMarkdownToBlocks(markdown);
  const children: Paragraph[] = [];

  let numberedIndex = 0;

  for (const block of blocks) {
    switch (block.type) {
      case "heading1":
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 200 },
            children: createDocxRuns(block.runs, { bold: true, font: "Calibri", size: 32, color: "1F2937" }),
          })
        );
        numberedIndex = 0;
        break;

      case "heading2":
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 280, after: 160 },
            children: createDocxRuns(block.runs, { bold: true, font: "Calibri", size: 26, color: "374151" }),
          })
        );
        numberedIndex = 0;
        break;

      case "heading3":
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 120 },
            children: createDocxRuns(block.runs, { bold: true, font: "Calibri", size: 24, color: "4B5563" }),
          })
        );
        numberedIndex = 0;
        break;

      case "hr":
        children.push(
          new Paragraph({
            spacing: { before: 200, after: 200 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "D1D5DB", space: 1 },
            },
            children: [],
          })
        );
        break;

      case "blockquote":
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 100 },
            indent: { left: 720 },
            border: {
              left: { style: BorderStyle.SINGLE, size: 12, color: "9CA3AF", space: 8 },
            },
            children: createDocxRuns(block.runs, { italic: true, color: "6B7280" }),
          })
        );
        break;

      case "bullet":
        children.push(
          new Paragraph({
            numbering: { reference: "bullets", level: 0 },
            spacing: { before: 60, after: 60 },
            children: createDocxRuns(block.runs),
          })
        );
        break;

      case "numbered":
        numberedIndex++;
        children.push(
          new Paragraph({
            numbering: { reference: "numbering", level: 0 },
            spacing: { before: 60, after: 60 },
            children: createDocxRuns(block.runs),
          })
        );
        break;

      case "paragraph":
      default:
        children.push(
          new Paragraph({
            spacing: { before: 80, after: 80 },
            children: createDocxRuns(block.runs),
          })
        );
        break;
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 32, bold: true, font: "Calibri", color: "1F2937" },
          paragraph: { spacing: { before: 360, after: 200 } },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 26, bold: true, font: "Calibri", color: "374151" },
          paragraph: { spacing: { before: 280, after: 160 } },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 24, bold: true, font: "Calibri", color: "4B5563" },
          paragraph: { spacing: { before: 200, after: 120 } },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
              },
            },
          ],
        },
        {
          reference: "numbering",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "Generated by FineClause",
                    font: "Calibri",
                    size: 16,
                    color: "9CA3AF",
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
                    font: "Calibri",
                    size: 16,
                    color: "9CA3AF",
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename.endsWith(".docx") ? filename : `${filename}.docx`);
}
