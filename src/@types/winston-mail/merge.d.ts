import * as winston from 'winston';
import * as mail from 'winston-mail';

declare module 'winston' {
    interface Transports {
        Mail: mail.Mail;
    }
}
