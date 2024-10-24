import speech_recognition as sr
from typing import Optional
import requests

class Assistant:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        self.conversation_history = []
        self.ollama_url = "http://localhost:11434/api/chat"  # Default Ollama API endpoint
        
    def listen(self) -> Optional[str]:
        """Capture and transcribe speech."""
        if self.microphone.stream is not None:
            # If microphone is already in use, return None or handle the conflict
            print("Microphone is already in use.")
            return None
        
        with self.microphone as source:
            self.recognizer.adjust_for_ambient_noise(source)
            try:
                audio = self.recognizer.listen(source, timeout=5)
                return self.recognizer.recognize_google(audio)
            except sr.UnknownValueError:
                return None
            except sr.RequestError as e:
                print(f"Speech recognition error: {e}")
                return None

    async def get_response(self, user_input: str) -> str:
        """Get response from Llama model via Ollama."""
        try:
            # Add user input to history
            self.conversation_history.append({
                "role": "user",
                "content": user_input
            })
            
            # Format messages for Ollama
            messages = [{"role": "system", "content": "You are a helpful assistant."}]
            messages.extend(self.conversation_history)
            
            # Prepare the request payload
            payload = {
                "model": "llama3.2:3b",
                "messages": messages,
                "stream": False
            }
            
            # Make request to Ollama API
            response = requests.post(self.ollama_url, json=payload)
            response.raise_for_status()
            
            # Parse response
            response_data = response.json()
            assistant_response = response_data['message']['content']
            
            # Add assistant response to history
            self.conversation_history.append({
                "role": "assistant",
                "content": assistant_response
            })
            
            return assistant_response
            
        except requests.exceptions.RequestException as e:
            return f"Error connecting to Ollama: {str(e)}"
        except KeyError as e:
            return f"Error parsing Ollama response: {str(e)}"
        except Exception as e:
            return f"Error: {str(e)}"
    
    def get_history(self):
        """Get conversation history."""
        return self.conversation_history

    def set_ollama_url(self, url: str):
        """Set custom Ollama API endpoint."""
        self.ollama_url = url