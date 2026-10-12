import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['mcp', 'app'] })
  tokenType: 'mcp' | 'app';

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  expiresAt: Date;
}

export class CreatedAccessTokenResponseDto extends AccessTokenResponseDto {
  @ApiProperty({
    description:
      'Token puro. Exibido apenas nesta resposta; o banco guarda o hash.',
  })
  token: string;
}
