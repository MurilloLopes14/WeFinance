import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { validateEnvironment } from './config/validate-environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  validateEnvironment(configService);

  const apiPrefix = configService.get<string>('api.prefix') || 'api';
  const apiVersion = configService.get<string>('api.version') || 'v1';
  const globalPrefix = `${apiPrefix}/${apiVersion}`;
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const nodeEnv = configService.get<string>('nodeEnv');
  const corsOrigin = configService.get<string | string[]>('cors.origin');
  const corsCredentials = configService.get<boolean>('cors.credentials');

  app.enableCors({
    origin:
      corsOrigin ?? (nodeEnv === 'development' ? true : 'http://localhost:5173'),
    credentials: corsCredentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    maxAge: 3600,
  });

  const swaggerEnabled = configService.get<boolean>('swagger.enabled');
  const port = configService.get<number>('port') || 3000;

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(configService.get<string>('swagger.title') || 'WeFinance API')
      .setDescription(
        configService.get<string>('swagger.description') ||
          'Shared Finance Management API - Manage groups, transactions, and shared expenses',
      )
      .setVersion(configService.get<string>('swagger.version') || '1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Households', 'Household management endpoints')
      .addTag('Accounts', 'Account management endpoints')
      .addTag('Categories', 'Category management endpoints')
      .addTag('Payees', 'Payee management endpoints')
      .addTag('Transactions', 'Transaction management endpoints')
      .addTag('Transaction Splits', 'Split management endpoints')
      .addTag('Subscriptions', 'Recurring subscription management')
      .addTag('Events', 'Audit log endpoints')
      .addTag('Imports', 'CSV import endpoints')
      .addServer(`http://localhost:${port}/${globalPrefix}`, 'Local Development')
      .addServer(`https://api.wefinance.com/${globalPrefix}`, 'Production')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    const swaggerPath = configService.get<string>('swagger.path') || 'docs';

    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'WeFinance API Documentation',
      customfavIcon: 'https://nestjs.com/img/logo-small.svg',
      customCss: '.swagger-ui .topbar { display: none }',
    });

   
  }

  await app.listen(port);

  console.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
   console.log(
     `📚 Swagger documentation available at: http://localhost:${port}/docs`,
   );
  console.log(`🌍 Environment: ${configService.get<string>('nodeEnv')}`);
}

bootstrap();
