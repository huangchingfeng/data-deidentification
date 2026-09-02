import { describe, expect, it } from 'vitest';
import { detect } from '../../src/core/detector';
import { applyRedactions } from '../../src/core/redactor';
import { restore } from '../../src/core/restorer';
import { serializeMapping, parseMapping } from '../../src/core/csv';
import { parseMarkers } from '../../src/core/codes';
import { BUILTIN_PATTERNS } from '../../src/core/patterns';

/**
 * 阿峰版新增的類別必須能走完「偵測 → 遮罩輸出 → CSV 編碼表 → 還原」整條路。
 * 類別名稱會進到 [類別:編碼] 標記裡，若命名超出標記格式上限就會在還原時斷掉。
 */
const ORIGINAL = [
  '【客戶資料表】',
  '姓名：王大明　身分證 A123456789　手機 0912-345-678',
  '外籍配偶居留證號 FA12345689，新式統一證號 A812345671',
  '護照號碼 312345678　出生日期 1985/03/12',
  '匯款帳號 0123-456-789012　信用卡 4532-0151-1283-0366',
  '保單號碼 TL2026001234　病歷號 HN0034521　健保卡號 000012345678',
  '車牌 ABC-1234　LINE ID: daming_wang88　IP 192.168.31.45',
].join('\n');

describe('阿峰版類別的完整往返', () => {
  it('偵測涵蓋所有新增類別', () => {
    const items = detect(ORIGINAL, BUILTIN_PATTERNS);
    const cats = new Set(items.map((i) => i.category));
    for (const expected of [
      '居留證', '護照號碼', '銀行帳號', '信用卡', '保單號碼',
      '病歷號', '健保卡號', '車牌', '出生日期', '社群帳號', 'IP位址',
    ]) {
      expect(cats, `未偵測到類別：${expected}`).toContain(expected);
    }
  });

  it('輸出文字不殘留任何原始敏感值', () => {
    const items = detect(ORIGINAL, BUILTIN_PATTERNS);
    const { redactedText } = applyRedactions(ORIGINAL, items);
    for (const orig of new Set(items.filter((i) => i.active).map((i) => i.original))) {
      expect(redactedText.includes(orig), `殘留原文：${orig}`).toBe(false);
    }
  });

  it('每筆遮罩都產生可解析的標記', () => {
    const items = detect(ORIGINAL, BUILTIN_PATTERNS);
    const { redactedText, mapping } = applyRedactions(ORIGINAL, items);
    expect(parseMarkers(redactedText).length).toBe(mapping.length);
  });

  it('經 CSV 編碼表可還原成與原文完全一致', () => {
    const items = detect(ORIGINAL, BUILTIN_PATTERNS);
    const { redactedText, mapping } = applyRedactions(ORIGINAL, items);
    const csv = serializeMapping(mapping);
    const { entries, errors } = parseMapping(csv);
    expect(errors).toEqual([]);
    const result = restore(redactedText, entries);
    expect(result.restoredText).toBe(ORIGINAL);
    expect(result.missingCodes).toEqual([]);
    expect(result.restoredCount).toBe(mapping.length);
  });
});
