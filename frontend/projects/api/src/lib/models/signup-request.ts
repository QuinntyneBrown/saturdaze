export interface SignupRequest {
  readonly familyName: string;
  readonly homeLocation: string;
  readonly email: string;
  readonly password: string;
  readonly fridayPreview?: boolean;
}
