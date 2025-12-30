import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AppConfigService } from './config.service';
import { CreateAppConfigDto, UpdateAppConfigDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('config')
export class AppConfigController {
  constructor(private readonly configService: AppConfigService) {}

  @Post()
  create(@Body() createConfigDto: CreateAppConfigDto) {
    return this.configService.create(createConfigDto);
  }

  @Get()
  findAll() {
    return this.configService.findAll();
  }

  @Get('key/:key')
  findByKey(@Param('key') key: string) {
    return this.configService.findByKey(key);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.configService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConfigDto: UpdateAppConfigDto,
  ) {
    return this.configService.update(id, updateConfigDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.configService.remove(id);
  }
}
