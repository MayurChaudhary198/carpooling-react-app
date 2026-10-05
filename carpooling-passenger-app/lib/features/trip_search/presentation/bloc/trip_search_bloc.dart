import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/errors/failures.dart';
import 'package:carpooling_passenger_app/features/trip_search/domain/repositories/trip_search_repository.dart';
import 'trip_search_event.dart';
import 'trip_search_state.dart';

class TripSearchBloc extends Bloc<TripSearchEvent, TripSearchState> {
  final TripSearchRepository repository;

  TripSearchBloc({required this.repository}) : super(TripSearchInitial()) {
    on<SearchPlacesQueryChangedEvent>(_onSearchPlaces);
    on<ExecuteRouteTripSearchEvent>(_onExecuteRouteTripSearch);
    on<ClearSearchEvent>((event, emit) => emit(TripSearchInitial()));
  }

  Future<void> _onSearchPlaces(
    SearchPlacesQueryChangedEvent event,
    Emitter<TripSearchState> emit,
  ) async {
    if (event.query.trim().isEmpty) {
      emit(PlaceSuggestionsLoaded(places: const [], isOrigin: event.isOrigin));
      return;
    }

    emit(PlaceSuggestionsLoading(isOrigin: event.isOrigin));
    try {
      final places = await repository.searchPlaces(event.query);
      emit(PlaceSuggestionsLoaded(places: places, isOrigin: event.isOrigin));
    } on Failure catch (e) {
      emit(TripSearchError(e.message));
    } catch (e) {
      emit(TripSearchError(e.toString()));
    }
  }

  Future<void> _onExecuteRouteTripSearch(
    ExecuteRouteTripSearchEvent event,
    Emitter<TripSearchState> emit,
  ) async {
    emit(RouteTripsLoading());
    try {
      final trips = await repository.searchTripsByRoute(
        origin: event.origin,
        destination: event.destination,
        dateAndTime: event.dateAndTime,
        seats: event.seats,
      );
      emit(RouteTripsLoaded(trips));
    } on Failure catch (e) {
      emit(TripSearchError(e.message));
    } catch (e) {
      emit(TripSearchError(e.toString()));
    }
  }
}
