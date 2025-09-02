import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileImage, Download, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ConversionFile {
  id: string;
  file: File;
  inputFormat: string;
  outputFormat: string;
  status: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  downloadUrl?: string;
  error?: string;
}

interface FileConverterProps {
  userId: string;
  userPlan: string;
}

export const FileConverter: React.FC<FileConverterProps> = ({ userId, userPlan }) => {
  const [files, setFiles] = useState<ConversionFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);

  // Supported formats by plan
  const supportedFormats = {
    starter: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    professional: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'svg', 'pdf']
  };

  const getFileFormat = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const canConvertFormat = (format: string): boolean => {
    const planFormats = supportedFormats[userPlan as keyof typeof supportedFormats] || supportedFormats.starter;
    return planFormats.includes(format);
  };

  // Initialize Web Worker for file conversion
  const initializeWorker = useCallback(() => {
    if (!workerRef.current) {
      // Create a blob worker for local file conversion
      const workerCode = `
        // Import canvas and image processing libraries
        importScripts('https://cdn.jsdelivr.net/npm/canvas-free@2.12.1/lib/canvas.min.js');
        
        self.onmessage = async function(e) {
          const { file, outputFormat, id } = e.data;
          
          try {
            // Update progress
            self.postMessage({ type: 'progress', id, progress: 10 });
            
            // Create image from file
            const arrayBuffer = await file.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: file.type });
            const imageUrl = URL.createObjectURL(blob);
            
            self.postMessage({ type: 'progress', id, progress: 30 });
            
            // Create image element
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            const imageLoadPromise = new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
            
            img.src = imageUrl;
            await imageLoadPromise;
            
            self.postMessage({ type: 'progress', id, progress: 50 });
            
            // Create canvas
            const canvas = new OffscreenCanvas(img.width, img.height);
            const ctx = canvas.getContext('2d');
            
            // Draw image on canvas
            ctx.drawImage(img, 0, 0);
            
            self.postMessage({ type: 'progress', id, progress: 70 });
            
            // Convert to desired format
            let quality = 0.9;
            let mimeType = 'image/jpeg';
            
            switch(outputFormat.toLowerCase()) {
              case 'png':
                mimeType = 'image/png';
                break;
              case 'webp':
                mimeType = 'image/webp';
                break;
              case 'gif':
                mimeType = 'image/gif';
                break;
              default:
                mimeType = 'image/jpeg';
            }
            
            const convertedBlob = await canvas.convertToBlob({
              type: mimeType,
              quality: quality
            });
            
            self.postMessage({ type: 'progress', id, progress: 90 });
            
            // Create download URL
            const downloadUrl = URL.createObjectURL(convertedBlob);
            
            self.postMessage({ 
              type: 'complete', 
              id, 
              downloadUrl,
              progress: 100 
            });
            
            // Cleanup
            URL.revokeObjectURL(imageUrl);
            
          } catch (error) {
            self.postMessage({ 
              type: 'error', 
              id, 
              error: error.message 
            });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      workerRef.current = new Worker(URL.createObjectURL(blob));

      workerRef.current.onmessage = (e) => {
        const { type, id, progress, downloadUrl, error } = e.data;
        
        setFiles(prev => prev.map(file => {
          if (file.id === id) {
            switch (type) {
              case 'progress':
                return { ...file, progress };
              case 'complete':
                return { 
                  ...file, 
                  status: 'completed', 
                  progress: 100, 
                  downloadUrl 
                };
              case 'error':
                return { 
                  ...file, 
                  status: 'error', 
                  error 
                };
              default:
                return file;
            }
          }
          return file;
        }));
      };
    }
  }, []);

  const checkConversionLimits = async (fileSize: number, format: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('can_user_convert', {
        p_user_id: userId,
        p_file_size_mb: Math.round(fileSize / (1024 * 1024)),
        p_format: format
      });

      if (error) {
        console.error('Error checking limits:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error checking conversion limits:', error);
      return false;
    }
  };

  const logConversion = async (file: ConversionFile) => {
    try {
      await supabase.from('conversion_logs').insert({
        user_id: userId,
        original_filename: file.file.name,
        file_size: file.file.size,
        input_format: file.inputFormat,
        output_format: file.outputFormat,
        conversion_type: 'image',
        status: 'processing'
      });
    } catch (error) {
      console.error('Error logging conversion:', error);
    }
  };

  const handleFiles = async (fileList: FileList) => {
    const newFiles: ConversionFile[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const inputFormat = getFileFormat(file.name);
      
      // Check if format is supported
      if (!canConvertFormat(inputFormat)) {
        toast.error(`${file.name}: Format not supported for your plan`);
        continue;
      }

      // Check conversion limits
      const canConvert = await checkConversionLimits(file.size, inputFormat);
      if (!canConvert) {
        toast.error(`${file.name}: Conversion limit reached or file too large`);
        continue;
      }

      const conversionFile: ConversionFile = {
        id: `${Date.now()}-${i}`,
        file,
        inputFormat,
        outputFormat: inputFormat === 'png' ? 'jpg' : 'png', // Default conversion
        status: 'idle',
        progress: 0
      };
      
      newFiles.push(conversionFile);
    }
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const convertFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'converting', progress: 0 } : f
    ));

    // Log conversion start
    await logConversion(file);

    // Initialize worker if needed
    initializeWorker();

    // Start conversion
    workerRef.current?.postMessage({
      file: file.file,
      outputFormat: file.outputFormat,
      id: fileId
    });
  };

  const convertAll = () => {
    files.filter(f => f.status === 'idle').forEach(file => {
      convertFile(file.id);
    });
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const downloadFile = (file: ConversionFile) => {
    if (file.downloadUrl) {
      const link = document.createElement('a');
      link.href = file.downloadUrl;
      link.download = `${file.file.name.split('.')[0]}.${file.outputFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const changeOutputFormat = (fileId: string, newFormat: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, outputFormat: newFormat } : f
    ));
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Drop files here or click to upload</h3>
          <p className="text-muted-foreground mb-4">
            Supports: {supportedFormats[userPlan as keyof typeof supportedFormats]?.join(', ')}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
          >
            Select Files
          </Button>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Files to Convert</CardTitle>
              <Button 
                onClick={convertAll}
                disabled={!files.some(f => f.status === 'idle')}
                size="sm"
              >
                Convert All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {files.map((file) => (
              <div key={file.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <FileImage className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{file.file.name}</span>
                    <Badge variant="outline">{file.inputFormat.toUpperCase()}</Badge>
                    <span className="text-muted-foreground">→</span>
                    <select
                      value={file.outputFormat}
                      onChange={(e) => changeOutputFormat(file.id, e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                      disabled={file.status !== 'idle'}
                    >
                      {supportedFormats[userPlan as keyof typeof supportedFormats]?.map(format => (
                        <option key={format} value={format}>{format.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {file.status === 'completed' && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    
                    {file.status === 'completed' && (
                      <Button
                        size="sm"
                        onClick={() => downloadFile(file)}
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                    
                    {file.status === 'idle' && (
                      <Button
                        size="sm"
                        onClick={() => convertFile(file.id)}
                      >
                        Convert
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {file.status === 'converting' && (
                  <Progress value={file.progress} className="w-full" />
                )}
                
                {file.status === 'error' && (
                  <div className="text-sm text-red-500 mt-2">
                    Error: {file.error}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};