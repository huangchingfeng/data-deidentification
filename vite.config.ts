/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';

/**
 * MIT 要求「著作權聲明與授權聲明須包含在所有副本中」。瀏覽器會下載這份 bundle，
 * 等同散布軟體副本，所以在每個產出的 JS 檔頭保留法律註記。
 * （不用 build.rolldownOptions.output.banner —— Vite 8 的 rolldown 未套用該設定，
 *   改用 generateBundle 直接寫入，可用 grep 驗證。）
 */
const LEGAL_BANNER = [
  '/*! 個資去識別化工具（Autolab 擴充版）',
  ' * Copyright (c) 2026 Dean Lin',
  ' * Modifications Copyright (c) 2026 黃敬峰 (Autolab)',
  ' * Released under the MIT License. 授權全文：/LICENSE',
  ' * 原始專案：https://github.com/dean9703111/data-deidentification',
  ' * 第三方元件聲明：/THIRD-PARTY-NOTICES.txt',
  ' */',
].join('\n');

function legalBanner(): Plugin {
  return {
    name: 'autolab-legal-banner',
    apply: 'build',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk') file.code = `${LEGAL_BANNER}\n${file.code}`;
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [legalBanner()],
  build: {
    target: 'es2022',
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    // PDF/docx round-trips embed fonts and zip files; give them headroom on slow CI runners.
    testTimeout: 30000,
  },
});
