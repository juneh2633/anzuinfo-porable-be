import { IsHiddenEntity } from '../../entity/IsHidden.entity';

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
