import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private blacklist = new Set<string>();
  private redisClient: ReturnType<typeof createClient> | null = null;
  private redisAvailable = false;
  private redisErrorLogged = false;
  private readonly PREFIX = 'blacklist:';

  constructor(private readonly configService: ConfigService) {
    this.initRedis();
  }

  private async initRedis(): Promise<void> {
    const host = this.configService.get<string>('REDIS_HOST');
    const url =
      this.configService.get<string>('REDIS_URL') ||
      (host
        ? `redis://${host}:${this.configService.get<number>('REDIS_PORT') || 6379}`
        : null);

    if (!url) {
      this.logger.log('Redis not configured, using in-memory blacklist');
      return;
    }

    try {
      this.redisClient = createClient({ url });
      this.redisClient.on('error', (err) => {
        this.redisAvailable = false;
        if (!this.redisErrorLogged) {
          this.redisErrorLogged = true;
          this.logger.warn(
            'Redis unavailable, falling back to in-memory blacklist',
            err,
          );
        }
      });
      this.redisClient.on('ready', () => {
        this.redisAvailable = true;
        this.redisErrorLogged = false;
      });
      await this.redisClient.connect();
      this.redisAvailable = true;
    } catch {
      this.redisAvailable = false;
      this.logger.warn('Redis connection failed, using in-memory blacklist');
    }
  }

  async add(token: string): Promise<void> {
    if (!token) return;

    if (this.redisAvailable && this.redisClient) {
      try {
        await this.redisClient.setEx(`${this.PREFIX}${token}`, 7200, '1');
        return;
      } catch {
        this.redisAvailable = false;
      }
    }

    this.blacklist.add(token);
    setTimeout(
      () => {
        this.blacklist.delete(token);
      },
      2 * 60 * 60 * 1000,
    );
  }

  async isBlacklisted(token: string): Promise<boolean> {
    if (!token) return false;

    if (this.redisAvailable && this.redisClient) {
      try {
        const result = await this.redisClient.get(`${this.PREFIX}${token}`);
        return result !== null;
      } catch {
        this.redisAvailable = false;
      }
    }

    return this.blacklist.has(token);
  }
}
