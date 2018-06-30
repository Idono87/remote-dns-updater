declare module 'winston-mail' {
    import * as winston from 'winston';

    export const Mail: Mail;

    export interface Mail extends winston.TransportInstance {}

    export interface Options extends winston.ConsoleTransportOptions {
        name?: string;
        to: string;
        from?: string;
        level?: string;
        unique?: boolean;
        silent?: boolean;
        filter?:
            | ((level: string, message: string, meta: string) => boolean)
            | boolean;
        subject?: string;
        html?: boolean;
        handleExceptions?: boolean;
        username: string;
        password: string;
        port: number;
        host: string;
        ssl: boolean | { key: string; ca: string; cert: string };
        tls: boolean;
        timeout?: number;
        authentication?: string;
    }
}
