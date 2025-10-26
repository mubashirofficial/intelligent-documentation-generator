'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const fullText = "Transform your codebase into intelligent, searchable documentation with our AI-powered platform. Automatically analyze, document, and understand your code like never before.";

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayText(fullText.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, fullText]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e] px-2 py-8">
      {/* Header */}
      <div className="text-center mb-8 mt-12">
        {/* MAIN HEADING */}
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          <span className="animate-gradient-text">
            Intelligent Documentation Generator
          </span>
        </h1>
        
        {/* Subheading */}
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          AI-powered documentation with automatic codebase analysis
        </p>
        
        {/* Animated Description - NO CURSOR */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="text-xl text-gray-300 mb-4 leading-relaxed min-h-[120px] flex justify-center">
            <div className="text-left">
              <span className="typewriter-text">
                {displayText}
                {/* REMOVED CURSOR ELEMENT */}
              </span>
            </div>
          </div>
          <p className="text-lg text-blue-300/80 font-light italic animate-pulse">
            From complex codebases to crystal-clear documentation — powered by advanced AI analysis.
          </p>
          
          {/* AI Chat Support Badge */}
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full animate-bounce-slow">
            <span className="text-green-400 text-sm">💬 Live AI Chat Support</span>
            <span className="w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
          </div>
        </div>

        {/* Enhanced CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 group animate-float"
          >
            <span className="group-hover:scale-110 transition-transform">✨ Launch Your Project</span>
          </button>
          <button
            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api-docs`, '_blank')}
            className="px-8 py-4 border border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/10 text-blue-300 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center gap-2 group"
          >
            <span className="group-hover:scale-105 transition-transform">📚 Explore API Docs</span>
          </button>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mb-12">
        {features.map((feature, index) => (
          <div
            key={index}
            className="feature-card glass p-6 rounded-2xl text-center hover:transform hover:scale-105 transition-all duration-300 border border-white/5 hover:border-blue-500/20 animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="text-4xl mb-4 filter drop-shadow-lg hover:scale-110 transition-transform">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold text-white mb-3 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
              {feature.title}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const features = [
  {
    icon: '🤖',
    title: 'AI-Powered Analysis',
    description: 'Advanced code parsing and intelligent summarization using cutting-edge AI models',
  },
  {
    icon: '🔍',
    title: 'Semantic Search',
    description: 'Deep understanding of code context with embeddings-based intelligent search',
  },
  {
    icon: '📚',
    title: 'Auto Documentation',
    description: 'Automatically generate and maintain comprehensive API documentation',
  },
  {
    icon: '💬',
    title: 'AI Chat Support',
    description: 'Interactive AI assistant to answer questions and explain your code in real-time',
  },
  {
    icon: '📊',
    title: 'Dependency Graphs',
    description: 'Visualize complex function relationships and call hierarchies intuitively',
  },
  {
    icon: '🔄',
    title: 'Continuous Updates',
    description: 'Real-time documentation synchronization with your evolving codebase',
  },
];