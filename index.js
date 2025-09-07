function normalizeText(s) {
   if (!s) return '';
   s = s.toLowerCase();
   s = s.replace(/[\u2000-\u206F\u2E00-\u2E7F\'"\-()\[\]{}.,?!:;\/\\]/g, ' ');
   s = s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
   s = s.replace(/\s+/g, ' ').trim();
   return s;
}

function isMatch(userAnswer, expected) {
   const ua = normalizeText(userAnswer);
   const ex = normalizeText(expected);
   if (!ua || !ex) return false;
   if (ua === ex) return true;
   const aWords = ua.split(' ');
   const eWords = ex.split(' ');
   const intersection = aWords.filter(w => eWords.includes(w));
   if (intersection.length >= 1) return true;
   if (ua.includes(ex) || ex.includes(ua)) return true;
   return false;
}

let order = vocab.map((_, i) => i);
let idx = 0;
let score = 0;
let done = 0;
let wrong = 0;
let currentLimit = vocab.length;
const userResults = new Array(vocab.length).fill(null);

const kanjiEl = document.getElementById('kanji');
const kanaEl = document.getElementById('kana');
const idxEl = document.getElementById('index');
const totalEl = document.getElementById('total');
const scoreEl = document.getElementById('score');
const answerEl = document.getElementById('answer');
const feedbackEl = document.getElementById('feedback');
const doneEl = document.getElementById('done');
const wrongEl = document.getElementById('wrongCount');
const reviewList = document.getElementById('reviewList');

function render() {
   const v = vocab[order[idx]];
   kanjiEl.textContent = v.kanji || v.kana || '';
   kanaEl.textContent = v.hiragana || '';
   idxEl.textContent = idx + 1;
   totalEl.textContent = currentLimit;
   scoreEl.textContent = score;
   answerEl.value = '';
   feedbackEl.innerHTML = '<span class="hint">Nhập xong bấm Enter hoặc nhấn "Kiểm tra"</span>';
   renderReview();
}

function renderReview() {
   reviewList.innerHTML = '';
   for (let i = 0; i < currentLimit; i++) {
      const r = userResults[order[i]];
      if (!r) continue;
      const item = document.createElement('div');
      item.style.padding = '8px'; item.style.borderRadius = '8px'; item.style.background = 'rgba(255,255,255,0.01)';
      item.innerHTML = `<strong>${vocab[order[i]].kanji} <span style='color:${r.correct ? "#10b981" : "#ff6b6b"};font-weight:700'>${r.correct ? "✓" : "✗"}</span></strong><div class='small'>Trả lời: ${r.answer || ''} — Đáp án: ${vocab[order[i]].meaning}</div>`;
      reviewList.appendChild(item);
   }
}

function checkAnswer() {
   const v = vocab[order[idx]];
   const user = answerEl.value.trim();
   if (user === '') { feedbackEl.innerHTML = `<span class='hint'>Vui lòng nhập câu trả lời.</span>`; return; }
   const correct = isMatch(user, v.meaning + ' ' + (v.exampleVi || ''));
   userResults[order[idx]] = { answer: user, correct };
   done++;
   if (correct) { score++; feedbackEl.innerHTML = `<span class='correct'>Đúng — đáp án: ${v.meaning}</span>`; }
   else { wrong++; feedbackEl.innerHTML = `<span class='wrong'>Sai — đáp án: ${v.meaning}</span>`; }
   updateStats(); renderReview();
}

function updateStats() { doneEl.textContent = done; wrongEl.textContent = wrong; scoreEl.textContent = score; }

document.getElementById('nextBtn').addEventListener('click', () => { idx = (idx + 1) % currentLimit; render(); });
document.getElementById('prevBtn').addEventListener('click', () => { idx = (idx - 1 + currentLimit) % currentLimit; render(); });
document.getElementById('checkBtn').addEventListener('click', checkAnswer);

answerEl.addEventListener('keydown', (e) => {
   if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); checkAnswer(); }
   if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); idx = (idx + 1) % currentLimit; render(); }
});

document.getElementById('shuffleBtn').addEventListener('click', () => {
   order = order.sort(() => Math.random() - 0.5);
   idx = 0; render();
});

document.getElementById('showAllBtn').addEventListener('click', () => {
   reviewList.innerHTML = '';
   for (let i = 0; i < currentLimit; i++) {
      const item = document.createElement('div');
      item.style.padding = '8px'; item.style.borderRadius = '8px'; item.style.background = 'rgba(255,255,255,0.01)';
      item.innerHTML = `<strong>${vocab[order[i]].kanji} (${vocab[order[i]].hiragana})</strong><div class='small'>${vocab[order[i]].meaning}</div><div class='small'>例: ${vocab[order[i]].exampleJa || ''} — ${vocab[order[i]].exampleVi || ''}</div>`;
      reviewList.appendChild(item);
   }
});

document.getElementById('resetBtn').addEventListener('click', () => {
   order = vocab.map((_, i) => i); idx = 0; score = 0; done = 0; wrong = 0; userResults.fill(null); currentLimit = vocab.length; updateStats(); render();
});

document.getElementById('exportBtn').addEventListener('click', () => {
   const rows = [['kanji', 'hiragana', 'meaning', 'user_answer', 'correct']];
   for (let i = 0; i < currentLimit; i++) {
      const res = userResults[order[i]] || { answer: '', correct: false };
      rows.push([vocab[order[i]].kanji, vocab[order[i]].hiragana, '"' + vocab[order[i]].meaning + '"', '"' + res.answer.replace(/"/g, '""') + '"', res.correct ? 'TRUE' : 'FALSE']);
   }
   const csv = rows.map(r => r.join(',')).join('\n');
   const blob = new Blob([csv], { type: 'text/csv' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a'); a.href = url; a.download = 'vocab_results.csv'; a.click(); URL.revokeObjectURL(url);
});

document.getElementById('applyRangeBtn').addEventListener('click', () => {
   const start = parseInt(document.getElementById('startInput').value);
   const end = parseInt(document.getElementById('endInput').value);
   let s = isNaN(start) ? 1 : start;
   let e = isNaN(end) ? vocab.length : end;
   if (s < 1) s = 1;
   if (e > vocab.length) e = vocab.length;
   if (s > e) { s = 1; e = vocab.length; }
   order = [];
   for (let i = s - 1; i < e; i++) order.push(i);
   currentLimit = order.length;
   idx = 0; score = 0; done = 0; wrong = 0; userResults.fill(null); updateStats(); render();
});

render();