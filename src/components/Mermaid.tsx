import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, Copy, Palette } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';

interface MermaidProps {
  diagram: string;
  className?: string;
  title?: string;
}

let mermaidInitialized = false;

type Theme = 'modern' | 'minimal' | 'contrast';

const themes: Record<Theme, any> = {
  minimal: {
    theme: 'base',
    themeVariables: {
      primaryColor: 'hsl(210, 40%, 98%)',
      primaryTextColor: 'hsl(222, 84%, 5%)',
      primaryBorderColor: 'hsl(214, 32%, 91%)',
      lineColor: 'hsl(214, 32%, 91%)',
      secondaryColor: 'hsl(210, 40%, 96%)',
      tertiaryColor: 'hsl(210, 40%, 94%)',
      background: 'hsl(0, 0%, 100%)',
      mainBkg: 'hsl(210, 40%, 98%)',
      secondBkg: 'hsl(210, 40%, 96%)',
      tertiaryBkg: 'hsl(210, 40%, 94%)',
      fontSize: 18,
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    }
  },
  modern: {
    theme: 'base',
    themeVariables: {
      primaryColor: 'hsl(217, 91%, 60%)',
      primaryTextColor: 'hsl(0, 0%, 100%)',
      primaryBorderColor: 'hsl(217, 33%, 17%)',
      lineColor: 'hsl(217, 33%, 17%)',
      secondaryColor: 'hsl(217, 19%, 27%)',
      tertiaryColor: 'hsl(217, 19%, 35%)',
      background: 'hsl(224, 71%, 4%)',
      mainBkg: 'hsl(217, 33%, 17%)',
      secondBkg: 'hsl(217, 19%, 27%)',
      tertiaryBkg: 'hsl(217, 91%, 60%)',
      nodeBorder: 'hsl(217, 91%, 60%)',
      clusterBkg: 'hsl(217, 19%, 27%)',
      clusterBorder: 'hsl(217, 91%, 60%)',
      defaultLinkColor: 'hsl(217, 91%, 60%)',
      titleColor: 'hsl(0, 0%, 100%)',
      edgeLabelBackground: 'hsl(217, 33%, 17%)',
      actorBorder: 'hsl(217, 91%, 60%)',
      actorBkg: 'hsl(217, 33%, 17%)',
      actorTextColor: 'hsl(0, 0%, 100%)',
      actorLineColor: 'hsl(217, 91%, 60%)',
      signalColor: 'hsl(0, 0%, 100%)',
      signalTextColor: 'hsl(0, 0%, 100%)',
      labelBoxBkgColor: 'hsl(217, 33%, 17%)',
      labelBoxBorderColor: 'hsl(217, 91%, 60%)',
      labelTextColor: 'hsl(0, 0%, 100%)',
      errorBkgColor: 'hsl(0, 84%, 60%)',
      errorTextColor: 'hsl(0, 0%, 100%)',
      fontSize: 18,
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    }
  },
  contrast: {
    theme: 'base',
    themeVariables: {
      primaryColor: 'hsl(47, 100%, 50%)',
      primaryTextColor: 'hsl(0, 0%, 0%)',
      primaryBorderColor: 'hsl(0, 0%, 0%)',
      lineColor: 'hsl(0, 0%, 0%)',
      secondaryColor: 'hsl(0, 0%, 100%)',
      tertiaryColor: 'hsl(0, 0%, 90%)',
      background: 'hsl(0, 0%, 100%)',
      mainBkg: 'hsl(0, 0%, 100%)',
      secondBkg: 'hsl(0, 0%, 95%)',
      tertiaryBkg: 'hsl(47, 100%, 50%)',
      fontSize: 20,
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    }
  }
};

export const Mermaid = ({ diagram, className = "", title }: MermaidProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<Theme>('minimal');
  const [svgContent, setSvgContent] = useState<string>('');
  const { toast } = useToast();

  const reinitializeMermaid = (theme: Theme) => {
    mermaidInitialized = false;
    mermaid.initialize({
      startOnLoad: false,
      ...themes[theme],
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontSize: 18,
      flowchart: {
        curve: 'basis',
        nodeSpacing: 60,
        rankSpacing: 80,
        padding: 30,
        useMaxWidth: true,
      },
      sequence: {
        actorMargin: 60,
        width: 180,
        height: 80,
        boxMargin: 15,
        boxTextMargin: 8,
        noteMargin: 15,
        messageMargin: 45,
        mirrorActors: true,
        bottomMarginAdj: 1,
        useMaxWidth: true,
      },
      er: {
        diagramPadding: 30,
        layoutDirection: 'TB',
        minEntityWidth: 120,
        minEntityHeight: 90,
        entityPadding: 20,
        stroke: 'gray',
        fill: 'honeydew',
        fontSize: 16,
        useMaxWidth: true,
      }
    });
    mermaidInitialized = true;
  };

  useEffect(() => {
    if (!mermaidInitialized) {
      reinitializeMermaid(currentTheme);
    }

    const renderDiagram = async () => {
      if (!elementRef.current) return;

      try {
        setError(null);
        const { svg } = await mermaid.render(`mermaid-${Date.now()}`, diagram);
        elementRef.current.innerHTML = svg;
        setSvgContent(svg);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to render diagram');
      }
    };

    renderDiagram();
  }, [diagram, currentTheme]);

  const downloadSVG = () => {
    if (!svgContent) return;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'diagram'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "SVG diagram saved successfully",
    });
  };

  const downloadPNG = (resolution = 2) => {
    if (!elementRef.current) return;

    const svgElement = elementRef.current.querySelector('svg');
    if (!svgElement) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width * resolution;
      canvas.height = img.height * resolution;
      
      // White background for better readability
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(resolution, resolution);
        ctx.drawImage(img, 0, 0);
      }
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${title || 'diagram'}-${resolution}x.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast({
            title: "Downloaded",
            description: `PNG diagram saved successfully (${resolution}x resolution)`,
          });
        }
      }, 'image/png');
    };

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  };

  const openPrintView = () => {
    if (!svgContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title || 'System Diagram'}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: Inter, sans-serif;
              background: white;
            }
            .diagram-container { 
              text-align: center; 
              page-break-inside: avoid;
            }
            h1 { 
              margin-bottom: 20px; 
              color: #1f2937;
              font-size: 24px;
            }
            svg { 
              max-width: 100%; 
              height: auto; 
              background: white;
            }
            @media print {
              body { margin: 0; padding: 10mm; }
              .diagram-container { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="diagram-container">
            <h1>${title || 'System Diagram'}</h1>
            ${svgContent}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    toast({
      title: "Print View Opened",
      description: "Diagram opened in new window for printing or PDF export",
    });
  };

  const copySVG = async () => {
    if (!svgContent) return;
    
    try {
      await navigator.clipboard.writeText(svgContent);
      toast({
        title: "Copied",
        description: "SVG code copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy SVG to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    reinitializeMermaid(theme);
  };

  if (error) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-destructive">Diagram Error</h3>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive mb-4">{error}</p>
          <details className="mt-2">
            <summary className="text-xs cursor-pointer hover:text-primary transition-colors">Show diagram source</summary>
            <pre className="text-xs mt-2 p-3 bg-muted rounded-md overflow-x-auto">{diagram}</pre>
          </details>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title || 'System Diagram'}</h3>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Palette className="h-4 w-4" />
                  <span className="capitalize">{currentTheme}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleThemeChange('minimal')}>
                  Minimal (Light) - Default
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange('modern')}>
                  Modern (Dark)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange('contrast')}>
                  High Contrast
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={downloadSVG}>
                  Download as SVG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadPNG(2)}>
                  Download PNG (2x)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadPNG(3)}>
                  Download PNG (3x)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={openPrintView}>
                  Print View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copySVG}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy SVG Code
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={elementRef} 
          className="mermaid-container overflow-x-auto rounded-lg border bg-background/50 p-6 min-h-[300px] flex items-center justify-center"
          style={{ minHeight: '300px' }}
        />
      </CardContent>
    </Card>
  );
};