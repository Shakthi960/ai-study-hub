import json
from groq import Groq
from flask import current_app


def _get_client():
    api_key = current_app.config.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not configured")
    return Groq(api_key=api_key)


def ai_chat(user_message, chapter_contents=None):
    client = _get_client()
    messages = [
        {
            "role": "system",
            "content": (
                "You are a helpful AI study assistant. You help students understand "
                "their study materials. Be concise, accurate, and educational. "
                "Use markdown formatting when appropriate."
            ),
        }
    ]

    if chapter_contents:
        context = "Here is the relevant study material:\n\n"
        for item in chapter_contents:
            context += f"### {item['topic_title']}\n{item['body']}\n\n"
        messages.append({"role": "system", "content": context})

    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.7,
        max_tokens=2048,
    )
    return response.choices[0].message.content


def generate_quiz(chapter_contents, chapter_title=""):
    client = _get_client()

    combined_content = ""
    for item in chapter_contents:
        combined_content += f"### {item['topic_title']}\n{item['body']}\n\n"

    prompt = f"""Based on the following study material from chapter "{chapter_title}", 
generate exactly 10 multiple-choice quiz questions. 

Study Material:
{combined_content}

Return ONLY a valid JSON array (no markdown, no code fences) where each object has:
- "question": the question string
- "options": an array of exactly 4 option strings
- "correct_answer": the index of the correct option (0-3)
- "explanation": a brief explanation of the correct answer

Return exactly 10 questions. Make them varied in difficulty."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
        max_tokens=4096,
    )

    text = response.choices[0].message.content.strip()

    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)

    questions = json.loads(text)
    return questions[:10]
