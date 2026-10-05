import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/user_model.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final SecureStorageService storageService;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.storageService,
  });

  @override
  Future<void> sendRegistrationOtp({required String name, required String email}) async {
    try {
      await remoteDataSource.sendRegistrationOtp(name: name, email: email);
    } on ServerException catch (e) {
      throw ServerFailure(e.message, field: e.field);
    } catch (e) {
      throw ServerFailure(e.toString());
    }
  }

  @override
  Future<UserModel> register({
    required String name,
    required String email,
    required String otp,
    required String password,
    required String phone,
  }) async {
    try {
      final response = await remoteDataSource.register(
        name: name,
        email: email,
        otp: otp,
        password: password,
        phone: phone,
      );

      // Verify role is PASSENGER
      if (response.user.role != 'PASSENGER') {
        throw const ServerFailure('This account is registered as driver/admin. Please use the passenger account.');
      }

      await storageService.saveTokens(
        accessToken: response.tokens.accessToken,
        refreshToken: response.tokens.refreshToken,
      );
      await storageService.saveUser(response.user.toJson());

      return response.user;
    } on ServerException catch (e) {
      throw ServerFailure(e.message, field: e.field);
    } catch (e) {
      if (e is ServerFailure) rethrow;
      throw ServerFailure(e.toString());
    }
  }

  @override
  Future<UserModel> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await remoteDataSource.login(
        email: email,
        password: password,
      );

      // Verify role is PASSENGER
      if (response.user.role != 'PASSENGER') {
        throw const ServerFailure('Invalid credentials or unauthorized role for Passenger app.');
      }

      await storageService.saveTokens(
        accessToken: response.tokens.accessToken,
        refreshToken: response.tokens.refreshToken,
      );
      await storageService.saveUser(response.user.toJson());

      return response.user;
    } on ServerException catch (e) {
      throw ServerFailure(e.message, field: e.field);
    } catch (e) {
      if (e is ServerFailure) rethrow;
      throw ServerFailure(e.toString());
    }
  }

  @override
  Future<UserModel?> getCachedUser() async {
    final userMap = await storageService.getUser();
    if (userMap != null) {
      return UserModel.fromJson(userMap);
    }
    return null;
  }

  @override
  Future<bool> isAuthenticated() async {
    final token = await storageService.getAccessToken();
    return token != null && token.isNotEmpty;
  }

  @override
  Future<void> logout() async {
    await storageService.clearAuth();
  }
}
