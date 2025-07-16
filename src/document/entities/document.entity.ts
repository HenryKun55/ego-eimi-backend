import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column('text')
  content: string

  @Column('jsonb')
  allowedUsers: string[]
}
