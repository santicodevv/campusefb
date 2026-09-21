import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { DocumentType } from './entities/user-document.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../users/entities/role.entity';
import {
  profilePhotoStorage,
  documentsStorage,
  imageFileFilter,
  documentFileFilter,
  MAX_FILE_SIZE,
} from './config/multer.config';

@ApiTags('uploads')
@ApiBearerAuth('JWT-auth')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('profile-photo')
  @ApiOperation({ summary: 'Subir foto de perfil' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: profilePhotoStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadProfilePhoto(
    @CurrentUser('id') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }
    const user = await this.uploadsService.updateProfilePhoto(userId, file);
    return {
      message: 'Foto de perfil actualizada',
      profilePhotoUrl: user.profilePhotoUrl,
    };
  }

  @Delete('profile-photo')
  @ApiOperation({ summary: 'Eliminar foto de perfil' })
  async deleteProfilePhoto(@CurrentUser('id') userId: number) {
    await this.uploadsService.deleteProfilePhoto(userId);
    return { message: 'Foto de perfil eliminada' };
  }

  @Post('documents')
  @ApiOperation({ summary: 'Subir documento' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        documentType: {
          type: 'string',
          enum: ['CEDULA', 'CERTIFICADO_BACHILLER', 'CARTA_PASTOR'],
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: documentsStorage,
      fileFilter: documentFileFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadDocument(
    @CurrentUser('id') userId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (!documentType || !Object.values(DocumentType).includes(documentType as DocumentType)) {
      throw new BadRequestException(
        'Tipo de documento inválido. Debe ser: CEDULA, CERTIFICADO_BACHILLER o CARTA_PASTOR',
      );
    }

    const document = await this.uploadsService.uploadDocument(
      userId,
      documentType as DocumentType,
      file,
    );

    return {
      message: 'Documento subido exitosamente',
      document: {
        id: document.id,
        documentType: document.documentType,
        originalFilename: document.originalFilename,
        filePath: document.filePath,
        createdAt: document.createdAt,
      },
    };
  }

  @Get('documents')
  @ApiOperation({ summary: 'Obtener mis documentos' })
  async getMyDocuments(@CurrentUser('id') userId: number) {
    const documents = await this.uploadsService.getUserDocuments(userId);
    return { documents };
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: 'Eliminar documento' })
  async deleteDocument(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) documentId: number,
  ) {
    await this.uploadsService.deleteDocument(documentId, userId);
    return { message: 'Documento eliminado' };
  }

  @Get('users/:userId/documents')
  @ApiOperation({ summary: 'Admin: Ver documentos de un usuario' })
  @Roles(RoleCode.ADMIN)
  async getUserDocuments(@Param('userId', ParseIntPipe) userId: number) {
    const documents = await this.uploadsService.getDocumentsByUserId(userId);
    return { documents };
  }
}
