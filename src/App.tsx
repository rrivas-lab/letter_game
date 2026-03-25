import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, RotateCcw, Check, Play, Volume2, Settings, X, Search, PenTool } from 'lucide-react';
import confetti from 'canvas-confetti';
import { LetterCanvas, LetterCanvasHandle, HelpLevel } from './components/LetterCanvas';
import { speakLetter, speakSuccess, speakInstruction, speakTryAgain, speakWord } from './services/ttsService';

const LETTER_OBJECTS: Record<string, { word: string; emoji: string }[]> = {
  'A': [{ word: 'Avión', emoji: '✈️' }, { word: 'Abeja', emoji: '🐝' }, { word: 'Árbol', emoji: '🌳' }, { word: 'Ancla', emoji: '⚓' }, { word: 'Arcoíris', emoji: '🌈' }],
  'B': [{ word: 'Barco', emoji: '🚢' }, { word: 'Ballena', emoji: '🐋' }, { word: 'Búho', emoji: '🦉' }, { word: 'Bota', emoji: '🥾' }, { word: 'Bicicleta', emoji: '🚲' }],
  'C': [{ word: 'Casa', emoji: '🏠' }, { word: 'Conejo', emoji: '🐰' }, { word: 'Carro', emoji: '🚗' }, { word: 'Cebra', emoji: '🦓' }, { word: 'Cereza', emoji: '🍒' }],
  'D': [{ word: 'Dado', emoji: '🎲' }, { word: 'Delfín', emoji: '🐬' }, { word: 'Dinosaurio', emoji: '🦖' }, { word: 'Diente', emoji: '🦷' }, { word: 'Diamante', emoji: '💎' }],
  'E': [{ word: 'Estrella', emoji: '⭐' }, { word: 'Elefante', emoji: '🐘' }, { word: 'Escuela', emoji: '🏫' }, { word: 'Erizo', emoji: '🦔' }, { word: 'Escalera', emoji: '🪜' }],
  'F': [{ word: 'Fuego', emoji: '🔥' }, { word: 'Flor', emoji: '🌸' }, { word: 'Fresa', emoji: '🍓' }, { word: 'Foca', emoji: '🦭' }, { word: 'Fantasma', emoji: '👻' }],
  'G': [{ word: 'Globo', emoji: '🎈' }, { word: 'Gato', emoji: '🐱' }, { word: 'Girasol', emoji: '🌻' }, { word: 'Gorila', emoji: '🦍' }, { word: 'Gorra', emoji: '🧢' }],
  'H': [{ word: 'Huevo', emoji: '🥚' }, { word: 'Helado', emoji: '🍦' }, { word: 'Hormiga', emoji: '🐜' }, { word: 'Hipopótamo', emoji: '🦛' }, { word: 'Hoja', emoji: '🍃' }],
  'I': [{ word: 'Isla', emoji: '🏝️' }, { word: 'Iguana', emoji: '🦎' }, { word: 'Imán', emoji: '🧲' }, { word: 'Iglesia', emoji: '⛪' }, { word: 'Incendio', emoji: '🚒' }],
  'J': [{ word: 'Jarra', emoji: '🏺' }, { word: 'Jirafa', emoji: '🦒' }, { word: 'Juguete', emoji: '🧸' }, { word: 'Jabón', emoji: '🧼' }, { word: 'Joya', emoji: '💎' }],
  'K': [{ word: 'Kiwi', emoji: '🥝' }, { word: 'Koala', emoji: '🐨' }, { word: 'Ketchup', emoji: '🍅' }, { word: 'Kayak', emoji: '🛶' }, { word: 'Karate', emoji: '🥋' }],
  'L': [{ word: 'Luna', emoji: '🌙' }, { word: 'León', emoji: '🦁' }, { word: 'Lápiz', emoji: '✏️' }, { word: 'Loro', emoji: '🦜' }, { word: 'Lámpara', emoji: '💡' }],
  'M': [{ word: 'Mano', emoji: '✋' }, { word: 'Manzana', emoji: '🍎' }, { word: 'Mono', emoji: '🐒' }, { word: 'Mariposa', emoji: '🦋' }, { word: 'Martillo', emoji: '🔨' }],
  'N': [{ word: 'Nido', emoji: '🪺' }, { word: 'Nube', emoji: '☁️' }, { word: 'Naranja', emoji: '🍊' }, { word: 'Nariz', emoji: '👃' }, { word: 'Nieve', emoji: '❄️' }],
  'Ñ': [{ word: 'Ñandú', emoji: '🐦' }, { word: 'Ñame', emoji: '🥔' }, { word: 'Ñoquis', emoji: '🍝' }, { word: 'Ñu', emoji: '🐃' }, { word: 'Cabaña', emoji: '🛖' }],
  'O': [{ word: 'Ojo', emoji: '👁️' }, { word: 'Oso', emoji: '🐻' }, { word: 'Ola', emoji: '🌊' }, { word: 'Oveja', emoji: '🐑' }, { word: 'Olla', emoji: '🍲' }],
  'P': [{ word: 'Perro', emoji: '🐶' }, { word: 'Pato', emoji: '🦆' }, { word: 'Pelota', emoji: '⚽' }, { word: 'Pez', emoji: '🐟' }, { word: 'Puerta', emoji: '🚪' }],
  'Q': [{ word: 'Queso', emoji: '🧀' }, { word: 'Quetzal', emoji: '🦜' }, { word: 'Quitamanchas', emoji: '🧼' }, { word: 'Química', emoji: '🧪' }, { word: 'Quince', emoji: '1️⃣5️⃣' }],
  'R': [{ word: 'Ratón', emoji: '🐭' }, { word: 'Rana', emoji: '🐸' }, { word: 'Regalo', emoji: '🎁' }, { word: 'Robot', emoji: '🤖' }, { word: 'Rosa', emoji: '🌹' }],
  'S': [{ word: 'Sol', emoji: '☀️' }, { word: 'Sapo', emoji: '🐸' }, { word: 'Sandía', emoji: '🍉' }, { word: 'Serpiente', emoji: '🐍' }, { word: 'Silla', emoji: '🪑' }],
  'T': [{ word: 'Tren', emoji: '🚂' }, { word: 'Tigre', emoji: '🐯' }, { word: 'Tortuga', emoji: '🐢' }, { word: 'Tenedor', emoji: '🍴' }, { word: 'Teléfono', emoji: '📞' }],
  'U': [{ word: 'Uva', emoji: '🍇' }, { word: 'Unicornio', emoji: '🦄' }, { word: 'Uña', emoji: '💅' }, { word: 'Universo', emoji: '🌌' }, { word: 'Uno', emoji: '1️⃣' }],
  'V': [{ word: 'Vaca', emoji: '🐮' }, { word: 'Vela', emoji: '🕯️' }, { word: 'Violín', emoji: '🎻' }, { word: 'Ventana', emoji: '🪟' }, { word: 'Vaso', emoji: '🥛' }],
  'W': [{ word: 'Waffle', emoji: '🧇' }, { word: 'Waterpolo', emoji: '🤽' }, { word: 'Wifi', emoji: '📶' }, { word: 'Wombat', emoji: '🐨' }, { word: 'Windsurf', emoji: '🏄' }],
  'X': [{ word: 'Xilófono', emoji: '🎼' }, { word: 'Xenón', emoji: '💡' }, { word: 'Xilografía', emoji: '🖼️' }, { word: 'Rayos X', emoji: '🦴' }, { word: 'Xilófono', emoji: '🎹' }],
  'Y': [{ word: 'Yoyo', emoji: '🪀' }, { word: 'Yate', emoji: '🛥️' }, { word: 'Yema', emoji: '🍳' }, { word: 'Yogur', emoji: '🍦' }, { word: 'Yegua', emoji: '🐎' }],
  'Z': [{ word: 'Zapato', emoji: '👟' }, { word: 'Zorro', emoji: '🦊' }, { word: 'Zanahoria', emoji: '🥕' }, { word: 'Zebra', emoji: '🦓' }, { word: 'Zumo', emoji: '🥤' }],
};

const LETTERS = Object.keys(LETTER_OBJECTS);
const COLORS = ['#FF85A1', '#4CC9F0', '#F9C74F', '#90BE6D', '#B5179E'];

type GameMode = 'trace' | 'find';

export default function App() {
  const [gameMode, setGameMode] = useState<GameMode>('trace');
  const [currentLetter, setCurrentLetter] = useState('');
  const [currentObject, setCurrentObject] = useState({ word: '', emoji: '' });
  const [options, setOptions] = useState<string[]>([]);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'success' | 'settings'>('start');
  const [score, setScore] = useState(0);
  const [helpLevel, setHelpLevel] = useState<HelpLevel>('full');
  const [showSettings, setShowSettings] = useState(false);
  const [traceProgress, setTraceProgress] = useState(0);
  const [wrongSelection, setWrongSelection] = useState<number | null>(null);
  
  const canvasRef = useRef<LetterCanvasHandle>(null);

  const nextLetter = useCallback((modeOverride?: GameMode) => {
    const activeMode = modeOverride || gameMode;
    const randomLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    // Pick a random object for this letter
    const objects = LETTER_OBJECTS[randomLetter];
    const obj = objects[Math.floor(Math.random() * objects.length)];
    
    setCurrentLetter(randomLetter);
    setCurrentObject(obj);
    setCurrentColor(randomColor);
    setTraceProgress(0);
    setWrongSelection(null);
    
    if (activeMode === 'find') {
      const others = LETTERS.filter(l => l !== randomLetter)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);
      setOptions([randomLetter, ...others].sort(() => 0.5 - Math.random()));
      speakInstruction(randomLetter);
    } else {
      speakLetter(randomLetter);
    }
    
    setGameState('playing');
  }, [gameMode]);

  const handleStart = (mode: GameMode) => {
    setGameMode(mode);
    nextLetter(mode);
  };

  const handleComplete = () => {
    if (gameMode === 'trace' && traceProgress < 80) return;
    
    setGameState('success');
    setScore(prev => prev + 1);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: COLORS
    });
    speakSuccess();
    
    setTimeout(() => {
      nextLetter();
    }, 2500);
  };

  const handleFailure = (idx: number) => {
    setWrongSelection(idx);
    speakTryAgain();
    setTimeout(() => setWrongSelection(null), 1000);
  };

  const handleReset = () => {
    canvasRef.current?.clear();
    setTraceProgress(0);
  };

  const handleSoundClick = (e: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (gameMode === 'trace') {
      speakLetter(currentLetter);
    } else {
      speakInstruction(currentLetter);
    }
  };

  const [isHintActive, setIsHintActive] = useState(false);

  const handleHint = () => {
    setIsHintActive(true);
    setTimeout(() => setIsHintActive(false), 2000);
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-between p-4 font-sans select-none overflow-hidden bg-gradient-to-b from-[#E0F2FE] to-[#FDFCF0]">
      {/* Playful Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Sun */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 w-32 h-32 bg-yellow-400 rounded-full blur-xl opacity-40"
        />
        
        {/* Clouds */}
        <motion.div 
          animate={{ x: [-20, 20, -20] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[10%] w-48 h-16 bg-white rounded-full blur-md opacity-60"
        />
        <motion.div 
          animate={{ x: [20, -20, 20] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 right-[15%] w-64 h-20 bg-white rounded-full blur-md opacity-50"
        />
        <motion.div 
          animate={{ x: [-10, 10, -10] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-40 left-[5%] w-40 h-12 bg-white rounded-full blur-md opacity-40"
        />

        <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-kids-pink/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-kids-blue/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Floating Emojis in background */}
        <div className="absolute top-1/4 left-10 text-4xl opacity-10 animate-bounce" style={{ animationDuration: '3s' }}>🎨</div>
        <div className="absolute bottom-1/4 right-10 text-4xl opacity-10 animate-bounce" style={{ animationDuration: '4s' }}>✏️</div>
        <div className="absolute top-1/2 right-1/4 text-4xl opacity-10 animate-bounce" style={{ animationDuration: '5s' }}>🌟</div>
      </div>

      {/* Header */}
      <div className="w-full flex justify-between items-center z-10">
        <motion.div 
          key={score}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-md border-2 border-kids-yellow/20"
        >
          <Star className="text-kids-yellow fill-kids-yellow w-6 h-6" />
          <span className="font-display text-2xl font-bold text-gray-700">{score}</span>
        </motion.div>
        
        <div className="flex gap-3">
          {gameState === 'playing' && (
            <>
              <button 
                onClick={() => setGameState('start')}
                className="p-4 bg-white text-gray-400 rounded-full shadow-lg btn-pop active:scale-90 transition-transform cursor-pointer"
                aria-label="Volver al inicio"
              >
                <X className="w-8 h-8 pointer-events-none" />
              </button>
              <button 
                onPointerDown={handleSoundClick}
                className="p-4 bg-kids-blue text-white rounded-full shadow-lg btn-pop active:scale-90 transition-transform cursor-pointer"
                aria-label="Escuchar de nuevo"
              >
                <Volume2 className="w-8 h-8 pointer-events-none" />
              </button>
            </>
          )}
          <button 
            onClick={() => setShowSettings(true)}
            className="p-4 bg-white text-gray-400 rounded-full shadow-lg btn-pop active:scale-90 transition-transform cursor-pointer"
            aria-label="Configuración"
          >
            <Settings className="w-8 h-8 pointer-events-none" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md my-4 relative flex flex-col justify-center min-h-0">
        <AnimatePresence mode="wait">
          {gameState === 'start' ? (
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="text-center flex flex-col gap-6"
            >
              <h1 className="font-display text-5xl font-bold text-kids-pink mb-4 drop-shadow-sm">
                ¡Aventura de Letras!
              </h1>
              
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => handleStart('trace')}
                  className="bg-kids-green text-white p-6 rounded-3xl shadow-xl flex items-center justify-center gap-4 btn-pop border-b-8 border-green-700 active:border-b-0 active:translate-y-2 transition-all group"
                >
                  <PenTool className="w-10 h-10 group-hover:rotate-12 transition-transform" />
                  <span className="font-display text-2xl font-bold">Trazar Letras</span>
                </button>

                <button
                  onClick={() => handleStart('find')}
                  className="bg-kids-purple text-white p-6 rounded-3xl shadow-xl flex items-center justify-center gap-4 btn-pop border-b-8 border-purple-800 active:border-b-0 active:translate-y-2 transition-all group"
                >
                  <Search className="w-10 h-10 group-hover:scale-110 transition-transform" />
                  <span className="font-display text-2xl font-bold">Encuentra la Letra</span>
                </button>
              </div>
            </motion.div>
          ) : currentLetter ? (
            <motion.div
              key={`${gameMode}-${currentLetter}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full h-full flex flex-col gap-4"
            >
              {gameMode === 'trace' ? (
                <div className="flex-1 w-full relative flex flex-col gap-2 min-h-[300px]">
                  {/* Letter Object Hint */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => speakWord(currentObject.word)}
                    className="absolute top-2 right-2 bg-white/95 p-3 rounded-2xl shadow-md border-2 border-kids-yellow/30 flex flex-col items-center z-20 cursor-pointer"
                  >
                    <span className="text-3xl">{currentObject.emoji}</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{currentObject.word}</span>
                  </motion.div>

                  <div className="flex-1 w-full relative h-full">
                    <LetterCanvas 
                      key={`trace-${currentLetter}`}
                      ref={canvasRef}
                      letter={currentLetter} 
                      color={currentColor} 
                      helpLevel={helpLevel}
                      onProgress={setTraceProgress}
                    />
                    {/* Progress bar hint */}
                    <div className="absolute bottom-4 left-4 right-4 h-2 bg-gray-100/50 rounded-full overflow-hidden backdrop-blur-sm">
                      <motion.div 
                        className="h-full bg-kids-green"
                        animate={{ width: `${traceProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 w-full flex flex-col gap-3 py-2 relative h-full min-h-[300px]">
                  {/* Hint Button */}
                  <div className="absolute -top-6 right-0 z-30">
                    <button 
                      onClick={handleHint}
                      className="p-2 bg-white/90 backdrop-blur rounded-xl shadow-sm border-2 border-kids-yellow/30 text-kids-yellow flex items-center gap-2 hover:bg-white transition-colors"
                    >
                      <Star className="w-4 h-4 fill-kids-yellow" />
                      <span className="text-xs font-bold">Pista</span>
                    </button>
                  </div>

                  {options.map((opt, idx) => (
                    <motion.div 
                      key={`${opt}-${idx}`}
                      animate={wrongSelection === idx ? { x: [-5, 5, -5, 5, 0] } : {}}
                      transition={{ duration: 0.4, ease: "linear" }}
                      className={`flex-1 relative w-full bg-white rounded-3xl border-4 border-dashed overflow-hidden shadow-md transition-all min-h-[60px] ${
                        wrongSelection === idx ? 'border-red-400 bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      <LetterCanvas 
                        key={`find-${opt}-${idx}`}
                        letter={opt} 
                        color={currentColor} 
                        isTarget={opt === currentLetter}
                        helpLevel="minimal"
                        forceReveal={isHintActive}
                        onSuccess={handleComplete}
                        onFailure={() => handleFailure(idx)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Footer Controls */}
      {gameState === 'playing' && gameMode === 'trace' && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="w-full max-w-md flex justify-around items-center gap-4 pb-2"
        >
          <button
            onClick={handleReset}
            className="p-5 bg-white text-gray-400 rounded-2xl shadow-lg border-b-4 border-gray-200 btn-pop"
          >
            <RotateCcw className="w-8 h-8" />
          </button>

          <button
            onClick={handleComplete}
            disabled={traceProgress < 80}
            className={`flex-1 py-5 rounded-2xl shadow-lg border-b-4 flex items-center justify-center gap-2 btn-pop transition-all ${
              traceProgress >= 80 
                ? 'bg-kids-green text-white border-green-600' 
                : 'bg-gray-200 text-gray-400 border-gray-300 opacity-50'
            }`}
          >
            <Check className="w-8 h-8 stroke-[3]" />
            <span className="font-display text-xl font-bold">¡LISTO!</span>
          </button>
        </motion.div>
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 p-2 text-gray-400"
              >
                <X className="w-8 h-8" />
              </button>

              <h2 className="font-display text-3xl font-bold text-gray-800 mb-6 text-center">Configuración</h2>
              
              <div className="space-y-6">
                <div>
                  <p className="font-display text-lg font-semibold text-gray-600 mb-3">Nivel de Ayuda</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['full', 'medium', 'minimal'] as HelpLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setHelpLevel(level)}
                        className={`py-3 rounded-2xl font-bold transition-all ${
                          helpLevel === level 
                            ? 'bg-kids-blue text-white shadow-md scale-105' 
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {level === 'full' ? 'Máxima' : level === 'medium' ? 'Media' : 'Mínima'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setGameState('start');
                    setShowSettings(false);
                    setScore(0);
                  }}
                  className="w-full py-4 bg-kids-pink text-white rounded-2xl font-display font-bold text-xl shadow-lg btn-pop"
                >
                  Volver al Inicio
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Overlay */}
      <AnimatePresence>
        {gameState === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/40 backdrop-blur-sm pointer-events-none flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
              className="bg-white p-12 rounded-[50px] shadow-2xl border-8 border-kids-yellow flex flex-col items-center gap-4"
            >
              <span className="text-8xl animate-bounce">{currentObject.emoji}</span>
              <span className="font-display text-4xl font-bold text-gray-700 uppercase tracking-widest">{currentObject.word}</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
