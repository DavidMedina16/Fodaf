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
import { ContributionsService } from './contributions.service';
import {
  CreateContributionDto,
  UpdateContributionDto,
  FilterContributionsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('contributions')
export class ContributionsController {
  constructor(private readonly contributionsService: ContributionsService) {}

  @Post()
  create(
    @Body() createContributionDto: CreateContributionDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.contributionsService.create(createContributionDto, req.user.id);
  }

  @Get()
  findAll(@Query() filters: FilterContributionsDto) {
    return this.contributionsService.findAll(filters);
  }

  @Get('summary/monthly/:targetMonth')
  getMonthlySummary(@Param('targetMonth') targetMonth: string) {
    return this.contributionsService.getMonthlySummary(targetMonth);
  }

  @Get('summary/yearly/:year')
  getYearlySummary(@Param('year', ParseIntPipe) year: number) {
    return this.contributionsService.getYearlySummary(year);
  }

  @Get('user/:userId/status/:year')
  getUserYearStatus(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.contributionsService.getUserContributionStatus(userId, year);
  }

  @Post('mark-overdue')
  markOverdue() {
    return this.contributionsService.markOverdueContributions();
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.contributionsService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contributionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContributionDto: UpdateContributionDto,
  ) {
    return this.contributionsService.update(id, updateContributionDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contributionsService.remove(id);
  }
}
