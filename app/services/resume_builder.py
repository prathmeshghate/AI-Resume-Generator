from __future__ import annotations

from typing import Dict, List

from app.models import (
    BulletPoint,
    ExperienceInput,
    ExperienceSection,
    JobDescription,
    ResumeRequest,
    ResumeResponse,
)
from app.services.model_service import get_model_service


SYSTEM_PROMPT = """
You are a senior resume writer and career coach.

Your job is to take a candidate's raw career data and a target job description,
then produce optimized resume content that:
- Uses strong action verbs.
- Clearly states what was done, how it was done, and the outcome.
- Includes quantitative or realistic approximate metrics when the candidate has
  not provided numbers (stay conservative and plausible).
- Naturally integrates relevant keywords and skills from the job description,
  but only where they are an honest match with the candidate's background.
- Is concise, professional, and ATS-friendly (no tables, no fancy formatting).

You MUST respond with strictly valid JSON matching the schema you are given.
Do not include any commentary or explanation outside of the JSON.
""".strip()


def _build_user_prompt(payload: ResumeRequest) -> str:
    def fmt_experience(exp: ExperienceInput) -> str:
        tech = ", ".join(exp.tech_stack or [])
        return (
            f"Company: {exp.company}\n"
            f"Role: {exp.role}\n"
            f"Start: {exp.start_date or ''}  End: {exp.end_date or ''}  Current: {exp.is_current}\n"
            f"Responsibilities: {exp.responsibilities or ''}\n"
            f"Achievements: {exp.achievements or ''}\n"
            f"Tech stack: {tech}\n"
        )

    experiences_text = "\n\n".join(fmt_experience(e) for e in payload.experiences)
    skills_text = ", ".join(payload.skills)

    jd: JobDescription = payload.job_description

    schema_hint = """
Return JSON in the following structure:
{
  "headline": "short professional headline string or null",
  "summary": "2-4 sentence professional summary tailored to the job description",
  "experience": [
    {
      "company": "Company Name",
      "role": "Role Title",
      "bullets": [
        {"text": "Action-oriented, quantified bullet point"},
        {"text": "Another bullet"}
      ],
      "start_date": "optional",
      "end_date": "optional",
      "is_current": true
    }
  ],
  "skills": [
    "skill 1",
    "skill 2"
  ]
}
""".strip()

    return f"""
Candidate personal info:
- Name: {payload.personal_info.full_name}
- Headline: {payload.personal_info.headline or ''}

Candidate skills (must be preserved, but you may rephrase or group them):
- {skills_text}

Candidate experiences:
{experiences_text}

Target job:
- Target title: {jd.target_title or ''}
- Target company: {jd.target_company or ''}
- Job description:
{jd.description_text}

Your task:
- Write optimized resume content tailored to this job.
- Follow the bullet style: action verb + what you did + how you did it + outcome + quantitative or realistic approximate metric where possible.
- Integrate relevant keywords from the job description into bullets and skills, but only if they honestly fit the candidate.
- Be concise and professional, suitable for an ATS.

{schema_hint}
""".strip()


async def build_resume(payload: ResumeRequest) -> ResumeResponse:
    """
    Build resume content by delegating to the model service.
    """
    model_service = get_model_service()

    user_prompt = _build_user_prompt(payload)
    print("constructed user prompt for model:", user_prompt)
    raw = await model_service.generate_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
    )
    print("raw model output:", raw)

    # Defensive parsing with sensible fallbacks
    headline = raw.get("headline") or payload.personal_info.headline
    summary = raw.get("summary") or ""

    experience_sections: List[ExperienceSection] = []
    for exp_input in payload.experiences:
        # Try to match generated experience to input by company & role, else fall back
        matched = None
        for item in raw.get("experience", []):
            if (
                item.get("company", "").lower() == exp_input.company.lower()
                and item.get("role", "").lower() == exp_input.role.lower()
            ):
                matched = item
                break

        source = matched or {}
        bullets_data = source.get("bullets") or []
        bullets = [
            BulletPoint(text=b.get("text", "").strip())
            for b in bullets_data
            if isinstance(b, dict) and b.get("text")
        ] or [
            BulletPoint(
                text="Generated bullet points will appear here once the model returns valid data."
            )
        ]

        experience_sections.append(
            ExperienceSection(
                company=source.get("company") or exp_input.company,
                role=source.get("role") or exp_input.role,
                bullets=bullets,
                start_date=exp_input.start_date,
                end_date=exp_input.end_date,
                is_current=exp_input.is_current,
            )
        )

    skills = raw.get("skills") or payload.skills

    return ResumeResponse(
        headline=headline,
        summary=summary,
        experience=experience_sections,
        skills=skills,
        education=payload.education,
        certifications=payload.certifications,
    )
