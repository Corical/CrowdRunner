import React, { useState, useEffect, useRef } from 'react';
import { Users } from 'lucide-react';

const CrowdRunnerGame = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(5);
  const [playerX, setPlayerX] = useState(0); // Continuous X position
  const [obstacles, setObstacles] = useState([]);
  const [distance, setDistance] = useState(0);
  const gameLoopRef = useRef(null);
  const obstacleIdRef = useRef(0);
  const touchStartRef = useRef(null);
  const lastTouchXRef = useRef(null);

  const GAME_SPEED = 2;
  const PLAYER_SPEED = 15;
  const MAX_X = 150;
  const MIN_X = -150;

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        setPlayerX(x => Math.max(MIN_X, x - PLAYER_SPEED));
      } else if (e.key === 'ArrowRight') {
        setPlayerX(x => Math.min(MAX_X, x + PLAYER_SPEED));
      }
    };

    const handleTouchStart = (e) => {
      touchStartRef.current = e.touches[0].clientX;
      lastTouchXRef.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
      if (!touchStartRef.current) return;
      
      const currentX = e.touches[0].clientX;
      const deltaX = currentX - lastTouchXRef.current;
      lastTouchXRef.current = currentX;
      
      setPlayerX(x => {
        const newX = x + deltaX * 0.5;
        return Math.max(MIN_X, Math.min(MAX_X, newX));
      });
    };

    const handleTouchEnd = () => {
      touchStartRef.current = null;
      lastTouchXRef.current = null;
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    gameLoopRef.current = setInterval(() => {
      setDistance(d => d + 1);
      
      // Spawn obstacles
      if (Math.random() < 0.015) {
        const type = Math.random() < 0.4 ? 'obstacle' : 'bonus';
        const obstacleX = (Math.random() - 0.5) * 250;
        const value = type === 'obstacle' ? 
          Math.floor(Math.random() * 30) + 20 : 
          [2, 5, 10, 20][Math.floor(Math.random() * 4)];
        
        setObstacles(prev => [...prev, {
          id: obstacleIdRef.current++,
          x: obstacleX,
          position: 100,
          type,
          value
        }]);
      }

      // Move obstacles
      setObstacles(prev => {
        const updated = prev.map(obs => ({
          ...obs,
          position: obs.position - GAME_SPEED
        })).filter(obs => obs.position > -10);

        // Check collisions
        updated.forEach(obs => {
          if (obs.position < 5 && obs.position > -5 && !obs.hit) {
            const distance = Math.abs(obs.x - playerX);
            if (distance < 40) {
              obs.hit = true;
              if (obs.type === 'obstacle') {
                setScore(s => Math.max(0, s - obs.value));
                if (score - obs.value <= 0) {
                  setGameOver(true);
                }
              } else {
                setScore(s => s * obs.value);
              }
            }
          }
        });

        return updated;
      });
    }, 50);

          return () => clearInterval(gameLoopRef.current);
  }, [gameStarted, gameOver, score, playerX]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(5);
    setPlayerX(0);
    setObstacles([]);
    setDistance(0);
  };

  if (!gameStarted) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-sky-400 to-sky-200 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
          <h1 className="text-4xl font-bold mb-4 text-blue-600">Crowd Runner</h1>
          <p className="text-gray-600 mb-6">Swipe Left/Right or Use Arrow Keys</p>
          <button 
            onClick={startGame}
            className="bg-blue-500 text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-blue-600 transition"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-b from-sky-400 to-sky-200 overflow-hidden relative">
      {/* Score Display */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-blue-500 text-white px-6 py-3 rounded-full text-2xl font-bold flex items-center gap-2 shadow-lg">
          <Users size={28} />
          {score}
        </div>
      </div>

      {/* Distance Counter */}
      <div className="absolute top-4 right-4 z-20 bg-white px-4 py-2 rounded-lg shadow-lg">
        <div className="text-sm text-gray-600">Distance</div>
        <div className="text-xl font-bold">{Math.floor(distance / 10)}m</div>
      </div>

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
            <h2 className="text-3xl font-bold mb-4 text-red-600">Game Over!</h2>
            <p className="text-xl mb-2">Final Score: {score}</p>
            <p className="text-lg mb-6 text-gray-600">Distance: {Math.floor(distance / 10)}m</p>
            <button 
              onClick={startGame}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg font-bold hover:bg-blue-600 transition"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Game Area */}
      <div className="w-full h-full flex items-end justify-center pb-20" style={{perspective: '600px'}}>
        <div className="relative" style={{
          width: '400px',
          height: '600px',
          transformStyle: 'preserve-3d',
          transform: 'rotateX(60deg)'
        }}>
          {/* Road */}
          <div className="absolute inset-0 bg-yellow-700 opacity-80" style={{
            background: 'repeating-linear-gradient(to bottom, #d4a574 0px, #d4a574 40px, #8b6f47 40px, #8b6f47 50px)'
          }} />
          
          {/* Side Barriers */}
          <div className="absolute left-0 top-0 w-8 h-full bg-gray-600" />
          <div className="absolute right-0 top-0 w-8 h-full bg-gray-600" />

          {/* Obstacles */}
          {obstacles.map(obs => {
            const scale = 0.3 + (obs.position / 100) * 0.7;
            const y = obs.position * 6;
            
            return (
              <div
                key={obs.id}
                className="absolute transition-all duration-100"
                style={{
                  left: '50%',
                  bottom: `${y}%`,
                  transform: `translateX(calc(-50% + ${obs.x}px)) scale(${scale})`,
                  transformOrigin: 'bottom center'
                }}
              >
                {obs.type === 'obstacle' ? (
                  <div className="relative">
                    <div className="w-24 h-16 bg-red-500 rounded-lg flex items-center justify-center shadow-lg border-4 border-red-700">
                      <div className="text-white font-bold text-xl">-{obs.value}</div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="absolute w-1 h-8 bg-red-700" style={{
                          transform: `rotate(${i * 45}deg)`,
                          transformOrigin: 'center'
                        }} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-16 bg-blue-400 rounded-lg flex items-center justify-center shadow-lg border-4 border-blue-600">
                    <div className="text-white font-bold text-xl">x{obs.value}</div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Player */}
          <div
            className="absolute bottom-0 transition-all duration-100"
            style={{
              left: '50%',
              transform: `translateX(calc(-50% + ${playerX}px))`,
            }}
          >
            <div className="flex flex-col items-center">
              <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold mb-1">
                {score}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[...Array(Math.min(9, score))].map((_, i) => (
                  <div key={i} className="w-4 h-6 bg-blue-600 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Touch Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 z-20">
        <button 
          onMouseDown={() => {
            const interval = setInterval(() => {
              setPlayerX(x => Math.max(MIN_X, x - PLAYER_SPEED));
            }, 50);
            return () => clearInterval(interval);
          }}
          className="w-20 h-20 rounded-full font-bold text-xl shadow-lg bg-white text-gray-700 active:bg-blue-600 active:text-white transition"
        >
          ←
        </button>
        <button 
          onMouseDown={() => {
            const interval = setInterval(() => {
              setPlayerX(x => Math.min(MAX_X, x + PLAYER_SPEED));
            }, 50);
            return () => clearInterval(interval);
          }}
          className="w-20 h-20 rounded-full font-bold text-xl shadow-lg bg-white text-gray-700 active:bg-blue-600 active:text-white transition"
        >
          →
        </button>
      </div>
    </div>
  );
};

export default CrowdRunnerGame;