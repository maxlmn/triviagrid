import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Share2, Play, X, Check, Calendar, Loader2, Timer } from 'lucide-react';

import questionDatabase from './questions.json';

// --- THEME CONFIGURATION ---
const THEMES = {
  geo: { color: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500', bgSoft: 'bg-blue-50', label: 'Geography' },
  ent: { color: 'bg-pink-500', text: 'text-pink-600', border: 'border-pink-500', bgSoft: 'bg-pink-50', label: 'Entertainment' },
  hist: { color: 'bg-yellow-400', text: 'text-yellow-700', border: 'border-yellow-400', bgSoft: 'bg-yellow-50', label: 'History' },
  art: { color: 'bg-amber-700', text: 'text-amber-800', border: 'border-amber-700', bgSoft: 'bg-amber-50', label: 'Art & Lit' },
  sci: { color: 'bg-green-600', text: 'text-green-700', border: 'border-green-600', bgSoft: 'bg-green-50', label: 'Science' },
  sport: { color: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-500', bgSoft: 'bg-orange-50', label: 'Sports' },
};

const ORDER = ['geo', 'ent', 'hist', 'art', 'sci', 'sport'];

// --- UTILS ---

const sfc32 = (a, b, c, d) => {
  return function () {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    var t = (a + b) | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    d = d + 1 | 0;
    t = t + d | 0;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}

const getDailySeed = () => {
  const now = new Date();
  // Format: YYYYMMDD
  return parseInt(`${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`);
};

const shuffleArray = (array, rng) => {
  let currentIndex = array.length, randomIndex;
  const newArray = [...array];
  while (currentIndex !== 0) {
    randomIndex = Math.floor(rng() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
  }
  return newArray;
};

// --- MAIN COMPONENT ---

export default function App() {
  const [gameState, setGameState] = useState('loading');
  const [dailyData, setDailyData] = useState([]);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState({}); // Stores score per category: { geo: 15, ent: 10 }
  const [feedback, setFeedback] = useState(null);
  const [difficultyLevel, setDifficultyLevel] = useState(1);
  const [dayName, setDayName] = useState("");
  const [error, setError] = useState(null);

  // Timer State
  const [elapsed, setElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    try {
      const seed = getDailySeed();
      const rng = sfc32(seed, seed + 1, seed + 2, seed + 3);
      const date = new Date();

      // 1. Determine Difficulty based on Day of Week
      const dayIndex = date.getDay(); // 0=Sun, 1=Mon...
      const diff = dayIndex === 0 ? 7 : dayIndex; // Map Sun(0) to 7
      setDifficultyLevel(diff);
      setDayName(date.toLocaleDateString('en-US', { weekday: 'long' }));

      // 2. Select Questions for Today
      const gameQuestions = ORDER.map(cat => {
        // Filter DB for Category AND Difficulty
        let pool = questionDatabase.filter(q => q.cat === cat && q.diff === diff);

        // Fallback: if pool is empty, look for closest difficulty
        if (pool.length === 0) {
          pool = questionDatabase.filter(q => q.cat === cat)
            .sort((a, b) => Math.abs(a.diff - diff) - Math.abs(b.diff - diff))
            .slice(0, 5);
        }

        if (pool.length === 0) throw new Error(`No questions found for ${cat}`);

        // Pick one using seeded RNG
        const q = pool[Math.floor(rng() * pool.length)];

        // 3. Build the Grid
        const sourceDistractors = q.distractors || [];

        // Safety check: ensure we have enough. If not, pad with placeholders.
        let poolForGrid = [...sourceDistractors];
        while (poolForGrid.length < 15) {
          poolForGrid.push("?");
        }

        // Shuffle distractors and pick 15
        const distractors = shuffleArray(poolForGrid, rng).slice(0, 15);

        // Assign disappear order (0 to 14) to distractors
        // We shuffle the indices 0-14 so that the order of disappearance is random relative to the original list
        const disappearIndices = shuffleArray([...Array(15).keys()], rng);

        const distractorsWithMeta = distractors.map((text, i) => ({
          text,
          isCorrect: false,
          disappearOrder: disappearIndices[i] // 0 means disappears first (at 3s)
        }));

        const answerItem = { text: q.a, isCorrect: true, disappearOrder: null };

        const grid = shuffleArray([answerItem, ...distractorsWithMeta], rng).map((item, idx) => ({
          id: `${cat}-${idx}`,
          ...item
        }));

        return { ...q, grid };
      });

      setDailyData(gameQuestions);

      // Restore state
      const saved = localStorage.getItem(`trivia_v5_${seed}`); // Bumped version for new schema
      if (saved) {
        const parsed = JSON.parse(saved);
        setProgress(parsed.progress || {});
        setStep(parsed.step || 0);
        setGameState(parsed.step >= 6 ? 'summary' : 'playing');
      } else {
        setGameState('intro');
      }
    } catch (err) {
      console.error(err);
      setError("Could not load today's puzzle. Please check the database.");
    }
  }, []);

  // Timer Logic
  useEffect(() => {
    if (gameState === 'playing' && !feedback) {
      setIsActive(true);
      setElapsed(0);
    } else {
      setIsActive(false);
    }
  }, [gameState, step, feedback]);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setElapsed(e => e + 0.1);
      }, 100);
    } else if (!isActive && elapsed !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  // Save progress
  useEffect(() => {
    if (gameState !== 'loading' && gameState !== 'intro') {
      const seed = getDailySeed();
      localStorage.setItem(`trivia_v5_${seed}`, JSON.stringify({ progress, step }));
    }
  }, [progress, step, gameState]);

  // Calculate current potential score based on time
  const calculateCurrentPoints = () => {
    if (elapsed <= 3) return 15;
    // After 3 seconds, lose 1 point per second
    // 3.1s -> 14 pts
    // 4.1s -> 13 pts
    const lostPoints = Math.ceil(elapsed - 3);
    return Math.max(0, 15 - lostPoints);
  };

  const calculateNumHidden = () => {
    if (elapsed <= 3) return 0;
    // 3.1s -> 1 hidden (disappearOrder 0)
    // 4.1s -> 2 hidden (disappearOrder 0, 1)
    return Math.ceil(elapsed - 3);
  };

  const handleChoice = (item) => {
    if (feedback) return;

    const currentQ = dailyData[step];
    const isCorrect = item.isCorrect;
    const points = isCorrect ? calculateCurrentPoints() : 0;

    setFeedback({ id: item.id, status: isCorrect ? 'correct' : 'wrong', points });
    setIsActive(false); // Stop timer

    if (isCorrect) {
      const newProg = { ...progress, [currentQ.cat]: points };
      setProgress(newProg);
    } else {
      // Mark as 0 points for this category if wrong
      const newProg = { ...progress, [currentQ.cat]: 0 };
      setProgress(newProg);
    }

    setTimeout(() => {
      setFeedback(null);
      if (step < 5) {
        setStep(s => s + 1);
      } else {
        setGameState('summary');
      }
    }, 2000); // Slightly longer delay to see score
  };

  const getTotalScore = () => Object.values(progress).reduce((a, b) => a + b, 0);
  const getDiffColor = (l) => l <= 2 ? "bg-green-100 text-green-800" : l <= 5 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";

  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500 p-4 text-center">{error}</div>;
  if (gameState === 'loading') return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin" /></div>;

  const currentQ = dailyData[step] || dailyData[0];
  const theme = THEMES[currentQ.cat];
  const currentPoints = calculateCurrentPoints();
  const numHidden = calculateNumHidden();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden border-x border-gray-200">

      {/* HEADER */}
      <header className="bg-white p-4 flex justify-between items-center border-b z-20">
        <div>
          <h1 className="text-xl font-black tracking-tighter">TRIVIA<span className="text-blue-600">GRID</span></h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-gray-400 uppercase">{dayName}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${getDiffColor(difficultyLevel)}`}>
              Lvl {difficultyLevel}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-2xl font-black text-gray-800">{getTotalScore()}<span className="text-gray-300 text-lg">/90</span></div>
          <div className="flex gap-1 mt-1">
            {ORDER.map(cat => (
              <div key={cat} className={`w-3 h-3 rounded-sm transition-colors ${progress[cat] !== undefined ? THEMES[cat].color : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>
      </header>

      {/* INTRO */}
      {gameState === 'intro' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
          <div className="w-24 h-24 bg-black rounded-3xl rotate-3 flex items-center justify-center shadow-xl z-10 relative mb-8">
            <Calendar className="text-white w-10 h-10" />
          </div>
          <h2 className="text-4xl font-black mb-2 tracking-tight">Daily Challenge</h2>
          <p className="text-gray-500 mb-8 max-w-[240px]">
            Today is <span className="font-bold text-black">{dayName}</span>.<br />
            Difficulty: <span className="font-bold text-black">Level {difficultyLevel}</span>.
          </p>
          <div className="bg-blue-50 p-4 rounded-xl mb-8 text-sm text-blue-800 text-left">
            <p className="font-bold mb-1">How to play:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Tiles disappear after 3 seconds.</li>
              <li>Score more points by answering fast!</li>
              <li>Max 15 points per question.</li>
            </ul>
          </div>
          <button onClick={() => setGameState('playing')} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
            <Play size={20} fill="currentColor" /> Play Now
          </button>
        </div>
      )}

      {/* SUMMARY */}
      {gameState === 'summary' && (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-white animate-in slide-in-from-bottom-10 duration-500">
          <div className="text-center mb-8 pt-8">
            <div className="text-6xl font-black mb-2">{getTotalScore()}<span className="text-gray-300 text-4xl">/90</span></div>
            <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Final Score</p>
          </div>
          <div className="space-y-3 mb-8">
            {dailyData.map((q, i) => {
              const score = progress[q.cat] || 0;
              const isCorrect = score > 0;
              return (
                <div key={i} className="flex items-center p-3 rounded-xl border border-gray-100 shadow-sm gap-4">
                  <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 ${isCorrect ? THEMES[q.cat].color : 'bg-gray-100'}`}>
                    {isCorrect ? (
                      <>
                        <span className="text-white font-black text-sm">{score}</span>
                      </>
                    ) : <X className="text-gray-400 w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 truncate mb-1">{q.q}</div>
                    <div className={`text-sm font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                      {q.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-sm">
            Play Again (Debug)
          </button>
        </div>
      )}

      {/* GAMEPLAY */}
      {gameState === 'playing' && (
        <>
          <div className={`p-6 pb-12 transition-colors duration-500 ${theme.bgSoft} relative border-b border-black/5`}>
            <div className="flex justify-between items-start mb-3">
              <div className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${theme.color} text-white shadow-sm`}>
                {theme.label}
              </div>
              <div className="flex items-center gap-2">
                <div className={`font-black text-2xl tabular-nums ${currentPoints <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>
                  {currentPoints}
                </div>
                <div className="text-[10px] font-bold uppercase text-gray-400 mt-1">pts</div>
              </div>
            </div>

            <h3 className={`text-lg md:text-xl font-bold leading-snug ${theme.text} min-h-[5rem] flex items-center`}>
              {currentQ.q}
            </h3>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black/5">
              <div
                className={`h-full transition-all duration-100 ${theme.color}`}
                style={{ width: `${Math.min(100, (elapsed / 18) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex-1 bg-white -mt-6 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.06)] p-3 relative z-10">
            <div className="grid grid-cols-4 gap-2 h-full content-start">
              {currentQ.grid.map((item) => {
                const isSelected = feedback?.id === item.id;
                const isCorrect = item.isCorrect;
                const showResult = feedback !== null;

                // Visibility Logic
                // If item is correct, always show
                // If item is distractor, check if its disappearOrder < numHidden
                const isHidden = !isCorrect && item.disappearOrder < numHidden;

                let btnStyle = "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300 shadow-sm";

                if (showResult) {
                  if (isCorrect) btnStyle = "bg-green-500 text-white border-green-600 ring-4 ring-green-100 z-10 scale-105 shadow-xl";
                  else if (isSelected) btnStyle = "bg-red-500 text-white border-red-600 animate-shake shadow-md";
                  else btnStyle = "bg-gray-50 text-gray-200 border-gray-100 opacity-30 scale-95";
                } else if (isHidden) {
                  btnStyle = "opacity-0 pointer-events-none scale-50";
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => handleChoice(item)}
                    disabled={showResult || isHidden}
                    className={`aspect-square rounded-xl border-b-4 font-bold text-xs p-1 flex items-center justify-center text-center break-words leading-none transition-all duration-500 ${btnStyle}`}
                  >
                    {item.text}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
      <style jsx global>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
}