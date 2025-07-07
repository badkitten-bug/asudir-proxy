import { Controller, Post, Get, Body, Headers, Res, Param, Query, Req } from '@nestjs/common';
import axios from 'axios';
import { Response, Request } from 'express';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337/api';

@Controller()
export class LecturaPozosController {
  // Crear una nueva lectura
  @Post('lectura-pozos')
  async crearLectura(
    @Body() body: any,
    @Headers('authorization') authorization: string,
    @Res() res: Response
  ) {
    try {
      const response = await axios.post(
        `${STRAPI_URL}/lectura-pozos`,
        body,
        { headers: { Authorization: authorization, 'Content-Type': 'application/json' } }
      );
      return res.status(response.status).json(response.data);
    } catch (error: any) {
      return res.status(error.response?.status || 500).json(error.response?.data || { error: 'Error al crear lectura' });
    }
  }

  // Listar lecturas (con query params opcionales)
  @Get('lectura-pozos')
  async listarLecturas(
    @Headers('authorization') authorization: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      // Reenvía todos los query params
      const queryString = req.url.split('?')[1] || '';
      const url = `${STRAPI_URL}/lectura-pozos${queryString ? '?' + queryString : ''}`;
      const response = await axios.get(url, {
        headers: { Authorization: authorization }
      });
      return res.status(response.status).json(response.data);
    } catch (error: any) {
      return res.status(error.response?.status || 500).json(error.response?.data || { error: 'Error al listar lecturas' });
    }
  }

  // Obtener detalle de una lectura
  @Get('lectura-pozos/:lecturaId')
  async obtenerLecturaPorId(
    @Param('lecturaId') lecturaId: string,
    @Headers('authorization') authorization: string,
    @Query() query: any,
    @Res() res: Response
  ) {
    try {
      // Construir la query string manualmente para pasar todos los parámetros (como populate)
      const queryString = Object.keys(query).length > 0
        ? '?' + new URLSearchParams(query as any).toString()
        : '';
      const url = `${STRAPI_URL}/lectura-pozos/${lecturaId}${queryString}`;
      const response = await axios.get(url, {
        headers: { Authorization: authorization }
      });
      return res.status(response.status).json(response.data);
    } catch (error: any) {
      return res.status(error.response?.status || 500).json(error.response?.data || { error: 'Error al obtener lectura' });
    }
  }
}