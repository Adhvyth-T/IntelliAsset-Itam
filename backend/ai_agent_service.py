# ai_agent_service.py
"""
AI Agent Service using OpenRouter for:
1. Vision-based text extraction from device images
2. Device information enrichment (manufacturer, model, specs)
3. User assignment suggestions based on device type
"""

import os
import re
import json
import base64
from typing import Optional, Dict, Any, List, Tuple
import httpx
from datetime import datetime

# OpenRouter Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY","your_openrouter_api_key_here")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Free models available on OpenRouter
VISION_MODEL = "mistralai/mistral-small-3.2-24b-instruct:free"  # Free vision model
TEXT_MODEL = "meta-llama/llama-3.2-3b-instruct:free"  # Free text model


class AIAgentService:
    """AI Agent for intelligent device scanning and data enrichment"""
    
    def __init__(self, api_key: str = OPENROUTER_API_KEY):
        self.api_key = api_key
        self.base_url = OPENROUTER_BASE_URL
        self.client = httpx.AsyncClient(
            timeout=60.0,
            headers={
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "ITAM System"
            }
        )
    
    async def extract_device_info_from_image(self, image_data: str) -> Dict[str, Any]:
        """
        Extract device information from image using vision model
        Replaces traditional OCR with AI-powered image analysis
        
        Args:
            image_data: Base64 encoded image string (data:image/jpeg;base64,...)
        
        Returns:
            Dictionary with extracted information
        """
        try:
            # Prepare the prompt for device information extraction
            prompt = """Analyze this device image and extract ALL visible text and information. Focus on:

1. Serial Number (S/N, Serial, SN, etc.)
2. Model Number/Name
3. Manufacturer/Brand name
4. Asset Tag or ID numbers
5. Any other identifiable text (MAC address, barcodes, QR codes if readable)

Return ONLY a JSON object with this exact structure (use null for missing fields):
{
    "serial_number": "extracted serial number",
    "model": "model name/number",
    "manufacturer": "brand/manufacturer name",
    "asset_tag": "asset tag if visible",
    "additional_ids": ["any other IDs found"],
    "all_text": "all visible text in the image",
    "confidence": "high/medium/low"
}

Be thorough - extract ALL text you can see, even if partially visible."""

            # Call OpenRouter vision API
            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                json={
                    "model": VISION_MODEL,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": prompt
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": image_data
                                    }
                                }
                            ]
                        }
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1000
                }
            )
            
            if response.status_code != 200:
                return {
                    "error": f"OpenRouter API error: {response.status_code}",
                    "details": response.text
                }
            
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # Parse JSON from response
            try:
                # Extract JSON from markdown code blocks if present
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                extracted_data = json.loads(content)
                extracted_data["extraction_timestamp"] = datetime.utcnow().isoformat()
                extracted_data["model_used"] = VISION_MODEL
                
                return extracted_data
            except json.JSONDecodeError:
                # Fallback: extract key information from text
                return {
                    "raw_text": content,
                    "error": "Could not parse structured data",
                    "extraction_timestamp": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            return {
                "error": f"Image analysis failed: {str(e)}",
                "extraction_timestamp": datetime.utcnow().isoformat()
            }
    
    async def enrich_device_data(
        self, 
        extracted_info: Dict[str, Any],
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Enrich device data with additional information using AI
        Determines device type, category, and suggests additional metadata
        
        Args:
            extracted_info: Data extracted from image
            context: Optional context about the device location/department
        
        Returns:
            Enriched device information
        """
        try:
            # Build enrichment prompt
            prompt = f"""You are an IT asset management specialist. Based on the following device information, provide detailed metadata:

Extracted Information:
{json.dumps(extracted_info, indent=2)}

{f'Context: {context}' if context else ''}

Analyze this information and return ONLY a JSON object with:
{{
    "device_type": "Laptop/Desktop/Server/Monitor/Printer/Phone/Tablet/Network Device/Other",
    "category": "Hardware/Software/Network/Peripheral",
    "likely_manufacturer": "best guess for manufacturer if not clear",
    "suggested_name": "human-readable device name",
    "device_specs": "any specifications you can infer",
    "estimated_age": "approximate age if model suggests it",
    "recommendations": ["any setup or categorization recommendations"],
    "confidence_score": 0.0-1.0
}}

Be practical and conservative in your assessments."""

            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                json={
                    "model": TEXT_MODEL,
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": 0.4,
                    "max_tokens": 800
                }
            )
            
            if response.status_code != 200:
                return {"error": f"Enrichment API error: {response.status_code}"}
            
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # Parse JSON
            try:
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                enriched_data = json.loads(content)
                enriched_data["enrichment_timestamp"] = datetime.utcnow().isoformat()
                
                return enriched_data
            except json.JSONDecodeError:
                return {
                    "raw_response": content,
                    "error": "Could not parse enrichment data"
                }
                
        except Exception as e:
            return {"error": f"Enrichment failed: {str(e)}"}
    
    async def suggest_user_assignment(
        self,
        device_info: Dict[str, Any],
        available_users: List[Dict[str, Any]],
        department: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Suggest user assignments based on device type and user profiles
        
        Args:
            device_info: Device information
            available_users: List of users in system
            department: Optional department filter
        
        Returns:
            List of suggested user assignments with confidence scores
        """
        try:
            # Filter users by department if specified
            if department:
                available_users = [
                    u for u in available_users 
                    if u.get("department") == department
                ]
            
            if not available_users:
                return []
            
            # Create user summary
            user_summary = []
            for user in available_users[:20]:  # Limit to 20 users to stay within token limits
                user_summary.append({
                    "name": user.get("name"),
                    "department": user.get("department"),
                    "role": user.get("role"),
                    "current_assets": user.get("assetsCount", 0)
                })
            
            prompt = f"""Given this device and list of users, suggest the top 3 most appropriate user assignments:

Device:
{json.dumps(device_info, indent=2)}

Available Users:
{json.dumps(user_summary, indent=2)}

Consider:
- Device type vs user role
- Department match
- Current asset load (prefer users with fewer assets for better distribution)
- Device specifications vs likely user needs

Return ONLY a JSON array of top 3 suggestions:
[
    {{
        "user_name": "exact name from list",
        "confidence": 0.0-1.0,
        "reason": "brief explanation"
    }}
]"""

            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                json={
                    "model": TEXT_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 500
                }
            )
            
            if response.status_code != 200:
                return []
            
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            try:
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                suggestions = json.loads(content)
                return suggestions if isinstance(suggestions, list) else []
            except json.JSONDecodeError:
                return []
                
        except Exception as e:
            print(f"User suggestion error: {e}")
            return []
    
    async def process_scan_workflow(
        self,
        image_data: str,
        available_users: Optional[List[Dict[str, Any]]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Complete end-to-end scan workflow:
        1. Extract device info from image
        2. Enrich with additional data
        3. Suggest user assignment
        
        Args:
            image_data: Base64 image
            available_users: List of users for assignment suggestions
            context: Additional context (department, location, etc.)
        
        Returns:
            Complete processed device information ready for database insertion
        """
        try:
            # Step 1: Extract from image
            print("🔍 Extracting device information from image...")
            extracted = await self.extract_device_info_from_image(image_data)
            
            if "error" in extracted:
                return {
                    "status": "error",
                    "message": extracted.get("error", "Extraction failed"),
                    "details": extracted
                }
            
            # Step 2: Enrich data
            print("🧠 Enriching device data with AI...")
            context_str = None
            if context:
                context_str = f"Department: {context.get('department', 'Unknown')}, Location: {context.get('location', 'Unknown')}"
            
            enriched = await self.enrich_device_data(extracted, context_str)
            
            # Step 3: Suggest user assignment
            user_suggestions = []
            if available_users:
                print("👥 Generating user assignment suggestions...")
                user_suggestions = await self.suggest_user_assignment(
                    {**extracted, **enriched},
                    available_users,
                    context.get("department") if context else None
                )
            
            # Step 4: Build complete device record
            device_record = {
                "serial_number": extracted.get("serial_number") or extracted.get("asset_tag"),
                "name": enriched.get("suggested_name") or f"Device {extracted.get('serial_number', 'Unknown')[:8]}",
                "type": enriched.get("device_type", "Other"),
                "category": enriched.get("category", "Hardware"),
                "manufacturer": extracted.get("manufacturer") or enriched.get("likely_manufacturer"),
                "model": extracted.get("model"),
                "status": "Active",
                "tags": [extracted.get("serial_number")] if extracted.get("serial_number") else [],
                "notes": self._build_notes(extracted, enriched),
                "extraction_data": {
                    "extracted_info": extracted,
                    "enriched_info": enriched,
                    "processing_timestamp": datetime.utcnow().isoformat()
                }
            }
            
            # Add context if provided
            if context:
                if context.get("department"):
                    device_record["department"] = context["department"]
                if context.get("location"):
                    device_record["location"] = context["location"]
            
            return {
                "status": "success",
                "device_record": device_record,
                "user_suggestions": user_suggestions,
                "confidence": enriched.get("confidence_score", 0.5),
                "extracted_text": extracted.get("all_text", ""),
                "recommendations": enriched.get("recommendations", [])
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Workflow processing failed: {str(e)}"
            }
    
    def _build_notes(self, extracted: Dict, enriched: Dict) -> str:
        """Build comprehensive notes from extraction and enrichment data"""
        notes = [
            f"Device scanned and processed via AI agent on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}",
            f"\nExtraction confidence: {extracted.get('confidence', 'Unknown')}",
        ]
        
        if extracted.get("all_text"):
            notes.append(f"\nAll extracted text: {extracted['all_text']}")
        
        if enriched.get("device_specs"):
            notes.append(f"\nSpecifications: {enriched['device_specs']}")
        
        if enriched.get("estimated_age"):
            notes.append(f"\nEstimated age: {enriched['estimated_age']}")
        
        if enriched.get("recommendations"):
            notes.append(f"\nRecommendations: {', '.join(enriched['recommendations'])}")
        
        return "\n".join(notes)
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


# Singleton instance
_agent_service = None

def get_ai_agent() -> AIAgentService:
    """Get or create AI agent service instance"""
    global _agent_service
    if _agent_service is None:
        _agent_service = AIAgentService()
    return _agent_service