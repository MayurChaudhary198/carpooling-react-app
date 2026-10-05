import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

enum SeatStatus {
  driver,
  taken,
  available,
  selected,
}

class HopOnSeatMap extends StatefulWidget {
  final int initialSelectedSeat;
  final ValueChanged<int>? onSeatSelected;

  const HopOnSeatMap({
    super.key,
    this.initialSelectedSeat = 2, // 2: Rear left default
    this.onSeatSelected,
  });

  @override
  State<HopOnSeatMap> createState() => _HopOnSeatMapState();
}

class _HopOnSeatMapState extends State<HopOnSeatMap> {
  late int _selectedSeatIndex;

  @override
  void initState() {
    super.initState();
    _selectedSeatIndex = widget.initialSelectedSeat;
  }

  void _selectSeat(int index) {
    if (index == 0 || index == 1) return; // 0 is Driver, 1 is Taken
    setState(() {
      _selectedSeatIndex = index;
    });
    widget.onSeatSelected?.call(index);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.white,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        border: Border.all(color: AppTheme.hairline),
        boxShadow: const [AppTheme.shadowE1],
      ),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'CHOOSE YOUR SEAT',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
              color: AppTheme.ink500,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 2x2 Car layout box
              Container(
                width: 130,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.sunk,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.hairline),
                ),
                child: Column(
                  children: [
                    // Front row: Driver | Front Passenger (Taken)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildSeat(
                          label: 'Driver',
                          icon: Icons.trip_origin_rounded,
                          status: SeatStatus.driver,
                          index: 0,
                        ),
                        _buildSeat(
                          label: 'Taken',
                          status: SeatStatus.taken,
                          index: 1,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Rear row: Rear Left (Selectable) | Rear Right (Selectable)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildSeat(
                          label: _selectedSeatIndex == 2 ? 'Your seat' : 'Available',
                          status: _selectedSeatIndex == 2 ? SeatStatus.selected : SeatStatus.available,
                          index: 2,
                        ),
                        _buildSeat(
                          label: _selectedSeatIndex == 3 ? 'Your seat' : 'Available',
                          status: _selectedSeatIndex == 3 ? SeatStatus.selected : SeatStatus.available,
                          index: 3,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              // Side description & legend
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _selectedSeatIndex == 2 ? 'Rear left' : 'Rear right',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.ink900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Window seat. Middle kept empty — max 2 in the rear.',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.ink600,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 14),
                    // Legend
                    _buildLegendItem(AppTheme.teal700, 'Your seat', hasBorder: false),
                    const SizedBox(height: 6),
                    _buildLegendItem(AppTheme.white, 'Available', hasBorder: true),
                    const SizedBox(height: 6),
                    _buildLegendItem(AppTheme.muted, 'Taken', hasBorder: false),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSeat({
    required String label,
    required SeatStatus status,
    required int index,
    IconData? icon,
  }) {
    Color bg;
    Color fg;
    Border? border;

    switch (status) {
      case SeatStatus.driver:
        bg = AppTheme.ink900;
        fg = AppTheme.white;
        break;
      case SeatStatus.taken:
        bg = AppTheme.muted;
        fg = AppTheme.ink600;
        break;
      case SeatStatus.selected:
        bg = AppTheme.teal700;
        fg = AppTheme.white;
        break;
      case SeatStatus.available:
        bg = AppTheme.white;
        fg = AppTheme.ink900;
        border = Border.all(color: AppTheme.hairline, width: 1.5);
        break;
    }

    return GestureDetector(
      onTap: () => _selectSeat(index),
      child: Container(
        width: 50,
        height: 52,
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(AppTheme.radiusCtl),
          border: border,
        ),
        alignment: Alignment.center,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 14, color: fg),
              const SizedBox(height: 2),
            ],
            Text(
              label,
              style: TextStyle(
                color: fg,
                fontSize: 9,
                fontWeight: FontWeight.w700,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegendItem(Color color, String text, {required bool hasBorder}) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
            border: hasBorder ? Border.all(color: AppTheme.hairline) : null,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          text,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: AppTheme.ink600,
          ),
        ),
      ],
    );
  }
}
