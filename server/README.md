# WeFinance Server

Backend API for WeFinance - A shared finance management application built with NestJS, Drizzle ORM, and PostgreSQL.

## 🚀 Features

- **NestJS Framework**: Modern, scalable Node.js framework
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Robust relational database
- **Swagger Documentation**: Auto-generated API documentation
- **JWT Authentication**: Secure authentication system
- **CORS Configuration**: Flexible cross-origin resource sharing
- **Environment Configuration**: Comprehensive config management
- **Validation**: Request validation with class-validator
- **TypeScript**: Full type safety

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or pnpm

## 🛠️ Installation

```bash
# Install dependencies
npm install
```

## ⚙️ Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration:
```env
DATABASE_URL=postgres://postgres:password@localhost:5432/wefinance
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

## 🗄️ Database Setup

### Generate Migration
```bash
npm run db:generate
```

### Run Migrations
```bash
npm run db:migrate
```

### Push Schema (Development)
```bash
npm run db:push
```

### Open Drizzle Studio
```bash
npm run db:studio
```

## 🏃 Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

### Debug Mode
```bash
npm run start:debug
```

## 📚 API Documentation

Once the server is running, access the Swagger documentation at:
```
http://localhost:3000/docs
```

## 🔑 Environment Variables

### Server Configuration
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

### Database Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name

### JWT Configuration
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRES_IN`: Token expiration time
- `JWT_REFRESH_SECRET`: Refresh token secret
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration

### CORS Configuration
- `CORS_ORIGIN`: Allowed origins
- `CORS_CREDENTIALS`: Enable credentials

### Swagger Configuration
- `SWAGGER_ENABLED`: Enable/disable Swagger
- `SWAGGER_TITLE`: API title
- `SWAGGER_DESCRIPTION`: API description
- `SWAGGER_PATH`: Documentation path

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📁 Project Structure

```
server/
├── src/
│   ├── config/           # Configuration files
│   │   └── configuration.ts
│   ├── database/         # Database setup
│   │   ├── database.module.ts
│   │   ├── schema.ts
│   │   └── index.ts
│   ├── app.module.ts     # Root module
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts           # Application entry point
├── drizzle/              # Database migrations
├── .env                  # Environment variables
├── .env.example          # Example environment file
├── drizzle.config.ts     # Drizzle configuration
├── nest-cli.json         # NestJS CLI configuration
├── package.json
└── tsconfig.json
```

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Request validation
- CORS protection
- Rate limiting (configurable)
- Environment-based configuration

## 📝 Scripts

- `npm run build`: Build the application
- `npm run start`: Start the application
- `npm run start:dev`: Start in development mode with watch
- `npm run start:debug`: Start in debug mode
- `npm run start:prod`: Start in production mode
- `npm run lint`: Lint the code
- `npm run format`: Format the code with Prettier
- `npm run test`: Run unit tests
- `npm run test:e2e`: Run end-to-end tests

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

UNLICENSED - Private Project
