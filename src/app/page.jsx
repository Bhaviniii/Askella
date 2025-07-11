"use client";

import React from "react";

import { useEffect, useRef, useState, useCallback } from "react";

const PERSONAS = [
  { value: "developer", label: "Developer" },
  { value: "writer", label: "Writer" },
  { value: "teacher", label: "Teacher" },
];

// Custom hook for speech-to-text
function useSpeechToText(onResult) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = useCallback(() => {
    if (typeof window !== "undefined" && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        onResult(transcript);
        // Do NOT stop or setIsListening here!
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      setIsListening(true);
      recognition.start();
    }
  }, [onResult]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, []);

  return { isListening, startListening, stopListening };
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [theme, setTheme] = useState("light");
  const [persona, setPersona] = useState("developer");
  const [voiceOn, setVoiceOn] = useState(true);
  const [muted, setMuted] = useState(false);
  const chatEndRef = useRef(null);

  // Speech-to-text hook
  const { isListening, startListening, stopListening } = useSpeechToText((text) => {
    setInput((prev) => prev + (prev ? " " : "") + text);
  });

  // Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("askella-chat");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem("askella-chat");
        setMessages([]);
      }
    }
  }, []);

  // Save chat history to localStorage and scroll to bottom on new message
  useEffect(() => {
    localStorage.setItem("askella-chat", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle theme switching
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Text-to-speech for Askella's responses
  useEffect(() => {
    if (muted) return;
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender === "askella" && typeof window !== "undefined" && "speechSynthesis" in window) {
      const utter = new window.SpeechSynthesisUtterance(lastMsg.text);
      utter.lang = "en-US";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    }
  }, [messages, muted]);

  // Send message to backend and handle response
  const sendMessage = async (e) => {
    e.preventDefault();
    stopListening(); // Stop mic when sending
    if (!input.trim()) return;
    const userMsg = { sender: "user", text: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setIsTyping(true);
    try {
      const res = await fetch("/api/askella", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, persona }),
      });
      const data = await res.json();
      setTimeout(() => {
        setMessages((msgs) => [...msgs, { sender: "askella", text: data.response }]);
        setIsTyping(false);
      }, 1200);
    } catch {
      setMessages((msgs) => [
        ...msgs,
        { sender: "askella", text: "Sorry, I couldn't respond right now." },
      ]);
      setIsTyping(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-300 ${theme === "dark" ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" : "bg-gradient-to-br from-blue-100 via-white to-blue-200"}`}>  
      <div className={`w-full max-w-xl mx-auto shadow-2xl rounded-2xl ${theme === "dark" ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200"} flex flex-col h-[80vh]`}> 
        <header className={`flex items-center justify-between px-6 py-4 rounded-t-2xl ${theme === "dark" ? "bg-gray-900 border-b border-gray-700" : "bg-pink-200 border-b border-pink-300"}`}>
          <h1 className="text-2xl font-bold text-white" style={{ WebkitTextStroke: '0.25px black' }}>Askella</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!muted) {
                  if (typeof window !== "undefined" && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                  setMuted(true);
                } else {
                  setMuted(false);
                }
              }}
              className="rounded-full p-2 border transition focus:outline-none"
              title={muted ? "Unmute voice response" : "Mute voice response"}
            >
              {muted ? (
                <span role="img">🔇</span>
              ) : (
                <span role="img">🔊</span>
              )}
            </button>
            <select
              value={persona}
              onChange={e => setPersona(e.target.value)}
              className="rounded px-2 py-1 text-sm border border-gray-300 bg-white text-gray-700 focus:outline-none"
            >
              {PERSONAS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="rounded px-3 py-1 text-sm border border-gray-300 bg-white text-gray-700 transition focus:outline-none hover:bg-gray-100"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
          </div>
        </header>
        <div className={`flex-1 overflow-y-auto px-6 py-4 space-y-4 ${theme === "dark" ? "bg-gray-900" : "bg-blue-50"}`}>
          {messages.length === 0 && (
            <div className={`text-center mt-10 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>Start a conversation with Askella!</div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={msg.sender === "user"
                ? "px-4 py-2 rounded-lg max-w-[80%] text-base shadow bg-pink-200 text-pink-900"
                : "px-4 py-2 rounded-lg max-w-[80%] text-base shadow bg-gray-100 text-gray-900 border border-gray-200"
              }>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className={`px-4 py-2 rounded-lg flex items-center gap-2 shadow bg-gray-100 text-gray-900 border border-gray-200`}>
                <span>Askella is thinking and preparing a response for you</span>
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={sendMessage} className={`flex items-center gap-2 px-6 py-4 rounded-b-2xl bg-gray-100 border-t border-gray-200`}>
          <input
            type="text"
            className={`flex-1 rounded px-4 py-2 bg-transparent border-none shadow-none focus:outline-none text-gray-900 placeholder-gray-400 text-lg font-medium ${theme === "dark" ? "text-gray-100" : ""}`}
            placeholder="Type your queries away...."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isTyping}
            autoFocus
          />
          <button
            type="button"
            onClick={startListening}
            className={`rounded-full p-2 border transition focus:outline-none ${isListening ? "bg-red-500 text-white border-red-600 animate-pulse" : "bg-white text-gray-500 border-gray-300 hover:bg-gray-100"}`}
            disabled={isListening || isTyping}
            title={isListening ? "Listening..." : "Speak"}
          >
            <svg viewBox="0 0 512 512" width="18" height="18" fill="#6B7280" xmlns="http://www.w3.org/2000/svg" className={isListening ? "animate-pulse" : ""}>
              <g>
                <g>
                  <path d="m439.5,236c0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,70-64,126.9-142.7,126.9-78.7,0-142.7-56.9-142.7-126.9 0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,86.2 71.5,157.4 163.1,166.7v57.5h-23.6c-11.3,0-20.4,9.1-20.4,20.4 0,11.3 9.1,20.4 20.4,20.4h88c11.3,0 20.4-9.1 20.4-20.4 0-11.3-9.1-20.4-20.4-20.4h-23.6v-57.5c91.6-9.3 163.1-80.5 163.1-166.7z"/>
                  <path d="m256,323.5c51,0 92.3-41.3 92.3-92.3v-127.9c0-51-41.3-92.3-92.3-92.3s-92.3,41.3-92.3,92.3v127.9c0,51 41.3,92.3 92.3,92.3zm-52.3-220.2c0-28.8 23.5-52.3 52.3-52.3s52.3,23.5 52.3,52.3v127.9c0,28.8-23.5,52.3-52.3,52.3s-52.3-23.5-52.3-52.3v-127.9z"/>
                </g>
              </g>
            </svg>
          </button>
          <button
            type="submit"
            className="rounded px-4 py-2 font-semibold transition disabled:opacity-50 bg-green-500 text-white hover:bg-green-600"
            disabled={isTyping || !input.trim()}
          >
            <svg className="w-5 h-5 inline-block align-middle" fill="white" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            <span className="sr-only">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
