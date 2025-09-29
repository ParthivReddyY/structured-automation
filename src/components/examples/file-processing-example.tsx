/**
 * Example: Complete File Upload and Processing Component
 * Demonstrates multimodal file processing with PDF and image support
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, AlertCircle, Image as ImageIcon, FileCheck, Loader2 } from 'lucide-react';
import { 
  processFileForAI, 
  validateFileSize, 
  validateFileType, 
  formatFileSize,
  isMultimodalFile,
  getProcessingEndpoint 
} from '@/lib/file-utils';

interface ProcessingResult {
  tasks?: {
    tasks: Array<{
      id: string;
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      category: string;
      estimatedTime?: string;
      tags?: string[];
    }>;
    totalCount: number;
    categories: string[];
  };
  summary?: {
    title: string;
    summary: string;
    keyPoints: string[];
    topics: string[];
    actionItems: string[];
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  };
  metadata?: {
    documentType: string;
    dateReferences?: string[];
    people?: string[];
    organizations?: string[];
    locations?: string[];
    urls?: string[];
    urgency: 'low' | 'medium' | 'high';
  };
}

export default function FileProcessingExample() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Validate and set file
  const handleFile = (file: File) => {
    setError(null);
    setResult(null);

    // Validate file type
    const typeValidation = validateFileType(file);
    if (!typeValidation.valid) {
      setError(typeValidation.error || 'Invalid file type');
      return;
    }

    // Validate file size
    const sizeValidation = validateFileSize(file, 10);
    if (!sizeValidation.valid) {
      setError(sizeValidation.error || 'File too large');
      return;
    }

    setSelectedFile(file);
  };

  // Process the file
  const handleProcess = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Prepare file for AI processing
      const fileData = await processFileForAI(selectedFile);
      
      // Determine endpoint based on file type
      const endpoint = getProcessingEndpoint(selectedFile.type);
      
      // Prepare request body based on file type
      const requestBody = isMultimodalFile(selectedFile.type)
        ? {
            fileBase64: fileData.fileBase64,
            fileName: fileData.fileName,
            mimeType: fileData.mimeType,
            extractTasks: true,
            generateSummary: true,
            extractMetadata: true,
          }
        : {
            fileContent: fileData.fileContent,
            fileName: fileData.fileName,
            extractTasks: true,
            generateSummary: true,
            extractMetadata: true,
          };

      // Make API call
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setProcessing(false);
    }
  };

  // Get file icon based on type
  const getFileIcon = () => {
    if (!selectedFile) return <FileText className="h-12 w-12" />;
    
    if (selectedFile.type.startsWith('image/')) {
      return <ImageIcon className="h-12 w-12 text-purple-500" />;
    } else if (selectedFile.type === 'application/pdf') {
      return <FileText className="h-12 w-12 text-red-500" />;
    } else {
      return <FileText className="h-12 w-12 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Multimodal File Processing
          </CardTitle>
          <CardDescription>
            Upload PDFs, images, or text files for AI-powered analysis with OCR support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            {selectedFile ? (
              <div className="space-y-4">
                {getFileIcon()}
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>
                  {isMultimodalFile(selectedFile.type) && (
                    <Badge variant="secondary" className="mt-2">
                      <FileCheck className="h-3 w-3 mr-1" />
                      Multimodal Processing
                    </Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                  Remove File
                </Button>
              </div>
            ) : (
              <>
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop files here or click to browse
                </p>
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer" type="button" asChild>
                    <span>Choose Files</span>
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".txt,.pdf,.docx,image/*"
                />
              </>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Process Button */}
          <Button 
            onClick={handleProcess} 
            disabled={!selectedFile || processing}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileCheck className="mr-2 h-4 w-4" />
                Process File
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Supported: PDF (with OCR), Images (PNG, JPEG, WebP with OCR), TXT, DOCX • Max 10MB
          </p>
        </CardContent>
      </Card>

      {/* Results Display */}
      {result && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Tasks */}
          {result.tasks && (
            <Card>
              <CardHeader>
                <CardTitle>Extracted Tasks ({result.tasks.totalCount})</CardTitle>
                <CardDescription>Action items identified in the document</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.tasks.tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <Badge 
                        variant={
                          task.priority === 'urgent' ? 'destructive' :
                          task.priority === 'high' ? 'default' :
                          'secondary'
                        }
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {task.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {result.summary && (
            <Card>
              <CardHeader>
                <CardTitle>{result.summary.title}</CardTitle>
                <CardDescription>AI-generated summary and insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Summary</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.summary.summary}
                  </p>
                </div>
                
                <div>
                  <Label className="text-xs">Key Points</Label>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    {result.summary.keyPoints.map((point, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{point}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <Label className="text-xs">Sentiment</Label>
                  <Badge variant="outline">{result.summary.sentiment}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {result.metadata && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Document Metadata</CardTitle>
                <CardDescription>Extracted information and references</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="text-xs">Document Type</Label>
                    <p className="text-sm font-medium mt-1">{result.metadata.documentType}</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Urgency Level</Label>
                    <Badge 
                      variant={
                        result.metadata.urgency === 'high' ? 'destructive' :
                        result.metadata.urgency === 'medium' ? 'default' :
                        'secondary'
                      }
                      className="mt-1"
                    >
                      {result.metadata.urgency}
                    </Badge>
                  </div>

                  {result.metadata.people && result.metadata.people.length > 0 && (
                    <div>
                      <Label className="text-xs">People Mentioned</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {result.metadata.people.join(', ')}
                      </p>
                    </div>
                  )}

                  {result.metadata.organizations && result.metadata.organizations.length > 0 && (
                    <div>
                      <Label className="text-xs">Organizations</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {result.metadata.organizations.join(', ')}
                      </p>
                    </div>
                  )}

                  {result.metadata.dateReferences && result.metadata.dateReferences.length > 0 && (
                    <div>
                      <Label className="text-xs">Date References</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {result.metadata.dateReferences.join(', ')}
                      </p>
                    </div>
                  )}

                  {result.metadata.locations && result.metadata.locations.length > 0 && (
                    <div>
                      <Label className="text-xs">Locations</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {result.metadata.locations.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
