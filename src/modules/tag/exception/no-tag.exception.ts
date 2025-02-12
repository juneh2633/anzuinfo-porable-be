import { HttpException } from '@nestjs/common';
import { ErrorCodes } from 'src/common/lib/error-code';

export class NoTagException extends HttpException {
  constructor() {
    super('no tag', ErrorCodes.NO_TAG);
  }
}
