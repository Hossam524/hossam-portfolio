"use strict";

function $(id) {
  return document.getElementById(id);
}

// عناصر الواجهة
var stageCountEl = $("stageCount");
var mixModeEl = $("mixMode");
var difficultyEl = $("difficulty");
var startBtn = $("startBtn");
var resetBtn = $("resetBtn");
var ll5050 = $("ll5050");
var llAudience = $("llAudience");
var llPhone = $("llPhone");
var pStage = $("pStage");
var pQ = $("pQ");
var pScore = $("pScore");
var catBadge = $("catBadge");
var lvlBadge = $("lvlBadge");
var questionText = $("questionText");
var choicesEl = $("choices");
var hintBox = $("hintBox");
var nextBtn = $("nextBtn");
var quitBtn = $("quitBtn");
var overlay = $("overlay");
var ovTitle = $("ovTitle");
var ovText = $("ovText");
var ovContinue = $("ovContinue");
var ovClose = $("ovClose");
var ovStats = $("ovStats");
var stCorrect = $("stCorrect");
var stWrong = $("stWrong");
var stScore = $("stScore");
var ovBio = $("ovBio");

// --- العناصر الجديدة لعرض الإحصائيات أثناء اللعب ---
// تأكد إن عندك Span أو Div في الـ HTML بالـ IDs دي:
var liveCorrectEl = $("liveCorrect"); // عداد الصح
var liveWrongEl = $("liveWrong"); // عداد الغلط

var CAT_NAME = {
  religion: "ديني 🕌",
  general: "معلومات عامة 🌍",
  logic: "ذكاء 🧠",
  education: "تعليم 🧑‍🏫",
  mixed: "متنوع",
  space: "الفضاء والكون 🌌",
};

var BANK = [];

async function loadQuestionsFromTXT() {
  try {
    const response = await fetch("raw_questions.txt");
    if (!response.ok) throw new Error("الملف مش موجود (404).");
    const data = await response.text();
    if (!data.trim()) throw new Error("الملف فاضي!");
    const lines = data.split("\n");
    let loadedQuestions = lines
      .map((line) => {
        if (!line.trim() || !line.includes("|")) return null;
        let parts = line.split("|");
        if (parts.length < 9) return null;
        return {
          cat: parts[0].replace("[", "").replace("]", "").trim(),
          lvl: parseInt(parts[1]),
          q: parts[2].trim(),
          choices: [
            parts[3].trim(),
            parts[4].trim(),
            parts[5].trim(),
            parts[6].trim(),
          ],
          answer: parseInt(parts[7]) - 1,
          explain: parts[8].trim(),
        };
      })
      .filter((q) => q !== null);
    BANK = loadedQuestions;
    return true;
  } catch (err) {
    if (hintBox) hintBox.textContent = "⚠️ عطل: " + err.message;
    return false;
  }
}

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

var settings = { stages: 5, mode: "mixed", diff: "ladder" };

var state = {
  inGame: false,
  stage: 1,
  qInStage: 1,
  score: 0,
  correct: 0,
  wrong: 0,
  current: null,
  answered: false,
  used5050: false,
  usedAudience: false,
  usedPhone: false,
  plan: [],
  planIndex: 0,
};

function setIdleUI() {
  if (catBadge) catBadge.textContent = "—";
  if (lvlBadge) lvlBadge.textContent = "—";
  if (questionText) questionText.textContent = 'اضغط "ابدأ اللعبة"';
  if (choicesEl) choicesEl.innerHTML = "";
  if (hintBox) hintBox.textContent = "";
  if (pStage) pStage.textContent = "—";
  if (pQ) pQ.textContent = "—";
  if (pScore) pScore.textContent = "0";
  if (liveCorrectEl) liveCorrectEl.textContent = "0";
  if (liveWrongEl) liveWrongEl.textContent = "0";
  if (nextBtn) nextBtn.disabled = true;
  if (quitBtn) quitBtn.disabled = true;
  updateLifelinesUI(true);
}

function lockChoices(lock) {
  if (!choicesEl) return;
  var btns = choicesEl.querySelectorAll(".choice");
  for (var i = 0; i < btns.length; i++) {
    btns[i].disabled = !!lock;
    btns[i].classList.toggle("disabled", !!lock);
  }
}

function updateLifelinesUI(forceDisableAll) {
  if (!ll5050 || !llAudience || !llPhone) return;
  var disableAll = !!forceDisableAll || !state.inGame;
  ll5050.disabled = disableAll || state.used5050 || state.answered;
  llAudience.disabled = disableAll || state.usedAudience || state.answered;
  llPhone.disabled = disableAll || state.usedPhone || state.answered;
  ll5050.classList.toggle("used", !!state.used5050);
  llAudience.classList.toggle("used", !!state.usedAudience);
  llPhone.classList.toggle("used", !!state.usedPhone);
}

function resetLifelines() {
  state.used5050 = false;
  state.usedAudience = false;
  state.usedPhone = false;
  updateLifelinesUI(false);
}

function buildPlan() {
  settings.stages = clamp(
    Number(stageCountEl && stageCountEl.value ? stageCountEl.value : 5),
    1,
    50,
  );
  settings.mode = String(
    mixModeEl && mixModeEl.value ? mixModeEl.value : "mixed",
  );
  settings.diff = String(
    difficultyEl && difficultyEl.value ? difficultyEl.value : "ladder",
  );
  var wanted = settings.stages * 20;
  var filtered = BANK.filter(
    (q) => settings.mode === "mixed" || String(q.cat) === String(settings.mode),
  );
  state.plan = shuffle(filtered).slice(0, Math.min(wanted, filtered.length));
  state.planIndex = 0;
  return { ok: state.plan.length > 0, msg: "⚠️ مفيش أسئلة." };
}

function nextFromPlan() {
  if (state.planIndex >= state.plan.length) return null;
  return state.plan[state.planIndex++];
}

function renderQuestion(q) {
  if (!q || !choicesEl) return;
  state.current = q;
  state.answered = false;
  if (catBadge) catBadge.textContent = CAT_NAME[q.cat] || String(q.cat || "—");
  if (lvlBadge) lvlBadge.textContent = "مستوى " + String(q.lvl ?? 1);
  if (questionText) questionText.textContent = String(q.q ?? "—");
  choicesEl.innerHTML = "";
  ["A", "B", "C", "D"].forEach((letter, i) => {
    var btn = document.createElement("button");
    btn.className = "choice";
    btn.setAttribute("data-i", i);
    btn.textContent = letter + ": " + (q.choices[i] || "");
    btn.onclick = () => answer(i);
    choicesEl.appendChild(btn);
  });
  pStage.textContent = state.stage + "/" + settings.stages;
  pQ.textContent = state.qInStage + "/20";
  pScore.textContent = state.score;
  if (liveCorrectEl) liveCorrectEl.textContent = state.correct;
  if (liveWrongEl) liveWrongEl.textContent = state.wrong;
  nextBtn.disabled = true;
  updateLifelinesUI(false);
}

function answer(i) {
  if (!state.inGame || state.answered || !state.current) return;
  state.answered = true;
  var q = state.current;
  var isCorrect = i === q.answer;
  lockChoices(true);
  choicesEl.querySelectorAll(".choice").forEach((btn) => {
    var bi = Number(btn.getAttribute("data-i"));
    if (bi === q.answer) btn.classList.add("correct");
    if (bi === i && !isCorrect) btn.classList.add("wrong");
  });
  if (isCorrect) {
    state.score += 10;
    state.correct += 1;
    hintBox.textContent = "✅ " + (q.explain || "إجابة ممتازة!");
  } else {
    state.wrong += 1;
    hintBox.textContent = "❌ " + (q.explain || "للأسف إجابة خاطئة.");
  }
  pScore.textContent = state.score;
  if (liveCorrectEl) liveCorrectEl.textContent = state.correct;
  if (liveWrongEl) liveWrongEl.textContent = state.wrong;
  nextBtn.disabled = false;
  updateLifelinesUI(false);
}

async function startGame() {
  if (BANK.length === 0) {
    const ok = await loadQuestionsFromTXT();
    if (!ok) return;
  }
  if (!buildPlan().ok) return;
  state.inGame = true;
  state.stage = 1;
  state.qInStage = 1;
  state.score = 0;
  state.correct = 0;
  state.wrong = 0;
  resetLifelines();
  renderQuestion(nextFromPlan());
}

function resetGame() {
  state.inGame = false;
  overlay.classList.remove("show");
  setIdleUI();
}

function nextStep() {
  if (!state.inGame || !state.answered) return;
  if (state.qInStage >= 20) {
    if (state.stage >= settings.stages) {
      state.inGame = false;
      // --- حساب الرسالة التحفيزية ---
      let percent = (state.correct / (settings.stages * 20)) * 100;
      let msg =
        percent >= 90
          ? "أنت عبقري حقيقي! 🌟"
          : percent >= 70
            ? "بطل! استمر في التعلم. ✨"
            : "محاولة جيدة، حاول مرة أخرى! 💪";
      showOverlay("🏁 النتيجة النهائية", msg, "إعادة اللعبة", true);
      return;
    }
    showOverlay(
      "🎉 كفو!",
      "خلصت المرحلة " + state.stage,
      "المرحلة التالية",
      false,
    );
    return;
  }
  state.qInStage++;
  renderQuestion(nextFromPlan());
}

function showOverlay(title, text, btnTxt, stats) {
  overlay.classList.add("show");
  ovTitle.textContent = title;
  ovText.textContent = text;
  ovContinue.textContent = btnTxt;
  ovStats.style.display = stats ? "grid" : "none";
  if (stats) {
    stCorrect.textContent = state.correct;
    stWrong.textContent = state.wrong;
    stScore.textContent = state.score;
  }
}

// ربط الأزرار
if (startBtn) startBtn.onclick = startGame;
if (resetBtn) resetBtn.onclick = resetGame;
if (quitBtn) quitBtn.onclick = resetGame;
if (nextBtn) nextBtn.onclick = nextStep;
if (ovContinue) {
  ovContinue.onclick = () => {
    overlay.classList.remove("show");
    if (state.inGame) {
      state.stage++;
      state.qInStage = 1;
      renderQuestion(nextFromPlan());
    } else startGame();
  };
}

// المساعدات
if (ll5050)
  ll5050.onclick = () => {
    if (!state.inGame || state.used5050 || state.answered) return;
    state.used5050 = true;
    let wrong = [0, 1, 2, 3].filter((x) => x !== state.current.answer);
    shuffle(wrong)
      .slice(0, 2)
      .forEach((idx) => {
        let btn = choicesEl.querySelectorAll(".choice")[idx];
        btn.textContent = "—";
        btn.disabled = true;
      });
    updateLifelinesUI(false);
  };

if (llAudience)
  llAudience.onclick = () => {
    if (!state.inGame || state.usedAudience || state.answered) return;
    state.usedAudience = true;
    hintBox.textContent =
      "📊 الجمهور يقول: الخيار رقم " +
      (state.current.answer + 1) +
      " هو الأرجح بنسبة 75%";
    updateLifelinesUI(false);
  };

if (llPhone)
  llPhone.onclick = () => {
    if (!state.inGame || state.usedPhone || state.answered) return;
    state.usedPhone = true;
    hintBox.textContent =
      "📞 صديقك: أنا متأكد إنها الإجابة رقم " + (state.current.answer + 1);
    updateLifelinesUI(false);
  };

setIdleUI();
