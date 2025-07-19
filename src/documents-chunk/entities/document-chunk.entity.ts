import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Document } from '../../documents/entities/document.entity'

@Entity('documents_chunk')
export class DocumentChunk {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'text' })
  content: string

  // @ts-expect-error pgvector bug
  @Column('vector', { nullable: true })
  embedding: number[]

  @Column({ type: 'uuid', nullable: true })
  documentId: string

  @ManyToOne(() => Document, (document) => document.chunks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'documentId' })
  document: Document
}
