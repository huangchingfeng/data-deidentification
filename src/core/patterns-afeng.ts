/**
 * 阿峰版擴充規則（Autolab / AI峰哥）
 *
 * 原專案內建九類規則涵蓋一般商務文件已經夠用，但企業培訓現場最常被追問的
 * 「我們的客戶資料能不能丟給 AI」，卡點通常在金融、醫療與外籍人士的識別碼——
 * 那才是個資法真正的紅線。這支檔案補的就是那一段。
 *
 * 分級原則：
 *   A 級（有檢核碼或格式唯一）      → 預設開啟，誤判極低
 *   B 級（靠上下文關鍵字錨定）      → 預設開啟，關鍵字不在附近就抓不到
 *   C 級（本質高誤判）              → 預設關閉，開啟前請先讀說明
 *
 * ⚠️ 帶檢核碼的規則（居留證、信用卡）對「打錯字的號碼」會放行。
 *    這是為了壓低誤判率的取捨，也是為什麼人工覆核不能省。
 */
import type { Pattern } from './types';
import {
  isPlausibleBankAccount,
  isPlausibleEnglishName,
  isValidCreditCard,
  isValidResidentId,
} from './validators';

/** 錨點與號碼之間允許的分隔（冒號、全形冒號、空白）。 */
const SEP = '[:：\\s]{0,4}';
/** 錨點前必須是非英數，避免 ONLINE 這種字尾誤觸 LINE 錨點。 */
const ANCHOR_START = '(?<![A-Za-z0-9])';

export const AFENG_PATTERNS: Pattern[] = [
  // ─────────────────────────── A 級 ───────────────────────────
  {
    id: 'tw-resident-id',
    name: '外來人口統一證號（居留證）',
    category: '居留證',
    source: 'builtin',
    // 新式 [A-Z][89]+8碼（2021 起）與舊式 [A-Z][ABCD]+8碼（既有文件仍大量存在）
    regex: '(?<![A-Za-z0-9])[A-Z][89ABCD]\\d{8}(?![\\dA-Za-z])',
    example: 'FA12345689（舊式）、A812345671（新式）',
    enabled: true,
    validate: isValidResidentId,
  },
  {
    id: 'credit-card',
    name: '信用卡號',
    category: '信用卡',
    source: 'builtin',
    // 16 碼四段式或 15 碼 Amex；實際有效性交給 Luhn 檢核
    regex:
      '(?<![\\d-])(?:\\d{4}[-\\x20]?\\d{4}[-\\x20]?\\d{4}[-\\x20]?\\d{4}' +
      '|\\d{4}[-\\x20]?\\d{6}[-\\x20]?\\d{5})(?![\\d-])',
    example: '4532-0151-1283-0366',
    enabled: true,
    validate: isValidCreditCard,
  },
  {
    id: 'tw-plate',
    name: '車牌號碼',
    category: '車牌',
    source: 'builtin',
    regex: '(?<![A-Za-z0-9-])(?:[A-Z]{2,3}-\\d{3,4}|\\d{3,4}-[A-Z]{2,3})(?![A-Za-z0-9-])',
    example: 'ABC-1234、MNB-563',
    enabled: true,
  },
  {
    id: 'ipv4',
    name: 'IP 位址',
    category: 'IP位址',
    source: 'builtin',
    regex:
      '(?<![\\d.])(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}' +
      '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(?![\\d.])',
    example: '192.168.31.45',
    enabled: true,
  },

  // ─────────────────────────── B 級 ───────────────────────────
  {
    id: 'tw-bank-account',
    name: '銀行帳號',
    category: '銀行帳號',
    source: 'builtin',
    regex: `(?<=${ANCHOR_START}(?:匯款帳號|存摺帳號|銀行帳號|帳號|帳戶|戶號|Account\\s*No\\.?)${SEP})\\d[\\d-]{8,18}\\d(?![\\d-])`,
    example: '帳號 0123-456-789012',
    enabled: true,
    validate: isPlausibleBankAccount,
  },
  {
    id: 'tw-policy-no',
    name: '保單號碼',
    category: '保單號碼',
    source: 'builtin',
    regex: `(?<=${ANCHOR_START}(?:保單號碼|保單編號|保單號|保號|Policy\\s*(?:No\\.?|Number)?)${SEP})[A-Z0-9][A-Z0-9-]{5,19}(?![A-Za-z0-9-])`,
    example: '保單號碼 TL2026001234',
    enabled: true,
  },
  {
    id: 'tw-passport',
    name: '護照號碼',
    category: '護照號碼',
    source: 'builtin',
    regex: `(?<=${ANCHOR_START}(?:護照號碼|護照號|護照|Passport\\s*(?:No\\.?|Number)?)${SEP})[A-Z0-9]{6,9}(?![A-Za-z0-9])`,
    example: '護照號碼 312345678',
    enabled: true,
  },
  {
    id: 'tw-chart-no',
    name: '病歷號',
    category: '病歷號',
    source: 'builtin',
    regex: `(?<=${ANCHOR_START}(?:病歷號碼|病歷編號|病歷號|病歷|Chart\\s*No\\.?|MRN)${SEP})[A-Z]{0,3}\\d{4,12}(?![A-Za-z0-9])`,
    example: '病歷號 HN0034521',
    enabled: true,
  },
  {
    id: 'tw-nhi-card',
    name: '健保卡號',
    category: '健保卡號',
    source: 'builtin',
    regex: `(?<=${ANCHOR_START}(?:健保卡號碼|健保卡號|健保卡|健保)${SEP})\\d{12}(?!\\d)`,
    example: '健保卡號 000012345678',
    enabled: true,
  },
  {
    id: 'birth-date',
    name: '出生日期',
    category: '出生日期',
    source: 'builtin',
    regex:
      `(?<=${ANCHOR_START}(?:出生年月日|出生日期|出生日|生日|出生|D\\.?O\\.?B\\.?|Date\\s*of\\s*Birth)[:：\\s]{0,6})` +
      '(?:民國)?\\d{2,4}\\s?[-/年.]\\s?\\d{1,2}\\s?[-/月.]\\s?\\d{1,2}\\s?日?',
    example: '生日 1985/03/12、出生年月日 民國74年3月12日',
    enabled: true,
  },
  {
    id: 'social-handle',
    name: '社群帳號（LINE／微信等）',
    category: '社群帳號',
    source: 'builtin',
    regex: `(?<=${ANCHOR_START}(?:LINE\\s*ID|LINE|微信|WeChat|Skype|Telegram|Instagram)${SEP})[A-Za-z0-9._-]{3,30}(?![A-Za-z0-9._-])`,
    example: 'LINE ID: daming_wang88',
    enabled: true,
  },

  // ─────────────────────────── C 級（預設關閉）───────────────────────────
  {
    id: 'en-name',
    name: '英文姓名（誤判高，預設關閉）',
    category: '英文姓名',
    source: 'builtin',
    // 沒有字典的情況下，Michael Chen 和 Project Alpha 在正規表達式眼裡長得一樣。
    // 內建商務詞停用清單只能擋掉最常見的一批，剩下的靠人工覆核。
    regex: '(?<![A-Za-z])[A-Z][a-z]{1,15}(?:\\s+[A-Z]\\.?)?\\s+[A-Z][a-z]{1,15}(?![A-Za-z])',
    example: 'Michael Chen、Mary J. Wang',
    enabled: false,
    validate: isPlausibleEnglishName,
  },
];
