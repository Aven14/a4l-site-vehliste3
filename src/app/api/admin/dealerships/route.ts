import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { query } from '@/lib/db'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.canAccessAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const result = await query(
      `SELECT d.id, d.name, d.description, d.logo, d."createdAt",
              u.id as user_id, u.email, u.username,
              COUNT(dl.id) as listings_count
       FROM "Dealership" d
       LEFT JOIN "User" u ON d."userId" = u.id
       LEFT JOIN "DealershipListing" dl ON d.id = dl."dealershipId"
       GROUP BY d.id, u.id
       ORDER BY d."createdAt" DESC`,
      []
    )

    const dealerships = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      logo: row.logo,
      createdAt: row.createdAt,
      user: {
        id: row.user_id,
        email: row.email,
        username: row.username,
      },
      _count: {
        listings: parseInt(row.listings_count, 10)
      }
    }))

    return NextResponse.json(dealerships)
  } catch (error) {
    console.error('[ADMIN_DEALERSHIPS_GET]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.canAccessAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, userId } = body

    if (!name || !userId) {
      return NextResponse.json(
        { error: 'Nom et utilisateur requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur n'a pas déjà un concessionnaire
    const existingDealership = await prisma.dealership.findUnique({
      where: { userId },
    })

    if (existingDealership) {
      return NextResponse.json(
        { error: 'Cet utilisateur a déjà un concessionnaire' },
        { status: 400 }
      )
    }

    // Vérifier que le nom est unique
    const nameTaken = await prisma.dealership.findUnique({
      where: { name },
    })

    if (nameTaken) {
      return NextResponse.json(
        { error: 'Ce nom de concessionnaire est déjà utilisé' },
        { status: 400 }
      )
    }

    const dealership = await prisma.dealership.create({
      data: {
        name,
        description: description || null,
        userId,
      },
      include: {
        user: {
          select: { id: true, email: true, username: true },
        },
        _count: {
          select: { listings: true },
        },
      },
    })

    return NextResponse.json(dealership)
  } catch (error) {
    console.error('[ADMIN_DEALERSHIPS_POST]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
