import './App.css';
import { useState, useEffect, useCallback } from 'react';

function App() {
  const [solution, setSolution] = useState('');
  const [guesses, setGuesses] = useState(Array(6).fill(null));
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [validWords, setValidWords] = useState([]);
  const [revealedTiles, setRevealedTiles] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [noButtonClicks, setNoButtonClicks] = useState(0);

  useEffect(() => {
    // Load words from the file
    fetch('/words.txt')
      .then(response => response.text())
      .then(text => {
        const words = text.trim().split('\n').map(word => word.trim().toUpperCase());
        setValidWords(words);
        // Pick a random word as the solution
        const randomWord = words[Math.floor(Math.random() * words.length)];
        setSolution(randomWord);
      })
      .catch(error => {
        console.error('Error loading words:', error);
        // Fallback word if file can't be loaded
        setSolution('REACT');
        setValidWords(['REACT']);
      });
  }, []);

  const submitGuess = useCallback(() => {
    if (!validWords.includes(currentGuess)) {
      setMessage('Not in word list');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    const newGuesses = [...guesses];
    newGuesses[currentRow] = currentGuess;
    setGuesses(newGuesses);

    if (currentRow === 5) {
      setTimeout(() => {
        setGameOver(true);
        setRevealedTiles(0);
      }, 800);
      return;
    }

    setCurrentRow(currentRow + 1);
    setCurrentGuess('');
  }, [validWords, currentGuess, guesses, currentRow]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;

      if (e.key === 'Enter') {
        if (currentGuess.length !== 5) {
          setMessage('Word must be 5 letters');
          setTimeout(() => setMessage(''), 2000);
          return;
        }
        submitGuess();
      } else if (e.key === 'Backspace') {
        setCurrentGuess(prev => prev.slice(0, -1));
      } else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < 5) {
        setCurrentGuess(prev => prev + e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameOver, submitGuess]);

  // Animate tiles appearing one by one
  useEffect(() => {
    if (gameOver && revealedTiles < 60) { // 6 rows * 10 tiles
      const timer = setTimeout(() => {
        setRevealedTiles(prev => prev + 1);
      }, 80); // Delay between each tile reveal
      return () => clearTimeout(timer);
    }
  }, [gameOver, revealedTiles]);

  const handleKeyClick = (key) => {
    if (gameOver) return;

    if (key === 'ENTER') {
      if (currentGuess.length !== 5) {
        setMessage('Word must be 5 letters');
        setTimeout(() => setMessage(''), 2000);
        return;
      }
      submitGuess();
    } else if (key === 'DELETE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  };

  const getLetterColor = (letter, index, word) => {
    if (!word) return '';
    
    if (solution[index] === letter) {
      return 'correct';
    }
    
    if (solution.includes(letter)) {
      return 'present';
    }
    
    return 'absent';
  };

  const getKeyColor = (key) => {
    let color = '';
    
    guesses.forEach((guess, rowIndex) => {
      if (!guess || rowIndex >= currentRow) return;
      
      guess.split('').forEach((letter, index) => {
        if (letter === key) {
          if (solution[index] === letter) {
            color = 'correct';
          } else if (solution.includes(letter) && color !== 'correct') {
            color = 'present';
          } else if (color === '') {
            color = 'absent';
          }
        }
      });
    });
    
    return color;
  };

  const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE']
  ];

  // Valentine's message to display on tiles
  const valentineMessage = [
    ['W', 'I', 'L', 'L', '', '', '', '', '', ''],
    ['Y', 'O', 'U', '', '', '', '', '', '', ''],
    ['B', 'E', '', '', '', '', '', '', '', ''],
    ['M', 'Y', '', '', '', '', '', '', '', ''],
    ['V', 'A', 'L', 'E', 'N', 'T', 'I', 'N', 'E', '?'],
    ['❤', '❤', '', '', '', '', '', '', '', '']
  ];

  return (
    <div className="App">
      <header className="header">
        <h1>WORDLE</h1>
      </header>
      
      {message && <div className="message">{message}</div>}
      
      <div className={`game-board ${gameOver ? 'valentine-mode' : ''}`}>
        {guesses.map((guess, rowIndex) => (
          <div key={rowIndex} className="row">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((letterIndex) => {
              // Show valentine message if game is over
              if (gameOver) {
                const tileIndex = rowIndex * 10 + letterIndex;
                const isRevealed = tileIndex < revealedTiles;
                const letter = valentineMessage[rowIndex][letterIndex];
                const isHeart = letter === '❤';
                const isEmpty = letter === '';
                
                if (!isRevealed) {
                  // Tile not yet revealed
                  return (
                    <div 
                      key={letterIndex} 
                      className="tile"
                    >
                    </div>
                  );
                }
                
                return (
                  <div 
                    key={letterIndex} 
                    className={`tile ${isEmpty ? 'empty-tile' : isHeart ? 'heart-tile' : 'valentine-tile'} filled tile-reveal`}
                  >
                    {letter}
                  </div>
                );
              }
              
              // Normal game display - only show first 5 tiles during gameplay
              if (letterIndex >= 5) {
                return <div key={letterIndex} className="tile hidden-tile"></div>;
              }
              
              const word = rowIndex === currentRow ? currentGuess : guess;
              const letter = word ? word[letterIndex] : '';
              const colorClass = rowIndex < currentRow && guess 
                ? getLetterColor(guess[letterIndex], letterIndex, guess)
                : '';
              
              return (
                <div 
                  key={letterIndex} 
                  className={`tile ${colorClass} ${letter ? 'filled' : ''}`}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="keyboard">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="keyboard-row">
            {row.map((key) => (
              <button
                key={key}
                className={`key ${key.length > 1 ? 'wide' : ''} ${getKeyColor(key)}`}
                onClick={() => handleKeyClick(key)}
              >
                {key === 'DELETE' ? '⌫' : key}
              </button>
            ))}
          </div>
        ))}
      </div>

      {gameOver && (
        <div className="valentine-message">
          <div className="valentine-buttons">
            <button className="yes-button" onClick={() => {
              setShowModal(true);
              setShowHearts(true);
            }}>Yes! ❤️</button>
            {noButtonClicks < 4 && (
              <button 
                className="also-yes-button"
                style={{
                  transform: `scale(${1 - (noButtonClicks * 0.2)})`,
                  transition: 'transform 0.3s ease'
                }}
                onClick={() => {
                  setNoButtonClicks(prev => prev + 1);
                }}
              >
                No 💔
              </button>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false);
          setShowHearts(false);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src="/qoobee-agapi-smiles.gif" alt="Thank You" className="modal-gif" />
            <h2>💕 Thank You! 💕</h2>
            <p>I love you so much! You make me the happiest person alive!</p>
            <p>💖 Happy Valentine's Day! 💖</p>
            <button className="modal-close-button" onClick={() => {
              setShowModal(false);
              setShowHearts(false);
            }}>Close</button>
          </div>
        </div>
      )}

      {showHearts && (
        <div className="hearts-container">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="floating-heart"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              ❤️
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
