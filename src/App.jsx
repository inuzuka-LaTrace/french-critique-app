import React, { useState, useEffect, useRef } from 'react';
import baudelaireData from './data/baudelaire';
import mallarmeData from './data/mallarme';
import valeryData from './data/valery';
import valmoreData from './data/valmore';
import vanlerbergheData from './data/vanlerberghe';
import verlaineData from './data/verlaine';
import gautierData from './data/gautier';
import wildeData from './data/wilde';
import swinburneData from './data/swinburne';

// ユーティリティ：officialTranslation / provisionalTranslation 両対応
const getTranslation = (para) =>
  para.provisionalTranslation ?? para.officialTranslation ?? '';

// ユーティリティ：french / originalText 両フィールド対応
const getOriginalText = (para) =>
  para.french ?? para.originalText ?? '';

// 言語コード判定（JSONのoriginalLangフィールド優先、なければfr-FR）
const getSpeechLang = (textObj) =>
  textObj?.originalLang ?? 'fr-FR';

// 言語ごとの優先音声名リスト（品質の高いものを優先）
const PREFERRED_VOICES = {
  'fr': ['Thomas', 'Google français', 'Microsoft Julie', 'Amelie'],
  'de': ['Anna', 'Google Deutsch', 'Microsoft Hedda'],
  'en': ['Daniel', 'Google UK English Female', 'Samantha', 'Google US English'],
};

const getBestVoice = (lang) => {
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

// 読み上げ速度設定
const SPEECH_RATES = {
  fast:   { rate: 1.25, label: 'ヒアリング' },
  normal: { rate: 0.9,  label: '通常' },
  slow:   { rate: 0.65, label: 'シャドーイング' },
};

export default function App() {
  const [texts, setTexts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedText, setSelectedText] = useState('valery_crise');
  const [userTranslations, setUserTranslations] = useState({});
  const [editingParagraph, setEditingParagraph] = useState(null);
  const [showFrench, setShowFrench] = useState(true);
  const [showOfficial, setShowOfficial] = useState(true);
  const [showUser, setShowUser] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [fontFamily, setFontFamily] = useState('garamond');

  // 新機能
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [collapsedParagraphs, setCollapsedParagraphs] = useState({});
  const [readyToScroll, setReadyToScroll] = useState(null); // テキストIDを保持
  const [speakingId, setSpeakingId] = useState(null); // 'all' or paragraphId
  const [speechRate, setSpeechRate] = useState('normal');
  const settingsRef = useRef(null);
  const bodyRef = useRef(null); // 本文セクションへのref

  // ── 読み上げ関数 ──────────────────────────────────────────
  const speak = (text, lang, id) => {
    window.speechSynthesis.cancel();
    if (speakingId === id) { setSpeakingId(null); return; }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = SPEECH_RATES[speechRate]?.rate ?? 0.9;
    // 高品質音声を優先選択（voices非同期読み込み対策）
    const assignVoice = () => {
      const best = getBestVoice(lang);
      if (best) utter.voice = best;
      utter.onend = () => setSpeakingId(null);
      utter.onerror = () => setSpeakingId(null);
      setSpeakingId(id);
      window.speechSynthesis.speak(utter);
    };
    // voicesがまだ読み込まれていない場合は待機
    if (window.speechSynthesis.getVoices().length) {
      assignVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = () => { assignVoice(); window.speechSynthesis.onvoiceschanged = null; };
    }
  };

  const speakParagraph = (para, textObj) => {
    const txt = getOriginalText(para);
    if (!txt) return;
    speak(txt, getSpeechLang(textObj), para.id);
  };

  const speakAll = (textObj) => {
    const fullText = (textObj.paragraphs || [])
      .map(p => getOriginalText(p))
      .filter(Boolean)
      .join('\n');
    speak(fullText, getSpeechLang(textObj), 'all');
  };

  // コンポーネントアンマウント時・テキスト切替時に読み上げ停止
  useEffect(() => {
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, [selectedText]);

  useEffect(() => {
    const allTexts = {
      ...baudelaireData,
      ...mallarmeData,
      ...valeryData,
      ...valmoreData,
      ...vanlerbergheData,
      ...verlaineData,
      ...gautierData,
      ...wildeData,
      ...swinburneData,
    };
    setTexts(allTexts);
    setLoading(false);
  }, []);

  // 設定パネルの外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    if (showSettings) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  const currentText = texts[selectedText];

  const categories = {
    all:                        { name: 'すべて' },
    baudelaire_aesthetics:      { name: 'ボードレール美学' },
    baudelaire_music:           { name: 'ボードレール音楽論' },
    baudelaire_modernity:       { name: 'ボードレール近代論' },
    mallarme_poetics:           { name: 'マラルメ詩学' },
    mallarme_book:              { name: 'マラルメ書物論' },
    mallarme_representation:    { name: 'マラルメ表象論' },
    mallarme_theatre:           { name: 'マラルメ演劇・表象論' },
    mallarme_music:             { name: 'マラルメ音楽論' },
    mallarme_culture:           { name: 'マラルメ文化論' },
    valery:                     { name: 'ヴァレリー' },
    valmore:                    { name: 'ヴァルモール' },
    vanlerberghe:               { name: 'ヴァン・レルベルグ' },
    verlaine_critique:          { name: 'ヴェルレーヌ批評' },
    gautier:                    { name: 'ゴーティエ' },
    wilde:                      { name: 'ワイルド' },
    swinburne:                  { name: 'スウィンバーン' }
  };

  // カテゴリーで絞り込み後、さらに検索クエリで絞り込む（本文テキストも対象）
  const filteredTexts = Object.values(texts)
    .filter(t => selectedCategory === 'all' || t.category === selectedCategory)
    .filter(t => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inMeta =
        t.title?.toLowerCase().includes(q) ||
        t.author?.toLowerCase().includes(q) ||
        (t.keywords || []).some(k => k.toLowerCase().includes(q));
      const inBody = (t.paragraphs || []).some(p =>
        getOriginalText(p).toLowerCase().includes(q) ||
        getTranslation(p).toLowerCase().includes(q)
      );
      return inMeta || inBody;
    });

  useEffect(() => {
    if (!loading && currentText) loadUserTranslations();
  }, [selectedText, loading, currentText]);

  const loadUserTranslations = () => {
    try {
      const stored = localStorage.getItem(`translations-${selectedText}`);
      setUserTranslations(stored ? JSON.parse(stored) : {});
    } catch {
      setUserTranslations({});
    }
  };

  const saveUserTranslation = (paragraphId, translation) => {
    const updated = {
      ...userTranslations,
      [paragraphId]: { text: translation, lastModified: new Date().toISOString() }
    };
    setUserTranslations(updated);
    try {
      localStorage.setItem(`translations-${selectedText}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save:', e);
    }
  };

  const handleSaveTranslation = (paragraphId) => {
    const textarea = document.getElementById(`user-translation-${paragraphId}`);
    if (textarea) {
      saveUserTranslation(paragraphId, textarea.value);
      setEditingParagraph(null);
    }
  };

  const clearAllTranslations = () => {
    if (window.confirm('このテキストのすべての訳文を削除してもよろしいですか？')) {
      setUserTranslations({});
      try { localStorage.removeItem(`translations-${selectedText}`); } catch {}
    }
  };

  const handleTextChange = (textId) => {
    setSelectedText(textId);
    setEditingParagraph(null);
    setCollapsedParagraphs({});
    setReadyToScroll(null);
  };

  // vボタンのハンドラ：1回目→変色、2回目→スクロール
  const handleVButton = (e, textId) => {
    e.stopPropagation(); // カード選択を妨げない
    if (readyToScroll === textId) {
      // 同一テキストが選択済みなら即スクロール
      if (selectedText === textId) {
        bodyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // テキストを切り替えてからスクロール（少し待つ）
        handleTextChange(textId);
        setTimeout(() => {
          bodyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
      setReadyToScroll(null);
    } else {
      setReadyToScroll(textId);
    }
  };

  const toggleParagraph = (id) => {
    setCollapsedParagraphs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 全段落を折りたたむ / 展開する
  const collapseAll = () => {
    if (!currentText) return;
    const all = {};
    currentText.paragraphs.forEach(p => { all[p.id] = true; });
    setCollapsedParagraphs(all);
  };
  const expandAll = () => setCollapsedParagraphs({});

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-xl text-gray-700">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!currentText) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-xl text-gray-700">テキストが見つかりません</p>
        </div>
      </div>
    );
  }

  // ─── テーマ変数 ───────────────────────────────────────────
  const bgClass         = darkMode ? 'bg-gray-950'                        : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50';
  const cardBgClass     = darkMode ? 'bg-gray-900 border-gray-800'        : 'bg-white border-gray-200';
  const textClass       = darkMode ? 'text-gray-100'                       : 'text-gray-900';
  const textSecondary   = darkMode ? 'text-gray-400'                       : 'text-gray-500';
  const borderClass     = darkMode ? 'border-gray-800'                     : 'border-gray-200';
  const inputBg         = darkMode ? 'bg-gray-800 text-gray-100 placeholder-gray-500 border-gray-700' : 'bg-gray-50 text-gray-900 placeholder-gray-400 border-gray-300';
  const settingsBg      = darkMode ? 'bg-gray-900 border-gray-700 shadow-2xl' : 'bg-white border-gray-200 shadow-2xl';

  const fontFamilyStyle =
    fontFamily === 'garamond' ? '"EB Garamond", "Noto Serif JP", serif' :
    fontFamily === 'serif'    ? '"Noto Serif JP", serif' :
    '"Inter", "Noto Sans JP", sans-serif';

  const fontSizeMap = { small: 'text-sm', medium: 'text-base', large: 'text-lg', xlarge: 'text-xl' };

  // カテゴリーラベルの短縮表示用マップ
  const catShort = {
    baudelaire_aesthetics:   '美学',
    baudelaire_music:        '音楽',
    baudelaire_modernity:    '近代性',
    mallarme_poetics:        '詩学',
    mallarme_book:           '書物',
    mallarme_representation: '表象',
    mallarme_theatre:        '演劇',
    mallarme_music:          '音楽',
    mallarme_culture:        '文化',
    valery:                  'ヴァレリー',
    valmore:                 'ヴァルモール',
    vanlerberghe:            'ヴァン・レルベルグ',
    verlaine_critique:       'ヴェルレーヌ批評',
    gautier:                 'ゴーティエ',
    wilde:                   'ワイルド',
    swinburne:               'スウィンバーン',
  };

  const authorColor = (cat) => {
    if (cat?.startsWith('baudelaire'))   return darkMode ? 'bg-amber-900/40 text-amber-300'   : 'bg-amber-100 text-amber-800';
    if (cat?.startsWith('mallarme'))     return darkMode ? 'bg-sky-900/40 text-sky-300'       : 'bg-sky-100 text-sky-800';
    if (cat?.startsWith('valery'))       return darkMode ? 'bg-rose-900/40 text-rose-300'     : 'bg-rose-100 text-rose-800';
    if (cat?.startsWith('valmore'))      return darkMode ? 'bg-pink-900/40 text-pink-300'     : 'bg-pink-100 text-pink-800';
    if (cat?.startsWith('vanlerberghe')) return darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-800';
    if (cat?.startsWith('verlaine'))     return darkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-800';
    if (cat?.startsWith('gautier'))      return darkMode ? 'bg-cyan-900/40 text-cyan-300' : 'bg-cyan-100 text-cyan-800';
    if (cat?.startsWith('wilde'))        return darkMode ? 'bg-teal-900/40 text-teal-300' : 'bg-teal-100 text-teal-800';
    if (cat?.startsWith('swinburne'))    return darkMode ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-100 text-indigo-800';
    return darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700';
  };

  return (
    <div className={`min-h-screen ${bgClass} relative`} style={{ fontFamily: fontFamilyStyle }}>

      {/* ─── Header ─────────────────────────────────── */}
      <header className={`sticky top-0 z-30 ${darkMode ? 'bg-gray-950/95 border-gray-800' : 'bg-white/95 border-gray-200'} border-b backdrop-blur-md shadow-sm`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className={`text-lg font-serif font-semibold ${textClass} truncate`}>
              近代西洋テクスト対訳
            </h1>
            <p className={`text-xs ${textSecondary}`}>{Object.keys(texts).length}編収録</p>
          </div>

          {/* ダークモード切り替え */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-9 h-9 flex items-center justify-center rounded-full text-base transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-yellow-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
            title="ダーク/ライト切替"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* 設定ボタン */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`w-9 h-9 flex items-center justify-center rounded-full text-base transition-colors ${showSettings ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
              title="表示設定"
            >
              ⚙️
            </button>

            {/* 設定パネル（ドロップダウン） */}
            {showSettings && (
              <div className={`absolute right-0 top-12 w-64 rounded-xl border p-4 z-50 ${settingsBg}`}>
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${textSecondary} mb-3`}>表示設定</h3>

                {/* フォントサイズ */}
                <div className="mb-4">
                  <label className={`text-xs font-medium ${textClass} block mb-2`}>文字サイズ</label>
                  <div className="flex gap-1">
                    {[['small','小'],['medium','中'],['large','大'],['xlarge','特大']].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setFontSize(val)}
                        className={`flex-1 py-1 text-xs rounded transition-colors ${fontSize === val ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* フォント */}
                <div className="mb-4">
                  <label className={`text-xs font-medium ${textClass} block mb-2`}>フォント</label>
                  <div className="flex flex-col gap-1">
                    {[['garamond','Garamond (推奨)'],['serif','Noto Serif'],['sans','Sans']].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setFontFamily(val)}
                        className={`py-1.5 px-3 text-xs rounded text-left transition-colors ${fontFamily === val ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 読み上げ速度 */}
                <div className="mb-4">
                  <label className={`text-xs font-medium ${textClass} block mb-2`}>読み上げ速度</label>
                  <div className="flex flex-col gap-1">
                    {Object.entries(SPEECH_RATES).map(([key, { label }]) => (
                      <button
                        key={key}
                        onClick={() => setSpeechRate(key)}
                        className={`py-1.5 px-3 text-xs rounded text-left transition-colors ${speechRate === key ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {key === 'fast' ? '🎧 ' : key === 'slow' ? '🗣 ' : '▶ '}{label}
                        <span className={`ml-1 opacity-60 text-xs`}>
                          {key === 'fast' ? '(1.25x)' : key === 'slow' ? '(0.65x)' : '(0.9x)'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 表示切り替え */}
                <div>
                  <label className={`text-xs font-medium ${textClass} block mb-2`}>表示する内容</label>
                  <div className="space-y-2">
                    {[
                      [showFrench, setShowFrench, '原文', 'indigo'],
                      [showOfficial, setShowOfficial, '仮訳', 'green'],
                      [showUser, setShowUser, '自分の訳', 'purple'],
                    ].map(([checked, setter, label, color]) => (
                      <label key={label} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setter(e.target.checked)}
                          className={`w-4 h-4 rounded accent-${color}-600`}
                        />
                        <span className={`text-sm ${textClass}`}>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ─── ウェルカムバナー ───────────────────────── */}
        {showWelcome && (
          <div className={`rounded-xl border p-4 mb-6 relative ${darkMode ? 'bg-indigo-950/50 border-indigo-800' : 'bg-indigo-50 border-indigo-200'}`}>
            <button
              onClick={() => setShowWelcome(false)}
              className={`absolute top-3 right-3 ${textSecondary} hover:opacity-70 text-xl leading-none`}
            >×</button>
            <p className={`text-sm ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
              📚 19〜20世紀の近代西洋テクスト対訳集。フランス語・英語・ドイツ語の詩・批評原文と日本語仮訳を並べて比較し、自分の訳文も記録できます。
            </p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>
              ※ 掲載の日本語訳は学習補助のための試訳であり、確定した翻訳ではありません。
            </p>
          </div>
        )}

        {/* ─── カテゴリーフィルター ─────────────────── */}
        <div className={`rounded-xl border p-4 mb-4 ${cardBgClass}`}>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(categories).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => { setSelectedCategory(key); setSearchQuery(''); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : darkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* ─── 検索バー ─────────────────────────────── */}
        <div className="mb-4 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSelectedCategory('all'); }}
            placeholder="タイトル・著者・本文テキストで検索..."
            className={`w-full rounded-xl border pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${inputBg}`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-base ${textSecondary} hover:opacity-70`}
            >×</button>
          )}
        </div>

        {/* ─── テキスト一覧グリッド ─────────────────── */}
        <div className={`rounded-xl border p-4 mb-6 ${cardBgClass}`}>
          <h2 className={`text-sm font-semibold ${textClass} mb-3`}>
            テキスト一覧
            <span className={`ml-2 font-normal ${textSecondary}`}>({filteredTexts.length}件)</span>
          </h2>

          {filteredTexts.length === 0 ? (
            <p className={`text-sm ${textSecondary} py-4 text-center`}>
              「{searchQuery}」に一致するテキストが見つかりませんでした
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTexts.map((text) => (
                <div
                  key={text.id}
                  className={`relative rounded-lg border text-left transition-all ${
                    selectedText === text.id
                      ? darkMode
                        ? 'border-indigo-500 bg-indigo-900/30 ring-1 ring-indigo-500'
                        : 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-400'
                      : darkMode
                        ? 'border-gray-800 hover:border-gray-700 hover:bg-gray-800/50'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }`}
                >
                  {/* カード本体（テキスト選択） */}
                  <button
                    onClick={() => handleTextChange(text.id)}
                    className="w-full p-3 pr-10 text-left"
                  >
                    {/* カテゴリーバッジ */}
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full mb-1.5 font-medium ${authorColor(text.category)}`}>
                      {catShort[text.category] || text.category}
                    </span>
                    <h3 className={`font-serif text-sm font-medium ${textClass} leading-snug line-clamp-2`}>
                      {text.title}
                    </h3>
                    <p className={`text-xs ${textSecondary} mt-0.5`}>{text.author}</p>
                    <div className={`flex items-center gap-2 mt-1.5 text-xs ${textSecondary}`}>
                      <span>{text.year}</span>
                      <span>·</span>
                      <span>{text.paragraphs.length}段落</span>
                      {text.difficulty && (
                        <>
                          <span>·</span>
                          <span>{text.difficulty}</span>
                        </>
                      )}
                    </div>
                  </button>

                  {/* vボタン：1回目→変色、2回目→本文へスクロール */}
                  <button
                    onClick={(e) => handleVButton(e, text.id)}
                    title={readyToScroll === text.id ? 'もう一度押すと本文へ移動' : '本文へ移動（2回押し）'}
                    className={`absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition-all select-none ${
                      readyToScroll === text.id
                        ? 'bg-indigo-500 text-white shadow-md scale-110'
                        : darkMode
                          ? 'text-gray-600 hover:text-gray-400'
                          : 'text-gray-300 hover:text-gray-500'
                    }`}
                  >
                    ∨
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── 現在のテキスト情報 ───────────────────── */}
        <div className={`rounded-xl border p-5 mb-4 ${cardBgClass}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full mb-2 font-medium ${authorColor(currentText.category)}`}>
                {catShort[currentText.category] || currentText.category}
              </span>
              <h2 className={`text-xl font-serif ${textClass} mb-1`}>{currentText.title}</h2>
              <p className={`text-sm ${textSecondary}`}>{currentText.author}　{currentText.source}（{currentText.year}年）</p>
            </div>
            <div className={`text-right text-xs ${textSecondary} shrink-0`}>
              <span className="font-semibold">{currentText.paragraphs.length}</span>段落
            </div>
          </div>
          {currentText.context && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${darkMode ? 'bg-indigo-950/50 text-indigo-300 border border-indigo-900' : 'bg-indigo-50 text-indigo-800 border border-indigo-100'}`}>
              {currentText.context}
            </div>
          )}
          {currentText.keywords && currentText.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {currentText.keywords.map(k => (
                <span key={k} className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                  {k}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ─── 段落コントロールバー ─────────────────── */}
        <div ref={bodyRef} className={`rounded-xl border p-3 mb-4 flex flex-wrap items-center justify-between gap-3 ${cardBgClass}`}>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              ▼ すべて展開
            </button>
            <button
              onClick={collapseAll}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              ▶ すべて折りたたむ
            </button>
            <button
              onClick={() => speakAll(currentText)}
              title={speakingId === 'all' ? '読み上げ停止' : '全文を読み上げる'}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1 ${
                speakingId === 'all'
                  ? 'bg-indigo-600 text-white'
                  : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {speakingId === 'all' ? '⏹ 停止' : '🔊 全文'}
            </button>
          </div>
          <button
            onClick={clearAllTranslations}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${darkMode ? 'bg-red-900/40 text-red-400 border border-red-800 hover:bg-red-900/60' : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'}`}
          >
            訳文をすべて削除
          </button>
        </div>

        {/* ─── 段落リスト ───────────────────────────── */}
        <div className={`space-y-2 pb-10 ${fontSizeMap[fontSize]}`}>
          {currentText.paragraphs.map((para) => {
            const isCollapsed = collapsedParagraphs[para.id];
            const hasUserTrans = !!userTranslations[para.id];
            const translation = getTranslation(para);

            return (
              <div
                key={para.id}
                className={`rounded-xl border-2 overflow-hidden transition-all ${
                  selectedText && !isCollapsed ? 'shadow-sm' : ''
                } ${
                  darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
                }`}
              >
                {/* 段落ヘッダー（折りたたみボタン） */}
                <button
                  onClick={() => toggleParagraph(para.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    darkMode ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs font-mono w-6 shrink-0 ${textSecondary}`}>{para.id}</span>
                    {isCollapsed && showFrench && (
                      <span className={`text-sm truncate ${textClass}`}>
                        {getOriginalText(para)}
                      </span>
                    )}
                    {!isCollapsed && (
                      <span className={`text-xs ${textSecondary}`}>
                        {showFrench && showOfficial ? '原文 + 仮訳' : showFrench ? '原文' : showOfficial ? '仮訳' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {hasUserTrans && (
                      <span className="w-2 h-2 rounded-full bg-purple-500" title="自分の訳あり" />
                    )}
                    {/* 段落読み上げボタン */}
                    <button
                      onClick={(e) => { e.stopPropagation(); speakParagraph(para, currentText); }}
                      title={speakingId === para.id ? '停止' : 'この段落を読み上げる'}
                      className={`w-5 h-5 flex items-center justify-center rounded text-xs transition-colors ${
                        speakingId === para.id
                          ? 'bg-indigo-500 text-white'
                          : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-300 hover:text-gray-500'
                      }`}
                    >
                      {speakingId === para.id ? '⏹' : '🔊'}
                    </button>
                    <span className={`text-xs ${textSecondary}`}>{isCollapsed ? '▶' : '▼'}</span>
                  </div>
                </button>

                {/* 段落コンテンツ */}
                {!isCollapsed && (
                  <div className={`px-4 pb-4 border-t ${borderClass}`}>

                    {/* 原文 */}
                    {showFrench && (
                      <div className="pt-4 mb-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${darkMode ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-800' : 'bg-indigo-600 text-white'}`}>
                          原文
                        </span>
                        <p className={`mt-2 leading-relaxed whitespace-pre-line ${textClass} ${
                          fontSize === 'xlarge' ? 'text-2xl' :
                          fontSize === 'large'  ? 'text-xl' :
                          fontSize === 'medium' ? 'text-lg' : 'text-base'
                        }`}>
                          {getOriginalText(para)}
                        </p>
                      </div>
                    )}

                    {/* 仮訳 */}
                    {showOfficial && translation && (
                      <div className={`mb-3 border-l-4 border-green-500 pl-3 ${showFrench ? '' : 'pt-4'}`}>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${darkMode ? 'bg-green-900/50 text-green-300 border border-green-800' : 'bg-green-600 text-white'}`}>
                          仮訳
                        </span>
                        <p className={`mt-2 leading-relaxed ${textClass} ${
                          fontSize === 'xlarge' ? 'text-xl' :
                          fontSize === 'large'  ? 'text-lg' :
                          fontSize === 'medium' ? 'text-base' : 'text-sm'
                        }`}>
                          {translation}
                        </p>
                      </div>
                    )}

                    {/* 自分の訳 */}
                    {showUser && (
                      <div className="border-l-4 border-purple-500 pl-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${darkMode ? 'bg-purple-900/50 text-purple-300 border border-purple-800' : 'bg-purple-600 text-white'}`}>
                          自分の訳
                        </span>
                        {editingParagraph === para.id ? (
                          <div className="mt-2">
                            <textarea
                              id={`user-translation-${para.id}`}
                              defaultValue={userTranslations[para.id]?.text || ''}
                              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px] text-sm resize-y ${darkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white border-gray-300'}`}
                              placeholder="自分の訳を書く..."
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleSaveTranslation(para.id)}
                                className="px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm transition-colors font-medium"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingParagraph(null)}
                                className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2">
                            {userTranslations[para.id] ? (
                              <p className={`leading-relaxed ${textClass} text-sm mb-2`}>
                                {userTranslations[para.id].text}
                              </p>
                            ) : (
                              <p className={`text-sm ${textSecondary} italic mb-2`}>まだ訳文がありません</p>
                            )}
                            <button
                              onClick={() => setEditingParagraph(para.id)}
                              className={`text-xs font-medium transition-colors ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700 hover:underline'}`}
                            >
                              {userTranslations[para.id] ? '編集' : '訳を書く'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* フッター */}
        <div className={`text-center text-xs ${textSecondary} pb-8 space-y-1`}>
          <p>{Object.keys(texts).length}編収録 · ボードレール · マラルメ · ヴァレリー · ヴァルモール · ヴァン・レルベルグ · ヴェルレーヌ · ゴーティエ · ワイルド · スウィンバーン</p>
          <p>掲載の日本語訳は学習補助のための試訳であり、確定した翻訳ではありません</p>
        </div>
      </div>
    </div>
  );
}
