import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
} from 'class-validator';

export class CreateTeacherDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  /** Nombre y apellido completo */
  @IsString()
  @IsNotEmpty()
  displayName: string;

  /** Teléfono (opcional) */
  @IsString()
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  /** Si true, se intenta crear el usuario en Moodle y se vincula el moodleUserId */
  @IsBoolean()
  @IsOptional()
  syncToMoodle?: boolean;
}
