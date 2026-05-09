import { useState } from 'react'
import './App.css'

const initialForm = {
  personal_info: {
    full_name: '',
    headline: '',
    email: '',
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
  education: '',
  certifications: '',
  job_description: '',
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resumePreview, setResumePreview] = useState(null)

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

  const buildPayload = () => {
    return {
      personal_info: {
        full_name: form.personal_info.full_name,
        headline: form.personal_info.headline || null,
        email: form.personal_info.email || null,
      },
      experiences: form.experiences.map((exp) => ({
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
      })),
      skills: form.skills
        ? form.skills.split(',').map((s) => s.trim())
        : [],
      education: form.education
        ? [
            {
              institution: form.education,
            },
          ]
        : [],
      certifications: form.certifications
        ? form.certifications.split(',').map((s) => s.trim())
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
      const res = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error('Failed to generate resume')
      }
      const data = await res.json()
      setResumePreview(data)
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
      const res = await fetch('/api/resume/generate-pdf', {
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

          <div className="field-group">
            <label>Education (simple text for now)</label>
            <input
              type="text"
              placeholder="B.Tech in Computer Science, XYZ University"
              value={form.education}
              onChange={(e) => handleChange('education', e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Certifications (comma separated)</label>
            <input
              type="text"
              value={form.certifications}
              onChange={(e) => handleChange('certifications', e.target.value)}
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

          {error && <div className="error">{error}</div>}
        </section>

        <section className="panel preview">
          <h2>Preview</h2>
          {!resumePreview && (
            <p className="placeholder">
              Fill out your details and click &quot;Generate resume&quot; to see
              a preview here.
            </p>
          )}
          {resumePreview && (
            <div className="preview-content">
              <h3>{resumePreview.headline || form.personal_info.full_name}</h3>
              {resumePreview.summary && <p>{resumePreview.summary}</p>}

              <h4>Experience</h4>
              {resumePreview.experience.map((exp, idx) => (
                <div key={idx} className="preview-exp">
                  <strong>
                    {exp.role} · {exp.company}
                  </strong>
                  <ul>
                    {exp.bullets.map((b, i) => (
                      <li key={i}>{b.text}</li>
                    ))}
                  </ul>
                </div>
              ))}

              {resumePreview.skills?.length > 0 && (
                <>
                  <h4>Skills</h4>
                  <p>{resumePreview.skills.join(', ')}</p>
                </>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
