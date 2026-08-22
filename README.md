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
- **Entrena el debe y el haber.** 37 ejercicios en cinco niveles: la aplicación plantea una
  operación y entrega sus renglones sueltos para que los ubiques en su columna. Desde el nivel 3
  hay que elegir además la cuenta del PUC.
- **Permite crear tus propias cuentas** validando que el código sea correcto y que exista su nivel
  superior. Importa y exporta en CSV.

## Entrenamiento del debe y el haber

Cada ejercicio da un caso —una venta con IVA, una nómina con descuentos, la venta de un activo
depreciado— y sus renglones desordenados, cada uno con su importe. Se ubica cada renglón en el debe
o en el haber; el control de cuadre va sumando las dos columnas en vivo. Al comprobar, cada renglón
queda marcado y se explica el porqué del asiento.

| Nivel | Qué se pide | Ejercicios |
| --- | --- | --- |
| 1 · La partida doble | Solo la columna, dos renglones | 8 |
| 2 · Tres renglones o más | Solo la columna: impuestos, retenciones, pagos parciales | 7 |
| 3 · Entra el PUC | Columna y cuenta de 4 dígitos, elegida de un banco de opciones | 8 |
| 4 · Hasta la subcuenta | Columna y subcuenta de 6 dígitos, con distractores parecidos | 8 |
| 5 · Sin opciones | La cuenta se busca en el catálogo completo | 6 |

Los ejercicios viven en `data/ejercicios.ts`. Las pruebas verifican que cada asiento cuadre, que
todas las cuentas citadas existan en `data/puc.json`, que los bancos de opciones incluyan siempre
la respuesta y al menos un distractor, y que la dificultad suba nivel a nivel.

## Uso

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
npm test             # 37 pruebas de la lógica del catálogo y de los ejercicios
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
- Barra inferior fija con lo que más se usa —Clases, Entrenar y el menú— al alcance del pulgar.
- Las columnas de la maqueta llevan `min-w-0`: un hijo de `grid` no baja de su contenido por
  omisión, y sin eso una descripción larga ensancha el panel y corta el texto por la derecha.
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
| Ejercicios | `data/ejercicios.ts` | Solo lectura |
| Tus cuentas | `localStorage` del navegador | No salen del dispositivo |
| Tu progreso en los ejercicios | `localStorage` del navegador | No sale del dispositivo |

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
asientos de `data/movimientos.ts` y `data/ejercicios.ts` existan en el catálogo.

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
  ejercicios.ts      calificación y recorrido del entrenamiento
  progreso.ts        ejercicios resueltos en localStorage
data/
  puc.json           catálogo oficial (generado)
  movimientos.ts     operaciones típicas con su asiento
  ejercicios.ts      ejercicios del entrenamiento, por nivel
scripts/
  build-seed.mjs     fuente compacta del catálogo → data/puc.json
  build-icons.mjs    iconos PNG de la PWA
test/                pruebas de la lógica del catálogo
```

### Ampliar el catálogo oficial

Edita la fuente compacta en `scripts/build-seed.mjs` (`codigo|NOMBRE|descripción|DB o CR`) y ejecuta
`npm run seed`. El generador valida longitudes, duplicados y que toda cuenta tenga su nivel superior:
si algo no cuadra, falla en vez de producir un catálogo inconsistente.
