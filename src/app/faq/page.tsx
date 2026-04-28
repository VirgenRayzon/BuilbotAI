"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  ChevronDown, 
  Search, 
  Cpu, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  MessageSquare,
  HelpCircle
} from "lucide-react";

const faqData = [
  {
    category: "AI & Building",
    icon: <Cpu className="w-5 h-5" />,
    questions: [
      {
        question: "How does the AI PC Builder work?",
        answer: "Our Neural PC Architect uses advanced machine learning models trained on thousands of hardware benchmarks and compatibility databases. It analyzes your performance goals, budget, and aesthetic preferences to synthesize the most optimized parts list possible, checking for bottlenecks and physical clearance in real-time."
      },
      {
        question: "What is 'Bottleneck Analysis'?",
        answer: "Bottleneck Analysis is our proprietary diagnostic tool that identifies if any single component (usually the CPU or GPU) is significantly limiting the performance of the rest of the system. We provide a percentage-based impact score to help you balance your build."
      },
      {
        question: "Can I customize the AI-generated builds?",
        answer: "Absolutely. The AI provides a 'gold standard' starting point. You can swap any component, and the AI will re-validate the entire system's compatibility and performance metrics instantly."
      }
    ]
  },
  {
    category: "Orders & Shipping",
    icon: <Truck className="w-5 h-5" />,
    questions: [
      {
        question: "How long does shipping take for pre-built systems?",
        answer: "Standard pre-built systems typically ship within 3-5 business days. Custom-commissioned 'Masterpiece' builds undergo a rigorous 48-hour stress test and quality assurance phase, usually shipping within 7-10 business days."
      },
      {
        question: "Do you ship internationally?",
        answer: "Currently, we ship to North America, Europe, and select regions in Asia. Shipping costs and import duties vary by location and will be calculated at checkout."
      },
      {
        question: "How can I track my order?",
        answer: "Once your build leaves our synthesis lab, you will receive a tracking number via email. You can also track the real-time assembly progress through your User Dashboard."
      }
    ]
  },
  {
    category: "Warranty & Support",
    icon: <ShieldCheck className="w-5 h-5" />,
    questions: [
      {
        question: "What kind of warranty do you offer?",
        answer: "All BuildbotAI systems come with a standard 2-year comprehensive warranty covering parts and labor. We also offer 'Neural Shield' extended protection plans for up to 5 years."
      },
      {
        question: "What is your return policy?",
        answer: "We offer a 30-day satisfaction guarantee. If you're not wowed by your system, you can return it for a full refund. Custom-etched or heavily modified components may be subject to a restocking fee."
      },
      {
        question: "How do I get technical support?",
        answer: "Our support matrix is available 24/7. You can reach us via the live chat on our site, through the 'Support' ticket system in your dashboard, or by emailing support@buildbot.ai."
      }
    ]
  }
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [openIndex, setOpenIndex] = React.useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  const filteredFaq = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-4 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Knowledge Base
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black font-headline uppercase tracking-tighter mb-6 italic"
          >
            Frequently Asked <span className="text-primary">Questions</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto"
          >
            Everything you need to know about the BuildbotAI ecosystem, hardware synthesis, and our neural optimization process.
          </motion.p>
        </div>

        {/* Search */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative mb-16"
        >
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search the neural database..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/30 border border-border/50 rounded-2xl py-6 pl-16 pr-6 text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 font-medium"
          />
        </motion.div>

        {/* FAQ Grid */}
        <div className="space-y-12">
          {filteredFaq.length > 0 ? (
            filteredFaq.map((cat, catIndex) => (
              <motion.div 
                key={cat.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * catIndex }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    {cat.icon}
                  </div>
                  <h2 className="text-xl font-black font-headline uppercase tracking-widest text-foreground/80">{cat.category}</h2>
                </div>

                <div className="grid gap-4">
                  {cat.questions.map((q, qIndex) => {
                    const id = `${catIndex}-${qIndex}`;
                    const isOpen = openIndex === id;

                    return (
                      <div 
                        key={id}
                        className={cn(
                          "group border border-border/50 rounded-2xl overflow-hidden transition-all duration-300",
                          isOpen ? "bg-muted/30 border-primary/30" : "hover:border-primary/20 hover:bg-muted/10"
                        )}
                      >
                        <button 
                          onClick={() => toggleAccordion(id)}
                          className="w-full text-left px-8 py-6 flex items-center justify-between gap-4"
                        >
                          <span className="text-lg font-bold group-hover:text-primary transition-colors">{q.question}</span>
                          <ChevronDown className={cn(
                            "w-5 h-5 text-muted-foreground transition-transform duration-300",
                            isOpen && "rotate-180 text-primary"
                          )} />
                        </button>
                        <motion.div
                          initial={false}
                          animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-8 pb-8 text-muted-foreground leading-relaxed font-medium border-t border-border/20 pt-4">
                            {q.answer}
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-24 opacity-50">
              <Search className="w-12 h-12 mx-auto mb-4" />
              <p className="text-xl font-bold uppercase tracking-widest">No matching data found in neural records.</p>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-24 p-12 rounded-[2rem] bg-gradient-to-br from-primary/10 via-background to-purple-500/10 border border-primary/20 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <h3 className="text-2xl md:text-3xl font-black font-headline uppercase tracking-tighter mb-4 italic">Still Have Questions?</h3>
          <p className="text-muted-foreground mb-8 font-medium">Our engineers and AI specialists are ready to assist you in real-time.</p>
          <Link href="/contact" className="inline-block bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest px-8 py-4 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
            Contact Support Team
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
