import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class HopOnRouteTimeline extends StatelessWidget {
  final String origin;
  final String destination;
  final String? originTime;
  final String? destinationTime;
  final String? originWalk;
  final String? destinationWalk;
  final bool isWalkOver1km;

  const HopOnRouteTimeline({
    super.key,
    required this.origin,
    required this.destination,
    this.originTime,
    this.destinationTime,
    this.originWalk,
    this.destinationWalk,
    this.isWalkOver1km = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Origin Row
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (originTime != null) ...[
              SizedBox(
                width: 44,
                child: Text(
                  originTime!,
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: AppTheme.ink900,
                  ),
                ),
              ),
              const SizedBox(width: 8),
            ],
            // Teal Ring (Shape = Circle/Ring)
            Padding(
              padding: const EdgeInsets.only(top: 2.0),
              child: Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.white,
                  border: Border.all(color: AppTheme.teal700, width: 3),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    origin,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.ink900,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (originWalk != null)
                    Text(
                      originWalk!,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isWalkOver1km ? AppTheme.amber700 : AppTheme.ink500,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),

        // Connecting Line
        Row(
          children: [
            if (originTime != null) const SizedBox(width: 52),
            Container(
              width: 14,
              alignment: Alignment.center,
              child: Container(
                width: 2,
                height: 24,
                color: AppTheme.hairline,
              ),
            ),
          ],
        ),

        // Destination Row
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (destinationTime != null) ...[
              SizedBox(
                width: 44,
                child: Text(
                  destinationTime!,
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: AppTheme.ink900,
                  ),
                ),
              ),
              const SizedBox(width: 8),
            ],
            // Amber Square (Shape = Square)
            Padding(
              padding: const EdgeInsets.only(top: 3.0),
              child: Container(
                width: 13,
                height: 13,
                decoration: BoxDecoration(
                  color: AppTheme.amber600,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(width: 11),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    destination,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.ink900,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (destinationWalk != null)
                    Text(
                      destinationWalk!,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.ink500,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }
}
