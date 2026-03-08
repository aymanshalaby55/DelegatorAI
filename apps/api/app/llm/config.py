"""
LLM model configuration.

Maps provider names (matching `default_llm_provider` in Settings) to their
default model string in LiteLLM format.  Add new entries here when you want
to support an additional provider without touching other files.
"""

# should follow this -> provider/model-name
DEFAULT_MODELS: dict[str, str] = {
    "gemini": "gemini/gemini-2.5-flash",
}

PROVIDER_API_KEY_ENV: dict[str, str] = {
    "gemini": "GEMINI_API_KEY",
}
