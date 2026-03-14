# CLAUDE.md — Versillage 知識ベース
> 最終更新：2026-03-13（統合：2026-03-09〜2026-03-13）

---

## 1. アプリの全体像・目的

**アプリ名：Versillage**（versillage.vercel.app、Vercelデプロイ済み）  
副題：「近代西洋詩・批評 対訳精読」  
命名由来：vers（詩行）＋ sillage（航跡）。

19〜20世紀近代西洋詩・批評散文の対訳閲覧Webアプリ。フランス語・英語・ドイツ語・**イタリア語**の原文と日本語仮訳を並べて比較し、注釈・音読・自分の訳文記録・横断読解ができる。

---

## 2. 技術スタック

| 要素 | 内容 |
|------|------|
| フロントエンド | React（Vite）+ Tailwind CSS |
| データ | 各作者ごとのJSONファイル（`src/data/`） |
| 永続化 | localStorage（ユーザー訳文・閲覧履歴・SRS） |
| 音読 | Web Speech API |
| ホスティング | Vercel（静的サイト） |

### ファイル構成

```
src/
  App.jsx          ← UI・状態管理
  constants.js     ← CATEGORIES / CAT_SHORT / ANNOTATION_TYPE_DEF / SPEECH_RATES 等
  utils.js         ← getOriginalText / getTranslation / getSpeechLang / getBestVoice
                      extractSnippet / fcParaKey / fcFontSizeClass / authorDotColor
  data/            ← 各作者JSONファイル
```

**重要**：`getRouteFromHash` / `getTextIdFromHash` / `pushTextHash` / `pushParaHash` は App.jsx トップレベルにインライン定義のまま残す（utils.js に移動しない）。移動すると ReferenceError になる。

---

## 3. JSONデータスキーマ（確定版）

```json
{
  "id": "author_textname",
  "title": "テキスト名",
  "author": "著者名",
  "source": "出典（原典照合先URL含む）",
  "year": "発表年",
  "firstPublication": "初出情報",
  "difficulty": "初級/中級/上級",
  "category": "カテゴリーID",
  "originalLang": "fr-FR / de-DE / en-GB / it-IT",
  "modernRelevance": "★1〜5",
  "context": "背景説明",
  "keywords": ["キーワード"],
  "relatedTexts": ["related_text_id"],
  "paragraphs": [
    {
      "id": 1,
      "verses": "v.1–14（任意）",
      "speaker": "（ラシーヌ系のみ）",
      "scene": "（ラシーヌ系のみ）",
      "epigraphs": [
        {
          "author": "Dante",
          "source": "Purg. VIII, 1",
          "text": "Era già l'ora che volge il desio.",
          "translation": "もう、欲望を引き戻すあの時刻だった。"
        }
      ],
      "original": "原文（旧 french / originalText フィールドと互換）",
      "provisionalTranslation": "日本語仮訳"
    }
  ],
  "annotations": [
    {
      "paragraphId": 1,
      "type": "glossary|allusion|commentary|intertextual|prosody",
      "anchor": "原文中のキーフレーズ（省略可）",
      "body": "注釈本文",
      "targetId": "intertextual時のみ",
      "targetParagraphId": "対象段落ID（省略可）"
    }
  ]
}
```

### フィールド互換性・制約
- `french` と `original` / `originalText` は三者対応（`getOriginalText()` で吸収）
- `officialTranslation` と `provisionalTranslation` は両対応（`getTranslation()` で吸収）
- `speaker` / `scene` / `verses` はラシーヌ系のみ必須；イタリア語詩（ダンテ・ダヌンツィオ・パスコリ）では `verses` を使用、`speaker` / `scene` は不要
- **`epigraphs` フィールド**（2026-03-12 新設）：`[{author, source, text, translation}]` の配列。Monna Innominata 等のエピグラフ付きテキストに使用。App.jsx 側で段落本文の前にイタリック表示される
- **`id: 0` 序文段落**：`verses: "preface"` を使用（Monna Innominata 等の散文序文）
- **段落粒度**：詩テキストは連（strophe）単位で統合（1行1段落にしない）；テルツァ・リーマは3行1段落を基本とする
- **一段落一発話**：発話者が変わるたびに段落を切る。vers partagé は `v.1204a` / `v.1204b-1212` で表記
- **JSONエスケープ注意**：アポストロフィは `\'` 不可、`'` をそのまま使用
- **スキーマドリフト防止**：ラシーヌ系ファイルの作業開始時は既存JSONを読み込んで `speaker`・`scene`・`verses` フィールドの存在を目視確認してから着手

---

## 4. 実装済みの主な機能

| 機能 | 実装時期 | 状態 |
|------|---------|------|
| テキスト一覧グリッド（カテゴリー・検索フィルター） | 初期 | ✅ |
| 段落単位の折りたたみ/展開 | 初期 | ✅ |
| 原文 / 仮訳 / ユーザー訳の表示切り替え | 初期 | ✅ |
| ユーザー訳文入力・localStorage保存 | 初期 | ✅ |
| ダークモード | 初期 | ✅ |
| Web Speech API音読 | 初期 | ✅ |
| アンカー付き注釈（原文ハイライト・双方向フォーカス） | 初期 | ✅ |
| 横断読解ビュー（最大3パネル並列） | 初期 | ✅ |
| 閲覧履歴・「最近開いた」カテゴリ | 2026-03-07 | ✅ |
| スニペット付き検索リスト表示 | 2026-03-07 | ✅ |
| フラッシュカードモード（SRS・仮訳/自訳切替・ソース選択） | 2026-03-07 | ✅ |
| scrollToEl（stickyヘッダー対応スクロール） | 2026-03-08 | ✅ |
| テキストカードのバッジ（段落数・単語数・注釈数） | 2026-03-08 | ✅ |
| テキスト情報パネルの統計（カテゴリバッジ同行） | 2026-03-08 | ✅ |
| 「このテキストで学習」ボタン（テキスト情報パネル下部） | 2026-03-08 | ✅ |
| ヘッダーCinzelフォント | 2026-03-09 | ✅ |
| 「一覧」戻りボタン（読書中のみ表示） | 2026-03-09 | ✅ |
| デフォルト非選択（起動時一覧画面） | 2026-03-09 | ✅ |
| カテゴリボタン ダークモード配色修正 | 2026-03-09 | ✅ |
| speaker バッジの truncate 対応 | 2026-03-12 | ✅ |
| 逐行対訳モードの行番号ズレ修正 | 2026-03-12 | ✅ |
| epigraphs フィールドの表示対応 | 2026-03-12 | ✅ |
| **段落ヘッダーの情報量調整** | **2026-03-13** | **⚠️ 保留中** |

### App.jsx 改修詳細（2026-03-12）

#### 1. speaker バッジ重複問題の修正
- **問題**：`verses` バッジ＋`speaker` バッジ（長い名前）が右側アイコン群と重なる
- **解決**：speaker バッジに `max-w-[160px] truncate` を追加。`title` 属性でフル名をホバー表示。左側 flex の `gap-3` → `gap-2` に調整

#### 2. 逐行対訳モード行番号ズレ修正（stacked・side 両モード）
- **問題**：行番号を `parseInt(verses開始行) + i`（配列インデックス）で計算していたため、空白行もカウントされてズレが生じていた
- **解決**：`nonBlankCount` カウンターを導入し、空白行をスキップして実際の詩行番号を追跡

```javascript
let nonBlankCount = 0;
if (!isBlankOrig) nonBlankCount++;
const lineNum = versesStart != null ? versesStart + nonBlankCount - 1 : null;
```

#### 3. epigraphs フィールド表示対応
- 段落コンテンツ冒頭（逐行対訳モード・通常モード両方）に epigraph 表示ブロックを追加
- スタイル：原文イタリック（左ボーダー）→ 仮訳ティール色 → `— 著者, 出典` グレー表示
- CrossPanel（横断読解ビュー）にも同様の表示を追加

---

## 5. カテゴリー一覧（constants.js 要反映）

```
racine
mallarme / mallarme_critique
baudelaire / baudelaire_critique
valery / valery_critique
verlaine / verlaine_critique
gautier
valmore
leconte_de_lisle
rodenbach
vanlerberghe
banville
rimbaud
poe
wilde
swinburne
yeats
george
hofmannsthal
trakl
hoelderlin
dante          ← 2026-03-11 新設（イタリア語圏）
dannunzio      ← 2026-03-11 新設
dannunzio_prose ← 将来用
rossetti_c     ← 2026-03-12 新設（Christina Rossetti）
pascoli        ← 2026-03-13 新設 ★
pavese         ← 将来用
```

---

## 6. 収録テキスト一覧（確定・2026-03-13時点）

### ラシーヌ（racine）— Phèdre 全5幕、JSONファイル10本

| ファイルID | 幕・場面 | verses | 備考 |
|-----------|---------|--------|------|
| `racine_phedre_acte1_sc1` | Acte I, Sc.I | v.1–113 | ✅ 2026-03-13 新規（sc1_2を分割） |
| `racine_phedre_acte1_sc2_3` | Acte I, Sc.II–III | v.114–294 | ✅ 2026-03-13 新規 |
| `racine_phedre_acte1_sc4_5` | Acte I, Sc.IV–V | v.295–358 | ✅ 2026-03-13 新規 |
| `racine_phedre_acte2_sc1_3` | Acte II, Sc.I–III | — | ✗ verses 要追加 |
| `racine_phedre_acte2_sc4_6` | Acte II, Sc.IV–VI | — | ✗ verses 要追加 |
| `racine_phedre_acte3_sc1_3` | Acte III, Sc.I–III | — | ✗ verses 要追加 |
| `racine_phedre_acte3_sc4_6` | Acte III, Sc.IV–VI | — | ✗ verses 要追加 |
| `racine_phedre_acte4_sc1_3` | Acte IV, Sc.I–III | ✅ | |
| `racine_phedre_acte4_sc4_6` | Acte IV, Sc.IV–VI | ✅ | |
| `racine_phedre_acte5_sc1_3` | Acte V, Sc.I–III | ✅ | |
| `racine_phedre_acte5_sc4_7` | Acte V, Sc.IV–VII | ✅ | |

**底本**：Wikisource, Phèdre (Racine), Didot, 1854（Acte I以降）
**旧ファイル `racine_phedre_acte1_sc1_2` は `acte1_sc1` / `acte1_sc2_3` / `acte1_sc4_5` に分割・置換済み**

---

### マラルメ（mallarme）
`mallarme_apparition` / `mallarme_les_fleurs` / `mallarme_angoisse` / `mallarme_lazur` / `mallarme_brise_marine` / `mallarme_sainte` / `mallarme_toast_funebre` / `mallarme_eventail_madame_mallarme` / `mallarme_placet_futile` / `mallarme_tombeau_charles_baudelaire` / `mallarme_herodiade_scene` / `mallarme_herodiade_ouverture` / `mallarme_cantique_saint_jean` / `mallarme_coup_de_des` / `mallarme_sonnet_yx` / `mallarme_toute_lame` / `mallarme_plainte_automne`

### マラルメ批評（mallarme_critique）
`mallarme_crise_de_vers` / `mallarme_musique_lettres` / `mallarme_catholicisme` / `mallarme_de_meme` / `mallarme_fonds_ballet` / `mallarme_hamlet` / `mallarme_plaisir_sacre` / `mallarme_wagner_full` / `mallarme_quant` / `mallarme_mimique` / `mallarme_ballets_full` / `mallarme_avant_dire` / `mallarme_cazalis` / `mallarme_mystere` / `mallarme_livre_instrument` / `mallarme_verlaine`

---

### ボードレール（baudelaire）
`baudelaire_elevation` / `baudelaire_une_charogne` / `baudelaire_harmonie_du_soir` / `baudelaire_spleen` / `baudelaire_hymne` / `baudelaire_femmes_damnees` / `baudelaire_correspondances` / `baudelaire_la_chevelure` / `baudelaire_beaute` / `baudelaire_invitation_voyage` / `baudelaire_chat` / `baudelaire_parfum_exotique`

### ボードレール批評（baudelaire_critique）
`baudelaire_heroisme` / `baudelaire_romantisme_complet` / `baudelaire_gautier` / `baudelaire_peintre_1`〜`_12` / `baudelaire_valmore_critique` / `baudelaire_wagner_encore` / `baudelaire_delacroix_1`〜`_4` / `baudelaire_lettre_wagner` / `baudelaire_wagner_1`〜`_4` / `baudelaire_rire`

---

### ヴァレリー（valery）
`valery_l_amateur_de_poemes` / `valery_orphee` / `valery_narcisse_parle` / `valery_naissance_de_venus` / `valery_la_dormeuse` / `valery_le_vin_perdu` / `valery_fragments_du_narcisse` / `valery_poesie` / `valery_le_sylphe`

### ヴァレリー批評（valery_critique）
`valery_situation_de_baudelaire` / `valery_lettre_sur_mallarme` / `valery_premiere_lecon_cours_de_poetique`

---

### ルコント・ド・リール（leconte_de_lisle）
`lecontelisle_midi` / `lecontelisle_l_illusion_supreme` / `lecontelisle_arc_de_civa` / `lecontelisle_epiphanie` / `lecontelisle_l_anatheme` / `lecontelisle_la_rose_de_louveciennes` / `lecontelisle_le_dernier_dieu` / `lecontelisle_le_parfum_imperissable` / `lecontelisle_le_soir_d_une_bataille` / `lecontelisle_les_roses_d_ispahan` / `lecontelisle_surya` / `lecontelisle_tristesse_du_diable`

---

### ローデンバック（rodenbach）
`rodenbach_coeur_de_leau` / `rodenbach_du_silence` / `rodenbach_la_vie_des_chambres` / `rodenbach_paysages_de_ville` / `rodenbach_lange_envole` / `rodenbach_devant_tete_de_mort` / `rodenbach_loubli` / `rodenbach_les_femmes_tristes` / `rodenbach_lacrymae_rerum`

---

### ゴーティエ（gautier）
`gautier_l_art` / `gautier_contralto` / `gautier_symphonie_en_blanc_majeur` / `gautier_affinites_secretes` / `gautier_carmen` / `gautier_la_rose_the` / `gautier_a_une_robe_rose` / `gautier_coquetterie_posthume` / `gautier_les_joujoux_de_la_morte`

---

### ヴァルモール（valmore）
`valmore_les_roses_de_saadi` / `valmore_adieu` / `valmore_qu_en_avez` / `valmore_avis` / `valmore_chambre` / `valmore_couronne` / `valmore_fleurs` / `valmore_insomnie` / `valmore_mal_du_pays` / `valmore_a_monsieur` / `valmore_priere_fils` / `valmore_reve_intermittent` / `valmore_separees` / `valmore_tristesse`

---

### ヴェルレーヌ（verlaine）
`verlaine_clair_de_lune` / `verlaine_chanson_dautomne` / `verlaine_calme_orphelin` / `verlaine_la_lune_blanche` / `verlaine_colloque_sentimental` / `verlaine_marceline_desbordes_valmore` / `verlaine_a_arthur_rimbaud` / `verlaine_serenade` / `verlaine_un_dahlia` / `verlaine_parsifal` / `verlaine_saint_graal` / `verlaine_un_crucifix`

### ヴェルレーヌ批評（verlaine_critique）
`verlaine_poetes_maudits_mallarme` / `_corbiere` / `_rimbaud` / `_valmore` / `_villiers`

---

### ヴァン・レルベルグ（vanlerberghe）
`vanlerberghe_entrevisions` / `vanlerberghe_invocation` / `van_lerberghe_dans_un_parfum` / `van_lerberghe_ange_etoile_matin` / `van_lerberghe_tombee_du_soir` / `van_lerberghe_rosier_mystique` / `van_lerberghe_sous_les_arches` / `van_lerberghe_solitude` / `van_lerberghe_la_mort`

---

### バンヴィル（banville）

#### 詩集『Améthystes』（1889）
`banville_caprice` / `banville_nuit_d_etoiles` / `banville_les_baisers` / `banville_apotheose`

#### 詩集『Les Princesses』（1890）
`banville_les_princesses` / `banville_pasiphae` / `banville_antiope` / `banville_andromede` / `banville_herodiade`

---

### ポー（poe）
`poe_a_dream` / `poe_a_dream_within_a_dream` / `poe_to_helen` / `poe_annabel_lee` / `poe_israfel` / `poe_the_raven` / `poe_ulalume`

---

### ワイルド（wilde）
`wilde_ave_maria` / `wilde_ballad_reading_gaol` / `wilde_impressions` / `wilde_magdalen_walks` / `wilde_panthea` / `wilde_sphinx` / `wilde_to_my_wife` / `wilde_e_tenebris` / `wilde_harlots_house` / `wilde_helas` / `wilde_impression_matin` / `wilde_requiescat` / `wilde_symphony_yellow` / `wilde_theoretikos`

---

### スウィンバーン（swinburne）
`swinburne_at_parting` / `swinburne_ballad_villon` / `swinburne_ballad_dreamland` / `swinburne_forsaken_garden` / `swinburne_garden_of_proserpine` / `swinburne_maupin_sonnet` / `swinburne_memorial_gautier` / `swinburne_a_match` / `swinburne_anactoria`

---

### イェイツ（yeats）
`yeats_leda_and_the_swan` / `yeats_to_the_rose_upon_the_rood_of_time` / `yeats_stolen_child` / `yeats_rose_of_the_world` / `yeats_adams_curse` / `yeats_aedh_wishes_for_the_cloths_of_heaven` / `yeats_who_goes_with_fergus` / `yeats_the_lake_isle_of_innisfree`

---

### ゲオルゲ（george）
`george_entrueckung` / `george_das_wort` / `george_komm_in_den_park` / `george_haengenden_gaerten_1`〜`_15` / `george_nun_saeume` / `george_umkreisen_wir` / `george_wir_schreiten` / `george_wir_werden`

---

### ホフマンスタール（hofmannsthal）
`hofmannsthal_weltgeheimnis` / `hofmannsthal_vorfruehling` / `hofmannsthal_reiselied` / `hofmannsthal_terzinen` / `hofmannsthal_die_beiden` / `hofmannsthal_erlebnis` / `hofmannsthal_regen_in_der_daemmerung` / `hofmannsthal_verse_auf_ein_kleines_kind`

---

### トラークル（trakl）
`trakl_abendlaendisches_lied` / `trakl_amen` / `trakl_an_novalis` / `trakl_de_profundis` / `trakl_ein_herbstabend` / `trakl_ein_winterabend` / `trakl_elis` / `trakl_fruehling_der_seele` / `trakl_grodek` / `trakl_helian` / `trakl_hoelderlin` / `trakl_im_herbst` / `trakl_sebastian_im_traum`

---

### ヘルダーリン（hoelderlin）
`hoelderlin_brot_und_wein` / `hoelderlin_haelfte_des_lebens` / `hoelderlin_mnemosyne` / `hoelderlin_der_einzige` / `hoelderlin_da_ich_ein_knabe_war` / `hoelderlin_andenken` / `hoelderlin_an_die_parzen`

---

### ★ ダンテ（dante）— 2026-03-11 新設、`originalLang: "it-IT"`

#### 地獄篇（Inferno）6歌
| ファイルID | 歌 |
|-----------|-----|
| `dante_inferno_canto_1` | Canto I |
| `dante_inferno_canto_3` | Canto III |
| `dante_inferno_canto_5` | Canto V |
| `dante_inferno_canto_26` | Canto XXVI |
| `dante_inferno_canto_33` | Canto XXXIII |
| `dante_inferno_canto_34` | Canto XXXIV |

#### 煉獄篇（Purgatorio）7歌
| ファイルID | 歌 |
|-----------|-----|
| `dante_purgatorio_canto_1` | Canto I |
| `dante_purgatorio_canto_2` | Canto II |
| `dante_purgatorio_canto_11` | Canto XI |
| `dante_purgatorio_canto_24` | Canto XXIV |
| `dante_purgatorio_canto_26` | Canto XXVI |
| `dante_purgatorio_canto_27` | Canto XXVII |
| `dante_purgatorio_canto_30` | Canto XXX |

#### 天国篇（Paradiso）5歌
| ファイルID | 歌 |
|-----------|-----|
| `dante_paradiso_canto_1` | Canto I |
| `dante_paradiso_canto_6` | Canto VI |
| `dante_paradiso_canto_26` | Canto XXVI |
| `dante_paradiso_canto_31` | Canto XXXI |
| `dante_paradiso_canto_33` | Canto XXXIII |

**フィールド**：`originalLang: "it-IT"` / `category: "dante"` / `canto: "I"` / `canticle: "Inferno"` / `speaker: "Dante-narratore"` 等

---

### ★ ダヌンツィオ（dannunzio）— 2026-03-11〜12 新設

| ファイルID | 詩集 | 備考 |
|-----------|------|------|
| `dannunzio_alba_separa` | Alcyone | 「L'alba sepàra dalla luce l'ombra」 |
| `dannunzio_pioggia_nel_pineto` | Alcyone | 128行 |
| `dannunzio_nella_belletta` | Alcyone | 8行変形マドリガル |
| `dannunzio_falce_di_luna` | Canto Novo（1882） | 12行、19歳作 |
| `dannunzio_canti_morte_gloria` | Elettra | |
| `dannunzio_due_beatrici` | La Chimera（1890） | 125行、オッターヴァ×10＋不規則連×7 |
| `dannunzio_beata_beatrice` | La Chimera — Sonetti dell'Anima VIII | 14行ソネット |
| `dannunzio_psiche_giacente` | Poema paradisiaco — Hortus Larvarum | 7連×7行、環状構造 |
| `dannunzio_donna_sarcofago` | Poema paradisiaco — Hortus Larvarum | イタリア式ソネット |
| `dannunzio_romanza_donna_velata` | Poema paradisiaco — Hortus Larvarum | 6連×7行、「più」リフレイン |

**フィールド**：`originalLang: "it-IT"` / `category: "dannunzio"`

**重要メモ**：
- 「Consolazione」は La Chimera ではなく *Poema Paradisiaco*（1893）所収——帰属を間違えないこと
- 「L'Oleandro」（Alcyone）は約435行の長篇詩のため収録取り止め
- `dannunzio_due_beatrici` §9「beata Beatrice」の命名は `dannunzio_beata_beatrice` ソネットと詩集内で呼応する

---

### ★ クリスティーナ・ロセッティ（rossetti_c）— 2026-03-12 新設

| ファイルID | タイトル | 形式 | 備考 |
|-----------|---------|------|------|
| `rossetti_monna_innominata` | Monna Innominata: A Sonnet of Sonnets | 散文序文＋ソネット14篇 | epigraphs 28件（Dante×14＋Petrarca×14）、§0 が序文 |
| `rossetti_vanity_of_vanities` | Vanity of Vanities | ソネット14行 | ABBA ABBA / CDCDCD、1847年作（19歳） |
| `rossetti_days_of_vanity` | Days of Vanity | AAB CCB × 5連 | リフレイン「Such is life that dieth.」、1862年 |
| `rossetti_golden_silences` | Golden Silences | — | 1881年 |
| `rossetti_dead_before_death` | Dead Before Death | ソネット | 1862年 |
| `rossetti_de_profundis` | De Profundis | — | 1881年 |
| `rossetti_remember` | Remember | ソネット | 1862年 |
| `rossetti_sweet_death` | Sweet Death | — | 1862年 |
| `rossetti_soeur_louise` | Soeur Louise de la Miséricorde | — | 1881年 |

**フィールド**：`originalLang: "en-GB"` / `category: "rossetti_c"`

**Monna Innominata の設計**：
- `id: 0`、`verses: "preface"` で散文序文を段落として収録
- 各ソネット段落に `epigraphs: [{author, source, text, translation}]` フィールド

**詩集横断メモ**：
- Monna Innominata Sonnet III「Though there be nothing new beneath the sun」= 伝道の書 1:9（Vanity of Vanities・Days of Vanity と共鳴）
- Monna Innominata XIV「Silence of love that cannot sing again」↔ Days of Vanity §5「We lapse out of sight」
- D.G. ロセッティ「Beata Beatrix」（絵画）← ダヌンツィオ「Due Beatrici」・「Beata Beatrice」で直接参照される

---

### ★ パスコリ（pascoli）— 2026-03-13 新設

| ファイルID | タイトル | 詩集 | 形式 |
|-----------|---------|------|------|
| `pascoli_al_dio_termine` | Al Dio Termine | Odi e Inni（1906） | テルツァ・リーマ 14連＋独立最終行 全43行 |

**フィールド**：`originalLang: "it-IT"` / `category: "pascoli"`

**詩学メモ**：
- 三部構造：Termine buono（農地の境界石、v.1–12）→ Termine forte（国家の境界石、v.13–21）→ Termine santo（犠牲・神聖な春・ダンテ、v.22–43）
- テルツァ・リーマ（ABA BCB…）採用自体がダンテへの形式的参照——最終行「Dante！」へ向かう伏線
- 大文字行「DI LÀ C'È VOSTRO, MA DI QUA C'È MIO！」（v.30）：「地獄を轟かせた声」＝ダンテの声
- 「Egli, Egli, Egli…」三度反復（v.41–42）→ 省略（…）→「Dante！」の突然の固有名との対比
- 「primavera sacra」：古代ローマの ver sacrum（犠牲の春）＋リソルジメントの若い犠牲者
- **底本**：Wikisource, Odi e inni/Al Dio Termine (it.wikisource.org)

**次候補（pascoli）**：
- `pascoli_lavandare`（Myricae, 1891）/ `pascoli_x_agosto`（Myricae）/ `pascoli_il_gelsomino_notturno`（Canti di Castelvecchio, 1903）/ `pascoli_la_mia_sera`（Canti di Castelvecchio）/ `pascoli_digitale_purpurea`（Primi Poemetti）

---

## 7. 未解決・保留中のTODO

### 高優先度
- [ ] **段落ヘッダーの情報量調整**（2026-03-13 議題化）：スマートフォン利用時、`verses` バッジが情報を圧迫する問題。`verses` 表示の優先順位を下げる、バッジ形式以外の表示に改める、「原文＋仮訳／自分の訳」表示をなくす対応を検討中

### 中優先度
- [ ] **ラシーヌ Acte II〜III への `verses` フィールド追加**（4ファイル・v.359〜v.993）
  - `racine_phedre_acte2_sc1_3` / `racine_phedre_acte2_sc4_6`
  - `racine_phedre_acte3_sc1_3` / `racine_phedre_acte3_sc4_6`
  - 底本：Wikisource Didot 1854 版に統一
- [ ] ダヌンツィオ次候補：La sera fiesolana（Alcyone冒頭）/ I Pastori（Alcyone末尾）/ Meriggio（Alcyone真昼）/ Consolazione（Poema Paradisiaco）
- [ ] パスコリ追加候補（上記「次候補」参照）
- [ ] バンヴィル『Les Princesses』続篇：Sémiramis / Omphale / Thalestris / Cléopâtre / Messaline / Hélène 等
- [ ] ラシーヌ次作品：Andromaque / Britannicus / Bérénice
- [ ] ヴァレリー詩の追加：La Jeune Parque / Palme / L'Abeille / Les Pas
- [ ] ルコント・ド・リール補完：La Panthère noire / L'Expiation

### 低優先度
- [ ] パヴェーゼの JSON 作成（`category: "pavese"` 新設予定）
- [ ] `relatedTexts` 双方向接続の最終確認
- [ ] ファビコン作成（「V」）
- [ ] 検索結果0件時の案内表示

---

## 8. 主なテキスト間の参照網

### 「行為と意識」系列（ヴァレリー批評）
`valery_premiere_lecon` → `valery_lettre_sur_mallarme` → `valery_situation_de_baudelaire`

### 「音と意味の同時性」系列
`valery_premiere_lecon` §複素数比喩 → `mallarme_crise_de_vers` §言語の二重状態 → `valery_l_amateur_de_poemes`

### 「罪・認識・転落」系列（ラシーヌ Phèdre）
`acte1_sc1` §fuir（逃げる） → `acte1_sc2_3` §告白・C'est Vénus tout entière → `acte1_sc4_5` §flamme ordinaire（エノンの転換論法） → `acte2_sc1_3` §直接告白 → `acte4_sc1_3` §嫉妬の独白 → `acte5_sc4_7` §最終告白・死

### 「空虚・不在・星座」系列（マラルメ）
`mallarme_sonnet_yx` → `mallarme_coup_de_des` §RIEN/N'AURA EU LIEU → §UNE CONSTELLATION

### 「美と死の共存」系列（バンヴィル→ボードレール）
`banville_les_princesses` §fleurs sanglantes → `banville_herodiade` §améthyste/Jean-Baptiste → `baudelaire_la_destruction` §Démon

### 「神話的欲望と魂」系列（バンヴィル）
`banville_pasiphae` §Ainsi…Ainsi（神話→魂の比喩転換）→ `banville_andromede` §immobile ⟷ `banville_antiope` §Agite

### 「批評と詩の照応」系列（マラルメ散文）
`mallarme_mimique` §沈黙の記述 → `mallarme_hamlet` §不在性 → `mallarme_livre_instrument` §書物の霊的機能 → `mallarme_verlaine` §詩人の不滅化

### ★「Beatrice 神話の変奏」系列（2026-03-12 新設）
`dante_purgatorio_canto_2` §カゼッラの歌  
→ `dante_purgatorio_canto_30` §ベアトリーチェ登場  
→ `dante_paradiso_canto_33` §最終観照  
→ D.G. Rossetti「Beata Beatrix」（絵画、言及のみ）  
→ `dannunzio_due_beatrici` §9「beata Beatrice」命名  
→ `dannunzio_beata_beatrice` §「sorella」呼びかけ・「血から昇る雲」  
→ `rossetti_monna_innominata` §0 序文「名もなき女性が自ら語ったなら」  
→ `rossetti_monna_innominata` §14「Silence of love that cannot sing again」

**軸となる問い**：ダンテが沈黙させたベアトリーチェを、ダヌンツィオは官能的に復活させ、Christina Rossetti はその沈黙に自ら声を与えようとした——同一の神話を三者が異なる性・言語・時代から書き直す。

### ★「vanitas」系列（Rossetti）
`rossetti_vanity_of_vanities`（1847、宇宙的終末・ソネット・感嘆調）  
→ `rossetti_days_of_vanity`（1862、日常的観照・リフレイン・物の列挙）  
→ `rossetti_monna_innominata` §3「nothing new beneath the sun」（伝道 1:9）  
→ `rossetti_monna_innominata` §14「Silence of love that cannot sing again」

### ★「テルミヌス／境界の詩学」系列（2026-03-13 新設）
`pascoli_al_dio_termine` §Termine buono（農地）→ §Termine forte（国境）→ §Termine santo・「Dante！」  
→ `dante_inferno_canto_1` §ne lo mezzo del cammin（詩人の出発点）  
→ `dante_paradiso_canto_33` §最終観照（テルミヌスの向こう岸）  
→ `rossetti_monna_innominata` §0 序文（ダンテが定めた「沈黙の境界」）  
→ `dannunzio_due_beatrici` §ダンテの復活・変奏

**軸となる問い**：ダンテはイタリア語の「境界石（terminus）」か、それとも超えるべき「限界（terminus）」か——パスコリは前者として聖化し、ダヌンツィオは後者として踏み越える。

---

## 9. App.jsx 実装上の注意点・トラブル履歴

### URLルーティング関数の二重定義問題（2026-03-07解決）
`getRouteFromHash` 他4関数はApp.jsxトップレベルに残す。utils.js に export すると ReferenceError。

### scrollIntoViewとstickyヘッダーの干渉（2026-03-08解決）
`scrollToEl(el, smooth)` ヘルパーを追加。`headerRef.current?.offsetHeight ?? 60` で実測補正。全箇所の `scrollIntoView` を置換。

### selectedText=null 時の「テキストが見つかりません」問題（2026-03-09解決）
- **原因**：`currentText = texts[null]` が undefined → `if (!currentText)` ガードが発動
- **解決**：① `if (selectedText && !currentText)` に変更 ② 読書パネルを `{selectedText && ...}` でラップ ③ `popstate` ハンドラの else 節に `resetTextState(null)` を追加

### speaker バッジとアイコン群の重複（2026-03-12解決）
`max-w-[160px] truncate` + `title` 属性で対応。

### 逐行対訳モード行番号ズレ（2026-03-12解決）
`nonBlankCount` カウンターで空白行をスキップして正確な詩行番号を計算（stacked・side 両モード）。

### その他の技術メモ
- `userTranslations` のlocalStorageキー：`translations-${selectedText}`
- `fcSrsData` のlocalStorageキー：`flashcard-status`
- `bookmarks` のlocalStorageキー：`bookmarks`
- `recentTexts` のlocalStorageキー：`recentTexts`（最大10件・重複排除）
- Vercelチャンクサイズ警告はビルド成功の警告であり表示不全の原因にならない
- **底本の統一**：ラシーヌ Acte I 以降は Wikisource Didot 1854 版。source フィールドに明記する

---

*このファイルを新規チャットのKnowledgeに登録するか、最初のメッセージに貼り付けて継続してください。*
