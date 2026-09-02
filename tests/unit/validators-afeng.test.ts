import { describe, it, expect } from 'vitest';
import {
  isPlausibleBankAccount,
  isPlausibleEnglishName,
  isValidCreditCard,
  isValidNewResidentId,
  isValidOldResidentId,
  isValidResidentId,
} from '../../src/core/validators';

describe('外來人口統一證號檢核碼', () => {
  it('接受新式統一證號（第二碼 8／9）', () => {
    expect(isValidNewResidentId('A812345671')).toBe(true);
    expect(isValidNewResidentId('B987654320')).toBe(true);
  });

  it('拒絕檢核碼錯誤的新式證號', () => {
    expect(isValidNewResidentId('A812345678')).toBe(false);
  });

  it('接受舊式外僑統一證號（第二碼 A-D）', () => {
    expect(isValidOldResidentId('FA12345689')).toBe(true);
    expect(isValidOldResidentId('CB23456781')).toBe(true);
  });

  it('拒絕檢核碼錯誤的舊式證號', () => {
    expect(isValidOldResidentId('AB12345678')).toBe(false);
  });

  it('不把國民身分證誤判成居留證', () => {
    expect(isValidResidentId('A123456789')).toBe(false);
  });

  it('格式不符一律拒絕', () => {
    expect(isValidResidentId('A81234567')).toBe(false); // 少一碼
    expect(isValidResidentId('AE12345678')).toBe(false); // 第二碼非 8/9/A-D
    expect(isValidResidentId('')).toBe(false);
  });
});

describe('信用卡 Luhn 檢核', () => {
  it('接受各卡別的有效卡號', () => {
    expect(isValidCreditCard('4532015112830366')).toBe(true); // Visa 16
    expect(isValidCreditCard('5425233430109903')).toBe(true); // MasterCard 16
    expect(isValidCreditCard('378282246310005')).toBe(true); // Amex 15
  });

  it('忽略分隔符號', () => {
    expect(isValidCreditCard('4532-0151-1283-0366')).toBe(true);
    expect(isValidCreditCard('4532 0151 1283 0366')).toBe(true);
  });

  it('拒絕 Luhn 不過的號碼（例如剛好 16 位的訂單編號）', () => {
    expect(isValidCreditCard('1234567812345678')).toBe(false);
  });

  it('拒絕長度或首碼不合理者', () => {
    expect(isValidCreditCard('4532')).toBe(false);
    expect(isValidCreditCard('0000000000000000')).toBe(false); // 首碼 0 非發卡區間
  });
});

describe('銀行帳號合理性', () => {
  it('接受 10-16 位數字', () => {
    expect(isPlausibleBankAccount('0123-456-789012')).toBe(true);
    expect(isPlausibleBankAccount('12345678901234')).toBe(true);
  });

  it('拒絕過短或過長', () => {
    expect(isPlausibleBankAccount('123456789')).toBe(false);
    expect(isPlausibleBankAccount('12345678901234567')).toBe(false);
  });

  it('拒絕表格填充用的重複數字', () => {
    expect(isPlausibleBankAccount('0000000000')).toBe(false);
  });
});

describe('英文姓名合理性（預設關閉規則的第二道防線）', () => {
  it('接受看起來像人名的組合', () => {
    expect(isPlausibleEnglishName('Michael Chen')).toBe(true);
    expect(isPlausibleEnglishName('Mary J. Wang')).toBe(true);
  });

  it('擋掉常見商務詞組', () => {
    expect(isPlausibleEnglishName('Project Alpha')).toBe(false);
    expect(isPlausibleEnglishName('Purchase Order')).toBe(false);
    expect(isPlausibleEnglishName('Dear Michael')).toBe(false);
    expect(isPlausibleEnglishName('Best Regards')).toBe(false);
  });
});
