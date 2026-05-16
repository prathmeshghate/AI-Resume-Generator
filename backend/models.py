from typing import List, Optional

from pydantic import BaseModel, EmailStr


class PersonalInfo(BaseModel):
    full_name: str
    headline: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    leetcode_url: Optional[str] = None


class ExperienceInput(BaseModel):
    company: str
    role: str
    start_date: Optional[str] = None  # keep simple strings for now
    end_date: Optional[str] = None
    is_current: bool = False
    responsibilities: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    achievements: Optional[str] = None


class EducationInput(BaseModel):
    institution: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class JobDescription(BaseModel):
    target_title: Optional[str] = None
    target_company: Optional[str] = None
    description_text: str


class BulletPoint(BaseModel):
    text: str


class Project(BaseModel):
    name: str
    bullets: List[BulletPoint]


class ResumeRequest(BaseModel):
    personal_info: PersonalInfo
    experiences: List[ExperienceInput]
    skills: List[str]
    education: Optional[List[EducationInput]] = None
    certifications: Optional[List[str]] = None
    projects: Optional[List[Project]] = None
    achievements: Optional[List[str]] = None
    job_description: JobDescription


class ExperienceSection(BaseModel):
    company: str
    role: str
    bullets: List[BulletPoint]
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False


class ResumeResponse(BaseModel):
    personal_info: PersonalInfo
    headline: Optional[str]
    summary: Optional[str]
    experience: List[ExperienceSection]
    skills: List[str]
    education: Optional[List[EducationInput]] = None
    certifications: Optional[List[str]] = None
    projects: Optional[List[Project]] = None
    achievements: Optional[List[str]] = None
