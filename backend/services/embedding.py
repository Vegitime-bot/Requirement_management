"""
Embedding Service for Requirement Similarity Matching
Supports OpenAI compatible and Ollama native embedding endpoints
"""

import os
import httpx
import math
from typing import List, Tuple

EMBEDDING_API_URL = os.getenv("EMBEDDING_API_URL", "http://localhost:11434")
EMBEDDING_API_KEY = os.getenv("EMBEDDING_API_KEY", "")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")


class EmbeddingService:
    def __init__(self):
        # Read environment variables at initialization time (after .env loaded)
        self.api_url = os.getenv("EMBEDDING_API_URL", "http://localhost:11434").rstrip('/')
        self.api_key = os.getenv("EMBEDDING_API_KEY", "")
        self.model = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
        self._cache = {}
        
        # Detect if using Ollama (has /api in URL or localhost:11434)
        self.is_ollama = '11434' in self.api_url or '/api' in self.api_url
    
    async def get_embedding(self, text: str) -> List[float]:
        """Get embedding for a text."""
        # Check cache
        if text in self._cache:
            return self._cache[text]
        
        try:
            # Try OpenAI compatible endpoint first
            embedding = await self._get_openai_embedding(text)
            if embedding:
                self._cache[text] = embedding
                return embedding
        except Exception as e:
            print(f"OpenAI endpoint failed: {e}")
        
        # Fallback to Ollama native endpoint
        try:
            embedding = await self._get_ollama_embedding(text)
            if embedding:
                self._cache[text] = embedding
                return embedding
        except Exception as e:
            print(f"Ollama endpoint failed: {e}")
        
        # Return zero vector as final fallback
        return [0.0] * 768
    
    async def _get_openai_embedding(self, text: str) -> List[float]:
        """Try OpenAI compatible /embeddings endpoint."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            
            response = await client.post(
                f"{self.api_url}/embeddings",
                headers=headers,
                json={
                    "model": self.model,
                    "input": text
                }
            )
            
            if response.status_code == 404:
                return None  # Try Ollama native
            
            response.raise_for_status()
            data = response.json()
            return data["data"][0]["embedding"]
    
    async def _get_ollama_embedding(self, text: str) -> List[float]:
        """Try Ollama native /api/embed endpoint."""
        # Use base URL without /v1 for Ollama native
        base_url = self.api_url.replace('/v1', '')
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{base_url}/api/embed",
                json={
                    "model": self.model,
                    "input": text
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["embeddings"][0]
    
    def _dot_product(self, a: List[float], b: List[float]) -> float:
        """Calculate dot product of two vectors."""
        return sum(x * y for x, y in zip(a, b))
    
    def _magnitude(self, v: List[float]) -> float:
        """Calculate magnitude (L2 norm) of a vector."""
        return math.sqrt(sum(x * x for x in v))
    
    def cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        mag_a = self._magnitude(a)
        mag_b = self._magnitude(b)
        
        if mag_a == 0 or mag_b == 0:
            return 0.0
        
        return self._dot_product(a, b) / (mag_a * mag_b)
    
    async def find_similar_requirements(
        self,
        new_req_text: str,
        existing_reqs: List[Tuple[str, str]],
        threshold: float = 0.7
    ) -> List[Tuple[str, float]]:
        """Find similar requirements using embeddings."""
        if not existing_reqs:
            return []
        
        # Get embedding for new requirement
        new_embedding = await self.get_embedding(new_req_text)
        
        # Get embeddings for existing requirements
        results = []
        for req_id, req_text in existing_reqs:
            existing_embedding = await self.get_embedding(req_text)
            similarity = self.cosine_similarity(new_embedding, existing_embedding)
            
            if similarity >= threshold:
                results.append((req_id, similarity))
        
        # Sort by similarity descending
        results.sort(key=lambda x: x[1], reverse=True)
        return results


# Singleton instance
embedding_service = EmbeddingService()
