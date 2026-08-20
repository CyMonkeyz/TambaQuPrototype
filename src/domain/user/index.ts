export type UserRole = 'farmer' | 'owner' | 'pondivator'

export interface User {
  id: string
  name: string
  role: UserRole
  farmIds: string[]
}
