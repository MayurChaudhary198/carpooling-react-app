import 'package:equatable/equatable.dart';
import '../../data/models/user_model.dart';

abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class OtpSentState extends AuthState {
  final String email;
  final String name;

  const OtpSentState({required this.email, required this.name});

  @override
  List<Object?> get props => [email, name];
}

class AuthenticatedState extends AuthState {
  final UserModel user;

  const AuthenticatedState(this.user);

  @override
  List<Object?> get props => [user];
}

class UnauthenticatedState extends AuthState {}

class AuthErrorState extends AuthState {
  final String message;
  final List<String>? field;

  const AuthErrorState(this.message, {this.field});

  @override
  List<Object?> get props => [message, field];
}
