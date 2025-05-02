import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // Handles user login
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Fetch user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Avoid revealing whether email exists for security reasons
      throw new UnauthorizedException('Email is not valid!');
    }

    // Compare hashed password using bcrypt
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      // Same message structure to avoid leaking which field failed
      throw new UnauthorizedException('Password is not valid!');
    }

    // Create JWT payload with useful user info
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role, // Consider minimizing exposure depending on your token usage
    };

    return {
      status: true,
      access_token: this.jwtService.sign(payload), // Access token generated
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  // Handles user registration
  async register(registerDto: RegisterDto) {
    // Check for existing user
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists!');
    }

    // Create new user (ensure service hashes password internally)
    const user = await this.usersService.create(registerDto);

    // Generate JWT token
    const token = this.generateToken(user.id);

    return {
      status: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      access_token: token,
    };
  }

  // Generates a signed JWT token
  private generateToken(userId: string): string {
    const payload = { sub: userId }; // Minimal payload; could include role/email if needed
    return this.jwtService.sign(payload);
  }

  // Validates user existence from JWT payload (used in strategies/guards)
  async validateUser(userId: string): Promise<any> {
    return this.usersService.findOne(userId); // Consider removing sensitive fields before return
  }
}
