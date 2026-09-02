import { describe, it, expect } from 'vitest';
import { BUILTIN_PATTERNS } from '../../src/core/patterns';
import { AFENG_PATTERNS } from '../../src/core/patterns-afeng';
import { compilePattern, detect } from '../../src/core/detector';
import { maskDisplay } from '../../src/core/mask';
import { CATEGORIES, type Pattern } from '../../src/core/types';

function getPattern(id: string): Pattern {
  const p = BUILTIN_PATTERNS.find((x) => x.id === id);
  if (!p) throw new Error(`pattern not found: ${id}`);
  return p;
}

/** 單獨啟用某條規則來比對，避免其他規則的最長匹配干擾測試。 */
function matches(id: string, text: string): string[] {
  return detect(text, [{ ...getPattern(id), enabled: true }]).map((i) => i.original);
}

describe('阿峰版規則整體健檢', () => {
  it('每一條規則都能用 gu 旗標編譯（避免瀏覽器端靜默失效）', () => {
    for (const p of BUILTIN_PATTERNS) {
      expect(compilePattern(p), `規則編譯失敗：${p.id}`).not.toBeNull();
    }
  });

  it('所有規則的 id 不重複', () => {
    const ids = BUILTIN_PATTERNS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('所有規則的 category 都在 CATEGORIES 清單內', () => {
    for (const p of BUILTIN_PATTERNS) {
      expect(CATEGORIES, `未登錄的類別：${p.category}`).toContain(p.category);
    }
  });

  it('每個類別都有對應的遮罩樣式（不會落回預設值就是有處理）', () => {
    for (const p of AFENG_PATTERNS) {
      const masked = maskDisplay(p.category, 'ABCDEFGH1234');
      expect(masked.length).toBeGreaterThan(0);
      expect(masked).not.toBe('ABCDEFGH1234'); // 一定要有遮住東西
    }
  });

  it('類別名稱長度符合編碼標記格式上限（10 字元）', () => {
    for (const c of CATEGORIES) expect(c.length).toBeLessThanOrEqual(10);
  });

  it('只有明確標示高誤判的規則預設關閉', () => {
    const off = AFENG_PATTERNS.filter((p) => p.enabled === false).map((p) => p.id);
    expect(off).toEqual(['en-name']);
  });
});

describe('居留證（外來人口統一證號）', () => {
  it('抓到有效的新式與舊式證號', () => {
    expect(matches('tw-resident-id', '統一證號 A812345671')).toEqual(['A812345671']);
    expect(matches('tw-resident-id', '居留證號 FA12345689 到期日')).toEqual(['FA12345689']);
  });

  it('檢核碼錯誤者放行（壓低誤判的取捨，需靠人工覆核補）', () => {
    expect(matches('tw-resident-id', '無效 AB12345678')).toEqual([]);
  });

  it('不誤抓國民身分證（那是 tw-id 的守備範圍）', () => {
    expect(matches('tw-resident-id', '身分證 A123456789')).toEqual([]);
  });
});

describe('信用卡號', () => {
  it('抓到四段式與連續式卡號', () => {
    expect(matches('credit-card', '信用卡 4532-0151-1283-0366，有效期 09/28')).toEqual(['4532-0151-1283-0366']);
    expect(matches('credit-card', '卡號4532015112830366。')).toEqual(['4532015112830366']);
  });

  it('抓到 15 碼 Amex', () => {
    expect(matches('credit-card', '卡號 3782-822463-10005')).toEqual(['3782-822463-10005']);
  });

  it('Luhn 不過的 16 位訂單編號不會被誤抓', () => {
    expect(matches('credit-card', '訂單編號 1234567812345678')).toEqual([]);
  });

  it('不會把 8 位統一編號誤判成卡號', () => {
    expect(matches('credit-card', '統一編號 12345675')).toEqual([]);
  });
});

describe('銀行帳號（需上下文錨定）', () => {
  it('有「帳號」二字才抓，且不含錨點本身', () => {
    expect(matches('tw-bank-account', '匯款帳號 0123-456-789012')).toEqual(['0123-456-789012']);
    expect(matches('tw-bank-account', '帳戶：12345678901234')).toEqual(['12345678901234']);
  });

  it('沒有錨點就不抓（recall 換 precision 的取捨）', () => {
    expect(matches('tw-bank-account', '編號 12345678901234')).toEqual([]);
  });

  it('不會把統一編號誤抓成帳號', () => {
    expect(matches('tw-bank-account', '統一編號 12345675')).toEqual([]);
  });
});

describe('保單號碼 / 護照 / 病歷號 / 健保卡號', () => {
  it('保單號碼', () => {
    expect(matches('tw-policy-no', '保單號碼 TL2026001234')).toEqual(['TL2026001234']);
    expect(matches('tw-policy-no', 'Policy No. AB-998877')).toEqual(['AB-998877']);
  });

  it('護照號碼', () => {
    expect(matches('tw-passport', '護照號碼 312345678。')).toEqual(['312345678']);
    expect(matches('tw-passport', 'Passport No. AB123456')).toEqual(['AB123456']);
  });

  it('病歷號', () => {
    expect(matches('tw-chart-no', '病歷號 HN0034521。')).toEqual(['HN0034521']);
    expect(matches('tw-chart-no', '病歷編號：0034521')).toEqual(['0034521']);
  });

  it('健保卡號', () => {
    expect(matches('tw-nhi-card', '健保卡號 000012345678')).toEqual(['000012345678']);
  });

  it('沒有錨點一律不抓', () => {
    expect(matches('tw-passport', '流水號 312345678')).toEqual([]);
    expect(matches('tw-chart-no', '單號 HN0034521')).toEqual([]);
  });
});

describe('車牌 / 出生日期 / 社群帳號 / IP', () => {
  it('車牌抓台灣常見格式', () => {
    expect(matches('tw-plate', '車牌 ABC-1234。')).toEqual(['ABC-1234']);
    expect(matches('tw-plate', '機車 MNB-563')).toEqual(['MNB-563']);
  });

  it('車牌不抓過短的料號', () => {
    expect(matches('tw-plate', '料號 XY-99')).toEqual([]);
  });

  it('出生日期需錨定，避免抓走所有日期', () => {
    expect(matches('birth-date', '生日 1985/03/12，年齡 41 歲')).toEqual(['1985/03/12']);
    expect(matches('birth-date', '出生年月日：民國74年3月12日')).toEqual(['民國74年3月12日']);
    expect(matches('birth-date', '簽約日期 2026/09/02')).toEqual([]);
  });

  it('社群帳號抓得到，且 ONLINE 不會誤觸 LINE 錨點', () => {
    expect(matches('social-handle', 'LINE ID: daming_wang88')).toEqual(['daming_wang88']);
    expect(matches('social-handle', '微信 wxid_abc123')).toEqual(['wxid_abc123']);
    expect(matches('social-handle', 'ONLINE service available')).toEqual([]);
  });

  it('IP 位址抓 IPv4，不抓版本號', () => {
    expect(matches('ipv4', 'IP 192.168.31.45。')).toEqual(['192.168.31.45']);
    expect(matches('ipv4', '版本 4.10.38')).toEqual([]);
  });
});

describe('英文姓名（預設關閉）', () => {
  it('預設是關閉的', () => {
    expect(getPattern('en-name').enabled).toBe(false);
  });

  it('手動開啟後抓得到英文人名', () => {
    expect(matches('en-name', '顧問 Michael Chen 出席')).toEqual(['Michael Chen']);
    expect(matches('en-name', 'Mary J. Wang 女士')).toEqual(['Mary J. Wang']);
  });

  it('停用清單擋掉最常見的商務詞組', () => {
    expect(matches('en-name', 'Project Alpha 啟動會議')).toEqual([]);
    expect(matches('en-name', 'Purchase Order 已核准')).toEqual([]);
  });
});

describe('遮罩顯示', () => {
  it('信用卡只留末四碼', () => {
    expect(maskDisplay('信用卡', '4532-0151-1283-0366')).toBe('4532-****-****-0366');
  });

  it('英文姓名每個字保留首字母', () => {
    expect(maskDisplay('英文姓名', 'Michael Chen')).toBe('M****** C***');
  });

  it('IP 位址遮後兩段', () => {
    expect(maskDisplay('IP位址', '192.168.31.45')).toBe('192.168.***.***');
  });

  it('居留證比照身分證留頭三尾一', () => {
    expect(maskDisplay('居留證', 'FA12345689')).toBe('FA1******9');
  });
});
