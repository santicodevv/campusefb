import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

/**
 * Guard personalizado para el callback de Microsoft OAuth.
 * Sobreescribe `handleRequest` para que cualquier error de autenticación
 * (dominio inválido, cuenta inactiva, etc.) resulte en una redirección
 * al frontend con un mensaje legible, en vez de un JSON de error crudo.
 */
@Injectable()
export class MicrosoftCallbackGuard extends AuthGuard('microsoft') {
  private readonly logger = new Logger(MicrosoftCallbackGuard.name);

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Si passport lanzó un error (ej: UnauthorizedException del validate())
    // o no hay usuario, redirigimos al frontend con el mensaje de error.
    if (err || !user) {
      const res: Response = context.switchToHttp().getResponse();
      const frontendUrl = process.env.FRONTEND_URL;
      const message =
        err?.message ||
        info?.message ||
        'Error de autenticación institucional.';

      this.logger.warn(`Microsoft SSO auth failed: ${message}`);

      if (!frontendUrl) {
        res.status(500).send('Frontend URL is not configured');
        return null;
      }

      // Redirigir en vez de lanzar excepción
      res.redirect(
        `${frontendUrl}/login?sso_error=${encodeURIComponent(message)}`,
      );

      // Retornar null para que el controlador no siga ejecutando
      return null;
    }

    return user;
  }
}
