'use strict';
// ===== 共通 =====
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SUB = { gendai: '現代の国語', gengo: '言語文化', math1: '数学Ⅰ', mathA: '数学A', chem: '化学基礎', bio: '生物基礎', ec: 'ECⅠ', le: 'LEⅠ', geo: '地理総合', kokyo: '公共', info: '情報Ⅰ', eng: '英語', math: '数学', koku: '国語', all: '全教科' };
const KIND = { yoso: '予想問題', kaisetsu: '解答・解説', book: '参考書', matome: 'まとめ', audio: '音声', hanni: '範囲表' };
const HYAKUMON = 'https://shonan544-kanagawapref.s.simple-edu.co.jp/#/student/exam_list';
const store = {
  get(k, d) { try { const v = localStorage.getItem('stp:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('stp:' + k, JSON.stringify(v)); } catch { } }
};
const cache = {};
async function data(name) {
  if (!cache[name]) cache[name] = fetch('data/' + name).then(r => { if (!r.ok) throw new Error(name); return r.json(); });
  return cache[name];
}
const ICON = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  library: '<path d="M4 4h5v16H4zM10 4h5v16h-5zM16 5l4 1-3 15-4-1z"/>',
  schedule: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  progress: '<path d="M4 12l5 5L20 6"/>',
  ranking: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/>'
};
const TABS = [['home', 'ホーム'], ['library', '教材'], ['schedule', '日程'], ['progress', '進み具合'], ['quiz', 'テスト'], ['ranking', '成績']];
function drawTabs(cur) {
  const h = TABS.map(([k, t]) => `<a href="#/${k}" class="${k === cur ? 'on' : ''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg><span>${t}</span></a>`).join('');
  $('#tabs-top').innerHTML = h; $('#tabs-bottom').innerHTML = h;
}
function fmtDate(iso) { if (!iso) return '未定'; const d = new Date(iso + 'T00:00:00'); return `${d.getMonth() + 1}/${d.getDate()}（${'日月火水木金土'[d.getDay()]}）`; }
function daysTo(iso) { const t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((new Date(iso + 'T00:00:00') - t) / 864e5); }
function mb(n) { return (n / 1e6).toFixed(n > 1e7 ? 0 : 1) + 'MB'; }

// ===== ルーティング =====
const routes = { home, library, schedule, progress, quiz, ranking };
async function router() {
  const [page, ...rest] = (location.hash.replace(/^#\/?/, '') || 'home').split('/');
  const fn = routes[page] || home;
  drawTabs(routes[page] ? page : 'home');
  const app = $('#app');
  app.innerHTML = '<div class="empty">読み込み中…</div>';
  try { await fn(app, rest.map(decodeURIComponent)); } catch (e) { app.innerHTML = `<div class="card empty">読み込みに失敗しました（${esc(e.message)}）</div>`; }
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

// ===== ホーム =====
async function home(app) {
  const [exams, news, mats] = await Promise.all([data('exams.json'), data('news.json'), data('materials.json')]);
  const up = exams.filter(e => e.end && daysTo(e.end) >= 0).sort((a, b) => a.start.localeCompare(b.start));
  const nx = up[0];
  const fav = store.get('recent', []).map(f => mats.find(m => m.file === f)).filter(Boolean).slice(0, 4);
  app.innerHTML = `
  <h1>湘南生の定期テスト対策ポータル</h1>
  <div class="grid">
    <div class="card hero">
      ${nx ? `<div class="muted">次の試験</div><div style="font-weight:700;font-size:17px">${esc(nx.name)}</div>
      <div class="cd"><span>あと</span><b>${Math.max(0, daysTo(nx.start))}</b><span>日</span></div>
      <div class="muted">${fmtDate(nx.start)}〜${fmtDate(nx.end)}${nx.approx ? '（目安）' : ''}</div>` : '<div>予定されている試験はまだ登録されていません。</div>'}
      <div class="row" style="margin-top:10px">${nx ? `<a class="btn sm" href="#/library/${nx.id}">この試験の教材</a><a class="btn sm" href="#/progress/${nx.id}">進み具合</a>` : ''}</div>
    </div>
    <div class="card">
      <h3 style="margin-top:0">百問繚乱（学校のテスト結果）</h3>
      <p class="muted">学校の「百問繚乱」は学校のログインが必要なため、このページから直接は結果を読み込めません。結果はリンク先で確認し、「進み具合」の記録欄にメモできます。</p>
      <div class="row"><a class="btn pri" href="${HYAKUMON}" target="_blank" rel="noopener">百問繚乱を開く</a><a class="btn" href="#/progress/score">結果をメモする</a><a class="btn" href="#/ranking">みんなの成績</a></div>
    </div>
    <div class="card">
      <h3 style="margin-top:0">お知らせ</h3>
      <ul class="news" style="padding-left:18px;margin:0">${news.slice(0, 5).map(n => `<li><span class="muted">${esc(n.date.slice(5).replace('-', '/'))}</span> ${esc(n.text)}</li>`).join('')}</ul>
    </div>
  </div>
  <h2>試験から探す</h2>
  <div class="grid">${exams.map(e => {
    const n = mats.filter(m => m.exam === e.id).length;
    return `<a class="card mat" style="text-decoration:none;color:inherit" href="#/library/${e.id}"><span class="k">${esc(e.grade)}</span><span class="t">${esc(e.name)}</span><span class="muted">${e.start ? fmtDate(e.start) + (e.approx ? '（目安）' : '') : '日程未定'}・教材 ${n} 件</span></a>`;
  }).join('')}</div>
  ${fav.length ? `<h2>最近開いた教材</h2><div class="grid">${fav.map(matCard).join('')}</div>` : ''}
  <h2>ミニテスト</h2>
  <div class="grid">
    <a class="card mat" style="text-decoration:none;color:inherit" href="#/quiz/leap"><span class="k">英語</span><span class="t">LEAP 単語テスト</span><span class="muted">番号の範囲を選んで4択</span></a>
    <a class="card mat" style="text-decoration:none;color:inherit" href="#/quiz/idiom"><span class="k">LEⅠ</span><span class="t">Scramble イディオム</span><span class="muted">意味・空所補充</span></a>
    <a class="card mat" style="text-decoration:none;color:inherit" href="#/quiz"><span class="k">全教科</span><span class="t">選択問題・用語の一問一答</span><span class="muted">予想問題・参考書から</span></a>
  </div>`;
  app.querySelectorAll('[data-open]').forEach(a => a.addEventListener('click', () => remember(a.dataset.open)));
}
function remember(file) { const r = store.get('recent', []).filter(f => f !== file); r.unshift(file); store.set('recent', r.slice(0, 8)); }
function matCard(m) {
  const audio = m.type === 'audio';
  return `<div class="card mat"><span class="k">${esc(SUB[m.subject] || m.subject)}・${esc(KIND[m.kind] || m.kind)}</span>
  <span class="t">${esc(m.title)}</span>${m.desc ? `<span class="muted">${esc(m.desc)}</span>` : ''}
  ${audio ? `<audio controls preload="none" src="${esc(m.file)}"></audio>` : ''}
  <div class="row"><a class="btn sm pri" data-open="${esc(m.file)}" href="${esc(m.file)}" target="_blank" rel="noopener">${audio ? 'ダウンロード' : 'PDFを開く'}</a><span class="muted">${mb(m.size)}</span></div></div>`;
}

// ===== 教材ライブラリ =====
async function library(app, [examId]) {
  const [exams, mats] = await Promise.all([data('exams.json'), data('materials.json')]);
  const st = store.get('libFilter', { exam: exams[0].id, subject: '', kind: '' });
  if (examId) st.exam = examId;
  function draw() {
    store.set('libFilter', st);
    const inExam = mats.filter(m => m.exam === st.exam);
    const subs = [...new Set(inExam.map(m => m.subject))];
    const kinds = [...new Set(inExam.map(m => m.kind))];
    if (st.subject && !subs.includes(st.subject)) st.subject = '';
    if (st.kind && !kinds.includes(st.kind)) st.kind = '';
    const list = inExam.filter(m => (!st.subject || m.subject === st.subject) && (!st.kind || m.kind === st.kind));
    const ex = exams.find(e => e.id === st.exam);
    app.innerHTML = `<h1>教材ライブラリ</h1>
    <div class="muted">試験</div><div class="chips">${exams.map(e => `<button class="chip ${e.id === st.exam ? 'on' : ''}" data-exam="${e.id}">${esc(e.name)}</button>`).join('')}</div>
    <div class="muted">教科</div><div class="chips"><button class="chip ${!st.subject ? 'on' : ''}" data-sub="">すべて</button>${subs.map(s => `<button class="chip ${s === st.subject ? 'on' : ''}" data-sub="${s}">${esc(SUB[s] || s)}</button>`).join('')}</div>
    <div class="muted">種類</div><div class="chips"><button class="chip ${!st.kind ? 'on' : ''}" data-kind="">すべて</button>${kinds.map(k => `<button class="chip ${k === st.kind ? 'on' : ''}" data-kind="${k}">${esc(KIND[k] || k)}</button>`).join('')}</div>
    ${ex && ex.note ? `<p class="muted">${esc(ex.note)}</p>` : ''}
    <div class="grid">${list.map(matCard).join('') || '<div class="empty">該当する教材はありません。</div>'}</div>`;
    app.querySelectorAll('[data-exam]').forEach(b => b.onclick = () => { st.exam = b.dataset.exam; st.subject = ''; st.kind = ''; draw(); });
    app.querySelectorAll('[data-sub]').forEach(b => b.onclick = () => { st.subject = b.dataset.sub; draw(); });
    app.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => { st.kind = b.dataset.kind; draw(); });
    app.querySelectorAll('[data-open]').forEach(a => a.addEventListener('click', () => remember(a.dataset.open)));
  }
  draw();
}

// ===== 日程・範囲 =====
async function schedule(app, [examId]) {
  const [exams, ranges] = await Promise.all([data('exams.json'), data('ranges.json')]);
  const cur = examId || store.get('schedExam', exams.find(e => e.ranges)?.id);
  store.set('schedExam', cur);
  const ex = exams.find(e => e.id === cur) || exams[0];
  const rows = ex.ranges ? ranges[ex.ranges] || [] : [];
  app.innerHTML = `<h1>試験日程と範囲</h1>
  <div class="scroll"><table class="tb"><tr><th>試験</th><th>対象</th><th>日程</th><th>メモ</th></tr>${exams.map(e => `<tr><td><a href="#/schedule/${e.id}">${esc(e.name)}</a></td><td>${esc(e.grade)}</td><td>${e.start ? fmtDate(e.start) + '〜' + fmtDate(e.end) + (e.approx ? '（目安）' : '') : '未定'}</td><td class="muted">${esc(e.note || '')}</td></tr>`).join('')}</table></div>
  <h2>${esc(ex.name)} の範囲</h2>
  ${ex.ranges && ex.ranges !== ex.id ? `<p class="muted">範囲は「${ex.ranges.startsWith('2026-zenki') ? '2026年度 前期期末' : ex.ranges}」の学校配布の範囲表を参考として表示しています。来年度の範囲表が出たら差し替えます。</p>` : ''}
  ${rows.length ? `<div class="scroll"><table class="tb"><tr><th>科目</th><th>教材</th><th>範囲</th><th>日時</th><th>備考</th></tr>${rows.map(r => `<tr><td>${esc(r.kamoku)}</td><td>${esc(r.kyozai)}</td><td>${esc(r.hanni)}</td><td>${r.date ? (r.date.match(/^\d{4}-/) ? fmtDate(r.date) : esc(r.date)) : ''}</td><td class="muted">${esc(r.biko)}</td></tr>`).join('')}</table></div>`
      : '<div class="card muted">この試験の範囲表はまだ登録されていません。教材ライブラリの「範囲表」から、今年度の範囲表（参考）を見られます。</div>'}`;
}

// ===== 進み具合 =====
async function progress(app, [examId]) {
  const [exams, ranges, mats] = await Promise.all([data('exams.json'), data('ranges.json'), data('materials.json')]);
  if (examId === 'score') return scoreMemo(app);
  const cur = examId || store.get('progExam', exams[0].id);
  store.set('progExam', cur);
  const ex = exams.find(e => e.id === cur) || exams[0];
  const items = {};
  const add = (s, id, t) => (items[s] = items[s] || []).push({ id, t });
  for (const r of (ex.ranges ? ranges[ex.ranges] || [] : [])) if (r.hanni) add(r.kamoku, `r:${r.kamoku}:${r.kyozai}`, `${r.kyozai}：${r.hanni}`);
  for (const m of mats.filter(m => m.exam === ex.id && m.type === 'pdf')) add(SUB[m.subject] || m.subject, `m:${m.file}`, `${KIND[m.kind]}「${m.title}」を${m.kind === 'yoso' ? '解いて答え合わせした' : '読み終えた'}`);
  const key = 'chk:' + ex.id; const done = store.get(key, {});
  function draw() {
    const all = Object.values(items).flat(); const n = all.filter(i => done[i.id]).length;
    app.innerHTML = `<h1>進み具合チェック</h1>
    <div class="chips">${exams.map(e => `<a class="chip ${e.id === ex.id ? 'on' : ''}" href="#/progress/${e.id}" style="text-decoration:none">${esc(e.name)}</a>`).join('')}<a class="chip" href="#/progress/score" style="text-decoration:none">百問繚乱の結果メモ</a></div>
    <div class="card"><div class="prog"><span>${esc(ex.name)} 全体</span><span>${n} / ${all.length}</span></div><div class="bar"><i style="width:${all.length ? n / all.length * 100 : 0}%"></i></div>
    <p class="muted" style="margin:8px 0 0">チェックはこの端末（ブラウザ）に保存されます。別の端末とは共有されません。</p></div>
    ${Object.entries(items).map(([s, list]) => { const k = list.filter(i => done[i.id]).length; return `<details class="sub"${k < list.length ? ' open' : ''}><summary><b style="min-width:6em">${esc(s)}</b><div class="bar"><i style="width:${k / list.length * 100}%"></i></div><span class="muted">${k}/${list.length}</span></summary>
      ${list.map(i => `<label class="chk ${done[i.id] ? 'done' : ''}"><input type="checkbox" data-id="${esc(i.id)}" ${done[i.id] ? 'checked' : ''}><span>${esc(i.t)}</span></label>`).join('')}</details>`; }).join('') || '<div class="card empty">この試験のチェック項目はまだありません。</div>'}`;
    app.querySelectorAll('input[data-id]').forEach(c => c.onchange = () => { if (c.checked) done[c.dataset.id] = 1; else delete done[c.dataset.id]; store.set(key, done); const y = scrollY; draw(); scrollTo(0, y); });
  }
  draw();
}
function scoreMemo(app) {
  const list = store.get('scores', []);
  app.innerHTML = `<h1>百問繚乱の結果メモ</h1>
  <p class="muted">百問繚乱で確認したテストの結果を、自分用に記録できます（この端末にだけ保存されます）。</p>
  <div class="row"><a class="btn" href="${HYAKUMON}" target="_blank" rel="noopener">百問繚乱を開く</a><a class="btn" href="#/progress">進み具合に戻る</a></div>
  <div class="card" style="margin-top:12px"><div class="row">
    <input type="date" id="sd" value="${new Date().toISOString().slice(0, 10)}">
    <select id="ss">${Object.entries(SUB).filter(([k]) => !['all', 'eng', 'math', 'koku'].includes(k)).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
    <input type="text" id="sn" placeholder="テスト名（例：単元テスト3）" style="flex:1;min-width:160px">
    <input type="number" id="sp" placeholder="得点" style="width:90px"> / <input type="number" id="sm" placeholder="満点" style="width:90px" value="100">
    <button class="btn pri" id="sa">記録</button></div></div>
  <div class="scroll" style="margin-top:12px"><table class="tb"><tr><th>日付</th><th>科目</th><th>テスト</th><th>得点</th><th></th></tr>
  ${list.map((r, i) => `<tr><td>${esc(r.d)}</td><td>${esc(SUB[r.s])}</td><td>${esc(r.n)}</td><td>${esc(r.p)} / ${esc(r.m)}（${r.m ? Math.round(r.p / r.m * 100) : '-'}%）</td><td><button class="btn sm" data-del="${i}">削除</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">まだ記録がありません。</td></tr>'}</table></div>`;
  $('#sa').onclick = () => { const r = { d: $('#sd').value, s: $('#ss').value, n: $('#sn').value || 'テスト', p: +$('#sp').value, m: +$('#sm').value }; if ($('#sp').value === '') return; list.unshift(r); store.set('scores', list); scoreMemo(app); };
  app.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { list.splice(+b.dataset.del, 1); store.set('scores', list); scoreMemo(app); });
}

// ===== ミニテスト =====
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; };
async function quiz(app, [kind, file]) {
  if (kind === 'leap') return leapSetup(app);
  if (kind === 'idiom') return idiomSetup(app);
  if (kind === 'mc' && file) return runBank(app, file);
  if (kind === 'term' && file) return runTerms(app, file);
  let idx = []; try { idx = await data('quiz/index.json'); } catch { }
  const [exams] = await Promise.all([data('exams.json')]);
  const hist = store.get('quizHist', {});
  const group = (k) => exams.map(e => { const l = idx.filter(x => x.kind === k && x.exam === e.id); return l.length ? `<h3>${esc(e.name)}</h3><div class="grid">${l.map(x => `<a class="card mat" style="text-decoration:none;color:inherit" href="#/quiz/${k}/${encodeURIComponent(x.file)}"><span class="k">${esc(SUB[x.subject] || x.subject)}</span><span class="t">${esc(x.title)}</span><span class="muted">${x.count} 問${hist[x.file] ? `・前回 ${hist[x.file]}` : ''}</span></a>`).join('')}</div>` : ''; }).join('');
  app.innerHTML = `<h1>ミニテスト</h1>
  <div class="grid">
    <a class="card mat" style="text-decoration:none;color:inherit" href="#/quiz/leap"><span class="k">英語</span><span class="t">LEAP 単語テスト</span><span class="muted">範囲を選んで4択（英→日／日→英）</span>${hist.leap ? `<span class="muted">前回 ${hist.leap}</span>` : ''}</a>
    <a class="card mat" style="text-decoration:none;color:inherit" href="#/quiz/idiom"><span class="k">LEⅠ</span><span class="t">Scramble イディオム（Theme 225〜233）</span><span class="muted">意味の4択・空所補充</span>${hist.idiom ? `<span class="muted">前回 ${hist.idiom}</span>` : ''}</a>
  </div>
  <h2>選択問題（予想問題・参考書から）</h2>${group('mc') || '<div class="card muted">準備中です。</div>'}
  <h2>用語の一問一答</h2>${group('term') || '<div class="card muted">準備中です。</div>'}`;
}
// 4択の実行エンジン
function runMC(app, title, qs, histKey, back) {
  let i = 0, score = 0; const wrong = [];
  function show() {
    if (i >= qs.length) return finish();
    const q = qs[i];
    app.innerHTML = `<div class="prog"><span>${esc(title)}</span><span>${i + 1} / ${qs.length}・正解 ${score}</span></div><div class="bar" style="margin-bottom:14px"><i style="width:${i / qs.length * 100}%"></i></div>
    <div class="card">${q.unit ? `<div class="muted">${esc(q.unit)}${q.tag ? `<span class="tag">${esc(q.tag)}</span>` : ''}</div>` : ''}${q.passage ? `<div class="passage">${esc(q.passage)}</div>` : ''}<div class="q">${esc(q.q)}</div>
    <div class="opts">${q.choices.map((c, k) => `<button class="opt" data-k="${k}">${'①②③④⑤⑥'[k]}　${esc(c)}</button>`).join('')}</div><div id="ex"></div></div>`;
    app.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const k = +b.dataset.k; const ok = k === q.answer; if (ok) score++; else wrong.push(q);
      app.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (+x.dataset.k === q.answer) x.classList.add('ok'); });
      if (!ok) b.classList.add('ng');
      $('#ex').innerHTML = `<div class="exp"><b style="color:${ok ? 'var(--ok)' : 'var(--ng)'}">${ok ? '正解！' : '不正解'}</b>${q.explain ? `<br>${esc(q.explain)}` : ''}</div><div class="row" style="margin-top:12px"><button class="btn pri" id="nx">${i + 1 < qs.length ? '次へ' : '結果を見る'}</button></div>`;
      $('#nx').onclick = () => { i++; show(); }; $('#nx').focus();
    });
  }
  function finish() {
    const h = store.get('quizHist', {}); h[histKey] = `${score}/${qs.length}`; store.set('quizHist', h);
    app.innerHTML = `<div class="card" style="text-align:center"><div class="muted">${esc(title)}</div><div class="big">${score} / ${qs.length}</div><div class="muted">正答率 ${Math.round(score / qs.length * 100)}%</div>
    <div class="row" style="justify-content:center;margin-top:12px">${wrong.length ? '<button class="btn pri" id="rw">間違えた問題だけもう一度</button>' : ''}<a class="btn" href="${back}">戻る</a></div></div>
    ${wrong.length ? `<h2>間違えた問題</h2>${wrong.map(q => `<div class="card" style="margin-bottom:8px"><div>${esc(q.q)}</div><div class="muted">正解：${esc(q.choices[q.answer])}</div></div>`).join('')}` : ''}`;
    if (wrong.length) $('#rw').onclick = () => runMC(app, title + '（復習）', shuffle(wrong), histKey + ':rev', back);
  }
  show();
}
async function leapSetup(app) {
  const leap = await data('leap.json');
  const st = store.get('leapSet', { from: 1, to: 500, n: 20, dir: 'en' });
  app.innerHTML = `<h1>LEAP 単語テスト</h1><div class="card">
  <div class="chips">${[[1, 500, '前期中間 1〜500'], [501, 1100, '前期期末 501〜1100'], [1101, 2100, '後期中間 1101〜2100'], [1, 2300, '全部']].map(([a, b, t]) => `<button class="chip" data-r="${a}-${b}">${t}</button>`).join('')}</div>
  <div class="row">番号 <input type="number" id="lf" value="${st.from}" style="width:90px"> 〜 <input type="number" id="lt" value="${st.to}" style="width:90px">　問題数 <select id="ln">${[10, 20, 30, 50].map(n => `<option ${n === st.n ? 'selected' : ''}>${n}</option>`).join('')}</select>
  <select id="ld"><option value="en" ${st.dir === 'en' ? 'selected' : ''}>英語 → 意味</option><option value="ja" ${st.dir === 'ja' ? 'selected' : ''}>意味 → 英語</option></select>
  <button class="btn pri" id="lg">スタート</button></div></div>`;
  app.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { const [a, c] = b.dataset.r.split('-'); $('#lf').value = a; $('#lt').value = c; });
  $('#lg').onclick = () => {
    const s = { from: +$('#lf').value, to: +$('#lt').value, n: +$('#ln').value, dir: $('#ld').value }; store.set('leapSet', s);
    const pool = leap.filter(w => w.n >= s.from && w.n <= s.to); if (pool.length < 4) return;
    const short = m => m.replace(/\[[^\]]*\]/g, '').split(/[②③④；]/)[0].replace(/①/, '').trim();
    const qs = shuffle(pool).slice(0, s.n).map(w => {
      const others = shuffle(pool.filter(x => x.n !== w.n)).slice(0, 3); const opts = shuffle([w, ...others]);
      return s.dir === 'en' ? { unit: `LEAP No.${w.n}`, q: w.w, choices: opts.map(o => short(o.m)), answer: opts.indexOf(w), explain: `${w.w}：${w.m}` }
        : { unit: `LEAP No.${w.n}`, q: short(w.m), choices: opts.map(o => o.w), answer: opts.indexOf(w), explain: `${w.w}：${w.m}` };
    });
    runMC(app, `LEAP ${s.from}〜${s.to}`, qs, 'leap', '#/quiz/leap');
  };
}
async function idiomSetup(app) {
  const id = await data('idioms.json');
  const themes = [...new Set(id.map(x => x.theme))];
  app.innerHTML = `<h1>Scramble イディオム</h1><div class="card">
  <div class="muted">Theme</div><div class="chips"><button class="chip on" data-t="">すべて</button>${themes.map(t => `<button class="chip" data-t="${esc(t)}">${esc(t.split('　')[0])}</button>`).join('')}</div>
  <div class="row"><select id="im"><option value="mean">イディオム → 意味</option><option value="blank">例文の空所補充</option></select> 問題数 <select id="in">${[10, 20, 30].map(n => `<option>${n}</option>`).join('')}</select><button class="btn pri" id="ig">スタート</button></div></div>`;
  let theme = '';
  app.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { theme = b.dataset.t; app.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === b)); });
  $('#ig').onclick = () => {
    const pool = id.filter(x => !theme || x.theme === theme); const mode = $('#im').value;
    const qs = shuffle(pool).slice(0, +$('#in').value).map(w => {
      const o = shuffle([w, ...shuffle(id.filter(x => x.no !== w.no)).slice(0, 3)]);
      if (mode === 'mean') return { unit: `No.${w.no}`, q: w.idiom, choices: o.map(x => x.meaning), answer: o.indexOf(w), explain: `${w.idiom}：${w.meaning}　${w.note || ''}\n${w.example_en}` };
      let s = w.example_en; for (const b of w.blank_answer) s = s.replace(b, '（　　）');
      return { unit: `No.${w.no}`, q: `${s}\n${w.example_ja}`, choices: o.map(x => x.blank_answer.join(' … ')), answer: o.indexOf(w), explain: `${w.idiom}：${w.meaning}\n${w.example_en}` };
    });
    runMC(app, 'Scramble イディオム', qs, 'idiom', '#/quiz/idiom');
  };
}
async function runBank(app, file) {
  const b = await data('quiz/' + file);
  app.innerHTML = `<h1>${esc(b.title)}</h1><div class="card"><p class="muted">${esc(b.source || '')}・全 ${b.questions.length} 問</p>
  <div class="row">出題数 <select id="bn">${[10, 20, 'すべて'].map(n => `<option>${n}</option>`).join('')}</select><label class="row"><input type="checkbox" id="bs" checked> 順番をシャッフル</label><button class="btn pri" id="bg">スタート</button></div></div>`;
  $('#bg').onclick = () => { let q = $('#bs').checked ? shuffle(b.questions) : b.questions.slice(); const n = $('#bn').value; if (n !== 'すべて') q = q.slice(0, +n); runMC(app, b.title, q, file, '#/quiz'); };
}
async function runTerms(app, file) {
  const b = await data('quiz/' + file); let cards = shuffle(b.cards), i = 0, ok = 0; const ng = [];
  function show() {
    if (i >= cards.length) {
      const h = store.get('quizHist', {}); h[file] = `${ok}/${cards.length}`; store.set('quizHist', h);
      app.innerHTML = `<div class="card" style="text-align:center"><div class="muted">${esc(b.title)}</div><div class="big">${ok} / ${cards.length}</div><div class="row" style="justify-content:center">${ng.length ? '<button class="btn pri" id="rv">「まだ」の用語だけもう一度</button>' : ''}<a class="btn" href="#/quiz">戻る</a></div></div>`;
      if (ng.length) $('#rv').onclick = () => { cards = shuffle(ng.splice(0)); i = 0; ok = 0; show(); };
      return;
    }
    const c = cards[i];
    app.innerHTML = `<div class="prog"><span>${esc(b.title)}</span><span>${i + 1} / ${cards.length}</span></div><div class="bar" style="margin-bottom:14px"><i style="width:${i / cards.length * 100}%"></i></div>
    <div class="card"><div class="muted">${esc(c.unit || '')}</div><div class="flash" id="fl"><div class="q">${esc(c.prompt)}</div><div class="muted">タップして答えを表示</div></div>
    <div class="row" style="margin-top:8px"><input type="text" id="ta" placeholder="答えを入力（任意）" style="flex:1"><button class="btn" id="tc">答え合わせ</button></div><div id="tr"></div></div>`;
    const reveal = (typed) => {
      const norm = s => s.replace(/[\s　（）()・]/g, '').toLowerCase();
      const hit = typed && [c.answer, ...(c.alt || [])].some(a => norm(a) === norm(typed));
      $('#fl').innerHTML = `<div class="q">${esc(c.prompt)}</div><div class="ans">${esc(c.answer)}</div>${c.note ? `<div class="muted">${esc(c.note)}</div>` : ''}${typed ? `<div style="color:${hit ? 'var(--ok)' : 'var(--ng)'};font-weight:700">${hit ? '入力した答え：正解' : '入力した答え：' + esc(typed)}</div>` : ''}`;
      $('#tr').innerHTML = `<div class="row" style="margin-top:10px"><button class="btn pri" id="ko">覚えた</button><button class="btn" id="kn">まだ</button></div>`;
      $('#ko').onclick = () => { ok++; i++; show(); }; $('#kn').onclick = () => { ng.push(c); i++; show(); };
    };
    $('#fl').onclick = () => reveal(''); $('#tc').onclick = () => reveal($('#ta').value.trim());
    $('#ta').onkeydown = e => { if (e.key === 'Enter') reveal($('#ta').value.trim()); };
  }
  show();
}

// ===== 成績（みんなの分布・順位表への入口） =====
async function ranking(app, [examSel]) {
  const [cfg, st] = await Promise.all([data('config.json'), data('stats.json')]);
  const exams = st.exams || [];
  const ex = exams.find(e => e.exam === examSel) || exams[0];
  const pct = (s, x) => { // x点以上の人の割合（10点刻みの度数から近似）
    let above = 0; for (const b of s.bins) { if (b.from >= x) above += b.count; else if (b.to > x) above += b.count * (b.to - x) / (b.to - b.from); }
    return Math.max(0, Math.min(100, above / s.n * 100));
  };
  const chart = s => { const mx = Math.max(...s.bins.map(b => b.count), 1); const w = 300, h = 120, bw = w / s.bins.length;
    return `<svg viewBox="0 0 ${w} ${h + 18}" style="width:100%;max-width:420px">${s.bins.map((b, i) => `<rect x="${i * bw + 2}" y="${h - b.count / mx * h}" width="${bw - 4}" height="${b.count / mx * h}" rx="2" fill="var(--pri2)"><title>${b.from}〜${b.to}点：${b.count}人</title></rect>`).join('')}
    <line x1="0" y1="${h}" x2="${w}" y2="${h}" stroke="var(--line)"/>${s.bins.filter((_, i) => i % 2 === 0).map((b, j) => `<text x="${j * 2 * bw + 2}" y="${h + 13}" font-size="9" fill="var(--sub)">${b.from}</text>`).join('')}</svg>`; };
  app.innerHTML = `<h1>みんなの成績</h1>
  <div class="grid">
    <div class="card"><h3 style="margin-top:0">点数を提供する（協力者募集）</h3>
      <p class="muted">学校アカウントでだけ回答できるフォームです。出席番号は二重回答を防ぐためだけに使い、公開しません。</p>
      ${cfg.formUrl ? `<a class="btn pri" href="${esc(cfg.formUrl)}" target="_blank" rel="noopener">回答フォームを開く</a>` : '<span class="muted">（フォームは準備中です）</span>'}</div>
    <div class="card"><h3 style="margin-top:0">順位表（学校アカウント限定）</h3>
      <p class="muted">掲載に同意した人だけがニックネームで載ります。学校アカウントでログインした人だけが見られます。</p>
      ${cfg.rankSheetUrl ? `<a class="btn" href="${esc(cfg.rankSheetUrl)}" target="_blank" rel="noopener">順位表を開く</a>` : '<span class="muted">（順位表は準備中です）</span>'}</div>
  </div>
  <h2>点数の分布（誰の点数かは分からない形で公開）</h2>
  ${!ex ? `<div class="card muted">まだ集計できるデータがありません。協力者が各科目 ${cfg.minN} 人以上集まったら、平均と分布をここに表示します。</div>` : `
  <div class="chips">${exams.map(e => `<a class="chip ${e === ex ? 'on' : ''}" style="text-decoration:none" href="#/ranking/${encodeURIComponent(e.exam)}">${esc(e.exam)}</a>`).join('')}</div>
  <p class="muted">更新日 ${esc(st.updated)}・回答者が ${cfg.minN} 人未満の科目は表示しません。</p>
  <div class="card"><h3 style="margin-top:0">自分の位置を調べる</h3><div class="row"><select id="rs">${ex.subjects.map((s, i) => `<option value="${i}">${esc(s.subject)}</option>`).join('')}</select><input type="number" id="rx" placeholder="自分の点数" style="width:120px"><button class="btn pri" id="rg">調べる</button></div><div id="rr" class="exp" style="display:none"></div>
  <p class="muted" style="margin:8px 0 0">入力した点数はどこにも送信されません（この画面の中だけで計算します）。</p></div>
  <div class="grid" style="margin-top:12px">${ex.subjects.map(s => `<div class="card"><b>${esc(s.subject)}</b> <span class="muted">${s.n}人・平均 ${s.mean}・標準偏差 ${s.sd}</span>${chart(s)}</div>`).join('')}</div>`}`;
  if (ex) $('#rg').onclick = () => { const s = ex.subjects[+$('#rs').value]; const x = +$('#rx').value; if ($('#rx').value === '') return;
    const p = pct(s, x), dev = s.sd ? (50 + 10 * (x - s.mean) / s.sd).toFixed(1) : '-';
    $('#rr').style.display = 'block'; $('#rr').innerHTML = `${esc(s.subject)} ${x}点は、回答者${s.n}人の中で<b>上位 約${Math.max(1, Math.round(p))}%</b>（およそ ${Math.max(1, Math.round(p / 100 * s.n))} 番目前後）です。偏差値の目安は <b>${dev}</b> です。<br><span class="muted">10点刻みの人数から計算した目安です。協力者だけの集計なので、学年全体の順位とは違います。</span>`; };
}
