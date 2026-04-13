import { util } from '@aws-appsync/utils';

export function createId(): string {
  return util.autoId();
}

export function now(): string {
  return util.time.nowISO8601();
}

export function error(message: string, type: string = 'BadRequest', data: any = null) {
  util.error(message, type, data);
}
