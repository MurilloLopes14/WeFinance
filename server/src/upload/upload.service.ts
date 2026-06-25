import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.getOrThrow<string>('cloudinary.cloudName'),
      api_key: this.configService.getOrThrow<string>('cloudinary.apiKey'),
      api_secret: this.configService.getOrThrow<string>('cloudinary.apiSecret'),
    });
  }

  uploadImage(buffer: Buffer, subfolder: string, publicId: string): Promise<string> {
    const root = this.configService.get<string>('cloudinary.rootFolder');
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `${root}/${subfolder}`,
          public_id: publicId,
          overwrite: true,
          resource_type: 'image',
          transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face' }],
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            return reject(new InternalServerErrorException('Falha ao enviar imagem para o Cloudinary'));
          }
          resolve(result.secure_url);
        },
      );

      stream.end(buffer);
    });
  }
}
