import {
  Controller,
  Post,
  Req,
  Res
} from '@nestjs/common';
import { Response, Request } from 'express';
import * as httpProxy from 'http-proxy';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337/api';

@Controller()
export class UploadController {
  @Post('upload')
  async proxyUpload(@Req() req: Request, @Res() res: Response) {
    // Usar httpProxy para reenviar la petición original a Strapi
    const proxy = httpProxy.createProxyServer({
      target: STRAPI_URL,
      changeOrigin: true,
      selfHandleResponse: false
    });
    // Cambia la url para que termine en /upload
    req.url = '/upload';
    proxy.web(req, res, {}, (err) => {
      res.status(500).json({ error: 'Proxy error', details: err });
    });
  }
}