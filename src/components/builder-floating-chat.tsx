"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Send, Bot, User, MessageSquare, X, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { ComponentData } from "@/lib/types";

interface Message {
    role: 'bot' | 'user';
    text: string;
}

interface BuilderFloatingChatProps {
    build?: Record<string, ComponentData | ComponentData[] | null>;
}

export function BuilderFloatingChat({ build }: BuilderFloatingChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', text: 'Initialize sequence... Hello Architect. I am your Buildbot AI Assistant.' },
        { role: 'bot', text: 'I am monitoring your component selection. Ask me anything or let me suggest parts for your current build.' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, isTyping]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', text: userMsg }],
                    buildContext: build
                })
            });

            if (!response.ok) {
                throw new Error("Failed to communicate with AI.");
            }

            if (!response.body) return;

            // Prepare for streaming response
            setMessages(prev => [...prev, { role: 'bot', text: '' }]);
            setIsTyping(false); // Hide typing indicator because streaming starts

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                aiText += chunk;
                
                // Update the last message progressively
                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1] = { role: 'bot', text: aiText };
                    return newMsgs;
                });
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'bot', text: "Error connecting to AI Assistant." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-[350px] sm:w-[450px]"
                    >
                        <Card className="flex flex-col h-[600px] border-fuchsia-500/40 shadow-[0_10px_50px_rgba(217,70,239,0.25)] overflow-hidden bg-background/80 backdrop-blur-2xl relative border rounded-2xl">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-fuchsia-400 animate-pulse"></div>
                            
                            <CardHeader className="py-4 px-5 bg-white/5 flex flex-row items-center justify-between flex-none z-10 border-b border-white/10 shadow-sm">
                                <CardTitle className="font-headline text-md flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 font-bold tracking-tight">
                                    <BrainCircuit className="w-5 h-5 text-fuchsia-400" /> Buildbot AI Interface
                                </CardTitle>
                                <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors rounded-full">
                                    <X className="w-4 h-4" />
                                </Button>
                            </CardHeader>

                            <CardContent className="flex-1 p-0 min-h-0 relative z-0 flex flex-col overflow-hidden bg-gradient-to-b from-transparent to-black/20">
                                <ScrollArea className="flex-1 p-5" ref={scrollRef}>
                                    <div className="space-y-5 pb-6">
                                        {messages.map((msg, i) => (
                                            <motion.div 
                                                key={i} 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white' : 'bg-gradient-to-br from-fuchsia-500 to-purple-700 text-white'}`}>
                                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                                </div>
                                                <div className={`p-3.5 rounded-2xl text-sm leading-relaxed max-w-[80%] shadow-md ${
                                                    msg.role === 'user' 
                                                    ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-50 rounded-tr-sm border border-cyan-500/30' 
                                                    : 'bg-white/5 backdrop-blur-md text-fuchsia-50 rounded-tl-sm border border-fuchsia-500/20 shadow-[0_0_15px_rgba(217,70,239,0.05)]'
                                                }`}>
                                                    {msg.role === 'user' ? (
                                                        <p>{msg.text}</p>
                                                    ) : (
                                                        <div className="prose prose-invert prose-p:leading-snug prose-sm max-w-none prose-a:text-cyan-400 prose-strong:text-fuchsia-300">
                                                            <ReactMarkdown components={{
                                                                a: ({ href, children }) => {
                                                                    if (href?.startsWith('add-part:')) {
                                                                        const partName = decodeURIComponent(href.replace('add-part:', ''));
                                                                        return (
                                                                            <span className="block my-2">
                                                                                <Button 
                                                                                    variant="secondary" 
                                                                                    size="sm" 
                                                                                    className="h-8 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-none rounded-full shadow-lg shadow-cyan-500/20 text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        const event = new CustomEvent('add-suggestion', { detail: { model: partName } });
                                                                                        window.dispatchEvent(event);
                                                                                    }}
                                                                                >
                                                                                    <PlusCircle className="w-4 h-4" />
                                                                                    Add {children}
                                                                                </Button>
                                                                            </span>
                                                                        );
                                                                    }
                                                                    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                                                                }
                                                            }}>
                                                                {msg.text}
                                                            </ReactMarkdown>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}

                                        {isTyping && (
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex gap-3 flex-row"
                                            >
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg bg-gradient-to-br from-fuchsia-500 to-purple-700 text-white">
                                                    <Bot className="w-4 h-4" />
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md rounded-tl-sm border border-fuchsia-500/20 flex items-center gap-1.5 h-[42px] shadow-[0_0_15px_rgba(217,70,239,0.05)]">
                                                    <span className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                    <span className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                    <span className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>

                            <CardFooter className="p-4 bg-black/40 backdrop-blur-md flex-none border-t border-white/10 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
                                <form onSubmit={handleSendMessage} className="flex w-full gap-2 relative">
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask for advice or part recommendations..."
                                        className="bg-black/40 border-fuchsia-500/30 focus-visible:ring-fuchsia-500 focus-visible:border-fuchsia-400 text-sm pr-12 h-12 rounded-xl transition-all placeholder:text-zinc-500"
                                    />
                                    <Button 
                                        type="submit" 
                                        size="icon" 
                                        className="absolute right-1 top-1 h-10 w-10 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-lg transition-all" 
                                        disabled={!input.trim()}
                                    >
                                        <Send className="w-4 h-4 ml-0.5" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
            >
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-600 blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative h-16 w-16 rounded-full shadow-[0_0_30px_rgba(217,70,239,0.4)] bg-gradient-to-tr from-fuchsia-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 p-0 border border-white/20 z-10"
                >
                    <MessageSquare className="w-7 h-7 text-white" />
                </Button>
            </motion.div>
        </div>
    );
}
