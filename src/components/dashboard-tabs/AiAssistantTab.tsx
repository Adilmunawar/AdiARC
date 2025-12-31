
"use client";

import { askDbAssistant } from "@/ai/flows/db-assistant-flow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Loader2, Send, Sparkles, User, UserCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from "../ui/use-toast";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

type Message = {
    role: "user" | "assistant";
    content: string;
    audioData?: string;
};

type AssistantMode = "normal" | "db";

const quickQuestions = [
    {
        question: "ایک پراپرٹی خریدنے کے لیے کیا قانونی اقدامات ہیں؟",
        mode: "normal",
    },
    {
        question: "وراثت کی تقسیم کے لیے 1 بیوہ، 2 بیٹے اور 10 کنال زمین کا حساب لگائیں۔",
        mode: "db",
    },
    {
        question: "پاکستان میں پراپرٹی پر کون سے ٹیکس لاگو ہوتے ہیں؟",
        mode: "normal",
    },
];

export function PropertyConsultantTab() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<AssistantMode>("normal");
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isLoading]);

    const handleSendMessage = async (e?: React.FormEvent, messageContent?: string) => {
        if (e) e.preventDefault();
        const currentInput = messageContent || input;
        if (!currentInput.trim() || isLoading) return;

        const newUserMessage: Message = { role: "user", content: currentInput };
        const updatedMessages = [...messages, newUserMessage];
        
        setMessages(updatedMessages);
        setInput("");
        setIsLoading(true);

        try {
            const response = await askDbAssistant({ history: updatedMessages, mode });
            
            const assistantMessage: Message = { 
                role: "assistant", 
                content: response.text,
                audioData: response.audioData
            };
            setMessages((prev) => [...prev, assistantMessage]);

            if (response.audioData) {
                if (audioRef.current) {
                    audioRef.current.src = response.audioData;
                    audioRef.current.play().catch(err => console.error("Audio playback failed:", err));
                }
            }
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
                role: "assistant",
                content: `An error occurred: ${errorMessage}`,
            };
            setMessages((prev) => [...prev, errorChatMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleQuickQuestion = (question: string, questionMode: AssistantMode) => {
        setMode(questionMode);
        handleSendMessage(undefined, question);
    };

    return (
        <Card className="w-full max-w-3xl mx-auto h-[85vh] flex flex-col animate-enter border-border/70 bg-gradient-to-br from-card/80 to-muted/20 shadow-lg">
            <CardHeader className="border-b">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                            <UserCircle className="h-7 w-7 text-primary" />
                            Property Consultant
                        </CardTitle>
                        <CardDescription className="font-urdu pt-1">
                           آپ کا اے-آئی اسسٹنٹ برائے پاکستانی پراپرٹی قانون اور وراثت۔
                        </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 border border-dashed rounded-lg p-2 bg-background/50 hover:border-primary/50 transition-all duration-300">
                        <Label htmlFor="mode-toggle" className="text-xs text-muted-foreground">
                            Normal
                        </Label>
                        <Switch
                            id="mode-toggle"
                            checked={mode === "db"}
                            onCheckedChange={(checked) => setMode(checked ? "db" : "normal")}
                            aria-label="Toggle assistant mode"
                        />
                         <Label htmlFor="mode-toggle" className="text-xs font-semibold text-primary flex items-center gap-1">
                            <BrainCircuit className="h-4 w-4" />
                            Wirasat Expert
                        </Label>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden p-0">
                <ScrollArea className="flex-1" ref={scrollAreaRef}>
                    <div className="p-4 sm:p-6 space-y-6">
                        {messages.length === 0 && !isLoading && (
                            <div className="text-center text-muted-foreground animate-fade-in-up flex flex-col items-center justify-center h-full pt-10">
                                <Sparkles className="h-10 w-10 text-primary/70 mb-4" />
                                <h2 className="text-lg font-semibold text-foreground font-urdu">کنسلٹنٹ سے پوچھیں</h2>
                                <p className="text-sm mt-1 font-urdu">پراپرٹی یا وراثت کے بارے میں اردو میں سوال کریں۔</p>
                                
                                <div className="w-full max-w-md mt-8">
                                    <p className="text-xs font-semibold text-muted-foreground mb-3 font-urdu">فوری سوالات</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {quickQuestions.map((item, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleQuickQuestion(item.question, item.mode as AssistantMode)}
                                                className="font-urdu text-sm text-left p-3 bg-background/60 rounded-lg border border-border/50 hover:bg-muted/80 hover:border-primary/50 transition-all duration-200"
                                            >
                                                {item.question}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {messages.map((message, index) => (
                            <div key={index} className={`flex gap-3 text-sm animate-fade-in-up ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {message.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <UserCircle className="w-5 h-5 text-primary" />
                                    </div>
                                )}
                                <div className={`font-urdu max-w-xl rounded-lg p-3 text-base transition-transform duration-300 ease-in-out hover:scale-[1.015] hover:shadow-md ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                                    <ReactMarkdown
                                      className="prose prose-sm dark:prose-invert max-w-none"
                                      remarkPlugins={[remarkGfm]}
                                      components={{
                                        pre: ({node, ...props}) => <pre className="bg-muted/50 p-2 rounded-md font-sans text-xs" {...props} />,
                                        code: ({node, ...props}) => <code className="bg-muted/50 px-1 py-0.5 rounded-md font-mono text-xs" {...props} />,
                                      }}
                                    >
                                        {message.content}
                                    </ReactMarkdown>
                                </div>
                                {message.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex gap-3 text-sm animate-fade-in-up">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                     <UserCircle className="w-5 h-5 text-primary" />
                                </div>
                                <div className="max-w-xl rounded-lg p-3 bg-background border flex items-center space-x-1">
                                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
             <CardFooter className="p-4 border-t bg-background/80">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 w-full">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={mode === 'db' ? "وراثت کی تقسیم کے بارے میں پوچھیں۔۔۔" : "پاکستان میں پراپرٹی کے بارے में کچھ بھی پوچھیں۔۔۔"}
                        className="flex-1 font-urdu text-base h-11"
                        disabled={isLoading}
                        dir="rtl"
                    />
                    <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={isLoading || !input.trim()}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
                <audio ref={audioRef} className="hidden" />
            </CardFooter>
        </Card>
    );
}

    