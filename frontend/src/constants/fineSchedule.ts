import { ViolationTypeEnum } from './enums';

export const FINE_SCHEDULE: Record<ViolationTypeEnum, number> = {
  // Parking / Loading
  [ViolationTypeEnum.IllegalParkingAttended]:          500,
  [ViolationTypeEnum.IllegalParkingUnattended]:        500,
  [ViolationTypeEnum.ViolationOfLoadingZones]:         500,

  // Traffic Flow
  [ViolationTypeEnum.ObstructionToTraffic]:            1000,
  [ViolationTypeEnum.ViolationOfOneWayStreet]:         1000,
  [ViolationTypeEnum.DrivingAgainstTraffic]:           1000,
  [ViolationTypeEnum.IllegalCounterflow]:              1000,
  [ViolationTypeEnum.NoUTurn]:                         500,

  // Public Utility Vehicle (PUV) Violations
  [ViolationTypeEnum.ColorumTricycles]:                2000,
  [ViolationTypeEnum.FiftyFiftyScheme]:                2000,
  [ViolationTypeEnum.NonDisplayOfNotForHire]:          500,
  [ViolationTypeEnum.NotPostingPassengerFareMatrix]:   500,
  [ViolationTypeEnum.RefusalToConveyPassenger]:        1000,
  [ViolationTypeEnum.Overcharging]:                    1000,
  [ViolationTypeEnum.SmokingInsidePUV]:                500,
  [ViolationTypeEnum.NoOverloading]:                   5000,

  // Driver License Violations
  [ViolationTypeEnum.NoDriversLicense]:                3000,
  [ViolationTypeEnum.NoProfessionalDriversLicense]:    3000,
  [ViolationTypeEnum.ExpiredDriversLicense]:           3000,
  [ViolationTypeEnum.DrivingWithoutLicense]:           3000,
  [ViolationTypeEnum.DrivingWithSuspendedLicense]:     5000,
  [ViolationTypeEnum.DrivingWithRevokedLicense]:       10000,
  [ViolationTypeEnum.UnauthorizedDriver]:              3000,

  // Safety Equipment
  [ViolationTypeEnum.NoSeatbelt]:                      1000,
  [ViolationTypeEnum.FailureToUseSeatbelt]:            1000,
  [ViolationTypeEnum.NoSafetyHelmet]:                  1500,
  [ViolationTypeEnum.ChildrenSafetyOnMotorcycle]:      1000,
  [ViolationTypeEnum.NoICCPSMarkStickerOnHelmet]:      1000,
  [ViolationTypeEnum.NoInteriorLight]:                 500,
  [ViolationTypeEnum.WithoutProperLight]:              500,

  //Speeding
  [ViolationTypeEnum.OverSpeeding]:                    2000,
  [ViolationTypeEnum.NoContactOverspeeding]:           2000,
  [ViolationTypeEnum.OvespeedingPhysicalApprehension]: 2000,

  // Conduct / Behavior
  [ViolationTypeEnum.DrivingUnderInfluenceOfLiquor]:   20000,
  [ViolationTypeEnum.RecklessDriving]:                 10000,
  [ViolationTypeEnum.DisobedienceToTrafficOfficer]:    2000,
  [ViolationTypeEnum.DisregardingTrafficSignSignal]:   1000,
  [ViolationTypeEnum.DiscourtesousConduct]:            1000,
  [ViolationTypeEnum.UntidyAttireOfDriver]:            500,
  [ViolationTypeEnum.Jaywalking]:                      500,
  [ViolationTypeEnum.DrivingThroughProcessions]:       500,

  // Vehicle / Document Violations
  [ViolationTypeEnum.TruckBan]:                        5000,
  [ViolationTypeEnum.NoisyMuffler]:                    1000,
  [ViolationTypeEnum.ViolationOfEmissionStandard]:     2000,
  [ViolationTypeEnum.SmokeBelching]:                   2000,
  [ViolationTypeEnum.ExpiredTCT]:                      1000,
  [ViolationTypeEnum.NoMayorPermit]:                   1000,
  [ViolationTypeEnum.UnifiedVehicularVolumeReductionProgram]: 300,

  // Anti-Distracted Driving
  [ViolationTypeEnum.AntiDistractedDrivingActViolation]: 5000,

  // Serious Offenses
  [ViolationTypeEnum.UsingMotorVehicleInCrime]:        10000,

  // Catch-all
  [ViolationTypeEnum.Others]:                          1000,
};

export function computeTotalFine(types: ViolationTypeEnum[]): number {
  return types.reduce((sum, t) => sum + (FINE_SCHEDULE[t] ?? 0), 0);
}