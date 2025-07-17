import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsNumber,
  Max,
} from 'class-validator'

export class SearchDto {
  @IsString()
  text: string

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  scoreThreshold?: number
}
