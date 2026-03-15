import json
import logging
from typing import Optional
import httpx

logger = logging.getLogger(__name__)


def format_utterances(utterances: list) -> Optional[str]:
    lines = []
    for entry in utterances:
        if not isinstance(entry, dict):
            continue
        speaker = entry.get("speaker", entry.get("name", entry.get("channel")))
        if speaker is None:
            speaker = "Speaker"
        elif isinstance(speaker, int):
            speaker = f"Speaker {speaker + 1}"
        else:
            speaker = str(speaker)

        text = entry.get("text", "")
        if isinstance(text, list):
            text = " ".join(
                w.get("word", w.get("text", "")) if isinstance(w, dict) else str(w)
                for w in text
            ).strip()
        else:
            text = str(text).strip()

        if text:
            lines.append(f"{speaker}: {text}")

    return "\n".join(lines) if lines else None


async def fetch_and_parse_transcript(transcript_url: str) -> Optional[str]:
    """Downloads a transcript URL and returns formatted text. Raises on network error."""
    async with httpx.AsyncClient() as client:
        response = await client.get(transcript_url, timeout=30)
        response.raise_for_status()
        fetched_data = response.json()

    transcript_json = fetched_data

    if isinstance(fetched_data, dict) and "transcript" in fetched_data:
        raw = fetched_data["transcript"]
        if isinstance(raw, str):
            try:
                transcript_json = json.loads(raw)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to decode stringified transcript JSON: {e}")

    elif isinstance(fetched_data, str):
        try:
            transcript_json = json.loads(fetched_data)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode stringified transcript response: {e}")

    if isinstance(transcript_json, dict) and "result" in transcript_json:
        transcript_json = transcript_json["result"]

    utterances = None
    if isinstance(transcript_json, dict):
        utterances = transcript_json.get("utterances") or transcript_json.get(
            "messages"
        )
        if not isinstance(utterances, list):
            utterances = None
    elif isinstance(transcript_json, list):
        utterances = transcript_json

    return format_utterances(utterances) if utterances else None
