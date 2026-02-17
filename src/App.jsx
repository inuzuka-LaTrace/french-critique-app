import React, { useState, useEffect } from 'react';
import baudelaireData from './data/baudelaire.json';
import mallarmeData from './data/mallarme.json';
import valeryData from './data/valery.json';
import mallarmeTheatreData from './data/mallarme-theatre.json';

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
  
  useEffect(() => {
    const allTexts = {
      ...baudelaireData,
      ...mallarmeData,
      ...mallarmeTheatreData,  
      ...valeryData
    };
    setTexts(allTexts);
    setLoading(false);
  }, []);
  
  const currentText = texts[selectedText];
  
  const categories = {
    all: { name: 'すべて' },
    baudelaire_aesthetics: { name: 'ボードレール美学' },
    baudelaire_music: { name: 'ボードレール音楽論' },
    baudelaire_modernity: { name: 'ボードレール近代性' },
    mallarme_poetics: { name: 'マラルメ詩学' },
    mallarme_book: { name: 'マラルメ書物論' },
    mallarme_representation: { name: 'マラルメ表象論' },
    mallarme_culture: { name: 'マラルメ文化論' },
    valery: { name: 'ヴァレリー' },
    mallarme_theatre: { name: 'マラルメ演劇・表象論' }
};
  
  const filteredTexts = selectedCategory === 'all'
    ? Object.values(texts)
    : Object.values(texts).filter(t => t.category === selectedCategory);
  
  useEffect(() => {
    if (!loading && currentText) {
      loadUserTranslations();
    }
  }, [selectedText, loading]);
  
  const loadUserTranslations = () => {
    try {
      const stored = localStorage.getItem(`translations-${selectedText}`);
      if (stored) {
        setUserTranslations(JSON.parse(stored));
      } else {
        setUserTranslations({});
      }
    } catch (error) {
      setUserTranslations({});
    }
  };
  
  const saveUserTranslation = (paragraphId, translation) => {
    const updated = {
      ...userTranslations,
      [paragraphId]: {
        text: translation,
        lastModified: new Date().toISOString()
      }
    };
    
    setUserTranslations(updated);
    
    try {
      localStorage.setItem(`translations-${selectedText}`, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save:', error);
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
    if (confirm('このテキストのすべての訳文を削除してもよろしいですか？')) {
      setUserTranslations({});
      try {
        localStorage.removeItem(`translations-${selectedText}`);
      } catch (error) {
        console.error('Failed to clear:', error);
      }
    }
  };
  
  const handleTextChange = (textId) => {
    setSelectedText(textId);
    setEditingParagraph(null);
  };
  
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
  
  const bgClass = darkMode 
    ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-indigo-950' 
    : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50';
  const cardBgClass = darkMode 
    ? 'bg-gray-900 bg-opacity-70 backdrop-blur-sm' 
    : 'bg-white bg-opacity-80 backdrop-blur-sm';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClass = darkMode ? 'border-gray-700 border-opacity-50' : 'border-gray-200';
  const hoverBorderClass = darkMode ? 'hover:border-indigo-500' : 'hover:border-indigo-400';
  
  const fontFamilyClass = 
    fontFamily === 'garamond' ? '"EB Garamond", "Noto Serif JP", serif' :
    fontFamily === 'serif'    ? '"Noto Serif JP", serif' :
    '"Inter", "Noto Sans JP", sans-serif';
  
  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-base'
  };
  
  return (
    <div className={`min-h-screen ${bgClass}`} style={{fontFamily: fontFamilyClass}}>
      <header className={`${darkMode ? 'bg-gray-900 bg-opacity-90 border-gray-800' : 'bg-gradient-to-r from-indigo-600 to-purple-600'} text-white shadow-lg border-b backdrop-blur-sm`}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-serif">
                19-20世紀フランス批評理論
              </h1>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-indigo-100'}`}>
                {Object.keys(texts).length}編収録
              </p>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`px-3 py-2 rounded text-sm ${darkMode ? 'bg-gray-800' : 'bg-indigo-500'} hover:opacity-80 transition-all`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className={`px-3 py-2 rounded text-sm ${darkMode ? 'bg-gray-800 text-white' : 'bg-indigo-500'}`}
              >
                <option value="small">小</option>
                <option value="medium">中</option>
              </select>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className={`px-3 py-2 rounded text-sm ${darkMode ? 'bg-gray-800 text-white' : 'bg-indigo-500'}`}
              >
                <option value="garamond">Garamond</option>
                <option value="serif">Noto Serif</option>
                <option value="sans">Sans</option>
              </select>
            </div>
          </div>
        </div>
      </header>
      
      {showWelcome && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className={`${cardBgClass} border ${borderClass} rounded-lg p-6 relative shadow-xl`}>
            <button
              onClick={() => setShowWelcome(false)}
              className={`absolute top-4 right-4 ${textSecondaryClass} hover:opacity-70 text-2xl leading-none`}
            >
              ×
            </button>
            <h2 className={`text-xl font-semibold ${textClass} mb-3`}>
              19-20世紀フランス批評理論
            </h2>
            <div className={`text-sm space-y-2 ${textSecondaryClass}`}>
              <p>📚 ボードレール・マラルメ・ヴァレリーの批評テキスト</p>
              <p>✨ 原文と日本語訳を並べて学習</p>
              <p>📝 自分の訳文を保存可能</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className={`${cardBgClass} rounded-lg shadow-lg p-4 mb-4 border ${borderClass}`}>
          <h3 className={`text-sm font-semibold ${textClass} mb-2`}>カテゴリー:</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categories).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-2 rounded text-sm transition-all ${
                  selectedCategory === key
                    ? (darkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-600 text-white shadow-lg')
                    : (darkMode ? 'bg-gray-800 bg-opacity-60 text-gray-300 hover:bg-opacity-80' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className={`${cardBgClass} rounded-lg shadow-lg p-6 mb-6 border ${borderClass}`}>
          <h2 className={`text-lg font-semibold ${textClass} mb-4`}>
            テキスト選択 ({filteredTexts.length}編)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTexts.map((text) => (
              <button
                key={text.id}
                onClick={() => handleTextChange(text.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all transform hover:scale-105 ${hoverBorderClass} ${
                  selectedText === text.id
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900 dark:bg-opacity-30 shadow-xl'
                    : `${borderClass} ${cardBgClass}`
                }`}
              >
                <h3 className={`font-serif text-base ${textClass} mb-1 line-clamp-2`}>
                  {text.title}
                </h3>
                <p className={`text-xs ${textSecondaryClass} mb-2`}>
                  {text.author} ({text.year})
                </p>
                <p className={`text-xs ${textSecondaryClass}`}>難易度: {text.difficulty}</p>
                <p className={`text-xs font-semibold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  段落数: {text.paragraphs.length}
                </p>
              </button>
            ))}
          </div>
        </div>
        
        <div className={`${cardBgClass} rounded-lg shadow-lg p-6 mb-6 border ${borderClass}`}>
          <h2 className={`text-2xl font-serif ${textClass} mb-2`}>
            {currentText.title}
          </h2>
          <div className={`text-sm ${textSecondaryClass} space-y-1`}>
            <p>著者：{currentText.author}</p>
            <p>出典：{currentText.source}（{currentText.year}年）</p>
            <p className="font-semibold text-indigo-600 dark:text-indigo-400">
              段落数：{currentText.paragraphs.length}
            </p>
            {currentText.context && (
              <div className={`${darkMode ? 'bg-indigo-950 bg-opacity-50 border-indigo-800' : 'bg-indigo-50 border-indigo-200'} border rounded p-3 mt-3`}>
                <p className={`text-sm ${darkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
                  {currentText.context}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className={`${cardBgClass} rounded-lg shadow-lg p-4 mb-6 border ${borderClass}`}>
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="space-y-2">
              <span className={`text-sm font-medium ${textClass} block`}>表示:</span>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFrench}
                    onChange={(e) => setShowFrench(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  <span className={`text-sm font-medium ${textClass}`}>原文</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOfficial}
                    onChange={(e) => setShowOfficial(e.target.checked)}
                    className="w-4 h-4 rounded accent-green-600"
                  />
                  <span className={`text-sm font-medium ${textClass}`}>公式訳</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUser}
                    onChange={(e) => setShowUser(e.target.checked)}
                    className="w-4 h-4 rounded accent-purple-600"
                  />
                  <span className={`text-sm font-medium ${textClass}`}>自分の訳</span>
                </label>
              </div>
            </div>
            <button
              onClick={clearAllTranslations}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                darkMode 
                  ? 'bg-red-900 bg-opacity-50 text-red-300 hover:bg-opacity-70 border border-red-700' 
                  : 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
              }`}
            >
              訳文削除
            </button>
          </div>
        </div>
        
<div className={`space-y-6 pb-8 ${fontSizeClasses[fontSize]}`}>
          {currentText.paragraphs.map((para) => (
            <div key={para.id} className={`${cardBgClass} rounded-lg shadow-lg p-6 border-2 ${borderClass} hover:shadow-2xl ${hoverBorderClass} transition-all`}>
              
              {/* 原文表示 */}
              {showFrench && (
                <div className="mb-4">
                  <span className={`text-xs font-semibold px-3 py-1 rounded ${
                    darkMode 
                      ? 'bg-indigo-900 bg-opacity-50 text-indigo-300 border border-indigo-700' 
                      : 'bg-indigo-600 text-white shadow-sm'
                  }`}>
                    原文 {para.id}
                  </span>
                  <p className={`${fontSize === 'medium' ? 'text-lg' : 'text-base'} leading-relaxed ${textClass} ${fontFamily === 'serif' ? 'italic' : ''} mt-3`}>
                    {para.french}
                  </p>
                </div>
              )}
              
              {/* 公式訳表示 */}
              {showOfficial && (
                <div className={`${showFrench ? 'mb-4' : ''} border-l-4 border-green-500 dark:border-green-700 pl-4`}>
                  <span className={`text-xs font-semibold px-3 py-1 rounded ${
                    darkMode 
                      ? 'bg-green-900 bg-opacity-50 text-green-300 border border-green-700' 
                      : 'bg-green-600 text-white shadow-sm'
                  }`}>
                    公式訳
                  </span>
                  <p className={`${fontSize === 'medium' ? 'text-base' : 'text-sm'} leading-relaxed ${textClass} mt-3`}>
                    {para.officialTranslation}
                  </p>
                </div>
              )}
              
              {/* 自分の訳表示 */}
              {showUser && (
                <div className="border-l-4 border-purple-500 dark:border-purple-700 pl-4">
                  <span className={`text-xs font-semibold px-3 py-1 rounded ${
                    darkMode 
                      ? 'bg-purple-900 bg-opacity-50 text-purple-300 border border-purple-700' 
                      : 'bg-purple-600 text-white shadow-sm'
                  }`}>
                    自分の訳
                  </span>
                  {editingParagraph === para.id ? (
                    <div className="mt-3">
                      <textarea
                        id={`user-translation-${para.id}`}
                        defaultValue={userTranslations[para.id]?.text || ''}
                        className={`w-full p-3 border ${borderClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] ${darkMode ? 'bg-gray-900 bg-opacity-80 text-white' : 'bg-white'}`}
                        placeholder="自分の訳を書く..."
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSaveTranslation(para.id)}
                          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm transition-all shadow-sm font-medium"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingParagraph(null)}
                          className={`px-4 py-2 rounded text-sm transition-all font-medium ${
                            darkMode 
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      {userTranslations[para.id] ? (
                        <p className={`${fontSize === 'medium' ? 'text-base' : 'text-sm'} leading-relaxed ${textClass} mb-2`}>
                          {userTranslations[para.id].text}
                        </p>
                      ) : (
                        <p className={`text-sm ${textSecondaryClass} italic mb-2`}>
                          まだ訳文がありません
                        </p>
                      )}
                      <button
                        onClick={() => setEditingParagraph(para.id)}
                        className={`text-sm font-medium transition-all ${
                          darkMode 
                            ? 'text-purple-400 hover:text-purple-300' 
                            : 'text-purple-600 hover:text-purple-700 hover:underline'
                        }`}
                      >
                        {userTranslations[para.id] ? '編集' : '訳を書く'}
                      </button>
                    </div>
                  )}
                </div>
              )}
              
            </div>
          ))}
        </div>
        
        <div className={`text-center text-sm ${textSecondaryClass} pb-8`}>
          <p className="font-semibold mb-2">{Object.keys(texts).length}編収録</p>
          <p>ボードレール・マラルメ・ヴァレリー</p>
        </div>
      </div>
    </div>
  );
}
