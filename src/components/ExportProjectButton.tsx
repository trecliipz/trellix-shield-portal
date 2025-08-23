import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const ExportProjectButton = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportZip = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      // Lazy load the export utility
      const { downloadProjectZip } = await import("@/utils/exportProject");
      await downloadProjectZip();
      
      toast({
        title: "Export successful",
        description: "Project ZIP file has been downloaded.",
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: "Failed to export project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportHtml = async () => {
    try {
      const { downloadCurrentPageHtml } = await import("@/utils/exportProject");
      downloadCurrentPageHtml();
      
      toast({
        title: "Export successful",
        description: "Current page HTML has been downloaded.",
      });
    } catch (error) {
      console.error("HTML export failed:", error);
      toast({
        title: "Export failed",
        description: "Failed to export current page. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={isExporting}
          className="hidden sm:flex"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Download Code
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleExportZip} disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          Complete Project (ZIP)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportHtml}>
          <Download className="h-4 w-4 mr-2" />
          Current Page (HTML)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};