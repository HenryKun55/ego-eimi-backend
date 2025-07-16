import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsArray,
} from 'class-validator'

export class CreateUserDto {
  @IsEmail({}, { message: 'O email informado é inválido.' })
  @IsNotEmpty({ message: 'O email não pode ser vazio.' })
  email: string

  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  @IsNotEmpty({ message: 'A senha não pode ser vazia.' })
  password: string

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  roles: string[]
}
