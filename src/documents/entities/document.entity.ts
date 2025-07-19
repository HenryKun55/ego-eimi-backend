import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { DocumentChunk } from '../../documents-chunk/entities/document-chunk.entity'

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  sourceName: string

  @Column({ type: 'text' })
  content: string

  @Column()
  requiredRole: string

  @OneToMany(() => DocumentChunk, (chunk) => chunk.document, {
    cascade: true,
  })
  chunks: DocumentChunk[]
}
