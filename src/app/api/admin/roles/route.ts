import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user?.canManageRoles) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  try {
    const result = await query(
      `SELECT r.id, r.name, COUNT(u.id) as users_count
       FROM "Role" r
       LEFT JOIN "User" u ON r.id = u."roleId"
       GROUP BY r.id
       ORDER BY r.name ASC`,
      []
    )

    const roles = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      _count: {
        users: parseInt(row.users_count, 10)
      }
    }))

    return NextResponse.json(roles)
  } catch (error) {
    console.error('Admin roles error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user?.canManageRoles) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const data = await req.json()

  const role = await prisma.role.create({
    data: {
      name: data.name,
      canAccessAdmin: data.canAccessAdmin || false,
      canEditBrands: data.canEditBrands || false,
      canEditVehicles: data.canEditVehicles || false,
      canDeleteBrands: data.canDeleteBrands || false,
      canDeleteVehicles: data.canDeleteVehicles || false,
      canImport: data.canImport || false,
      canManageUsers: data.canManageUsers || false,
      canManageRoles: data.canManageRoles || false,
      isSystem: false,
    },
  })

  return NextResponse.json(role)
}
