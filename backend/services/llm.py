"""
LLM Service for Requirements Management System
Supports OpenAI API compatible endpoints (including Ollama, custom endpoints)
"""

import os
import json
import httpx
from typing import List, Optional
from pydantic import BaseModel

LLM_API_URL = os.getenv("LLM_API_URL", "http://localhost:11434/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3.1")


class ExtractedRequirement(BaseModel):
    title: str
    description: str
    priority: str
    confidence: float
    is_product_requirement: bool
    reason: str


class LLMService:
    def __init__(self):
        # Read environment variables at initialization time (after .env loaded)
        self.api_url = os.getenv("LLM_API_URL", "http://localhost:11434/v1")
        self.api_key = os.getenv("LLM_API_KEY", "")
        self.model = os.getenv("LLM_MODEL", "llama3.1")
        
    async def extract_requirements(self, context_text: str, source_type: str) -> List[ExtractedRequirement]:
        """Extract requirements from raw context using LLM."""
        
        system_prompt = """You are a requirement extraction specialist. Your task is to analyze raw text (emails, specs, documents, meeting notes) and extract PRODUCT REQUIREMENTS only.

Rules:
1. Extract ONLY product requirements (what the system/product should do)
2. Filter OUT non-requirements: deadlines, dates, requests for fixes, politeness phrases, process notes
3. Each requirement should be specific, actionable, and clear
4. Assign priority: "critical" (must have), "high" (important), "medium" (nice to have), or "low" (optional)

Output format: JSON array of requirements with this structure:
[
  {
    "title": "Short, clear requirement title",
    "description": "Detailed description of the requirement",
    "priority": "critical/high/medium/low",
    "is_product_requirement": true/false,
    "reason": "Why this is or isn't a product requirement"
  }
]

Examples:
- "System must support OAuth2 authentication" -> Product requirement
- "Please fix the login bug ASAP" -> NOT a product requirement (it's a request/bug report)
- "Deadline is next Friday" -> NOT a product requirement (it's a deadline)
- "Users should be able to export data to CSV" -> Product requirement"""

        user_prompt = f"Source type: {source_type}\n\nContext:\n{context_text}\n\nExtract product requirements from this context. Return only valid JSON array."

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                headers = {"Content-Type": "application/json"}
                if self.api_key:
                    headers["Authorization"] = f"Bearer {self.api_key}"
                
                response = await client.post(
                    f"{self.api_url}/chat/completions",
                    headers=headers,
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.3,
                        "stream": False
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                # Parse LLM response
                content = data["choices"][0]["message"]["content"]
                
                # Extract JSON from markdown code blocks if present
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                requirements = json.loads(content)
                
                # Validate and add confidence
                result = []
                for i, req in enumerate(requirements):
                    result.append(ExtractedRequirement(
                        title=req.get("title", f"Requirement {i+1}"),
                        description=req.get("description", ""),
                        priority=req.get("priority", "medium"),
                        confidence=0.9 if req.get("is_product_requirement") else 0.3,
                        is_product_requirement=req.get("is_product_requirement", True),
                        reason=req.get("reason", "")
                    ))
                
                return result
                
        except Exception as e:
            print(f"LLM Error: {e}")
            # Fallback to simple extraction
            return self._fallback_extraction(context_text)
    
    def _fallback_extraction(self, context_text: str) -> List[ExtractedRequirement]:
        """Simple keyword-based fallback extraction."""
        extracted = []
        lines = context_text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check for requirement keywords
            is_req = any(kw in line.lower() for kw in [
                'must', 'should', 'shall', 'need', 'requires', 
                'support', 'provide', 'implement', 'enable',
                '시스템은', '사용자는', '기능', '요구'
            ])
            
            # Detect non-requirements
            is_non_req = any(kw in line.lower() for kw in [
                'deadline', '납기', 'asap', 'please fix', 'plz', '수정해주세요',
                'due date', 'by tomorrow', 'by next week', 'urgent request'
            ])
            
            if is_req and not is_non_req and len(line) > 10:
                extracted.append(ExtractedRequirement(
                    title=line[:60] + ('...' if len(line) > 60 else ''),
                    description=line,
                    priority="high" if any(kw in line.lower() for kw in ['critical', 'must', 'shall']) else "medium",
                    confidence=0.7,
                    is_product_requirement=True,
                    reason="Contains requirement keywords"
                ))
            elif is_non_req:
                extracted.append(ExtractedRequirement(
                    title=f"[Non-Requirement] {line[:40]}...",
                    description=line,
                    priority="low",
                    confidence=0.9,
                    is_product_requirement=False,
                    reason="Contains non-requirement indicators (deadline, request, etc.)"
                ))
        
        return extracted


# Singleton instance
llm_service = LLMService()
