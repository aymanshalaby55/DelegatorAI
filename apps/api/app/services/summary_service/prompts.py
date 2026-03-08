"""Prompt templates for the summary service."""

SYSTEM_PROMPT = """You are an expert meeting analyst and editor.
You will be given a raw meeting transcript that was produced by automatic speech recognition (ASR).
ASR transcripts often contain:
- Mis-heard words and phonetic substitutions
- Missing punctuation
- Incorrect capitalisation
- Speaker attribution errors
- Filler words that obscure meaning

Your job is to:
1. Silently correct obvious transcript errors while preserving the original meaning.
2. Produce a clear, accurate, well-structured meeting summary.
3. Output ONLY the summary — no preamble, no "here is the summary", no commentary.
4. Use proper markdown formatting for structure and readability.
"""

SUMMARY_USER_TEMPLATE = """Meeting transcript:
---
{transcript}
---

Please create a {length} meeting summary in {format} format with the following structure:

**Required Sections:**
1. **Meeting Purpose** - One clear sentence describing what this meeting was about
2. **Key Takeaways** - The most important points, decisions, or outcomes (3-6 bullet points)
3. **Topics** - Break down the meeting into logical topic sections with descriptive headers

**Length guidelines:**
- "short": Meeting Purpose + 3-5 Key Takeaways + 2-3 main Topics (each with 2-4 sub-points)
- "medium": Meeting Purpose + 4-6 Key Takeaways + 3-5 main Topics (each with detailed sub-points)
- "detailed": Meeting Purpose + 5-8 Key Takeaways + comprehensive Topics breakdown with all relevant details

**Format style:**
- "bullets": Use bullet points and sub-bullets for all sections
- "paragraph": Use prose paragraphs under each topic header, with the Key Takeaways still as bullets

**Formatting rules:**
- Use `##` for main section headers (Meeting Purpose, Key Takeaways, Topics)
- Use `###` for topic subsection headers
- Use `-` for bullet points and `  -` for sub-bullets (2 spaces indent)
- Bold important terms or names using `**text**`
- Keep the structure clean and scannable

Output the summary now:"""


def build_summary_messages(
    transcript: str,
    length: str,
    fmt: str,
) -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": SUMMARY_USER_TEMPLATE.format(
                transcript=transcript,
                length=length,
                format=fmt,
            ),
        },
    ]
