import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/repositories/auth_repository.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository authRepository;

  AuthBloc({required this.authRepository}) : super(AuthInitial()) {
    on<AppStartedEvent>(_onAppStarted);
    on<SendOtpEvent>(_onSendOtp);
    on<RegisterEvent>(_onRegister);
    on<LoginEvent>(_onLogin);
    on<LogoutEvent>(_onLogout);
  }

  Future<void> _onAppStarted(AppStartedEvent event, Emitter<AuthState> emit) async {
    final isAuth = await authRepository.isAuthenticated();
    if (isAuth) {
      final user = await authRepository.getCachedUser();
      if (user != null) {
        emit(AuthenticatedState(user));
        return;
      }
    }
    emit(UnauthenticatedState());
  }

  Future<void> _onSendOtp(SendOtpEvent event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      await authRepository.sendRegistrationOtp(
        name: event.name,
        email: event.email,
      );
      emit(OtpSentState(email: event.email, name: event.name));
    } on Failure catch (e) {
      emit(AuthErrorState(e.message, field: e.field));
    } catch (e) {
      emit(AuthErrorState(e.toString()));
    }
  }

  Future<void> _onRegister(RegisterEvent event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final user = await authRepository.register(
        name: event.name,
        email: event.email,
        otp: event.otp,
        password: event.password,
        phone: event.phone,
      );
      emit(AuthenticatedState(user));
    } on Failure catch (e) {
      emit(AuthErrorState(e.message, field: e.field));
    } catch (e) {
      emit(AuthErrorState(e.toString()));
    }
  }

  Future<void> _onLogin(LoginEvent event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final user = await authRepository.login(
        email: event.email,
        password: event.password,
      );
      emit(AuthenticatedState(user));
    } on Failure catch (e) {
      emit(AuthErrorState(e.message, field: e.field));
    } catch (e) {
      emit(AuthErrorState(e.toString()));
    }
  }

  Future<void> _onLogout(LogoutEvent event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    await authRepository.logout();
    emit(UnauthenticatedState());
  }
}
