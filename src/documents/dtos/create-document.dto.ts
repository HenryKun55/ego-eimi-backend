import {
  IsString,
  MinLength,
  IsOptional,
  IsObject,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

export class ChunkingOptionsDto {
  @IsOptional()
  chunkSize?: number

  @IsOptional()
  chunkOverlap?: number

  @IsOptional()
  separators?: string[]
}

export class IndexingOptionsDto {
  @IsOptional()
  batchSize?: number

  @IsOptional()
  retryAttempts?: number

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>
}

export class CreateDocumentDto {
  @IsString()
  @MinLength(1)
  sourceName: string

  @IsString()
  @MinLength(1)
  content: string

  @IsString()
  requiredRole: string

  @IsOptional()
  @ValidateNested()
  @Type(() => ChunkingOptionsDto)
  chunkingOptions?: ChunkingOptionsDto

  @IsOptional()
  @ValidateNested()
  @Type(() => IndexingOptionsDto)
  indexingOptions?: IndexingOptionsDto

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>
}
