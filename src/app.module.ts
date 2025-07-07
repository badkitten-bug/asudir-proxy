import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth.controller';
import { LecturaPozosController } from './lectura-pozos.controller';
import { UploadController } from './upload.controller';
import { PozosCapturadorController } from './pozos-capturador.controller';

@Module({
  imports: [],
  controllers: [
    AppController, // (puedes dejarlo o quitarlo si no lo usas)
    AuthController,
    LecturaPozosController,
    UploadController,
    PozosCapturadorController,
  ],
  providers: [AppService],
})
export class AppModule {}