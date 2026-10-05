import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../services/routing_service.dart';
import '../theme/app_theme.dart';
import 'hop_on_badge.dart';

enum MapTileStyle {
  voyager, // CartoDB Voyager (Sunlight-readable, minimalist)
  streets, // Esri World Street Map (Detailed roads, highways)
  osm,     // OpenStreetMap Standard
}

class HopOnMapWidget extends StatefulWidget {
  final String origin;
  final String destination;
  final double? originLat;
  final double? originLon;
  final double? destLat;
  final double? destLon;
  final double? driverLat;
  final double? driverLon;
  final double? driverHeading;
  final String? driverName;
  final String? vehiclePlate;
  final double? speed;
  final bool isLiveTracking;
  final double height;
  final VoidCallback? onExpand;

  const HopOnMapWidget({
    super.key,
    required this.origin,
    required this.destination,
    this.originLat,
    this.originLon,
    this.destLat,
    this.destLon,
    this.driverLat,
    this.driverLon,
    this.driverHeading,
    this.driverName,
    this.vehiclePlate,
    this.speed,
    this.isLiveTracking = false,
    this.height = 320,
    this.onExpand,
  });

  @override
  State<HopOnMapWidget> createState() => _HopOnMapWidgetState();
}

class _HopOnMapWidgetState extends State<HopOnMapWidget>
    with SingleTickerProviderStateMixin {
  final MapController _mapController = MapController();
  final RoutingService _routingService = RoutingService();

  late LatLng _originCoords;
  late LatLng _destCoords;
  LatLng? _driverCoords;

  List<LatLng> _routePoints = [];
  bool _isLoadingRoute = true;
  double _routeDistanceKm = 0.0;
  int _routeDurationMin = 0;
  String _routingEngine = 'osrm';

  MapTileStyle _tileStyle = MapTileStyle.voyager;
  double _currentZoom = 12.0;

  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);

    _resolveCoordinates();
    _fetchRealRoute();
  }

  @override
  void didUpdateWidget(HopOnMapWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.origin != oldWidget.origin ||
        widget.destination != oldWidget.destination ||
        widget.driverLat != oldWidget.driverLat ||
        widget.driverLon != oldWidget.driverLon) {
      _resolveCoordinates();
      _fetchRealRoute();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  /// Geocodes named locations to coordinates, defaulting to Ahmedabad-Gandhinagar corridor
  LatLng _geocode(String name, {double? lat, double? lon, bool isDest = false}) {
    if (lat != null && lon != null && lat != 0 && lon != 0) {
      return LatLng(lat, lon);
    }

    final lower = name.toLowerCase();
    if (lower.contains('gift') || lower.contains('gandhinagar') || lower.contains('pethapur')) {
      return const LatLng(23.1610, 72.6840); // GIFT City
    }
    if (lower.contains('infocity')) {
      return const LatLng(23.1931, 72.6288);
    }
    if (lower.contains('bopal')) {
      return const LatLng(23.0336, 72.4642);
    }
    if (lower.contains('thaltej')) {
      return const LatLng(23.0505, 72.5165);
    }
    if (lower.contains('prahlad')) {
      return const LatLng(23.0135, 72.5118);
    }
    if (lower.contains('vastrapur')) {
      return const LatLng(23.0350, 72.5293);
    }
    if (lower.contains('iscon') || lower.contains('crossroad') || lower.contains('sg')) {
      return const LatLng(23.0278, 72.5074); // Iscon Crossroads
    }

    // Default corridor endpoints
    return isDest
        ? const LatLng(23.1610, 72.6840) // GIFT City
        : const LatLng(23.0278, 72.5074); // Iscon SG Highway
  }

  void _resolveCoordinates() {
    _originCoords = _geocode(
      widget.origin,
      lat: widget.originLat,
      lon: widget.originLon,
      isDest: false,
    );

    _destCoords = _geocode(
      widget.destination,
      lat: widget.destLat,
      lon: widget.destLon,
      isDest: true,
    );

    if (widget.driverLat != null && widget.driverLon != null && widget.driverLat != 0) {
      _driverCoords = LatLng(widget.driverLat!, widget.driverLon!);
    } else {
      // Interpolate driver position along corridor
      _driverCoords = LatLng(
        _originCoords.latitude + (_destCoords.latitude - _originCoords.latitude) * 0.35,
        _originCoords.longitude + (_destCoords.longitude - _originCoords.longitude) * 0.35,
      );
    }
  }

  Future<void> _fetchRealRoute() async {
    setState(() => _isLoadingRoute = true);

    try {
      final result = await _routingService.getRoute(
        origin: _originCoords,
        destination: _destCoords,
      );

      if (mounted) {
        setState(() {
          _routePoints = result.coordinates;
          _routeDistanceKm = result.distanceKm;
          _routeDurationMin = result.durationMinutes;
          _routingEngine = result.engine;
          _isLoadingRoute = false;
        });

        // Fit map bounds to encompass origin & destination
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _fitBounds();
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _routePoints = [_originCoords, _destCoords];
          _isLoadingRoute = false;
        });
      }
    }
  }

  void _fitBounds() {
    if (_routePoints.isEmpty) return;
    try {
      final bounds = LatLngBounds.fromPoints(_routePoints);
      _mapController.fitCamera(
        CameraFit.bounds(
          bounds: bounds,
          padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 48),
          maxZoom: 15,
        ),
      );
    } catch (_) {
      // Map might not be mounted yet
    }
  }

  String get _tileUrl {
    switch (_tileStyle) {
      case MapTileStyle.voyager:
        return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      case MapTileStyle.streets:
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
      case MapTileStyle.osm:
        return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  }

  List<String> get _subdomains {
    switch (_tileStyle) {
      case MapTileStyle.voyager:
        return const ['a', 'b', 'c', 'd'];
      case MapTileStyle.streets:
        return const ['a', 'b', 'c'];
      case MapTileStyle.osm:
        return const ['a', 'b', 'c'];
    }
  }

  @override
  Widget build(BuildContext context) {
    final centerLat = (_originCoords.latitude + _destCoords.latitude) / 2;
    final centerLon = (_originCoords.longitude + _destCoords.longitude) / 2;
    final center = LatLng(centerLat, centerLon);

    return Container(
      height: widget.height,
      decoration: BoxDecoration(
        color: AppTheme.sunk,
        border: Border.all(color: AppTheme.hairline),
      ),
      child: Stack(
        children: [
          // 1. Real Tile Map Layer
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: center,
              initialZoom: _currentZoom,
              minZoom: 5,
              maxZoom: 18,
              interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.all,
              ),
              onPositionChanged: (pos, _) {
                _currentZoom = pos.zoom;
              },
            ),
            children: [
              // Tile Layer (CartoDB Voyager or Esri Streets)
              TileLayer(
                urlTemplate: _tileUrl,
                subdomains: _subdomains,
                userAgentPackageName: 'com.hopon.carpooling_passenger_app',
              ),

              // Real Driving Route Polyline
              if (_routePoints.isNotEmpty)
                PolylineLayer(
                  polylines: [
                    // Outer high-contrast casing line
                    Polyline(
                      points: _routePoints,
                      strokeWidth: 6.0,
                      color: AppTheme.white,
                    ),
                    // Inner solid teal polyline (HopOn DS signal teal)
                    Polyline(
                      points: _routePoints,
                      strokeWidth: 4.0,
                      color: AppTheme.teal700,
                    ),
                  ],
                ),

              // Markers Layer (HopOn DS v1.0 specifications)
              MarkerLayer(
                markers: [
                  // Origin Marker (HopOn DS Teal Ring)
                  Marker(
                    point: _originCoords,
                    width: 140,
                    height: 52,
                    alignment: Alignment.center,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.canvas,
                            borderRadius: BorderRadius.circular(AppTheme.radiusTag),
                            border: Border.all(color: AppTheme.hairline),
                            boxShadow: const [AppTheme.shadowE1],
                          ),
                          child: Text(
                            widget.origin.split(',').first.trim(),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontFamily: AppTheme.fontFamilyMono,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.teal700,
                            ),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Container(
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppTheme.white,
                            border: Border.all(color: AppTheme.teal700, width: 3.5),
                            boxShadow: const [AppTheme.shadowE1],
                          ),
                          child: Center(
                            child: Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppTheme.teal700,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Destination Marker (HopOn DS Amber Square)
                  Marker(
                    point: _destCoords,
                    width: 140,
                    height: 52,
                    alignment: Alignment.center,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.canvas,
                            borderRadius: BorderRadius.circular(AppTheme.radiusTag),
                            border: Border.all(color: AppTheme.hairline),
                            boxShadow: const [AppTheme.shadowE1],
                          ),
                          child: Text(
                            widget.destination.split(',').first.trim(),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontFamily: AppTheme.fontFamilyMono,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.amber700,
                            ),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            color: AppTheme.amber600,
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: AppTheme.white, width: 2),
                            boxShadow: const [AppTheme.shadowE1],
                          ),
                          child: const Center(
                            child: Icon(Icons.square_rounded, size: 8, color: AppTheme.white),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Live Driver Vehicle Marker
                  if (_driverCoords != null)
                    Marker(
                      point: _driverCoords!,
                      width: 120,
                      height: 56,
                      alignment: Alignment.center,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (widget.vehiclePlate != null || widget.driverName != null)
                            HopOnBadge.plate(widget.vehiclePlate ?? 'GJ01 KT 4821'),
                          const SizedBox(height: 2),
                          Transform.rotate(
                            angle: (widget.driverHeading ?? 45) * (math.pi / 180),
                            child: Container(
                              width: 30,
                              height: 30,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppTheme.hudBg,
                                border: Border.all(color: AppTheme.hudAccent, width: 2.5),
                                boxShadow: const [AppTheme.shadowE2],
                              ),
                              child: const Icon(
                                Icons.navigation_rounded,
                                size: 16,
                                color: AppTheme.hudAccent,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Passenger Position ("YOU · 30m" - Blue only)
                  if (widget.isLiveTracking)
                    Marker(
                      point: _originCoords,
                      width: 90,
                      height: 48,
                      alignment: Alignment.center,
                      child: AnimatedBuilder(
                        animation: _pulseController,
                        builder: (context, child) {
                          return Stack(
                            alignment: Alignment.center,
                            children: [
                              Container(
                                width: 20 + (_pulseController.value * 12),
                                height: 20 + (_pulseController.value * 12),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: AppTheme.blue600.withValues(alpha: 0.25 * (1 - _pulseController.value)),
                                ),
                              ),
                              Container(
                                width: 14,
                                height: 14,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: AppTheme.blue600,
                                  border: Border.all(color: AppTheme.white, width: 2),
                                  boxShadow: const [AppTheme.shadowE1],
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),
                ],
              ),
            ],
          ),

          // 2. Real Telemetry / Route HUD Banner (Top Left)
          Positioned(
            top: 10,
            left: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppTheme.canvas,
                borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                border: Border.all(color: AppTheme.hairline),
                boxShadow: const [AppTheme.shadowE1],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_isLoadingRoute)
                    const SizedBox(
                      width: 12,
                      height: 12,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.teal700),
                    )
                  else
                    const Icon(Icons.directions_car_rounded, size: 14, color: AppTheme.teal700),
                  const SizedBox(width: 6),
                  Text(
                    _isLoadingRoute
                        ? 'Calculating route...'
                        : '$_routeDistanceKm km · $_routeDurationMin min',
                    style: const TextStyle(
                      fontFamily: AppTheme.fontFamilyMono,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.ink900,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                    decoration: BoxDecoration(
                      color: AppTheme.teal50,
                      borderRadius: BorderRadius.circular(3),
                    ),
                    child: Text(
                      _routingEngine.toUpperCase(),
                      style: const TextStyle(
                        fontFamily: AppTheme.fontFamilyMono,
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.teal700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 3. Tile Style Selector & Expand Controls (Top Right)
          Positioned(
            top: 10,
            right: 10,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Style switch toggle (Voyager ↔ Streets)
                GestureDetector(
                  onTap: () {
                    setState(() {
                      if (_tileStyle == MapTileStyle.voyager) {
                        _tileStyle = MapTileStyle.streets;
                      } else if (_tileStyle == MapTileStyle.streets) {
                        _tileStyle = MapTileStyle.osm;
                      } else {
                        _tileStyle = MapTileStyle.voyager;
                      }
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.canvas,
                      borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                      border: Border.all(color: AppTheme.hairline),
                      boxShadow: const [AppTheme.shadowE1],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.layers_outlined, size: 13, color: AppTheme.ink700),
                        const SizedBox(width: 4),
                        Text(
                          _tileStyle == MapTileStyle.voyager
                              ? 'Carto'
                              : _tileStyle == MapTileStyle.streets
                                  ? 'Esri'
                                  : 'OSM',
                          style: const TextStyle(
                            fontFamily: AppTheme.fontFamilyMono,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.ink700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (widget.onExpand != null) ...[
                  const SizedBox(width: 6),
                  GestureDetector(
                    onTap: widget.onExpand,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppTheme.canvas,
                        borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                        border: Border.all(color: AppTheme.hairline),
                        boxShadow: const [AppTheme.shadowE1],
                      ),
                      child: const Icon(Icons.open_in_full_rounded, size: 14, color: AppTheme.ink700),
                    ),
                  ),
                ],
              ],
            ),
          ),

          // 4. Zoom & Re-center Controls (Bottom Right)
          Positioned(
            bottom: 10,
            right: 10,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildMapControl(
                  icon: Icons.my_location_rounded,
                  tooltip: 'Fit route',
                  onTap: _fitBounds,
                ),
                const SizedBox(height: 6),
                _buildMapControl(
                  icon: Icons.add,
                  tooltip: 'Zoom in',
                  onTap: () {
                    _mapController.move(
                      _mapController.camera.center,
                      _mapController.camera.zoom + 1,
                    );
                  },
                ),
                const SizedBox(height: 6),
                _buildMapControl(
                  icon: Icons.remove,
                  tooltip: 'Zoom out',
                  onTap: () {
                    _mapController.move(
                      _mapController.camera.center,
                      _mapController.camera.zoom - 1,
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMapControl({
    required IconData icon,
    required String tooltip,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTheme.radiusControl),
        child: Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppTheme.canvas,
            borderRadius: BorderRadius.circular(AppTheme.radiusControl),
            border: Border.all(color: AppTheme.hairline),
            boxShadow: const [AppTheme.shadowE1],
          ),
          child: Icon(icon, size: 16, color: AppTheme.ink900),
        ),
      ),
    );
  }
}
