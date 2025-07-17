import { Document } from 'src/documents/entities/document.entity'
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity('documents_chunk')
export class DocumentChunk {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'text' })
  content: string

  //@ts-expect-error typeorm vector mistake
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
