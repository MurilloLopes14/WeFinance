import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/types/jwt-payload.type';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('households/:householdId/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a category (owner only)' })
  @ApiResponse({ status: 201, type: CategoryResponseDto })
  create(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: CreateCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.categoriesService.create(householdId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all categories in a household (flat list)' })
  @ApiResponse({ status: 200, type: [CategoryResponseDto] })
  findAll(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.categoriesService.findAll(householdId, user.id);
  }

  @Get(':categoryId')
  @ApiOperation({ summary: 'Get category details' })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  findOne(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.categoriesService.findOne(householdId, categoryId, user.id);
  }

  @Patch(':categoryId')
  @ApiOperation({ summary: 'Update a category (owner only)' })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  update(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.categoriesService.update(householdId, categoryId, user.id, dto);
  }

  @Delete(':categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category (owner only)' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.categoriesService.remove(householdId, categoryId, user.id);
  }
}
