import { GlobalExceptionFilter } from './global-exception.filter.js';
import { ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

describe('GlobalExceptionFilter', () => {
    let filter: GlobalExceptionFilter;
    let mockArgumentsHost: ArgumentsHost;
    let mockResponse: Partial<Response>;
    let mockRequest: Partial<Request>;
    let mockStatus: jest.Mock;
    let mockJson: jest.Mock;
    let loggerErrorSpy: jest.SpyInstance;
    let loggerWarnSpy: jest.SpyInstance;

    beforeEach(() => {
        filter = new GlobalExceptionFilter();

        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });

        mockResponse = {
            status: mockStatus,
        };

        mockRequest = {
            url: '/api/test',
            method: 'GET',
        };

        mockArgumentsHost = {
            switchToHttp: jest.fn().mockReturnValue({
                getResponse: () => mockResponse,
                getRequest: () => mockRequest,
            }),
        } as unknown as ArgumentsHost;

        loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
        loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(filter).toBeDefined();
    });

    it('should map HttpException to appropriate status code and message', () => {
        const exception = new HttpException('Custom Not Found', HttpStatus.NOT_FOUND);

        filter.catch(exception, mockArgumentsHost);

        expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
        expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: HttpStatus.NOT_FOUND,
            path: '/api/test',
            message: 'Custom Not Found',
            errorId: expect.any(String),
            timestamp: expect.any(String),
        }));

        // Should log warning for < 500 status codes
        expect(loggerWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Custom Not Found'));
        expect(loggerErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle HttpException with object response', () => {
        const exceptionResponse = { message: ['validation error'], error: 'Bad Request', statusCode: 400 };
        const exception = new HttpException(exceptionResponse, HttpStatus.BAD_REQUEST);

        filter.catch(exception, mockArgumentsHost);

        expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: HttpStatus.BAD_REQUEST,
            message: ['validation error'],
        }));
    });

    it('should handle unknown Error throwing 500 without exposing details', () => {
        const exception = new Error('Database connection failed violently');

        filter.catch(exception, mockArgumentsHost);

        expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
        // Client gets generic message
        expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Internal server error',
        }));

        // Server logs get the real error
        expect(loggerErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Database connection failed violently'));
    });
});
