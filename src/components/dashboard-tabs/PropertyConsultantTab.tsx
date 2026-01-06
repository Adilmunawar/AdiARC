"use client";

import { askDbAssistant } from "@/ai/flows/db-assistant-flow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Copy, Loader2, Mic, Palette, PenSquare, Play, RefreshCw, Send, Sparkles, User, UserCircle, Video, Volume2, Wand2 } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from "../ui/use-toast";
import { cn } from "@/lib/utils";

type Message = {
    id: number;
    role: "user" | "assistant";
    content: string;
    audioData?: string;
};

type AssistantMode = "normal" | "db";

const suggestionChips = [
    { text: "Create image", icon: Palette },
    { text: "Create video", icon: Video },
    { text: "Write anything", icon: PenSquare },
    { text: "Help me learn", icon: BrainCircuit },
    { text: "Boost my day", icon: Sparkles },
    { text: "Explore visually", icon: Wand2 },
]

export function PropertyConsultantTab() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<AssistantMode>("normal");
    const [activeAudioId, setActiveAudioId] = useState<number | null>(null);

    // State for Speech-to-Text
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { toast } = useToast();

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isLoading]);

    // --- Audio Playback Logic ---
    const playAudio = (audioData: string, messageId: number) => {
        if (audioRef.current) {
            if (activeAudioId === messageId) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                setActiveAudioId(null);
            } else {
                audioRef.current.src = audioData;
                audioRef.current.play().catch(err => console.error("Audio playback failed:", err));
                setActiveAudioId(messageId);
            }
        }
    };
    
    useEffect(() => {
        const audio = audioRef.current;
        const handleAudioEnd = () => setActiveAudioId(null);
        if (audio) {
            audio.addEventListener('ended', handleAudioEnd);
            return () => audio.removeEventListener('ended', handleAudioEnd);
        }
    }, []);

    // --- Speech Recognition Logic ---
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast({
                variant: 'destructive',
                title: "Speech Recognition Not Supported",
                description: "Your browser does not support the Web Speech API.",
            });
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US'; // Can be changed, e.g., 'ur-PK' for Urdu

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                 setInput(prev => prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim());
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            toast({
                variant: 'destructive',
                title: "Speech Recognition Error",
                description: event.error === 'not-allowed' ? 'Microphone permission was denied.' : `An error occurred: ${event.error}`,
            });
            setIsListening(false);
        };

        recognition.onend = () => {
             if (isListening) { // Auto-restart if still supposed to be listening
                recognition.start();
            }
        };
        
        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
        };
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                 console.error("Could not start recognition:", err);
                 // This can happen if it's already started, so we try stopping and starting.
                 try {
                    recognitionRef.current.stop();
                    setTimeout(() => {
                        recognitionRef.current.start();
                        setIsListening(true);
                    }, 100);
                 } catch (stopErr) {
                     toast({ variant: 'destructive', title: "Mic Error", description: "Could not activate the microphone."});
                 }
            }
        }
    };


    // --- Core Chat Logic ---
    const processAndSendMessage = async (messageHistory: Message[], currentMode: AssistantMode) => {
        setIsLoading(true);
        try {
            const apiHistory = messageHistory.map(({ role, content }) => ({ role, content }));
            const response = await askDbAssistant({ history: apiHistory, mode: currentMode });
            
            const assistantMessage: Message = { 
                id: Date.now(),
                role: "assistant", 
                content: response.text,
                audioData: response.audioData
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error("AI Assistant Error:", error);
            const errorMessage = error.message || "An unknown error occurred while fetching the response.";
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: errorMessage,
                duration: 9000,
            });
            const errorChatMessage: Message = {
                id: Date.now(),
                role: "assistant",
                content: `An error occurred: ${errorMessage}`,
            };
            setMessages((prev) => [...prev, errorChatMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent, messageContent?: string) => {
        if (e) e.preventDefault();
        const content = messageContent || input;
        if (!content.trim() || isLoading) return;
        
        if (isListening) {
            toggleListening(); // Stop listening when a message is sent
        }

        const newUserMessage: Message = { id: Date.now(), role: "user", content };
        const updatedMessages = [...messages, newUserMessage];
        
        setMessages(updatedMessages);
        setInput("");
        
        await processAndSendMessage(updatedMessages, mode);
    };

    const handleRegenerateResponse = async () => {
        if (isLoading || messages.length === 0) return;
        const lastUserMessageIndex = messages.map(m => m.role).lastIndexOf('user');
        if (lastUserMessageIndex === -1) return;

        const historyToResend = messages.slice(0, lastUserMessageIndex + 1);
        setMessages(historyToResend);
        
        await processAndSendMessage(historyToResend, mode);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: "Copied to clipboard!", duration: 2000 });
        }).catch(err => {
            toast({ title: "Copy failed", description: err.message, variant: "destructive" });
        });
    };

    return (
       <div className="flex flex-col h-full w-full">
            <ScrollArea className="flex-1" ref={scrollAreaRef}>
                <div className="max-w-4xl mx-auto px-4 pt-8 pb-20">
                    {messages.length === 0 && !isLoading ? (
                        <div className="flex flex-col items-start animate-fade-in-up">
                            <h1 className="text-4xl sm:text-5xl font-bold text-foreground/80 mb-2">
                                <span className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-500 text-transparent bg-clip-text">Hi Adil,</span>
                            </h1>
                            <h2 className="text-4xl sm:text-5xl font-bold text-foreground/40">
                                Where should we start?
                            </h2>
                        </div>
                    ) : (
                        <div className="space-y-8">
                             {messages.map((message) => (
                                <div key={message.id} className={cn("group flex items-start gap-4 text-sm animate-fade-in-up")}>
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        {message.role === 'assistant' ? <UserCircle className="w-6 h-6 text-primary" /> : <User className="w-5 h-5 text-muted-foreground" />}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <p className="font-semibold text-foreground">
                                            {message.role === 'assistant' ? 'Property Consultant' : 'You'}
                                        </p>
                                        <div className={cn("text-base", message.role === 'user' ? 'text-foreground/80' : 'text-foreground')}>
                                            <ReactMarkdown
                                            className="prose prose-sm dark:prose-invert font-urdu leading-relaxed max-w-none"
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                pre: ({node, ...props}) => <pre className="bg-muted/50 p-2 rounded-md font-sans text-xs" {...props} />,
                                                code: ({node, ...props}) => <code className="bg-muted/50 px-1 py-0.5 rounded-md font-mono text-xs" {...props} />,
                                            }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                         {message.role === 'assistant' && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -ml-2">
                                                {message.audioData && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => playAudio(message.audioData!, message.id)}>
                                                        <Volume2 className={cn("h-4 w-4 text-muted-foreground", activeAudioId === message.id && "text-primary animate-pulse")} />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(message.content)}>
                                                    <Copy className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                             {isLoading && (
                                <div className="flex items-start gap-4 text-sm animate-fade-in-up">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                         <UserCircle className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <p className="font-semibold text-foreground">Property Consultant</p>
                                        <div className="flex items-center space-x-1 pt-2">
                                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </ScrollArea>
             <div className="w-full max-w-4xl mx-auto px-4 pb-4">
                {messages.length === 0 && !isLoading && (
                    <div className="flex flex-wrap justify-center gap-3 mb-4 animate-fade-in-up" style={{ animationDelay: '150ms'}}>
                        {suggestionChips.map((chip) => (
                            <Button key={chip.text} variant="outline" className="rounded-full bg-card hover:bg-muted" onClick={() => handleSendMessage(undefined, chip.text)}>
                                <chip.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                                {chip.text}
                            </Button>
                        ))}
                    </div>
                )}
                 <div className="relative">
                    <form onSubmit={handleSendMessage}>
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask Property Consultant..."
                            className="w-full h-14 pl-5 pr-28 rounded-full bg-card shadow-lg text-base"
                            disabled={isLoading}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                             <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className={cn("text-muted-foreground hover:bg-muted", isListening && "text-red-500 animate-pulse")} 
                                onClick={toggleListening}
                                disabled={isLoading}
                             >
                                <Mic className="h-5 w-5" />
                            </Button>
                            <Button type="submit" size="icon" className="rounded-full" disabled={isLoading || !input.trim()}>
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                <span className="sr-only">Send</span>
                            </Button>
                        </div>
                    </form>
                 </div>
             </div>
             <audio ref={audioRef} className="hidden" />
       </div>
    );
}
