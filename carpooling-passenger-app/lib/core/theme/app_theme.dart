import 'package:flutter/material.dart';

class AppTheme {
  AppTheme._();

  // HopOn DS v1.0 — Signal Colors
  static const Color teal700 = Color(0xFF0F766E); // Primary, pickup
  static const Color teal600 = Color(0xFF0D9488); // Hover, stops
  static const Color teal800 = Color(0xFF0B5A54); // Pressed
  static const Color teal100 = Color(0xFFCCFBF1);
  static const Color teal50 = Color(0xFFF0FDFA);

  static const Color amber600 = Color(0xFFD97706); // Drop-off fill
  static const Color amber700 = Color(0xFFB45309); // Amber text 5:1 contrast
  static const Color amber50 = Color(0xFFFFFBEB);

  static const Color blue600 = Color(0xFF2563EB); // "You" only
  static const Color blue700 = Color(0xFF1D4ED8);
  static const Color blue50 = Color(0xFFEFF6FF);

  static const Color emerald600 = Color(0xFF059669); // Verified fill
  static const Color emerald700 = Color(0xFF047857); // Success text
  static const Color emerald50 = Color(0xFFECFDF5);

  static const Color red700 = Color(0xFFB91C1C); // SOS, errors
  static const Color red800 = Color(0xFF991B1B);
  static const Color red50 = Color(0xFFFEF2F2);

  // Neutral, Map & HUD
  static const Color ink900 = Color(0xFF1C1917); // Primary text
  static const Color ink700 = Color(0xFF44403C);
  static const Color ink600 = Color(0xFF57534E); // Secondary text
  static const Color ink500 = Color(0xFF78716C); // Muted / eyebrow
  static const Color ink400 = Color(0xFFA8A29E);
  static const Color ink300 = Color(0xFFD6D3D1);

  static const Color canvas = Color(0xFFFAFAF8); // App canvas background
  static const Color sunk = Color(0xFFF4F3EF); // Nested / input fill
  static const Color muted = Color(0xFFE7E5DF);
  static const Color hairline = Color(0xFFE5E7EB); // Border
  static const Color frame = Color(0xFFD6D3CC);
  static const Color white = Color(0xFFFFFFFF);

  // HUD (Dark Mount)
  static const Color hudBg = Color(0xFF0E1211);
  static const Color hudSurface = Color(0xFF151A19);
  static const Color hudLine = Color(0xFF2A302E);
  static const Color hudAccent = Color(0xFF2DD4BF);

  // Radii
  static const double radiusTag = 4.0;
  static const double radiusCtl = 8.0;
  static const double radiusControl = radiusCtl;
  static const double radiusCard = 14.0;
  static const double radiusSheet = 16.0;
  static const double radiusFull = 9999.0;

  // Typography Families
  static const String fontFamilyMono = 'JetBrains Mono';
  static const String fontFamilySans = 'Plus Jakarta Sans';

  // Solid Offset BoxShadows (HopOn: "Hairlines and solid offsets — no blur, no glass")
  static const BoxShadow shadowE1 = BoxShadow(
    color: Color(0x0F1C1917), // rgba(28,25,23,0.06)
    offset: Offset(0, 2),
    blurRadius: 0,
  );

  static const BoxShadow shadowE2 = BoxShadow(
    color: Color(0x1A1C1917), // rgba(28,25,23,0.10)
    offset: Offset(0, 3),
    blurRadius: 0,
  );

  static const BoxShadow shadowE3 = BoxShadow(
    color: Color(0x1F1C1917), // rgba(28,25,23,0.12)
    offset: Offset(0, 6),
    blurRadius: 0,
  );

  // Backward compatibility getters
  static const Color primaryColor = teal700;
  static const Color primaryAccent = teal600;
  static const Color primaryLight = teal600;
  static const Color primaryTint = teal50;
  static const Color secondaryColor = emerald700;
  static const Color secondaryTint = emerald50;
  static const Color warningColor = amber600;
  static const Color warningTint = amber50;
  static const Color errorColor = red700;
  static const Color errorTint = red50;

  static const Color backgroundLight = canvas;
  static const Color surfaceLight = white;
  static const Color surfaceSubtle = sunk;
  static const Color textPrimaryLight = ink900;
  static const Color textSecondaryLight = ink600;
  static const Color textTertiaryLight = ink500;
  static const Color borderLight = hairline;

  static const Color backgroundDark = hudBg;
  static const Color surfaceDark = hudSurface;
  static const Color surfaceSubtleDark = hudLine;
  static const Color textPrimaryDark = Color(0xFFF8FAFC);
  static const Color textSecondaryDark = Color(0xFF94A3B8);
  static const Color textTertiaryDark = Color(0xFF64748B);
  static const Color borderDark = hudLine;

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: teal700,
      scaffoldBackgroundColor: canvas,
      colorScheme: const ColorScheme.light(
        primary: teal700,
        secondary: teal600,
        tertiary: amber600,
        error: red700,
        surface: white,
        onPrimary: white,
        onSecondary: white,
        onSurface: ink900,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: canvas,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: ink900),
        titleTextStyle: TextStyle(
          color: ink900,
          fontSize: 20,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.5,
        ),
      ),
      cardTheme: CardThemeData(
        color: white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusCard),
          side: const BorderSide(color: hairline, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: sunk,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        hintStyle: const TextStyle(color: ink400, fontSize: 14, fontWeight: FontWeight.w500),
        labelStyle: const TextStyle(color: ink600, fontSize: 13, fontWeight: FontWeight.w600),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusCtl),
          borderSide: const BorderSide(color: hairline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusCtl),
          borderSide: const BorderSide(color: hairline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusCtl),
          borderSide: const BorderSide(color: teal700, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusCtl),
          borderSide: const BorderSide(color: red700),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: teal700,
          foregroundColor: white,
          minimumSize: const Size(double.infinity, 44),
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusCtl)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, letterSpacing: -0.2),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: ink900,
          backgroundColor: white,
          minimumSize: const Size(double.infinity, 44),
          side: const BorderSide(color: hairline, width: 1),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusCtl)),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: white,
        selectedItemColor: teal700,
        unselectedItemColor: ink500,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 11),
        unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: hudAccent,
      scaffoldBackgroundColor: hudBg,
      colorScheme: const ColorScheme.dark(
        primary: hudAccent,
        secondary: teal600,
        tertiary: amber600,
        error: red700,
        surface: hudSurface,
        onPrimary: ink900,
        onSurface: white,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: hudBg,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: white),
        titleTextStyle: TextStyle(
          color: white,
          fontSize: 20,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.5,
        ),
      ),
      cardTheme: CardThemeData(
        color: hudSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusCard),
          side: const BorderSide(color: hudLine, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: hudAccent,
          foregroundColor: ink900,
          minimumSize: const Size(double.infinity, 44),
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusCtl)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
        ),
      ),
    );
  }
}
