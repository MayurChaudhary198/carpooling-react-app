import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class AppStartedEvent extends AuthEvent {}

class SendOtpEvent extends AuthEvent {
  final String name;
  final String email;

  const SendOtpEvent({required this.name, required this.email});

  @override
  List<Object?> get props => [name, email];
}

class RegisterEvent extends AuthEvent {
  final String name;
  final String email;
  final String otp;
  final String password;
  final String phone;

  const RegisterEvent({
    required this.name,
    required this.email,
    required this.otp,
    required this.password,
    required this.phone,
  });

  @override
  List<Object?> get props => [name, email, otp, password, phone];
}

class LoginEvent extends AuthEvent {
  final String email;
  final String password;

  const LoginEvent({required this.email, required this.password});

  @override
  List<Object?> get props => [email, password];
}

class LogoutEvent extends AuthEvent {}
