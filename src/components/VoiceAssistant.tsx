import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mic, Send, Loader2, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import botI from '../assets/assistant-icon.png'; 

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isOpen, setIsOpen] = useState(false); 
  

  const [messages, setMessages] = useState<Message[]>([]);
  

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async (query: string) => {
    if (!query.trim()) return;
    
  
    const newMessages: Message[] = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setInputText(""); 
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('chat_assistant', {
        body: { query }
      });

      if (error) throw error;

      if (data) {
        
        setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

const handleStartListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please try Google Chrome or Edge.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-NG'; 
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      console.log("Mic is active and listening...");
      setIsListening(true);
    };
    
    recognition.onresult = (event) => {
      console.log("Speech captured successfully!");
      setIsListening(false);
      const parentQuestion = event.results[0][0].transcript;
      setInputText(parentQuestion); 
      sendMessage(parentQuestion); 
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        alert("Microphone access was denied. Please allow microphone permissions in your browser address bar.");
      } else if (event.error === 'network') {
        alert("Network error. Voice recognition requires an active internet connection.");
      } else {
        alert(`Voice error: ${event.error}. Check your console for details.`);
      }
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col items-end z-50 fixed bottom-6 right-6">
      
      {/* The Chat Window */}
      {isOpen && (
        <div className="w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl mb-4 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-yellow-100 text-green-900 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img src={botI} alt="Assistant" className="w-5 h-5" />
              <h3 className="font-bold text-sm">School Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-green-900">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Body (Now mapping through the messages array) */}
          <div className="p-4 bg-slate-50 h-[350px] overflow-y-auto flex flex-col gap-3">
            {messages.length === 0 && !isLoading && (
              <p className="text-gray-500 text-xs text-center my-auto">
                Ask about school fees, rules, or the calendar...
              </p>
            )}
            
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`p-3 text-sm max-w-[85%] ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-2xl rounded-br-none shadow-sm' 
                      : 'bg-white border border-blue-100 text-slate-800 rounded-2xl rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
              </div>
            )}
            
            {/* Invisible div to help us auto-scroll to the bottom */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-white flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className={`shrink-0 rounded-full ${isListening ? 'bg-red-100 text-red-600 border-red-200 animate-pulse' : 'text-gray-500'}`}
              onClick={handleStartListening}
              disabled={isLoading}
            >
              <Mic className="w-4 h-4" />
            </Button>
            
            <Input 
              placeholder="Type a message..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
              className="border-gray-200 focus-visible:ring-blue-500 rounded-full"
              disabled={isLoading}
            />
            
            <Button 
              size="icon" 
              className="shrink-0 rounded-full bg-blue-600 hover:bg-blue-700"
              onClick={() => sendMessage(inputText)}
              disabled={isLoading || !inputText.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <div className="relative flex items-center">
        
        {!isOpen && (
          <div className="absolute right-16 bg-white text-slate-800 text-sm font-medium px-4 py-2 rounded-2xl shadow-lg border border-gray-100 whitespace-nowrap animate-bounce">
            Hi! <br></br>Ask me anything 
            <div className="absolute top-1/2 -right-2 -translate-y-1/2 border-y-[6px] border-y-transparent border-l-[8px] border-l-white"></div>
          </div>
        )}

        {/* The Toggle Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-10"
        >
          {isOpen ? <X className="w-6 h-6" /> : <img src={botI} alt="Assistant" className="w-8 h-8 object-contain" /> }
        </button>
        
      </div>
    </div>
  );
}