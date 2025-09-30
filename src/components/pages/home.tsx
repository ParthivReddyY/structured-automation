'use client';

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Clock, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { 
  processFileForAI, 
  validateFileSize, 
  validateFileType, 
  formatFileSize,
  isMultimodalFile,
  getProcessingEndpoint 
} from '@/lib/file-utils';
import type { TaskDocument, DocumentModel } from '@/lib/models';

export default function HomePage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [textInput, setTextInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // State for fetched data
  const [recentTasks, setRecentTasks] = useState<TaskDocument[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<DocumentModel[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch recent data on component mount
  useEffect(() => {
    fetchRecentData();
  }, []);

  const fetchRecentData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch recent tasks
      const tasksResponse = await fetch('/api/tasks?limit=5&status=pending');
      const tasksData = await tasksResponse.json();
      if (tasksData.success) {
        setRecentTasks(tasksData.data.tasks);
      }

      // Fetch recent documents
      const docsResponse = await fetch('/api/documents?limit=5');
      const docsData = await docsResponse.json();
      if (docsData.success) {
        setRecentDocuments(docsData.data.documents);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoadingData(false);
    }
  };

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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  // Validate and set files
  const handleFiles = (files: File[]) => {
    setError(null);
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Validate file type
      const typeValidation = validateFileType(file);
      if (!typeValidation.valid) {
        errors.push(`${file.name}: ${typeValidation.error || 'Invalid file type'}`);
        continue;
      }

      // Validate file size
      const sizeValidation = validateFileSize(file, 10);
      if (!sizeValidation.valid) {
        errors.push(`${file.name}: ${sizeValidation.error || 'File too large'}`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      setError(errors.join('; '));
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  // Remove a specific file from the list
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Click handler for upload area
  const handleUploadAreaClick = () => {
    document.getElementById('file-upload-home')?.click();
  };

  // Process all selected files
  const handleProcessFiles = async () => {
    if (selectedFiles.length === 0) return;

    setProcessing(true);
    setError(null);

    try {
      const results = [];
      const errors = [];

      for (const file of selectedFiles) {
        try {
          const fileData = await processFileForAI(file);
          const endpoint = getProcessingEndpoint(file.type);
          
          const requestBody = isMultimodalFile(file.type)
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

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });

          const data = await response.json();

          if (!data.success) {
            errors.push(`${file.name}: ${data.error || 'Processing failed'}`);
          } else {
            results.push({ file: file.name, data });
          }
        } catch (err) {
          errors.push(`${file.name}: ${err instanceof Error ? err.message : 'Processing failed'}`);
        }
      }

      // Show results
      if (errors.length > 0) {
        setError(`Some files failed: ${errors.join('; ')}`);
      }
      
      if (results.length > 0) {
        console.log('Processing successful for:', results);
        setSelectedFiles([]);
      }
      
      // Refresh data after processing
      fetchRecentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process files');
    } finally {
      setProcessing(false);
    }
  };

  // Process text
  const handleProcessText = async () => {
    if (!textInput.trim()) {
      setError('Please enter some text');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/process-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textInput,
          extractTasks: true,
          generateSummary: true,
          extractMetadata: true,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      console.log('Processing successful:', data);
      setTextInput("");
      
      // Refresh data after processing
      fetchRecentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process text');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Intelligent Data-to-Action System</h2>
        <p className="text-muted-foreground text-lg">
          Transform unstructured documents into actionable insights with AI-powered processing.
        </p>
      </div>
      
      {/* Tabbed Processing Interface */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Document Processing</CardTitle>
          <CardDescription className="text-base">
            Upload files or paste text to extract tasks, summaries, and metadata
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                File Upload
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text Input
              </TabsTrigger>
            </TabsList>
            
            {/* File Upload Tab */}
            <TabsContent value="file" className="space-y-6 mt-6">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={selectedFiles.length === 0 ? handleUploadAreaClick : undefined}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                } ${selectedFiles.length === 0 ? 'cursor-pointer' : ''}`}
              >
                {selectedFiles.length > 0 ? (
                  <div className="space-y-4">
                    <FileText className="h-12 w-12 mx-auto text-primary" />
                    <div className="space-y-2">
                      <p className="font-medium">
                        {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-2">
                            <span className="truncate flex-1 text-left">
                              {file.name} ({formatFileSize(file.size)})
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                              }}
                              disabled={processing}
                              className="h-6 w-6 p-0 ml-2"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total: {formatFileSize(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
                      </p>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        onClick={handleProcessFiles} 
                        disabled={processing}
                        size="default"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Process ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="default" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFiles([]);
                        }}
                        disabled={processing}
                      >
                        Clear All
                      </Button>
                      <Button 
                        variant="outline" 
                        size="default" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUploadAreaClick();
                        }}
                        disabled={processing}
                      >
                        Add More
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-base font-medium mb-2">Upload Documents</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Click here or drag and drop multiple files
                      </p>
                      <Label htmlFor="file-upload-home" className="sr-only">Upload Documents</Label>
                      <input
                        id="file-upload-home"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".txt,.pdf,.docx,image/*"
                        title="Upload files"
                        aria-label="Upload files"
                      />
                  </>
                )}
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              <div className="text-xs text-muted-foreground text-center">
                Supported formats: PDF, DOCX, TXT, Images (PNG, JPEG, WebP, HEIC) • Max 10MB per file
              </div>
            </TabsContent>
            
            {/* Text Input Tab */}
            <TabsContent value="text" className="space-y-6 mt-6">
              <div className="grid w-full gap-4">
                <Label htmlFor="notes" className="text-base font-medium">Paste Your Content</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Paste meeting notes, emails, project requirements, or any unstructured text here for AI-powered analysis..."
                  className="min-h-[200px] resize-y"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={processing}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              <Button 
                className="w-full font-medium"
                size="lg"
                onClick={handleProcessText}
                disabled={processing || !textInput.trim()}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Text...
                  </>
                ) : (
                  'Process Text'
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Processing Status */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            Recent Documents
          </CardTitle>
          <CardDescription className="text-base">
            Recently processed documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentDocuments.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No documents processed yet. Upload a file or enter text to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {recentDocuments.map((doc) => (
                <div 
                  key={doc._id?.toString()} 
                  className={`flex items-center justify-between p-4 border rounded-xl ${
                    doc.processingStatus === 'completed' 
                      ? 'bg-green-50 dark:bg-green-950/20' 
                      : doc.processingStatus === 'processing'
                      ? 'bg-blue-50 dark:bg-blue-950/20'
                      : 'bg-gray-50 dark:bg-gray-950/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {doc.processingStatus === 'completed' ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    <div>
                      <p className="font-medium">{doc.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleString()} • {doc.extractedTaskIds.length} tasks
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={doc.processingStatus === 'completed' ? 'secondary' : 'default'}
                    className={
                      doc.processingStatus === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                    }
                  >
                    {doc.processingStatus === 'completed' ? 'Complete' : 'Processing'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Output Preview */}
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Extracted Tasks</CardTitle>
            <CardDescription className="text-base">
              Recently extracted action items and todos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No tasks extracted yet. Process a document to extract tasks automatically.
              </div>
            ) : (
              <div className="space-y-4">
                {recentTasks.slice(0, 3).map((task) => (
                  <div 
                    key={task._id?.toString()} 
                    className="p-4 border rounded-xl hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{task.title}</h4>
                      <Badge 
                        variant={task.priority === 'high' ? 'destructive' : 'default'} 
                        className={`text-xs ${
                          task.priority === 'high' 
                            ? '' 
                            : task.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                        }`}
                      >
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {task.dueDate 
                        ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` 
                        : 'No due date'}
                    </p>
                  </div>
                ))}
                
                {recentTasks.length > 3 && (
                  <Button variant="outline" className="w-full mt-6" size="sm">
                    View All Actions ({recentTasks.length}) →
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">AI Summary</CardTitle>
            <CardDescription className="text-base">
              Quick insights from your last processed document
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentDocuments.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No summaries available yet. Process a document to see AI-generated insights.
              </div>
            ) : (
              <div className="space-y-4">
                {recentDocuments[0]?.summary && (
                  <div className="p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border">
                    <h4 className="font-medium mb-3">{recentDocuments[0].fileName}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {recentDocuments[0].summary.summary}
                    </p>
                  </div>
                )}
                
                {recentDocuments[0]?.summary?.topics && recentDocuments[0].summary.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recentDocuments[0].summary.topics.map((topic: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Tasks Extracted</span>
                  <span className="font-medium text-sm">
                    {recentDocuments[0]?.extractedTaskIds.length || 0}
                  </span>
                </div>
                
                <Button variant="outline" className="w-full mt-4" size="sm">
                  View Full Summary →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}