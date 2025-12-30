"use client";

import { askDbAssistant } from "@/ai/flows/db-assistant-flow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Loader2, Send, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
    role: "user" | "assistant";
    content: string;
};

export function AiAssistantTab() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const assistantResponse = await askDbAssistant(input);
            const assistantMessage: Message = { role: "assistant", content: assistantResponse };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("AI Assistant Error:", error);
            const errorMessage: Message = {
                role: "assistant",
                content: "Sorry, I encountered an error while processing your request. Please check the server logs.",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-3xl mx-auto h-[85vh] flex flex-col animate-enter border-border/70 bg-card/80 shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Bot className="h-5 w-5 text-primary" />
                    Virtual DB Assistant
                </CardTitle>
                <CardDescription>
                    Ask questions about the LRIMS database schema or request SQL queries. The AI has been provided with your database schema for context.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                    <div className="space-y-6">
                        {messages.length === 0 && (
                            <div className="text-center text-sm text-muted-foreground pt-10">
                                <p>No messages yet. Start the conversation!</p>
                                <p className="text-xs">e.g., "What are the primary keys in the transactions table?"</p>
                            </div>
                        )}
                        {messages.map((message, index) => (
                            <div key={index} className={`flex gap-3 text-sm ${message.role === 'user' ? 'justify-end' : ''}`}>
                                {message.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <Bot className="w-5 h-5 text-primary" />
                                    </div>
                                )}
                                <div className={`max-w-xl rounded-lg p-3 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    <ReactMarkdown
                                      className="prose prose-sm dark:prose-invert max-w-none"
                                      remarkPlugins={[remarkGfm]}
                                      components={{
                                        pre: ({node, ...props}) => <pre className="bg-background/50 p-2 rounded-md" {...props} />,
                                        code: ({node, ...props}) => <code className="bg-background/50 px-1 py-0.5 rounded-md" {...props} />,
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
                            <div className="flex gap-3 text-sm">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Bot className="w-5 h-5 text-primary" />
                                </div>
                                <div className="max-w-xl rounded-lg p-3 bg-muted flex items-center">
                                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-4 border-t">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask the AI about your database schema..."
                        className="flex-1"
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
