import { useState, useEffect, useRef } from 'react';

const EMOJIS = ['🍎', '🍌', '🍇', '🍓', '🍒', '🥑', '🍉', '🥕'];
const BEST_KEY = 'memory-best-time';

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

function loadBest() {
  const stored = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
  return Number.isNaN(stored) ? 0 : stored;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function App() {
  const [deck, setDeck] = useState(buildDeck);
  const [picked, setPicked] = useState([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [bestTime, setBestTime] = useState(loadBest);
  const tickerRef = useRef(null);

  const pairs = deck.filter((c) => c.matched).length / 2;
  const won = pairs === EMOJIS.length;

  useEffect(() => {
    if (won) return;
    if (moves === 0) return;
    tickerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(tickerRef.current);
  }, [won, moves]);

  useEffect(() => {
    if (!won) return;
    clearInterval(tickerRef.current);
    if (bestTime === 0 || seconds < bestTime) {
      setBestTime(seconds);
      localStorage.setItem(BEST_KEY, String(seconds));
    }
  }, [won, seconds, bestTime]);

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

  function flip(i) {
    if (picked.length === 2) return;
    if (deck[i].flipped || deck[i].matched) return;
    setDeck((d) => d.map((c, idx) => (idx === i ? { ...c, flipped: true } : c)));
    setPicked([...picked, i]);
    setMoves((m) => m + 1);
  }

  function restart() {
    clearInterval(tickerRef.current);
    setDeck(buildDeck());
    setPicked([]);
    setMoves(0);
    setSeconds(0);
  }

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
          Time: <b>{formatTime(seconds)}</b>
        </div>
        <div>
          Best: <b>{bestTime > 0 ? formatTime(bestTime) : '—'}</b>
        </div>
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
      {won && (
        <div className="win">
          🎉 You won in {moves} moves and {formatTime(seconds)}!
        </div>
      )}
    </div>
  );
}
