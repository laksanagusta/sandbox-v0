# Backend Implementation Prompt: Secure OpenAI API Integration

## Context

The `sandbox-v0` frontend application has been updated to proxy all OpenAI API calls through the backend. This keeps the OpenAI API key secure on the server side and prevents exposure in the frontend JavaScript bundle.

## Changes Made to Frontend

1. **Removed** `VITE_OPENAI_API_KEY` from frontend environment
2. **Removed** direct OpenAI SDK usage in `openai-client.ts`
3. **Added** `/api/chat` endpoint calls instead of direct OpenAI API calls
4. **Updated** `ChatInterface.tsx` to remove API key initialization

## Current Backend Implementation (sandbox-v0/server/index.ts)

The Express server already has a chat proxy endpoint:

```typescript
import OpenAI from "openai";

// Initialize OpenAI with API key from server environment (secure)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chat proxy endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, tools } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: "OPENAI_API_KEY is not configured on the server" 
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: tools?.length > 0 ? tools : undefined,
    });

    res.json(completion);
  } catch (error: any) {
    console.error("OpenAI Chat Error:", error);
    res.status(500).json({ 
      error: error.message,
      code: error.code || "OPENAI_ERROR"
    });
  }
});
```

---

## Prompt for Separate Backend Service Implementation

If you need to implement this in a **separate backend service** (e.g., Go, Python, Java), use the following prompt:

---

### 🚀 Implementation Prompt

**Task:** Implement a secure OpenAI Chat Proxy API endpoint

**Requirements:**

1. **Endpoint:** `POST /api/chat`

2. **Request Body:**
```json
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "User message" },
    { "role": "assistant", "content": "...", "tool_calls": [...] },
    { "role": "tool", "content": "...", "tool_call_id": "..." }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "tool_name",
        "description": "Tool description",
        "parameters": { ... }  // JSON Schema
      }
    }
  ]
}
```

3. **Response:** Forward the OpenAI API response as-is:
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Response text",
        "tool_calls": [...]
      },
      "finish_reason": "stop"
    }
  ],
  "usage": { ... }
}
```

4. **Environment Variable:** Read `OPENAI_API_KEY` from environment

5. **Security Considerations:**
   - Validate that `messages` is a non-empty array
   - Optionally add rate limiting per user/IP
   - Optionally add authentication middleware
   - Log errors but don't expose internal details to client

6. **Error Response Format:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

### Example Implementations

#### Go (Gin Framework)

```go
package main

import (
    "bytes"
    "encoding/json"
    "io"
    "net/http"
    "os"
    
    "github.com/gin-gonic/gin"
)

type ChatRequest struct {
    Messages []map[string]interface{} `json:"messages"`
    Tools    []map[string]interface{} `json:"tools,omitempty"`
}

func main() {
    r := gin.Default()
    
    r.POST("/api/chat", func(c *gin.Context) {
        apiKey := os.Getenv("OPENAI_API_KEY")
        if apiKey == "" {
            c.JSON(500, gin.H{"error": "OPENAI_API_KEY not configured"})
            return
        }
        
        var req ChatRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, gin.H{"error": "Invalid request body"})
            return
        }
        
        // Build OpenAI request
        openaiReq := map[string]interface{}{
            "model":    "gpt-4o-mini",
            "messages": req.Messages,
        }
        if len(req.Tools) > 0 {
            openaiReq["tools"] = req.Tools
        }
        
        body, _ := json.Marshal(openaiReq)
        
        httpReq, _ := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(body))
        httpReq.Header.Set("Content-Type", "application/json")
        httpReq.Header.Set("Authorization", "Bearer "+apiKey)
        
        resp, err := http.DefaultClient.Do(httpReq)
        if err != nil {
            c.JSON(500, gin.H{"error": err.Error()})
            return
        }
        defer resp.Body.Close()
        
        respBody, _ := io.ReadAll(resp.Body)
        
        var result map[string]interface{}
        json.Unmarshal(respBody, &result)
        
        c.JSON(resp.StatusCode, result)
    })
    
    r.Run(":8080")
}
```

#### Python (FastAPI)

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
import httpx
import os

app = FastAPI()

class ChatRequest(BaseModel):
    messages: List[dict]
    tools: Optional[List[dict]] = None

@app.post("/api/chat")
async def chat(request: ChatRequest):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    openai_request = {
        "model": "gpt-4o-mini",
        "messages": request.messages,
    }
    if request.tools:
        openai_request["tools"] = request.tools
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            json=openai_request,
        )
        
        return response.json()
```

---

## Docker Deployment

When deploying with Docker, pass the `OPENAI_API_KEY` as an environment variable:

```yaml
# docker-compose.yml
services:
  backend:
    image: your-backend-image
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    # Or use env_file:
    # env_file:
    #   - .env
```

```bash
# Build and run
OPENAI_API_KEY=sk-xxx docker-compose up -d
```

---

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** or secret managers (AWS Secrets Manager, HashiCorp Vault)
3. **Add rate limiting** to prevent abuse
4. **Add authentication** to restrict access to authorized users
5. **Log usage** for monitoring and cost tracking
6. **Set spending limits** in your OpenAI dashboard
