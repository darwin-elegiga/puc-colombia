/**
 * Ejercicios para entrenar el debe y el haber.
 *
 * Cada ejercicio plantea una operación y una lista de renglones sueltos; quien
 * practica decide en qué columna va cada uno y, a partir del nivel 3, con qué
 * cuenta del PUC se registra.
 *
 * La dificultad sube en cinco escalones: primero dos renglones y lenguaje
 * corriente, después asientos de tres o más renglones, luego el código de cuatro
 * dígitos elegido de un banco de opciones, después la subcuenta de seis, y al
 * final la cuenta se busca en el catálogo completo, sin opciones.
 *
 * Los importes están en pesos y se escriben sin puntos: el formato lo pone la
 * interfaz. Todas las cuentas citadas existen en data/puc.json y las sumas del
 * debe y del haber coinciden — las pruebas lo verifican.
 */

export type Columna = 'debe' | 'haber'

/** Qué se pide resolver en cada renglón. */
export type Pide = 'columna' | 'cuenta'

export interface Renglon {
  /** El hecho suelto que hay que ubicar, redactado sin nombrar la columna. */
  concepto: string
  columna: Columna
  importe: number
  /** Cuenta del PUC con la que se registra. En los niveles 1 y 2 solo se revela al corregir. */
  codigo: string
}

export interface Ejercicio {
  id: string
  nivel: 1 | 2 | 3 | 4 | 5
  titulo: string
  enunciado: string
  pide: Pide
  /** Cuentas entre las que elegir. Si falta, se busca en todo el catálogo. */
  banco?: string[]
  renglones: Renglon[]
  explicacion: string
  nota?: string
}

export interface Nivel {
  numero: 1 | 2 | 3 | 4 | 5
  titulo: string
  resumen: string
}

export const NIVELES: Nivel[] = [
  {
    numero: 1,
    titulo: 'La partida doble',
    resumen: 'Dos renglones por operación. Solo decides la columna.',
  },
  {
    numero: 2,
    titulo: 'Asientos de tres renglones o más',
    resumen: 'Impuestos, retenciones y pagos parciales. Sigues decidiendo solo la columna.',
  },
  {
    numero: 3,
    titulo: 'Entra el PUC',
    resumen: 'Además de la columna, eliges la cuenta de cuatro dígitos entre varias opciones.',
  },
  {
    numero: 4,
    titulo: 'Hasta la subcuenta',
    resumen: 'Seis dígitos y opciones que se parecen entre sí.',
  },
  {
    numero: 5,
    titulo: 'Sin opciones',
    resumen: 'La cuenta la buscas en el catálogo completo, como en el trabajo real.',
  },
]

export const EJERCICIOS: Ejercicio[] = [
  /* ═══════════════ Nivel 1 · La partida doble ═══════════════ */
  {
    id: 'aporte-inicial',
    nivel: 1,
    titulo: 'Abres el negocio',
    enunciado:
      'Constituyes una distribuidora de papelería y depositas $10.000.000 de tu aporte en la cuenta bancaria del negocio.',
    pide: 'columna',
    renglones: [
      { concepto: 'El dinero que entra a la cuenta bancaria', columna: 'debe', importe: 10000000, codigo: '1110' },
      { concepto: 'El aporte del socio: lo que el negocio le debe a su dueño', columna: 'haber', importe: 10000000, codigo: '3115' },
    ],
    explicacion:
      'El banco es un activo y aumenta, así que va al debe. El aporte aumenta el patrimonio, y el patrimonio crece por el haber. El negocio y su dueño son dos personas distintas: el dinero es del negocio y el aporte es la deuda que tiene con quien lo puso.',
    nota: 'El asiento cuadra cuando la suma del debe es igual a la del haber. Aquí, 10.000.000 contra 10.000.000.',
  },
  {
    id: 'venta-contado',
    nivel: 1,
    titulo: 'Vendes de contado',
    enunciado: 'Vendes mercancía por $500.000 y el cliente te paga en efectivo.',
    pide: 'columna',
    renglones: [
      { concepto: 'El efectivo que entra a la caja', columna: 'debe', importe: 500000, codigo: '1105' },
      { concepto: 'El ingreso que nace con la venta', columna: 'haber', importe: 500000, codigo: '4135' },
    ],
    explicacion:
      'La caja es un activo que aumenta: debe. El ingreso aumenta y los ingresos crecen por el haber, igual que el patrimonio, porque al final del ejercicio pasan a formar la utilidad.',
  },
  {
    id: 'consignacion',
    nivel: 1,
    titulo: 'Consignas la caja',
    enunciado: 'Llevas al banco $400.000 del efectivo recaudado en la caja.',
    pide: 'columna',
    renglones: [
      { concepto: 'Aumenta el saldo de la cuenta bancaria', columna: 'debe', importe: 400000, codigo: '1110' },
      { concepto: 'Disminuye el efectivo que había en la caja', columna: 'haber', importe: 400000, codigo: '1105' },
    ],
    explicacion:
      'Los dos renglones son activos: no hay ingreso ni gasto, el dinero solo cambia de sitio. El activo que aumenta va al debe y el que disminuye va al haber.',
    nota: 'Fíjate en que un activo también puede ir al haber. Lo que manda no es la clase de cuenta, sino si el saldo sube o baja.',
  },
  {
    id: 'pago-arriendo',
    nivel: 1,
    titulo: 'Pagas el arriendo',
    enunciado: 'Pagas por transferencia los $1.200.000 del arriendo del local de este mes.',
    pide: 'columna',
    renglones: [
      { concepto: 'El arriendo del mes, que es un gasto del negocio', columna: 'debe', importe: 1200000, codigo: '5120' },
      { concepto: 'El dinero que sale de la cuenta bancaria', columna: 'haber', importe: 1200000, codigo: '1110' },
    ],
    explicacion:
      'Los gastos aumentan por el debe: consumen patrimonio, así que se registran al contrario que los ingresos. El banco disminuye y por eso va al haber.',
  },
  {
    id: 'compra-mercancia',
    nivel: 1,
    titulo: 'Compras mercancía',
    enunciado: 'Compras mercancía para revender por $2.000.000 y pagas de contado desde el banco.',
    pide: 'columna',
    renglones: [
      { concepto: 'La mercancía que entra a la bodega', columna: 'debe', importe: 2000000, codigo: '1435' },
      { concepto: 'El dinero que sale de la cuenta bancaria', columna: 'haber', importe: 2000000, codigo: '1110' },
    ],
    explicacion:
      'Comprar mercancía no es un gasto: es cambiar dinero por inventario, y el inventario es un activo. Se volverá gasto —costo de ventas— solo cuando la vendas.',
  },
  {
    id: 'venta-credito',
    nivel: 1,
    titulo: 'Vendes a crédito',
    enunciado: 'Vendes $800.000 en mercancía a un cliente que pagará dentro de 30 días.',
    pide: 'columna',
    renglones: [
      { concepto: 'El derecho de cobro que queda a tu favor', columna: 'debe', importe: 800000, codigo: '1305' },
      { concepto: 'El ingreso que nace con la venta', columna: 'haber', importe: 800000, codigo: '4135' },
    ],
    explicacion:
      'El ingreso se registra cuando entregas la mercancía, no cuando te pagan. En vez de dinero entra una cuenta por cobrar, que también es un activo y por eso va al debe.',
  },
  {
    id: 'recaudo-cartera',
    nivel: 1,
    titulo: 'El cliente te paga',
    enunciado: 'Treinta días después, el cliente consigna los $800.000 que debía.',
    pide: 'columna',
    renglones: [
      { concepto: 'El dinero que entra a la cuenta bancaria', columna: 'debe', importe: 800000, codigo: '1110' },
      { concepto: 'El derecho de cobro que desaparece', columna: 'haber', importe: 800000, codigo: '1305' },
    ],
    explicacion:
      'Aquí no vuelve a haber ingreso: ya se registró al facturar. Solo cambia un activo por otro, y la cuenta por cobrar se cancela por el haber.',
  },
  {
    id: 'prestamo-bancario',
    nivel: 1,
    titulo: 'Te desembolsan un crédito',
    enunciado: 'El banco te aprueba un crédito de $5.000.000 y lo abona a tu cuenta.',
    pide: 'columna',
    renglones: [
      { concepto: 'El dinero que entra a la cuenta bancaria', columna: 'debe', importe: 5000000, codigo: '1110' },
      { concepto: 'La deuda que ahora tienes con el banco', columna: 'haber', importe: 5000000, codigo: '2105' },
    ],
    explicacion:
      'Los pasivos aumentan por el haber. Recibir un crédito no es un ingreso: no te hace más rico, te deja con dinero y con una deuda del mismo tamaño.',
  },

  /* ═══════════════ Nivel 2 · Tres renglones o más ═══════════════ */
  {
    id: 'venta-con-iva',
    nivel: 2,
    titulo: 'Venta de contado con IVA',
    enunciado:
      'Vendes mercancía por $1.000.000 más IVA del 19%. El cliente paga en efectivo el total de la factura: $1.190.000.',
    pide: 'columna',
    renglones: [
      { concepto: 'El efectivo total que recibes del cliente', columna: 'debe', importe: 1190000, codigo: '1105' },
      { concepto: 'El ingreso por la venta, sin el impuesto', columna: 'haber', importe: 1000000, codigo: '4135' },
      { concepto: 'El IVA que cobraste y le tendrás que entregar a la DIAN', columna: 'haber', importe: 190000, codigo: '2408' },
    ],
    explicacion:
      'El IVA no es tuyo: lo cobras por cuenta del Estado, así que es un pasivo y aumenta por el haber. Tu ingreso son solo los 1.000.000; los 190.000 están de paso.',
    nota: 'Un renglón al debe puede responder a dos al haber. Lo único obligatorio es que las dos sumas coincidan.',
  },
  {
    id: 'compra-con-iva',
    nivel: 2,
    titulo: 'Compra de contado con IVA',
    enunciado:
      'Compras mercancía por $2.000.000 más IVA del 19%. Pagas los $2.380.000 desde la cuenta bancaria.',
    pide: 'columna',
    renglones: [
      { concepto: 'La mercancía que entra a la bodega', columna: 'debe', importe: 2000000, codigo: '1435' },
      { concepto: 'El IVA de la compra, que podrás descontar del que cobras', columna: 'debe', importe: 380000, codigo: '2408' },
      { concepto: 'El dinero que sale de la cuenta bancaria', columna: 'haber', importe: 2380000, codigo: '1110' },
    ],
    explicacion:
      'El IVA que pagas al comprar se resta del que cobras al vender, así que reduce la deuda con la DIAN y por eso va al debe. Es la misma cuenta 2408, pero por el lado contrario a su naturaleza.',
    nota: 'Que una cuenta sea de naturaleza crédito no significa que nunca se debite: significa que su saldo normal está en el haber.',
  },
  {
    id: 'venta-con-costo',
    nivel: 2,
    titulo: 'La venta y su costo',
    enunciado:
      'Vendes de contado mercancía por $1.500.000. Esa mercancía te había costado $900.000 y llevas inventario permanente, así que la operación exige registrar las dos caras.',
    pide: 'columna',
    renglones: [
      { concepto: 'El efectivo que recibes del cliente', columna: 'debe', importe: 1500000, codigo: '1105' },
      { concepto: 'El ingreso por la venta', columna: 'haber', importe: 1500000, codigo: '4135' },
      { concepto: 'El costo de la mercancía que entregaste', columna: 'debe', importe: 900000, codigo: '6135' },
      { concepto: 'La mercancía que sale de la bodega', columna: 'haber', importe: 900000, codigo: '1435' },
    ],
    explicacion:
      'Son dos asientos en uno: el de la venta y el del costo. Al vender, el inventario deja de ser un activo y se convierte en costo, que es un gasto y por eso va al debe. La diferencia entre 1.500.000 y 900.000 es la utilidad bruta.',
  },
  {
    id: 'pago-nomina',
    nivel: 2,
    titulo: 'Pagas la nómina',
    enunciado:
      'El sueldo del mes de tu única empleada es $3.000.000. Le descuentas 4% de salud y 4% de pensión —$240.000 en total— y le consignas el neto de $2.760.000.',
    pide: 'columna',
    renglones: [
      { concepto: 'El sueldo del mes, que es un gasto de personal', columna: 'debe', importe: 3000000, codigo: '5105' },
      { concepto: 'Lo descontado a la empleada, que debes girar a salud y pensión', columna: 'haber', importe: 240000, codigo: '2370' },
      { concepto: 'El neto que sale de la cuenta bancaria', columna: 'haber', importe: 2760000, codigo: '1110' },
    ],
    explicacion:
      'El gasto es el sueldo completo, no lo que le consignas. Lo descontado no se lo quedas: queda como pasivo hasta que lo gires a la EPS y al fondo de pensiones.',
  },
  {
    id: 'honorarios-retencion',
    nivel: 2,
    titulo: 'Pagas honorarios y retienes',
    enunciado:
      'Un contador te factura $2.000.000 de honorarios. Como eres agente retenedor, le retienes el 11% —$220.000— y le transfieres $1.780.000.',
    pide: 'columna',
    renglones: [
      { concepto: 'Los honorarios del contador, que son un gasto', columna: 'debe', importe: 2000000, codigo: '5110' },
      { concepto: 'La retención que le practicas y le debes a la DIAN', columna: 'haber', importe: 220000, codigo: '2365' },
      { concepto: 'El neto que sale de la cuenta bancaria', columna: 'haber', importe: 1780000, codigo: '1110' },
    ],
    explicacion:
      'Retener es cobrar un impuesto por cuenta del Estado: el dinero no sale de tu bolsillo ni del contador dos veces, simplemente una parte de su pago va a la DIAN a través de ti. Mientras no la gires es un pasivo.',
  },
  {
    id: 'compra-vehiculo',
    nivel: 2,
    titulo: 'Compras una camioneta',
    enunciado:
      'Compras una camioneta para el reparto por $60.000.000. Das $20.000.000 de cuota inicial desde el banco y financias los $40.000.000 restantes con un crédito.',
    pide: 'columna',
    renglones: [
      { concepto: 'La camioneta que entra al patrimonio del negocio', columna: 'debe', importe: 60000000, codigo: '1540' },
      { concepto: 'La cuota inicial que sale de la cuenta bancaria', columna: 'haber', importe: 20000000, codigo: '1110' },
      { concepto: 'La deuda que queda con la entidad financiera', columna: 'haber', importe: 40000000, codigo: '2105' },
    ],
    explicacion:
      'El activo entra por su valor completo, sin importar cómo lo pagues. La forma de pago solo decide qué va al haber: parte dinero y parte deuda.',
  },
  {
    id: 'venta-credito-retencion',
    nivel: 2,
    titulo: 'Te retienen en una venta',
    enunciado:
      'Vendes a crédito por $5.000.000 más IVA de $950.000. Tu cliente es agente retenedor y te practica el 2,5% de retención en la fuente: $125.000. Queda debiéndote $5.825.000.',
    pide: 'columna',
    renglones: [
      { concepto: 'Lo que el cliente queda debiendo', columna: 'debe', importe: 5825000, codigo: '1305' },
      { concepto: 'La retención que te practicaron, un anticipo de tu impuesto de renta', columna: 'debe', importe: 125000, codigo: '1355' },
      { concepto: 'El ingreso por la venta', columna: 'haber', importe: 5000000, codigo: '4135' },
      { concepto: 'El IVA que cobraste', columna: 'haber', importe: 950000, codigo: '2408' },
    ],
    explicacion:
      'Cuando te retienen, esos 125.000 no se pierden: son un anticipo del impuesto de renta que descontarás en la declaración. Por eso son un activo y van al debe, no un gasto.',
    nota: 'Practicar una retención genera un pasivo; que te la practiquen genera un activo. Es la misma operación vista desde los dos lados.',
  },

  /* ═══════════════ Nivel 3 · Entra el PUC ═══════════════ */
  {
    id: 'puc-venta-contado',
    nivel: 3,
    titulo: 'Venta de contado con IVA',
    enunciado:
      'Vendes mercancía por $1.000.000 más IVA del 19% y el cliente paga en efectivo. Ubica cada renglón y elige con qué cuenta se registra.',
    pide: 'cuenta',
    banco: ['1105', '1110', '1305', '2205', '2408', '4135', '4175', '5135'],
    renglones: [
      { concepto: 'El efectivo total que recibes', columna: 'debe', importe: 1190000, codigo: '1105' },
      { concepto: 'El ingreso por la venta de mercancía', columna: 'haber', importe: 1000000, codigo: '4135' },
      { concepto: 'El IVA que cobraste', columna: 'haber', importe: 190000, codigo: '2408' },
    ],
    explicacion:
      'El primer dígito ya te orienta: 1 es activo, 2 pasivo, 4 ingreso. La venta de una distribuidora es comercio al por mayor y al por menor, la cuenta 4135. El IVA por pagar siempre es 2408.',
    nota: 'Si dudas entre 1105 y 1110, mira cómo te pagaron: 1105 es caja, dinero en la mano; 1110 es banco.',
  },
  {
    id: 'puc-consignacion',
    nivel: 3,
    titulo: 'Traslado de caja a banco',
    enunciado: 'Consignas $400.000 del efectivo de la caja en la cuenta corriente del negocio.',
    pide: 'cuenta',
    banco: ['1105', '1110', '1120', '1305', '2105', '2205'],
    renglones: [
      { concepto: 'Aumenta el saldo de la cuenta corriente', columna: 'debe', importe: 400000, codigo: '1110' },
      { concepto: 'Disminuye el efectivo en poder del negocio', columna: 'haber', importe: 400000, codigo: '1105' },
    ],
    explicacion:
      'Las dos cuentas están en el grupo 11, el disponible. 1110 es bancos —cuenta corriente y de ahorro empresarial— y 1105 es caja. La cuenta 1120 se reserva para cuentas de ahorro.',
  },
  {
    id: 'puc-servicios-publicos',
    nivel: 3,
    titulo: 'Pagas el recibo de la luz',
    enunciado: 'Pagas desde el banco $350.000 del recibo de energía del local.',
    pide: 'cuenta',
    banco: ['1110', '2335', '5115', '5120', '5135', '5195'],
    renglones: [
      { concepto: 'El consumo de energía del mes', columna: 'debe', importe: 350000, codigo: '5135' },
      { concepto: 'El dinero que sale del banco', columna: 'haber', importe: 350000, codigo: '1110' },
    ],
    explicacion:
      'Los servicios públicos son la cuenta 5135 dentro de los gastos de administración. No los confundas con 5115, que son impuestos, ni con 5195 diversos, que es el cajón de sastre al que solo se recurre cuando no hay una cuenta específica.',
  },
  {
    id: 'puc-compra-credito',
    nivel: 3,
    titulo: 'Compra a crédito con el proveedor',
    enunciado:
      'Compras mercancía por $4.000.000 más IVA de $760.000. El proveedor te da 30 días para pagar.',
    pide: 'cuenta',
    banco: ['1435', '1455', '2205', '2305', '2408', '6205'],
    renglones: [
      { concepto: 'La mercancía que entra a la bodega', columna: 'debe', importe: 4000000, codigo: '1435' },
      { concepto: 'El IVA de la compra, que descontarás del que cobras', columna: 'debe', importe: 760000, codigo: '2408' },
      { concepto: 'La deuda con el proveedor', columna: 'haber', importe: 4760000, codigo: '2205' },
    ],
    explicacion:
      'La mercancía para revender es 1435, mercancías no fabricadas por la empresa. La deuda con quien te surte es 2205 proveedores nacionales, distinta de 2305 cuentas por pagar, que se usa para deudas ajenas al giro del negocio.',
  },
  {
    id: 'puc-recaudo',
    nivel: 3,
    titulo: 'Cobras una factura',
    enunciado: 'Un cliente te consigna $2.300.000 de una factura pendiente.',
    pide: 'cuenta',
    banco: ['1105', '1110', '1305', '1330', '1355', '4135'],
    renglones: [
      { concepto: 'El dinero que entra al banco', columna: 'debe', importe: 2300000, codigo: '1110' },
      { concepto: 'El derecho de cobro que se cancela', columna: 'haber', importe: 2300000, codigo: '1305' },
    ],
    explicacion:
      'La tentación es registrar un ingreso en 4135, pero el ingreso ya se registró al facturar. Cobrar solo cambia una cuenta por cobrar 1305 por dinero en 1110.',
  },
  {
    id: 'puc-arriendo',
    nivel: 3,
    titulo: 'Arriendo del local',
    enunciado: 'Pagas por transferencia $1.200.000 del arriendo del mes.',
    pide: 'cuenta',
    banco: ['1110', '1705', '2335', '5115', '5120', '5130'],
    renglones: [
      { concepto: 'El arriendo del mes en curso', columna: 'debe', importe: 1200000, codigo: '5120' },
      { concepto: 'El dinero que sale del banco', columna: 'haber', importe: 1200000, codigo: '1110' },
    ],
    explicacion:
      'El arriendo del mes que ya transcurrió es gasto: 5120. Si pagaras por adelantado varios meses, la parte no consumida iría a 1705 gastos pagados por anticipado, que es un activo.',
  },
  {
    id: 'puc-prestamo',
    nivel: 3,
    titulo: 'Desembolso de un crédito',
    enunciado: 'El banco te desembolsa $5.000.000 de un crédito de libre inversión.',
    pide: 'cuenta',
    banco: ['1110', '2105', '2195', '2380', '4210', '5305'],
    renglones: [
      { concepto: 'El dinero que entra al banco', columna: 'debe', importe: 5000000, codigo: '1110' },
      { concepto: 'La obligación con la entidad financiera', columna: 'haber', importe: 5000000, codigo: '2105' },
    ],
    explicacion:
      'Las deudas con bancos del país van a 2105, dentro del grupo 21 obligaciones financieras. 2380 acreedores varios es para deudas que no encajan en ninguna otra cuenta, y 4210 son ingresos financieros: aquí no hay ningún ingreso.',
  },
  {
    id: 'puc-aportes',
    nivel: 3,
    titulo: 'Aporte de los socios',
    enunciado:
      'Los dos socios de una sociedad limitada aportan $30.000.000 en total, que quedan en la cuenta bancaria de la empresa.',
    pide: 'cuenta',
    banco: ['1110', '2355', '3105', '3115', '3130', '3605'],
    renglones: [
      { concepto: 'El dinero que entra a la cuenta de la empresa', columna: 'debe', importe: 30000000, codigo: '1110' },
      { concepto: 'El capital aportado por los socios', columna: 'haber', importe: 30000000, codigo: '3115' },
    ],
    explicacion:
      'En una sociedad limitada el capital son cuotas o partes de interés y va a 3115 aportes sociales. La cuenta 3105 capital suscrito y pagado se reserva para las sociedades por acciones, y 3130 para el negocio de una persona natural.',
    nota: 'No lo confundas con 2355 deudas con socios: eso es un préstamo que el socio le hace a la empresa y hay que devolverle, no un aporte de capital.',
  },

  /* ═══════════════ Nivel 4 · Hasta la subcuenta ═══════════════ */
  {
    id: 'sub-consignacion',
    nivel: 4,
    titulo: 'Consignación, a seis dígitos',
    enunciado:
      'Consignas $600.000 de la caja general en la cuenta corriente en pesos. Ahora la cuenta se identifica hasta la subcuenta.',
    pide: 'cuenta',
    banco: ['110505', '110510', '110515', '111005', '111010', '112005'],
    renglones: [
      { concepto: 'Aumenta el saldo de la cuenta corriente en pesos', columna: 'debe', importe: 600000, codigo: '111005' },
      { concepto: 'Sale el efectivo de la caja principal del negocio', columna: 'haber', importe: 600000, codigo: '110505' },
    ],
    explicacion:
      'Los dos últimos dígitos afinan el detalle: 110505 es la caja general y 110510 las cajas menores; 111005 es moneda nacional y 111010 moneda extranjera.',
  },
  {
    id: 'sub-caja-menor',
    nivel: 4,
    titulo: 'Constituyes la caja menor',
    enunciado:
      'Retiras $500.000 del banco para dejar un fondo fijo con el que se pagan los gastos pequeños del local.',
    pide: 'cuenta',
    banco: ['110505', '110510', '111005', '112005', '133015', '5195'],
    renglones: [
      { concepto: 'El fondo fijo que queda a cargo de quien lo administra', columna: 'debe', importe: 500000, codigo: '110510' },
      { concepto: 'El dinero que sale de la cuenta corriente', columna: 'haber', importe: 500000, codigo: '111005' },
    ],
    explicacion:
      'Constituir la caja menor no es un gasto: el dinero sigue siendo del negocio, solo cambia de sitio. El gasto aparece después, cuando se legaliza el reembolso con las facturas.',
  },
  {
    id: 'sub-servicios',
    nivel: 4,
    titulo: 'Dos recibos en un solo pago',
    enunciado:
      'Pagas desde el banco los servicios del local: $350.000 de energía y $90.000 de teléfono, en una sola transferencia de $440.000.',
    pide: 'cuenta',
    banco: ['111005', '513505', '513525', '513530', '513535', '513540'],
    renglones: [
      { concepto: 'El consumo de energía del mes', columna: 'debe', importe: 350000, codigo: '513530' },
      { concepto: 'El servicio telefónico del mes', columna: 'debe', importe: 90000, codigo: '513535' },
      { concepto: 'El dinero que sale de la cuenta corriente', columna: 'haber', importe: 440000, codigo: '111005' },
    ],
    explicacion:
      'Todos los servicios cuelgan de 5135, pero cada uno tiene su subcuenta: 513525 acueducto, 513530 energía, 513535 teléfono. Separarlos es lo que después te deja comparar consumos mes a mes.',
  },
  {
    id: 'sub-nomina',
    nivel: 4,
    titulo: 'Nómina con descuentos',
    enunciado:
      'El sueldo del mes es $2.400.000. Descuentas $96.000 del aporte a salud y $200.000 de una libranza que la empleada tiene con el fondo de empleados. Le consignas $2.104.000.',
    pide: 'cuenta',
    banco: ['111005', '2505', '237005', '237010', '237030', '510506', '510515', '510527'],
    renglones: [
      { concepto: 'El sueldo del mes', columna: 'debe', importe: 2400000, codigo: '510506' },
      { concepto: 'El aporte a salud descontado, que debes girar a la EPS', columna: 'haber', importe: 96000, codigo: '237005' },
      { concepto: 'El descuento de la libranza, que debes girar al fondo', columna: 'haber', importe: 200000, codigo: '237030' },
      { concepto: 'El neto que sale de la cuenta corriente', columna: 'haber', importe: 2104000, codigo: '111005' },
    ],
    explicacion:
      'Todo lo que le descuentas al trabajador queda en 2370 retenciones y aportes de nómina, con una subcuenta por concepto. El gasto es el sueldo completo: 510506.',
    nota: 'La cuenta 2505 salarios por pagar se usa cuando causas la nómina y todavía no la has pagado. Aquí el pago es inmediato, así que el neto sale directo del banco.',
  },
  {
    id: 'sub-retencion-compra',
    nivel: 4,
    titulo: 'Compras y practicas retención',
    enunciado:
      'Compras mercancía por $3.000.000 más IVA de $570.000. Le practicas al proveedor el 2,5% de retención por compras —$75.000— y le pagas $3.495.000 desde el banco.',
    pide: 'cuenta',
    banco: ['111005', '133005', '1435', '2408', '236515', '236525', '236540'],
    renglones: [
      { concepto: 'La mercancía que entra a la bodega', columna: 'debe', importe: 3000000, codigo: '1435' },
      { concepto: 'El IVA de la compra, que descontarás del que cobras', columna: 'debe', importe: 570000, codigo: '2408' },
      { concepto: 'La retención practicada al proveedor', columna: 'haber', importe: 75000, codigo: '236540' },
      { concepto: 'El neto que sale de la cuenta corriente', columna: 'haber', importe: 3495000, codigo: '111005' },
    ],
    explicacion:
      'La retención se clasifica por el concepto que la origina: 236540 compras, 236515 honorarios, 236525 servicios. Elegir mal la subcuenta no descuadra el asiento, pero sí daña el reporte que después le presentas a la DIAN.',
  },
  {
    id: 'sub-depreciacion',
    nivel: 4,
    titulo: 'Depreciación del mes',
    enunciado:
      'La camioneta costó $60.000.000 y se deprecia en cinco años por línea recta. Registras la depreciación de un mes: $1.000.000.',
    pide: 'cuenta',
    banco: ['154005', '159205', '159220', '159235', '5160', '5165'],
    renglones: [
      { concepto: 'El desgaste del vehículo imputado a este mes', columna: 'debe', importe: 1000000, codigo: '5160' },
      { concepto: 'El desgaste acumulado que se resta del valor del vehículo', columna: 'haber', importe: 1000000, codigo: '159235' },
    ],
    explicacion:
      'La depreciación no toca el banco: no sale dinero. El gasto va a 5160 y la contrapartida a 1592, una cuenta de activo con naturaleza crédito que resta del costo del bien. El vehículo sigue registrado por sus 60.000.000.',
    nota: 'Por eso 1592 aparece marcada como crédito aunque esté en la clase 1: es una cuenta correctora, va restando.',
  },
  {
    id: 'sub-anticipo',
    nivel: 4,
    titulo: 'Anticipo a un proveedor',
    enunciado:
      'Le giras $1.500.000 a un proveedor para que despache un pedido que todavía no ha llegado.',
    pide: 'cuenta',
    banco: ['110505', '111005', '133005', '133010', '1435', '2205'],
    renglones: [
      { concepto: 'El derecho a recibir la mercancía que pagaste por adelantado', columna: 'debe', importe: 1500000, codigo: '133005' },
      { concepto: 'El dinero que sale de la cuenta corriente', columna: 'haber', importe: 1500000, codigo: '111005' },
    ],
    explicacion:
      'Mientras la mercancía no llegue no puedes cargarla a inventario: lo que tienes es un derecho, y va a 133005 anticipos a proveedores. Cuando llegue el pedido, ese anticipo se cruza contra 1435.',
  },
  {
    id: 'sub-devolucion',
    nivel: 4,
    titulo: 'Un cliente devuelve mercancía',
    enunciado:
      'Un cliente devuelve mercancía que había comprado de contado por $300.000 más IVA de $57.000. Le devuelves los $357.000 en efectivo de la caja.',
    pide: 'cuenta',
    banco: ['110505', '130505', '1435', '2408', '4135', '4175'],
    renglones: [
      { concepto: 'La venta que se anula', columna: 'debe', importe: 300000, codigo: '4175' },
      { concepto: 'El IVA que ya no vas a deberle a la DIAN', columna: 'debe', importe: 57000, codigo: '2408' },
      { concepto: 'El efectivo que le devuelves al cliente', columna: 'haber', importe: 357000, codigo: '110505' },
    ],
    explicacion:
      'El PUC tiene una cuenta específica para las devoluciones: 4175, marcada (DB) porque es un ingreso de naturaleza débito que resta de las ventas. Usarla en vez de debitar 4135 deja ver cuánto te devuelven, y ese dato se pierde si anulas contra la cuenta de ingresos.',
  },

  /* ═══════════════ Nivel 5 · Sin opciones ═══════════════ */
  {
    id: 'libre-provision-cartera',
    nivel: 5,
    titulo: 'Provisión de cartera',
    enunciado:
      'Al cierre del mes calculas que un 5% de los $20.000.000 que te deben los clientes no se va a recuperar: $1.000.000. Registras la provisión. Busca las cuentas en el catálogo.',
    pide: 'cuenta',
    renglones: [
      { concepto: 'La pérdida estimada por la cartera que no cobrarás', columna: 'debe', importe: 1000000, codigo: '5199' },
      { concepto: 'Lo que se resta del saldo de clientes sin borrar la deuda', columna: 'haber', importe: 1000000, codigo: '139905' },
    ],
    explicacion:
      'El gasto por provisiones es 5199 y la contrapartida es 1399 provisiones, subcuenta 139905 clientes. Igual que la depreciación, es una cuenta de activo con naturaleza crédito: la deuda del cliente sigue viva en 1305 y la provisión la corrige por debajo.',
  },
  {
    id: 'libre-cesantias',
    nivel: 5,
    titulo: 'Cesantías consolidadas',
    enunciado:
      'Al cierre del año consolidas $2.400.000 de cesantías de tus empleados, que consignarás al fondo en febrero. Régimen de la Ley 50.',
    pide: 'cuenta',
    renglones: [
      { concepto: 'Las cesantías causadas como gasto de personal', columna: 'debe', importe: 2400000, codigo: '510530' },
      { concepto: 'La obligación laboral que queda pendiente de pagar', columna: 'haber', importe: 2400000, codigo: '251010' },
    ],
    explicacion:
      'Las cesantías son gasto del año en que se causan, aunque se paguen al año siguiente: por eso van a 510530 dentro de gastos de personal. La deuda queda en 2510 cesantías consolidadas, subcuenta 251010 para el régimen de la Ley 50 de 1990.',
  },
  {
    id: 'libre-cuota-credito',
    nivel: 5,
    titulo: 'Cuota del crédito',
    enunciado:
      'Pagas la cuota mensual del crédito: $1.500.000, de los cuales $400.000 corresponden a intereses y $1.100.000 abonan al capital.',
    pide: 'cuenta',
    renglones: [
      { concepto: 'La parte de la cuota que reduce la deuda con el banco', columna: 'debe', importe: 1100000, codigo: '2105' },
      { concepto: 'El costo de financiarte durante el mes', columna: 'debe', importe: 400000, codigo: '530520' },
      { concepto: 'El dinero que sale de la cuenta corriente', columna: 'haber', importe: 1500000, codigo: '111005' },
    ],
    explicacion:
      'La cuota tiene dos naturalezas distintas: el abono a capital reduce el pasivo 2105 —por eso se debita, al contrario de su naturaleza— y los intereses son gasto financiero, 530520. Cargar la cuota completa a gastos infla el gasto y deja la deuda sin reducir.',
  },
  {
    id: 'libre-pago-iva',
    nivel: 5,
    titulo: 'Pagas la declaración de IVA',
    enunciado:
      'Cerrado el bimestre, la cuenta de IVA queda con un saldo a favor de la DIAN de $1.900.000 —cobraste $3.000.000 y pagaste $1.100.000 en tus compras—. Pagas la declaración desde el banco.',
    pide: 'cuenta',
    renglones: [
      { concepto: 'La deuda con la DIAN que se cancela con el pago', columna: 'debe', importe: 1900000, codigo: '2408' },
      { concepto: 'El dinero que sale de la cuenta corriente', columna: 'haber', importe: 1900000, codigo: '111005' },
    ],
    explicacion:
      'Pagar un pasivo se registra al debe: la deuda desaparece. La cuenta 2408 venía con saldo crédito de 1.900.000 y con este asiento queda en cero, lista para el bimestre siguiente. El pago del IVA no es un gasto: nunca fue tuyo.',
  },
  {
    id: 'libre-venta-activo',
    nivel: 5,
    titulo: 'Vendes la camioneta',
    enunciado:
      'Vendes la camioneta en $20.000.000, que te consignan. Había costado $60.000.000 y tiene $45.000.000 de depreciación acumulada, así que su valor en libros es $15.000.000.',
    pide: 'cuenta',
    renglones: [
      { concepto: 'El dinero que recibes por la venta', columna: 'debe', importe: 20000000, codigo: '111005' },
      { concepto: 'La depreciación acumulada que hay que dar de baja', columna: 'debe', importe: 45000000, codigo: '159235' },
      { concepto: 'El vehículo que sale del activo por su costo', columna: 'haber', importe: 60000000, codigo: '154005' },
      { concepto: 'La ganancia obtenida sobre el valor en libros', columna: 'haber', importe: 5000000, codigo: '4245' },
    ],
    explicacion:
      'Vender un activo depreciado exige borrar las dos cuentas: el costo por el haber y la depreciación acumulada por el debe, que es su lado contrario. Lo que sobra —20.000.000 recibidos contra 15.000.000 de valor en libros— es la utilidad, y va a 4245, un ingreso no operacional.',
    nota: 'El ejercicio omite el IVA de la venta del activo para no mezclar dos asuntos en el mismo asiento.',
  },
  {
    id: 'libre-cierre',
    nivel: 5,
    titulo: 'Cierre del ejercicio',
    enunciado:
      'Al 31 de diciembre cancelas las cuentas de resultado contra ganancias y pérdidas. Los ingresos del año fueron $50.000.000, el costo de ventas $30.000.000 y los gastos de administración $12.000.000.',
    pide: 'cuenta',
    renglones: [
      { concepto: 'Los ingresos del año, que se cancelan por el lado contrario a su saldo', columna: 'debe', importe: 50000000, codigo: '4135' },
      { concepto: 'El costo de ventas del año, que se cancela', columna: 'haber', importe: 30000000, codigo: '6135' },
      { concepto: 'Los gastos de personal del año, que se cancelan', columna: 'haber', importe: 12000000, codigo: '5105' },
      { concepto: 'La diferencia entre unos y otros: el resultado del ejercicio', columna: 'haber', importe: 8000000, codigo: '5905' },
    ],
    explicacion:
      'Cerrar es dejar en cero las clases 4, 5 y 6 invirtiendo su saldo: los ingresos se debitan y los costos y gastos se acreditan. La diferencia queda en 5905 ganancias y pérdidas, que con utilidad termina con saldo crédito y después se traslada a 3605 utilidad del ejercicio.',
    nota: 'Es el único asiento del año en que los ingresos van al debe. Si te suena raro, va bien: cancelar una cuenta siempre se hace por su lado contrario.',
  },
]
