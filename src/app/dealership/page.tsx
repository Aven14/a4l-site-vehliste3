'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'

interface Brand {
  id: string
  name: string
  logo: string | null
}

interface Vehicle {
  id: string
  name: string
  brand: { id: string; name: string }
  price: number
  power: number | null
}

interface Listing {
  id: string
  price: number
  mileage: number | null
  images: string | null
  description: string | null
  vehicle: Vehicle
}

export default function DealershipDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])

  const [formData, setFormData] = useState({
    vehicleId: '',
    price: '',
    mileage: '',
    description: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      // Récupérer les annonces
      fetch('/api/dealerships/my-dealership/listings')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setListings(data)
          }
          setLoading(false)
        })

      // Récupérer tous les véhicules disponibles
      fetch('/api/vehicles')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setVehicles(data)
          }
        })

      // Récupérer toutes les marques
      fetch('/api/brands')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setBrands(data)
          }
        })
    }
  }, [session])

  // Filtrer les véhicules par marque et recherche
  const filteredVehicles = useMemo(() => {
    const vehicleIds = new Set(listings.map(l => l.vehicle.id))
    let filtered = vehicles.filter(v => !vehicleIds.has(v.id))

    if (selectedBrand) {
      filtered = filtered.filter(v => v.brand.id === selectedBrand)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(v => 
        v.name.toLowerCase().includes(query) ||
        v.brand.name.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [vehicles, listings, selectedBrand, searchQuery])

  const handleAddListing = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!formData.vehicleId || !formData.price) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      const res = await fetch('/api/dealerships/my-dealership/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: formData.vehicleId,
          price: parseInt(formData.price),
          mileage: formData.mileage ? parseInt(formData.mileage) : null,
          description: formData.description || null,
          images: imageUrls.length > 0 ? imageUrls : null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('Annonce ajoutée avec succès!')
        setListings([data, ...listings])
        setFormData({
          vehicleId: '',
          price: '',
          mileage: '',
          description: '',
        })
        setImageUrls([])
        setSelectedBrand('')
        setSearchQuery('')
        setShowAddForm(false)
      } else {
        setError(data.error || 'Erreur lors de l\'ajout')
      }
    } catch (err) {
      setError('Une erreur est survenue')
    }
  }

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce?')) return

    try {
      const res = await fetch(`/api/dealerships/my-dealership/listings/${listingId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setListings(listings.filter(l => l.id !== listingId))
        setMessage('Annonce supprimée avec succès!')
      } else {
        setError('Erreur lors de la suppression')
      }
    } catch (err) {
      setError('Une erreur est survenue')
    }
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-white mb-2">
          Mon <span className="text-primary-400">Concessionnaire</span>
        </h1>
        <p className="text-gray-500 mb-12">Gérez vos annonces de véhicules</p>

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

        {/* Ajouter une annonce */}
        <div className="card p-6 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-white">Ajouter une annonce</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary text-sm py-2 px-4"
            >
              {showAddForm ? 'Annuler' : '+ Nouvelle annonce'}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddListing} className="space-y-4">
              {/* Filtres de sélection */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Filtrer par marque</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">Toutes les marques</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Rechercher un véhicule</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Nom du véhicule..."
                    className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Sélection du véhicule */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Véhicule * ({filteredVehicles.length} disponible{filteredVehicles.length > 1 ? 's' : ''})</label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  required
                >
                  <option value="">Sélectionner un véhicule</option>
                  {filteredVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.brand.name} {v.name} - {v.price.toLocaleString()}€
                    </option>
                  ))}
                </select>
              </div>

              {/* Prix et kilométrage */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Prix (€) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Kilométrage (km)</label>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Images du véhicule (Drag & Drop pour réordonner)</label>
                <ImageUpload 
                  images={imageUrls} 
                  onChange={setImageUrls} 
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  rows={3}
                  placeholder="Décrivez le véhicule..."
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                Ajouter l'annonce
              </button>
            </form>
          )}
        </div>

        {/* Annonces existantes */}
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-6">
            Mes annonces ({listings.length})
          </h2>

          {listings.length === 0 ? (
            <div className="card p-12 text-center text-gray-500">
              Vous n'avez pas encore d'annonces. Commencez par en ajouter une!
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(listing => {
                const images = listing.images ? JSON.parse(listing.images) : []
                return (
                  <div key={listing.id} className="card overflow-hidden">
                    {images.length > 0 && (
                      <div className="aspect-video bg-dark-300 relative overflow-hidden">
                        <img 
                          src={images[0]} 
                          alt={listing.vehicle.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-primary-400 text-sm mb-1">{listing.vehicle.brand.name}</p>
                      <h3 className="font-display text-lg font-bold text-white mb-2">
                        {listing.vehicle.name}
                      </h3>

                      <div className="space-y-1 text-sm text-gray-400 mb-4">
                        {listing.mileage && <p>Kilométrage: {listing.mileage.toLocaleString()} km</p>}
                        {listing.description && (
                          <p className="text-xs line-clamp-2">{listing.description}</p>
                        )}
                      </div>

                      <div className="border-t border-gray-700 pt-4 flex items-center justify-between">
                        <span className="text-xl font-bold text-primary-400">
                          {listing.price.toLocaleString()} €
                        </span>
                        <button
                          onClick={() => handleDeleteListing(listing.id)}
                          className="text-red-400 hover:text-red-300 text-sm transition"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
