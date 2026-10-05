class ServerException implements Exception {
  final String message;
  final List<String>? field;

  ServerException({required this.message, this.field});

  @override
  String toString() => 'ServerException: $message (field: $field)';
}

class UnauthorizedException implements Exception {
  final String message;
  UnauthorizedException([this.message = 'Unauthorized']);
}

class CacheException implements Exception {
  final String message;
  CacheException([this.message = 'Cache exception']);
}
