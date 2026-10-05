import 'package:get_it/get_it.dart';
import '../network/api_client.dart';
import '../storage/secure_storage_service.dart';

import 'package:carpooling_passenger_app/features/auth/data/datasources/auth_remote_datasource.dart';
import 'package:carpooling_passenger_app/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:carpooling_passenger_app/features/auth/domain/repositories/auth_repository.dart';
import 'package:carpooling_passenger_app/features/auth/presentation/bloc/auth_bloc.dart';

import 'package:carpooling_passenger_app/features/feed/data/datasources/feed_remote_datasource.dart';
import 'package:carpooling_passenger_app/features/feed/data/repositories/feed_repository_impl.dart';
import 'package:carpooling_passenger_app/features/feed/domain/repositories/feed_repository.dart';
import 'package:carpooling_passenger_app/features/feed/presentation/bloc/feed_bloc.dart';

import 'package:carpooling_passenger_app/features/trip_search/data/datasources/trip_search_remote_datasource.dart';
import 'package:carpooling_passenger_app/features/trip_search/data/repositories/trip_search_repository_impl.dart';
import 'package:carpooling_passenger_app/features/trip_search/domain/repositories/trip_search_repository.dart';
import 'package:carpooling_passenger_app/features/trip_search/presentation/bloc/trip_search_bloc.dart';

import 'package:carpooling_passenger_app/features/booking/data/datasources/booking_remote_datasource.dart';
import 'package:carpooling_passenger_app/features/booking/data/repositories/booking_repository_impl.dart';
import 'package:carpooling_passenger_app/features/booking/domain/repositories/booking_repository.dart';
import 'package:carpooling_passenger_app/features/booking/presentation/bloc/booking_bloc.dart';

import 'package:carpooling_passenger_app/features/live_tracking/data/datasources/tracking_realtime_datasource.dart';
import 'package:carpooling_passenger_app/features/live_tracking/data/repositories/tracking_repository_impl.dart';
import 'package:carpooling_passenger_app/features/live_tracking/domain/repositories/tracking_repository.dart';
import 'package:carpooling_passenger_app/features/live_tracking/presentation/bloc/live_tracking_bloc.dart';

final sl = GetIt.instance;

Future<void> initDependencies() async {
  // ---------------- Core & External ----------------
  final storageService = SecureStorageService();
  sl.registerLazySingleton<SecureStorageService>(() => storageService);

  sl.registerLazySingleton<ApiClient>(
    () => ApiClient(storageService: sl<SecureStorageService>()),
  );

  // ---------------- Auth Feature ----------------
  sl.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSourceImpl(apiClient: sl<ApiClient>()),
  );
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(
      remoteDataSource: sl<AuthRemoteDataSource>(),
      storageService: sl<SecureStorageService>(),
    ),
  );
  sl.registerFactory<AuthBloc>(
    () => AuthBloc(authRepository: sl<AuthRepository>()),
  );

  // ---------------- Feed Feature ----------------
  sl.registerLazySingleton<FeedRemoteDataSource>(
    () => FeedRemoteDataSourceImpl(apiClient: sl<ApiClient>()),
  );
  sl.registerLazySingleton<FeedRepository>(
    () => FeedRepositoryImpl(remoteDataSource: sl<FeedRemoteDataSource>()),
  );
  sl.registerFactory<FeedBloc>(
    () => FeedBloc(feedRepository: sl<FeedRepository>()),
  );

  // ---------------- Trip Search Feature ----------------
  sl.registerLazySingleton<TripSearchRemoteDataSource>(
    () => TripSearchRemoteDataSourceImpl(apiClient: sl<ApiClient>()),
  );
  sl.registerLazySingleton<TripSearchRepository>(
    () => TripSearchRepositoryImpl(remoteDataSource: sl<TripSearchRemoteDataSource>()),
  );
  sl.registerFactory<TripSearchBloc>(
    () => TripSearchBloc(repository: sl<TripSearchRepository>()),
  );

  // ---------------- Booking Feature ----------------
  sl.registerLazySingleton<BookingRemoteDataSource>(
    () => BookingRemoteDataSourceImpl(apiClient: sl<ApiClient>()),
  );
  sl.registerLazySingleton<BookingRepository>(
    () => BookingRepositoryImpl(remoteDataSource: sl<BookingRemoteDataSource>()),
  );
  sl.registerFactory<BookingBloc>(
    () => BookingBloc(repository: sl<BookingRepository>()),
  );

  // ---------------- Live Tracking Feature ----------------
  sl.registerLazySingleton<TrackingRealtimeDataSource>(
    () => TrackingRealtimeDataSourceImpl(),
  );
  sl.registerLazySingleton<TrackingRepository>(
    () => TrackingRepositoryImpl(realtimeDataSource: sl<TrackingRealtimeDataSource>()),
  );
  sl.registerFactory<LiveTrackingBloc>(
    () => LiveTrackingBloc(repository: sl<TrackingRepository>()),
  );
}
