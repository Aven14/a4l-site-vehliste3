import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET le concessionnaire de l'utilisateur connecté
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const result = await query(
      `SELECT d.id, d.name, d.description, d.logo,
              COUNT(dl.id) as listings_count
       FROM "Dealership" d
       LEFT JOIN "User" u ON d."userId" = u.id
       LEFT JOIN "DealershipListing" dl ON d.id = dl."dealershipId"
       WHERE u.email = $1
       GROUP BY d.id`,
      [session.user.email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas de concessionnaire' },
        { status: 404 }
      )
    }

    const row = result.rows[0]
    const dealership = {
      id: row.id,
      name: row.name,
      description: row.description,
      logo: row.logo,
      _count: {
        listings: parseInt(row.listings_count, 10)
      }
    }

    return NextResponse.json(dealership)
  } catch (error) {
    console.error('Erreur récupération concessionnaire:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du concessionnaire' },
      { status: 500 }
    )
  }
}

// PUT modifier le concessionnaire
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const { name, description, logo } = await req.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { dealership: true },
    })

    if (!user?.dealership) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas de concessionnaire' },
        { status: 404 }
      )
    }

    // Vérifier que le nouveau nom n'existe pas
    if (name && name !== user.dealership.name) {
      const existing = await prisma.dealership.findUnique({
        where: { name },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'Ce nom de concessionnaire est déjà pris' },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.dealership.update({
      where: { id: user.dealership.id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        logo: logo !== undefined ? logo : undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erreur modification concessionnaire:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification du concessionnaire' },
      { status: 500 }
    )
  }
}
