import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const downloadProjectZip = async () => {
  const zip = new JSZip();
  
  try {
    // Get all text files from the project
    const textFiles = import.meta.glob([
      '/src/**/*',
      '/supabase/**/*',
      '/index.html',
      '/vite.config.ts',
      '/tailwind.config.ts',
      '/postcss.config.js',
      '/tsconfig*.json',
      '/package.json',
      '/components.json',
      '/README.md'
    ], { as: 'raw', eager: true });

    // Get all public assets
    const assetFiles = import.meta.glob('/public/**/*', { as: 'url', eager: true });

    // Add text files to zip
    for (const [path, content] of Object.entries(textFiles)) {
      const relativePath = path.startsWith('/') ? path.slice(1) : path;
      zip.file(relativePath, content as string);
    }

    // Add public assets to zip
    for (const [path, url] of Object.entries(assetFiles)) {
      try {
        const response = await fetch(url as string);
        if (response.ok) {
          const blob = await response.blob();
          const relativePath = path.startsWith('/') ? path.slice(1) : path;
          zip.file(relativePath, blob);
        }
      } catch (error) {
        console.warn(`Failed to fetch asset: ${path}`, error);
      }
    }

    // Generate and download the ZIP
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'trellix-shield-portal.zip');
    
    return true;
  } catch (error) {
    console.error('Failed to export project:', error);
    throw error;
  }
};

export const downloadCurrentPageHtml = () => {
  try {
    const htmlContent = document.documentElement.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    saveAs(blob, 'trellix-shield-portal-page.html');
    return true;
  } catch (error) {
    console.error('Failed to export current page:', error);
    throw error;
  }
};