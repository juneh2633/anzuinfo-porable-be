export class GreatestSongIdxEntity {
  maxSongIdx: number;

  constructor(data: any) {
    Object.assign(this, data);
  }

  public static createDto(result: { idx: number } | null) {
    return new GreatestSongIdxEntity({
      maxSongIdx: result?.idx || 0,
    });
  }
}
