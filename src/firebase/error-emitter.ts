
import { EventEmitter } from 'events';
import { type FirestorePermissionError } from './errors';

interface ErrorEmitterEvents {
  'permission-error': (error: FirestorePermissionError) => void;
}

export declare interface ErrorEmitter {
  on<U extends keyof ErrorEmitterEvents>(
    event: U,
    listener: ErrorEmitterEvents[U]
  ): this;
  emit<U extends keyof ErrorEmitterEvents>(
    event: U,
    ...args: Parameters<ErrorEmitterEvents[U]>
  ): boolean;
}

export class ErrorEmitter extends EventEmitter {}

export const errorEmitter = new ErrorEmitter();
