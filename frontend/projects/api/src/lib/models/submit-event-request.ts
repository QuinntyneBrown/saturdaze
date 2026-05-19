export interface SubmitEventRequest {
  readonly title: string;
  readonly startsAtLocal: string;
  readonly endsAtLocal?: string | null;
  readonly location?: string | null;
  readonly description?: string | null;
  readonly costNote?: string | null;
  readonly ageRange?: string | null;
  readonly sourceUrl?: string | null;
  readonly category?: string | null;
}
