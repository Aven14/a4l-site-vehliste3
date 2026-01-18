import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Force dynamic pour éviter les problèmes au build
export const dynamic = 'force-dynamic'

// GET - Liste toutes les marques
export async function GET() {
  try {
    const result = await query(
      `SELECT id, name, logo, (SELECT COUNT(*) FROM "Vehicle" WHERE "brandId" = "Brand".id) as vehicle_count 
       FROM "Brand" 
       ORDER BY name ASC`
    )
    
    const brands = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      logo: row.logo,
      _count: { vehicles: parseInt(row.vehicle_count) }
    }))
    
    const response = NextResponse.json(brands)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
    return response
  } catch (error) {
    console.error('Erreur GET /api/brands:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une marque (admin)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { name, logo } = await req.json()
  
  if (!name) {
    return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
  }

  const brand = await prisma.brand.create({
    data: { name, logo },
  })

  return NextResponse.json(brand, { status: 201 })
}
