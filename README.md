# PUC Colombia

Catálogo interactivo del **Plan Único de Cuentas** colombiano (Decreto 2650 de 1993).
Aplicación web instalable, pensada para el móvil, que funciona sin conexión, sin login y sin base de datos.

## Qué hace

- **Lee el código dígito a dígito.** Escribes `110505` y ves cómo se descompone:
  `1` Activo → `11` Disponible → `1105` Caja → `110505` Caja general. También funciona con
  auxiliares (`11050501`) y avisa cuando la longitud no corresponde a ningún nivel.
- **Busca por código o por nombre**, sin importar tildes: `depreciacion` encuentra `DEPRECIACIÓN`.
- **Busca por movimiento.** Escribes *"consigno el dinero"* o *"pago la nómina"* y obtienes el asiento:
  qué cuentas se debitan y cuáles se acreditan, con el concepto de cada renglón.
- **Explica cada cuenta:** qué registra, su naturaleza, en qué estado financiero se presenta y su
  dinámica (se debita por / se acredita por), heredada del nivel superior cuando no tiene una propia.
- **Permite crear tus propias cuentas** validando que el código sea correcto y que exista su nivel
  superior. Importa y exporta en CSV.

## Uso

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
npm test             # 15 pruebas de la lógica del catálogo
npm run seed         # regenera data/puc.json y los iconos de la PWA
```

## Probar desde el móvil

```bash
npm run dev -- -H 0.0.0.0
```

Abre `http://TU-IP-LOCAL:3000` desde el teléfono, en la misma red wifi
(`ipconfig getifaddr en0` en macOS da la IP).

**El service worker no se registra por IP local.** Los navegadores solo lo permiten en `localhost`
o sobre HTTPS, así que el modo sin conexión y la instalación de la PWA hay que probarlos en la URL
de Vercel, que sí es HTTPS. El resto de la interfaz se prueba igual por red local.

## Diseño para móvil

La interfaz se diseñó primero para la pantalla del teléfono; el escritorio es la ampliación.

- Una sola columna. Las tres columnas aparecen a partir de `lg`.
- Navegación por capas: lista → ficha a pantalla completa. **El botón atrás del sistema cierra la
  ficha** en lugar de salir de la aplicación, porque lo que se está viendo vive en el hash de la URL
  (`#c/1105`, `#m/pago-nomina`). De paso, la dirección se puede compartir y recargar la mantiene.
- Barra inferior fija con lo que más se usa —Clases, Nueva y el menú— al alcance del pulgar.
- Áreas táctiles de 48px como mínimo (variable `--tactil`).
- Campos de formulario a 16px: por debajo de eso Safari amplía la página al enfocarlos.
- Se respetan los márgenes seguros del dispositivo (notch y barra de gestos) con `env(safe-area-inset-*)`.
- Clases y filtros, importar/exportar y crear cuenta van en hojas que suben desde el borde inferior;
  en escritorio las mismas piezas se muestran como columna lateral y tarjetas centradas.

## Desplegar en Vercel

El proyecto es estático: no necesita variables de entorno, base de datos ni configuración adicional.

```bash
npx vercel          # despliegue de prueba
npx vercel --prod   # producción
```

También puedes subir el repositorio a GitHub e importarlo desde vercel.com: Vercel detecta Next.js
y no hay nada más que ajustar.

## Sin conexión

Un service worker (`public/sw.js`) cachea el documento y los recursos estáticos. Como el catálogo
va empaquetado en el JavaScript de la aplicación, tras la primera visita todo funciona sin red.
Para instalarla, el menú de la aplicación tiene la opción **Instalar en el teléfono**.

## Dónde viven los datos

| Dato | Dónde | Nota |
| --- | --- | --- |
| Catálogo oficial | `data/puc.json`, empaquetado en el repositorio | Solo lectura |
| Movimientos típicos | `data/movimientos.ts` | Solo lectura |
| Tus cuentas | `localStorage` del navegador | No salen del dispositivo |

En Vercel el sistema de archivos del servidor es de solo lectura, así que las cuentas propias se
guardan en el navegador. **Exporta el CSV** si quieres conservarlas o llevarlas a otro dispositivo.
Si más adelante necesitas que varias personas compartan el mismo catálogo ampliado, el punto de
cambio es `lib/almacenamiento.ts`: es la única pieza que toca el almacenamiento.

## Alcance del catálogo

`data/puc.json` trae **508 registros**: las 9 clases, los 52 grupos, 344 cuentas y 103 subcuentas
de mayor uso, con descripción.

**Verificación.** Las 9 clases, los 52 grupos y las 344 cuentas de 4 dígitos se contrastaron una a
una contra el catálogo publicado en [puc.com.co](https://puc.com.co), clase por clase. Las
subcuentas incluidas también se verificaron cuenta por cuenta contra la misma fuente; las que no
aparecían allí se eliminaron en lugar de dejarlas a medias.

El PUC completo tiene varios miles de subcuentas: aquí está un núcleo de las de mayor uso, y el
resto se agrega desde la aplicación o importando un CSV.

Un chequeo automático (`npm test`) valida que no haya duplicados, que toda cuenta tenga su nivel
superior, que la naturaleza sea coherente con la clase y que todos los códigos usados en los
asientos de `data/movimientos.ts` existan en el catálogo.

> El Decreto 2650 perdió obligatoriedad para reconocimiento y medición con la convergencia a NIIF
> (Ley 1314 de 2009, Decreto 2420 de 2015). Se mantiene como catálogo operativo y de referencia,
> que es el uso que cubre esta aplicación.

## Estructura

```
app/                 layout, página y manifiesto de la PWA
components/          interfaz (todos los componentes son de cliente)
lib/
  puc.ts             reglas del PUC: niveles, naturaleza, decodificación, validación, CSV
  catalogo.ts        índice consultable: búsqueda, jerarquía, fichas
  almacenamiento.ts  cuentas propias en localStorage
  navegacion.ts      qué se está viendo, guardado en el hash de la URL
  movimientos.ts     búsqueda de operaciones típicas
data/
  puc.json           catálogo oficial (generado)
  movimientos.ts     operaciones típicas con su asiento
scripts/
  build-seed.mjs     fuente compacta del catálogo → data/puc.json
  build-icons.mjs    iconos PNG de la PWA
test/                pruebas de la lógica del catálogo
```

### Ampliar el catálogo oficial

Edita la fuente compacta en `scripts/build-seed.mjs` (`codigo|NOMBRE|descripción|DB o CR`) y ejecuta
`npm run seed`. El generador valida longitudes, duplicados y que toda cuenta tenga su nivel superior:
si algo no cuadra, falla en vez de producir un catálogo inconsistente.
