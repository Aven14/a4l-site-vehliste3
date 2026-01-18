'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DealershipDetail {
  id: string
  name: string
  description: string | null
  logo: string | null
  user: {
    username: string | null
    email: string | null
    image: string | null
  }
  listings: Array<{
    id: string
    price: number
    mileage: number | null
    description: string | null
    vehicle: {
      id: string
      name: string
      brand: {
        name: string
      }
      images: string
      power: number | null
    }
  }>
}

export default function DealershipDetailPage({ params }: { params: { id: string } }) {
  const [dealership, setDealership] = useState<DealershipDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/dealerships/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Non trouvé')
        return res.json()
      })
      .then(data => {
        setDealership(data)
        setLoading(false)
      })
      .catch(err => {
        setError('Concessionnaire non trouvé')
        setLoading(false)
      })
  }, [params.id])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>
  }

  if (error || !dealership) {
    return <div className="min-h-screen flex items-center justify-center text-red-400">{error}</div>
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="card p-8 mb-12">
          <div className="flex flex-col md:flex-row gap-8">
            {dealership.logo && (
              <div className="md:w-64 flex-shrink-0">
                <img
                  src={dealership.logo}
                  alt={dealership.name}
                  className="w-full h-auto object-contain"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="font-display text-4xl font-bold text-white mb-2">
                {dealership.name}
              </h1>
              {dealership.description && (
                <p className="text-gray-400 mb-4">{dealership.description}</p>
              )}
              <div className="text-sm text-gray-500">
                <p>Gérant : <span className="text-primary-400">{dealership.user.username || dealership.user.email}</span></p>
                <p className="mt-2">{dealership.listings.length} véhicule{dealership.listings.length !== 1 ? 's' : ''} en vente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Véhicules */}
        <div>
          <h2 className="font-display text-3xl font-bold text-white mb-8">
            Véhicules en <span className="text-primary-400">Vente</span>
          </h2>

          {dealership.listings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Aucun véhicule en vente pour le moment
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dealership.listings.map(listing => {
                const images = JSON.parse(listing.vehicle.images || '[]')
                return (
                  <div key={listing.id} className="card overflow-hidden group">
                    <div className="aspect-video bg-dark-300 relative overflow-hidden">
                      {images[0] ? (
                        <img
                          src={images[0]}
                          alt={listing.vehicle.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <span className="text-4xl">🚗</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-primary-400 text-sm mb-1">{listing.vehicle.brand.name}</p>
                      <h3 className="font-display text-lg font-bold text-white mb-2">
                        {listing.vehicle.name}
                      </h3>
                      {listing.mileage && (
                        <p className="text-gray-500 text-sm mb-2">
                          {listing.mileage.toLocaleString()} km
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-2xl font-bold text-primary-400">
                          {listing.price.toLocaleString()} €
                        </span>
                        {listing.vehicle.power && (
                          <span className="text-gray-500 text-sm">{listing.vehicle.power} CV</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <Link href="/dealerships" className="text-primary-400 hover:text-primary-300 transition mt-8 inline-block">
          ← Retour aux concessionnaires
        </Link>
      </div>
    </div>
  )
}
