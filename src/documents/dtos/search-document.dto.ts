import { IsOptional, IsString } from 'class-validator'

export class SearchDocumentsQueryDto {
  @IsString()
  query: string

  @IsOptional()
  limit?: number

  @IsOptional()
  scoreThreshold?: number
}
