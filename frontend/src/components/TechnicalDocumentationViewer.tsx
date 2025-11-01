"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { copyToClipboard } from '@/utils';

// Dynamic import to avoid SSR issues
const SyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then((mod) => mod.PrismAsync),
  { ssr: false }
);

let vscDarkPlus: any;
if (typeof window !== 'undefined') {
  import('react-syntax-highlighter/dist/esm/styles/prism').then((mod) => {
    vscDarkPlus = mod.vscDarkPlus;
  });
}

interface CodeBlock {
  language?: string;
  code: string;
}

interface ParsedDocumentation {
  sections: Array<{
    type: 'title' | 'heading' | 'paragraph' | 'code' | 'list' | 'strong' | 'subheading' | 'divider';
    content?: string | CodeBlock;
    level?: number;
    items?: string[];
  }>;
}

// Map language names for syntax highlighter
const mapLanguageForSyntaxHighlighter = (lang: string): string => {
  const langMap: { [key: string]: string } = {
    'csharp': 'csharp',
    'cs': 'csharp',
    'typescript': 'typescript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'javascript': 'javascript',
    'js': 'javascript',
    'jsx': 'javascript',
    'python': 'python',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'c++': 'cpp',
    'ruby': 'ruby',
    'rb': 'ruby',
    'go': 'go',
    'rust': 'rust',
    'rs': 'rust',
    'php': 'php',
    'swift': 'swift',
    'kotlin': 'kotlin',
    'kt': 'kotlin',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'sql': 'sql',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
  };
  return langMap[lang.toLowerCase()] || 'text';
};

// Parse markdown-like documentation into structured sections
const parseDocumentation = (content: string): ParsedDocumentation => {
  const sections: ParsedDocumentation['sections'] = [];
  const lines = content.split('\n');
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Horizontal rule (---)
    if (line.match(/^---+$/)) {
      sections.push({
        type: 'divider',
        content: '',
      });
      i++;
    }
    // Title (single #)
    else if (line.startsWith('#') && !line.startsWith('##')) {
      sections.push({
        type: 'title',
        content: line.replace(/^#+\s*/, ''),
        level: 1,
      });
      i++;
    }
    // Subheadings (### or more)
    else if (line.startsWith('###')) {
      sections.push({
        type: 'subheading',
        content: line.replace(/^###+\s*/, ''),
        level: (line.match(/^###+/) || [''])[0].length,
      });
      i++;
    }
    // Main headings (##)
    else if (line.startsWith('##')) {
      sections.push({
        type: 'heading',
        content: line.replace(/^##+\s*/, ''),
        level: (line.match(/^##+/) || [''])[0].length,
      });
      i++;
    }
    // Code blocks
    else if (line.startsWith('```')) {
      const language = line.replace(/```/g, '').trim();
      let code = '';
      i++;
      
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code += lines[i] + '\n';
        i++;
      }
      
      sections.push({
        type: 'code',
        content: {
          language: language ? mapLanguageForSyntaxHighlighter(language) : 'text',
          code: code.trim(),
        },
      });
      i++;
    }
    // Lists (- or *)
    else if (line.match(/^[-*]\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^[-*]\s+/)) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      sections.push({
        type: 'list',
        content: '',
        items,
      });
    }
    // Bold text (**text**)
    else if (line.includes('**')) {
      sections.push({
        type: 'strong',
        content: line,
      });
      i++;
    }
    // Regular paragraphs
    else if (line) {
      let paragraph = line;
      i++;
      
      // Collect subsequent non-empty lines that aren't special
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].trim().startsWith('#') &&
        !lines[i].trim().startsWith('```') &&
        !lines[i].trim().match(/^[-*]\s+/)
      ) {
        paragraph += ' ' + lines[i].trim();
        i++;
      }
      
      sections.push({
        type: 'paragraph',
        content: paragraph,
      });
    } else {
      i++;
    }
  }
  
  return { sections };
};

interface TechnicalDocumentationViewerProps {
  documentation: string;
  fileName?: string;
}

export default function TechnicalDocumentationViewer({
  documentation,
  fileName,
}: TechnicalDocumentationViewerProps) {
  const [styleLoaded, setStyleLoaded] = useState(false);
  const parsed = parseDocumentation(documentation);

  useEffect(() => {
    // Load the style
    import('react-syntax-highlighter/dist/esm/styles/prism').then((mod) => {
      vscDarkPlus = mod.vscDarkPlus;
      setStyleLoaded(true);
    });
  }, []);

  const renderContent = (content: string | CodeBlock) => {
    if (typeof content === 'string') {
      // Handle bold text
      const parts = content.split(/(\*\*.*?\*\*)/g);
      return (
        <span>
          {parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={idx} className="font-semibold text-white">
                  {part.replace(/\*\*/g, '')}
                </strong>
              );
            }
            return <span key={idx}>{part}</span>;
          })}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* {fileName && (
        <div className="mb-8 pb-4 border-b border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="text-4xl">📄</span>
            {fileName}
          </h1>
        </div>
      )} */}

      <div className="space-y-5">
        {parsed.sections.map((section, idx) => {
          switch (section.type) {
            case 'title':
              return (
                <h1
                  key={idx}
                  className="text-3xl font-bold text-white mt-6 mb-6 pb-4 border-b border-gray-700"
                >
                  {typeof section.content === 'string' ? section.content : ''}
                </h1>
              );

            case 'divider':
              return (
                <hr key={idx} className="my-6 border-gray-700" />
              );

            case 'heading':
              return (
                <h2
                  key={idx}
                  className={`font-bold text-white mt-8 mb-4 ${
                    section.level === 1 ? 'text-2xl' : 'text-xl'
                  }`}
                >
                  {typeof section.content === 'string' ? section.content : ''}
                </h2>
              );

            case 'subheading':
              return (
                <h3
                  key={idx}
                  className={`font-semibold text-white mt-6 mb-3 ${
                    section.level === 3 ? 'text-lg' : 'text-base'
                  }`}
                >
                  {typeof section.content === 'string' ? section.content : ''}
                </h3>
              );

            case 'code':
              if (section.content && typeof section.content !== 'string' && 'code' in section.content) {
                const { language, code } = section.content;
                return (
                  <div key={idx} className="relative group">
                    <button
                      onClick={() => copyToClipboard(code)}
                      className="absolute top-3 right-3 z-10 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-opacity opacity-0 group-hover:opacity-100"
                    >
                      Copy
                    </button>
                    <div className="rounded-lg overflow-hidden border border-gray-700 shadow-lg">
                      {styleLoaded && vscDarkPlus ? (
                        <SyntaxHighlighter
                          language={language || 'text'}
                          style={vscDarkPlus}
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            fontSize: '0.875rem',
                            lineHeight: '1.5',
                          }}
                          showLineNumbers={code.split('\n').length > 5}
                        >
                          {code}
                        </SyntaxHighlighter>
                      ) : (
                        <pre className="bg-gray-900 p-4 overflow-x-auto text-sm font-mono text-gray-300">
                          <code>{code}</code>
                        </pre>
                      )}
                    </div>
                  </div>
                );
              }
              return null;

            case 'list':
              return (
                <ul key={idx} className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  {section.items?.map((item, itemIdx) => (
                    <li key={itemIdx} className="leading-relaxed">
                      {renderContent(item)}
                    </li>
                  ))}
                </ul>
              );

            case 'strong':
              return (
                <p key={idx} className="text-gray-300 font-semibold leading-relaxed">
                  {typeof section.content === 'string'
                    ? renderContent(section.content)
                    : ''}
                </p>
              );

            case 'paragraph':
            default:
              return (
                <p key={idx} className="text-gray-300 leading-relaxed">
                  {typeof section.content === 'string'
                    ? renderContent(section.content)
                    : ''}
                </p>
              );
          }
        })}
      </div>
    </div>
  );
}

