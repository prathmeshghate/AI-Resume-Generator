from __future__ import annotations

from pathlib import Path
from typing import Optional

from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML

from app.models import ResumeResponse

BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = BASE_DIR / "templates"
OUTPUT_DIR = BASE_DIR / "generated_pdfs"

env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)


def render_resume_html(resume: ResumeResponse) -> str:
    template = env.get_template("resume.html")
    return template.render(resume=resume)


def generate_resume_pdf(resume: ResumeResponse, filename: Optional[str] = None) -> Path:
    """
    Render the given resume data into our fixed HTML template and export as PDF.
    """
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if not filename:
        safe_name = (resume.headline or resume.summary or "resume").replace(" ", "_")
        filename = f"{safe_name}.pdf"

    html_content = render_resume_html(resume)
    output_path = OUTPUT_DIR / filename

    HTML(string=html_content).write_pdf(str(output_path))

    return output_path

