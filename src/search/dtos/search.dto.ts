import { IsString, IsOptional, IsInt, Min } from 'class-validator'

export class SearchDto {
  @IsString()
  text: string

  @IsOptional()
  @IsInt()
  @Min(1)
  score_threshold?: number
}
