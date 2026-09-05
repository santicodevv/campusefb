import { Command, CommandRunner } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleCode } from '../../users/entities/role.entity';

@Command({
  name: 'seed:roles',
  description: 'Crear roles iniciales en la base de datos',
})
export class SeedRolesCommand extends CommandRunner {
  private readonly logger = new Logger(SeedRolesCommand.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {
    super();
  }

  async run(): Promise<void> {
    this.logger.log('🌱 Creando roles iniciales...');

    const roles = [
      {
        code: RoleCode.STUDENT,
        description:
          'Estudiante - puede ver sus calificaciones y solicitar reinscripción',
      },
      {
        code: RoleCode.TEACHER,
        description: 'Profesor - puede registrar calificaciones de sus cursos',
      },
      {
        code: RoleCode.ADMIN,
        description: 'Administrador - acceso completo al sistema',
      },
    ];

    for (const roleData of roles) {
      const existingRole = await this.roleRepository.findOne({
        where: { code: roleData.code },
      });

      if (existingRole) {
        this.logger.log(`  ⏭️  Rol ${roleData.code} ya existe`);
      } else {
        await this.roleRepository.save(roleData);
        this.logger.log(`  ✅ Rol ${roleData.code} creado`);
      }
    }

    this.logger.log('✅ Roles creados exitosamente!');
  }
}
