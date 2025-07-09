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
      // Usar fecha del servidor para evitar manipulación
      const fechaServidor = new Date();
      const bodyConFechaServidor = {
        ...body,
        fecha: fechaServidor.toISOString()
      };

      // Validación: evitar duplicados (una lectura por pozo por mes/año)
      const pozoId = body.pozo || body.pozoId || body.data?.pozo || body.data?.pozoId;
      if (!pozoId) {
        return res.status(400).json({ error: 'Falta el ID del pozo.' });
      }
      const mes = fechaServidor.getMonth() + 1;
      const anio = fechaServidor.getFullYear();
      const fechaInicio = new Date(anio, mes - 1, 1);
      const fechaFin = new Date(anio, mes, 0, 23, 59, 59);
      const filtros = [
        `filters[fecha][$gte]=${fechaInicio.toISOString()}`,
        `filters[fecha][$lte]=${fechaFin.toISOString()}`,
        `filters[pozo][id][$eq]=${pozoId}`,
        'pagination[pageSize]=1'
      ];
      const queryString = filtros.join('&');
      const url = `${STRAPI_URL}/lectura-pozos?${queryString}`;
      const existeLectura = await axios.get(url, {
        headers: { Authorization: authorization }
      });
      const lecturas = (existeLectura.data as any).data || [];
      if (lecturas.length > 0) {
        return res.status(409).json({
          error: 'Ya existe una lectura para este pozo en el mes y año actual.',
          detalle: lecturas[0]
        });
      }

      const response = await axios.post(
        `${STRAPI_URL}/lectura-pozos`,
        bodyConFechaServidor,
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

  // Nuevo endpoint: Obtener pozos pendientes de lectura por mes
  @Get('lectura-pozos/pendientes-mes')
  async obtenerPozosPendientesMes(
    @Headers('authorization') authorization: string,
    @Res() res: Response,
    @Query('mes') mes?: string,
    @Query('anio') anio?: string,
    @Query('pozoId') pozoId?: string
  ) {
    try {
      // Usar fecha del servidor si no se especifica
      const fechaActual = new Date();
      const mesFiltro = mes ? parseInt(mes) : fechaActual.getMonth() + 1;
      const anioFiltro = anio ? parseInt(anio) : fechaActual.getFullYear();

      // Validar que esté en el rango permitido (1-15 de cada mes)
      const diaActual = fechaActual.getDate();
      if (diaActual < 1 || diaActual > 15) {
        return res.status(400).json({
          error: 'Lecturas solo permitidas del 1 al 15 de cada mes',
          fechaActual: fechaActual.toISOString()
        });
      }

      // Construir filtro de fecha para Strapi
      const fechaInicio = new Date(anioFiltro, mesFiltro - 1, 1);
      const fechaFin = new Date(anioFiltro, mesFiltro, 0, 23, 59, 59);

      // Obtener todas las lecturas del mes especificado
      const filtros = [
        `filters[fecha][$gte]=${fechaInicio.toISOString()}`,
        `filters[fecha][$lte]=${fechaFin.toISOString()}`,
        'pagination[pageSize]=1000', // Obtener todas las lecturas del mes
        'populate=pozo' // Incluir la relación con pozos
      ];

      if (pozoId) {
        filtros.push(`filters[pozo][id][$eq]=${pozoId}`);
      }

      const queryString = filtros.join('&');
      const url = `${STRAPI_URL}/lectura-pozos?${queryString}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: authorization }
      });

      // Extraer los IDs de pozos que ya tienen lectura en este mes
      const responseData = response.data as any;
      const lecturasDelMes = responseData.data || [];
      const pozosConLectura = new Set();
      
      lecturasDelMes.forEach((lectura: any) => {
        if (lectura.pozo && lectura.pozo.id) {
          pozosConLectura.add(lectura.pozo.id);
        }
      });

      // Ahora obtener todos los pozos disponibles
      const pozosResponse = await axios.get(`${STRAPI_URL}/pozos?pagination[pageSize]=1000&populate=*`, {
        headers: { Authorization: authorization }
      });

      const pozosResponseData = pozosResponse.data as any;
      const todosLosPozos = pozosResponseData.data || [];
      
      // Filtrar solo los pozos que NO tienen lectura en este mes
      const pozosPendientes = todosLosPozos.filter((pozo: any) => {
        return !pozosConLectura.has(pozo.id);
      });

      return res.status(200).json({
        data: pozosPendientes,
        meta: {
          mes: mesFiltro,
          anio: anioFiltro,
          totalPendientes: pozosPendientes.length,
          totalConLectura: pozosConLectura.size,
          fechaServidor: fechaActual.toISOString()
        }
      });

    } catch (error: any) {
      console.error('Error al obtener pozos pendientes:', error);
      return res.status(error.response?.status || 500).json(error.response?.data || { 
        error: 'Error al obtener pozos pendientes de lectura' 
      });
    }
  }

  // Nuevo endpoint: Obtener pozos pendientes de lectura por mes para un capturador específico
  @Get('lectura-pozos/pendientes-mes-capturador/:userId')
  async obtenerPozosPendientesMesCapturador(
    @Param('userId') userId: string,
    @Headers('authorization') authorization: string,
    @Res() res: Response,
    @Query('mes') mes?: string,
    @Query('anio') anio?: string
  ) {
    try {
      // 1. Validar que el usuario tenga el rol 'capturador'
      const userResponse = await axios.get(`${STRAPI_URL}/users/${userId}?populate=role`, {
        headers: { Authorization: authorization }
      });
      const user = userResponse.data as { role?: { name?: string } };
      if (!user || !user.role || user.role.name !== 'capturador') {
        return res.status(403).json({ error: 'Solo usuarios con rol capturador pueden acceder a este recurso.' });
      }

      // 2. Obtener pozos asignados al capturador
      const pozosResponse = await axios.get(`${STRAPI_URL}/pozos-capturador/${userId}`, {
        headers: { Authorization: authorization }
      });
      const pozosAsignados = (pozosResponse.data as any).pozos || [];
      const pozosIds = pozosAsignados.map((pozo: any) => pozo.id);
      if (pozosIds.length === 0) {
        return res.status(200).json({ data: [], meta: { totalPendientes: 0, totalConLectura: 0 } });
      }

      // 3. Calcular mes/año
      const fechaActual = new Date();
      const mesFiltro = mes ? parseInt(mes) : fechaActual.getMonth() + 1;
      const anioFiltro = anio ? parseInt(anio) : fechaActual.getFullYear();
      const fechaInicio = new Date(anioFiltro, mesFiltro - 1, 1);
      const fechaFin = new Date(anioFiltro, mesFiltro, 0, 23, 59, 59);

      // 4. Obtener lecturas del mes para esos pozos
      const filtros = [
        `filters[fecha][$gte]=${fechaInicio.toISOString()}`,
        `filters[fecha][$lte]=${fechaFin.toISOString()}`,
        pozosIds.map((id: number) => `filters[pozo][id][$in]=${id}`).join('&'),
        'pagination[pageSize]=1000',
        'populate=pozo'
      ];
      const queryString = filtros.join('&');
      const lecturasResponse = await axios.get(`${STRAPI_URL}/lectura-pozos?${queryString}`, {
        headers: { Authorization: authorization }
      });
      const lecturasDelMes = (lecturasResponse.data as any).data || [];
      const pozosConLectura = new Set();
      lecturasDelMes.forEach((lectura: any) => {
        if (lectura.pozo && lectura.pozo.id) {
          pozosConLectura.add(lectura.pozo.id);
        }
      });

      // 5. Filtrar solo los pozos asignados que NO tienen lectura en el mes
      const pozosPendientes = pozosAsignados.filter((pozo: any) => {
        return !pozosConLectura.has(pozo.id);
      });

      return res.status(200).json({
        data: pozosPendientes,
        meta: {
          mes: mesFiltro,
          anio: anioFiltro,
          totalPendientes: pozosPendientes.length,
          totalConLectura: pozosConLectura.size,
          fechaServidor: fechaActual.toISOString()
        }
      });
    } catch (error: any) {
      console.error('Error en pendientes-mes-capturador:', error);
      return res.status(error.response?.status || 500).json(error.response?.data || { error: 'Error al obtener pozos pendientes del capturador' });
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