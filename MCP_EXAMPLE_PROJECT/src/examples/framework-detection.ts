/**
 * Framework Detection Examples
 * 
 * Demonstrates the fixes implemented for framework detection issues:
 * - Fastify false positives in Express projects
 * - Spring Boot graceful fallback for missing dependencies
 * - API surface analysis with heuristic framework detection
 */

import * as fs from 'fs-extra';
import * as path from 'path';

interface ExtractionContext {
  srcPath: string;
  logger: any;
}

interface FlowExtractionResult {
  flows: any[];
  summary: {
    totalFlows: number;
    frameworks: string[];
    endpoints: number;
    services: number;
    repositories: number;
  };
}

/**
 * Example: Fastify Extractor with False Positive Prevention
 * 
 * Problem: Fastify extractor incorrectly processes Express routes
 * Solution: Intelligent framework detection before processing
 */
export class FastifyExtractorExample {
  private context: ExtractionContext;
  private fileIndex: Map<string, any> = new Map();

  constructor(context: ExtractionContext) {
    this.context = context;
  }

  /**
   * Check for actual Fastify indicators in the codebase
   * This prevents false positives in Express projects
   */
  private hasFastifyIndicators(): boolean {
    for (const [, info] of this.fileIndex) {
      // Check for Fastify imports
      for (const src of (info.imports?.values() || [])) {
        if (src === 'fastify') return true;
      }
      
      // Check for actual Fastify instances
      if (info.fastifyInstances && info.fastifyInstances.length > 0) return true;
    }
    return false;
  }

  /**
   * Validate that a route is on an actual Fastify instance
   */
  private isValidFastifyInstance(objectName: string): boolean {
    // Check if the object is a known Fastify instance
    for (const [, info] of this.fileIndex) {
      if (info.fastifyInstances?.includes(objectName)) {
        return true;
      }
    }
    return false;
  }

  async extract(): Promise<FlowExtractionResult> {
    // CRITICAL FIX: Early return if no Fastify indicators found
    if (!this.hasFastifyIndicators()) {
      this.context.logger.info('No Fastify indicators found, skipping extraction');
      return {
        flows: [],
        summary: {
          totalFlows: 0,
          frameworks: [],
          endpoints: 0,
          services: 0,
          repositories: 0
        }
      };
    }

    // Only process routes on actual Fastify instances
    const routes = await this.findRoutes();
    const validRoutes = routes.filter(route => 
      this.isValidFastifyInstance(route.object)
    );

    this.context.logger.info(`Found ${validRoutes.length} valid Fastify routes`);

    return {
      flows: validRoutes,
      summary: {
        totalFlows: validRoutes.length,
        frameworks: ['fastify'],
        endpoints: validRoutes.length,
        services: 0,
        repositories: 0
      }
    };
  }

  private async findRoutes(): Promise<any[]> {
    // Implementation would scan for route definitions
    return [];
  }
}

/**
 * Example: Spring Boot Extractor with Graceful Fallback
 * 
 * Problem: Hard errors when Java dependencies are missing
 * Solution: Graceful fallback with informative logging
 */
export class SpringExtractorExample {
  private context: ExtractionContext;

  constructor(context: ExtractionContext) {
    this.context = context;
  }

  async extract(): Promise<FlowExtractionResult> {
    const pomPath = path.join(this.context.srcPath, 'pom.xml');
    const gradlePath = path.join(this.context.srcPath, 'build.gradle');
    
    // CRITICAL FIX: Check if this is actually a Java project
    if (!(await fs.pathExists(pomPath)) && !(await fs.pathExists(gradlePath))) {
      this.context.logger.warn('No Java project detected. Returning empty result.');
      return this.getEmptyResult();
    }

    try {
      // Attempt Java flow mapping
      return await this.executeJavaFlowMapper();
    } catch (error) {
      // CRITICAL FIX: Graceful fallback instead of hard error
      this.context.logger.warn(`Java flow mapper failed: ${error.message}. Returning empty result.`);
      return this.getEmptyResult();
    }
  }

  private getEmptyResult(): FlowExtractionResult {
    return {
      flows: [],
      summary: {
        totalFlows: 0,
        frameworks: ['spring'],
        endpoints: 0,
        services: 0,
        repositories: 0
      }
    };
  }

  private async executeJavaFlowMapper(): Promise<FlowExtractionResult> {
    // Implementation would call Java flow mapper
    // This might fail if dependencies are missing
    throw new Error('Java flow mapper not available');
  }
}

/**
 * Example: API Surface Analyzer with Heuristic Framework Detection
 * 
 * Problem: Returns 0 endpoints for projects without package.json
 * Solution: Scan source code for framework imports and patterns
 */
export class APISurfaceAnalyzerExample {
  private context: ExtractionContext;

  constructor(context: ExtractionContext) {
    this.context = context;
  }

  async analyze(): Promise<{ frameworks: string[]; endpoints: number }> {
    let frameworks: string[] = [];

    // Try package.json first
    frameworks = await this.detectFrameworksFromPackageJson();

    // CRITICAL FIX: Fallback to source code scanning
    if (frameworks.length === 0) {
      frameworks = await this.detectFrameworksFromSource();
      this.context.logger.info('Used heuristic framework detection from source code');
    }

    // Count endpoints based on detected frameworks
    const endpoints = await this.countEndpoints(frameworks);

    return { frameworks, endpoints };
  }

  private async detectFrameworksFromPackageJson(): Promise<string[]> {
    const packageJsonPath = path.join(this.context.srcPath, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const frameworks: string[] = [];
      if (deps.express) frameworks.push('express');
      if (deps.fastify) frameworks.push('fastify');
      if (deps['@nestjs/core']) frameworks.push('nestjs');
      
      return frameworks;
    }
    
    return [];
  }

  private async detectFrameworksFromSource(): Promise<string[]> {
    const frameworks: string[] = [];
    const srcDir = path.join(this.context.srcPath, 'src');
    
    if (await fs.pathExists(srcDir)) {
      const files = await this.getAllFiles(srcDir, ['.js', '.ts', '.jsx', '.tsx']);
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        
        // Detect Express
        if (!frameworks.includes('express') && 
            (content.includes("from 'express'") || content.includes("require('express')"))) {
          frameworks.push('express');
        }
        
        // Detect Fastify
        if (!frameworks.includes('fastify') && 
            (content.includes("from 'fastify'") || content.includes("require('fastify')"))) {
          frameworks.push('fastify');
        }
        
        // Detect NestJS
        if (!frameworks.includes('nestjs') && 
            (content.includes("@nestjs/") || content.includes("@Controller"))) {
          frameworks.push('nestjs');
        }
      }
    }
    
    return frameworks;
  }

  private async getAllFiles(dir: string, extensions: string[]): Promise<string[]> {
    const files: string[] = [];
    
    const items = await fs.readdir(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...await this.getAllFiles(fullPath, extensions));
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  private async countEndpoints(frameworks: string[]): Promise<number> {
    // Implementation would count endpoints based on detected frameworks
    return frameworks.length * 5; // Example calculation
  }
}

/**
 * Example usage demonstrating all fixes
 */
export async function demonstrateFrameworkDetectionFixes(srcPath: string) {
  const context: ExtractionContext = {
    srcPath,
    logger: {
      info: (msg: string) => console.error(`[INFO] ${msg}`),
      warn: (msg: string) => console.error(`[WARN] ${msg}`),
      error: (msg: string) => console.error(`[ERROR] ${msg}`)
    }
  };

  console.log('=== Framework Detection Fixes Demo ===\n');

  // 1. Fastify extractor with false positive prevention
  console.log('1. Testing Fastify extractor...');
  const fastifyExtractor = new FastifyExtractorExample(context);
  const fastifyResult = await fastifyExtractor.extract();
  console.log('Fastify result:', fastifyResult.summary);

  // 2. Spring extractor with graceful fallback
  console.log('\n2. Testing Spring extractor...');
  const springExtractor = new SpringExtractorExample(context);
  const springResult = await springExtractor.extract();
  console.log('Spring result:', springResult.summary);

  // 3. API surface analyzer with heuristic detection
  console.log('\n3. Testing API surface analyzer...');
  const apiAnalyzer = new APISurfaceAnalyzerExample(context);
  const apiResult = await apiAnalyzer.analyze();
  console.log('API analysis result:', apiResult);

  console.log('\n=== All fixes demonstrated successfully ===');
}
