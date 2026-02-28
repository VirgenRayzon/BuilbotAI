"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Send, Bot, User, MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function BuilderFloatingChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'bot' | 'user', text: string }[]>([
        { role: 'bot', text: 'Initialize sequence... Hello Architect. I am your Buildbot AI Assistant.' },
        { role: 'bot', text: 'I am monitoring your component selection. Ask me anything or let me suggest parts for your current build.' }
    ]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setMessages(prev => [...prev, { role: 'user', text: input }]);
        const userMsg = input;
        setInput('');

        // Mock AI response
        setTimeout(() => {
            let reply = "Processing your request... I will pull data from the inventory shortly.";
            if (userMsg.toLowerCase().includes('suggest') || userMsg.toLowerCase().includes('recommend')) {
                reply = "Scanning database for optimal pairings... I suggest adding the ADATA Legend 960 1TB NVMe for blazing fast storage.";

                // Add a simulated suggestion button functionality
                setTimeout(() => {
                    if ((window as any).__BOT_ADD_PART__) {
                        (window as any).__BOT_ADD_PART__("ADATA Legend 960 1TB NVMe SSD");
                    }
                }, 1500);
            }
            setMessages(prev => [...prev, { role: 'bot', text: reply }]);
        }, 800);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-[350px] sm:w-[400px]"
                    >
                        <Card className="flex flex-col h-[500px] border-fuchsia-500/30 shadow-[0_10px_40px_rgba(217,70,239,0.2)] overflow-hidden bg-[#111114]/95 backdrop-blur-xl relative border">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-fuchsia-500"></div>
                            <CardHeader className="py-3 px-4 bg-white/5 flex flex-row items-center justify-between flex-none z-10">
                                <CardTitle className="font-headline text-sm flex items-center gap-2 text-fuchsia-400">
                                    <BrainCircuit className="w-4 h-4" /> Buildbot AI Interface
                                </CardTitle>
                                <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10">
                                    <X className="w-4 h-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 min-h-0 relative z-0 flex flex-col overflow-hidden">
                                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                                    <div className="space-y-4 pb-4">
                                        {messages.map((msg, i) => (
                                            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-fuchsia-500/20 text-fuchsia-400'}`}>
                                                    {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                                </div>
                                                <div className={`p-2.5 rounded-lg text-xs leading-relaxed max-w-[85%] ${msg.role === 'user' ? 'bg-cyan-500/10 text-cyan-100 rounded-tr-none border border-cyan-500/20' : 'bg-fuchsia-500/10 text-fuchsia-100 rounded-tl-none border border-fuchsia-500/20'}`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                            <CardFooter className="p-3 bg-white/5 flex-none border-t border-white/5">
                                <form onSubmit={handleSendMessage} className="flex w-full gap-2 relative">
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask the AI for advice..."
                                        className="bg-black/50 border-fuchsia-500/30 focus-visible:ring-fuchsia-500 text-xs pr-8 h-10"
                                    />
                                    <Button type="submit" size="icon" variant="ghost" className="absolute right-0 top-0 h-full text-fuchsia-400 hover:text-fuchsia-300 hover:bg-transparent" disabled={!input.trim()}>
                                        <Send className="w-4 h-4" />
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
            >
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-14 w-14 rounded-full shadow-[0_0_20px_rgba(217,70,239,0.3)] bg-gradient-to-tr from-fuchsia-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 p-0 border border-white/10"
                >
                    <MessageSquare className="w-6 h-6 text-white" />
                </Button>
            </motion.div>
        </div>
    );
}
