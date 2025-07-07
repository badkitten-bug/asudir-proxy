const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// CONFIGURA ESTOS DATOS:
const PROXY_URL = 'http://localhost:3000/api';
const EMAIL = 'steve@gmail.com';
const PASSWORD = '12341234';
const FOTO_VOLUMETRICO = './foto_volumetrico.jpg'; // Ruta local a la foto volumétrica
const FOTO_ELECTRICO = './foto_electrico.jpg';     // Ruta local a la foto eléctrica

async function main() {
  // 1. Login y obtener JWT
  const loginRes = await axios.post(`${PROXY_URL}/auth/custom/login`, {
    identifier: EMAIL,
    password: PASSWORD,
    platform: 'mobile'
  });
  const JWT = loginRes.data.jwt;
  console.log('JWT obtenido:', JWT);

  // 2. Crear la lectura
  const lecturaData = {
    data: {
      fecha: "2024-07-06T00:00:00.000Z",
      lectura_volumetrica: "1234",
      gasto: "100",
      lectura_electrica: "567",
      pozo: "35",
      capturador: "7",
      estado: "pendiente"
    }
  };

  const lecturaRes = await axios.post(`${PROXY_URL}/lectura-pozos`, lecturaData, {
    headers: { Authorization: `Bearer ${JWT}` }
  });
  const lecturaId = lecturaRes.data.data.id;
  console.log('Lectura creada con ID:', lecturaId);

  // 3. Subir foto volumétrica
  const formVol = new FormData();
  formVol.append('files', fs.createReadStream(FOTO_VOLUMETRICO));
  formVol.append('ref', 'api::lectura-pozo.lectura-pozo');
  formVol.append('refId', lecturaId);
  formVol.append('field', 'foto_volumetrico');

  const uploadVol = await axios.post(`${PROXY_URL}/upload`, formVol, {
    headers: {
      ...formVol.getHeaders(),
      Authorization: `Bearer ${JWT}`
    }
  });
  console.log('Foto volumétrica subida:', uploadVol.data);

  // 4. Subir foto eléctrica
  const formElec = new FormData();
  formElec.append('files', fs.createReadStream(FOTO_ELECTRICO));
  formElec.append('ref', 'api::lectura-pozo.lectura-pozo');
  formElec.append('refId', lecturaId);
  formElec.append('field', 'foto_electrico');

  const uploadElec = await axios.post(`${PROXY_URL}/upload`, formElec, {
    headers: {
      ...formElec.getHeaders(),
      Authorization: `Bearer ${JWT}`
    }
  });
  console.log('Foto eléctrica subida:', uploadElec.data);
}

main().catch(err => {
  if (err.response) {
    console.error('Error:', err.response.data);
  } else {
    console.error('Error:', err.message);
  }
});