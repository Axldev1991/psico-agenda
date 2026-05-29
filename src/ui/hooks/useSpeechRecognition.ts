"use client";

import { useEffect, useRef, useState } from "react";

export function useSpeechRecognition(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("no-supported");
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false; // Solo resultados estables para evitar duplicaciones
    recognition.lang = "es-AR"; // Localizado en Español de Argentina

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      // Ignorar cualquier transcripción residual si el dictado ya fue detenido
      if (!isListeningRef.current) return;

      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      if (transcript) {
        onResult(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Error en Speech Recognition:", event.error);
      if (event.error === "not-allowed") {
        setError("Micrófono bloqueado. Habilitá los permisos.");
      } else {
        setError(`Error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [onResult]);

  const isListeningRef = useRef(false);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const startListening = () => {
    if (recognitionRef.current && !isListeningRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Error al iniciar dictador:", err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListeningRef.current) {
      try {
        // Llamar a stop() para procesar lo último y abort() para liberar de inmediato el hardware del micrófono
        recognitionRef.current.stop();
        recognitionRef.current.abort();
        setIsListening(false);
      } catch (err) {
        console.error("Error al detener dictador:", err);
      }
    }
  };

  const toggleListening = () => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  };

  return {
    isListening,
    error,
    isSupported,
    toggleListening,
  };
}
