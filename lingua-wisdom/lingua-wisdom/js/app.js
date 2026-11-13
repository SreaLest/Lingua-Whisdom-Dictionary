// State Management
let currentCategory = 'all';
const LESSON_CATS = ['grade11', 'lgs'];
const PAGE_SIZE = 30;
let filteredList = [];
let renderedCount = 0;
let searchTimer = null;
let loadObserver = null;

document.addEventListener('DOMContentLoaded', () => {
    try { localStorage.removeItem('lw365_dict_favs'); } catch (e) {}
    const sentinel = document.getElementById('load-sentinel');
    if ('IntersectionObserver' in window && sentinel) {
        loadObserver = new IntersectionObserver((entries) => {
            if (entries.some(en => en.isIntersecting) && renderedCount < filteredList.length) renderNextChunk();
        }, { rootMargin: '600px 0px' });
        loadObserver.observe(sentinel);
    }
    updateLessonCounts();
    renderDictionary();
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeRandomModal(); });
document.getElementById('random-modal').addEventListener('click', (e) => {
    if (e.target.id === 'random-modal') closeRandomModal();
});

// Main Render Function
function renderDictionary() {
    const grid = document.getElementById('dictionary-grid');
    const searchVal = document.getElementById('search-input').value.toLowerCase().trim();
    const emptyState = document.getElementById('empty-state');

    grid.innerHTML = '';

    let filtered = dictionaryData.filter(item => {
        const matchesCat = (currentCategory === 'all') || (item.category === currentCategory) || (Array.isArray(item.also) && item.also.includes(currentCategory));
        const matchesSearch = item.word.toLowerCase().includes(searchVal) || (item.num !== undefined && String(item.num) === searchVal);
        return matchesCat && matchesSearch;
    });

    document.getElementById('results-count').textContent = `${filtered.length} kelime listeleniyor`;

    if (filtered.length === 0) {
        const lgsEmpty = currentCategory === 'lgs' && !searchVal;
        document.getElementById('empty-title').textContent = lgsEmpty ? 'LGS kelimeleri yakında eklenecek' : 'Eşleşen kelime bulunamadı';
        document.getElementById('empty-desc').textContent = lgsEmpty ? 'Bu alt başlık hazır, henüz kelime eklenmedi.' : 'Arama kriterlerinizi değiştirerek tekrar deneyebilirsiniz.';
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }
    filteredList = filtered;
    renderedCount = 0;
    renderNextChunk();
}

// Parça parça render (mobilde hızlı açılış)
function renderNextChunk() {
    const grid = document.getElementById('dictionary-grid');
    const end = Math.min(renderedCount + PAGE_SIZE, filteredList.length);
    const frag = document.createDocumentFragment();
    for (let i = renderedCount; i < end; i++) frag.appendChild(createWordCard(filteredList[i]));
    grid.appendChild(frag);
    renderedCount = end;
    updateLoadMore();
}

function updateLoadMore() {
    const wrap = document.getElementById('load-more-wrap');
    const btn = document.getElementById('load-more-btn');
    const remaining = filteredList.length - renderedCount;
    wrap.classList.toggle('hidden', remaining <= 0);
    if (remaining > 0) {
        btn.textContent = 'Daha fazla göster (' + remaining + ' kaldı)';
        if (loadObserver) {
            const sentinel = document.getElementById('load-sentinel');
            loadObserver.unobserve(sentinel);
            loadObserver.observe(sentinel);
        }
    }
}

function loadMore() { renderNextChunk(); }

// Build HTML Card
function createWordCard(item) {
    const card = document.createElement('div');
    card.className = "light-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between";
    card.dataset.cat = (currentCategory !== 'all' && Array.isArray(item.also) && item.also.includes(currentCategory)) ? currentCategory : item.category;
    card.dataset.letter = (String(item.word || '').trim().charAt(0) || '').toUpperCase();

    card.innerHTML = `
        <div>
            <!-- Header Badges & Actions -->
            <div class="flex justify-between items-center mb-4">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700">
                    ${getCategoryBadge((currentCategory !== 'all' && Array.isArray(item.also) && item.also.includes(currentCategory)) ? currentCategory : item.category, item)}
                </span>
            </div>

            <!-- English Word & Pronunciation -->
            <div class="mb-3">
                <div class="flex items-baseline gap-2">
                    <h3 class="text-xl font-extrabold text-brand-purple tracking-tight">
                        ${item.word}
                    </h3>
                    <span class="text-xs font-bold text-slate-400 italic">${item.type}</span>
                </div>
                ${item.ipa ? `<div class="text-xs text-amber-800 font-mono font-semibold bg-amber-50 inline-block px-2 py-0.5 rounded-md mt-1">
                    ${item.ipa}
                </div>` : ''}
            </div>

            <!-- Turkish Meaning -->
            <div class="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 mb-4">
                <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                    Türkçe Karşılığı
                </div>
                <p class="text-slate-900 font-bold text-base">
                    ${item.turkish}
                </p>
            </div>

            <!-- Examples -->
            <div class="space-y-1.5 mb-4 text-xs sm:text-sm">
                <p class="text-slate-700 font-medium leading-relaxed">
                    <i class="fa-solid fa-quote-left text-brand-gold mr-1.5 opacity-70"></i>${item.exampleEn}
                </p>
                <p class="text-slate-500 italic pl-4">
                    ${item.exampleTr}
                </p>
            </div>
        </div>

        <!-- Footer Actions -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
            <button onclick="copyToClipboard('${escapeQuotes(item.word)}: ${escapeQuotes(item.turkish)}')" class="hover:text-brand-purple active:text-brand-purple flex items-center gap-1.5 transition-colors py-2 px-1 -my-1">
                <i class="fa-solid fa-copy"></i> Kopyala
            </button>
            <button onclick="shareWord(${item.id})" class="hover:text-brand-purple active:text-brand-purple flex items-center gap-1.5 transition-colors py-2 px-1 -my-1">
                <i class="fa-solid fa-share-nodes"></i> Paylaş
            </button>
        </div>
    `;

    return card;
}

// Category Badge Helpers
function getCategoryBadge(cat, item) {
    switch(cat) {
        case 'grade11': return (item && item.type === 'grammar')
            ? `<i class="fa-solid fa-spell-check text-teal-500"></i> 11. Sınıf Dilbilgisi · ${item.theme || ''}`
            : `<i class="fa-solid fa-book-open-reader text-sky-500"></i> 11. Sınıf · ${item && item.theme ? item.theme : ''}`;
        case 'lgs': { const th = item && (item.lgsTheme || item.theme); return `<i class="fa-solid fa-graduation-cap text-rose-500"></i> LGS${th ? ' · ' + th : ''}`; }
        case 'basic200': return `<i class="fa-solid fa-star text-amber-500"></i> Temel 417 · ${item && item.theme ? item.theme : ''}`;
        case 'monthsnum': return `<span>📅</span> Aylar & Sayılar · ${item && item.theme ? item.theme : ''}`;
        case 'daily': return `<i class="fa-solid fa-coffee text-amber-500"></i> Günlük Yaşam`;
        case 'business': return `<i class="fa-solid fa-laptop-code text-indigo-500"></i> İş & Teknoloji`;
        case 'travel': return `<i class="fa-solid fa-plane-departure text-emerald-500"></i> Seyahat & Kültür`;
        case 'academic': return `<i class="fa-solid fa-graduation-cap text-purple-500"></i> Akademik`;
        case 'idioms': return `<i class="fa-solid fa-comments text-rose-500"></i> Kalıp İfadeler`;
        default: return `<i class="fa-solid fa-tag"></i> Genel`;
    }
}

// Search Handlers
function handleSearch() {
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search');

    if (input.value.length > 0) {
        clearBtn.classList.remove('hidden');
    } else {
        clearBtn.classList.add('hidden');
    }
    clearTimeout(searchTimer);
    searchTimer = setTimeout(renderDictionary, 150);
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('clear-search').classList.add('hidden');
    renderDictionary();
}

// Category Filter Function
function filterCategory(cat) {
    currentCategory = cat;

    const inLesson = LESSON_CATS.includes(cat);
    document.querySelectorAll('.cat-pill').forEach(btn => {
        if (btn.dataset.cat === cat || (btn.dataset.cat === 'lesson' && inLesson)) {

            btn.className = "cat-pill active whitespace-nowrap px-3 py-2 sm:px-4 rounded-xl sm:rounded-2xl text-[12px] sm:text-sm font-semibold transition-all bg-brand-purple text-white shadow-sm";
        } else {
            btn.className = "cat-pill whitespace-nowrap px-3 py-2 sm:px-4 rounded-xl sm:rounded-2xl text-[12px] sm:text-sm font-semibold transition-all bg-white border border-slate-200 text-slate-600 hover:bg-slate-50";
        }
    });

    document.querySelectorAll('.lesson-item').forEach(el => {
        const on = el.dataset.cat === cat;
        el.classList.toggle('bg-purple-50', on);
        el.classList.toggle('text-brand-purple', on);
        el.classList.toggle('text-slate-700', !on);
    });
    if (!inLesson) toggleLessonCatalog(false);

    document.getElementById('section-title').innerHTML = `<i class="fa-solid fa-list-check text-brand-gold"></i> ${getCategoryName(cat)}`;
    renderDictionary();
}

// Ders Bilgisi kataloğunu aç / kapat
function toggleLessonCatalog(force) {
    const panel = document.getElementById('lesson-panel');
    const open = force !== undefined ? force : panel.classList.contains('hidden');
    panel.classList.toggle('hidden', !open);
    document.getElementById('lesson-chevron').style.transform = open ? 'rotate(180deg)' : '';
    document.getElementById('lesson-toggle').setAttribute('aria-expanded', open ? 'true' : 'false');
}

function updateLessonCounts() {
    document.querySelectorAll('[data-count-cat]').forEach(el => {
        const c = el.dataset.countCat;
        el.textContent = dictionaryData.filter(x => x.category === c || (Array.isArray(x.also) && x.also.includes(c))).length;
    });
}

function getCategoryName(cat) {
    switch(cat) {
        case 'lgs': return 'LGS (Ders Bilgisi › 11. Sınıf)';
        case 'monthsnum': return 'Aylar & Sayılar (1-100)';
        case 'basic200': return 'Temel 417 Kelime';
        case 'grade11': return 'Ders Bilgisi › 11. Sınıf';
        case 'daily': return 'Günlük Yaşam Kelimeleri';
        case 'business': return 'İş & Teknoloji Kelimeleri';
        case 'travel': return 'Seyahat & Kültür';
        case 'academic': return 'Akademik Kelimeler';
        case 'idioms': return 'Kalıp İfadeler ve Deyimler';
        default: return 'Tüm Kelimeler';
    }
}

function resetFilters() {
    currentCategory = 'all';
    document.getElementById('search-input').value = '';
    document.getElementById('clear-search').classList.add('hidden');
    filterCategory('all');
}

// Word of the Day Modal Logic
function openRandomModal() {
    const modal = document.getElementById('random-modal');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('modal-card').classList.remove('scale-95');
    }, 10);
    getRandomWord();
}

function closeRandomModal() {
    const modal = document.getElementById('random-modal');
    modal.classList.add('opacity-0');
    document.getElementById('modal-card').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * dictionaryData.length);
    const item = dictionaryData[randomIndex];
    const content = document.getElementById('modal-content');

    content.innerHTML = `
        <div class="text-center py-2">
            <span class="text-xs font-bold text-slate-400 italic">${item.type}</span>
            <h3 class="text-2xl sm:text-3xl font-black text-brand-purple mb-1">
                ${item.word}
            </h3>
            ${item.ipa ? `<div class="text-xs text-amber-800 font-mono font-semibold bg-amber-50 inline-block px-3 py-1 rounded-lg mb-4">
                ${item.ipa}
            </div>` : ''}

            <div class="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-center mb-4">
                <div class="text-xs font-bold text-brand-purple uppercase tracking-wider mb-1">
                    Türkçe Anlamı
                </div>
                <p class="text-slate-900 font-extrabold text-xl">
                    ${item.turkish}
                </p>
            </div>

            <div class="text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Örnek Cümle</div>
                <p class="text-slate-800 font-medium text-sm mb-1">"${item.exampleEn}"</p>
                <p class="text-slate-500 italic text-xs">"${item.exampleTr}"</p>
            </div>
        </div>
    `;
}

// Dark mode
function updateThemeIcon() {
    const b = document.getElementById('theme-btn');
    if (b) b.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
}
function toggleTheme() {
    const dark = document.documentElement.classList.toggle('dark');
    try { localStorage.setItem('lw_theme', dark ? 'dark' : 'light'); } catch (e) {}
    updateThemeIcon();
}
updateThemeIcon();

// ===== Quick Quiz =====
const QUIZ_LENGTH = 10;
let quizState = null;

function quizEsc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function quizShuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function quizTokens(tr) {
    return String(tr).toLowerCase().split(/[,;\/]/).map(x => x.trim()).filter(Boolean);
}

function buildQuizQuestions() {
    // Aynı kelime iki kez gelmesin
    const seen = new Set();
    const pool = dictionaryData.filter(it => {
        if (!it.word || !it.turkish) return false;
        const k = it.word.toLowerCase().trim();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
    const picked = quizShuffle(pool).slice(0, QUIZ_LENGTH);
    return picked.map(item => {
        const correctTokens = quizTokens(item.turkish);
        const isClose = (other) => {
            const t = quizTokens(other.turkish);
            return t.some(x => correctTokens.includes(x));
        };
        const candidates = quizShuffle(pool.filter(o => o !== item && !isClose(o)));
        // Önce aynı türden (noun/adj./verb...) çeldirici tercih et
        const sameType = candidates.filter(o => o.type === item.type);
        const others = candidates.filter(o => o.type !== item.type);
        const distractors = [];
        const usedTr = new Set([item.turkish.toLowerCase().trim()]);
        for (const o of sameType.concat(others)) {
            const k = o.turkish.toLowerCase().trim();
            if (usedTr.has(k)) continue;
            usedTr.add(k);
            distractors.push(o.turkish);
            if (distractors.length === 3) break;
        }
        const options = quizShuffle([item.turkish, ...distractors]);
        return { item, options, answer: options.indexOf(item.turkish), picked: null };
    });
}

function openQuiz() {
    const modal = document.getElementById('quiz-modal');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('quiz-card').classList.remove('scale-95');
    }, 10);
    startQuiz();
}
function closeQuiz() {
    const modal = document.getElementById('quiz-modal');
    modal.classList.add('opacity-0');
    document.getElementById('quiz-card').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
    quizState = null;
}
function startQuiz() {
    quizState = { questions: buildQuizQuestions(), index: 0, score: 0, answered: false, startedAt: Date.now() };
    renderQuizQuestion();
}

function renderQuizQuestion() {
    const st = quizState;
    if (!st) return;
    const q = st.questions[st.index];
    const total = st.questions.length;
    const content = document.getElementById('quiz-content');
    const letters = ['A', 'B', 'C', 'D'];
    content.innerHTML = `
        <div class="quiz-pop">
            <div class="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                <span>Soru ${st.index + 1} / ${total}</span>
                <span>⭐ ${st.score} doğru</span>
            </div>
            <div class="quiz-bar mb-5"><div style="width:${(st.index / total) * 100}%"></div></div>

            <div class="text-center mb-5">
                <span class="text-xs font-bold text-slate-400 italic">${quizEsc(q.item.type || '')}</span>
                <h3 class="text-3xl sm:text-4xl font-black text-brand-purple break-words">${quizEsc(q.item.word)}</h3>
                ${q.item.ipa ? `<div class="text-xs text-amber-800 font-mono font-semibold bg-amber-50 inline-block px-3 py-1 rounded-lg mt-2">${quizEsc(q.item.ipa)}</div>` : ''}
                <p class="text-xs text-slate-500 mt-3">Türkçe karşılığı hangisi?</p>
            </div>

            <div class="flex flex-col gap-2.5" id="quiz-options">
                ${q.options.map((opt, i) => `
                    <button class="quiz-opt" data-i="${i}" onclick="answerQuiz(${i})">
                        <span class="quiz-key">${letters[i]}</span><span>${quizEsc(opt)}</span>
                    </button>`).join('')}
            </div>

            <div id="quiz-feedback" class="mt-4"></div>
        </div>`;
}

function answerQuiz(i) {
    const st = quizState;
    if (!st || st.answered) return;
    st.answered = true;
    const q = st.questions[st.index];
    q.picked = i;
    const ok = i === q.answer;
    if (ok) st.score++;

    document.querySelectorAll('#quiz-options .quiz-opt').forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === q.answer) btn.classList.add('correct');
        else if (idx === i) btn.classList.add('wrong');
        else btn.classList.add('dim');
    });

    const last = st.index === st.questions.length - 1;
    document.getElementById('quiz-feedback').innerHTML = `
        <div class="quiz-pop">
            <div class="text-sm font-bold mb-2 ${ok ? 'text-emerald-600' : 'text-rose-500'}">${ok ? '✅ Doğru!' : '❌ Yanlış — doğru cevap: ' + quizEsc(q.item.turkish)}</div>
            ${q.item.exampleEn ? `<div class="text-left bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-3">
                <p class="text-slate-800 font-medium text-sm">"${quizEsc(q.item.exampleEn)}"</p>
                ${q.item.exampleTr ? `<p class="text-slate-500 italic text-xs mt-1">"${quizEsc(q.item.exampleTr)}"</p>` : ''}
            </div>` : ''}
            <button onclick="nextQuiz()" class="w-full bg-brand-gold hover:bg-amber-600 text-white font-semibold py-3 rounded-2xl transition-colors text-sm shadow-sm">
                ${last ? 'Sonucu Gör 🏁' : 'Sonraki Soru →'}
            </button>
        </div>`;
}

function nextQuiz() {
    const st = quizState;
    if (!st || !st.answered) return;
    st.answered = false;
    if (st.index < st.questions.length - 1) {
        st.index++;
        renderQuizQuestion();
    } else {
        renderQuizResult();
    }
}

// ===== Quiz Sıralaması (cihazda saklanır) =====
const QUIZ_SCORE_KEY = 'lw_quiz_scores';
function loadQuizScores() {
    try { const a = JSON.parse(localStorage.getItem(QUIZ_SCORE_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}
function saveQuizScore(entry) {
    const list = loadQuizScores();
    list.push(entry);
    list.sort((x, y) => y.score - x.score || x.time - y.time || y.date - x.date);
    const top = list.slice(0, 10);
    try { localStorage.setItem(QUIZ_SCORE_KEY, JSON.stringify(top)); } catch (e) {}
    return top;
}
function quizFmtTime(sec) {
    const m = Math.floor(sec / 60), r = sec % 60;
    return m > 0 ? m + ' dk ' + String(r).padStart(2, '0') + ' sn' : r + ' sn';
}
function quizFmtDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
}
function resetQuizScores() {
    if (!confirm('Tüm quiz sonuçların silinsin mi?')) return;
    try { localStorage.removeItem(QUIZ_SCORE_KEY); } catch (e) {}
    renderQuizResult(true);
}

function renderQuizResult(skipSave) {
    const st = quizState;
    const total = st.questions.length;
    const pct = Math.round((st.score / total) * 100);
    const msg = pct === 100 ? 'Mükemmel! Hepsini bildin 🎉'
        : pct >= 80 ? 'Harika gidiyorsun! 🔥'
        : pct >= 50 ? 'Fena değil, biraz daha pratik! 💪'
        : 'Sorun değil, tekrar dene, öğreneceksin! 📚';
    const wrong = st.questions.filter(q => q.picked !== q.answer);
    if (!st.saved && !skipSave) {
        st.elapsed = Math.round((Date.now() - st.startedAt) / 1000);
        st.entry = { score: st.score, total: total, time: st.elapsed, date: Date.now() };
        st.saved = true;
        st.board = saveQuizScore(st.entry);
    } else {
        st.board = loadQuizScores();
    }
    const myIdx = st.board.findIndex(e => e.date === (st.entry && st.entry.date));
    const medals = ['🥇', '🥈', '🥉'];
    const boardHtml = st.board.length ? `
            <div class="quiz-board text-left p-4 rounded-2xl mb-5">
                <div class="flex items-center justify-between mb-2">
                    <div class="qb-title text-xs font-bold uppercase tracking-wider">🏆 En İyi Sonuçlarım</div>
                    <button onclick="resetQuizScores()" class="qb-reset text-[11px] font-semibold">Sıfırla</button>
                </div>
                <ol class="space-y-1">
                    ${st.board.map((e, i) => `<li class="flex items-center gap-2 text-sm px-2 py-1 rounded-lg ${i === myIdx ? 'qb-me font-bold' : ''}"><span class="w-6 text-center">${medals[i] || (i + 1) + '.'}</span><span class="qb-score font-extrabold">${e.score}/${e.total}</span><span class="qb-time">· ${quizFmtTime(e.time)}</span><span class="qb-date ml-auto text-xs">${quizFmtDate(e.date)}${i === myIdx ? ' · şimdi' : ''}</span></li>`).join('')}
                </ol>
            </div>` : '';
    document.getElementById('quiz-content').innerHTML = `
        <div class="quiz-pop text-center">
            <div class="quiz-bar mb-5"><div style="width:100%"></div></div>
            <div class="text-5xl mb-2">${pct >= 80 ? '🏆' : pct >= 50 ? '👏' : '📖'}</div>
            <div class="text-4xl font-black text-brand-purple">${st.score} / ${total}</div>
            ${st.elapsed != null ? `<div class="text-xs text-slate-400 mt-1">⏱ ${quizFmtTime(st.elapsed)}</div>` : ''}
            <p class="text-sm text-slate-500 mt-1 mb-5">${msg}</p>

            ${boardHtml}
            ${wrong.length ? `
            <div class="text-left bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-5">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tekrar etmen gerekenler</div>
                <ul class="space-y-1.5">
                    ${wrong.map(q => `<li class="text-sm text-slate-800"><span class="font-extrabold text-brand-purple">${quizEsc(q.item.word)}</span> → ${quizEsc(q.item.turkish)}</li>`).join('')}
                </ul>
            </div>` : ''}

            <div class="flex gap-3">
                <button onclick="startQuiz()" class="flex-1 bg-brand-gold hover:bg-amber-600 text-white font-semibold py-3 rounded-2xl transition-colors text-sm shadow-sm">🔄 Yeni Test</button>
                <button onclick="closeQuiz()" class="px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-2xl transition-colors text-sm">Kapat</button>
            </div>
        </div>`;
}

// Klavye: 1-4 / A-D cevap, Enter sonraki, Esc kapat
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('quiz-modal');
    if (!modal || modal.classList.contains('hidden') || !quizState) return;
    if (e.key === 'Escape') { closeQuiz(); return; }
    if (e.key === 'Enter' && quizState.answered) { e.preventDefault(); nextQuiz(); return; }
    const map = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
    const k = e.key.toLowerCase();
    if (k in map && !quizState.answered && document.getElementById('quiz-options')) answerQuiz(map[k]);
});
document.getElementById('quiz-modal').addEventListener('click', (e) => {
    if (e.target.id === 'quiz-modal') closeQuiz();
});

// Clipboard Copy
function copyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showToast('Panoya kopyalandı!');
    } catch (err) {
        showToast('Kopyalama başarısız.');
    }
    document.body.removeChild(textArea);
}

// Kelime kartını görsel olarak paylaş
function drawWordCard(ctx, item, W, H) {
    const F = '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif';
    const PAD = 72, CX = 40, CW = W - 80, INNER = CW - PAD * 2, X = CX + PAD;
    const wrap = (text, font, maxW) => {
        ctx.font = font;
        const words = String(text).split(' ');
        const lines = []; let line = '';
        for (const w of words) {
            const t = line ? line + ' ' + w : w;
            if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
        }
        if (line) lines.push(line);
        return lines;
    };
    const rr = (x, y, w, h, r) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    };
    const draw = H > 0;
    if (draw) {
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#F3E8FF'); g.addColorStop(1, '#FEF3C7');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.shadowColor = 'rgba(91,33,182,0.18)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
        ctx.fillStyle = '#FFFFFF'; rr(CX, 40, CW, H - 80, 56); ctx.fill(); ctx.restore();
    }
    ctx.textBaseline = 'alphabetic';
    let y = 40 + PAD + 36;

    // Marka
    if (draw) { ctx.fillStyle = '#5B21B6'; ctx.font = '800 44px ' + F; ctx.fillText('LinguaWisdom', X, y); }
    y += 34;
    if (draw) {
        ctx.fillStyle = '#F59E0B'; ctx.font = '800 22px ' + F;
        if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
        ctx.fillText('DICTIONARY', X, y);
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    }
    y += 70;

    // Kelime
    const wordFont = '800 88px ' + F;
    const wl = wrap(item.word, wordFont, INNER);
    wl.forEach(line => { y += 92; if (draw) { ctx.fillStyle = '#5B21B6'; ctx.font = wordFont; ctx.fillText(line, X, y); } });
    y += 24;

    // Tür + IPA
    if (draw) { ctx.fillStyle = '#94A3B8'; ctx.font = 'italic 700 34px ' + F; ctx.fillText(item.type, X, y + 30); }
    ctx.font = 'italic 700 34px ' + F;
    const tw = ctx.measureText(item.type).width + 28;
    ctx.font = '600 32px ui-monospace, Menlo, Consolas, monospace';
    const ipaLines = item.ipa ? wrap(item.ipa, '600 32px ui-monospace, Menlo, Consolas, monospace', INNER - tw) : [];
    const ipaW = ipaLines.length ? Math.max(...ipaLines.map(l => ctx.measureText(l).width)) + 40 : 0;
    const ipaH = ipaLines.length ? ipaLines.length * 44 + 20 : 0;
    if (draw && ipaLines.length) {
        ctx.fillStyle = '#FFFBEB'; rr(X + tw, y - 4, ipaW, ipaH, 18); ctx.fill();
        ctx.fillStyle = '#92400E'; ctx.font = '600 32px ui-monospace, Menlo, Consolas, monospace';
        ipaLines.forEach((l, i) => ctx.fillText(l, X + tw + 20, y + 36 + i * 44));
    }
    y += Math.max(ipaH, 52) + 44;

    // Türkçe karşılığı kutusu
    const trFont = '800 56px ' + F;
    const trLines = wrap(item.turkish, trFont, INNER - 80);
    const boxH = 40 + 30 + 28 + trLines.length * 70 + 28;
    if (draw) {
        ctx.fillStyle = '#F3E8FF'; rr(X, y, INNER, boxH, 36); ctx.fill();
        ctx.fillStyle = '#5B21B6'; ctx.font = '800 24px ' + F;
        if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
        ctx.fillText('TÜRKÇE KARŞILIĞI', X + 40, y + 62);
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
        ctx.fillStyle = '#0F172A'; ctx.font = trFont;
        trLines.forEach((l, i) => ctx.fillText(l, X + 40, y + 62 + 28 + 56 + i * 70 - 8));
    }
    y += boxH + 48;

    // Örnek cümleler
    const enFont = '600 38px ' + F, tFont = 'italic 500 34px ' + F;
    const enLines = wrap(item.exampleEn, enFont, INNER - 8);
    const tLines = wrap(item.exampleTr, tFont, INNER - 8);
    if (draw) { ctx.fillStyle = '#F59E0B'; rr(X, y - 6, 8, enLines.length * 54 + 16 + tLines.length * 48 + 8, 4); ctx.fill(); }
    enLines.forEach(l => { y += 54; if (draw) { ctx.fillStyle = '#334155'; ctx.font = enFont; ctx.fillText(l, X + 32, y - 8); } });
    y += 16;
    tLines.forEach(l => { y += 48; if (draw) { ctx.fillStyle = '#64748B'; ctx.font = tFont; ctx.fillText(l, X + 32, y - 8); } });
    y += 56;

    // Alt bilgi
    if (draw) {
        ctx.fillStyle = '#CBD5E1'; ctx.fillRect(X, y, INNER, 2);
        ctx.fillStyle = '#94A3B8'; ctx.font = '600 26px ' + F; ctx.textAlign = 'center';
        ctx.fillText('LinguaWisdom Dictionary', W / 2, y + 56); ctx.textAlign = 'left';
    }
    y += 56 + 40 + PAD / 2;
    return y + 40;
}

async function buildWordImage(item) {
    try {
        await Promise.all([
            document.fonts.load('800 60px "Plus Jakarta Sans"'),
            document.fonts.load('600 30px "Plus Jakarta Sans"'),
            document.fonts.load('italic 500 30px "Plus Jakarta Sans"')
        ]);
    } catch (e) {}
    const W = 1080;
    const probe = document.createElement('canvas').getContext('2d');
    const H = Math.max(drawWordCard(probe, item, W, 0), 900);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    drawWordCard(c.getContext('2d'), item, W, H);
    return new Promise(res => c.toBlob(res, 'image/png'));
}

async function shareWord(id) {
    const item = dictionaryData.find(x => x.id === id);
    if (!item) return;
    showToast('Görsel hazırlanıyor...');
    try {
        const blob = await buildWordImage(item);
        if (!blob) throw new Error('blob');
        const name = item.word.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';
        const file = new File([blob], name, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: item.word });
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = name;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
            showToast('Görsel indirildi');
        }
    } catch (err) {
        if (err && err.name === 'AbortError') return;
        copyToClipboard(item.word + ' - ' + item.turkish);
    }
}

// Toast Notification
function showToast(message) {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toast-msg');
    msg.textContent = message;

    toast.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');

    setTimeout(() => {
        toast.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
    }, 2500);
}

function escapeQuotes(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
