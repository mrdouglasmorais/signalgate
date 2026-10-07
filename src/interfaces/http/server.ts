import { buildApp } from '@/interfaces/http/app.js';
import { readHost, readPort } from '@/interfaces/http/config.js';

const app = await buildApp();

await app.listen({
  port: readPort(process.env.PORT),
  host: readHost(process.env.HOST),
});
