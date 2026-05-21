"""
LLM Service for Requirements Management System
Supports OpenAI API compatible endpoints (including Ollama, custom endpoints)
"""

import os
import json
import re
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
    category: Optional[str] = None
    category_id: Optional[str] = None
    confidence: float
    is_product_requirement: bool
    reason: str


class LLMService:
    def __init__(self):
        self.api_url = os.getenv("LLM_API_URL", "http://localhost:11434/v1")
        self.api_key = os.getenv("LLM_API_KEY", "")
        self.model = os.getenv("LLM_MODEL", "llama3.1")

    # ── Non-requirement patterns (stricter) ──────────────────────────
    _VAGUE_PATTERNS = [
        re.compile(r'\b(?:look|appear|seem|feel|be|should be)\s+(?:modern|intuitive|good|nice|better|professional|user-friendly|clean|simple|easy)\b', re.I),
        re.compile(r'\b(?:modern|intuitive|professional|user-friendly|clean|simple)\s+(?:design|UI|interface|look|feel|appearance)\b', re.I),
        re.compile(r'\b(?:make it|make the)\s+.*\b(better|good|nice|modern|intuitive)\b', re.I),
        re.compile(r'\b(?:improve|enhance|upgrade|optimize)\s+(?:the|UX|UI|user experience|design)\b', re.I),
    ]

    _NON_REQ_PATTERNS = [
        re.compile(r'\b(?:deadline|due date|by\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week|end of|this week|asap))\b', re.I),
        re.compile(r'\b(?:please fix|plz fix|수정해|고쳐주|고쳐|fix the bug|fix bug)\b', re.I),
        re.compile(r'\b(?:meeting|미팅|회의|schedule|일정|call|call me|contact)\b', re.I),
        re.compile(r'\b(?:thanks|thank you|감사합니다|수고|best regards|cheers|regards)\b', re.I),
        re.compile(r'\b(?:please review|검토해|확인해|please check|take a look)\b', re.I),
        re.compile(r'\b(?:urgent request|긴급 요청|hotfix|hot fix|임시조치)\b', re.I),
        re.compile(r'\b(?:next version|다음 버전|upcoming release|이번 배포)\b', re.I),
        re.compile(r'\b(?:cc:|참조|attached|첨부|attachment)\b', re.I),
        re.compile(r'\b(?:i think|we need to discuss|let\'s discuss|논의가 필요)\b', re.I),
    ]

    # Document structure patterns (TOC, history, abbreviations, etc.)
    _DOC_STRUCTURE_PATTERNS = [
        re.compile(r'\b(?:table of contents|목차|contents|index)\b', re.I),
        re.compile(r'\b(?:revision history|version history|change history|히스토리|변경 이력|revision|revisions)\b', re.I),
        re.compile(r'\b(?:abbreviations|acronyms|definitions|용어|약어|정의|glossary)\b', re.I),
        re.compile(r'\b(?:references|참고문헌|bibliography|참조)\b', re.I),
        re.compile(r'\b(?:appendix|appendices|부록|appendix [a-z])\b', re.I),
        re.compile(r'\b(?:introduction|overview|scope|purpose|목적|범위|개요)\b', re.I),
        re.compile(r'^\s*(?:\d+\.)+\s*(?:introduction|overview|scope|purpose|목차|히스토리|약어|정의|참조|부록)', re.I),
        re.compile(r'^\s*(?:chapter|section|part)\s+\d+', re.I),
        re.compile(r'^\s*\d+\.\d+\s+(?:introduction|overview|history|abbreviations|references|appendix)', re.I),
    ]

    _REQ_KEYWORDS = [
        'must', 'shall', 'should', 'need to', 'requires', 'needs',
        'support', 'provide', 'implement', 'enable', 'allow',
        '시스템은', '사용자는', 'shall', 'must be able to',
        'shall support', 'shall provide', 'must support',
        '기능', '요구사항', '필수', 'should be able',
        'system must', 'system shall', 'user must', 'user shall',
    ]

    def _is_likely_non_requirement(self, text: str) -> tuple[bool, str]:
        """Heuristic check if a text is NOT a product requirement."""
        lowered = text.lower()
        
        # 0. Vague/quality statements without specific behavior
        for pattern in self._VAGUE_PATTERNS:
            if pattern.search(text):
                return True, f"Vague quality statement without specific behavior: '{pattern.pattern[:40]}...'"
        
        # 1. Non-requirement patterns
        for pattern in self._NON_REQ_PATTERNS:
            if pattern.search(text):
                return True, f"Non-requirement pattern: '{pattern.pattern[:40]}...'"
        
        # 2. Document structure patterns (TOC, history, abbreviations)
        for pattern in self._DOC_STRUCTURE_PATTERNS:
            if pattern.search(text):
                return True, f"Document structure element (not a requirement): '{pattern.pattern[:40]}...'"
        
        # 3. Very short sentences (< 15 chars) are likely not requirements
        if len(text.strip()) < 15:
            return True, "Too short to be a requirement"
        
        # 4. Questions are not requirements
        if text.strip().endswith('?') or '?' in text[:30]:
            return True, "Question, not a requirement"
        
        # 4. Check for requirement keywords
        has_req_keyword = any(kw in lowered for kw in self._REQ_KEYWORDS)
        
        # 5. Administrative/process phrases
        admin_phrases = ['please', 'plz', '수정', '고쳐', '확인', '검토', 'cc']
        is_administrative = any(p in lowered for p in admin_phrases) and not has_req_keyword
        
        if is_administrative:
            return True, "Administrative/process phrase without requirement keywords"
        
        # 6. Deadline/time without requirement keywords
        time_words = ['by', 'until', 'before', 'after', 'during', '납기', '기한']
        has_time = any(w in lowered for w in time_words)
        if has_time and not has_req_keyword:
            return True, "Time reference without requirement keywords"
        
        return False, ""

    def _post_process(self, requirements: List[dict], context_text: str) -> List[ExtractedRequirement]:
        """Post-process LLM output with stricter filtering and deduplication."""
        result = []
        seen = set()  # Deduplication — exact title match
        seen_similar = []  # Semantic deduplication — similar content
        
        for i, req in enumerate(requirements):
            title = req.get("title", "").strip()
            description = req.get("description", "").strip() or title
            
            # Skip empty
            if not title and not description:
                continue
            
            # Use title+description for analysis
            full_text = f"{title} {description}".strip()
            
            # === DEDUPLICATION ===
            # 1. Exact title match
            title_lower = title.lower()
            if title_lower in seen:
                continue
            seen.add(title_lower)
            
            # 2. Semantic deduplication — check if very similar to existing
            is_duplicate = False
            for existing_text in seen_similar:
                # Simple similarity: check if >70% words overlap
                existing_words = set(existing_text.lower().split())
                new_words = set(full_text.lower().split())
                if len(existing_words) > 0 and len(new_words) > 0:
                    overlap = len(existing_words & new_words)
                    similarity = overlap / max(len(existing_words), len(new_words))
                    if similarity > 0.7:  # 70% word overlap = duplicate
                        is_duplicate = True
                        break
            
            if is_duplicate:
                continue
            seen_similar.append(full_text[:200])  # Store truncated for comparison
            
            # Stricter heuristic check
            is_non_req, reason = self._is_likely_non_requirement(full_text)
            
            # Override LLM's is_product_requirement if our heuristic says otherwise
            llm_is_req = req.get("is_product_requirement", True)
            
            if is_non_req:
                is_product_requirement = False
                confidence = 0.95
                final_reason = f"[FILTERED] {reason}"
            else:
                is_product_requirement = llm_is_req
                # Confidence based on requirement keyword presence
                has_req_kw = any(kw in full_text.lower() for kw in self._REQ_KEYWORDS)
                if has_req_kw:
                    confidence = 0.92 if is_product_requirement else 0.5
                else:
                    confidence = 0.6 if is_product_requirement else 0.3
                final_reason = req.get("reason", "Extracted by LLM")
            
            result.append(ExtractedRequirement(
                title=title[:120] if title else f"Item {i+1}",
                description=description[:500] if description else title,
                priority=self._normalize_priority(req.get("priority", "medium")),
                category=req.get("category"),
                confidence=round(confidence, 2),
                is_product_requirement=is_product_requirement,
                reason=final_reason
            ))
        
        return result

    def _normalize_priority(self, priority: str) -> str:
        """Normalize priority values."""
        p = priority.lower().strip()
        if p in ['critical', 'crit', 'p0', 'must']:
            return 'high'  # Map critical to high for simplicity
        elif p in ['high', 'important', 'p1', 'major']:
            return 'high'
        elif p in ['medium', 'normal', 'p2', 'moderate']:
            return 'medium'
        elif p in ['low', 'minor', 'p3', 'optional', 'nice to have']:
            return 'low'
        else:
            return 'medium'

    async def extract_requirements(self, context_text: str, source_type: str, categories: Optional[List[dict]] = None) -> List[ExtractedRequirement]:
        """Extract requirements from raw context using LLM with post-processing."""
        
        # Build category guidance if categories are provided
        category_guidance = ""
        if categories:
            cat_lines = []
            for cat in categories:
                code = cat.get("code", "")
                name = cat.get("name", "")
                desc = cat.get("description", "")
                if code and name:
                    cat_lines.append(f'  "{code}" - {name}' + (f' ({desc})' if desc else ''))
            if cat_lines:
                category_guidance = "CATEGORY CLASSIFICATION:\nFor each requirement, first try to assign the most appropriate category code from the following existing list:\n\n" + "\n".join(cat_lines) + "\n\nIf none of the existing categories match closely, you MAY suggest a NEW category code (short uppercase abbreviation like SEC, UI, CORE, PERF, etc.) that describes the requirement's domain. The new category should be descriptive and unique.\n"
        else:
            # No categories defined - ask LLM to suggest appropriate categories
            category_guidance = "CATEGORY CLASSIFICATION:\nNo categories have been defined for this product yet. For each requirement, suggest an appropriate category code (short uppercase abbreviation like SEC, UI, CORE, PERF, etc.) based on the requirement's nature. The category should describe the domain/area of the requirement (e.g., security, user interface, performance, core functionality).\n"
        
        system_prompt = f"""You are a strict requirement extraction specialist. Analyze raw text and extract ONLY genuine PRODUCT REQUIREMENTS.

CRITICAL RULES:
1. Extract ONLY statements that describe what the system/product MUST or SHOULD do (capabilities, features, behaviors)
2. REJECT and mark as non-requirement:
   - Deadlines, dates, schedules ("by Friday", "next week")
   - Bug reports or fix requests ("fix the login bug", "resolve the issue")
   - Questions or requests for discussion ("should we support...?")
   - Administrative notes ("cc: John", "attached file", "thanks")
   - Process notes ("please review", "let me know", "discuss in meeting")
   - General wishes without specific behavior ("make it better", "improve UX")
   - Marketing/sales language ("best in class", "world-class", "innovative")
   - Vague statements without measurable criteria
   - Document structure elements: table of contents, revision history, abbreviations list, references, appendices, introductions, overviews
   - Section headers or chapter titles without specific requirements

3. EACH extracted item MUST be a unique requirement. Do NOT extract:
   - Duplicate or near-duplicate requirements (same meaning in different words)
   - The same requirement mentioned multiple times in different sections
   - Summary statements that just restate other requirements

4. Each requirement MUST have:
   - A clear, specific capability or behavior the system should exhibit
   - A way to verify/test it (measurable, observable)
   - No ambiguity

5. Priority assignment:
   - "critical/high": Core functionality, system cannot work without it
   - "medium": Important feature but system works without it
   - "low": Nice-to-have, enhancement, optional

{category_guidance}
OUTPUT FORMAT - Valid JSON array ONLY:
[
  {{
    "title": "Short, clear requirement title (max 120 chars)",
    "description": "Detailed, specific description with measurable criteria",
    "priority": "high/medium/low",
    "category": "Category code from the list above (e.g., CORE, SEC)",
    "is_product_requirement": true/false,
    "reason": "Why this is or isn't a product requirement"
  }}
]

EXAMPLES:

GOOD (Product Requirements):
- "The system must support OAuth2 authentication with Google and GitHub providers" -> is_product_requirement: true
- "Users shall be able to export data to CSV and JSON formats" -> is_product_requirement: true
- "The application shall handle concurrent users up to 1000 without performance degradation" -> is_product_requirement: true

BAD (Non-Requirements - must be marked false):
- "Please fix the login bug ASAP" -> is_product_requirement: false (bug report, not requirement)
- "Deadline is end of this month" -> is_product_requirement: false (deadline)
- "We should discuss adding dark mode" -> is_product_requirement: false (discussion topic)
- "Make the UI look better" -> is_product_requirement: false (too vague)
- "Can you check the attached document?" -> is_product_requirement: false (administrative)
- "1. Introduction" or "Table of Contents" -> is_product_requirement: false (document structure)
- "Revision History: v1.0 Initial release" -> is_product_requirement: false (metadata)
- "Abbreviations: API - Application Programming Interface" -> is_product_requirement: false (glossary)

STRICT: 
- If in doubt, mark as is_product_requirement: false. Quality over quantity.
- Never extract the same requirement twice, even if worded differently.
- Never extract section headers, document structure, or metadata as requirements."""

        user_prompt = f"Source type: {source_type}\n\nContext:\n{context_text}\n\nExtract ONLY genuine product requirements. Return valid JSON array. Mark non-requirements with is_product_requirement: false."

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
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
                        "temperature": 0.2,  # Lower for more deterministic output
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
                    parts = content.split("```")
                    for part in parts:
                        if part.strip().startswith('['):
                            content = part.strip()
                            break
                
                # Try to find JSON array in the text
                json_match = re.search(r'\[.*?\]', content, re.DOTALL)
                if json_match:
                    try:
                        requirements = json.loads(json_match.group(0))
                    except json.JSONDecodeError:
                        requirements = []
                else:
                    requirements = []
                
                # Post-process with stricter filtering
                if requirements:
                    return self._post_process(requirements, context_text)
                else:
                    # If LLM returned no valid JSON, try fallback
                    return self._fallback_extraction(context_text)
                
        except Exception as e:
            print(f"LLM Error: {e}")
            return self._fallback_extraction(context_text)

    def _fallback_extraction(self, context_text: str) -> List[ExtractedRequirement]:
        """Advanced fallback extraction with sentence-level analysis."""
        extracted = []
        
        # Split by sentences
        sentences = re.split(r'(?<=[.!?。！？])\s+', context_text)
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 10:
                continue
            
            # Skip if it's clearly not a requirement
            is_non_req, reason = self._is_likely_non_requirement(sentence)
            if is_non_req:
                extracted.append(ExtractedRequirement(
                    title=sentence[:80] + ('...' if len(sentence) > 80 else ''),
                    description=sentence,
                    priority="low",
                    confidence=0.95,
                    is_product_requirement=False,
                    reason=f"[FILTERED] {reason}"
                ))
                continue
            
            # Check for vague/quality-only statements (no specific behavior)
            lowered = sentence.lower()
            vague_only = (
                any(p.search(sentence) for p in self._VAGUE_PATTERNS) and
                not any(kw in lowered for kw in ['must', 'shall', 'need to', 'requires', 'support', 'provide', 'implement', 'enable'])
            )
            if vague_only:
                extracted.append(ExtractedRequirement(
                    title=sentence[:80] + ('...' if len(sentence) > 80 else ''),
                    description=sentence,
                    priority="low",
                    confidence=0.95,
                    is_product_requirement=False,
                    reason="[FILTERED] Vague quality statement without specific behavior or requirement keywords"
                ))
                continue
            
            # Check for strong requirement keywords
            lowered = sentence.lower()
            has_strong_kw = any(kw in lowered for kw in self._REQ_KEYWORDS)
            
            if has_strong_kw:
                priority = "high" if any(kw in lowered for kw in ['must', 'shall', 'critical', '필수']) else "medium"
                extracted.append(ExtractedRequirement(
                    title=sentence[:100] + ('...' if len(sentence) > 100 else ''),
                    description=sentence,
                    priority=priority,
                    confidence=0.75,
                    is_product_requirement=True,
                    reason="Contains requirement keywords (fallback extraction)"
                ))
            else:
                # Weak match - mark as low confidence
                extracted.append(ExtractedRequirement(
                    title=sentence[:100] + ('...' if len(sentence) > 100 else ''),
                    description=sentence,
                    priority="low",
                    confidence=0.4,
                    is_product_requirement=False,
                    reason="[FILTERED] No clear requirement keywords"
                ))
        
        return extracted


# Singleton instance
llm_service = LLMService()
