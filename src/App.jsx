import { useState, useEffect } from 'react';

const EMOJIS = ['🍎', '🍌', '🍇', '🍓', '🍒', '🥑', '🍉', '🥕'];

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck() {
  const pairs = [...EMOJIS, ...EMOJIS];
  return shuffle(pairs).map((emoji, i) => ({
    id: i,
    emoji,
    flipped: false,
    matched: false,
  }));
}

const BEST_KEY = 'memory-best';

function loadBest() {
  try {
    const raw = JSON.parse(localStorage.getItem(BEST_KEY) || 'null');
    return raw && typeof raw.moves === 'number' && typeof raw.seconds === 'number'
      ? raw
      : null;
  } catch {
    return null;
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function App() {
  const [deck, setDeck] = useState(buildDeck);
  const [picked, setPicked] = useState([]);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState(loadBest);

  useEffect(() => {
    if (picked.length !== 2) return;
    const [a, b] = picked;
    if (deck[a].emoji === deck[b].emoji) {
      setDeck((d) =>
        d.map((card, i) =>
          i === a || i === b ? { ...card, matched: true, flipped: false } : card
        )
      );
      setPicked([]);
    } else {
      const t = setTimeout(() => {
        setDeck((d) =>
          d.map((card, i) =>
            i === a || i === b ? { ...card, flipped: false } : card
          )
        );
        setPicked([]);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [picked, deck]);

  // Live ticking timer
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);
    return () => clearInterval(id);
  }, [running, startedAt]);

  // Record best score when the game is won
  useEffect(() => {
    if (pairs !== EMOJIS.length) return;
    setRunning(false);
    setBest((prev) => {
      const candidate = { moves, seconds: elapsed };
      if (!prev || candidate.moves < prev.moves || (candidate.moves === prev.moves && candidate.seconds < prev.seconds)) {
        localStorage.setItem(BEST_KEY, JSON.stringify(candidate));
        return candidate;
      }
      return prev;
    });
  }, [pairs, moves, elapsed]);

  function flip(i) {
    if (picked.length === 2) return;
    if (deck[i].flipped || deck[i].matched) return;
    if (!running) {
      setStartedAt(Date.now());
      setRunning(true);
    }
    setDeck((d) => d.map((c, idx) => (idx === i ? { ...c, flipped: true } : c)));
    setPicked([...picked, i]);
    setMoves((m) => m + 1);
  }

  function restart() {
    setDeck(buildDeck());
    setPicked([]);
    setMoves(0);
    setStartedAt(null);
    setElapsed(0);
    setRunning(false);
  }

  const pairs = deck.filter((c) => c.matched).length / 2;
  const won = pairs === EMOJIS.length;

  return (
    <div>
      <h1>🧠 Memory App Not</h1>
      <div className="info">
        <div>
          Moves: <b>{moves}</b>
        </div>
        <div>
          Pairs: <b>{pairs}</b> / {EMOJIS.length}
        </div>
        <div>
          Time: <b>{formatTime(elapsed)}</b>
        </div>
        {best && (
          <div className="best">
            Best: <b>{best.moves} moves · {formatTime(best.seconds)}</b>
          </div>
        )}
      </div>
      <div className="board">
        {deck.map((card, i) => (
          <button
            key={card.id}
            className={
              'card' +
              (card.flipped ? ' flipped' : '') +
              (card.matched ? ' matched' : '')
            }
            onClick={() => flip(i)}
          >
            {card.flipped || card.matched ? card.emoji : ''}
          </button>
        ))}
      </div>
      <button className="restart" onClick={restart}>
        New Game
      </button>
      {won && <div className="win">🎉 You won in {moves} moves and {formatTime(elapsed)}!</div>}
    </div>
  );
}
