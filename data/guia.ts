/**
 * Guía en lenguaje sencillo del PUC.
 *
 * El texto oficial de cada clase y grupo viene del Decreto 2650 (data/puc.json);
 * aquí va lo que el decreto no dice de forma directa: qué es en palabras simples,
 * en qué caso se usa y qué pasa cuando eres tú quien paga o cuando te pagan a ti.
 */

export type Lado = 'pago' | 'cobro' | 'interno'

export interface GuiaClase {
  /** Qué es, en una frase sin tecnicismos. */
  simple: string
  /** La pregunta que hay que hacerse para saber si algo va en esta clase. */
  pregunta: string
  /** Con qué columna aumenta el saldo. */
  aumenta: 'debito' | 'credito'
  /** Qué papel juega la clase cuando tú pagas (sale dinero). */
  siPagas: string
  /** Qué papel juega cuando un cliente u otro tercero te paga (entra dinero). */
  siTePagan: string
  /** Peso en el mosaico de inicio: 1 las de uso diario, 3 las de uso ocasional. */
  prioridad: 1 | 2 | 3
}

export const GUIA_CLASES: Record<string, GuiaClase> = {
  '1': {
    simple: 'Lo que la empresa tiene o le deben: dinero, cuentas por cobrar, mercancía, equipos.',
    pregunta: '¿Es algo que tengo o que me van a pagar?',
    aumenta: 'debito',
    siPagas:
      'El dinero sale del grupo 11 (caja o bancos), que se acredita. Si a cambio recibes un bien que dura —mercancía (14), un equipo (15)— o entregas un anticipo (1330), ese activo se debita.',
    siTePagan:
      'El dinero entra al grupo 11 y se debita. Si la venta fue a crédito, antes nace una cuenta por cobrar a clientes (1305) que se acredita cuando el cliente paga.',
    prioridad: 1,
  },
  '2': {
    simple: 'Lo que la empresa debe a otros: bancos, proveedores, empleados, la DIAN.',
    pregunta: '¿Es algo que tengo que pagar más adelante?',
    aumenta: 'credito',
    siPagas:
      'Pagar una deuda la cancela: la cuenta del pasivo (2205 proveedores, 2505 salarios, 2408 IVA…) se debita. Si al pagarle a un proveedor le retienes impuesto, lo retenido es un pasivo con la DIAN (2365) y se acredita.',
    siTePagan:
      'Si el cliente te paga antes de que entregues —un anticipo— todavía no es ingreso: nace una deuda con él (2805) que se acredita. El IVA que cobras en la venta tampoco es tuyo: se acredita en 2408.',
    prioridad: 1,
  },
  '3': {
    simple: 'Lo que es de los dueños: sus aportes y las utilidades que se han quedado en la empresa.',
    pregunta: '¿Viene de los socios o es la ganancia acumulada?',
    aumenta: 'credito',
    siPagas:
      'Cuando la empresa paga dividendos, primero se decretan (debita 3705 contra 2360) y el pago cancela el pasivo 2360. El patrimonio no se toca al pagar gastos normales: eso va a la clase 5.',
    siTePagan:
      'Si quien pone el dinero es un socio como aporte de capital, se acredita el patrimonio (3105 o 3115), no un ingreso.',
    prioridad: 2,
  },
  '4': {
    simple: 'Lo que la empresa gana: ventas, servicios prestados, intereses y otros ingresos.',
    pregunta: '¿Me pagan (o me deben) porque vendí o presté un servicio?',
    aumenta: 'credito',
    siPagas:
      'Casi nunca aparece cuando pagas. La excepción son las devoluciones en ventas (4175): si le devuelves dinero a un cliente, esa cuenta se debita.',
    siTePagan:
      'Es la clase del lado de quien cobra. Al vender o prestar el servicio se acredita la cuenta de ingreso de tu actividad (41) aunque el cliente pague después. Si el ingreso no es de tu negocio principal —intereses del banco, un arriendo ocasional— va en 42.',
    prioridad: 1,
  },
  '5': {
    simple: 'Lo que la empresa gasta para funcionar: sueldos, arriendo, servicios, honorarios, intereses.',
    pregunta: '¿Pago algo que se consume y no vuelvo a vender?',
    aumenta: 'debito',
    siPagas:
      'Es la clase del lado de quien paga. El gasto se debita (51 administración, 52 ventas, 53 financieros) y el banco o la cuenta por pagar se acredita.',
    siTePagan:
      'No se usa cuando te pagan. Solo se acredita si te reintegran un gasto o al cerrar el año contra 5905.',
    prioridad: 1,
  },
  '6': {
    simple: 'Lo que cuesta lo que vendiste: la mercancía o el servicio que entregaste al cliente.',
    pregunta: '¿Es el costo de algo que ya vendí?',
    aumenta: 'debito',
    siPagas:
      'No se debita al pagar, sino al vender: la mercancía sale del inventario (1435) y pasa al costo (61). Con inventario periódico las compras se llevan a 62 al momento de comprar.',
    siTePagan:
      'Acompaña a cada venta: mientras el ingreso (4) registra lo que cobras, el costo (6) registra lo que te costó lo vendido.',
    prioridad: 2,
  },
  '7': {
    simple: 'Lo que cuesta fabricar o prestar el servicio mientras está en proceso.',
    pregunta: '¿Es materia prima, mano de obra o gasto de la planta?',
    aumenta: 'debito',
    siPagas:
      'Si fabricas, lo que pagas por materia prima, operarios de planta o servicios de la fábrica se debita aquí en lugar de en gastos (5).',
    siTePagan: 'No interviene al cobrar. Al cerrar el mes su saldo pasa a inventarios (14) o al costo de ventas (6).',
    prioridad: 3,
  },
  '8': {
    simple: 'Anotaciones de control de derechos posibles: bienes en garantía, demandas a favor, diferencias fiscales.',
    pregunta: '¿Es un derecho que quizá se concrete, o solo quiero llevar su control?',
    aumenta: 'debito',
    siPagas: 'No intervienen: no mueven dinero ni cambian el balance. Se registran contra su contrapartida (84–86).',
    siTePagan: 'Tampoco intervienen. Se revelan en las notas a los estados financieros.',
    prioridad: 3,
  },
  '9': {
    simple: 'Anotaciones de control de obligaciones posibles: bienes recibidos de terceros, demandas en contra.',
    pregunta: '¿Es una obligación que quizá se concrete, o solo quiero llevar su control?',
    aumenta: 'credito',
    siPagas: 'No intervienen: no mueven dinero ni cambian el balance. Se registran contra su contrapartida (94–96).',
    siTePagan: 'Tampoco intervienen. Se revelan en las notas a los estados financieros.',
    prioridad: 3,
  },
}

export interface GuiaGrupo {
  /** Qué es, en palabras simples. */
  simple: string
  /** En qué caso se usa. */
  cuando: string
  /** Qué papel juega según quién paga, cuando aplica. */
  lado?: Exclude<Lado, 'interno'>
}

export const GUIA_GRUPOS: Record<string, GuiaGrupo> = {
  /* Activo */
  '11': { simple: 'El dinero disponible: caja, bancos y cuentas de ahorro.', cuando: 'En casi todo pago o cobro. Se debita cuando entra dinero y se acredita cuando sale.' },
  '12': { simple: 'Dinero puesto a rentar: acciones, CDT, bonos.', cuando: 'Cuando la empresa invierte sus excedentes en títulos o en otras sociedades.' },
  '13': { simple: 'Lo que otros le deben a la empresa.', cuando: 'Cuando vendes a crédito (1305), das un anticipo (1330), te practican una retención (1355) o le prestas a un empleado (1365).', lado: 'cobro' },
  '14': { simple: 'La mercancía y los materiales que tienes para vender o fabricar.', cuando: 'Al comprar mercancía para revenderla (1435) o materia prima para producir (1405).', lado: 'pago' },
  '15': { simple: 'Los bienes que usas para trabajar y duran más de un año: equipos, vehículos, muebles, edificios.', cuando: 'Al comprar un bien que no vas a vender sino a usar. Se deprecia con 1592.', lado: 'pago' },
  '16': { simple: 'Derechos sin forma física: marcas, patentes, licencias, software.', cuando: 'Al adquirir o desarrollar un derecho que te dará beneficios varios años.', lado: 'pago' },
  '17': { simple: 'Pagos hechos por adelantado que se van gastando: seguros, arriendos anticipados.', cuando: 'Cuando pagas hoy algo que cubre varios meses y lo vas llevando al gasto poco a poco.', lado: 'pago' },
  '18': { simple: 'Activos que no caben en los grupos anteriores: obras de arte, bienes de uso restringido.', cuando: 'Solo si el bien no encaja en ningún otro grupo del activo.' },
  '19': { simple: 'El mayor valor de un activo según un avalúo.', cuando: 'Al actualizar el valor de inversiones o inmuebles por encima de su costo. Su contrapartida es el grupo 38.' },
  /* Pasivo */
  '21': { simple: 'Préstamos de bancos y entidades financieras.', cuando: 'Al recibir un crédito se acredita; al pagar la cuota, el abono a capital se debita.' },
  '22': { simple: 'Lo que debes a los proveedores de mercancía.', cuando: 'Al comprar mercancía o materias primas a crédito. Se debita cuando les pagas.', lado: 'pago' },
  '23': { simple: 'Otras deudas: servicios, honorarios, retenciones, dividendos por pagar.', cuando: 'Cuando debes algo que no es mercancía, o cuando retienes impuestos a quien le pagas (2365, 2367, 2368).', lado: 'pago' },
  '24': { simple: 'Impuestos a cargo de la empresa: IVA, renta, industria y comercio.', cuando: 'Al causar un impuesto que se paga después. El IVA de tus ventas se acredita en 2408.' },
  '25': { simple: 'Lo que se debe a los trabajadores: salarios, cesantías, prima, vacaciones.', cuando: 'Al causar la nómina y las prestaciones. Se debita al pagarlas.', lado: 'pago' },
  '26': { simple: 'Deudas probables de valor todavía incierto.', cuando: 'Al estimar al cierre costos o gastos que se pagarán, como una demanda probable o un impuesto aún no liquidado.' },
  '27': { simple: 'Dinero cobrado por adelantado que se irá convirtiendo en ingreso.', cuando: 'Cuando te pagan hoy un servicio que prestarás durante varios meses (arriendos o intereses recibidos por anticipado).', lado: 'cobro' },
  '28': { simple: 'Otras deudas, sobre todo los anticipos que te dan los clientes.', cuando: 'Cuando un cliente te paga antes de que le entregues (2805): no es ingreso todavía.', lado: 'cobro' },
  '29': { simple: 'Deuda emitida en títulos: bonos y papeles comerciales.', cuando: 'Solo si la empresa se financia vendiendo títulos de deuda en el mercado de valores.' },
  /* Patrimonio */
  '31': { simple: 'El capital que aportaron los socios.', cuando: 'Cuando los socios ponen dinero o bienes como aporte: 3105 en sociedades por acciones, 3115 en limitadas.', lado: 'cobro' },
  '32': { simple: 'Aumentos del patrimonio que no son utilidades: prima en colocación de acciones, donaciones.', cuando: 'Cuando se venden acciones por encima de su valor nominal o la empresa recibe una donación.' },
  '33': { simple: 'Utilidades apartadas por ley o por decisión de los socios.', cuando: 'Al distribuir utilidades: la reserva legal es el 10 % de la utilidad hasta completar el 50 % del capital.' },
  '34': { simple: 'Efecto histórico de los ajustes por inflación.', cuando: 'Solo en empresas que conservan saldos del sistema de ajustes por inflación, hoy eliminado.' },
  '35': { simple: 'Dividendos que se pagarán con acciones o cuotas en vez de dinero.', cuando: 'Cuando la asamblea decreta dividendos pagaderos en acciones.' },
  '36': { simple: 'La utilidad o pérdida del año que acaba de cerrarse.', cuando: 'Al cierre, al trasladar el saldo de 5905: 3605 si hubo utilidad, 3610 si hubo pérdida.' },
  '37': { simple: 'Utilidades o pérdidas de años anteriores sin repartir.', cuando: 'Al iniciar el año se traslada aquí el resultado anterior hasta que se reparta o se enjugue.' },
  '38': { simple: 'La contrapartida patrimonial de las valorizaciones.', cuando: 'Siempre junto al grupo 19: cuando un activo se valoriza, aquí sube el patrimonio.' },
  /* Ingresos */
  '41': { simple: 'Lo que ganas con tu actividad principal: vender o prestar tu servicio.', cuando: 'Al facturar a un cliente. La cuenta depende de la actividad: 4135 comercio, 4155 consultoría y servicios empresariales, 4170 otros servicios…', lado: 'cobro' },
  '42': { simple: 'Ingresos que no vienen de tu actividad principal.', cuando: 'Intereses del banco (4210), arrendar algo que no es tu negocio (4220), vender un activo con utilidad (4245), recuperaciones (4250).', lado: 'cobro' },
  '47': { simple: 'Efecto histórico de los ajustes por inflación en resultados.', cuando: 'Solo por saldos del sistema de ajustes por inflación, hoy eliminado.' },
  /* Gastos */
  '51': { simple: 'Gastos de administrar la empresa: personal de oficina, arriendo, honorarios, servicios públicos.', cuando: 'Cuando pagas o causas un gasto del área administrativa.', lado: 'pago' },
  '52': { simple: 'Los mismos gastos, pero del área comercial: vendedores, publicidad, fletes de entrega.', cuando: 'Cuando el gasto es para vender o distribuir. Mismas cuentas que 51, con 52 delante.', lado: 'pago' },
  '53': { simple: 'Gastos ajenos a la operación: intereses, comisiones bancarias, pérdidas en ventas de activos.', cuando: 'Cuando pagas intereses de un crédito (5305) o registras una pérdida extraordinaria.', lado: 'pago' },
  '54': { simple: 'El impuesto de renta del año.', cuando: 'Al cierre, al calcular el impuesto de renta a cargo.', lado: 'pago' },
  '59': { simple: 'La cuenta donde se cierran ingresos, costos y gastos para ver si hubo utilidad.', cuando: 'Solo al cierre del ejercicio.' },
  /* Costos de ventas */
  '61': { simple: 'El costo de lo que vendiste, por actividad económica.', cuando: 'Al vender, por el costo de la mercancía o del servicio entregado (6135 en comercio).' },
  '62': { simple: 'Las compras del periodo cuando se usa inventario periódico.', cuando: 'Solo si no llevas kardex permanente: las compras van aquí y el inventario se ajusta al cierre.', lado: 'pago' },
  /* Costos de producción */
  '71': { simple: 'Los materiales que se transforman en el producto.', cuando: 'Al consumir materia prima en la producción.' },
  '72': { simple: 'El salario de quienes transforman el producto.', cuando: 'Al causar la nómina de los operarios de producción.', lado: 'pago' },
  '73': { simple: 'Costos de la planta que no se ligan a un producto: energía de la fábrica, mantenimiento, supervisores.', cuando: 'Al causar costos de producción que se reparten entre todos los productos.', lado: 'pago' },
  '74': { simple: 'Costos de ejecutar contratos de servicios.', cuando: 'En empresas de servicios que acumulan el costo de cada contrato antes de facturarlo.' },
  /* Cuentas de orden */
  '81': { simple: 'Derechos que podrían llegar a ser tuyos.', cuando: 'Bienes entregados en garantía o en custodia, demandas a tu favor.' },
  '82': { simple: 'Diferencias entre tu contabilidad y tu declaración de renta, del lado deudor.', cuando: 'Para conciliar cifras contables y fiscales.' },
  '83': { simple: 'Controles internos de activos.', cuando: 'Activos totalmente depreciados que aún usas, bienes recibidos en leasing, títulos no colocados.' },
  '84': { simple: 'Contrapartida de las cuentas del grupo 81.', cuando: 'Siempre junto al 81, en la columna contraria.' },
  '85': { simple: 'Contrapartida de las cuentas del grupo 82.', cuando: 'Siempre junto al 82, en la columna contraria.' },
  '86': { simple: 'Contrapartida de las cuentas del grupo 83.', cuando: 'Siempre junto al 83, en la columna contraria.' },
  '91': { simple: 'Obligaciones que podrían llegar a ser tuyas.', cuando: 'Bienes de terceros que tienes en custodia o en garantía, demandas en tu contra.' },
  '92': { simple: 'Diferencias entre tu contabilidad y tu declaración de renta, del lado acreedor.', cuando: 'Para conciliar cifras contables y fiscales.' },
  '93': { simple: 'Controles internos de pasivos y patrimonio.', cuando: 'Contratos de leasing, documentos descontados, convenios de pago.' },
  '94': { simple: 'Contrapartida de las cuentas del grupo 91.', cuando: 'Siempre junto al 91, en la columna contraria.' },
  '95': { simple: 'Contrapartida de las cuentas del grupo 92.', cuando: 'Siempre junto al 92, en la columna contraria.' },
  '96': { simple: 'Contrapartida de las cuentas del grupo 93.', cuando: 'Siempre junto al 93, en la columna contraria.' },
}

/** La regla que resuelve «¿qué clase uso?» según quién paga. */
export const REGLA_LADO: Record<Lado, { titulo: string; corto: string; regla: string; debito: string; credito: string }> = {
  pago: {
    titulo: 'Yo pago',
    corto: 'Sale dinero',
    regla: 'Sale dinero de la empresa. El disponible (11) va al crédito; al débito va lo que recibes a cambio o la deuda que cancelas.',
    debito: 'Un gasto (5), un costo (6–7), un activo que dura (14, 15, 17) o un pasivo que cancelas (2).',
    credito: 'Caja o bancos (11). Si todavía no pagas, la deuda (22, 23, 25). Las retenciones que practicas (2365).',
  },
  cobro: {
    titulo: 'Me pagan',
    corto: 'Entra dinero',
    regla: 'Entra dinero a la empresa. El disponible (11) va al débito; al crédito va el motivo por el que te pagan.',
    debito: 'Caja o bancos (11). Si te pagan después, la cuenta por cobrar (1305). Las retenciones que te practican (1355).',
    credito: 'Un ingreso (4) si vendes o prestas un servicio, la cuenta por cobrar que se cancela (13), un anticipo o préstamo recibido (2) o un aporte de socios (3).',
  },
  interno: {
    titulo: 'Sin pago',
    corto: 'No se mueve dinero',
    regla: 'No entra ni sale dinero: es una causación, un ajuste o un traslado entre cuentas.',
    debito: 'Depende de la operación: lo que aumenta de naturaleza débito o lo que disminuye de naturaleza crédito.',
    credito: 'Lo contrario: lo que aumenta de naturaleza crédito o lo que disminuye de naturaleza débito.',
  },
}

/** Qué es cada pieza del código y cada término que aparece en la aplicación. */
export const TERMINOS: { termino: string; explicacion: string }[] = [
  { termino: 'Clase', explicacion: 'El primer dígito. Dice qué es la cuenta: 1 activo, 2 pasivo, 3 patrimonio, 4 ingresos, 5 gastos, 6 costos de ventas, 7 costos de producción, 8 y 9 cuentas de orden.' },
  { termino: 'Grupo', explicacion: 'Los dos primeros dígitos. Divide la clase por tipo: dentro del activo, 11 es el dinero disponible y 13 lo que te deben.' },
  { termino: 'Cuenta', explicacion: 'Los cuatro primeros dígitos. Es el nivel en el que se registra de verdad: 1105 caja, 1110 bancos.' },
  { termino: 'Subcuenta', explicacion: 'Los seis primeros dígitos. Detalla la cuenta: 110505 caja general, 110510 cajas menores.' },
  { termino: 'Auxiliar', explicacion: 'Siete dígitos o más. Lo define cada empresa para su propio detalle, por ejemplo un banco concreto.' },
  { termino: 'Naturaleza', explicacion: 'La columna por la que la cuenta aumenta. Las de naturaleza débito suben con débitos (activos, gastos, costos); las de naturaleza crédito, con créditos (pasivos, patrimonio, ingresos).' },
  { termino: 'Débito (debe)', explicacion: 'La columna izquierda del asiento. Aumenta activos, gastos y costos; disminuye pasivos, patrimonio e ingresos.' },
  { termino: 'Crédito (haber)', explicacion: 'La columna derecha. Aumenta pasivos, patrimonio e ingresos; disminuye activos, gastos y costos.' },
  { termino: 'Partida doble', explicacion: 'Todo asiento tiene al menos un débito y un crédito, y las dos columnas suman lo mismo.' },
  { termino: 'Dinámica', explicacion: 'La lista oficial de motivos por los que una cuenta se debita o se acredita.' },
  { termino: 'Causación', explicacion: 'Registrar el ingreso o el gasto cuando nace el derecho a cobrarlo o la obligación de pagarlo, aunque el dinero se mueva después.' },
  { termino: '(DB) y (CR)', explicacion: 'Marcan una cuenta con naturaleza contraria a su clase, como la depreciación acumulada (1592) dentro del activo: resta en vez de sumar.' },
]
