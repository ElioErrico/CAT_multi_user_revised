import type { UserStatus } from '@/types'

const API_BASE = 'http://192.168.1.115:1865'

export const fetchUserStatus = async (): Promise<UserStatus> => {
    const response = await fetch(`${API_BASE}/custom/user-status`)
    if (!response.ok) throw new Error('Failed to fetch user status')
    return response.json()
}

export const updateUserStatus = async (status: UserStatus): Promise<void> => {
    const response = await fetch(`${API_BASE}/custom/user-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(status)
    })
    if (!response.ok) throw new Error('Failed to update user status')
}

export const deleteMemoryPoints = async (filterData: object): Promise<void> => {
    const response = await fetch(`${API_BASE}/memory/collections/declarative/points`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filterData)
    })
    if (!response.ok) throw new Error('Failed to delete memory points')
}

export const updateTags = async (tags: string[]): Promise<void> => {
    const response = await fetch(`${API_BASE}/custom/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags })
    })
    if (!response.ok) throw new Error('Failed to update tags')
}