# 🚀 Structured Automation

**Transform unstructured data into intelligent actions**

Structured Automation is an AI-powered platform that takes **unstructured data** as input—including plain text, images, PDFs, and documents—and intelligently converts it into **structured information** that triggers automated actions. Built with cutting-edge AI/ML technologies, it provides a complete end-to-end pipeline for intelligent data processing and workflow automation.

🌐 **Live Demo**: [https://structured-automation.vercel.app](https://structured-automation.vercel.app)

---

## 🎯 Overview

Modern productivity requires systems that understand unstructured information and convert it into actionable insights. Structured Automation solves this by:

- **Accepting unstructured input**: Raw text, scanned documents, images, PDFs, meeting notes
- **Converting to structured data**: Extracting tasks, dates, people, priorities, and metadata
- **Intelligent intent detection**: Understanding what needs to be done
- **Smart routing**: Automatically directing information to the right workflows
- **Automated actions**: Creating tasks, calendar events, email drafts, and to-dos

---

## ✨ Key Features

### 🧠 AI-Powered Processing
- **Unstructured Data Input**: Accept any format—text, images, PDFs, handwritten notes, screenshots
- **Intelligent Parsing**: Extract meaning from messy, unformatted data
- **Intent Detection**: Automatically classify content (meetings, support requests, tasks, reminders)
- **Structured Output**: Convert to organized tasks, events, and actionable items
- **Context-Aware Extraction**: Identify tasks, dates, people, organizations, and key information
- **Sentiment Analysis**: Understand tone and urgency

### 🎯 Intelligent Routing
Content is automatically routed to appropriate sections:
- **📅 Calendar**: Meetings, events, deadlines, appointments
- **✉️ Mails**: Email drafts, customer support responses, reports
- **✅ Actions**: Complex tasks, project work, action items
- **📝 To-Dos**: Simple checklists, personal reminders, quick tasks

### 📊 Comprehensive Dashboard
- **Home**: Upload and process files, interact with AI assistant
- **Actions**: Manage extracted action items and tasks
- **Calendar**: View and manage scheduled events
- **Mails**: Review and send AI-generated email drafts
- **To-Dos**: Track simple checklists and reminders
- **Activity**: Monitor all processing activities and logs

### 🔐 Authentication & Personalization
- Secure authentication via NextAuth.js
- Personalized workspaces and data isolation
- Theme customization (dark/light mode)

---

## 🏗️ Architecture

### End-to-End Pipeline

```
Input Layer → AI Processing → Structured Output → Action Triggers → Database Storage
```

**1. Input Layer (Unstructured Data)**
- Plain text (typed, pasted, or copy-pasted notes)
- Images (screenshots, photos, scanned documents)
- PDFs (reports, invoices, meeting minutes)
- Support for: PNG, JPEG, WebP, HEIC, PDF formats
- No formatting required—AI handles messy, unstructured input

**2. AI Processing Engine**
- **Primary Model**: Google Gemini Flash (fast, accurate)
- **Fallback Model**: Mistral AI (reliability)
- **Multimodal Model**: Gemini 2.0 Flash / Pixtral (OCR, document parsing)
- Automatic retry logic and error handling
- Temperature-controlled generation (0.3 for consistency)

**3. Structured Output Generation**
- Intent classification with confidence scores
- Task extraction with priority levels
- Calendar event parsing with date/time normalization
- Email draft generation with tone matching
- Metadata extraction (people, organizations, locations, URLs)

**4. Action Triggers**
- Automated task creation
- Calendar event scheduling
- Email draft preparation
- To-do list population
- Notification system

**5. Database Layer**
- MongoDB for persistent storage
- Collections: Documents, Tasks, Calendar Events, Mail Drafts, Todos, Processing Logs
- Document linking and relationship tracking

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15.5 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4.0
- **Components**: Radix UI, shadcn/ui
- **Icons**: Tabler Icons, Lucide React
- **Animations**: Framer Motion
- **State Management**: React Context API
- **Notifications**: Sonner (toast notifications)

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **AI Framework**: Google Genkit
- **AI Models**:
  - Google Gemini Flash (text processing)
  - Google Gemini 2.0 Flash (multimodal)
  - Mistral AI (fallback & pixtral for OCR)
- **Database**: MongoDB with native driver
- **Authentication**: NextAuth.js v5 with MongoDB adapter
- **Type Safety**: TypeScript, Zod schemas

### AI & ML Libraries
- `@ai-sdk/google` - Google AI SDK
- `@ai-sdk/mistral` - Mistral AI SDK
- `genkit` - AI orchestration framework
- `ai` - Vercel AI SDK for streaming
- `zod` - Schema validation

---

## 📦 Quick Start

### Try it Online
Visit the live demo: **[https://structured-automation.vercel.app](https://structured-automation.vercel.app)**

### Local Setup

**Prerequisites:**
- Node.js 20 or higher
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- API Keys (see below)

**Steps:**

1. **Clone and Install**
```bash
git clone https://github.com/yourusername/structured-automation.git
cd structured-automation
npm install
```

2. **Get API Keys**

   **Google Gemini API:**
   - Visit [Google AI Studio](https://aistudio.google.com/apikey)
   - Create/sign in to your Google account
   - Click "Get API Key" → "Create API key"
   - Copy the key

   **Mistral AI API:**
   - Visit [Mistral AI Console](https://console.mistral.ai/)
   - Sign up/log in
   - Navigate to "API Keys" section
   - Create a new API key
   - Copy the key

3. **Configure Environment Variables**

   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/structured-automation
   # Or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/dbname

   # NextAuth (generate a random secret)
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-random-secret-here

   # AI Models (REQUIRED - Add your API keys here)
   GOOGLE_API_KEY=your-google-gemini-api-key-here
   MISTRAL_API_KEY=your-mistral-ai-api-key-here
   ```

   **Important:** Replace the placeholder values with your actual API keys from steps above.

4. **Run the Development Server**
```bash
npm run dev
```

5. **Open Your Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🚀 Usage

### Input: Unstructured Data → Output: Structured Actions

**1. Process Unstructured Text**
- Paste meeting notes, emails, or random thoughts
- Type in natural language
- AI extracts tasks, dates, and actions automatically

**2. Upload Files (Images, PDFs)**
- Click the file upload icon 📎
- Select any document: invoice, screenshot, scanned note
- AI uses OCR to extract text and structure the data

**3. View Structured Results**
Results are automatically organized into:
- **📅 Calendar**: Extracted meetings and deadlines
- **✉️ Mails**: AI-generated email drafts
- **✅ Actions**: Complex tasks with priorities
- **📝 To-Dos**: Simple checklist items

### Example Workflow
```
Input (Unstructured):
"Meeting with Sarah tomorrow at 2pm to discuss Q4 budget. 
Need to prepare slides by Friday. Send update to team."

Output (Structured):
✅ Calendar Event: "Meeting with Sarah" - Tomorrow 2:00 PM
✅ Task: "Prepare slides for Q4 budget" - Due: Friday, Priority: High
✅ Email Draft: "Q4 Budget Meeting Update" - To: Team
```

---

## 📁 Project Structure

```
structured-automation/
├── src/
│   ├── app/
│   │   ├── api/                    # API routes for AI processing
│   │   │   ├── process-text/       # Text processing endpoint
│   │   │   ├── process-multimodal/ # File processing endpoint
│   │   │   ├── tasks/              # Task management
│   │   │   ├── calendar/           # Calendar events
│   │   │   ├── mails/              # Email drafts
│   │   │   ├── todos/              # To-do items
│   │   │   └── activities/         # Activity logs
│   │   ├── page.tsx                # Home page
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css             # Global styles
│   ├── components/
│   │   ├── dashboard-app.tsx       # Main dashboard component
│   │   ├── pages/                  # Page components
│   │   │   ├── home.tsx
│   │   │   ├── actions.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── mails.tsx
│   │   │   └── todos.tsx
│   │   ├── ui/                     # Reusable UI components
│   │   └── auth-modal.tsx          # Authentication modal
│   ├── contexts/
│   │   └── notification-context.tsx # Notification state
│   ├── lib/
│   │   ├── ai-config.ts            # AI model configurations
│   │   ├── genkit.ts               # Genkit setup
│   │   ├── mongodb.ts              # Database connection
│   │   └── models.ts               # Data models
│   ├── types/
│   │   ├── ai-schemas.ts           # AI response types
│   │   └── next-auth.d.ts          # Auth types
│   └── hooks/
│       └── use-mobile.ts           # Mobile detection
├── public/                         # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.ts
```

---

## 🧪 How It Works: Unstructured → Structured

### Text Input Example
```
📥 Unstructured Input:
"Schedule a meeting with John next Tuesday at 3 PM to discuss project timeline"

🤖 AI Processing:
- Detects intent: "meeting"
- Extracts date: "next Tuesday"
- Extracts time: "15:00"
- Identifies person: "John"
- Determines topic: "project timeline"

📤 Structured Output:
✅ Calendar Event: "Meeting with John - Project Timeline"
   Date: [Next Tuesday], Time: 15:00
✅ Action: "Prepare project timeline for John meeting"
   Priority: Medium
```

### Image/PDF Processing
```
📥 Unstructured Input:
[Photo of handwritten meeting notes or PDF invoice]

🤖 AI Processing (OCR + Analysis):
- Extracts text using vision models
- Identifies key information
- Structures the data

📤 Structured Output:
✅ Tasks extracted with priorities
✅ Dates converted to calendar events
✅ Action items organized
```

---

## 🔌 API Endpoints

### Process Unstructured Text
**POST** `/api/process-text`

Converts unstructured text into structured data.

```bash
curl -X POST https://structured-automation.vercel.app/api/process-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Meeting tomorrow at 2pm with client"}'
```

### Process Unstructured Files
**POST** `/api/process-multimodal`

Converts images/PDFs into structured data using OCR.

```bash
curl -X POST https://structured-automation.vercel.app/api/process-multimodal \
  -H "Content-Type: application/json" \
  -d '{"fileBase64": "...", "mimeType": "image/png"}'
```

---

## 🎨 Key Capabilities

### From Unstructured to Structured
- **Natural Language Understanding**: "tomorrow", "next week", "by Friday"
- **Date Normalization**: Converts relative dates to actual dates
- **Priority Detection**: Identifies urgency from context
- **Entity Extraction**: People, organizations, locations automatically identified

### Intelligent Features
- **Smart Routing**: Content automatically goes to the right section
- **OCR Processing**: Extract text from images and PDFs
- **Tone Matching**: Email drafts match appropriate professional tone
- **Confidence Scoring**: AI reports how confident it is in its analysis

---

## 🧪 Development

```bash
# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

---

## 🔬 Technical Approach

### Unstructured Data Processing
1. **Input**: Accept any format (text, images, PDFs)
2. **Parse**: Use AI vision models for OCR if needed
3. **Analyze**: Extract intent, entities, and structure
4. **Convert**: Transform to structured JSON
5. **Store**: Save to MongoDB with relationships
6. **Act**: Trigger notifications and updates

### AI Model Strategy
- **Google Gemini**: Primary model for text and vision
- **Mistral AI**: Fallback for reliability
- **Retry Logic**: 3 attempts with exponential backoff
- **Error Handling**: Graceful degradation if one model fails

---

## 📝 License

This project is open for educational and demonstration purposes.

---

## 🙏 Built With

- **Framework**: [Next.js](https://nextjs.org/)
- **AI Models**: [Google Gemini](https://ai.google.dev/) & [Mistral AI](https://mistral.ai/)
- **UI**: [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Hosting**: [Vercel](https://vercel.com/)

---

## 📧 Links

- **Live Demo**: [https://structured-automation.vercel.app](https://structured-automation.vercel.app)
- **Issues**: [GitHub Issues](https://github.com/ParthivReddyY/structured-automation/issues)
- **Documentation**: This README

---

**🎯 Transform unstructured data into intelligent actions with AI/ML**
