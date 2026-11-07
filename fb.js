// Firebase（ログイン・点数の保存・順位表・公開用の集計）
// 設定は data/firebase.json。空のときは成績機能を「準備中」として表示する。
const V = '10.12.2';
const SCHOOL = /@gl\.pen-kanagawa\.ed\.jp$/i;
const FB = { configured: false, user: null, isAdmin: false, listeners: [] };
window.FB = FB;
FB.SCHOOL_HINT = '@gl.pen-kanagawa.ed.jp';
FB.isSchool = e => SCHOOL.test(e || '');
FB.onUser = f => { FB.listeners.push(f); };
FB.ready = (async () => {
  let cfg = {};
  try { cfg = await (await fetch('data/firebase.json', { cache: 'no-store' })).json(); } catch { }
  if (!cfg.apiKey || !cfg.projectId) return FB;
  const [{ initializeApp }, A, D] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`)
  ]);
  const app = initializeApp({ apiKey: cfg.apiKey, authDomain: cfg.authDomain, projectId: cfg.projectId, appId: cfg.appId });
  const auth = A.getAuth(app), db = D.getFirestore(app);
  FB.configured = true;
  const admins = (cfg.adminEmails || []).map(s => s.toLowerCase());
  // メールのリンクから戻ってきたとき
  if (A.isSignInWithEmailLink(auth, location.href)) {
    let email = localStorage.getItem('stp:loginEmail') || prompt('確認のため、ログインに使った学校のメールアドレスを入力してください');
    try { await A.signInWithEmailLink(auth, email, location.href); localStorage.removeItem('stp:loginEmail'); }
    catch (e) { alert('ログインに失敗しました。リンクの有効期限が切れているか、別の端末で開いた可能性があります。もう一度メールを送ってください。'); }
    history.replaceState(null, '', location.pathname + '#/ranking');
  }
  await new Promise(res => A.onAuthStateChanged(auth, u => {
    FB.user = u && FB.isSchool(u.email) ? u : null;
    if (u && !FB.user) A.signOut(auth);
    FB.isAdmin = !!(FB.user && admins.includes(FB.user.email.toLowerCase()));
    FB.listeners.forEach(f => f(FB.user)); res();
  }));
  FB.sendLink = async email => {
    if (!FB.isSchool(email)) throw new Error('学校のメールアドレス（' + FB.SCHOOL_HINT + '）だけ使えます。');
    await A.sendSignInLinkToEmail(auth, email, { url: location.origin + location.pathname + '#/ranking', handleCodeInApp: true });
    localStorage.setItem('stp:loginEmail', email);
  };
  FB.signOut = () => A.signOut(auth);
  const entryRef = (exam, uid) => D.doc(db, 'exams', exam, 'entries', uid);
  FB.loadMine = async exam => {
    const [e, p] = await Promise.all([D.getDoc(entryRef(exam, FB.user.uid)), D.getDoc(D.doc(db, 'private', FB.user.uid))]);
    return { entry: e.exists() ? e.data() : null, number: p.exists() ? p.data().number || '' : '' };
  };
  FB.saveMine = async (exam, entry, number) => {
    await D.setDoc(entryRef(exam, FB.user.uid), { ...entry, updatedAt: D.serverTimestamp() });
    await D.setDoc(D.doc(db, 'private', FB.user.uid), { number, email: FB.user.email, updatedAt: D.serverTimestamp() });
  };
  FB.deleteMine = async exam => { await D.deleteDoc(entryRef(exam, FB.user.uid)); };
  FB.listPublic = async exam => (await D.getDocs(D.query(D.collection(db, 'exams', exam, 'entries'), D.where('public', '==', true)))).docs.map(d => d.data());
  FB.listAll = async exam => (await D.getDocs(D.collection(db, 'exams', exam, 'entries'))).docs.map(d => d.data());
  FB.readStats = async () => (await D.getDocs(D.collection(db, 'stats'))).docs.map(d => ({ exam: d.id, ...d.data() }));
  FB.writeStats = async (exam, stats) => D.setDoc(D.doc(db, 'stats', exam), stats);
  return FB;
})();
