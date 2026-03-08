"use client";

import { motion } from "framer-motion";
import {
  Mic,
  Box,
  Globe,
  Lightbulb,
  Printer,
  Shield,
  Zap,
  ArrowRight,
  Download,
  Check,
  Github,
  ChevronDown,
} from "lucide-react";

const FEATURES = [
  {
    icon: Mic,
    title: "Voice Chat",
    desc: "Natural voice conversations powered by Gemini Live. Talk to your AI like a real assistant.",
    color: "teal",
  },
  {
    icon: Box,
    title: "CAD Generation",
    desc: "Describe what you want and get 3D models instantly. Iterate with voice commands.",
    color: "violet",
  },
  {
    icon: Globe,
    title: "Web Agent",
    desc: "Automate browser tasks. Your AI navigates, fills forms, and extracts data for you.",
    color: "blue",
  },
  {
    icon: Lightbulb,
    title: "Smart Home",
    desc: "Control Kasa smart devices with your voice. Lights, plugs, and more.",
    color: "yellow",
  },
  {
    icon: Printer,
    title: "3D Printing",
    desc: "Design to print in one flow. Slice and send to your printer directly.",
    color: "green",
  },
  {
    icon: Shield,
    title: "Face Auth",
    desc: "Optional face recognition lock. Your assistant knows who you are.",
    color: "pink",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "",
    features: [
      "30 min voice chat / day",
      "Text chat unlimited",
      "File operations",
      "Project management",
    ],
    cta: "Download Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$20",
    period: "/month",
    features: [
      "Unlimited voice chat",
      "CAD generation & iteration",
      "Web agent automation",
      "Smart home control",
      "3D printer integration",
      "Priority support",
    ],
    cta: "Get Pro",
    popular: true,
  },
  {
    name: "Business",
    price: "$50",
    period: "/month",
    features: [
      "Everything in Pro",
      "API access",
      "Team management",
      "Priority support",
      "Custom AI name",
      "Advanced analytics",
    ],
    cta: "Contact Us",
    popular: false,
  },
];

const colorMap: Record<string, string> = {
  teal: "from-teal-500 to-teal-400",
  violet: "from-violet-500 to-violet-400",
  blue: "from-blue-500 to-blue-400",
  yellow: "from-yellow-500 to-yellow-400",
  green: "from-green-500 to-green-400",
  pink: "from-pink-500 to-pink-400",
};

const iconBgMap: Record<string, string> = {
  teal: "bg-teal-500/10 border-teal-500/20",
  violet: "bg-violet-500/10 border-violet-500/20",
  blue: "bg-blue-500/10 border-blue-500/20",
  yellow: "bg-yellow-500/10 border-yellow-500/20",
  green: "bg-green-500/10 border-green-500/20",
  pink: "bg-pink-500/10 border-pink-500/20",
};

const iconColorMap: Record<string, string> = {
  teal: "text-teal-400",
  violet: "text-violet-400",
  blue: "text-blue-400",
  yellow: "text-yellow-400",
  green: "text-green-400",
  pink: "text-pink-400",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center">
              <span className="text-sm font-bold text-white">D</span>
            </div>
            <span className="text-lg font-semibold bg-gradient-to-r from-teal-300 to-violet-400 bg-clip-text text-transparent">
              Dvirious
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#download" className="hover:text-white transition-colors">
              Download
            </a>
          </div>
          <a
            href="#download"
            className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-teal-500 to-violet-500 text-white hover:from-teal-400 hover:to-violet-400 transition-all hover:shadow-[0_0_20px_rgba(94,234,212,0.2)]"
          >
            Download
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-950/30 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-950/20 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[150px]" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 mb-8">
              <Zap size={12} className="text-teal-400" />
              Powered by Gemini Live API
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
              Your AI assistant
              <br />
              <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-violet-400 bg-clip-text text-transparent">
                for everything
              </span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Voice chat, CAD generation, web automation, smart home control,
              and 3D printing — all in one desktop app.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#download"
                className="group flex items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-semibold bg-gradient-to-r from-teal-500 to-violet-500 text-white hover:from-teal-400 hover:to-violet-400 transition-all hover:shadow-[0_0_40px_rgba(94,234,212,0.2)]"
              >
                <Download size={18} />
                Download for Free
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </a>
              <a
                href="https://github.com/noammarom609/Dvirius"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-base font-medium bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <Github size={18} />
                View on GitHub
              </a>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <ChevronDown size={24} className="text-gray-600" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold">
              Everything you need,{" "}
              <span className="bg-gradient-to-r from-teal-300 to-violet-400 bg-clip-text text-transparent">
                one app
              </span>
            </h2>
            <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
              Dvirious combines voice AI with powerful tools for creators,
              engineers, and makers.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${iconBgMap[f.color]} border flex items-center justify-center mb-4`}
                >
                  <f.icon size={22} className={iconColorMap[f.color]} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-violet-950/20 via-transparent to-transparent" />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold">
              Simple{" "}
              <span className="bg-gradient-to-r from-teal-300 to-violet-400 bg-clip-text text-transparent">
                pricing
              </span>
            </h2>
            <p className="mt-4 text-gray-500 text-lg">
              Start free. Upgrade when you need more.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-8 rounded-2xl border transition-all ${
                  plan.popular
                    ? "bg-gradient-to-b from-teal-500/5 to-violet-500/5 border-teal-500/30 shadow-[0_0_40px_rgba(94,234,212,0.06)]"
                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-teal-500 to-violet-500 text-white">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    {plan.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-center gap-2.5 text-sm text-gray-400"
                    >
                      <Check size={14} className="text-teal-400 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <a
                  href="#download"
                  className={`block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                    plan.popular
                      ? "bg-gradient-to-r from-teal-500 to-violet-500 text-white hover:from-teal-400 hover:to-violet-400 hover:shadow-[0_0_20px_rgba(94,234,212,0.2)]"
                      : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  {plan.cta}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Download / CTA */}
      <section id="download" className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-950/20 via-transparent to-transparent" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to get started?
            </h2>
            <p className="text-gray-500 text-lg mb-10">
              Download Dvirious for free and experience the future of AI
              assistants.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://github.com/noammarom609/Dvirius/releases/latest"
                className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold bg-gradient-to-r from-teal-500 to-violet-500 text-white hover:from-teal-400 hover:to-violet-400 transition-all hover:shadow-[0_0_40px_rgba(94,234,212,0.2)]"
              >
                <Download size={20} />
                Download for Windows
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </a>
            </div>

            <p className="mt-6 text-xs text-gray-600">
              Also available for macOS and Linux.
              <br />
              Free plan includes 30 minutes of voice chat per day.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">D</span>
            </div>
            <span className="text-sm text-gray-500">
              Dvirious &copy; {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <a
              href="https://github.com/noammarom609/Dvirius"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-400 transition-colors"
            >
              GitHub
            </a>
            <a href="#pricing" className="hover:text-gray-400 transition-colors">
              Pricing
            </a>
            <a href="#features" className="hover:text-gray-400 transition-colors">
              Features
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
