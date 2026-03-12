import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // Generate a unique error ID for tracking
        const errorId = Math.random().toString(36).substring(2, 10);

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | object = 'Internal server error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            message = typeof exceptionResponse === 'string'
                ? exceptionResponse
                : (exceptionResponse as any).message || exception.message;
        } else {
            // For unhandled non-HTTP exceptions, we log the stack trace but hide details from the client
            this.logger.error(
                `[ErrorID: ${errorId}] Unhandled exception: ${exception instanceof Error ? exception.message : 'Unknown object'}\n${exception instanceof Error ? exception.stack : ''}`
            );
        }

        // Always log the request path, status, and error ID
        if (status >= 500) {
            this.logger.error(`[ErrorID: ${errorId}] ${request.method} ${request.url} - Status: ${status} - Message: ${JSON.stringify(message)}`);
        } else {
            this.logger.warn(`[ErrorID: ${errorId}] ${request.method} ${request.url} - Status: ${status} - Message: ${JSON.stringify(message)}`);
        }

        // Structure the error response according to requirements format
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
            errorId,
        });
    }
}
