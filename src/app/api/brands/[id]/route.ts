import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Détail d'une marque
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get brand
    const brandResult = await query(
      `SELECT id, name, logo FROM "Brand" WHERE id = $1`,
      [params.id]
    )

    if (brandResult.rows.length === 0) {
      return NextResponse.json({ error: 'Marque non trouvée' }, { status: 404 })
    }

    const brand = brandResult.rows[0]

    // Get vehicles for this brand
    const vehiclesResult = await query(
      `SELECT id, name, description, price, power, trunk, vmax, seats, images, "brandId"
       FROM "Vehicle"
       WHERE "brandId" = $1
       ORDER BY name ASC`,
      [params.id]
    )

    const result = {
      ...brand,
      vehicles: vehiclesResult.rows
    }

    const response = NextResponse.json(result)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
    return response
  } catch (error) {
    console.error('Brand GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Modifier une marque (admin)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { name, logo } = await req.json()

  const brand = await prisma.brand.update({
    where: { id: params.id },
    data: { name, logo },
  })

  return NextResponse.json(brand)
}

// DELETE - Supprimer une marque (admin)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  await prisma.brand.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
