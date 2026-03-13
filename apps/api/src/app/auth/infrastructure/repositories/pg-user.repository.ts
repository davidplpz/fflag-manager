import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pkg from 'pg';
const { Client } = pkg;
import { UserRepository } from '../../domain/repositories/user.repository.js';
import { User } from '../../domain/entities/user.entity.js';

@Injectable()
export class PgUserRepository implements UserRepository, OnModuleDestroy {
    private readonly client: pkg.Client;
    private isConnected = false;

    constructor(config: ConfigService) {
        this.client = new Client({
            host: config.get<string>('POSTGRES_HOST', 'localhost'),
            port: config.get<number>('POSTGRES_PORT', 5432),
            user: config.get<string>('POSTGRES_USER', 'postgres'),
            password: config.get<string>('POSTGRES_PASSWORD', 'postgres'),
            database: config.get<string>('POSTGRES_DB', 'fflags_db'),
        });
    }

    async onModuleDestroy() {
        if (this.isConnected) {
            await this.client.end();
        }
    }

    private async ensureConnected() {
        if (!this.isConnected) {
            await this.client.connect();
            this.isConnected = true;
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        await this.ensureConnected();
        const res = await this.client.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (res.rows.length === 0) {
            return null;
        }

        return this.mapToEntity(res.rows[0]);
    }

    async findById(id: string): Promise<User | null> {
        await this.ensureConnected();
        const res = await this.client.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );

        if (res.rows.length === 0) {
            return null;
        }

        return this.mapToEntity(res.rows[0]);
    }

    async save(user: User): Promise<void> {
        await this.ensureConnected();
        await this.client.query(
            `INSERT INTO users (id, email, password_hash, roles, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                password_hash = EXCLUDED.password_hash,
                roles = EXCLUDED.roles,
                updated_at = CURRENT_TIMESTAMP`,
            [
                user.id,
                user.email,
                user.passwordHash,
                JSON.stringify(user.roles),
                user.createdAt,
                user.updatedAt
            ]
        );
    }

    private mapToEntity(row: any): User {
        return new User(
            row.id,
            row.email,
            row.password_hash,
            typeof row.roles === 'string' ? JSON.parse(row.roles) : row.roles,
            new Date(row.created_at),
            new Date(row.updated_at)
        );
    }
}
