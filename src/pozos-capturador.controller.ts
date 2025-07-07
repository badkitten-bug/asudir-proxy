import { Controller, Get, Param, Headers, Res } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337/api';

@Controller()
export class PozosCapturadorController {
  @Get('pozos-capturador/:userId')
  async getPozos(
    @Param('userId') userId: string,
    @Headers('authorization') authorization: string,
    @Res() res: Response
  ) {
    try {
      const response = await axios.get(`${STRAPI_URL}/pozos-capturador/${userId}`, {
        headers: { Authorization: authorization }
      });
      return res.status(response.status).json(response.data);
    } catch (error: any) {
      return res.status(error.response?.status || 500).json(error.response?.data || { error: 'Error al obtener pozos' });
    }
  }
}