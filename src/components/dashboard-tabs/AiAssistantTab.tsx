
"use client";

import { askDbAssistant } from "@/ai/flows/db-assistant-flow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Loader2, Send, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from "../ui/use-toast";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import Image from 'next/image';

type Message = {
    role: "user" | "assistant";
    content: string;
};

type AssistantMode = "normal" | "db";

export function AiAssistantTab() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<AssistantMode>("normal");
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

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
        const currentInput = input;
        setInput("");
        setIsLoading(true);

        try {
            const assistantResponse = await askDbAssistant({ prompt: currentInput, mode });
            const assistantMessage: Message = { role: "assistant", content: assistantResponse };
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
            // Add a message to the chat as well
            const errorChatMessage: Message = {
                role: "assistant",
                content: `I'm sorry, but I ran into an issue: ${errorMessage}`,
            };
            setMessages((prev) => [...prev, errorChatMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-3xl mx-auto h-[85vh] flex flex-col animate-enter border-border/70 bg-card/80 shadow-md">
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Image src="/adil.png" alt="adil munawar" width={20} height={20} className="rounded-full" />
                            adil munawar
                        </CardTitle>
                        <CardDescription>
                           Engage in a conversation with AdiARC. Use the toggle for specialized knowledge.
                        </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 border border-dashed rounded-lg p-2">
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
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                    <div className="space-y-6">
                        {messages.length === 0 && (
                            <div className="text-center text-sm text-muted-foreground pt-10">
                                <p>No messages yet. Start the conversation!</p>
                                <p className="text-xs">e.g., "What is the capital of Pakistan?" or toggle expert mode and ask "Calculate shares for 1 widow, 2 sons, and 10 kanal of land."</p>
                            </div>
                        )}
                        {messages.map((message, index) => (
                            <div key={index} className={`flex gap-3 text-sm ${message.role === 'user' ? 'justify-end' : ''}`}>
                                {message.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <Image src="/adil.png" alt="adil munawar" width={32} height={32} className="rounded-full" />
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
                                    <Image src="/adil.png" alt="adil munawar" width={32} height={32} className="rounded-full" />
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
                        placeholder={mode === 'db' ? "Ask about inheritance partitions..." : "Ask me anything..."}
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
