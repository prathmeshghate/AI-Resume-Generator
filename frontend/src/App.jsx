import { useEffect, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'resume-generator-form'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
console.log("API_BASE_URL:", API_BASE_URL);

const initialForm = {
  personal_info: {
    full_name: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    github_url: '',
    leetcode_url: '',
  },
  experiences: [
    {
      company: '',
      role: '',
      start_date: '',
      end_date: '',
      is_current: false,
      responsibilities: '',
      achievements: '',
      tech_stack: '',
    },
  ],
  skills: '',
  education: [
    {
      institution: '',
      degree: '',
      field_of_study: '',
      location: '',
      start_date: '',
      end_date: '',
    },
  ],
  certifications: '',
  projects: [
    {
      name: '',
      bullets: '',
    },
  ],
  achievements: '',
  job_description: '',
}

const normalizeSavedForm = (savedForm) => {
  if (!savedForm || typeof savedForm !== 'object') {
    return initialForm
  }

  const education = Array.isArray(savedForm.education)
    ? savedForm.education
    : savedForm.education
    ? [
        {
          institution: String(savedForm.education),
          degree: savedForm.degree || '',
          field_of_study: savedForm.field_of_study || '',
          location: savedForm.location || '',
          start_date: savedForm.start_date || '',
          end_date: savedForm.end_date || '',
        },
      ]
    : initialForm.education

  const projects = Array.isArray(savedForm.projects)
    ? savedForm.projects
    : initialForm.projects

  return {
    ...initialForm,
    ...savedForm,
    personal_info: {
      ...initialForm.personal_info,
      ...(savedForm.personal_info || {}),
    },
    experiences: Array.isArray(savedForm.experiences)
      ? savedForm.experiences
      : initialForm.experiences,
    education,
    certifications: savedForm.certifications || '',
    projects,
    achievements: savedForm.achievements || '',
    job_description: savedForm.job_description || initialForm.job_description,
  }
}

function App() {
  const [form, setForm] = useState(() => {
    if (typeof window === 'undefined') {
      return initialForm
    }

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      return saved ? normalizeSavedForm(JSON.parse(saved)) : initialForm
    } catch {
      return initialForm
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resumePreviewHtml, setResumePreviewHtml] = useState('')

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    } catch {
      // ignore storage errors in private mode
    }
  }, [form])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleExperienceChange = (index, field, value) => {
    setForm((prev) => {
      const next = [...prev.experiences]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, experiences: next }
    })
  }

  const addExperience = () => {
    setForm((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          company: '',
          role: '',
          start_date: '',
          end_date: '',
          is_current: false,
          responsibilities: '',
          achievements: '',
          tech_stack: '',
        },
      ],
    }))
  }

  const handleProjectChange = (index, field, value) => {
    setForm((prev) => {
      const next = [...prev.projects]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, projects: next }
    })
  }

  const addProject = () => {
    setForm((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          name: '',
          bullets: '',
        },
      ],
    }))
  }

  const handleEducationChange = (index, field, value) => {
    setForm((prev) => {
      const nextEducation = Array.isArray(prev.education)
        ? [...prev.education]
        : [...initialForm.education]
      nextEducation[index] = { ...nextEducation[index], [field]: value }
      return { ...prev, education: nextEducation }
    })
  }

  const addEducation = () => {
    setForm((prev) => {
      const currentEducation = Array.isArray(prev.education)
        ? prev.education
        : initialForm.education
      return {
        ...prev,
        education: [
          ...currentEducation,
          {
            institution: '',
            degree: '',
            field_of_study: '',
            location: '',
            start_date: '',
            end_date: '',
          },
        ],
      }
    })
  }

  const buildPayload = () => {
    return {
      personal_info: {
        full_name: form.personal_info.full_name,
        headline: form.personal_info.headline || null,
        email: form.personal_info.email || null,
        phone: form.personal_info.phone || null,
        location: form.personal_info.location || null,
        linkedin_url: form.personal_info.linkedin_url || null,
        github_url: form.personal_info.github_url || null,
        leetcode_url: form.personal_info.leetcode_url || null,
      },
      experiences: Array.isArray(form.experiences)
        ? form.experiences.map((exp) => ({
            company: exp.company,
            role: exp.role,
            start_date: exp.start_date || null,
            end_date: exp.end_date || null,
            is_current: exp.is_current || false,
            responsibilities: exp.responsibilities || null,
            achievements: exp.achievements || null,
            tech_stack: exp.tech_stack
              ? exp.tech_stack.split(',').map((s) => s.trim())
              : [],
          }))
        : [],
      skills: form.skills
        ? form.skills.split(',').map((s) => s.trim())
        : [],
      education: Array.isArray(form.education)
        ? form.education
            .filter((edu) => edu.institution || edu.degree || edu.field_of_study)
            .map((edu) => ({
              institution: edu.institution || '',
              degree: edu.degree || null,
              field_of_study: edu.field_of_study || null,
              start_date: edu.start_date || null,
              end_date: edu.end_date || null,
              location: edu.location || null,
            }))
        : [],
      certifications: form.certifications
        ? form.certifications.split(',').map((s) => s.trim())
        : [],
      projects: Array.isArray(form.projects)
        ? form.projects.filter((p) => p.name).map((proj) => ({
            name: proj.name,
            bullets: proj.bullets
              .split('\n')
              .filter((b) => b.trim())
              .map((b) => ({ text: b.trim() })),
          }))
        : [],
      achievements: form.achievements
        ? form.achievements.split('\n').filter(a => a.trim())
        : [],
      job_description: {
        target_title: null,
        target_company: null,
        description_text: form.job_description,
      },
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = buildPayload()
      const res = await fetch(`${API_BASE_URL}/api/resume/generate-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error('Failed to generate resume')
      }
      const html = await res.text()
      setResumePreviewHtml(html)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = buildPayload()
      const res = await fetch(`${API_BASE_URL}/api/resume/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error('Failed to generate PDF')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'resume.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewFrameLoad = (event) => {
    const frame = event.currentTarget
    const documentElement = frame.contentDocument?.documentElement
    const body = frame.contentDocument?.body
    const contentHeight = Math.max(
      documentElement?.scrollHeight || 0,
      body?.scrollHeight || 0,
    )

    if (contentHeight) {
      frame.style.height = `${contentHeight}px`
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Resume Builder</h1>
        <p>
          Paste your experience and job description, get an ATS-optimized resume.
        </p>
      </header>

      <main className="layout">
        <section className="panel">
          <h2>Career data</h2>

          <div className="field-group">
            <label>Full name</label>
            <input
              type="text"
              value={form.personal_info.full_name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: {
                    ...prev.personal_info,
                    full_name: e.target.value,
                  },
                }))
              }
            />
          </div>

          <div className="field-group">
            <label>Headline (optional)</label>
            <input
              type="text"
              value={form.personal_info.headline}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: {
                    ...prev.personal_info,
                    headline: e.target.value,
                  },
                }))
              }
            />
          </div>

          <div className="field-group">
            <label>Email (optional)</label>
            <input
              type="email"
              value={form.personal_info.email}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: {
                    ...prev.personal_info,
                    email: e.target.value,
                  },
                }))
              }
            />
          </div>

          <div className="field-group">
            <label>Phone (optional)</label>
            <input
              type="text"
              value={form.personal_info.phone}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: {
                    ...prev.personal_info,
                    phone: e.target.value,
                  },
                }))
              }
            />
          </div>

          <div className="field-group">
            <label>Location (optional)</label>
            <input
              type="text"
              value={form.personal_info.location}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: {
                    ...prev.personal_info,
                    location: e.target.value,
                  },
                }))
              }
            />
          </div>

          <div className="field-group">
            <label>LinkedIn URL (optional)</label>
            <input
              type="url"
              value={form.personal_info.linkedin_url}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: {
                    ...prev.personal_info,
                    linkedin_url: e.target.value,
                  },
                }))
              }
            />
          </div>

          <div className="field-group">
            <label>GitHub URL (optional)</label>
            <input
              type="url"
              value={form.personal_info.github_url}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: {
                    ...prev.personal_info,
                    github_url: e.target.value,
                  },
                }))
              }
            />
          </div>

          <div className="field-group">
            <label>LeetCode URL (optional)</label>
            <input
              type="url"
              value={form.personal_info.leetcode_url}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: {
                    ...prev.personal_info,
                    leetcode_url: e.target.value,
                  },
                }))
              }
            />
          </div>

          <h3>Experience</h3>
          {form.experiences.map((exp, index) => (
            <div key={index} className="experience-block">
              <div className="field-row">
                <div className="field-group">
                  <label>Company</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) =>
                      handleExperienceChange(index, 'company', e.target.value)
                    }
                  />
                </div>
                <div className="field-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value={exp.role}
                    onChange={(e) =>
                      handleExperienceChange(index, 'role', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label>Start date</label>
                  <input
                    type="text"
                    placeholder="Jan 2021"
                    value={exp.start_date}
                    onChange={(e) =>
                      handleExperienceChange(index, 'start_date', e.target.value)
                    }
                  />
                </div>
                <div className="field-group">
                  <label>End date</label>
                  <input
                    type="text"
                    placeholder="Present or Jun 2024"
                    value={exp.end_date}
                    onChange={(e) =>
                      handleExperienceChange(index, 'end_date', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="field-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={exp.is_current}
                    onChange={(e) =>
                      handleExperienceChange(index, 'is_current', e.target.checked)
                    }
                  />
                  Current role
                </label>
              </div>

              <div className="field-group">
                <label>Responsibilities / raw notes</label>
                <textarea
                  rows="3"
                  value={exp.responsibilities}
                  onChange={(e) =>
                    handleExperienceChange(
                      index,
                      'responsibilities',
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="field-group">
                <label>Achievements (optional)</label>
                <textarea
                  rows="2"
                  value={exp.achievements}
                  onChange={(e) =>
                    handleExperienceChange(index, 'achievements', e.target.value)
                  }
                />
              </div>

              <div className="field-group">
                <label>Tech stack (comma separated)</label>
                <input
                  type="text"
                  placeholder="React, Node.js, PostgreSQL"
                  value={exp.tech_stack}
                  onChange={(e) =>
                    handleExperienceChange(index, 'tech_stack', e.target.value)
                  }
                />
              </div>
            </div>
          ))}

          <button type="button" className="secondary" onClick={addExperience}>
            + Add another role
          </button>

          <div className="field-group">
            <label>Skills (comma separated)</label>
            <input
              type="text"
              value={form.skills}
              onChange={(e) => handleChange('skills', e.target.value)}
            />
          </div>

          <h3>Education</h3>
          {form.education.map((edu, index) => (
            <div key={index} className="experience-block">
              <div className="field-row">
                <div className="field-group">
                  <label>Institution</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) =>
                      handleEducationChange(index, 'institution', e.target.value)
                    }
                  />
                </div>
                <div className="field-group">
                  <label>Degree</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) =>
                      handleEducationChange(index, 'degree', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label>Field of study</label>
                  <input
                    type="text"
                    value={edu.field_of_study}
                    onChange={(e) =>
                      handleEducationChange(index, 'field_of_study', e.target.value)
                    }
                  />
                </div>
                <div className="field-group">
                  <label>Location / City</label>
                  <input
                    type="text"
                    value={edu.location}
                    onChange={(e) =>
                      handleEducationChange(index, 'location', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label>Start date</label>
                  <input
                    type="text"
                    placeholder="Aug 2019"
                    value={edu.start_date}
                    onChange={(e) =>
                      handleEducationChange(index, 'start_date', e.target.value)
                    }
                  />
                </div>
                <div className="field-group">
                  <label>End date</label>
                  <input
                    type="text"
                    placeholder="Mar 2023"
                    value={edu.end_date}
                    onChange={(e) =>
                      handleEducationChange(index, 'end_date', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
          <button type="button" className="secondary" onClick={addEducation}>
            + Add another education entry
          </button>

          <div className="field-group">
            <label>Certifications (comma separated)</label>
            <input
              type="text"
              value={form.certifications}
              onChange={(e) => handleChange('certifications', e.target.value)}
            />
          </div>

          <h3>Projects</h3>
          {form.projects.map((proj, index) => (
            <div key={index} className="project-block">
              <div className="field-group">
                <label>Project Name</label>
                <input
                  type="text"
                  value={proj.name}
                  onChange={(e) =>
                    handleProjectChange(index, 'name', e.target.value)
                  }
                />
              </div>
              <div className="field-group">
                <label>Bullets (one per line)</label>
                <textarea
                  rows="3"
                  value={proj.bullets}
                  onChange={(e) =>
                    handleProjectChange(index, 'bullets', e.target.value)
                  }
                />
              </div>
            </div>
          ))}
          <button type="button" className="secondary" onClick={addProject}>
            + Add another project
          </button>

          <div className="field-group">
            <label>Achievements (one per line)</label>
            <textarea
              rows="3"
              value={form.achievements}
              onChange={(e) => handleChange('achievements', e.target.value)}
            />
          </div>

          <h2>Job description</h2>
          <div className="field-group">
            <label>Paste job description</label>
            <textarea
              rows="6"
              value={form.job_description}
              onChange={(e) => handleChange('job_description', e.target.value)}
            />
          </div>

          <div className="actions">
            <button type="button" onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating…' : 'Generate resume'}
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={loading}
              className="secondary"
            >
              {loading ? 'Preparing PDF…' : 'Download PDF'}
            </button>
          </div>
          <div className="help-text">
            Your form data is saved in your browser. Reloading the page will keep your inputs.
          </div>

          {error && <div className="error">{error}</div>}
        </section>

        <section className="panel preview">
          <h2>Preview</h2>
          {!resumePreviewHtml && !loading && (
            <p className="placeholder">
              Fill out your details and click &quot;Generate resume&quot; to see
              a preview here.
            </p>
          )}
          {loading && (
            <div className="preview-loading">Generating resume…</div>
          )}
          {resumePreviewHtml && (
            <div className="preview-page-shell">
              <iframe
                className="preview-frame"
                title="Resume PDF preview"
                srcDoc={resumePreviewHtml}
                onLoad={handlePreviewFrameLoad}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
