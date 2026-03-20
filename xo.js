/* XO — Smart Educational Version by Hossam Hassan 2026 */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // العناصر الأساسية
  const boardEl = $("board"),
    statusEl = $("status"),
    resultEl = $("result"),
    timerDisplay = $("timerDisplay"),
    secondsEl = $("seconds"),
    modeEl = $("mode"),
    difficultyEl = $("difficulty"),
    timerModeEl = $("timerMode"),
    scoreAEl = $("scoreA"),
    scoreBEl = $("scoreB"),
    scoreDEl = $("scoreD"),
    nameAEl = $("nameA"),
    nameBEl = $("nameB");

  const WINS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // أفقي
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // رأسي
    [0, 4, 8],
    [2, 4, 6], // قطري
  ];
  const STORE_KEY = "xo_scores_v2";

  let cells = [],
    board = Array(9).fill(null);
  let locked = true,
    current = "X",
    timerInterval = null;
  let mode = "ai",
    difficulty = "medium",
    human = "X",
    ai = "O";
  let scores = { A: 0, B: 0, D: 0 };

  // --- خوارزمية Minimax الذكية ---
  function isTerminal(b) {
    for (let pattern of WINS) {
      const [a, b1, c] = pattern;
      if (b[a] && b[a] === b[b1] && b[a] === b[c])
        return { winner: b[a], line: pattern };
    }
    return b.every((cell) => cell !== null) ? { winner: "D", line: [] } : null;
  }

  function minimax(b, depth, isMaximizing) {
    const res = isTerminal(b);
    if (res) {
      if (res.winner === ai) return 10 - depth;
      if (res.winner === human) return depth - 10;
      return 0;
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) {
          b[i] = ai;
          bestScore = Math.max(bestScore, minimax(b, depth + 1, false));
          b[i] = null;
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) {
          b[i] = human;
          bestScore = Math.min(bestScore, minimax(b, depth + 1, true));
          b[i] = null;
        }
      }
      return bestScore;
    }
  }

  function getBestMove() {
    // في المستوى السهل، نجعل الكمبيوتر "يغلط" أحياناً
    if (difficulty === "easy" && Math.random() > 0.3) return getRandomMove();

    // في المستوى المتوسط، نخلط بين الذكاء والعشوائية
    if (difficulty === "medium" && Math.random() > 0.7) return getRandomMove();

    let bestScore = -Infinity,
      move = -1;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = ai;
        let score = minimax(board, 0, false);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  }

  function getRandomMove() {
    const available = board
      .map((v, i) => (v === null ? i : null))
      .filter((v) => v !== null);
    return available[Math.floor(Math.random() * available.length)];
  }

  // --- إدارة التايمر ---
  function startTimer() {
    clearInterval(timerInterval);
    if (!timerModeEl.checked || locked) {
      timerDisplay.style.display = "none";
      return;
    }
    timerDisplay.style.display = "block";
    let timeLeft = 5;
    secondsEl.textContent = "0" + timeLeft;

    timerInterval = setInterval(() => {
      timeLeft--;
      secondsEl.textContent = "0" + timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        statusEl.textContent = `انتهى الوقت! دور اللاعب التالي.`;
        switchTurn();
      }
    }, 1000);
  }

  // --- معالجة الحركات ---
  function handleMove(idx, isAi = false) {
    if (locked || board[idx]) return;
    if (mode === "ai" && current === ai && !isAi) return;

    // تحديث البيانات والواجهة
    board[idx] = current;
    cells[idx].setAttribute("data-value", current); // عشان الـ CSS يلونها
    cells[idx].textContent = current;
    cells[idx].classList.add("taken");

    if ($("sound").checked) playClickSound();

    const result = isTerminal(board);
    if (result) {
      endGame(result);
    } else {
      switchTurn();
    }
  }

  function switchTurn() {
    if (locked) return;
    current = current === "X" ? "O" : "X";
    updateStatus();
    startTimer();
    if (mode === "ai" && current === ai) {
      setTimeout(() => makeAiMove(), 600);
    }
  }

  function makeAiMove() {
    const move = getBestMove();
    if (move !== -1) handleMove(move, true);
  }

  // --- نهاية اللعبة ---
  function endGame(res) {
    locked = true;
    clearInterval(timerInterval);

    if (res.winner === "D") {
      scores.D++;
      statusEl.textContent = "تعادل ممتاز! العقلين متساويين.";
      $("resultTitle").textContent = "تعادل!";
    } else {
      res.line.forEach((i) => cells[i].classList.add("win-pulse"));
      if (mode === "ai") {
        if (res.winner === human) {
          scores.A++;
          statusEl.textContent = "عبقري! لقد هزمت الذكاء الاصطناعي.";
          $("resultTitle").textContent = "مبروك الفوز! 🏆";
        } else {
          scores.B++;
          statusEl.textContent = "الكمبيوتر فاز، حاول التركيز أكثر.";
          $("resultTitle").textContent = "حظ أوفر! 🤖";
        }
      } else {
        res.winner === "X" ? scores.A++ : scores.B++;
        statusEl.textContent = `مبروك للفائز ${res.winner}!`;
        $("resultTitle").textContent = `فوز اللاعب ${res.winner}`;
      }
    }

    updateScoreboard();
    localStorage.setItem(STORE_KEY, JSON.stringify(scores));
    setTimeout(() => $("result").classList.add("show"), 600);
  }

  // --- تحديث الواجهة ---
  function updateStatus() {
    if (mode === "ai") {
      statusEl.textContent =
        current === human
          ? "دورك الآن، فكر بذكاء.."
          : "الكمبيوتر يحلل الاحتمالات...";
    } else {
      statusEl.textContent = `دور اللاعب ${current}`;
    }
  }

  function updateScoreboard() {
    scoreAEl.textContent = scores.A;
    scoreBEl.textContent = scores.B;
    scoreDEl.textContent = scores.D;

    if (mode === "pvp") {
      nameAEl.textContent = "لاعب 1 (X)";
      nameBEl.textContent = "لاعب 2 (O)";
    } else {
      nameAEl.textContent = "أنت (X)";
      nameBEl.textContent = "الكمبيوتر (O)";
    }
  }

  function showHint() {
    if (locked || (mode === "ai" && current !== human)) return;
    const best = getBestMove();
    if (best !== -1) {
      cells[best].classList.add("hint-flash");
      setTimeout(() => cells[best].classList.remove("hint-flash"), 1500);
      statusEl.textContent = "تلميحة: جرب الخانة الوامضة!";
    }
  }

  function playClickSound() {
    // يمكنك إضافة ملف صوتي هنا إذا أردت
    // new Audio('click.mp3').play();
  }

  // --- تهيئة اللعبة ---
  function initGame() {
    board = Array(9).fill(null);
    locked = false;
    current = "X";
    mode = modeEl.value;
    difficulty = difficultyEl.value;

    boardEl.innerHTML = "";
    cells = [];
    for (let i = 0; i < 9; i++) {
      const btn = document.createElement("button");
      btn.className = "cell";
      btn.onclick = () => handleMove(i);
      boardEl.appendChild(btn);
      cells.push(btn);
    }

    $("result").classList.remove("show");
    updateScoreboard();
    updateStatus();
    startTimer();
    if (mode === "ai" && current === ai) setTimeout(makeAiMove, 500);
  }

  // ربط الأحداث
  $("newGame").onclick = initGame;
  $("playAgain").onclick = initGame;
  $("getHint").onclick = showHint;
  $("closeResult").onclick = () => $("result").classList.remove("show");

  $("resetAll").onclick = () => {
    if (confirm("هل تريد مسح جميع النتائج المسجلة؟")) {
      scores = { A: 0, B: 0, D: 0 };
      updateScoreboard();
      localStorage.removeItem(STORE_KEY);
    }
  };

  modeEl.onchange = initGame;

  // تحميل النتائج المحفوظة
  const saved = localStorage.getItem(STORE_KEY);
  if (saved) {
    scores = JSON.parse(saved);
    updateScoreboard();
  }

  // بدء اللعبة لأول مرة
  initGame();
})();
