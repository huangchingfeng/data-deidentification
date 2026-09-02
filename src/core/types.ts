export type DocFormat = 'txt' | 'md' | 'docx' | 'xlsx' | 'pdf';

export const CATEGORIES = [
  // 原專案內建九類
  '姓名', '身分證', '手機', '市話', '地址', '電子郵件', '公司', '統編', '識別碼',
  // 阿峰版新增：金融
  '信用卡', '銀行帳號', '保單號碼',
  // 阿峰版新增：醫療
  '病歷號', '健保卡號',
  // 阿峰版新增：外籍人士與其他
  '居留證', '護照號碼', '英文姓名', '車牌', '出生日期', '社群帳號', 'IP位址',
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Pattern {
  id: string;
  name: string;
  category: Category;
  source: 'builtin' | 'custom';
  regex: string;
  example: string;
  enabled: boolean;
  /** Builtin-only second-pass filter (e.g. checksum). `before` is the text right before the match. */
  validate?: (match: string, before: string) => boolean;
}

export interface RedactionItem {
  id: string;
  category: Category;
  original: string;
  start: number;
  end: number;
  code: string;
  origin: 'auto' | 'manual';
  active: boolean;
}

export interface MappingEntry {
  code: string;
  category: string;
  original: string;
}

/** A single replacement in the document's full text, expressed in text offsets. */
export interface TextEdit {
  start: number;
  end: number;
  replacement: string;
}

/** Structure of the document expressed in full-text offsets, used only to render a format-aware preview. */
export interface DocxParagraphLayout {
  start: number;
  end: number;
  style: 'title' | 'heading' | 'normal';
  part: 'body' | 'header' | 'footer';
  table?: { id: number; row: number; col: number };
}
export interface XlsxCellLayout {
  start: number;
  end: number;
  row: number;
  col: number;
}
export interface PdfItemLayout {
  start: number;
  end: number;
  x: number;
  y: number;
  fontSize: number;
  width: number;
}
export type DocLayout =
  | { kind: 'docx'; paragraphs: DocxParagraphLayout[] }
  | { kind: 'xlsx'; sheets: { name: string; cells: XlsxCellLayout[] }[] }
  | { kind: 'pdf'; pages: { width: number; height: number; items: PdfItemLayout[] }[] };

export interface LoadedDocument {
  fileName: string;
  format: DocFormat;
  text: string;
  /** Format-specific data needed to regenerate the file with edits applied. */
  handle: unknown;
  /** Present for docx/xlsx/pdf; plain text formats have none. */
  layout?: DocLayout;
}

export interface CustomPatternConfig {
  id: string;
  name: string;
  category: Category;
  regex: string;
  example: string;
  enabled: boolean;
}

export interface PatternConfig {
  version: 1;
  /** 預設開啟的內建規則中，被使用者關掉的。 */
  disabledBuiltins: string[];
  /** 預設關閉的內建規則（誤判率高者）中，被使用者主動打開的。 */
  enabledBuiltins: string[];
  customPatterns: CustomPatternConfig[];
}

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
