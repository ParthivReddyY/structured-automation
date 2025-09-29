'use client';

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [processing, setProcessing] = useState(false);
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

  // Process file
  const handleProcessFile = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    setError(null);

    try {
      const fileData = await processFileForAI(selectedFile);
      const endpoint = getProcessingEndpoint(selectedFile.type);
      
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

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      // Success - could show results or navigate to results page
      console.log('Processing successful:', data);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process text');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-lg">
          Central hub for processing documents and extracting structured insights.
        </p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        {/* File Upload Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              Document Upload
            </CardTitle>
            <CardDescription className="text-base">
              Upload PDF, DOCX, or TXT files for AI processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                  <FileText className="h-12 w-12 mx-auto text-primary" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type}
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={handleProcessFile} 
                      disabled={processing}
                      size="sm"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Process File'
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedFile(null)}
                      disabled={processing}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop files here or click to browse
                  </p>
                  <label htmlFor="file-upload-home">
                    <Button variant="outline" className="px-6 cursor-pointer" type="button" asChild>
                      <span>Choose Files</span>
                    </Button>
                  </label>
                  <input
                    id="file-upload-home"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".txt,.pdf,.docx,image/*"
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
              Supported formats: PDF, DOCX, TXT, Images • Max 10MB per file
            </div>
          </CardContent>
        </Card>

        {/* Text Input Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Direct Text Input</CardTitle>
            <CardDescription className="text-base">
              Paste unstructured notes for immediate processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid w-full gap-2">
              <Label htmlFor="notes" className="text-sm font-medium">Paste your notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Paste meeting notes, emails, or any unstructured text here..."
                className="min-h-[140px] resize-none"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={processing}
              />
            </div>
            <Button 
              className="w-full font-medium py-2"
              onClick={handleProcessText}
              disabled={processing || !textInput.trim()}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process Text'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Processing Status */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            Processing Status
          </CardTitle>
          <CardDescription className="text-base">
            Current document processing queue and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-xl bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-medium">meeting-notes-dec-2024.pdf</p>
                  <p className="text-sm text-muted-foreground">Processed 2 minutes ago</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Complete
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-xl bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-center gap-4">
                <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="font-medium">project-requirements.docx</p>
                  <p className="text-sm text-muted-foreground">Processing...</p>
                </div>
              </div>
              <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                In Progress
              </Badge>
            </div>
          </div>
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
            <div className="space-y-4">
              <div className="p-4 border rounded-xl hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Review quarterly reports</h4>
                  <Badge variant="destructive" className="text-xs">High</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Due: Dec 15, 2024</p>
              </div>
              
              <div className="p-4 border rounded-xl hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Schedule client meeting</h4>
                  <Badge variant="default" className="text-xs">Medium</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Due: Dec 20, 2024</p>
              </div>
              
              <Button variant="outline" className="w-full mt-6" size="sm">
                View All Actions →
              </Button>
            </div>
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
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border">
                <h4 className="font-medium mb-3">meeting-notes-dec-2024.pdf</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Document contains 3 action items, 2 deadlines, and 5 key discussion points. 
                  Main topics: quarterly review, budget planning, team restructuring.
                </p>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Confidence Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="w-[94%] h-full bg-green-500 rounded-full"></div>
                  </div>
                  <span className="font-medium text-sm">94%</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full mt-4" size="sm">
                View Full Summary →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}