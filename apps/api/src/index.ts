import { buildApp } from './server.js';

const PORT = Number(process.env.PORT ?? 3000);

const app = await buildApp();

app.listen({ port: PORT, host: '0.0.0.0' }).then((address) => {
  console.log(`Release Guardian API running at ${address}`);
  console.log(`API documentation: ${address}/docs`);
});
