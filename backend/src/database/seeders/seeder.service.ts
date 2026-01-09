import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../entities/role.entity';
import { User } from '../../entities/user.entity';
import {
  AppConfig,
  ConfigCategory,
  ConfigType,
} from '../../entities/app-config.entity';

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
      // Configuraciones generales
      {
        key: 'NOMBRE_FONDO',
        value: 'Fondo de Ahorro Familiar',
        description: 'Nombre del fondo de ahorro',
        type: ConfigType.TEXT,
        category: ConfigCategory.GENERAL,
      },
      {
        key: 'FECHA_LIMITE_PAGO',
        value: '15',
        description: 'Día límite del mes para realizar pagos',
        type: ConfigType.NUMBER,
        category: ConfigCategory.GENERAL,
      },
      // Configuraciones de pagos/aportes
      {
        key: 'CUOTA_MENSUAL_DEFAULT',
        value: '100000',
        description: 'Cuota mensual base de ahorro',
        type: ConfigType.CURRENCY,
        category: ConfigCategory.PAYMENTS,
      },
      // Configuraciones de préstamos
      {
        key: 'TASA_INTERES_DEFAULT',
        value: '2.0',
        description: 'Tasa de interés mensual para préstamos (%)',
        type: ConfigType.PERCENTAGE,
        category: ConfigCategory.LOANS,
      },
      {
        key: 'PLAZO_MAXIMO_PRESTAMO',
        value: '12',
        description: 'Plazo máximo en meses para préstamos',
        type: ConfigType.NUMBER,
        category: ConfigCategory.LOANS,
      },
      {
        key: 'FACTOR_LIMITE_CREDITO',
        value: '3',
        description: 'Factor multiplicador de aportes para límite de crédito',
        type: ConfigType.NUMBER,
        category: ConfigCategory.LOANS,
      },
      // Configuraciones de multas
      {
        key: 'MULTA_MORA_PORCENTAJE',
        value: '5.0',
        description: 'Porcentaje de multa por mora en pagos (%)',
        type: ConfigType.PERCENTAGE,
        category: ConfigCategory.FINES,
      },
      {
        key: 'MULTA_INASISTENCIA',
        value: '20000',
        description: 'Multa por inasistencia a reuniones',
        type: ConfigType.CURRENCY,
        category: ConfigCategory.FINES,
      },
      // Configuraciones de inversiones
      {
        key: 'TASA_CDT_ESPERADA',
        value: '10.0',
        description: 'Tasa anual esperada para inversiones CDT (%)',
        type: ConfigType.PERCENTAGE,
        category: ConfigCategory.INVESTMENTS,
      },
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
