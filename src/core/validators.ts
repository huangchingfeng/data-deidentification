/**
 * 阿峰版新增：金融／醫療／外籍人士識別碼的檢核碼驗證。
 * 原專案只驗身分證與統編（見 twid.ts），這裡補上企業文件實務上常見的其餘幾類。
 */
import { LETTER_VALUES } from './twid';

/**
 * 新式外來人口統一證號（2021-01-02 起配賦）。
 * 格式與國民身分證完全相同，只是第二碼為 8（男）或 9（女），檢核碼演算法一致。
 */
export function isValidNewResidentId(id: string): boolean {
  if (!/^[A-Z][89]\d{8}$/.test(id)) return false;
  const n = LETTER_VALUES[id[0]];
  if (n === undefined) return false;
  const digits = id.slice(1).split('').map(Number);
  let sum = Math.floor(n / 10) + (n % 10) * 9;
  const weights = [8, 7, 6, 5, 4, 3, 2, 1];
  for (let i = 0; i < 8; i++) sum += digits[i] * weights[i];
  sum += digits[8];
  return sum % 10 === 0;
}

/**
 * 舊式外僑統一證號（2021 前配賦，既有文件仍大量存在）。
 * 格式為「區域碼英文字母 + 性別碼 A/B/C/D + 8 位數字」。
 * 演算法：第一碼轉兩位數、第二碼轉兩位數後取個位，接上後 8 碼共 11 位，
 * 分別乘以權重 1,9,8,7,6,5,4,3,2,1,1，總和可被 10 整除即有效。
 */
export function isValidOldResidentId(id: string): boolean {
  if (!/^[A-Z][ABCD]\d{8}$/.test(id)) return false;
  const first = LETTER_VALUES[id[0]];
  const second = LETTER_VALUES[id[1]];
  if (first === undefined || second === undefined) return false;
  const normalised = `${first}${second % 10}${id.slice(2)}`;
  const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1];
  let sum = 0;
  for (let i = 0; i < normalised.length; i++) sum += Number(normalised[i]) * weights[i];
  return sum % 10 === 0;
}

/** 兩種格式擇一通過即可。 */
export function isValidResidentId(id: string): boolean {
  return isValidNewResidentId(id) || isValidOldResidentId(id);
}

/**
 * 信用卡號 Luhn 檢核。同時要求長度 13–19 且首碼落在真實發卡機構區間（3–6），
 * 藉此把「剛好 16 位的訂單編號」擋掉大部分。
 */
export function isValidCreditCard(raw: string): boolean {
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  if (!/^[3-6]/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** 台灣銀行帳號：去掉分隔符後應為 10–16 位純數字（各行庫長度不一，取聯合徵信常見區間）。 */
export function isPlausibleBankAccount(raw: string): boolean {
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length < 10 || digits.length > 16) return false;
  // 全為同一個數字（0000000000）通常是表格填充或遮罩範例，不是真帳號
  if (/^(\d)\1+$/.test(digits)) return false;
  return true;
}

/**
 * 英文姓名的排除清單。這條規則本質上就會誤判（Michael Chen 和 Project Alpha
 * 在正規表達式眼裡長得一樣），所以預設關閉；開啟時至少擋掉最常見的商務詞組。
 */
const EN_NAME_STOPWORDS = new Set([
  'project', 'report', 'invoice', 'purchase', 'order', 'total', 'amount', 'account', 'bank',
  'company', 'limited', 'corp', 'inc', 'ltd', 'department', 'division', 'group', 'team',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december',
  'taiwan', 'taipei', 'china', 'japan', 'korea', 'united', 'states', 'kingdom',
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'all', 'new', 'best',
  'dear', 'thank', 'thanks', 'regards', 'sincerely', 'hello', 'please', 'note',
  'attn', 'subject', 'date', 'page', 'item', 'unit', 'price', 'quantity', 'tax',
  'terms', 'conditions', 'agreement', 'contract', 'service', 'services', 'system',
  'data', 'file', 'name', 'title', 'phone', 'email', 'address', 'city', 'country',
]);

export function isPlausibleEnglishName(match: string): boolean {
  const words = match.trim().split(/\s+/).filter((w) => !/^[A-Z]\.?$/.test(w));
  if (words.length < 2) return false;
  return words.every((w) => !EN_NAME_STOPWORDS.has(w.replace(/[^A-Za-z]/g, '').toLowerCase()));
}
