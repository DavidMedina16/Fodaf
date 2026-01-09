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
  Query,
} from '@nestjs/common';
import { FinesService, FinesFilterDto } from './fines.service';
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
  findAll(@Query() filters: FinesFilterDto) {
    return this.finesService.findAll(filters);
  }

  @Get('summary')
  getSummary() {
    return this.finesService.getSummary();
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.finesService.findByUser(userId);
  }

  @Get('user/:userId/summary')
  getUserFinesSummary(@Param('userId', ParseIntPipe) userId: number) {
    return this.finesService.getUserFinesSummary(userId);
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

  @Patch(':id/pay')
  markAsPaid(@Param('id', ParseIntPipe) id: number) {
    return this.finesService.markAsPaid(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.finesService.remove(id);
  }
}
