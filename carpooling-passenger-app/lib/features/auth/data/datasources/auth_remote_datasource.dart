import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/auth_response_model.dart';

abstract class AuthRemoteDataSource {
  Future<void> sendRegistrationOtp({required String name, required String email});

  Future<AuthResponseModel> register({
    required String name,
    required String email,
    required String otp,
    required String password,
    required String phone,
  });

  Future<AuthResponseModel> login({
    required String email,
    required String password,
  });
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient apiClient;

  AuthRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<void> sendRegistrationOtp({
    required String name,
    required String email,
  }) async {
    await apiClient.post(
      AppConstants.sendRegistrationOtpEndpoint,
      data: {
        'name': name.trim(),
        'email': email.trim().toLowerCase(),
      },
    );
  }

  @override
  Future<AuthResponseModel> register({
    required String name,
    required String email,
    required String otp,
    required String password,
    required String phone,
  }) async {
    final response = await apiClient.post(
      AppConstants.registerEndpoint,
      data: {
        'name': name.trim(),
        'email': email.trim().toLowerCase(),
        'otp': otp.trim(),
        'password': password,
        'role': 'PASSENGER',
        'phone': phone.trim(),
      },
    );

    return AuthResponseModel.fromJson(response as Map<String, dynamic>);
  }

  @override
  Future<AuthResponseModel> login({
    required String email,
    required String password,
  }) async {
    final response = await apiClient.post(
      AppConstants.loginEndpoint,
      data: {
        'email': email.trim().toLowerCase(),
        'password': password,
      },
    );

    return AuthResponseModel.fromJson(response as Map<String, dynamic>);
  }
}
