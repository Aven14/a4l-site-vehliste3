import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: { role: true },
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        // Vérifier que le compte est vérifié (sauf pour les comptes système)
        if (!user.isVerified && user.role?.name !== 'superadmin' && user.role?.name !== 'admin') {
          throw new Error('UNVERIFIED')
        }

        const isSuperAdmin = user.role?.name === 'superadmin'

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          themeColor: user.themeColor || undefined,
          roleName: user.role?.name || 'user',
          canAccessAdmin: isSuperAdmin || user.role?.canAccessAdmin || false,
          canEditBrands: isSuperAdmin || user.role?.canEditBrands || false,
          canEditVehicles: isSuperAdmin || user.role?.canEditVehicles || false,
          canDeleteBrands: isSuperAdmin || user.role?.canDeleteBrands || false,
          canDeleteVehicles: isSuperAdmin || user.role?.canDeleteVehicles || false,
          canImport: isSuperAdmin || user.role?.canImport || false,
          canManageUsers: isSuperAdmin || user.role?.canManageUsers || false,
          canManageRoles: isSuperAdmin || user.role?.canManageRoles || false,
          canManageDealerships: isSuperAdmin || user.role?.canManageDealerships || false,
          canManageSite: isSuperAdmin || user.role?.canManageSite || false,
          dealership: user.dealership ? true : false,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.roleName = user.roleName
        token.themeColor = user.themeColor
        token.canAccessAdmin = user.canAccessAdmin
        token.canEditBrands = user.canEditBrands
        token.canEditVehicles = user.canEditVehicles
        token.canDeleteBrands = user.canDeleteBrands
        token.canDeleteVehicles = user.canDeleteVehicles
        token.canImport = user.canImport
        token.canManageUsers = user.canManageUsers
        token.canManageRoles = user.canManageRoles
        token.canManageDealerships = user.canManageDealerships
        token.canManageSite = user.canManageSite
        token.dealership = user.dealership
      } else if (token.sub) {
        // Rafraîchir les données depuis la base de données quand l'utilisateur n'est pas défini
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: { role: true, dealership: true },
        })
        const isSuperAdmin = dbUser.role?.name === 'superadmin'
        if (dbUser) {
          token.themeColor = dbUser.themeColor || undefined
          token.roleName = dbUser.role?.name || 'user'
          token.canAccessAdmin = isSuperAdmin || dbUser.role?.canAccessAdmin || false
          token.canEditBrands = isSuperAdmin || dbUser.role?.canEditBrands || false
          token.canEditVehicles = isSuperAdmin || dbUser.role?.canEditVehicles || false
          token.canDeleteBrands = isSuperAdmin || dbUser.role?.canDeleteBrands || false
          token.canDeleteVehicles = isSuperAdmin || dbUser.role?.canDeleteVehicles || false
          token.canImport = isSuperAdmin || dbUser.role?.canImport || false
          token.canManageUsers = isSuperAdmin || dbUser.role?.canManageUsers || false
          token.canManageRoles = isSuperAdmin || dbUser.role?.canManageRoles || false
          token.canManageDealerships = isSuperAdmin || dbUser.role?.canManageDealerships || false
          token.canManageSite = isSuperAdmin || dbUser.role?.canManageSite || false
          token.dealership = dbUser.dealership ? true : false
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.roleName = token.roleName as string
        session.user.themeColor = token.themeColor as string | undefined
        session.user.canAccessAdmin = token.canAccessAdmin as boolean
        session.user.canEditBrands = token.canEditBrands as boolean
        session.user.canEditVehicles = token.canEditVehicles as boolean
        session.user.canDeleteBrands = token.canDeleteBrands as boolean
        session.user.canDeleteVehicles = token.canDeleteVehicles as boolean
        session.user.canImport = token.canImport as boolean
        session.user.canManageUsers = token.canManageUsers as boolean
        session.user.canManageRoles = token.canManageRoles as boolean
        session.user.canManageDealerships = token.canManageDealerships as boolean
        session.user.canManageSite = token.canManageSite as boolean
        session.user.dealership = token.dealership as boolean | undefined
      }
      return session
    },
  },
}

declare module 'next-auth' {
  interface User {
    themeColor?: string
    roleName?: string
    canAccessAdmin?: boolean
    canEditBrands?: boolean
    canEditVehicles?: boolean
    canDeleteBrands?: boolean
    canDeleteVehicles?: boolean
    canImport?: boolean
    canManageUsers?: boolean
    canManageRoles?: boolean
    canManageDealerships?: boolean
    canManageSite?: boolean
    dealership?: boolean
  }
  interface Session {
    user: User & {
      themeColor?: string
      roleName?: string
      canAccessAdmin?: boolean
      canEditBrands?: boolean
      canEditVehicles?: boolean
      canDeleteBrands?: boolean
      canDeleteVehicles?: boolean
      canImport?: boolean
      canManageUsers?: boolean
      canManageRoles?: boolean
      dealership?: boolean
    }
  }
}
