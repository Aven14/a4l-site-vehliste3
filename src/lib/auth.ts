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

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          themeColor: user.themeColor || undefined,
          roleName: user.role?.name || 'user',
          canAccessAdmin: user.role?.canAccessAdmin || false,
          canEditBrands: user.role?.canEditBrands || false,
          canEditVehicles: user.role?.canEditVehicles || false,
          canDeleteBrands: user.role?.canDeleteBrands || false,
          canDeleteVehicles: user.role?.canDeleteVehicles || false,
          canImport: user.role?.canImport || false,
          canManageUsers: user.role?.canManageUsers || false,
          canManageRoles: user.role?.canManageRoles || false,
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
        token.dealership = user.dealership
      } else if (token.sub) {
        // Rafraîchir les données depuis la base de données quand l'utilisateur n'est pas défini
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: { role: true, dealership: true },
        })
        if (dbUser) {
          token.themeColor = dbUser.themeColor || undefined
          token.roleName = dbUser.role?.name || 'user'
          token.canAccessAdmin = dbUser.role?.canAccessAdmin || false
          token.canEditBrands = dbUser.role?.canEditBrands || false
          token.canEditVehicles = dbUser.role?.canEditVehicles || false
          token.canDeleteBrands = dbUser.role?.canDeleteBrands || false
          token.canDeleteVehicles = dbUser.role?.canDeleteVehicles || false
          token.canImport = dbUser.role?.canImport || false
          token.canManageUsers = dbUser.role?.canManageUsers || false
          token.canManageRoles = dbUser.role?.canManageRoles || false
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
