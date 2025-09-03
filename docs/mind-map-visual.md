# 🧠 Podcast App Mind Map & Architecture

```
                    🎧 PODCAST HUB
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    FRONTEND          BACKEND           SERVICES
   (Port 3000)      (Port 3001)         & DATA
        │                 │                 │
        │                 │                 │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │  React  │       │Express  │       │   AI    │
   │   App   │◄──────┤  API    │◄──────┤Services │
   │         │       │ Server  │       │         │
   └─────────┘       └─────────┘       └─────────┘
        │                 │                 │
        │                 │                 │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │Components│       │WebSocket│       │Summary  │
   │         │       │         │       │Service  │
   │ • Search│       │• Audio  │       │• Gemini │
   │ • List  │       │  Stream │       │• Multi  │
   │ • Details│       │• Transcr│       │  Model  │
   │ • Transcr│       │         │       │         │
   └─────────┘       └─────────┘       └─────────┘
        │                 │                 │
        │                 │                 │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │Navigation│       │ Routes  │       │Text Proc│
   │• URL    │       │• /api/* │       │• Split  │
   │  Routing│       │• /ws/*  │       │• Chunk  │
   │• History│       │• Static │       │• Validate│
   │  API    │       │  Files  │       │         │
   └─────────┘       └─────────┘       └─────────┘
```

## 🔍 CORE FEATURES BREAKDOWN

### 📱 Frontend Components
```
App.js
├── 🔍 PodcastSearch    → Search podcasts by name
├── 📋 PodcastList      → Display search results  
├── 📄 PodcastDetails   → Show episode details
├── 🎤 AudioTranscript  → Upload & transcribe audio
└── ⚖️ License         → MIT license display
```

### 🛡️ Backend Services
```
server/
├── 🚀 Express Server   → Main API endpoints
├── 🔌 WebSocket        → Real-time transcription
├── 📝 Controllers      → Business logic handlers
├── 🤖 AI Services      → Summary generation
└── 📊 Data Flow        → Request/response cycle
```

### 🧩 AI Summary Service Architecture
```
SummaryService
├── 🔑 API Configuration
│   ├── Gemini API Key
│   ├── Model Selection (Flash/Pro/1.0)
│   └── Generation Config
├── 📄 Summary Types
│   ├── Brief (2-3 sentences)
│   ├── Detailed (multi-section)
│   ├── Bullet Points
│   └── Comprehensive
├── 🛠️ Text Processing
│   ├── Transcript Validation
│   ├── Content Chunking (8000 chars)
│   ├── Prompt Engineering
│   └── Token Management
└── 🔄 Fallback System
    ├── Basic Text Extraction
    ├── Error Handling
    └── Rate Limit Management
```

## 🔧 TECHNICAL IMPLEMENTATION

### 🌐 Data Flow
```
User Input → Frontend → API Request → Backend → AI Service → Response
    ↑                                                          ↓
    └─────────── UI Update ←─── JSON Response ←─────────────────┘
```

### 🎯 Key Integration Points
1. **Frontend-Backend**: REST API + WebSocket
2. **Backend-AI**: Gemini API integration
3. **Error Handling**: Graceful fallbacks
4. **Performance**: Token limits & chunking

---

## 📋 SUMMARY SERVICE BREAKDOWN (Anti-Hallucination)

The current `summaryService.js` needs to be split into smaller, focused modules to prevent LLM confusion and improve maintainability.
