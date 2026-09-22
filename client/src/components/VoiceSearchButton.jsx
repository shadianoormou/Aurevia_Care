import { useRef, useState } from "react";
import { FiMic, FiMicOff } from "react-icons/fi";
import toast from "react-hot-toast";

const VoiceSearchButton = ({ onResult, className = "" }) => {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const supported = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const startListening = () => {
    if (!supported) {
      toast.error("Voice search is not supported by this browser. Try a current Chrome or Edge browser.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = navigator.language || "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (event) => {
      if (event.error !== "aborted") toast.error("We could not hear that. Please allow microphone access and try again.");
    };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) onResult(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <button
      type="button"
      onClick={startListening}
      aria-label={listening ? "Stop voice search" : "Search by voice"}
      title={listening ? "Listening… click to stop" : "Search by voice"}
      className={`inline-flex items-center justify-center rounded-full transition-colors ${listening ? "bg-red-50 text-red-600 animate-pulse" : "text-primary-700 hover:bg-primary-50"} ${className}`}
    >
      {listening ? <FiMicOff /> : <FiMic />}
    </button>
  );
};

export default VoiceSearchButton;
