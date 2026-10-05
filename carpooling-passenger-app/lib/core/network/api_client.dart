import 'dart:io';
import 'package:dio/dio.dart';
import '../constants/app_constants.dart';
import '../errors/exceptions.dart';
import '../storage/secure_storage_service.dart';

class ApiClient {
  late final Dio dio;
  final SecureStorageService storageService;

  ApiClient({required this.storageService}) {
    dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          HttpHeaders.contentTypeHeader: 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      ),
    );

    dio.interceptors.add(
      QueuedInterceptorsWrapper(
        onRequest: (options, handler) async {
          // Skip auth header for login, register, and refresh endpoints
          final isAuthEndpoint = options.path.contains('/auth/login') ||
              options.path.contains('/auth/register') ||
              options.path.contains('/auth/send-registration-otp') ||
              options.path.contains('/auth/refresh-token');

          if (!isAuthEndpoint) {
            final token = await storageService.getAccessToken();
            if (token != null && token.isNotEmpty) {
              options.headers[HttpHeaders.authorizationHeader] = 'Bearer $token';
            }
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401 &&
              !error.requestOptions.path.contains('/auth/refresh-token') &&
              !error.requestOptions.path.contains('/auth/login')) {
            // Attempt token refresh
            final refreshToken = await storageService.getRefreshToken();
            if (refreshToken != null && refreshToken.isNotEmpty) {
              try {
                final refreshDio = Dio(
                  BaseOptions(
                    baseUrl: AppConstants.baseUrl,
                    headers: {HttpHeaders.contentTypeHeader: 'application/json'},
                  ),
                );

                final response = await refreshDio.post(
                  AppConstants.refreshTokenEndpoint,
                  data: {'refreshToken': refreshToken},
                  options: Options(
                    headers: {
                      HttpHeaders.authorizationHeader: 'Bearer $refreshToken',
                    },
                  ),
                );

                String? newAccessToken;
                if (response.data is Map) {
                  final data = response.data['data'] ?? response.data;
                  newAccessToken = data is Map ? data['accessToken'] ?? data['token'] : null;
                  newAccessToken ??= response.data['accessToken'];
                }

                if (newAccessToken != null && newAccessToken.isNotEmpty) {
                  await storageService.saveAccessToken(newAccessToken);

                  // Retry the original request
                  final originalRequest = error.requestOptions;
                  originalRequest.headers[HttpHeaders.authorizationHeader] =
                      'Bearer $newAccessToken';

                  final retryResponse = await dio.fetch(originalRequest);
                  return handler.resolve(retryResponse);
                }
              } catch (_) {
                await storageService.clearAuth();
              }
            } else {
              await storageService.clearAuth();
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  /// Helper to parse standard response and catch errors
  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await dio.get(
        path,
        queryParameters: queryParameters,
        options: options,
      );
      return _extractData(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<dynamic> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return _extractData(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<dynamic> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await dio.put(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return _extractData(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  dynamic _extractData(dynamic body) {
    if (body is Map<String, dynamic>) {
      if (body.containsKey('data')) {
        return body['data'];
      }
      return body;
    }
    return body;
  }

  Exception _handleDioError(DioException error) {
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.connectionError) {
      return ServerException(
        message: 'Unable to connect to carpooling server. Please verify your network.',
      );
    }

    final response = error.response;
    if (response != null && response.data != null) {
      if (response.data is Map<String, dynamic>) {
        final map = response.data as Map<String, dynamic>;
        final errorMessage = map['error'] ?? map['message'] ?? 'An unexpected error occurred';
        List<String>? fieldList;
        if (map['field'] != null && map['field'] is List) {
          fieldList = (map['field'] as List).map((e) => e.toString()).toList();
        }
        return ServerException(
          message: errorMessage.toString(),
          field: fieldList,
        );
      }
    }

    if (response?.statusCode == 401) {
      return UnauthorizedException('Session expired. Please log in again.');
    }

    return ServerException(
      message: error.message ?? 'Unexpected server error occurred.',
    );
  }
}
