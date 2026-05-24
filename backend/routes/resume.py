from fastapi import APIRouter, HTTPException, Response, status
from fastapi.responses import FileResponse, HTMLResponse

from models import ResumeRequest, ResumeResponse
from services.pdf_renderer import generate_resume_pdf, render_resume_html
from services.resume_builder import build_resume

router = APIRouter()


@router.get("/health")
async def health_check() -> dict:
    return {"status": "ok"}


@router.post("/generate", response_model=ResumeResponse)
async def generate_resume(payload: ResumeRequest) -> ResumeResponse:
    try:
        return await build_resume(payload)
    except Exception as exc:  # noqa: BLE001
        # In production you would log this properly
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate resume: {exc}",
        ) from exc


@router.post("/generate-pdf")
async def generate_resume_pdf_endpoint(payload: ResumeRequest) -> FileResponse:
    """
    Convenience endpoint that generates both the content and the PDF,
    streaming the resulting file back to the client.
    """
    try:
        resume = await build_resume(payload)
        pdf_path = generate_resume_pdf(resume)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate resume PDF: {exc}",
        ) from exc

    return FileResponse(
        path=pdf_path,
        filename=pdf_path.name,
        media_type="application/pdf",
    )


@router.post("/generate-preview", response_class=HTMLResponse)
async def generate_resume_preview_endpoint(payload: ResumeRequest) -> HTMLResponse:
    """
    Generate resume content and return the same HTML template used for PDF export.
    """
    try:
        resume = await build_resume(payload)
        html_content = render_resume_html(resume)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate resume preview: {exc}",
        ) from exc

    return HTMLResponse(content=html_content)


