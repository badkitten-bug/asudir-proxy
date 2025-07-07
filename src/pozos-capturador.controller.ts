import { Controller, Get, Param, Headers, Res, Query } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337/api';

@Controller('api')
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

  @Get('pozos/:pozoId')
  async getPozoById(
    @Param('pozoId') pozoId: string,
    @Headers('authorization') authorization: string,
    @Query() query: any,
    @Res() res: Response
  ) {
    try {
      // Construir la query string manualmente para pasar todos los parámetros (como populate)
      const queryString = Object.keys(query).length > 0
        ? '?' + new URLSearchParams(query as any).toString()
        : '';
      const url = `${STRAPI_URL}/pozos/${pozoId}${queryString}`;
      const response = await axios.get(url, {
        headers: { Authorization: authorization }
      });
      return res.status(response.status).json(response.data);
    } catch (error: any) {
      return res.status(error.response?.status || 500).json(error.response?.data || { error: 'Error al obtener pozo' });
    }
  }
}