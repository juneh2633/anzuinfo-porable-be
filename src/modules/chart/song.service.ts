import { Injectable, NotFoundException } from '@nestjs/common';
import { SongRepository } from './repository/song.repository';

@Injectable()
export class SongService {
  constructor(private readonly songRepository: SongRepository) {}

  async searchSongByTitle(key: string) {
    const songList = await this.songRepository.selectSongByKeyword(key);
    if (!songList.length) {
      throw new NotFoundException();
    }
  }
}
