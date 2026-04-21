import { useState, useEffect } from 'react'
import { MdDarkMode, MdLightMode } from 'react-icons/md'

export default function ThemeToggle() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle Theme">
      {theme === 'dark' ? <MdLightMode /> : <MdDarkMode />}
    </button>
  )
}
