import { NextRequest } from 'next/server';
import { rm } from 'fs/promises';
import { join } from 'path';

// Rate limiting için basit in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Güvenlik konfigürasyonu
const SECURITY_CONFIG = {
  MAX_FILE_SIZE: 1024 * 1024, // 1MB
  MAX_CODE_LENGTH: 50000, // 50KB
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 dakika
  RATE_LIMIT_MAX_REQUESTS: 5, // 5 istek/dakika
  ALLOWED_EXTENSIONS: ['.sol', '.move'],
  PRIVATE_KEY_REGEX: /^(0x)?[a-fA-F0-9]{64}$/,
  ADDRESS_REGEX: /^0x[a-fA-F0-9]{40}$/,
  CONTRACT_NAME_REGEX: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
  MAX_CONTRACT_NAME_LENGTH: 50,
  TEMP_DIR_PREFIX: 'umi-',
  CLEANUP_TIMEOUT: 5 * 60 * 1000, // 5 dakika
};

// Input validation
export function validateInput(data: any): { isValid: boolean; error?: string } {
  // Code validation
  if (!data.code || typeof data.code !== 'string') {
    return { isValid: false, error: 'Invalid contract code' };
  }
  
  if (data.code.length > SECURITY_CONFIG.MAX_CODE_LENGTH) {
    return { isValid: false, error: `Code too long. Maximum ${SECURITY_CONFIG.MAX_CODE_LENGTH} characters allowed` };
  }
  
  // Private key validation
  if (!data.privateKey || typeof data.privateKey !== 'string') {
    return { isValid: false, error: 'Invalid private key' };
  }
  
  // Remove 0x prefix if present for validation
  const cleanPrivateKey = data.privateKey.startsWith('0x') ? data.privateKey.slice(2) : data.privateKey;
  
  // Check if it's a valid 64-character hex string
  if (!/^[a-fA-F0-9]{64}$/.test(cleanPrivateKey)) {
    return { isValid: false, error: 'Invalid private key format. Must be 64 hex characters (with or without 0x prefix)' };
  }
  
  // Account address validation (for Move)
  if (data.accountAddress) {
    if (typeof data.accountAddress !== 'string') {
      return { isValid: false, error: 'Invalid account address' };
    }
    
    if (!SECURITY_CONFIG.ADDRESS_REGEX.test(data.accountAddress)) {
      return { isValid: false, error: 'Invalid account address format. Must be 0x followed by 40 hex characters' };
    }
  }
  
  // Contract name validation
  const contractNameMatch = data.code.match(/contract\s+(\w+)/);
  if (contractNameMatch) {
    const contractName = contractNameMatch[1];
    if (contractName.length > SECURITY_CONFIG.MAX_CONTRACT_NAME_LENGTH) {
      return { isValid: false, error: `Contract name too long. Maximum ${SECURITY_CONFIG.MAX_CONTRACT_NAME_LENGTH} characters allowed` };
    }
    
    if (!SECURITY_CONFIG.CONTRACT_NAME_REGEX.test(contractName)) {
      return { isValid: false, error: 'Invalid contract name. Must start with letter or underscore and contain only alphanumeric characters and underscores' };
    }
  }
  
  return { isValid: true };
}

// Rate limiting
export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number; resetInSeconds: number } {
  const now = Date.now();
  const key = ip;
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    const resetTime = now + SECURITY_CONFIG.RATE_LIMIT_WINDOW;
    rateLimitStore.set(key, {
      count: 1,
      resetTime: resetTime
    });
    return { 
      allowed: true, 
      remaining: SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS - 1, 
      resetTime: resetTime,
      resetInSeconds: Math.ceil(SECURITY_CONFIG.RATE_LIMIT_WINDOW / 1000)
    };
  }
  
  if (record.count >= SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS) {
    const resetInSeconds = Math.ceil((record.resetTime - now) / 1000);
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: record.resetTime,
      resetInSeconds: resetInSeconds
    };
  }
  
  record.count++;
  const resetInSeconds = Math.ceil((record.resetTime - now) / 1000);
  return { 
    allowed: true, 
    remaining: SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS - record.count, 
    resetTime: record.resetTime,
    resetInSeconds: resetInSeconds
  };
}

// Command injection protection
export function sanitizeCommand(cmd: string): string {
  // Tehlikeli karakterleri filtrele
  const dangerousChars = [';', '&', '|', '`', '$', '(', ')', '{', '}', '[', ']', '<', '>', '"', "'"];
  for (const char of dangerousChars) {
    if (cmd.includes(char)) {
      throw new Error(`Dangerous character detected: ${char}`);
    }
  }
  
  // Sadece izin verilen komutları çalıştır
  const allowedCommands = ['npx', 'npm', 'aptos', 'hardhat'];
  const firstWord = cmd.split(' ')[0];
  if (!allowedCommands.includes(firstWord)) {
    throw new Error(`Command not allowed: ${firstWord}`);
  }
  
  return cmd;
}

// Temporary file cleanup
export async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    await rm(tempDir, { recursive: true, force: true });
    console.log(`Cleaned up temp directory: ${tempDir}`);
  } catch (error) {
    console.error(`Failed to cleanup temp directory ${tempDir}:`, error);
  }
}

// Scheduled cleanup
export function scheduleCleanup(tempDir: string): void {
  setTimeout(() => {
    cleanupTempDir(tempDir).catch(console.error);
  }, SECURITY_CONFIG.CLEANUP_TIMEOUT);
}

// Get client IP
export function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

// Error response helper
export function createErrorResponse(message: string, status: number = 400): Response {
  return new Response(JSON.stringify({ 
    error: message,
    timestamp: new Date().toISOString()
  }), { 
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Success response helper
export function createSuccessResponse(data: any): Response {
  return new Response(JSON.stringify({
    ...data,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Security headers
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
}; 