'use client';

import { useState, useRef, useEffect } from 'react';
import React from 'react';
import { useNotifications } from '@/contexts/notification-context';
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { 
  FileText, 
  Image as ImageIcon, 
  Loader2, 
  Copy,
  Check,
  RotateCcw,
  Calendar,
  Mail,
  ListTodo,
  FileCheck2,
  User,
  Bot,
  Paperclip,
  ArrowUp,
  Square,
  Target,
  Search,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Zap,
  AlertCircle,
  FileUp
} from "lucide-react"
import { toast } from "sonner"
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion, AnimatePresence } from "framer-motion";

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

const styles = `
  *:focus-visible {
    outline-offset: 0 !important;
    --ring-offset: 0 !important;
  }
  textarea::-webkit-scrollbar {
    width: 6px;
  }
  textarea::-webkit-scrollbar-track {
    background: transparent;
  }
  textarea::-webkit-scrollbar-thumb {
    background-color: #444444;
    border-radius: 3px;
  }
  textarea::-webkit-scrollbar-thumb:hover {
    background-color: #555555;
  }
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.2);
    border-radius: 3px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.3);
  }
`;

if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('ai-prompt-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'ai-prompt-styles';
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
  }
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex w-full rounded-md border-none bg-transparent px-3 py-2.5 text-base placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] resize-none scrollbar-thin scrollbar-thumb-[#444444] scrollbar-track-transparent hover:scrollbar-thumb-[#555555]",
      className
    )}
    ref={ref}
    rows={1}
    {...props}
  />
));
Textarea.displayName = "Textarea";


const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border border-border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const CustomDivider: React.FC = () => (
  <div className="relative h-6 w-[1.5px] mx-1">
    <div
      className="absolute inset-0 bg-gradient-to-t from-transparent via-primary/70 to-transparent rounded-full"
    />
  </div>
);


export type ActionMode = "todo" | "action" | "mail" | "calendar" | null;


interface ModeSelectorProps {
  mode: ActionMode;
  label: string;
  icon: React.ReactNode;
  color: string;
  isActive: boolean;
  onClick: () => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({
  label,
  icon,
  color,
  isActive,
  onClick,
}) => {
  const colorClasses = isActive ? `
    [background-color:${color}15] 
    [border-color:${color}] 
    [color:${color}]
  ` : '';
  
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Toggle ${label} mode`}
      className={cn(
        "rounded-full transition-all flex items-center gap-1 px-2 py-1 border h-8",
        isActive
          ? `border-current ${colorClasses}`
          : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
        <motion.div
          animate={{ rotate: isActive ? 360 : 0, scale: isActive ? 1.1 : 1 }}
          whileHover={{
            rotate: isActive ? 360 : 15,
            scale: 1.1,
            transition: { type: "spring", stiffness: 300, damping: 10 },
          }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
        >
          {icon}
        </motion.div>
      </div>
      <AnimatePresence>
        {isActive && (
          <motion.span
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs overflow-hidden whitespace-nowrap flex-shrink-0"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  files?: AttachedFile[];
  timestamp: Date;
  processing?: boolean;
  results?: ProcessingResults;
  actionMode?: ActionMode;
}

interface AttachedFile {
  name: string;
  size: number;
  type: string;
  preview?: string;
  data?: string;
}

interface ProcessingResults {
  tasksCreated?: number;
  calendarEvents?: number;
  mailDrafts?: number;
  todoItems?: number;
}

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<ActionMode>(null);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const { addNotification } = useNotifications();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (containerRef.current && hasStartedChat) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, hasStartedChat]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const modes = [
    {
      mode: "todo" as ActionMode,
      label: "Todo",
      icon: <ListTodo className="w-4 h-4" />,
      color: "#F97316", 
    },
    {
      mode: "action" as ActionMode,
      label: "Action",
      icon: <FileCheck2 className="w-4 h-4" />,
      color: "#1EAEDB", 
    },
    {
      mode: "mail" as ActionMode,
      label: "Mail",
      icon: <Mail className="w-4 h-4" />,
      color: "#8B5CF6", 
    },
    {
      mode: "calendar" as ActionMode,
      label: "Calendar",
      icon: <Calendar className="w-4 h-4" />,
      color: "#10B981", 
    },
  ];

  const handleModeToggle = (mode: ActionMode) => {
    setSelectedMode(selectedMode === mode ? null : mode);
  };

  const getPlaceholder = () => {
    switch (selectedMode) {
      case "todo":
        return "Add a new todo item... (e.g., 'Buy groceries tomorrow')";
      case "action":
        return "Create an action item... (e.g., 'Review project proposal by Friday')";
      case "mail":
        return "Draft an email... (e.g., 'Send meeting summary to team')";
      case "calendar":
        return "Schedule an event... (e.g., 'Team meeting next Monday at 2pm')";
      default:
        return "Type your message or select an action mode above...";
    }
  };

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>File {file.name} is too large. Maximum size is 10MB.</span>
        </div>
      );
      return;
    }

    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>File type {file.type} is not supported.</span>
        </div>
      );
      return;
    }

    setAttachedFiles(prev => [...prev, file]);
    
    toast.success(
      <div className="flex items-center gap-2">
        <FileUp className="h-4 w-4" />
        <span>{file.name} attached</span>
      </div>
    );
  };

  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success(
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4" />
        <span>Copied to clipboard!</span>
      </div>
    );
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveActivitiesToDatabase = async (userMessage: Message, results: ProcessingResults) => {
    const activities = [];

    if (results.tasksCreated && results.tasksCreated > 0) {
      activities.push({
        type: 'task',
        title: 'Tasks Created',
        count: results.tasksCreated,
        userPrompt: userMessage.content,
        actionMode: userMessage.actionMode,
        files: userMessage.files,
        results,
      });
    }
    if (results.calendarEvents && results.calendarEvents > 0) {
      activities.push({
        type: 'event',
        title: 'Events Added',
        count: results.calendarEvents,
        userPrompt: userMessage.content,
        actionMode: userMessage.actionMode,
        files: userMessage.files,
        results,
      });
    }
    if (results.mailDrafts && results.mailDrafts > 0) {
      activities.push({
        type: 'mail',
        title: 'Emails Drafted',
        count: results.mailDrafts,
        userPrompt: userMessage.content,
        actionMode: userMessage.actionMode,
        files: userMessage.files,
        results,
      });
    }
    if (results.todoItems && results.todoItems > 0) {
      activities.push({
        type: 'todo',
        title: 'Todos Created',
        count: results.todoItems,
        userPrompt: userMessage.content,
        actionMode: userMessage.actionMode,
        files: userMessage.files,
        results,
      });
    }

    for (const activity of activities) {
      try {
        await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...activity,
            sessionId: userMessage.id,
          }),
        });
      } catch (error) {
        console.error('Failed to save activity:', error);
      }
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;

    setHasStartedChat(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input || 'Processing attached files...',
      files: attachedFiles.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
      timestamp: new Date(),
      actionMode: selectedMode,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const currentFiles = attachedFiles;
    setAttachedFiles([]);
    setProcessing(true);

    const processingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: selectedMode 
        ? `Processing your ${selectedMode} request...`
        : 'Processing your request...',
      timestamp: new Date(),
      processing: true,
    };
    setMessages(prev => [...prev, processingMessage]);

    const processingToast = toast.loading(
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 animate-pulse" />
        <span>AI is analyzing your request...</span>
      </div>,
      {
        position: 'top-center',
        duration: Infinity,
      }
    );

    try {
      let results: ProcessingResults = {};

      if (selectedMode) {
        toast.loading(
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>Processing {selectedMode} request with AI...</span>
          </div>,
          {
            id: processingToast,
            position: 'top-center',
          }
        );
        results = await processWithMode(userMessage.content, currentFiles, selectedMode);
      } else {
        if (currentFiles.length > 0) {
          toast.loading(
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>AI is extracting data from {currentFiles.length} file{currentFiles.length > 1 ? 's' : ''}...</span>
            </div>,
            {
              id: processingToast,
              position: 'top-center',
            }
          );
          const fileResults = await processFiles(currentFiles);
          results = { ...results, ...fileResults };
        }

        if (userMessage.content && userMessage.content !== 'Processing attached files...') {
          toast.loading(
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>AI is analyzing your message...</span>
            </div>,
            {
              id: processingToast,
              position: 'top-center',
            }
          );
          const textResults = await processText(userMessage.content);
          results = {
            tasksCreated: (results.tasksCreated || 0) + (textResults.tasksCreated || 0),
            calendarEvents: (results.calendarEvents || 0) + (textResults.calendarEvents || 0),
            mailDrafts: (results.mailDrafts || 0) + (textResults.mailDrafts || 0),
            todoItems: (results.todoItems || 0) + (textResults.todoItems || 0),
          };
        }
      }

      toast.dismiss(processingToast);
      const responseContent = generateResponseMessage(results, selectedMode);
      
      setMessages(prev => prev.map(msg => 
        msg.id === processingMessage.id 
          ? { ...msg, content: responseContent, processing: false, results }
          : msg
      ));

      if (results.tasksCreated && results.tasksCreated > 0) {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Created {results.tasksCreated} action item{results.tasksCreated > 1 ? 's' : ''}!</span>
          </div>,
          {
            description: 'Check the Actions tab to view them',
            position: 'top-center',
          }
        );
        addNotification({
          type: 'task',
          title: `${results.tasksCreated} Action Item${results.tasksCreated > 1 ? 's' : ''} Created`,
          message: `Successfully created ${results.tasksCreated} new action item${results.tasksCreated > 1 ? 's' : ''}. Check the Actions tab to view them.`,
        });
      }
      if (results.calendarEvents && results.calendarEvents > 0) {
        toast.success(
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Scheduled {results.calendarEvents} event{results.calendarEvents > 1 ? 's' : ''}!</span>
          </div>,
          {
            description: 'Check the Calendar tab to view them',
            position: 'top-center',
          }
        );
        addNotification({
          type: 'event',
          title: `${results.calendarEvents} Event${results.calendarEvents > 1 ? 's' : ''} Scheduled`,
          message: `Successfully scheduled ${results.calendarEvents} calendar event${results.calendarEvents > 1 ? 's' : ''}. Check the Calendar tab to view them.`,
        });
      }
      if (results.mailDrafts && results.mailDrafts > 0) {
        toast.success(
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Drafted {results.mailDrafts} email{results.mailDrafts > 1 ? 's' : ''}!</span>
          </div>,
          {
            description: 'Check the Mails tab to view them',
            position: 'top-center',
          }
        );
        addNotification({
          type: 'mail',
          title: `${results.mailDrafts} Email${results.mailDrafts > 1 ? 's' : ''} Drafted`,
          message: `Successfully drafted ${results.mailDrafts} email${results.mailDrafts > 1 ? 's' : ''}. Check the Mails tab to review and send them.`,
        });
      }
      if (results.todoItems && results.todoItems > 0) {
        toast.success(
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            <span>Created {results.todoItems} todo{results.todoItems > 1 ? 's' : ''}!</span>
          </div>,
          {
            description: 'Check the Todos tab to view them',
            position: 'top-center',
          }
        );
        addNotification({
          type: 'todo',
          title: `${results.todoItems} Todo${results.todoItems > 1 ? 's' : ''} Created`,
          message: `Successfully created ${results.todoItems} todo item${results.todoItems > 1 ? 's' : ''}. Check the Todos tab to view them.`,
        });
      }

      const totalItems = (results.tasksCreated || 0) + (results.calendarEvents || 0) + 
                        (results.mailDrafts || 0) + (results.todoItems || 0);
      
      if (totalItems > 0) {
        try {
          await saveActivitiesToDatabase(userMessage, results);
        } catch (error) {
          console.error('Failed to save activities to database:', error);
        }
      }
      
      if (totalItems === 0) {
        toast.success(
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>Processing complete!</span>
          </div>,
          {
            position: 'top-center',
          }
        );
      }
    } catch (err) {
      console.error('Processing error:', err);
      toast.dismiss(processingToast);
      setMessages(prev => prev.map(msg => 
        msg.id === processingMessage.id 
          ? { ...msg, content: 'Sorry, there was an error processing your request. Please try again.', processing: false }
          : msg
      ));
      toast.error(
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          <span>Processing failed. Please try again.</span>
        </div>,
        {
          position: 'top-center',
        }
      );
    } finally {
      setProcessing(false);
    }
  };

  const processWithMode = async (text: string, files: File[], mode: ActionMode): Promise<ProcessingResults> => {
    const results: ProcessingResults = {
      tasksCreated: 0,
      calendarEvents: 0,
      mailDrafts: 0,
      todoItems: 0,
    };

    if (files.length > 0) {
      const fileResults = await processFiles(files);
      Object.assign(results, fileResults);
    }

    if (text && text !== 'Processing attached files...') {
      try {
        const today = new Date();
        const processedText = parseRelativeDates(text, today);

        switch (mode) {
          case 'todo': {
            const response = await fetch('/api/todos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: processedText,
                completed: false,
                dueDate: extractDate(text, today),
                priority: extractPriority(text),
              }),
            });
            if (response.ok) {
              results.todoItems = (results.todoItems || 0) + 1;
            }
            break;
          }
          case 'action': {
            const response = await fetch('/api/process-text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: processedText }),
            });
            if (response.ok) {
              const data = await response.json();
              results.tasksCreated = data.data?.tasks?.tasks?.length || 0;
            }
            break;
          }
          case 'mail': {
            const response = await fetch('/api/process-text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: `Draft an email: ${processedText}` }),
            });
            if (response.ok) {
              const data = await response.json();
              results.mailDrafts = data.data?.mailDrafts?.length || 0;
            }
            break;
          }
          case 'calendar': {
            const response = await fetch('/api/process-text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: `Schedule: ${processedText}` }),
            });
            if (response.ok) {
              const data = await response.json();
              results.calendarEvents = data.data?.calendarEvents?.length || 0;
            }
            break;
          }
        }
      } catch (error) {
        console.error(`Failed to process ${mode}:`, error);
      }
    }

    return results;
  };

  const parseRelativeDates = (text: string, baseDate: Date): string => {
    const today = new Date(baseDate);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let processed = text;
    
    processed = processed.replace(/\btomorrow\b/gi, tomorrow.toISOString().split('T')[0]);
    processed = processed.replace(/\btoday\b/gi, today.toISOString().split('T')[0]);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const nextDayRegex = /\bnext (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;
    processed = processed.replace(nextDayRegex, (match, day) => {
      const targetDay = dayNames.findIndex(d => d.toLowerCase() === day.toLowerCase());
      const currentDay = today.getDay();
      const daysToAdd = (targetDay - currentDay + 7) % 7 || 7;
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + daysToAdd);
      return nextDate.toISOString().split('T')[0];
    });
    
    return processed;
  };

  const extractDate = (text: string, baseDate: Date): Date | undefined => {
    const today = new Date(baseDate);
    
    if (/\btomorrow\b/i.test(text)) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    
    if (/\btoday\b/i.test(text)) {
      return today;
    }
    
    const datePattern = /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b/;
    const match = text.match(datePattern);
    if (match) {
      return new Date(match[0]);
    }
    
    return undefined;
  };

  const extractPriority = (text: string): 'low' | 'medium' | 'high' => {
    if (/\b(urgent|high|important|asap)\b/i.test(text)) return 'high';
    if (/\b(low|minor|optional)\b/i.test(text)) return 'low';
    return 'medium';
  };

  const processFiles = async (files: File[]) => {
    const results: ProcessingResults = {
      tasksCreated: 0,
      calendarEvents: 0,
      mailDrafts: 0,
      todoItems: 0,
    };

    for (const file of files) {
      try {
        let response;
        
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(file);
        });
        
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
          response = await fetch('/api/process-multimodal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: base64,
              fileName: file.name,
              mimeType: file.type,
            }),
          });
        } else {
          const textContent = atob(base64);
          response = await fetch('/api/process-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileContent: textContent,
              fileName: file.name,
            }),
          });
        }

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            results.tasksCreated = (results.tasksCreated || 0) + (data.data?.tasks?.tasks?.length || 0);
            results.calendarEvents = (results.calendarEvents || 0) + (data.data?.calendarEvents?.length || 0);
            results.mailDrafts = (results.mailDrafts || 0) + (data.data?.mailDrafts?.length || 0);
            results.todoItems = (results.todoItems || 0) + (data.data?.todoItems?.length || 0);
          }
        }
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
      }
    }

    return results;
  };

  const processText = async (text: string) => {
    const results: ProcessingResults = {
      tasksCreated: 0,
      calendarEvents: 0,
      mailDrafts: 0,
      todoItems: 0,
    };

    try {
      const today = new Date();
      const processedText = parseRelativeDates(text, today);

      const response = await fetch('/api/process-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: processedText }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          results.tasksCreated = data.data?.tasks?.tasks?.length || 0;
          results.calendarEvents = data.data?.calendarEvents?.length || 0;
          results.mailDrafts = data.data?.mailDrafts?.length || 0;
          results.todoItems = data.data?.todoItems?.length || 0;
        }
      }
    } catch (error) {
      console.error('Failed to process text:', error);
    }

    return results;
  };

  const generateResponseMessage = (results: ProcessingResults, mode?: ActionMode): string => {
    if (mode) {
      switch (mode) {
        case 'todo':
          return results.todoItems 
            ? `✓ Created ${results.todoItems} todo item${results.todoItems > 1 ? 's' : ''}! Check the Todos tab.`
            : "I've processed your todo request. Check the Todos tab.";
        case 'action':
          return results.tasksCreated 
            ? `✓ Created ${results.tasksCreated} action item${results.tasksCreated > 1 ? 's' : ''}! Check the Actions tab.`
            : "I've processed your action request. Check the Actions tab.";
        case 'mail':
          return results.mailDrafts 
            ? `✓ Drafted ${results.mailDrafts} email${results.mailDrafts > 1 ? 's' : ''}! Check the Mails tab.`
            : "I've processed your mail request. Check the Mails tab.";
        case 'calendar':
          return results.calendarEvents 
            ? `✓ Scheduled ${results.calendarEvents} event${results.calendarEvents > 1 ? 's' : ''}! Check the Calendar tab.`
            : "I've processed your calendar request. Check the Calendar tab.";
      }
    }

    const parts: string[] = ["⚡ Processing complete! Here's what I created:"];
    
    if (results.tasksCreated && results.tasksCreated > 0) {
      parts.push(`\n• ${results.tasksCreated} action item${results.tasksCreated > 1 ? 's' : ''}`);
    }
    
    if (results.calendarEvents && results.calendarEvents > 0) {
      parts.push(`\n• ${results.calendarEvents} calendar event${results.calendarEvents > 1 ? 's' : ''}`);
    }
    
    if (results.mailDrafts && results.mailDrafts > 0) {
      parts.push(`\n• ${results.mailDrafts} mail draft${results.mailDrafts > 1 ? 's' : ''}`);
    }
    
    if (results.todoItems && results.todoItems > 0) {
      parts.push(`\n• ${results.todoItems} todo item${results.todoItems > 1 ? 's' : ''}`);
    }

    if (parts.length === 1) {
      return "I've analyzed your input. No specific actions were extracted, but the information has been processed.";
    }

    return parts.join('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const hasContent = input.trim() !== "" || attachedFiles.length > 0;

  return (
    <div className="relative flex h-[calc(100vh-var(--header-height))] bg-gradient-to-br from-background via-background to-muted/20">
      <div ref={containerRef} className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30">
        <div className="w-full max-w-5xl mx-auto px-4 py-6 flex-1 flex flex-col min-h-0">
          
          {/* Welcome Section - Only show when no messages */}
          {!hasStartedChat && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 space-y-8 animate-in fade-in duration-700">
              {/* Hero Section */}
              <div className="text-center space-y-6 max-w-2xl">
                <h1 className="text-5xl font-bold text-black dark:text-white tracking-tight">
                  What&apos;s on the agenda today?
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  Start a conversation, upload documents, or select an action mode to automate your workflow
                </p>
              </div>

              {/* Quick Action Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
                <button
                  onClick={() => setSelectedMode('todo')}
                  className="group p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-2 border-orange-500/20 hover:border-orange-500/40 transition-all hover:scale-105 hover:shadow-xl"
                >
                  <ListTodo className="h-8 w-8 text-orange-600 dark:text-orange-400 mb-3 mx-auto" />
                  <p className="text-sm font-semibold">Create Todo</p>
                </button>
                <button
                  onClick={() => setSelectedMode('action')}
                  className="group p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/20 hover:border-blue-500/40 transition-all hover:scale-105 hover:shadow-xl"
                >
                  <FileCheck2 className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-3 mx-auto" />
                  <p className="text-sm font-semibold">Add Action</p>
                </button>
                <button
                  onClick={() => setSelectedMode('mail')}
                  className="group p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/20 hover:border-purple-500/40 transition-all hover:scale-105 hover:shadow-xl"
                >
                  <Mail className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-3 mx-auto" />
                  <p className="text-sm font-semibold">Draft Email</p>
                </button>
                <button
                  onClick={() => setSelectedMode('calendar')}
                  className="group p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/20 hover:border-green-500/40 transition-all hover:scale-105 hover:shadow-xl"
                >
                  <Calendar className="h-8 w-8 text-green-600 dark:text-green-400 mb-3 mx-auto" />
                  <p className="text-sm font-semibold">Schedule Event</p>
                </button>
              </div>
            </div>
          )}

          {/* Chat Messages - Show when chat has started */}
          {hasStartedChat && messages.length > 0 && (
            <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-6 pb-4">
                {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start`}
                    >
                      {/* Avatar */}
                      <Avatar className={`shrink-0 w-10 h-10 shadow-lg ring-2 ring-background ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-br from-primary to-primary/80' 
                          : 'bg-gradient-to-br from-purple-500 via-pink-500 to-primary'
                      }`}>
                        <AvatarImage 
                          src={message.type === 'user' ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=User' : 'https://api.dicebear.com/7.x/bottts/svg?seed=AI'}
                          alt={message.type === 'user' ? 'User Avatar' : 'AI Assistant Avatar'}
                        />
                        <AvatarFallback className="text-white flex items-center justify-center font-semibold">
                          {message.type === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>

                      {/* Message Content */}
                      <div className={`flex-1 min-w-0 ${message.type === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
                        <div
                          className={`group inline-block max-w-[85%] rounded-2xl px-5 py-3 shadow-lg transition-all hover:shadow-xl ${
                            message.type === 'user'
                              ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-primary/20'
                              : message.type === 'system'
                              ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50 border-2 border-blue-200/50 dark:border-blue-800/50 shadow-blue-500/10'
                              : 'bg-gradient-to-br from-muted to-muted/80 border-2 border-border/50 shadow-muted/50'
                          }`}
                        >
                          {message.processing ? (
                            <div className="flex items-center gap-3 min-h-[24px]">
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                              <span className="font-medium">{message.content}</span>
                            </div>
                          ) : (
                            <>
                              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                              
                              {/* Action Mode Badge */}
                              {message.actionMode && (
                                <div className="mt-2 pt-2 border-t border-current/10">
                                  <Badge variant="outline" className="gap-1">
                                    {modes.find(m => m.mode === message.actionMode)?.icon}
                                    {message.actionMode.charAt(0).toUpperCase() + message.actionMode.slice(1)} Mode
                                  </Badge>
                                </div>
                              )}
                              
                              {/* Attached Files Display */}
                              {message.files && message.files.length > 0 && (
                                <div className="mt-3 space-y-2 border-t border-current/10 pt-3">
                                  {message.files.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm bg-black/10 dark:bg-white/10 rounded-lg px-3 py-2">
                                      <div className={`p-1.5 rounded-md ${file.type.startsWith('image/') ? 'bg-purple-500/20' : 'bg-blue-500/20'}`}>
                                        {file.type.startsWith('image/') ? (
                                          <ImageIcon className="h-4 w-4" />
                                        ) : (
                                          <FileText className="h-4 w-4" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <span className="font-medium block truncate text-xs">{file.name}</span>
                                        <span className="text-xs opacity-75">{formatFileSize(file.size)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Results Badges */}
                              {message.results && (
                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-current/10">
                                  {(message.results.tasksCreated ?? 0) > 0 && (
                                    <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-semibold shadow-md">
                                      <FileCheck2 className="h-3 w-3" />
                                      {message.results.tasksCreated} Task{(message.results.tasksCreated ?? 0) > 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                  {(message.results.calendarEvents ?? 0) > 0 && (
                                    <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-semibold shadow-md">
                                      <Calendar className="h-3 w-3" />
                                      {message.results.calendarEvents} Event{(message.results.calendarEvents ?? 0) > 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                  {(message.results.mailDrafts ?? 0) > 0 && (
                                    <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-semibold shadow-md">
                                      <Mail className="h-3 w-3" />
                                      {message.results.mailDrafts} Email{(message.results.mailDrafts ?? 0) > 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                  {(message.results.todoItems ?? 0) > 0 && (
                                    <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-semibold shadow-md">
                                      <ListTodo className="h-3 w-3" />
                                      {message.results.todoItems} Todo{(message.results.todoItems ?? 0) > 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Message Actions */}
                              {message.type === 'assistant' && !message.processing && (
                                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-current/10 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-xs font-medium rounded-lg"
                                    onClick={() => copyMessage(message.content, message.id)}
                                  >
                                    {copiedId === message.id ? (
                                      <><Check className="h-3 w-3 mr-1.5" /> Copied</>
                                    ) : (
                                      <><Copy className="h-3 w-3 mr-1.5" /> Copy</>
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-xs font-medium rounded-lg"
                                  >
                                    <RotateCcw className="h-3 w-3 mr-1.5" /> Regenerate
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                          
                          <p className="text-xs opacity-60 mt-2 font-medium">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Input Area - Always visible at bottom */}
          <div className={`mt-auto pt-4 pb-2 ${hasStartedChat && messages.length > 0 ? '' : ''}`}>
            <TooltipProvider>
              <div className="rounded-3xl border-2 border-border bg-card/80 backdrop-blur-xl p-2 shadow-2xl transition-all duration-300 hover:shadow-3xl">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder={getPlaceholder()}
                  disabled={processing}
                  className="text-base min-h-[56px]"
                />

                {/* Actions Row */}
                <div className="flex items-center justify-between gap-2 p-0 pt-2">
                  <div className="flex items-center gap-1">
                    {/* Upload Button */}
                    <input
                      ref={uploadInputRef}
                      type="file"
                      className="hidden"
                      aria-label="Upload files"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          Array.from(e.target.files).forEach(processFile);
                        }
                        if (e.target) e.target.value = "";
                      }}
                      accept=".txt,.pdf,.png,.jpg,.jpeg,.webp,.docx,image/*"
                      multiple
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="Upload files"
                          onClick={() => uploadInputRef.current?.click()}
                          className="flex h-9 w-9 text-muted-foreground cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          <Paperclip className="h-5 w-5 transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Upload files</TooltipContent>
                    </Tooltip>

                    {/* Mode Selectors */}
                    <div className="flex items-center">
                      {modes.map((mode, index) => (
                        <React.Fragment key={mode.mode}>
                          {index > 0 && <CustomDivider />}
                          <ModeSelector
                            mode={mode.mode}
                            label={mode.label}
                            icon={mode.icon}
                            color={mode.color}
                            isActive={selectedMode === mode.mode}
                            onClick={() => handleModeToggle(mode.mode)}
                          />
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        size="icon"
                        className={cn(
                          "h-9 w-9 rounded-full transition-all duration-200 shadow-lg",
                          hasContent
                            ? "bg-primary hover:bg-primary/80 text-primary-foreground scale-110"
                            : "bg-transparent hover:bg-accent text-muted-foreground hover:text-accent-foreground"
                        )}
                        onClick={handleSubmit}
                        disabled={processing || !hasContent}
                      >
                        {processing ? (
                          <Square className="h-4 w-4 fill-current animate-pulse" />
                        ) : (
                          <ArrowUp className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {processing ? "Stop generation" : "Send message"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
