export const LicenseType = {
  StudentPermit: 'Student Permit',
  NonProfessional: 'Non-Professional',
  Professional: 'Professional',
} as const;
export type LicenseType = (typeof LicenseType)[keyof typeof LicenseType];

export const LicenseStatus = {
  Active: 'Active',
  Expired: 'Expired',
  Suspended: 'Suspended',
  Revoked: 'Revoked',
} as const;
export type LicenseStatus = (typeof LicenseStatus)[keyof typeof LicenseStatus];

export const Sex = {
  Male: 'M',
  Female: 'F',
} as const;
export type Sex = (typeof Sex)[keyof typeof Sex];

export const VehicleType = {
  Sedan: 'Sedan',
  Hatchback: 'Hatchback',
  Coupe: 'Coupe',
  SUV: 'SUV',
  Van: 'Van',
  PickupTruck: 'Pickup Truck',
  Motorcycle: 'Motorcycle',
  Tricycle: 'Tricycle',
  Jeepney: 'Jeepney',
  Bus: 'Bus',
  Truck: 'Truck',
  Trailer: 'Trailer',
} as const;
export type VehicleType = (typeof VehicleType)[keyof typeof VehicleType];

export const RegistrationStatus = {
  Active: 'Active',
  Expired: 'Expired',
  Suspended: 'Suspended',
} as const;
export type RegistrationStatus = (typeof RegistrationStatus)[keyof typeof RegistrationStatus];

export const ViolationStatus = {
  Pending: 'Pending',
  Resolved: 'Resolved',
  Contested: 'Contested',
  Dismissed: 'Dismissed',
} as const;
export type ViolationStatus = (typeof ViolationStatus)[keyof typeof ViolationStatus];

export const PaymentStatus = {
  Paid: 'Paid',
  Unpaid: 'Unpaid',
  Waived: 'Waived',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ViolationTypeEnum = {
  IllegalParkingAttended: 'Illegal parking (attended)',
  IllegalParkingUnattended: 'Illegal parking (unattended)',
  ViolationOfLoadingZones: 'Violation of loading zones',
  ObstructionToTraffic: 'Obstruction to traffic',
  ColorumTricycles: 'Colorum tricycles',
  FiftyFiftyScheme: '50/50 scheme',
  NonDisplayOfNotForHire: 'Non display of Not-for-hire',
  ViolationOfOneWayStreet: 'Violation of one way street',
  DrivingUnderInfluenceOfLiquor: 'Driving under the influence of liquor',
  TruckBan: 'Truck ban',
  NoDriversLicense: 'No drivers license',
  NoProfessionalDriversLicense: 'No professional drivers license',
  ExpiredDriversLicense: 'Expired drivers license',
  NoSeatbelt: 'No seatbelt',
  NoisyMuffler: 'Noisy muffler',
  DisobedienceToTrafficOfficer: 'Disobedience to traffic officer',
  DisregardingTrafficSignSignal: 'Disregarding traffic sign/signal',
  DiscourtesousConduct: 'Discourteous and disrespectful conduct to passer',
  Others: 'Others',
  UntidyAttireOfDriver: 'Untidy attire of driver',
  RecklessDriving: 'Reckless driving',
  NoUTurn: 'No U-turn',
  NoInteriorLight: 'No interior light',
  OverSpeeding: 'Over speeding',
  NoSafetyHelmet: 'No safety helmet',
  UnauthorizedDriver: 'Unauthorized driver',
  NotPostingPassengerFareMatrix: 'Not posting of current passenger fare matrix',
  RefusalToConveyPassenger: 'Refusal to convey passenger',
  NoOverloading: 'No overloading',
  NoMayorPermit: 'No Mayor permit',
  Overcharging: 'Overcharging',
  WithoutProperLight: 'Without proper light',
  Jaywalking: 'Jaywalking',
  ExpiredTCT: 'Expired TCT',
  DrivingThroughProcessions: 'Driving through funeral or other processions',
  SmokingInsidePUV: 'Smoking inside PUV',
  ViolationOfEmissionStandard: 'Violation of emission standard',
  DrivingAgainstTraffic: 'Driving against traffic',
  IllegalCounterflow: 'Illegal counterflow',
  AntiDistractedDrivingActViolation: 'Anti-Distracted Driving Act violation',
  NoContactOverspeeding: 'No contact overspeeding',
  OvespeedingPhysicalApprehension: 'Overspeeding physical apprehension',
  UnifiedVehicularVolumeReductionProgram: 'Unified Vehicular Volume Reduction Program',
  FailureToUseSeatbelt: 'Failure to use seatbelt',
  ChildrenSafetyOnMotorcycle: 'Children safety on motorcycle',
  NoICCPSMarkStickerOnHelmet: 'No ICC/PS mark sticker on helmet',
  SmokeBelching: 'Smoke belching',
  DrivingWithoutLicense: 'Driving without license',
  DrivingWithSuspendedLicense: 'Driving with suspended drivers license',
  DrivingWithRevokedLicense: 'Driving with revoked drivers license',
  UsingMotorVehicleInCrime: 'Using motor vehicle in commission of crime',
} as const;
export type ViolationTypeEnum = (typeof ViolationTypeEnum)[keyof typeof ViolationTypeEnum];

export const LICENSE_TYPE_OPTIONS = Object.values(LicenseType);
export const LICENSE_STATUS_OPTIONS = Object.values(LicenseStatus);
export const SEX_OPTIONS = Object.values(Sex);
export const VEHICLE_TYPE_OPTIONS = Object.values(VehicleType);
export const REGISTRATION_STATUS_OPTIONS = Object.values(RegistrationStatus);
export const VIOLATION_STATUS_OPTIONS = Object.values(ViolationStatus);
export const PAYMENT_STATUS_OPTIONS = Object.values(PaymentStatus);
export const VIOLATION_TYPE_OPTIONS = Object.values(ViolationTypeEnum);

export const MIN_AGE_FOR_LICENSE: Record<LicenseType, number> = {
  [LicenseType.StudentPermit]: 16,
  [LicenseType.NonProfessional]: 17,
  [LicenseType.Professional]: 18,
};

export const PLATE_DIGIT_TO_RENEWAL_MONTH: Record<string, number> = {
  '1': 1,   // January
  '2': 2,   // February
  '3': 3,   // March
  '4': 4,   // April
  '5': 5,   // May
  '6': 6,   // June
  '7': 7,   // July
  '8': 8,   // August
  '9': 9,   // September
  '0': 10,  // October
};

export const INVALID_STATUS_COMBOS: Array<{ violation: ViolationStatus; payment: PaymentStatus }> = [
  { violation: ViolationStatus.Pending,   payment: PaymentStatus.Paid },
  { violation: ViolationStatus.Pending,   payment: PaymentStatus.Waived },
  { violation: ViolationStatus.Resolved,  payment: PaymentStatus.Unpaid },
  { violation: ViolationStatus.Contested, payment: PaymentStatus.Paid },
  { violation: ViolationStatus.Contested, payment: PaymentStatus.Waived },
  { violation: ViolationStatus.Dismissed, payment: PaymentStatus.Paid },
  { violation: ViolationStatus.Dismissed, payment: PaymentStatus.Unpaid },
];