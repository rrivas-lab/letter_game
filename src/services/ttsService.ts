import { GoogleGenAI, Modality } from "@google/genai";

let voices: SpeechSynthesisVoice[] = [];

function loadVoices() {
  voices = window.speechSynthesis.getVoices();
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}

function speakFallback(text: string) {
  if ('speechSynthesis' in window) {
    // Immediate cancellation of any current speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a good Spanish voice
    const spanishVoice = voices.find(v => v.lang.startsWith('es')) || voices[0];
    if (spanishVoice) utterance.voice = spanishVoice;
    
    utterance.lang = 'es-ES';
    utterance.rate = 1.1; // Slightly faster for responsiveness
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
    return true;
  }
  return false;
}

export async function speakLetter(letter: string) {
  const text = `¡Esta es la letra ${letter}!`;
  // Immediate response with Web Speech API
  speakFallback(text);
}

export async function speakSuccess() {
  const phrases = [
    "¡Excelente trabajo!",
    "¡Lo hiciste muy bien!",
    "¡Eres un genio!",
    "¡Increíble!",
    "¡Sigue así, campeón!"
  ];
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  speakFallback(phrase);
}

export async function speakInstruction(letter: string) {
  const text = `Busca y traza la letra ${letter}. ¿Dónde está la ${letter}?`;
  speakFallback(text);
}

export async function speakTryAgain() {
  const phrases = [
    "¡Casi lo tienes! Inténtalo otra vez.",
    "¡Oh! Esa no es. ¡Busca de nuevo!",
    "¡Tú puedes! Intenta trazar la otra letra.",
    "¡Sigue buscando! ¿Dónde está la letra?"
  ];
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  speakFallback(phrase);
}

export async function speakWord(word: string) {
  speakFallback(word);
}
