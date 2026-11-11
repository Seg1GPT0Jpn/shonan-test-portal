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
    <div class="opts">${q.choices.map((c, k) => `<button class="opt" data-k="${k}">${'①②③④⑤⑥'[k]}　${esc(String(c).replace(/^\s*[0-9０-９][\.．、)）]\s*/, ''))}</button>`).join('')}</div><div id="ex"></div></div>`;
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

// ===== 成績（点数の提出・順位表・分布） =====
const SUBJ = ['現代の国語', '言語文化', '数学Ⅰ', '数学A', '化学基礎', '生物基礎', 'ECⅠ', '論表Ⅰ', '地理総合', '公共', '情報Ⅰ'];
const MIN_N = 10;
function statsOf(xs, top, step) {
  const n = xs.length, mean = xs.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  const bins = []; for (let a = 0; a < top; a += step) bins.push({ from: a, to: a + step, count: xs.filter(x => (x >= a && x < a + step) || (a + step === top && x === top)).length });
  return { n, mean: Math.round(mean * 10) / 10, sd: Math.round(sd * 10) / 10, top, bins };
}
function chartSVG(s) {
  const mx = Math.max(...s.bins.map(b => b.count), 1), w = 300, h = 120, bw = w / s.bins.length;
  return `<svg viewBox="0 0 ${w} ${h + 18}" style="width:100%;max-width:420px">${s.bins.map((b, i) => `<rect x="${i * bw + 2}" y="${h - b.count / mx * h}" width="${bw - 4}" height="${b.count / mx * h}" rx="2" fill="var(--pri2)"><title>${b.from}〜${b.to}点：${b.count}人</title></rect>`).join('')}<line x1="0" y1="${h}" x2="${w}" y2="${h}" stroke="var(--line)"/>${s.bins.filter((_, i) => i % 2 === 0).map((b, j) => `<text x="${j * 2 * bw + 2}" y="${h + 13}" font-size="9" fill="var(--sub)">${b.from}</text>`).join('')}</svg>`;
}
// 点数は「提出コード」にして管理者へ送り、管理者が集計ファイル（data/ranking/<試験>.json）を公開する。
// サーバー・外部サービスは使わない。出席番号は提出コードの中だけにあり、公開ファイルには入れない。
const CODE_HEAD = 'STP1-';
function encCode(o) { const b = new TextEncoder().encode(JSON.stringify(o)); let s = ''; b.forEach(x => s += String.fromCharCode(x)); return CODE_HEAD + btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function decCode(c) {
  try {
    const s = atob(c.slice(CODE_HEAD.length).replace(/-/g, '+').replace(/_/g, '/'));
    const o = JSON.parse(new TextDecoder().decode(Uint8Array.from(s, ch => ch.charCodeAt(0))));
    if (!o || typeof o.e !== 'string' || !/^\d{4}$/.test(o.n) || typeof o.k !== 'string' || typeof o.s !== 'object') return null;
    const scores = {}; for (const [k, v] of Object.entries(o.s)) { const name = SUBJ[+k]; if (name && Number.isFinite(v) && v >= 0 && v <= 100) scores[name] = v; }
    return { exam: o.e, number: o.n, nickname: o.k.slice(0, 20), public: !!o.p, scores, at: o.t || 0 };
  } catch { return null; }
}
const totalOf = sc => SUBJ.every(s => s in sc) ? SUBJ.reduce((a, s) => a + sc[s], 0) : null;
async function rankingFile(exam) { try { const r = await fetch(`data/ranking/${exam}.json`, { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch { return null; } }
function download(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }

async function ranking(app, [tab]) {
  const exams = await data('exams.json');
  tab = tab || 'board';
  const exSel = store.get('rankExam', exams[0].id);
  const exName = id => (exams.find(e => e.id === id) || {}).name || id;
  const head = `<h1>みんなの成績</h1><div class="chips">${[['board', '順位表'], ['dist', '点数の分布'], ['submit', '点数を提出']].map(([k, t]) => `<a class="chip ${k === tab ? 'on' : ''}" style="text-decoration:none" href="#/ranking/${k}">${t}</a>`).join('')}</div>`;
  const examSel = `<div class="row" style="margin-bottom:8px"><span class="muted">試験</span><select id="rex">${exams.map(e => `<option value="${e.id}" ${e.id === exSel ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select></div>`;
  const bindEx = () => { const s = $('#rex'); if (s) s.onchange = () => { store.set('rankExam', s.value); ranking(app, [tab]); }; };

  if (tab === 'submit') {
    const mine = store.get('myScore:' + exSel, { nickname: store.get('nick', ''), number: '', public: true, scores: {} });
    app.innerHTML = head + `<div class="card">${examSel}
    <p class="muted" style="margin-top:0">点数を入れて「提出コードを作る」を押し、できたコードを<b>集計係</b>にLINEなどで送ってください。集計係がまとめて順位表と分布を更新します（反映まで少し時間がかかります）。</p>
    <div class="row"><label style="min-width:9em">ニックネーム</label><input type="text" id="fn" maxlength="20" value="${esc(mine.nickname)}" placeholder="順位表に載る名前（本名は避けて）" style="flex:1"></div>
    <div class="row" style="margin-top:8px"><label style="min-width:9em">出席番号（4桁）</label><input type="text" id="fno" maxlength="4" inputmode="numeric" value="${esc(mine.number)}" placeholder="例：1104" style="width:110px"><span class="muted">集計係だけが見ます。順位表にも分布にも出しません</span></div>
    <h3>点数（0〜100、受けていない・言いたくない科目は空欄）</h3>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${SUBJ.map(s => `<label class="row" style="justify-content:space-between"><span>${s}</span><input type="number" min="0" max="100" data-s="${s}" value="${mine.scores[s] ?? ''}" style="width:80px"></label>`).join('')}</div>
    <label class="chk" style="border:0"><input type="checkbox" id="fp" ${mine.public ? 'checked' : ''}><span>順位表にニックネームで載せる（チェックを外すと、誰の点数か分からない分布の集計だけに使います）</span></label>
    <label class="chk" style="border:0"><input type="checkbox" id="fa"><span>この点数が、順位表（載せる場合・このサイトで誰でも見られます）と分布の集計に使われることに同意します。直したいときは作り直したコードを送れば、新しいほうで上書きされます。消したいときは集計係に伝えてください。</span></label>
    <div class="row"><button class="btn pri" id="fsv">提出コードを作る</button><span id="fmsg" class="muted"></span></div>
    <div id="fout" style="display:none;margin-top:10px"><textarea id="fcode" readonly rows="3" style="width:100%;font:12px monospace;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--chip);color:var(--ink)"></textarea>
    <div class="row" style="margin-top:6px"><button class="btn" id="fcp">コピー</button><a class="btn" id="fline" target="_blank" rel="noopener">LINEで送る</a></div></div></div>
    <p class="muted" style="margin-top:12px">集計係の人は <a href="#/ranking/admin">集計ページ</a> を使います。</p>`;
    bindEx();
    $('#fsv').onclick = () => {
      const nick = $('#fn').value.trim(), no = $('#fno').value.trim();
      if (!nick) return $('#fmsg').textContent = 'ニックネームを入れてください。';
      if (!/^\d{4}$/.test(no)) return $('#fmsg').textContent = '出席番号は4桁の数字で入れてください。';
      if (!$('#fa').checked) return $('#fmsg').textContent = '同意にチェックしてください。';
      const scores = {}, s = {}; let bad = false;
      app.querySelectorAll('[data-s]').forEach(i => { if (i.value === '') return; const v = +i.value; if (!(v >= 0 && v <= 100)) bad = true; else { scores[i.dataset.s] = v; s[SUBJ.indexOf(i.dataset.s)] = v; } });
      if (bad) return $('#fmsg').textContent = '点数は0〜100で入れてください。';
      if (!Object.keys(scores).length) return $('#fmsg').textContent = '点数を1科目以上入れてください。';
      store.set('myScore:' + exSel, { nickname: nick, number: no, public: $('#fp').checked, scores }); store.set('nick', nick);
      const code = encCode({ e: exSel, n: no, k: nick, p: $('#fp').checked ? 1 : 0, s, t: Date.now() });
      $('#fcode').value = code; $('#fout').style.display = 'block'; $('#fmsg').textContent = 'コードができました。集計係に送ってください。';
      $('#fline').href = 'https://line.me/R/share?text=' + encodeURIComponent(`${exName(exSel)}の点数です\n${code}`);
    };
    $('#fcp').onclick = async () => { try { await navigator.clipboard.writeText($('#fcode').value); $('#fmsg').textContent = 'コピーしました。'; } catch { $('#fcode').select(); $('#fmsg').textContent = '選択したので、長押しでコピーしてください。'; } };
    return;
  }

  if (tab === 'admin') {
    const saved = store.get('adminCodes', '');
    app.innerHTML = head + `<div class="card">${examSel}
    <h3 style="margin-top:0">集計係用ページ</h3>
    <p class="muted">みんなから届いた提出コード（<code>${CODE_HEAD}</code>で始まる文字列）を下にまとめて貼り付けてください。LINEのトークをそのまま貼っても、コードだけを読み取ります。同じ出席番号のコードが複数あるときは、新しく作られたほうを使います。<b>貼り付けた内容はこの端末の中だけで処理され、どこにも送信されません。</b></p>
    <textarea id="acodes" rows="8" style="width:100%;font:12px monospace;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink)" placeholder="ここに貼り付け">${esc(saved)}</textarea>
    <div class="row" style="margin-top:6px"><button class="btn pri" id="ago">読み取る</button><button class="btn" id="aclr">貼り付けた内容を消す</button><span id="amsg" class="muted"></span></div>
    <div id="aout"></div></div>`;
    bindEx();
    $('#aclr').onclick = () => { if (!confirm('貼り付けた内容をこの端末から消しますか？')) return; store.set('adminCodes', ''); $('#acodes').value = ''; $('#aout').innerHTML = ''; };
    $('#ago').onclick = () => {
      const text = $('#acodes').value; store.set('adminCodes', text);
      const found = (text.match(/STP1-[A-Za-z0-9_-]+/g) || []).map(decCode);
      const bad = found.filter(x => !x).length, ok = found.filter(x => x && x.exam === exSel), other = found.filter(x => x && x.exam !== exSel).length;
      const by = new Map(); for (const x of ok) { const p = by.get(x.number); if (!p || x.at >= p.at) by.set(x.number, x); }
      const list = [...by.values()].sort((a, b) => a.number.localeCompare(b.number));
      const subjects = [];
      for (const s of SUBJ) { const xs = list.map(r => r.scores[s]).filter(v => typeof v === 'number'); if (xs.length >= MIN_N) subjects.push({ subject: s, ...statsOf(xs, 100, 10) }); }
      const ts = list.map(r => totalOf(r.scores)).filter(v => typeof v === 'number'); if (ts.length >= MIN_N) subjects.push({ subject: '合計', ...statsOf(ts, 1100, 100) });
      const pub = { exam: exSel, updated: new Date().toISOString().slice(0, 10), count: list.length, entries: list.filter(r => r.public).map(r => ({ nickname: r.nickname, scores: r.scores, total: totalOf(r.scores) })), subjects };
      $('#amsg').textContent = `読み取り ${ok.length} 件 → ${list.length} 人分` + (other ? `（別の試験のコード ${other} 件は除外）` : '') + (bad ? `（読めないコード ${bad} 件）` : '');
      $('#aout').innerHTML = `<div class="scroll" style="margin-top:10px"><table class="tb"><tr><th>出席番号</th><th>ニックネーム</th><th>掲載</th><th>科目数</th><th>合計</th></tr>${list.map(r => `<tr><td>${esc(r.number)}</td><td>${esc(r.nickname)}</td><td>${r.public ? '載せる' : '載せない'}</td><td>${Object.keys(r.scores).length}</td><td>${totalOf(r.scores) ?? '-'}</td></tr>`).join('')}</table></div>
      <p class="muted">出席番号はこの表（この端末の中）にだけ表示され、公開用ファイルには入りません。公開用ファイルには、掲載に同意した人のニックネームと点数、全員分から計算した分布（${MIN_N}人以上の科目だけ）が入ります。</p>
      <div class="row"><button class="btn pri" id="adl">公開用ファイルを保存（${esc(exSel)}.json）</button></div>
      <p class="muted">保存したファイルを、GitHub のリポジトリの <code>data/ranking/</code> フォルダにアップロードする（同じ名前のファイルは置き換え）と、数分で順位表と分布に反映されます。アップロードが難しければ、ファイルを Claude に渡しても反映できます。</p>`;
      $('#adl').onclick = () => download(exSel + '.json', JSON.stringify(pub, null, 1));
    };
    if (saved) $('#ago').click();
    return;
  }

  const f = await rankingFile(exSel);
  if (tab === 'dist') {
    const st = f && f.subjects || [];
    app.innerHTML = head + `<div class="card">${examSel}${!st.length ? `<p class="muted" style="margin:0">まだ公開できる集計がありません。各科目の提出者が ${MIN_N} 人以上になったら、平均と分布をここに表示します。</p>` : `
    <p class="muted" style="margin:0">更新 ${esc(f.updated)}・提出 ${f.count} 人。誰の点数か分からない形（人数・平均・標準偏差・10点刻みの人数）だけを表示しています。提出者が ${MIN_N} 人未満の科目は表示しません。</p>`}</div>
    ${st.length ? `<div class="card" style="margin-top:12px"><h3 style="margin-top:0">自分の位置を調べる</h3><div class="row"><select id="rs">${st.map((s, i) => `<option value="${i}">${esc(s.subject)}</option>`).join('')}</select><input type="number" id="rx" placeholder="自分の点数" style="width:120px"><button class="btn pri" id="rg">調べる</button></div><div id="rr" class="exp" style="display:none"></div><p class="muted" style="margin:8px 0 0">入力した点数は送信されません（この画面の中だけで計算します）。</p></div>
    <div class="grid" style="margin-top:12px">${st.map(s => `<div class="card"><b>${esc(s.subject)}</b> <span class="muted">${s.n}人・平均 ${s.mean}・標準偏差 ${s.sd}</span>${chartSVG(s)}</div>`).join('')}</div>` : ''}`;
    bindEx();
    if (st.length) $('#rg').onclick = () => { const s = st[+$('#rs').value]; if ($('#rx').value === '') return; const x = +$('#rx').value;
      let above = 0; for (const b of s.bins) { if (b.from >= x) above += b.count; else if (b.to > x) above += b.count * (b.to - x) / (b.to - b.from); }
      const p = Math.max(1, Math.round(above / s.n * 100)), dev = s.sd ? (50 + 10 * (x - s.mean) / s.sd).toFixed(1) : '-';
      $('#rr').style.display = 'block'; $('#rr').innerHTML = `${esc(s.subject)} ${x}点は、提出者${s.n}人の中で<b>上位 約${p}%</b>（${Math.max(1, Math.round(p / 100 * s.n))} 番目前後）、偏差値の目安は <b>${dev}</b> です。<br><span class="muted">10点刻みの人数から計算した目安です。提出者だけの集計なので、学年全体の順位とは違います。</span>`; };
    return;
  }
  // 順位表
  const list = f && f.entries || [];
  const subjSel = store.get('rankSub', '合計');
  const val = r => subjSel === '合計' ? r.total : r.scores?.[subjSel];
  const rows = list.filter(r => typeof val(r) === 'number').sort((a, b) => val(b) - val(a));
  let rank = 0, prev = null; rows.forEach((r, i) => { if (val(r) !== prev) rank = i + 1; r._rank = rank; prev = val(r); });
  app.innerHTML = head + `<div class="card">${examSel}
  <div class="chips">${['合計', ...SUBJ].map(s => `<button class="chip ${s === subjSel ? 'on' : ''}" data-rs="${s}">${s}</button>`).join('')}</div>
  <p class="muted">${f ? `更新 ${esc(f.updated)}・` : ''}掲載に同意した ${rows.length} 人の順位です（合計は11科目すべてを提出した人だけ）。点数は本人の申告で、集計係が確認したものではありません。</p>
  <div class="scroll"><table class="tb"><tr><th>順位</th><th>ニックネーム</th><th>${esc(subjSel)}</th></tr>${rows.map(r => `<tr><td>${r._rank}</td><td>${esc(r.nickname)}</td><td>${val(r)}</td></tr>`).join('') || `<tr><td colspan="3" class="muted">まだありません。<a href="#/ranking/submit">点数を提出</a>してください。</td></tr>`}</table></div></div>`;
  bindEx();
  app.querySelectorAll('[data-rs]').forEach(b => b.onclick = () => { store.set('rankSub', b.dataset.rs); ranking(app, ['board']); });
}
