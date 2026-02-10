import './App.css';
import { useState, useEffect } from 'react';

function App() {
  const [solution, setSolution] = useState('');
  const [guesses, setGuesses] = useState(Array(6).fill(null));
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [validWords, setValidWords] = useState([]);

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
  }, [currentGuess, currentRow, gameOver, solution]);

  const submitGuess = () => {
    if (!validWords.includes(currentGuess)) {
      setMessage('Not in word list');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    const newGuesses = [...guesses];
    newGuesses[currentRow] = currentGuess;
    setGuesses(newGuesses);

    if (currentGuess === solution) {
      setMessage('🎉 You won!');
      setGameOver(true);
      return;
    }

    if (currentRow === 5) {
      setMessage(`Game Over! The word was ${solution}`);
      setGameOver(true);
      return;
    }

    setCurrentRow(currentRow + 1);
    setCurrentGuess('');
  };

  const resetGame = () => {
    if (validWords.length > 0) {
      const randomWord = validWords[Math.floor(Math.random() * validWords.length)];
      setSolution(randomWord);
    }
    setGuesses(Array(6).fill(null));
    setCurrentGuess('');
    setCurrentRow(0);
    setGameOver(false);
    setMessage('');
  };

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

  return (
    <div className="App">
      <header className="header">
        <h1>WORDLE</h1>
      </header>
      
      {message && <div className="message">{message}</div>}
      
      <div className="game-board">
        {guesses.map((guess, rowIndex) => (
          <div key={rowIndex} className="row">
            {[0, 1, 2, 3, 4].map((letterIndex) => {
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
        <button className="reset-button" onClick={resetGame}>
          Play Again
        </button>
      )}
    </div>
  );
}

export default App;
