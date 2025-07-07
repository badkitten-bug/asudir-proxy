import { Controller, Post, Body, Res } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337/api';

@Controller('api/auth')
export class AuthController {
  @Post('custom/login')
  async login(@Body() body: any, @Res() res: Response) {
    try {
      const response = await axios.post(`${STRAPI_URL}/auth/custom/login`, body);
      return res.status(response.status).json(response.data);
    } catch (error: any) {
      return res
        .status(error.response?.status || 500)
        .json(error.response?.data || { error: 'Error en login' });
    }
  }
}