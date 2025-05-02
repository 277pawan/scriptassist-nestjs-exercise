import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('users') // 📘 Swagger tag for API grouping
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor) // 🛡️ Automatically exclude sensitive fields (e.g., password) from response
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  // ✅ Public route: Create new user
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard) // 🔐 Protected route: JWT authentication required
  @ApiBearerAuth() // 📘 Adds bearer token input in Swagger UI
  @Get()
  // 🔍 Admin or authenticated users can fetch all users
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  // 🔍 Get a single user by ID — protected
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  // ✏️ Update user data — password will be hashed if included
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  // ❌ Delete a user (will fail if user is referenced elsewhere)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

