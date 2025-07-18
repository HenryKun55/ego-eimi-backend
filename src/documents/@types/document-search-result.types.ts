export interface DocumentSearchResult {
  id: string | number
  text: string
  metadata: Record<string, any>
  score: number
  document: {
    id: string
    sourceName: string
    requiredRole: string
  }
}
