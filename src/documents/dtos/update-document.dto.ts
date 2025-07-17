import {
  IsString,
  IsOptional,
  IsObject,
  ValidateNested,
  MinLength,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ChunkingOptionsDto } from './create-document.dto'
import { IndexingOptionsDto } from './create-document.dto'

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  sourceName?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string

  @IsOptional()
  @IsString()
  requiredRole?: string

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
