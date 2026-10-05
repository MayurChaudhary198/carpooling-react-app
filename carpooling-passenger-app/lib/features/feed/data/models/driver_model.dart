import 'package:equatable/equatable.dart';

class DriverModel extends Equatable {
  final String name;
  final String email;
  final String phone;

  const DriverModel({
    required this.name,
    required this.email,
    required this.phone,
  });

  factory DriverModel.fromJson(Map<String, dynamic> json) {
    return DriverModel(
      name: json['name'] as String? ?? 'Driver',
      email: json['email'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'email': email,
        'phone': phone,
      };

  @override
  List<Object?> get props => [name, email, phone];
}

class CarModel extends Equatable {
  final String make;
  final String model;
  final String color;
  final String? licensePlate;

  const CarModel({
    required this.make,
    required this.model,
    required this.color,
    this.licensePlate,
  });

  factory CarModel.fromJson(Map<String, dynamic> json) {
    return CarModel(
      make: json['make'] as String? ?? '',
      model: json['model'] as String? ?? '',
      color: json['color'] as String? ?? '',
      licensePlate: json['licensePlate'] as String? ??
          json['plate'] as String? ??
          json['registrationNumber'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'make': make,
        'model': model,
        'color': color,
        if (licensePlate != null) 'licensePlate': licensePlate,
      };

  @override
  List<Object?> get props => [make, model, color, licensePlate];
}

