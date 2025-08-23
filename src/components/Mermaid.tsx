import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  diagram: string;
  className?: string;
}

let mermaidInitialized = false;

export const Mermaid = ({ diagram, className = "" }: MermaidProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          primaryColor: 'hsl(var(--primary))',
          primaryTextColor: 'hsl(var(--primary-foreground))',
          primaryBorderColor: 'hsl(var(--border))',
          lineColor: 'hsl(var(--border))',
          secondaryColor: 'hsl(var(--secondary))',
          tertiaryColor: 'hsl(var(--muted))',
          background: 'hsl(var(--background))',
          mainBkg: 'hsl(var(--card))',
          secondBkg: 'hsl(var(--muted))',
          tertiaryBkg: 'hsl(var(--accent))',
        },
        fontFamily: 'inherit',
        fontSize: 14,
      });
      mermaidInitialized = true;
    }

    const renderDiagram = async () => {
      if (!elementRef.current) return;

      try {
        setError(null);
        const { svg } = await mermaid.render(`mermaid-${Date.now()}`, diagram);
        elementRef.current.innerHTML = svg;
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to render diagram');
      }
    };

    renderDiagram();
  }, [diagram]);

  if (error) {
    return (
      <div className={`p-4 border border-destructive rounded-lg text-destructive ${className}`}>
        <p className="text-sm">{error}</p>
        <details className="mt-2">
          <summary className="text-xs cursor-pointer">Show diagram source</summary>
          <pre className="text-xs mt-2 overflow-x-auto">{diagram}</pre>
        </details>
      </div>
    );
  }

  return (
    <div 
      ref={elementRef} 
      className={`mermaid-container overflow-x-auto ${className}`}
      style={{ minHeight: '200px' }}
    />
  );
};