# Contributing to Crypto Portfolio AI Tracker

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/crypto-portfolio-ai-tracker.git
   cd crypto-portfolio-ai-tracker
   ```

3. **Install dependencies**
   ```bash
   npm run install-all
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Add your API keys
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

## 🛠️ Development Guidelines

### Code Style
- Use TypeScript for new components
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages

### Component Structure
```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── services/           # API services
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── styles/             # Global styles
```

### API Development
```
server/
├── routes/             # Express routes
├── services/           # Business logic
├── models/             # Database models
├── middleware/         # Custom middleware
└── utils/              # Server utilities
```

## 📝 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write tests for new features
   - Update documentation
   - Ensure code passes linting

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git commit -m "feat: add new feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🎯 Areas for Contribution

### High Priority
- [ ] Additional cryptocurrency exchange integrations
- [ ] Advanced AI analysis features
- [ ] Mobile app development
- [ ] Performance optimizations
- [ ] Security enhancements

### Medium Priority
- [ ] Additional chart types
- [ ] Export functionality
- [ ] Email notifications
- [ ] Social features
- [ ] API rate limiting improvements

### Low Priority
- [ ] UI/UX improvements
- [ ] Documentation updates
- [ ] Code refactoring
- [ ] Additional tests

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, browser, Node version)

## 💡 Feature Requests

For feature requests, please provide:
- Clear description of the feature
- Use case and benefits
- Potential implementation approach
- Any relevant examples or mockups

## 🔒 Security

If you discover security vulnerabilities, please:
- **DO NOT** create a public issue
- Email security concerns to: security@example.com
- Provide detailed information about the vulnerability

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🤝 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the community

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Special mentions for outstanding contributions

Thank you for making this project better! 🚀