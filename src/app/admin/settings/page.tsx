'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface SiteSettings {
  siteLogo: string
  siteFavicon: string
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<SiteSettings>({
    siteLogo: '',
    siteFavicon: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const user = session?.user as any
  const canAccess = user?.role === 'superadmin' || user?.role === 'admin' || user?.canAccessAdmin

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
    if (status === 'authenticated' && !canAccess) router.push('/')
  }, [status, canAccess, router])

  useEffect(() => {
    if (canAccess) {
      fetchSettings()
    }
  }, [canAccess])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      if (res.ok) {
        setForm({
          siteLogo: data.siteLogo || '',
          siteFavicon: data.siteFavicon || '',
        })
      }
    } catch (err) {
      setError('Erreur lors du chargement des paramètres')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      setSaving(false)

      if (res.ok) {
        setMessage('Paramètres mis à jour avec succès ! Le site sera mis à jour après rechargement.')
        // Recharger la page après 2 secondes pour voir les changements
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      setSaving(false)
      setError('Erreur lors de la mise à jour')
    }
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>
  }

  if (!canAccess) {
    return null
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          Paramètres du <span className="text-primary-400">Site</span>
        </h1>
        <p className="text-gray-500 mb-8">Gérer le logo et l'icône (favicon) du site</p>

        {message && (
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 text-primary-400 mb-6">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 mb-6">
            {error}
          </div>
        )}

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo du site */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Logo du site (URL)</label>
              <input
                type="text"
                value={form.siteLogo}
                onChange={(e) => setForm({ ...form, siteLogo: e.target.value })}
                placeholder="/images/logo.png ou https://..."
                className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none"
              />
              <p className="text-gray-500 text-xs mt-2">
                URL du logo qui apparaîtra dans la barre de navigation. Laissez vide pour utiliser le logo par défaut.
              </p>
              {form.siteLogo && (
                <div className="mt-4 p-4 bg-dark-200 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">Aperçu :</p>
                  <div className="w-32 h-32 bg-dark-300 rounded-lg flex items-center justify-center">
                    <img src={form.siteLogo} alt="Logo" className="max-w-full max-h-full object-contain" onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* Favicon */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Favicon (URL)</label>
              <input
                type="text"
                value={form.siteFavicon}
                onChange={(e) => setForm({ ...form, siteFavicon: e.target.value })}
                placeholder="/favicon.ico ou https://..."
                className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none"
              />
              <p className="text-gray-500 text-xs mt-2">
                URL de l'icône qui apparaîtra dans l'onglet du navigateur. Laissez vide pour utiliser l'icône par défaut.
              </p>
              {form.siteFavicon && (
                <div className="mt-4 p-4 bg-dark-200 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">Aperçu :</p>
                  <div className="w-16 h-16 bg-dark-300 rounded-lg flex items-center justify-center">
                    <img src={form.siteFavicon} alt="Favicon" className="max-w-full max-h-full object-contain" onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setForm({ siteLogo: '', siteFavicon: '' })}
                className="btn-secondary flex-1"
              >
                Réinitialiser
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
