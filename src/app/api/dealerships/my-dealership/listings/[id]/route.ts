import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PUT modifier une annonce
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const { price, mileage, description, images, isAvailable } =
      await req.json()

    // Get user dealership
    const dealershipResult = await query(
      `SELECT d.id FROM "Dealership" d
       LEFT JOIN "User" u ON d."userId" = u.id
       WHERE u.email = $1`,
      [session.user.email]
    )

    if (dealershipResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas de concessionnaire' },
        { status: 403 }
      )
    }

    const dealershipId = dealershipResult.rows[0].id

    // Check listing ownership
    const listingResult = await query(
      `SELECT "dealershipId" FROM "DealershipListing" WHERE id = $1`,
      [params.id]
    )

    if (listingResult.rows.length === 0 || listingResult.rows[0].dealershipId !== dealershipId) {
      return NextResponse.json(
        { error: 'Annonce non trouvée ou accès refusé' },
        { status: 403 }
      )
    }

    const updated = await prisma.dealershipListing.update({
      where: { id: params.id },
      data: {
        price: price !== undefined ? price : undefined,
        mileage: mileage !== undefined ? mileage : undefined,
        description: description !== undefined ? description : undefined,
        images: images ? JSON.stringify(images) : undefined,
        isAvailable: isAvailable !== undefined ? isAvailable : undefined,
      },
      include: {
        vehicle: {
          include: { brand: true },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erreur modification annonce:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification de l\'annonce' },
      { status: 500 }
    )
  }
}

// DELETE supprimer une annonce
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    // Get user dealership
    const dealershipResult = await query(
      `SELECT d.id FROM "Dealership" d
       LEFT JOIN "User" u ON d."userId" = u.id
       WHERE u.email = $1`,
      [session.user.email]
    )

    if (dealershipResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas de concessionnaire' },
        { status: 403 }
      )
    }

    const dealershipId = dealershipResult.rows[0].id

    // Check listing ownership
    const listingResult = await query(
      `SELECT "dealershipId" FROM "DealershipListing" WHERE id = $1`,
      [params.id]
    )

    if (listingResult.rows.length === 0 || listingResult.rows[0].dealershipId !== dealershipId) {
      return NextResponse.json(
        { error: 'Annonce non trouvée ou accès refusé' },
        { status: 403 }
      )
    }

    await prisma.dealershipListing.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur suppression annonce:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'annonce' },
      { status: 500 }
    )
  }
}
