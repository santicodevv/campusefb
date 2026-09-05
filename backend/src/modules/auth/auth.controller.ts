import {
  Controller,
  Post,
  Body,
  Patch,
  Get,
  Request,
  Query,
  UseGuards,
  Res,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateProfileDto } from '../users/dto/update-profile.dto';
import { UsersService } from '../users/users.service';
import { Public } from '../../common/decorators/public.decorator';
import { MicrosoftCallbackGuard } from './guards/microsoft-auth.guard';
import { TokenBlacklistService } from './services/token-blacklist.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  /**
   * Registrar un nuevo usuario
   */
  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  /**
   * Iniciar sesión
   */
  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  @Get('me')
  getProfile(@Request() req) {
    return req.user;
  }

  /**
   * Actualizar perfil del usuario autenticado
   */
  @Patch('me')
  updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  /**
   * Cerrar sesión en el servidor (invalidar token JWT)
   */
  @Post('logout')
  async logout(@Request() req) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      await this.tokenBlacklistService.add(token);
    }
    return { success: true, message: 'Sesión invalidada en servidor' };
  }

  /**
   * SSO: Iniciar sesión con Microsoft (inicia el flujo OAuth)
   */
  @Public()
  @UseGuards(AuthGuard('microsoft'))
  @Get('microsoft')
  microsoftAuth() {
    // Passport redirige automáticamente a Microsoft
  }

  /**
   * SSO: Callback desde Microsoft.
   * 1. Intercepta errores que Microsoft devuelve como query params (ej: app mal configurada).
   * 2. Usa MicrosoftCallbackGuard que captura errores del validate() y redirige al frontend.
   */
  @Public()
  @Get('microsoft/callback')
  @UseGuards(MicrosoftCallbackGuard)
  microsoftAuthRedirect(
    @Request() req,
    @Res() res: Response,
    @Query('error') oauthError?: string,
    @Query('error_description') oauthErrorDesc?: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      this.logger.error('FRONTEND_URL no está configurada para Microsoft SSO');
      return res.status(500).send('Frontend URL is not configured');
    }

    // Errores devueltos por Microsoft directamente en la URL (antes de llegar al guard)
    if (oauthError) {
      this.logger.error(
        `Microsoft OAuth error: ${oauthError} - ${oauthErrorDesc}`,
      );

      let userMessage = 'Error al iniciar sesión con tu cuenta institucional.';
      if (oauthError === 'access_denied') {
        userMessage = 'Cancelaste el inicio de sesión con Microsoft.';
      }

      return res.redirect(
        `${frontendUrl}/login?sso_error=${encodeURIComponent(userMessage)}`,
      );
    }

    // Si el guard redirigió (dominio inválido, etc.), req.user es null → no hacer nada
    if (!req.user) {
      return;
    }

    // Login exitoso: generar JWT y redirigir al frontend
    try {
      const { accessToken } = this.authService.loginSSO(req.user);
      return res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
    } catch (err) {
      this.logger.error(`loginSSO error: ${err.message}`);
      return res.redirect(
        `${frontendUrl}/login?sso_error=${encodeURIComponent('Error procesando tu cuenta. Intenta de nuevo.')}`,
      );
    }
  }
}
