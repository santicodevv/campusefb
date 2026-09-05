import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    createUserDto: CreateUserDto,
  ): Promise<{ user: User; message: string }> {
    const user = await this.usersService.create(createUserDto);
    return {
      user,
      message:
        'Usuario registrado exitosamente. Contacte al administrador para asignar roles.',
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: User }> {
    const user = await this.usersService.findByEmailOrUsername(
      loginDto.identifier,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((role) => role.code),
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken, user };
  }

  async validateUser(userId: number): Promise<User> {
    return this.usersService.findById(userId);
  }

  async validateMicrosoftUser(profile: {
    email: string;
    displayName: string;
    microsoftId: string;
  }): Promise<User> {
    return this.usersService.findOrCreateSSOUser(profile);
  }

  loginSSO(user: User): { accessToken: string; user: User } {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles?.map((role) => role.code) || [],
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken, user };
  }
}
