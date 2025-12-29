
export interface Participant {
  name: string;
  title: string;
}

export interface ScheduleItem extends Participant {
  startTime: string;
  endTime: string;
  isBreak?: boolean;
}

export interface ProcessingStatus {
  step: 'idle' | 'parsing' | 'generating' | 'zipping' | 'completed' | 'error';
  progress: number;
  message: string;
}

export interface AbstractResult {
  fileName: string;
  name: string;
  title: string;
  status: 'ok' | 'warning' | 'error';
}
