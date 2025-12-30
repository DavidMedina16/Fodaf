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
  Request,
} from '@nestjs/common';
import { FinesService } from './fines.service';
import { CreateFineDto, UpdateFineDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('fines')
export class FinesController {
  constructor(private readonly finesService: FinesService) {}

  @Post()
  create(
    @Body() createFineDto: CreateFineDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.finesService.create(createFineDto, req.user.id);
  }

  @Get()
  findAll() {
    return this.finesService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.finesService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.finesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFineDto: UpdateFineDto,
  ) {
    return this.finesService.update(id, updateFineDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.finesService.remove(id);
  }
}
