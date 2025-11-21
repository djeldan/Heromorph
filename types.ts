export interface SuperheroOption {
  id: string;
  name: string;
  image: string;
  promptModifier: string;
  color: string;
}

export interface TransformationRequest {
  image: string; // Base64
  heroName: string;
  customPrompt?: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
