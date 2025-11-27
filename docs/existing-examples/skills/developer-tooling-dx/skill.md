# Developer Tooling & DX Skill

Advanced developer experience and tooling expertise covering IDE automation, local environment orchestration, CLI tool development, and comprehensive developer platform engineering with modern productivity optimization.

## Skill Overview

Expert developer tooling knowledge including IDE configuration automation, development environment standardization, CLI tool architecture, developer workflow optimization, code quality automation, and modern developer experience platform engineering.

## Core Capabilities

### IDE & Editor Integration
- **VS Code automation** - Extension development, workspace configuration, task automation, debugging setups
- **IntelliJ Platform** - Plugin development, project templates, code generation, inspection automation
- **Vim/Neovim** - Configuration management, plugin ecosystems, LSP integration, workflow automation
- **Language servers** - LSP implementation, diagnostic providers, code completion, refactoring tools

### Local Development Environments
- **Dev containers** - Docker development environments, VS Code integration, reproducible setups
- **Docker Compose** - Multi-service orchestration, hot reloading, service dependencies, networking
- **Vagrant/VMs** - Virtual development environments, provisioning scripts, environment isolation
- **Package management** - Version managers, dependency isolation, reproducible builds

### CLI Tool Development
- **Framework expertise** - Commander.js, Click, Cobra, Thor for CLI architecture and UX
- **Terminal UI** - Rich interfaces, progress bars, interactive prompts, colored output
- **Automation scripting** - Bash, PowerShell, Python automation for developer workflows
- **Package distribution** - npm, pip, Homebrew, binary distribution strategies

### Developer Workflow Optimization
- **Git automation** - Hooks, templates, workflow automation, branch management strategies
- **Code quality gates** - Pre-commit hooks, CI integration, automated formatting, linting
- **Documentation automation** - API docs generation, README automation, changelog generation
- **Onboarding automation** - Environment setup scripts, tutorial systems, guided workflows

## Modern Developer Tooling Platform Implementation

### Comprehensive Developer Experience Platform
```typescript
// Advanced developer experience platform with IDE automation, environment orchestration, and CLI tools
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import figlet from 'figlet';
import { table } from 'table';
import ProgressBar from 'progress';
import { createWriteStream, promises as fs } from 'fs';
import { execSync, spawn, ChildProcess } from 'child_process';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { Docker } from 'docker-compose';
import { Octokit } from '@octokit/rest';
import { globSync } from 'glob';
import chokidar from 'chokidar';
import express from 'express';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import semver from 'semver';

// Types and interfaces
interface DeveloperPlatformConfig {
  ide: {
    preferred: 'vscode' | 'intellij' | 'vim' | 'emacs';
    extensions: ExtensionConfig[];
    settings: Record<string, any>;
    keybindings: KeybindingConfig[];
  };
  environment: {
    runtime: 'docker' | 'native' | 'vm';
    services: ServiceConfig[];
    volumes: VolumeConfig[];
    networking: NetworkConfig;
  };
  tools: {
    cli: CLIConfig[];
    git: GitConfig;
    quality: QualityConfig;
    docs: DocsConfig;
  };
  workflows: {
    onboarding: OnboardingStep[];
    development: WorkflowStep[];
    deployment: DeploymentStep[];
  };
}

interface ExtensionConfig {
  id: string;
  name: string;
  version?: string;
  settings?: Record<string, any>;
  required: boolean;
}

interface KeybindingConfig {
  key: string;
  command: string;
  when?: string;
}

interface ServiceConfig {
  name: string;
  image: string;
  ports: PortMapping[];
  environment: Record<string, string>;
  volumes: string[];
  dependsOn: string[];
  healthcheck?: HealthcheckConfig;
}

interface PortMapping {
  host: number;
  container: number;
  protocol?: 'tcp' | 'udp';
}

interface VolumeConfig {
  name: string;
  type: 'bind' | 'volume' | 'tmpfs';
  source?: string;
  target: string;
}

interface NetworkConfig {
  name: string;
  driver: string;
  subnet?: string;
}

interface HealthcheckConfig {
  test: string[];
  interval: string;
  timeout: string;
  retries: number;
  startPeriod?: string;
}

interface CLIConfig {
  name: string;
  version: string;
  installMethod: 'npm' | 'pip' | 'brew' | 'apt' | 'binary';
  source: string;
  required: boolean;
}

interface GitConfig {
  hooks: HookConfig[];
  templates: TemplateConfig[];
  aliases: Record<string, string>;
  configuration: Record<string, string>;
}

interface HookConfig {
  name: string;
  script: string;
  enabled: boolean;
}

interface TemplateConfig {
  name: string;
  path: string;
  variables: Record<string, string>;
}

interface QualityConfig {
  linting: LintingConfig;
  formatting: FormattingConfig;
  testing: TestingConfig;
  security: SecurityConfig;
}

interface LintingConfig {
  tools: LintTool[];
  rules: Record<string, any>;
  autofix: boolean;
}

interface LintTool {
  name: string;
  config: string;
  extensions: string[];
}

interface FormattingConfig {
  tools: FormatTool[];
  onSave: boolean;
  preCommit: boolean;
}

interface FormatTool {
  name: string;
  config: string;
  extensions: string[];
}

interface TestingConfig {
  framework: string;
  coverage: CoverageConfig;
  watch: boolean;
}

interface CoverageConfig {
  threshold: number;
  exclude: string[];
  reports: string[];
}

interface SecurityConfig {
  scanners: SecurityScanner[];
  policies: SecurityPolicy[];
}

interface SecurityScanner {
  name: string;
  config: string;
  schedule: string;
}

interface SecurityPolicy {
  name: string;
  rule: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface DocsConfig {
  generator: string;
  output: string;
  templates: string[];
  automation: AutomationConfig;
}

interface AutomationConfig {
  onCommit: boolean;
  onRelease: boolean;
  schedule?: string;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'setup' | 'install' | 'configure' | 'verify';
  script?: string;
  validation?: ValidationConfig;
}

interface ValidationConfig {
  type: 'command' | 'file' | 'service';
  target: string;
  expected?: string;
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  trigger: TriggerConfig;
  actions: ActionConfig[];
}

interface TriggerConfig {
  type: 'file' | 'git' | 'time' | 'manual';
  pattern?: string;
  schedule?: string;
}

interface ActionConfig {
  type: 'command' | 'script' | 'notification';
  target: string;
  parameters?: Record<string, any>;
}

interface DeploymentStep {
  id: string;
  environment: string;
  prerequisites: string[];
  commands: string[];
  validation: ValidationConfig[];
}

// Core Developer Platform
class DeveloperPlatform {
  private config: DeveloperPlatformConfig;
  private logger: Logger;
  private watchers: Map<string, chokidar.FSWatcher> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private webSocketServer?: WebSocketServer;
  private expressApp: express.Express;

  constructor(config: DeveloperPlatformConfig) {
    this.config = config;
    this.expressApp = express();

    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ''
          }`;
        })
      ),
      transports: [
        new transports.Console(),
        new transports.File({
          filename: path.join(os.homedir(), '.devplatform', 'logs', 'platform.log')
        })
      ]
    });

    this.setupExpress();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Developer Platform...');

    await this.ensureDirectories();
    await this.validateSystem();
    await this.setupIDE();
    await this.setupEnvironment();
    await this.setupTools();
    await this.setupWorkflows();
    await this.startServices();

    this.logger.info('Developer Platform initialized successfully');
  }

  // IDE Setup and Configuration
  private async setupIDE(): Promise<void> {
    this.logger.info(`Setting up ${this.config.ide.preferred} IDE...`);

    switch (this.config.ide.preferred) {
      case 'vscode':
        await this.setupVSCode();
        break;
      case 'intellij':
        await this.setupIntelliJ();
        break;
      case 'vim':
        await this.setupVim();
        break;
      case 'emacs':
        await this.setupEmacs();
        break;
    }

    this.logger.info('IDE setup completed');
  }

  private async setupVSCode(): Promise<void> {
    const vscodeDir = this.getVSCodeConfigDir();
    await fs.mkdir(vscodeDir, { recursive: true });

    // Install extensions
    for (const extension of this.config.ide.extensions) {
      if (extension.required || await this.shouldInstallExtension(extension)) {
        await this.installVSCodeExtension(extension);
      }
    }

    // Apply settings
    const settingsPath = path.join(vscodeDir, 'settings.json');
    const existingSettings = await this.readJSONFile(settingsPath) || {};
    const mergedSettings = { ...existingSettings, ...this.config.ide.settings };
    await fs.writeFile(settingsPath, JSON.stringify(mergedSettings, null, 2));

    // Apply keybindings
    if (this.config.ide.keybindings.length > 0) {
      const keybindingsPath = path.join(vscodeDir, 'keybindings.json');
      await fs.writeFile(keybindingsPath, JSON.stringify(this.config.ide.keybindings, null, 2));
    }

    // Create workspace configuration
    await this.createVSCodeWorkspace();

    // Setup development container
    await this.createDevContainer();
  }

  private async installVSCodeExtension(extension: ExtensionConfig): Promise<void> {
    const spinner = ora(`Installing ${extension.name}...`).start();

    try {
      execSync(`code --install-extension ${extension.id}`, { stdio: 'pipe' });
      spinner.succeed(`Installed ${extension.name}`);

      // Apply extension-specific settings
      if (extension.settings) {
        const settingsPath = path.join(this.getVSCodeConfigDir(), 'settings.json');
        const settings = await this.readJSONFile(settingsPath) || {};
        Object.assign(settings, extension.settings);
        await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
      }
    } catch (error) {
      spinner.fail(`Failed to install ${extension.name}: ${error}`);
    }
  }

  private async createVSCodeWorkspace(): Promise<void> {
    const workspace = {
      folders: [
        { path: '.' }
      ],
      settings: this.config.ide.settings,
      extensions: {
        recommendations: this.config.ide.extensions
          .filter(ext => ext.required)
          .map(ext => ext.id)
      },
      tasks: {
        version: '2.0.0',
        tasks: [
          {
            label: 'Start Development Environment',
            type: 'shell',
            command: 'npm',
            args: ['run', 'dev'],
            group: 'build',
            presentation: {
              echo: true,
              reveal: 'always',
              focus: false,
              panel: 'shared'
            },
            problemMatcher: '$eslint-stylish'
          },
          {
            label: 'Run Tests',
            type: 'shell',
            command: 'npm',
            args: ['test'],
            group: 'test',
            presentation: {
              echo: true,
              reveal: 'always',
              focus: false,
              panel: 'shared'
            }
          },
          {
            label: 'Build Application',
            type: 'shell',
            command: 'npm',
            args: ['run', 'build'],
            group: 'build',
            presentation: {
              echo: true,
              reveal: 'always',
              focus: false,
              panel: 'shared'
            }
          }
        ]
      },
      launch: {
        version: '0.2.0',
        configurations: [
          {
            name: 'Launch Application',
            type: 'node',
            request: 'launch',
            program: '${workspaceFolder}/src/index.js',
            env: {
              NODE_ENV: 'development'
            },
            console: 'integratedTerminal'
          },
          {
            name: 'Debug Tests',
            type: 'node',
            request: 'launch',
            program: '${workspaceFolder}/node_modules/.bin/jest',
            args: ['--runInBand', '--no-coverage'],
            console: 'integratedTerminal'
          }
        ]
      }
    };

    await fs.writeFile('.vscode/workspace.code-workspace', JSON.stringify(workspace, null, 2));
  }

  private async createDevContainer(): Promise<void> {
    const devcontainerDir = '.devcontainer';
    await fs.mkdir(devcontainerDir, { recursive: true });

    const devcontainerConfig = {
      name: 'Development Container',
      dockerComposeFile: '../docker-compose.dev.yml',
      service: 'app',
      workspaceFolder: '/workspace',
      customizations: {
        vscode: {
          extensions: this.config.ide.extensions.map(ext => ext.id),
          settings: this.config.ide.settings
        }
      },
      features: {
        'ghcr.io/devcontainers/features/node:1': {
          version: 'lts'
        },
        'ghcr.io/devcontainers/features/git:1': {},
        'ghcr.io/devcontainers/features/github-cli:1': {}
      },
      postCreateCommand: 'npm install',
      postStartCommand: 'npm run dev',
      remoteUser: 'node'
    };

    await fs.writeFile(
      path.join(devcontainerDir, 'devcontainer.json'),
      JSON.stringify(devcontainerConfig, null, 2)
    );
  }

  // Environment Setup
  private async setupEnvironment(): Promise<void> {
    this.logger.info('Setting up development environment...');

    switch (this.config.environment.runtime) {
      case 'docker':
        await this.setupDockerEnvironment();
        break;
      case 'native':
        await this.setupNativeEnvironment();
        break;
      case 'vm':
        await this.setupVMEnvironment();
        break;
    }

    this.logger.info('Development environment setup completed');
  }

  private async setupDockerEnvironment(): Promise<void> {
    // Create docker-compose.yml
    const dockerCompose = {
      version: '3.8',
      services: {},
      volumes: {},
      networks: {
        [this.config.environment.networking.name]: {
          driver: this.config.environment.networking.driver,
          ...(this.config.environment.networking.subnet && {
            ipam: {
              config: [{ subnet: this.config.environment.networking.subnet }]
            }
          })
        }
      }
    };

    // Add services
    for (const service of this.config.environment.services) {
      dockerCompose.services[service.name] = {
        image: service.image,
        ports: service.ports.map(p => `${p.host}:${p.container}`),
        environment: service.environment,
        volumes: service.volumes,
        depends_on: service.dependsOn,
        networks: [this.config.environment.networking.name],
        ...(service.healthcheck && {
          healthcheck: {
            test: service.healthcheck.test,
            interval: service.healthcheck.interval,
            timeout: service.healthcheck.timeout,
            retries: service.healthcheck.retries,
            ...(service.healthcheck.startPeriod && {
              start_period: service.healthcheck.startPeriod
            })
          }
        })
      };
    }

    // Add volumes
    for (const volume of this.config.environment.volumes) {
      if (volume.type === 'volume') {
        dockerCompose.volumes[volume.name] = {};
      }
    }

    await fs.writeFile('docker-compose.yml', yaml.dump(dockerCompose));

    // Create development-specific compose file
    await this.createDevDockerCompose();

    // Create .env file
    await this.createEnvironmentFile();
  }

  private async createDevDockerCompose(): Promise<void> {
    const devCompose = {
      version: '3.8',
      services: {
        app: {
          build: {
            context: '.',
            dockerfile: 'Dockerfile.dev',
            target: 'development'
          },
          volumes: [
            '.:/workspace:cached',
            '/workspace/node_modules'
          ],
          environment: {
            NODE_ENV: 'development',
            DEBUG: '1'
          },
          ports: ['3000:3000', '9229:9229'], // App and debug ports
          command: 'npm run dev',
          stdin_open: true,
          tty: true
        },
        database: {
          image: 'postgres:15',
          environment: {
            POSTGRES_DB: 'devdb',
            POSTGRES_USER: 'developer',
            POSTGRES_PASSWORD: 'password'
          },
          ports: ['5432:5432'],
          volumes: [
            'postgres_data:/var/lib/postgresql/data',
            './scripts/db:/docker-entrypoint-initdb.d'
          ]
        },
        redis: {
          image: 'redis:7-alpine',
          ports: ['6379:6379'],
          command: 'redis-server --appendonly yes',
          volumes: ['redis_data:/data']
        }
      },
      volumes: {
        postgres_data: {},
        redis_data: {}
      }
    };

    await fs.writeFile('docker-compose.dev.yml', yaml.dump(devCompose));
  }

  // CLI Tool Development
  async createCLITool(name: string, config: any): Promise<void> {
    this.logger.info(`Creating CLI tool: ${name}`);

    const cliDir = path.join('tools', name);
    await fs.mkdir(cliDir, { recursive: true });

    // Create package.json
    const packageJson = {
      name: `@company/${name}`,
      version: '1.0.0',
      description: config.description || `CLI tool for ${name}`,
      main: 'dist/index.js',
      bin: {
        [name]: 'bin/cli.js'
      },
      scripts: {
        build: 'tsc',
        dev: 'ts-node src/index.ts',
        test: 'jest',
        lint: 'eslint src/**/*.ts',
        format: 'prettier --write src/**/*.ts'
      },
      dependencies: {
        'commander': '^11.0.0',
        'inquirer': '^9.0.0',
        'chalk': '^5.0.0',
        'ora': '^7.0.0',
        'boxen': '^7.0.0'
      },
      devDependencies: {
        'typescript': '^5.0.0',
        '@types/node': '^20.0.0',
        '@types/inquirer': '^9.0.0',
        'ts-node': '^10.0.0',
        'jest': '^29.0.0',
        'eslint': '^8.0.0',
        'prettier': '^3.0.0'
      }
    };

    await fs.writeFile(
      path.join(cliDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create TypeScript configuration
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', '**/*.test.ts']
    };

    await fs.writeFile(
      path.join(cliDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );

    // Create main CLI entry point
    const cliCode = await this.generateCLICode(name, config);
    await fs.mkdir(path.join(cliDir, 'src'), { recursive: true });
    await fs.writeFile(path.join(cliDir, 'src', 'index.ts'), cliCode);

    // Create executable binary
    const binCode = `#!/usr/bin/env node
require('../dist/index.js');
`;
    await fs.mkdir(path.join(cliDir, 'bin'), { recursive: true });
    await fs.writeFile(path.join(cliDir, 'bin', 'cli.js'), binCode);
    await fs.chmod(path.join(cliDir, 'bin', 'cli.js'), '755');

    this.logger.info(`CLI tool ${name} created successfully`);
  }

  private async generateCLICode(name: string, config: any): Promise<string> {
    return `
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const program = new Command();

program
  .name('${name}')
  .description('${config.description || `CLI tool for ${name}`}')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize a new project')
  .option('-t, --template <template>', 'Project template to use')
  .option('-n, --name <name>', 'Project name')
  .action(async (options) => {
    console.log(
      boxen(chalk.blue.bold('🚀 Welcome to ${name}!'), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'blue',
      })
    );

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'What is your project name?',
        default: options.name || 'my-project',
        validate: (input) => {
          if (!input.trim()) {
            return 'Project name is required';
          }
          return true;
        },
      },
      {
        type: 'list',
        name: 'template',
        message: 'Choose a template:',
        choices: [
          { name: 'React App', value: 'react' },
          { name: 'Node.js API', value: 'api' },
          { name: 'Full Stack', value: 'fullstack' },
          { name: 'Custom', value: 'custom' },
        ],
        default: options.template || 'react',
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features to include:',
        choices: [
          { name: 'TypeScript', value: 'typescript', checked: true },
          { name: 'ESLint', value: 'eslint', checked: true },
          { name: 'Prettier', value: 'prettier', checked: true },
          { name: 'Jest Testing', value: 'jest', checked: true },
          { name: 'Docker', value: 'docker' },
          { name: 'CI/CD', value: 'cicd' },
        ],
      },
    ]);

    const spinner = ora('Creating project...').start();

    try {
      // Create project directory
      await fs.mkdir(answers.projectName, { recursive: true });

      // Generate project files based on template and features
      await generateProjectFiles(answers.projectName, answers.template, answers.features);

      spinner.succeed('Project created successfully!');

      console.log(
        boxen(
          chalk.green('✅ Setup complete!\\n\\n') +
          chalk.white('Next steps:\\n') +
          chalk.cyan('1. cd ' + answers.projectName + '\\n') +
          chalk.cyan('2. npm install\\n') +
          chalk.cyan('3. npm run dev'),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green',
          }
        )
      );
    } catch (error) {
      spinner.fail('Project creation failed');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('dev')
  .description('Start development environment')
  .option('-p, --port <port>', 'Port to run on', '3000')
  .option('-h, --hot', 'Enable hot reloading')
  .action(async (options) => {
    const spinner = ora('Starting development environment...').start();

    try {
      // Start development server
      await startDevServer(options);
      spinner.succeed('Development server started');
    } catch (error) {
      spinner.fail('Failed to start development server');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('build')
  .description('Build project for production')
  .option('-o, --output <dir>', 'Output directory', 'dist')
  .option('--analyze', 'Analyze bundle size')
  .action(async (options) => {
    const spinner = ora('Building project...').start();

    try {
      await buildProject(options);
      spinner.succeed('Build completed');
    } catch (error) {
      spinner.fail('Build failed');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('deploy')
  .description('Deploy project')
  .option('-e, --env <environment>', 'Target environment', 'staging')
  .option('--dry-run', 'Show what would be deployed without actually deploying')
  .action(async (options) => {
    if (options.dryRun) {
      console.log(chalk.yellow('🔍 Dry run mode - showing deployment plan:'));
    }

    const spinner = ora('Deploying project...').start();

    try {
      await deployProject(options);
      spinner.succeed('Deployment completed');
    } catch (error) {
      spinner.fail('Deployment failed');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

async function generateProjectFiles(projectName: string, template: string, features: string[]) {
  // Implementation for generating project files
  const projectPath = path.resolve(projectName);

  // Create basic structure
  const dirs = ['src', 'tests', 'docs', 'scripts'];
  for (const dir of dirs) {
    await fs.mkdir(path.join(projectPath, dir), { recursive: true });
  }

  // Generate package.json based on template and features
  const packageJson = generatePackageJson(projectName, template, features);
  await fs.writeFile(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Generate other files based on features
  if (features.includes('typescript')) {
    await generateTypeScriptConfig(projectPath);
  }

  if (features.includes('eslint')) {
    await generateESLintConfig(projectPath);
  }

  if (features.includes('prettier')) {
    await generatePrettierConfig(projectPath);
  }

  if (features.includes('docker')) {
    await generateDockerFiles(projectPath);
  }
}

function generatePackageJson(name: string, template: string, features: string[]) {
  const base = {
    name,
    version: '1.0.0',
    description: '',
    main: 'index.js',
    scripts: {
      start: 'node src/index.js',
    },
    keywords: [],
    author: '',
    license: 'MIT',
    dependencies: {},
    devDependencies: {},
  };

  // Add template-specific dependencies
  switch (template) {
    case 'react':
      Object.assign(base.dependencies, {
        'react': '^18.0.0',
        'react-dom': '^18.0.0',
      });
      base.scripts = {
        ...base.scripts,
        'dev': 'vite',
        'build': 'vite build',
        'serve': 'vite preview',
      };
      break;
    case 'api':
      Object.assign(base.dependencies, {
        'express': '^4.18.0',
        'cors': '^2.8.5',
        'helmet': '^7.0.0',
      });
      base.scripts = {
        ...base.scripts,
        'dev': 'nodemon src/index.js',
        'build': 'node build.js',
      };
      break;
  }

  // Add feature-specific dependencies
  if (features.includes('typescript')) {
    Object.assign(base.devDependencies, {
      'typescript': '^5.0.0',
      '@types/node': '^20.0.0',
      'ts-node': '^10.0.0',
    });
  }

  return base;
}

async function generateTypeScriptConfig(projectPath: string) {
  const tsConfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };

  await fs.writeFile(
    path.join(projectPath, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );
}

async function startDevServer(options: any) {
  // Implementation for starting development server
  console.log(chalk.blue('🚀 Starting development server...'));
  console.log(chalk.gray('Port:'), options.port);
  console.log(chalk.gray('Hot reload:'), options.hot ? 'enabled' : 'disabled');
}

async function buildProject(options: any) {
  // Implementation for building project
  console.log(chalk.blue('🔨 Building project...'));
  console.log(chalk.gray('Output:'), options.output);
  console.log(chalk.gray('Analyze:'), options.analyze ? 'enabled' : 'disabled');
}

async function deployProject(options: any) {
  // Implementation for deploying project
  console.log(chalk.blue('🚀 Deploying to:'), options.env);
  console.log(chalk.gray('Dry run:'), options.dryRun ? 'yes' : 'no');
}

program.parse(process.argv);
`;
  }

  // Tool Management and Installation
  async setupTools(): Promise<void> {
    this.logger.info('Setting up development tools...');

    for (const tool of this.config.tools.cli) {
      await this.installTool(tool);
    }

    await this.setupGitConfiguration();
    await this.setupQualityTools();
    await this.setupDocumentation();

    this.logger.info('Development tools setup completed');
  }

  private async installTool(tool: CLIConfig): Promise<void> {
    const spinner = ora(`Installing ${tool.name}...`).start();

    try {
      const isInstalled = await this.checkToolInstalled(tool);

      if (isInstalled && !tool.required) {
        spinner.info(`${tool.name} is already installed`);
        return;
      }

      switch (tool.installMethod) {
        case 'npm':
          execSync(`npm install -g ${tool.source}@${tool.version}`, { stdio: 'pipe' });
          break;
        case 'pip':
          execSync(`pip install ${tool.source}==${tool.version}`, { stdio: 'pipe' });
          break;
        case 'brew':
          execSync(`brew install ${tool.source}`, { stdio: 'pipe' });
          break;
        case 'apt':
          execSync(`sudo apt-get install -y ${tool.source}`, { stdio: 'pipe' });
          break;
        case 'binary':
          await this.downloadBinary(tool);
          break;
      }

      spinner.succeed(`Installed ${tool.name}`);
    } catch (error) {
      spinner.fail(`Failed to install ${tool.name}: ${error.message}`);
      if (tool.required) {
        throw error;
      }
    }
  }

  private async checkToolInstalled(tool: CLIConfig): Promise<boolean> {
    try {
      execSync(`${tool.name} --version`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  private async setupGitConfiguration(): Promise<void> {
    // Install git hooks
    const gitHooksDir = path.join('.git', 'hooks');

    for (const hook of this.config.tools.git.hooks) {
      if (hook.enabled) {
        const hookPath = path.join(gitHooksDir, hook.name);
        await fs.writeFile(hookPath, hook.script);
        await fs.chmod(hookPath, '755');
      }
    }

    // Apply git configuration
    for (const [key, value] of Object.entries(this.config.tools.git.configuration)) {
      execSync(`git config --global ${key} "${value}"`, { stdio: 'pipe' });
    }

    // Setup git aliases
    for (const [alias, command] of Object.entries(this.config.tools.git.aliases)) {
      execSync(`git config --global alias.${alias} "${command}"`, { stdio: 'pipe' });
    }

    // Create git templates
    const gitTemplateDir = path.join(os.homedir(), '.git-templates');
    await fs.mkdir(gitTemplateDir, { recursive: true });

    for (const template of this.config.tools.git.templates) {
      const templatePath = path.join(gitTemplateDir, template.name);
      let content = await fs.readFile(template.path, 'utf-8');

      // Replace variables
      for (const [variable, value] of Object.entries(template.variables)) {
        content = content.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      }

      await fs.writeFile(templatePath, content);
    }
  }

  // Workflow Automation
  private async setupWorkflows(): Promise<void> {
    this.logger.info('Setting up automated workflows...');

    // Setup file watchers
    for (const workflow of this.config.workflows.development) {
      if (workflow.trigger.type === 'file') {
        await this.setupFileWatcher(workflow);
      }
    }

    // Setup scheduled workflows
    for (const workflow of this.config.workflows.development) {
      if (workflow.trigger.type === 'time' && workflow.trigger.schedule) {
        await this.setupScheduledWorkflow(workflow);
      }
    }

    this.logger.info('Automated workflows setup completed');
  }

  private async setupFileWatcher(workflow: WorkflowStep): Promise<void> {
    const pattern = workflow.trigger.pattern || '**/*';
    const watcher = chokidar.watch(pattern, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    });

    watcher.on('change', async (filePath) => {
      this.logger.info(`File changed: ${filePath}, executing workflow: ${workflow.name}`);

      for (const action of workflow.actions) {
        await this.executeAction(action, { filePath });
      }
    });

    this.watchers.set(workflow.id, watcher);
  }

  private async executeAction(action: ActionConfig, context: any): Promise<void> {
    try {
      switch (action.type) {
        case 'command':
          const command = this.interpolateVariables(action.target, context);
          execSync(command, { stdio: 'inherit' });
          break;
        case 'script':
          const script = this.interpolateVariables(action.target, context);
          await this.executeScript(script, action.parameters || {});
          break;
        case 'notification':
          await this.sendNotification(action.target, context);
          break;
      }
    } catch (error) {
      this.logger.error(`Action execution failed: ${error.message}`);
    }
  }

  // Onboarding System
  async runOnboarding(): Promise<void> {
    console.log(
      boxen(chalk.blue.bold('🚀 Welcome to the Development Platform!'), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'blue',
      })
    );

    for (const step of this.config.workflows.onboarding) {
      await this.executeOnboardingStep(step);
    }

    console.log(
      boxen(chalk.green.bold('✅ Onboarding completed successfully!'), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
      })
    );
  }

  private async executeOnboardingStep(step: OnboardingStep): Promise<void> {
    console.log(chalk.blue.bold(`\n📋 ${step.title}`));
    console.log(chalk.gray(step.description));

    const spinner = ora('Processing...').start();

    try {
      switch (step.type) {
        case 'setup':
          await this.setupStep(step);
          break;
        case 'install':
          await this.installStep(step);
          break;
        case 'configure':
          await this.configureStep(step);
          break;
        case 'verify':
          await this.verifyStep(step);
          break;
      }

      // Validate step completion
      if (step.validation) {
        const isValid = await this.validateStep(step.validation);
        if (!isValid) {
          throw new Error('Step validation failed');
        }
      }

      spinner.succeed(`${step.title} completed`);
    } catch (error) {
      spinner.fail(`${step.title} failed: ${error.message}`);

      const { retry } = await inquirer.prompt([{
        type: 'confirm',
        name: 'retry',
        message: 'Would you like to retry this step?',
        default: true,
      }]);

      if (retry) {
        await this.executeOnboardingStep(step);
      } else {
        throw error;
      }
    }
  }

  // Monitoring and Analytics
  private async startServices(): Promise<void> {
    // Start monitoring dashboard
    this.setupMonitoringDashboard();

    // Start WebSocket server for real-time updates
    this.setupWebSocketServer();

    // Start health checks
    this.startHealthChecks();

    this.logger.info('Platform services started successfully');
  }

  private setupMonitoringDashboard(): void {
    this.expressApp.use(express.static('dashboard'));
    this.expressApp.use(express.json());

    // API endpoints
    this.expressApp.get('/api/metrics', (req, res) => {
      res.json(this.getMetrics());
    });

    this.expressApp.get('/api/status', (req, res) => {
      res.json(this.getSystemStatus());
    });

    this.expressApp.get('/api/logs', (req, res) => {
      res.json(this.getRecentLogs());
    });

    this.expressApp.listen(8080, () => {
      this.logger.info('Monitoring dashboard available at http://localhost:8080');
    });
  }

  private setupWebSocketServer(): void {
    this.webSocketServer = new WebSocketServer({ port: 8081 });

    this.webSocketServer.on('connection', (ws) => {
      this.logger.info('Client connected to WebSocket server');

      // Send initial status
      ws.send(JSON.stringify({
        type: 'status',
        data: this.getSystemStatus()
      }));

      ws.on('close', () => {
        this.logger.info('Client disconnected from WebSocket server');
      });
    });

    // Send periodic updates
    setInterval(() => {
      if (this.webSocketServer) {
        const status = this.getSystemStatus();
        this.webSocketServer.clients.forEach((client) => {
          client.send(JSON.stringify({
            type: 'status_update',
            data: status
          }));
        });
      }
    }, 5000);
  }

  // Utility Methods
  private getVSCodeConfigDir(): string {
    switch (process.platform) {
      case 'darwin':
        return path.join(os.homedir(), 'Library/Application Support/Code/User');
      case 'win32':
        return path.join(os.homedir(), 'AppData/Roaming/Code/User');
      default:
        return path.join(os.homedir(), '.config/Code/User');
    }
  }

  private async readJSONFile(filePath: string): Promise<any> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private async shouldInstallExtension(extension: ExtensionConfig): Promise<boolean> {
    const { install } = await inquirer.prompt([{
      type: 'confirm',
      name: 'install',
      message: `Install ${extension.name}?`,
      default: extension.required,
    }]);

    return install;
  }

  private interpolateVariables(template: string, context: any): string {
    return template.replace(/\${(\w+)}/g, (match, variable) => {
      return context[variable] || match;
    });
  }

  private getMetrics(): any {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      watchers: this.watchers.size,
      processes: this.processes.size,
    };
  }

  private getSystemStatus(): any {
    return {
      platform: {
        status: 'healthy',
        version: '1.0.0',
        uptime: process.uptime(),
      },
      services: {
        ide: this.config.ide.preferred,
        environment: this.config.environment.runtime,
        watchers: Array.from(this.watchers.keys()),
      },
      metrics: this.getMetrics(),
    };
  }

  private getRecentLogs(): any[] {
    // Return recent log entries
    return [];
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [
      path.join(os.homedir(), '.devplatform'),
      path.join(os.homedir(), '.devplatform', 'logs'),
      path.join(os.homedir(), '.devplatform', 'config'),
      path.join(os.homedir(), '.devplatform', 'cache'),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private async validateSystem(): Promise<void> {
    // System validation logic
    this.logger.info('Validating system requirements...');
  }

  private async setupIntelliJ(): Promise<void> {
    // IntelliJ setup implementation
    this.logger.info('Setting up IntelliJ IDEA...');
  }

  private async setupVim(): Promise<void> {
    // Vim setup implementation
    this.logger.info('Setting up Vim/Neovim...');
  }

  private async setupEmacs(): Promise<void> {
    // Emacs setup implementation
    this.logger.info('Setting up Emacs...');
  }

  private async setupNativeEnvironment(): Promise<void> {
    // Native environment setup
    this.logger.info('Setting up native development environment...');
  }

  private async setupVMEnvironment(): Promise<void> {
    // VM environment setup
    this.logger.info('Setting up VM development environment...');
  }

  private async createEnvironmentFile(): Promise<void> {
    const envContent = `
# Development Environment Variables
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://developer:password@localhost:5432/devdb
REDIS_URL=redis://localhost:6379
DEBUG=1
`;

    await fs.writeFile('.env', envContent.trim());
  }

  private async downloadBinary(tool: CLIConfig): Promise<void> {
    // Binary download implementation
    this.logger.info(`Downloading binary for ${tool.name}...`);
  }

  private async setupQualityTools(): Promise<void> {
    // Quality tools setup
    this.logger.info('Setting up code quality tools...');
  }

  private async setupDocumentation(): Promise<void> {
    // Documentation setup
    this.logger.info('Setting up documentation tools...');
  }

  private async setupScheduledWorkflow(workflow: WorkflowStep): Promise<void> {
    // Scheduled workflow setup
    this.logger.info(`Setting up scheduled workflow: ${workflow.name}`);
  }

  private async executeScript(script: string, parameters: any): Promise<void> {
    // Script execution
    this.logger.info(`Executing script: ${script}`);
  }

  private async sendNotification(message: string, context: any): Promise<void> {
    // Notification sending
    this.logger.info(`Notification: ${message}`);
  }

  private async setupStep(step: OnboardingStep): Promise<void> {
    if (step.script) {
      execSync(step.script, { stdio: 'inherit' });
    }
  }

  private async installStep(step: OnboardingStep): Promise<void> {
    if (step.script) {
      execSync(step.script, { stdio: 'inherit' });
    }
  }

  private async configureStep(step: OnboardingStep): Promise<void> {
    if (step.script) {
      execSync(step.script, { stdio: 'inherit' });
    }
  }

  private async verifyStep(step: OnboardingStep): Promise<void> {
    if (step.script) {
      execSync(step.script, { stdio: 'inherit' });
    }
  }

  private async validateStep(validation: ValidationConfig): Promise<boolean> {
    try {
      switch (validation.type) {
        case 'command':
          execSync(validation.target, { stdio: 'pipe' });
          return true;
        case 'file':
          await fs.access(validation.target);
          return true;
        case 'service':
          // Service validation logic
          return true;
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  private startHealthChecks(): void {
    setInterval(() => {
      // Health check logic
    }, 30000);
  }
}

// Example usage
export async function createDeveloperPlatformExample(): Promise<void> {
  const config: DeveloperPlatformConfig = {
    ide: {
      preferred: 'vscode',
      extensions: [
        {
          id: 'ms-vscode.vscode-typescript-next',
          name: 'TypeScript Nightly',
          required: true,
          settings: {
            'typescript.preferences.quoteStyle': 'single',
            'typescript.updateImportsOnFileMove.enabled': 'always',
          },
        },
        {
          id: 'esbenp.prettier-vscode',
          name: 'Prettier',
          required: true,
        },
        {
          id: 'ms-vscode.vscode-eslint',
          name: 'ESLint',
          required: true,
        },
        {
          id: 'bradlc.vscode-tailwindcss',
          name: 'Tailwind CSS IntelliSense',
          required: false,
        },
      ],
      settings: {
        'editor.formatOnSave': true,
        'editor.codeActionsOnSave': {
          'source.fixAll.eslint': true,
        },
        'typescript.preferences.quoteStyle': 'single',
        'workbench.colorTheme': 'One Dark Pro',
      },
      keybindings: [
        {
          key: 'ctrl+shift+p',
          command: 'workbench.action.showCommands',
        },
      ],
    },
    environment: {
      runtime: 'docker',
      services: [
        {
          name: 'database',
          image: 'postgres:15',
          ports: [{ host: 5432, container: 5432 }],
          environment: {
            POSTGRES_DB: 'devdb',
            POSTGRES_USER: 'developer',
            POSTGRES_PASSWORD: 'password',
          },
          volumes: ['postgres_data:/var/lib/postgresql/data'],
          dependsOn: [],
          healthcheck: {
            test: ['CMD-SHELL', 'pg_isready -U developer'],
            interval: '10s',
            timeout: '5s',
            retries: 5,
          },
        },
        {
          name: 'redis',
          image: 'redis:7-alpine',
          ports: [{ host: 6379, container: 6379 }],
          environment: {},
          volumes: ['redis_data:/data'],
          dependsOn: [],
        },
      ],
      volumes: [
        {
          name: 'postgres_data',
          type: 'volume',
          target: '/var/lib/postgresql/data',
        },
        {
          name: 'redis_data',
          type: 'volume',
          target: '/data',
        },
      ],
      networking: {
        name: 'dev-network',
        driver: 'bridge',
        subnet: '172.20.0.0/16',
      },
    },
    tools: {
      cli: [
        {
          name: 'node',
          version: '20.x',
          installMethod: 'binary',
          source: 'https://nodejs.org/dist/v20.10.0/',
          required: true,
        },
        {
          name: 'docker',
          version: 'latest',
          installMethod: 'binary',
          source: 'https://docs.docker.com/get-docker/',
          required: true,
        },
      ],
      git: {
        hooks: [
          {
            name: 'pre-commit',
            script: '#!/bin/sh\nnpm run lint\nnpm run test',
            enabled: true,
          },
        ],
        templates: [],
        aliases: {
          st: 'status',
          co: 'checkout',
          br: 'branch',
        },
        configuration: {
          'user.name': 'Developer',
          'user.email': 'developer@example.com',
        },
      },
      quality: {
        linting: {
          tools: [
            {
              name: 'eslint',
              config: '.eslintrc.js',
              extensions: ['.js', '.ts', '.tsx'],
            },
          ],
          rules: {},
          autofix: true,
        },
        formatting: {
          tools: [
            {
              name: 'prettier',
              config: '.prettierrc',
              extensions: ['.js', '.ts', '.tsx', '.json', '.md'],
            },
          ],
          onSave: true,
          preCommit: true,
        },
        testing: {
          framework: 'jest',
          coverage: {
            threshold: 80,
            exclude: ['node_modules/**', 'dist/**'],
            reports: ['text', 'lcov', 'html'],
          },
          watch: true,
        },
        security: {
          scanners: [],
          policies: [],
        },
      },
      docs: {
        generator: 'typedoc',
        output: 'docs',
        templates: ['api', 'guides'],
        automation: {
          onCommit: false,
          onRelease: true,
        },
      },
    },
    workflows: {
      onboarding: [
        {
          id: 'welcome',
          title: 'Welcome',
          description: 'Welcome to the development platform',
          type: 'setup',
        },
        {
          id: 'system-check',
          title: 'System Requirements Check',
          description: 'Verifying system requirements',
          type: 'verify',
          script: 'node --version && docker --version',
        },
        {
          id: 'environment-setup',
          title: 'Environment Setup',
          description: 'Setting up development environment',
          type: 'setup',
          script: 'docker-compose up -d',
        },
      ],
      development: [
        {
          id: 'auto-test',
          name: 'Auto Test',
          description: 'Run tests on file changes',
          trigger: {
            type: 'file',
            pattern: 'src/**/*.{js,ts}',
          },
          actions: [
            {
              type: 'command',
              target: 'npm test',
            },
          ],
        },
      ],
      deployment: [
        {
          id: 'staging-deploy',
          environment: 'staging',
          prerequisites: ['tests-pass', 'build-success'],
          commands: ['docker build -t app:latest .', 'docker push app:latest'],
          validation: [
            {
              type: 'service',
              target: 'https://staging.example.com/health',
            },
          ],
        },
      ],
    },
  };

  const platform = new DeveloperPlatform(config);
  await platform.initialize();
  await platform.runOnboarding();

  console.log('Developer platform initialized and ready for use!');
}

export { DeveloperPlatform, DeveloperPlatformConfig };
```

## Skill Activation Triggers

This skill automatically activates when:
- Developer environment setup is needed
- IDE configuration and automation is required
- CLI tool development is requested
- Development workflow optimization is needed
- Team onboarding and standardization is required
- Developer experience improvement is requested

This comprehensive developer tooling and DX skill provides expert-level capabilities for building modern, automated development environments with advanced tooling, workflow optimization, and team productivity enhancements.