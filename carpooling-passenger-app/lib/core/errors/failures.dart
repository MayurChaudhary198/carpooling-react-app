import 'package:equatable/equatable.dart';

abstract class Failure extends Equatable {
  final String message;
  final List<String>? field;

  const Failure(this.message, {this.field});

  @override
  List<Object?> get props => [message, field];
}

class ServerFailure extends Failure {
  const ServerFailure(super.message, {super.field});
}

class NetworkFailure extends Failure {
  const NetworkFailure([String message = 'No Internet connection. Please check your network.'])
      : super(message);
}

class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure([String message = 'Session expired. Please log in again.'])
      : super(message);
}

class CacheFailure extends Failure {
  const CacheFailure([String message = 'Failed to load cached data.'])
      : super(message);
}

class LocationPermissionFailure extends Failure {
  const LocationPermissionFailure([String message = 'Location permission is required to find rides.'])
      : super(message);
}
