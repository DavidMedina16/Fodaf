import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../entities/role.entity';
import { User } from '../../entities/user.entity';
import { AppConfig } from '../../entities/app-config.entity';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AppConfig)
    private readonly configRepository: Repository<AppConfig>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedRoles();
    await this.seedAdminUser();
    await this.seedDefaultConfig();
  }

  private async seedRoles() {
    const roles = [
      { name: 'Super Admin' },
      { name: 'Presidente' },
      { name: 'Tesoreria' },
      { name: 'Miembro' },
    ];

    for (const roleData of roles) {
      const exists = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!exists) {
        await this.roleRepository.save(roleData);
        this.logger.log(`Role '${roleData.name}' created`);
      }
    }
  }

  private async seedAdminUser() {
    const adminEmail = 'admin@fodaf.com';
    const exists = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (!exists) {
      const superAdminRole = await this.roleRepository.findOne({
        where: { name: 'Super Admin' },
      });

      if (superAdminRole) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await this.userRepository.save({
          roleId: superAdminRole.id,
          firstName: 'Admin',
          lastName: 'FODAF',
          email: adminEmail,
          password: hashedPassword,
          isActive: true,
        });
        this.logger.log(`Admin user created: ${adminEmail} / admin123`);
      }
    }
  }

  private async seedDefaultConfig() {
    const configs = [
      { key: 'TASA_INTERES_DEFAULT', value: '2.0' },
      { key: 'CUOTA_MENSUAL_DEFAULT', value: '100000' },
      { key: 'MULTA_MORA_PORCENTAJE', value: '5.0' },
    ];

    for (const configData of configs) {
      const exists = await this.configRepository.findOne({
        where: { key: configData.key },
      });

      if (!exists) {
        await this.configRepository.save(configData);
        this.logger.log(`Config '${configData.key}' created`);
      }
    }
  }
}
