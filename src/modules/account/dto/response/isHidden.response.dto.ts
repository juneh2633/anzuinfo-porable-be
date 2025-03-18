import { AccountPickEntity } from '../../entity/AccountPick.entity';
import { IsHiddenEntity } from '../../entity/IsHidden.Entity';

export class IstHiddenResponseDto {
  data: IsHiddenEntity;
  constructor(data: any) {
    Object.assign(this, data);
  }

  static createResponse(data: IsHiddenEntity) {
    return new IstHiddenResponseDto({
      data: data,
    });
  }
}
