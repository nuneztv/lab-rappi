# Rappi Local

Proyecto de delivery con Node.js + Express + TypeScript, PostgreSQL mediante `pg`, y Next.js.

## Importante
Las tablas ya deben existir en Supabase. Este proyecto **no crea ni borra tablas al arrancar**.

### Server
1. Copia `server/.env.example` a `server/.env`.
2. Coloca tu `DATABASE_URL` de Supabase Session Pooler y un `JWT_SECRET`.
3. `cd server`
4. `npm install`
5. `npm run dev`

### Client
1. Copia `client/.env.example` a `client/.env.local`.
2. `npm install`
3. `npm run dev`

El backend usa `pg` directamente. No se usa Supabase JS.

## Roles
- consumer: tiendas abiertas, productos, crear pedidos y ver estados.
- store: abrir/cerrar tienda, crear/editar productos y ver pedidos.
- delivery: ver disponibles, aceptar, rechazar, liberar y marcar entregados.

No subas los archivos `.env` a GitHub.

## Nota de entrega
No se incluye ninguna contraseña real ni archivo `.env`. La URL de Supabase se coloca localmente en `server/.env`.
