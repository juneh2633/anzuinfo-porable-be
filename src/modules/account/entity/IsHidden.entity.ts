import { ApiProperty } from '@nestjs/swagger';
import { Account } from '@prisma/client';

export class IsHiddenEntity {
  @ApiProperty()
  isHidden: 0 | 1;

  constructor(data: any) {
    Object.assign(this, data);
  }
  public static createDto(account: Account) {
    return new IsHiddenEntity({
      isHidden: account.isHidden,
    });
  }
}
