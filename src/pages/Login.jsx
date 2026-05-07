import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore.js'

function Login() {
  const navigate = useNavigate()
  const login = useAppStore((state) => state.login)
  const [email, setEmail] = useState('admin@autoecolepro.fr')
  const [password, setPassword] = useState('demo1234')

  const handleSubmit = (event) => {
    event.preventDefault()
    login(email, password)
    navigate('/', { replace: true })
  }

  return (
    <section className="login-screen">
      <div className="login-card">
        <div className="login-header stack">
          <span className="badge">Espace securise</span>
          <h2>Connexion a l application auto-ecole</h2>
          <p className="muted">Base de travail initiale pour Electron, Prisma et React.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@autoecolepro.fr"
            />
          </label>

          <label className="field">
            <span>Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </label>

          <button type="submit" className="btn btn-primary">
            Ouvrir le tableau de bord
          </button>
        </form>
      </div>
    </section>
  )
}

export default Login
