// ─── utils.js ────────────────────────────────────────────────
// React・状態に依存しない純粋ユーティリティ関数
// App.jsx から import して使用する
// ─────────────────────────────────────────────────────────────

import { PREFERRED_VOICES } from './constants';

// ── テキスト取得 ──────────────────────────────────────────────

/** provisionalTranslation / officialTranslation 両フィールド対応 */
export const getTranslation = (para) =>
  para.provisionalTranslation ?? para.officialTranslation ?? '';

/** original / french / originalText 各フィールド対応 */
export const getOriginalText = (para) =>
  para.original ?? para.french ?? para.originalText ?? '';

// ── 音声合成 ─────────────────────────────────────────────────

/** JSON の originalLang フィールドから言語コードを取得 */
export const getSpeechLang = (textObj) =>
  textObj?.originalLang ?? 'fr-FR';

/** 言語に対応する最適な SpeechSynthesisVoice を返す */
export const getBestVoice = (lang) => {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const prefix = lang.split('-')[0];
  const preferred = PREFERRED_VOICES[prefix] || [];
  for (const name of preferred) {
    const v = voices.find(v => v.name.includes(name));
    if (v) return v;
  }
  return voices.find(v => v.lang.startsWith(lang.split('-')[0])) ?? null;
};
