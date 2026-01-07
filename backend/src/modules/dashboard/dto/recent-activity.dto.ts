export type ActivityType = 'contribution' | 'loan' | 'fine' | 'investment';

export class RecentActivityDto {
  id: number;
  type: ActivityType;
  description: string;
  amount: number;
  date: Date;
  userName: string;
}
