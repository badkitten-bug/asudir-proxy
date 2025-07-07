import {
  Controller,
  Post,
  Headers,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import axios from 'axios';
import { Response, Request } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as FormData from 'form-data';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337/api';

@Controller()
export class UploadController {
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFile(
    @Headers('authorization') authorization: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      // Reenviamos el FormData tal cual
      const form = new FormData();
      // Copia todos los campos del form original
      for (const key in req.body) {
        form.append(key, req.body[key]);
      }
      // Ahora files es un array tipado correctamente
      for (const file of files) {
        form.append('files', file.buffer, { filename: file.originalname });
      }
      const response = await axios.post(`${STRAPI_URL}/upload`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: authorization,
        },
      });
      return res.status(response.status).json(response.data);
    } catch (error: any) {
      return res.status(error.response?.status || 500).json(error.response?.data || { error: 'Error al subir archivo' });
    }
  }
}