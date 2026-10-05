import 'package:carpooling_passenger_app/features/auth/data/models/user_model.dart';

abstract class AuthRepository {
  Future<void> sendRegistrationOtp({required String name, required String email});

  Future<UserModel> register({
    required String name,
    required String email,
    required String otp,
    required String password,
    required String phone,
  });

  Future<UserModel> login({
    required String email,
    required String password,
  });

  Future<UserModel?> getCachedUser();

  Future<bool> isAuthenticated();

  Future<void> logout();
}
