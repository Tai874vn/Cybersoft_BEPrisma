# Contributing to Cybersoft Backend

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Cybersoft_BEPrisma.git`
3. Install dependencies: `npm install`
4. Set up your `.env` file (see SETUP.md)
5. Generate Prisma client: `npm run prisma:generate`
6. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Workflow

1. Make your changes
2. Test your changes locally
3. Commit your changes with clear commit messages
4. Push to your fork
5. Create a Pull Request

## Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Add JSDoc comments for functions
- Follow existing code patterns

## Project Structure

```
src/
├── config/          # Configuration files (Prisma, Passport, etc.)
├── controllers/     # Request handlers
├── graphql/
│   ├── resolvers/   # GraphQL resolvers
│   └── typeDefs/    # GraphQL schema definitions
├── middleware/      # Express middleware
├── models/          # Database models (if needed)
├── utils/           # Utility functions
└── index.js         # Main server file
```

## Adding New Features

### Adding a New GraphQL Query/Mutation

1. **Update Type Definitions** (`src/graphql/typeDefs/index.js`)
   ```graphql
   type Query {
     # Add your query here
     newQuery(arg: String!): ReturnType
   }
   ```

2. **Add Resolver** (`src/graphql/resolvers/index.js`)
   ```javascript
   Query: {
     newQuery: async (_, { arg }, context) => {
       // Implementation
     }
   }
   ```

3. **Update API.md** with usage examples

### Adding a New REST Endpoint

1. **Add route** in `src/index.js`
   ```javascript
   app.get('/new-endpoint', (req, res) => {
     // Implementation
   });
   ```

2. **Update API.md** with documentation

### Adding a Database Model

1. **Update Prisma Schema** (`prisma/schema.prisma`)
   ```prisma
   model NewModel {
     id        String   @id @default(uuid())
     field     String
     createdAt DateTime @default(now())
   }
   ```

2. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

3. **Create Migration**
   ```bash
   npm run prisma:migrate
   ```

## Testing

Currently, this project does not have automated tests. When adding tests:

1. Create test files in `tests/` directory
2. Use a testing framework like Jest
3. Run tests before submitting PR

## Commit Messages

Follow conventional commits format:

- `feat: add new feature`
- `fix: fix bug in authentication`
- `docs: update API documentation`
- `style: format code`
- `refactor: restructure resolvers`
- `test: add tests for JWT utils`
- `chore: update dependencies`

## Pull Request Process

1. Update documentation if needed
2. Ensure your code follows the project style
3. Test your changes thoroughly
4. Update CHANGELOG.md if applicable
5. Create PR with clear description of changes

### PR Title Format

```
[Type] Brief description

Examples:
[Feature] Add user profile picture upload
[Fix] Resolve token refresh bug
[Docs] Update setup instructions
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Code follows project style
- [ ] Documentation updated
- [ ] Changes tested locally
- [ ] No breaking changes (or documented)
```

## Areas for Contribution

### High Priority
- [ ] Add automated tests
- [ ] Add rate limiting
- [ ] Implement refresh token rotation
- [ ] Add email verification
- [ ] Add password reset functionality

### Medium Priority
- [ ] Add logging with Winston
- [ ] Add request validation
- [ ] Improve error messages
- [ ] Add API versioning
- [ ] Add GraphQL subscriptions

### Low Priority
- [ ] Add admin panel
- [ ] Add user roles and permissions
- [ ] Add two-factor authentication
- [ ] Add OAuth for other providers (GitHub, Facebook)

## Security

If you discover a security vulnerability:

1. **DO NOT** create a public issue
2. Email the maintainers directly
3. Provide details of the vulnerability
4. Wait for confirmation before disclosure

## Questions?

- Check existing documentation (README, API.md, SETUP.md)
- Search existing issues
- Create a new issue with your question

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## License

By contributing, you agree that your contributions will be licensed under the ISC License.
