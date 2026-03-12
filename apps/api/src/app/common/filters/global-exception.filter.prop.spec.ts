import { GlobalExceptionFilter } from './global-exception.filter.js';
import { ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import * as fc from 'fast-check';

describe('GlobalExceptionFilter Property Tests', () => {
    let filter: GlobalExceptionFilter;

    beforeEach(() => {
        filter = new GlobalExceptionFilter();
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const createMockHost = (mockStatus: jest.Mock, mockJson: jest.Mock, url: string) => {
        const mockResponse = { status: mockStatus.mockReturnValue({ json: mockJson }) };
        const mockRequest = { url, method: 'GET' };

        return {
            switchToHttp: () => ({
                getResponse: () => mockResponse,
                getRequest: () => mockRequest,
            }),
        } as unknown as ArgumentsHost;
    };

    it('Property 22: API Error Messages - should always return well-formed JSON structure without exposing internals for random Errors', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1 }), // Random error message
                fc.string({ minLength: 1 }), // Random URL path
                (errorMessage, requestUrl) => {
                    const mockStatus = jest.fn();
                    const mockJson = jest.fn();
                    const mockHost = createMockHost(mockStatus, mockJson, requestUrl);

                    const exception = new Error(errorMessage);
                    filter.catch(exception, mockHost);

                    // Assertion 1: Always maps unhandled Error to 500
                    expect(mockStatus).toHaveBeenCalledWith(500);

                    // Assertion 2: Never exposes the internal message to the client
                    const jsonCallArg = mockJson.mock.calls[0][0];
                    expect(jsonCallArg.statusCode).toBe(500);
                    expect(jsonCallArg.message).toBe('Internal server error'); // Must be generic!
                    expect(jsonCallArg.message).not.toBe(errorMessage);
                    expect(jsonCallArg.errorId).toBeDefined();
                    expect(jsonCallArg.path).toBe(requestUrl);
                    expect(typeof jsonCallArg.timestamp).toBe('string');

                    // Assertion 3: Internally logs the real error
                    expect(Logger.prototype.error).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
                }
            )
        );
    });

    it('Property 22: API Error Messages - should preserve valid HttpException data in response', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1 }), // HTTP Error message
                fc.constantFrom(400, 401, 403, 404, 409, 502, 503), // HTTP Status codes
                fc.string({ minLength: 1 }), // Request URL
                (httpMessage, statusCode, requestUrl) => {
                    const mockStatus = jest.fn();
                    const mockJson = jest.fn();
                    const mockHost = createMockHost(mockStatus, mockJson, requestUrl);

                    const exception = new HttpException(httpMessage, statusCode);
                    filter.catch(exception, mockHost);

                    // Assertion: Preserves status code and message
                    expect(mockStatus).toHaveBeenCalledWith(statusCode);

                    const jsonCallArg = mockJson.mock.calls[0][0];
                    expect(jsonCallArg.statusCode).toBe(statusCode);
                    expect(jsonCallArg.message).toBe(httpMessage);
                    expect(jsonCallArg.path).toBe(requestUrl);
                    expect(jsonCallArg.errorId).toBeDefined();

                    if (statusCode >= 500) {
                        expect(Logger.prototype.error).toHaveBeenCalled();
                    } else {
                        expect(Logger.prototype.warn).toHaveBeenCalled();
                    }
                }
            )
        );
    });
});
