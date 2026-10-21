import { useState, useEffect } from 'react';

const EMOJIS = ['🍎', '🍌', '🍇', '🍓', '🍒', '🥑', '🍉', '🥕'];
const THEME_KEY = 'memory-theme';

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

function loadTheme() {
  return localStorage.getItem(THEME_KEY) === 'dark';
}

export default function App() {
  const [deck, setDeck] = useState(buildDeck);
  const [picked, setPicked] = useState([]);
  const [moves, setMoves] = useState(0);
  const [dark, setDark] = useState(loadTheme);

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

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  function flip(i) {
    if (picked.length === 2) return;
    if (deck[i].flipped || deck[i].matched) return;
    setDeck((d) => d.map((c, idx) => (idx === i ? { ...c, flipped: true } : c)));
    setPicked([...picked, i]);
    setMoves((m) => m + 1);
  }

  function restart() {
    setDeck(buildDeck());
    setPicked([]);
    setMoves(0);
  }

  const pairs = deck.filter((c) => c.matched).length / 2;
  const won = pairs === EMOJIS.length;

  return (
    <div>
      <div className="header-row">
        <h1>🧠 Memory App</h1>
        <button
          className="theme-toggle"
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle dark mode"
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
      <div className="info">
        <div>
          Moves: <b>{moves}</b>
        </div>
        <div>
          Pairs: <b>{pairs}</b> / {EMOJIS.length}
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
      {won && <div className="win">🎉 You won in {moves} moves!</div>}
    </div>
  );
}
