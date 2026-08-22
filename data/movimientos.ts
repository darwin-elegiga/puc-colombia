/**
 * Operaciones típicas del día a día con el asiento contable que les corresponde.
 * Permite buscar "qué cuenta uso cuando…" en lugar de buscar por código o nombre.
 *
 * Los importes son ilustrativos: lo que importa es qué cuenta va al débito y cuál al crédito.
 */

export type Efecto = 'debito' | 'credito'

export interface Renglon {
  codigo: string
  efecto: Efecto
  concepto: string
}

export interface Movimiento {
  id: string
  nombre: string
  categoria: string
  descripcion: string
  /** Formas coloquiales de nombrar la operación, para que la búsqueda las encuentre. */
  palabras: string[]
  asiento: Renglon[]
  nota?: string
}

export const CATEGORIAS = [
  'Caja y bancos',
  'Ventas',
  'Compras e inventarios',
  'Nómina',
  'Impuestos',
  'Activos fijos',
  'Cartera y patrimonio',
] as const

export const MOVIMIENTOS: Movimiento[] = [
  /* ─────────────────────── Caja y bancos ─────────────────────── */
  {
    id: 'venta-contado-efectivo',
    nombre: 'Entra efectivo por una venta de contado',
    categoria: 'Caja y bancos',
    descripcion: 'El cliente paga en efectivo en el momento de la venta. Entra dinero a la caja y nace el ingreso.',
    palabras: ['vendi de contado', 'me pagaron en efectivo', 'entrada de dinero', 'recaudo', 'venta en caja'],
    asiento: [
      { codigo: '110505', efecto: 'debito', concepto: 'Efectivo recibido del cliente' },
      { codigo: '2408', efecto: 'credito', concepto: 'IVA generado en la venta' },
      { codigo: '4135', efecto: 'credito', concepto: 'Ingreso por la venta de mercancía' },
    ],
    nota: 'Si manejas inventario permanente, registra además el costo: débito 6135 y crédito 1435.',
  },
  {
    id: 'consignacion-caja-banco',
    nombre: 'Consigno el dinero de la caja en el banco',
    categoria: 'Caja y bancos',
    descripcion: 'El efectivo recaudado sale de la caja y entra a la cuenta corriente. No hay ingreso ni gasto: solo cambia de lugar.',
    palabras: ['consignar', 'depositar en el banco', 'llevar la plata al banco', 'traslado de fondos'],
    asiento: [
      { codigo: '111005', efecto: 'debito', concepto: 'Entrada a la cuenta bancaria' },
      { codigo: '110505', efecto: 'credito', concepto: 'Salida del efectivo de la caja' },
    ],
  },
  {
    id: 'recaudo-cartera',
    nombre: 'Un cliente me paga una factura pendiente',
    categoria: 'Caja y bancos',
    descripcion: 'Se cobra una venta hecha a crédito. Entra el dinero y desaparece la cuenta por cobrar. El ingreso ya se registró al facturar.',
    palabras: ['cobrar', 'recaudo de cartera', 'me pagaron la factura', 'abono del cliente'],
    asiento: [
      { codigo: '111005', efecto: 'debito', concepto: 'Dinero recibido en el banco' },
      { codigo: '130505', efecto: 'credito', concepto: 'Se cancela la deuda del cliente' },
    ],
  },
  {
    id: 'caja-menor-constitucion',
    nombre: 'Constituyo la caja menor',
    categoria: 'Caja y bancos',
    descripcion: 'Se separa un fondo fijo para gastos pequeños. El dinero sale del banco y queda bajo responsabilidad de quien la maneja.',
    palabras: ['caja menor', 'fondo fijo', 'base de caja', 'monto para gastos pequenos'],
    asiento: [
      { codigo: '110510', efecto: 'debito', concepto: 'Fondo entregado como caja menor' },
      { codigo: '111005', efecto: 'credito', concepto: 'Retiro de la cuenta bancaria' },
    ],
  },
  {
    id: 'caja-menor-reembolso',
    nombre: 'Reembolso la caja menor con las facturas del periodo',
    categoria: 'Caja y bancos',
    descripcion: 'Se legalizan los soportes de los gastos pagados con caja menor y se repone el fondo hasta su monto original.',
    palabras: ['legalizar caja menor', 'reembolso', 'reponer la caja menor', 'gastos menores'],
    asiento: [
      { codigo: '5195', efecto: 'debito', concepto: 'Gastos soportados con las facturas' },
      { codigo: '2408', efecto: 'debito', concepto: 'IVA descontable de las compras' },
      { codigo: '111005', efecto: 'credito', concepto: 'Salida del banco para reponer el fondo' },
    ],
    nota: 'El saldo de 110510 no se mueve: la caja menor siempre vale su monto fijo.',
  },
  {
    id: 'arqueo-sobrante',
    nombre: 'El arqueo de caja da un sobrante',
    categoria: 'Caja y bancos',
    descripcion: 'Hay más efectivo del que indica el registro contable. La diferencia se reconoce como un ingreso mientras se aclara el origen.',
    palabras: ['sobrante de caja', 'arqueo', 'sobra plata', 'diferencia en caja'],
    asiento: [
      { codigo: '110505', efecto: 'debito', concepto: 'Efectivo que apareció de más' },
      { codigo: '4295', efecto: 'credito', concepto: 'Ingreso por sobrante de caja' },
    ],
  },
  {
    id: 'arqueo-faltante',
    nombre: 'El arqueo de caja da un faltante',
    categoria: 'Caja y bancos',
    descripcion: 'Hay menos efectivo del registrado. El faltante se cobra al responsable de la caja.',
    palabras: ['faltante de caja', 'falta plata', 'descuadre', 'arqueo negativo'],
    asiento: [
      { codigo: '1365', efecto: 'debito', concepto: 'Faltante a cargo del cajero' },
      { codigo: '110505', efecto: 'credito', concepto: 'Disminución del efectivo en caja' },
    ],
    nota: 'Si la empresa asume la pérdida en lugar de cobrarla, el débito va a un gasto (5395).',
  },
  {
    id: 'pago-servicios-publicos',
    nombre: 'Pago los servicios públicos de la oficina',
    categoria: 'Caja y bancos',
    descripcion: 'Se causa el gasto del periodo y se paga desde el banco.',
    palabras: ['pagar luz', 'agua', 'energia', 'internet', 'recibos', 'servicios'],
    asiento: [
      { codigo: '513530', efecto: 'debito', concepto: 'Gasto de energía del área administrativa' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago desde la cuenta bancaria' },
    ],
  },
  {
    id: 'comision-bancaria',
    nombre: 'El banco me descuenta comisiones y el 4x1000',
    categoria: 'Caja y bancos',
    descripcion: 'Nota débito del extracto bancario por cuota de manejo, chequeras o gravamen a los movimientos financieros.',
    palabras: ['4x1000', 'gmf', 'cuota de manejo', 'nota debito', 'comision del banco', 'gastos bancarios'],
    asiento: [
      { codigo: '530505', efecto: 'debito', concepto: 'Gasto bancario del periodo' },
      { codigo: '111005', efecto: 'credito', concepto: 'Descuento aplicado por el banco' },
    ],
  },
  {
    id: 'rendimientos-financieros',
    nombre: 'La cuenta de ahorros genera intereses a mi favor',
    categoria: 'Caja y bancos',
    descripcion: 'El banco abona rendimientos y practica la retención en la fuente correspondiente.',
    palabras: ['intereses ganados', 'rendimientos', 'abono del banco', 'ahorros'],
    asiento: [
      { codigo: '112005', efecto: 'debito', concepto: 'Rendimientos abonados a la cuenta' },
      { codigo: '135515', efecto: 'debito', concepto: 'Retención en la fuente que me practicaron' },
      { codigo: '4210', efecto: 'credito', concepto: 'Ingreso financiero' },
    ],
  },
  {
    id: 'anticipo-cliente',
    nombre: 'Recibo un anticipo de un cliente',
    categoria: 'Caja y bancos',
    descripcion: 'Entra dinero antes de entregar el bien o el servicio. Todavía no es ingreso: es una obligación con el cliente.',
    palabras: ['anticipo', 'abono por adelantado', 'pago anticipado', 'me pagaron antes'],
    asiento: [
      { codigo: '111005', efecto: 'debito', concepto: 'Dinero recibido' },
      { codigo: '2805', efecto: 'credito', concepto: 'Obligación de entregar el bien o servicio' },
    ],
  },
  {
    id: 'prestamo-bancario',
    nombre: 'El banco me desembolsa un crédito',
    categoria: 'Caja y bancos',
    descripcion: 'Entra el dinero del préstamo y nace la obligación financiera.',
    palabras: ['prestamo', 'credito bancario', 'desembolso', 'me prestaron'],
    asiento: [
      { codigo: '111005', efecto: 'debito', concepto: 'Desembolso recibido' },
      { codigo: '210510', efecto: 'credito', concepto: 'Obligación con el banco' },
    ],
  },
  {
    id: 'pago-cuota-credito',
    nombre: 'Pago la cuota del crédito bancario',
    categoria: 'Caja y bancos',
    descripcion: 'La cuota tiene dos partes: la que abona a la deuda y la que corresponde a intereses del periodo.',
    palabras: ['cuota del prestamo', 'pagar credito', 'abono a capital', 'intereses'],
    asiento: [
      { codigo: '210510', efecto: 'debito', concepto: 'Abono a capital' },
      { codigo: '530520', efecto: 'debito', concepto: 'Intereses del periodo' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago total de la cuota' },
    ],
  },

  /* ─────────────────────── Ventas ─────────────────────── */
  {
    id: 'venta-credito',
    nombre: 'Vendo mercancía a crédito',
    categoria: 'Ventas',
    descripcion: 'Se factura y el cliente queda debiendo. El ingreso se reconoce al facturar, no al cobrar.',
    palabras: ['venta a credito', 'factura por cobrar', 'vender a plazo', 'cartera'],
    asiento: [
      { codigo: '130505', efecto: 'debito', concepto: 'Cuenta por cobrar al cliente' },
      { codigo: '2408', efecto: 'credito', concepto: 'IVA generado' },
      { codigo: '4135', efecto: 'credito', concepto: 'Ingreso por la venta' },
    ],
  },
  {
    id: 'venta-con-retencion',
    nombre: 'Me facturan una venta y el cliente me retiene',
    categoria: 'Ventas',
    descripcion: 'El cliente, como agente retenedor, descuenta la retención en la fuente. Para mí es un anticipo de impuestos.',
    palabras: ['me retuvieron', 'retefuente', 'retencion practicada', 'anticipo de impuesto'],
    asiento: [
      { codigo: '130505', efecto: 'debito', concepto: 'Neto que me quedan debiendo' },
      { codigo: '135515', efecto: 'debito', concepto: 'Retención en la fuente que me practicaron' },
      { codigo: '2408', efecto: 'credito', concepto: 'IVA generado' },
      { codigo: '4135', efecto: 'credito', concepto: 'Ingreso por la venta' },
    ],
  },
  {
    id: 'devolucion-venta',
    nombre: 'Un cliente me devuelve mercancía',
    categoria: 'Ventas',
    descripcion: 'Se reversa la venta con una nota crédito. La devolución no se resta del ingreso: tiene su propia cuenta.',
    palabras: ['devolucion', 'nota credito', 'me devolvieron', 'anular venta'],
    asiento: [
      { codigo: '4175', efecto: 'debito', concepto: 'Devolución en ventas' },
      { codigo: '2408', efecto: 'debito', concepto: 'Reversión del IVA generado' },
      { codigo: '130505', efecto: 'credito', concepto: 'Se disminuye la deuda del cliente' },
    ],
  },
  {
    id: 'costo-de-ventas',
    nombre: 'Registro el costo de lo que vendí',
    categoria: 'Ventas',
    descripcion: 'Con inventario permanente, cada venta saca la mercancía del inventario y la lleva al costo.',
    palabras: ['costo de ventas', 'salida de inventario', 'kardex', 'inventario permanente'],
    asiento: [
      { codigo: '6135', efecto: 'debito', concepto: 'Costo de la mercancía vendida' },
      { codigo: '1435', efecto: 'credito', concepto: 'Salida del inventario' },
    ],
  },

  /* ─────────────────────── Compras e inventarios ─────────────────────── */
  {
    id: 'compra-credito',
    nombre: 'Compro mercancía a crédito con IVA',
    categoria: 'Compras e inventarios',
    descripcion: 'Entra la mercancía al inventario, el IVA queda como descontable y nace la deuda con el proveedor.',
    palabras: ['comprar mercancia', 'factura de compra', 'proveedor', 'iva descontable'],
    asiento: [
      { codigo: '1435', efecto: 'debito', concepto: 'Entrada al inventario' },
      { codigo: '2408', efecto: 'debito', concepto: 'IVA descontable' },
      { codigo: '236540', efecto: 'credito', concepto: 'Retención en la fuente que le practico al proveedor' },
      { codigo: '2205', efecto: 'credito', concepto: 'Deuda con el proveedor' },
    ],
  },
  {
    id: 'pago-proveedor',
    nombre: 'Le pago a un proveedor',
    categoria: 'Compras e inventarios',
    descripcion: 'Se cancela la factura pendiente. No hay gasto: el costo ya se registró al comprar.',
    palabras: ['pagar proveedor', 'cancelar factura', 'pago a credito'],
    asiento: [
      { codigo: '2205', efecto: 'debito', concepto: 'Se cancela la deuda' },
      { codigo: '111005', efecto: 'credito', concepto: 'Salida de dinero del banco' },
    ],
  },
  {
    id: 'devolucion-compra',
    nombre: 'Devuelvo mercancía a un proveedor',
    categoria: 'Compras e inventarios',
    descripcion: 'Se reversa parte de la compra. Con inventario periódico se usa la cuenta de devoluciones en compras.',
    palabras: ['devolver al proveedor', 'nota credito del proveedor', 'devolucion en compras'],
    asiento: [
      { codigo: '2205', efecto: 'debito', concepto: 'Disminuye la deuda con el proveedor' },
      { codigo: '2408', efecto: 'credito', concepto: 'Reversión del IVA descontable' },
      { codigo: '6225', efecto: 'credito', concepto: 'Devolución en compras' },
    ],
    nota: 'Con inventario permanente el crédito va directo a 1435 en lugar de 6225.',
  },
  {
    id: 'anticipo-proveedor',
    nombre: 'Le doy un anticipo a un proveedor',
    categoria: 'Compras e inventarios',
    descripcion: 'Sale dinero antes de recibir el bien o servicio. Es un derecho, no un gasto.',
    palabras: ['anticipo a proveedor', 'pago por adelantado', 'avance'],
    asiento: [
      { codigo: '133005', efecto: 'debito', concepto: 'Anticipo entregado' },
      { codigo: '111005', efecto: 'credito', concepto: 'Salida del banco' },
    ],
  },

  /* ─────────────────────── Nómina ─────────────────────── */
  {
    id: 'causacion-nomina',
    nombre: 'Causo la nómina del mes',
    categoria: 'Nómina',
    descripcion: 'Se reconoce el gasto por el trabajo del periodo, se separan los descuentos del empleado y queda el neto por pagar.',
    palabras: ['nomina', 'sueldos', 'causar nomina', 'salarios del mes'],
    asiento: [
      { codigo: '510506', efecto: 'debito', concepto: 'Sueldos del área administrativa' },
      { codigo: '237005', efecto: 'credito', concepto: 'Aporte a salud descontado al empleado' },
      { codigo: '2505', efecto: 'credito', concepto: 'Neto por pagar al trabajador' },
    ],
  },
  {
    id: 'pago-nomina',
    nombre: 'Pago la nómina',
    categoria: 'Nómina',
    descripcion: 'Se cancela el neto que quedó pendiente con los trabajadores.',
    palabras: ['pagar nomina', 'consignar sueldos', 'pago de salarios'],
    asiento: [
      { codigo: '2505', efecto: 'debito', concepto: 'Se cancela la obligación laboral' },
      { codigo: '111005', efecto: 'credito', concepto: 'Salida del banco' },
    ],
  },
  {
    id: 'prestaciones-sociales',
    nombre: 'Causo las prestaciones sociales del mes',
    categoria: 'Nómina',
    descripcion: 'Cesantías, intereses, prima y vacaciones se causan mes a mes aunque se paguen después.',
    palabras: ['prestaciones', 'cesantias', 'prima', 'vacaciones', 'provision de nomina'],
    asiento: [
      { codigo: '510530', efecto: 'debito', concepto: 'Gasto por cesantías' },
      { codigo: '510536', efecto: 'debito', concepto: 'Gasto por prima de servicios' },
      { codigo: '251010', efecto: 'credito', concepto: 'Cesantías consolidadas por pagar (Ley 50)' },
      { codigo: '2520', efecto: 'credito', concepto: 'Prima de servicios por pagar' },
    ],
  },
  {
    id: 'aportes-parafiscales',
    nombre: 'Pago seguridad social y parafiscales',
    categoria: 'Nómina',
    descripcion: 'Se traslada a las entidades tanto lo descontado al empleado como el aporte a cargo de la empresa.',
    palabras: ['planilla', 'pila', 'aportes', 'eps', 'pension', 'sena', 'icbf', 'caja de compensacion'],
    asiento: [
      { codigo: '237005', efecto: 'debito', concepto: 'Aportes descontados al trabajador' },
      { codigo: '237010', efecto: 'debito', concepto: 'Aportes parafiscales a cargo de la empresa' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago de la planilla' },
    ],
  },

  /* ─────────────────────── Impuestos ─────────────────────── */
  {
    id: 'declaracion-iva',
    nombre: 'Presento y pago la declaración de IVA',
    categoria: 'Impuestos',
    descripcion: 'El saldo de la cuenta 2408 se cancela al pagar. Si el IVA descontable supera al generado, queda saldo a favor.',
    palabras: ['iva', 'declaracion de iva', 'pagar iva', 'impuesto a las ventas'],
    asiento: [
      { codigo: '2408', efecto: 'debito', concepto: 'Se cancela el saldo a cargo' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago a la DIAN' },
    ],
  },
  {
    id: 'pago-retefuente',
    nombre: 'Pago la retención en la fuente que practiqué',
    categoria: 'Impuestos',
    descripcion: 'Lo retenido a terceros durante el mes se consigna a la DIAN.',
    palabras: ['retefuente', 'declaracion de retencion', 'pagar retenciones', 'agente retenedor'],
    asiento: [
      { codigo: '236540', efecto: 'debito', concepto: 'Retenciones practicadas en el periodo' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago a la DIAN' },
    ],
  },
  {
    id: 'causacion-renta',
    nombre: 'Causo el impuesto de renta del ejercicio',
    categoria: 'Impuestos',
    descripcion: 'Al cierre se reconoce el impuesto del año como gasto y como obligación por pagar.',
    palabras: ['impuesto de renta', 'declaracion de renta', 'provision de impuestos'],
    asiento: [
      { codigo: '5405', efecto: 'debito', concepto: 'Gasto por impuesto de renta' },
      { codigo: '2404', efecto: 'credito', concepto: 'Impuesto por pagar' },
    ],
  },
  {
    id: 'pago-ica',
    nombre: 'Pago el impuesto de industria y comercio',
    categoria: 'Impuestos',
    descripcion: 'El ICA se causa como gasto del periodo y se paga al municipio.',
    palabras: ['ica', 'industria y comercio', 'impuesto municipal', 'rete ica'],
    asiento: [
      { codigo: '5115', efecto: 'debito', concepto: 'Gasto por impuesto de industria y comercio' },
      { codigo: '2412', efecto: 'credito', concepto: 'Impuesto por pagar al municipio' },
    ],
  },

  /* ─────────────────────── Activos fijos ─────────────────────── */
  {
    id: 'compra-activo-fijo',
    nombre: 'Compro un computador para la oficina',
    categoria: 'Activos fijos',
    descripcion: 'El bien se capitaliza porque se usará por más de un año: no es gasto del periodo.',
    palabras: ['comprar computador', 'activo fijo', 'equipo de computo', 'capitalizar'],
    asiento: [
      { codigo: '152805', efecto: 'debito', concepto: 'Equipo de procesamiento de datos' },
      { codigo: '2408', efecto: 'debito', concepto: 'IVA descontable' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago al proveedor' },
    ],
  },
  {
    id: 'depreciacion',
    nombre: 'Registro la depreciación del mes',
    categoria: 'Activos fijos',
    descripcion: 'El costo del activo se distribuye a lo largo de su vida útil. La depreciación acumulada resta del activo.',
    palabras: ['depreciacion', 'desgaste', 'vida util', 'depreciar'],
    asiento: [
      { codigo: '5160', efecto: 'debito', concepto: 'Gasto por depreciación' },
      { codigo: '159220', efecto: 'credito', concepto: 'Depreciación acumulada del equipo' },
    ],
    nota: '1592 es una cuenta de activo con naturaleza crédito: disminuye el valor en libros sin borrar el costo original.',
  },
  {
    id: 'venta-activo-fijo',
    nombre: 'Vendo un activo fijo con utilidad',
    categoria: 'Activos fijos',
    descripcion: 'Se retira el costo y su depreciación acumulada; la diferencia contra el precio de venta es utilidad o pérdida.',
    palabras: ['vender activo', 'dar de baja', 'venta de equipo', 'utilidad en venta'],
    asiento: [
      { codigo: '111005', efecto: 'debito', concepto: 'Dinero recibido por la venta' },
      { codigo: '159220', efecto: 'debito', concepto: 'Se retira la depreciación acumulada' },
      { codigo: '152805', efecto: 'credito', concepto: 'Se retira el costo del activo' },
      { codigo: '4245', efecto: 'credito', concepto: 'Utilidad en venta de propiedad, planta y equipo' },
    ],
  },

  /* ─────────────────────── Cartera y patrimonio ─────────────────────── */
  {
    id: 'provision-cartera',
    nombre: 'Provisiono cartera de difícil cobro',
    categoria: 'Cartera y patrimonio',
    descripcion: 'Se reconoce que parte de la cartera probablemente no se recupere, sin borrar todavía la cuenta por cobrar.',
    palabras: ['provision de cartera', 'deterioro', 'cartera vencida', 'incobrable'],
    asiento: [
      { codigo: '5199', efecto: 'debito', concepto: 'Gasto por provisión' },
      { codigo: '139905', efecto: 'credito', concepto: 'Provisión de clientes' },
    ],
  },
  {
    id: 'aporte-socios',
    nombre: 'Los socios aportan capital en efectivo',
    categoria: 'Cartera y patrimonio',
    descripcion: 'Entra dinero a la empresa y aumenta el patrimonio, no el pasivo.',
    palabras: ['aporte de capital', 'socios', 'capitalizar', 'inversion de los duenos'],
    asiento: [
      { codigo: '111005', efecto: 'debito', concepto: 'Dinero aportado' },
      { codigo: '3105', efecto: 'credito', concepto: 'Capital suscrito y pagado' },
    ],
  },
  {
    id: 'decreto-dividendos',
    nombre: 'Se decretan dividendos a los socios',
    categoria: 'Cartera y patrimonio',
    descripcion: 'Las utilidades acumuladas se convierten en una obligación con los socios hasta que se paguen.',
    palabras: ['dividendos', 'reparto de utilidades', 'participaciones', 'distribuir ganancias'],
    asiento: [
      { codigo: '3705', efecto: 'debito', concepto: 'Utilidades acumuladas distribuidas' },
      { codigo: '2360', efecto: 'credito', concepto: 'Dividendos por pagar' },
    ],
  },
  {
    id: 'cierre-ejercicio',
    nombre: 'Cierro ingresos, costos y gastos al final del año',
    categoria: 'Cartera y patrimonio',
    descripcion: 'Las cuentas de resultado se cancelan contra ganancias y pérdidas para determinar la utilidad del ejercicio.',
    palabras: ['cierre contable', 'ganancias y perdidas', 'fin de ano', 'cancelar cuentas de resultado'],
    asiento: [
      { codigo: '4135', efecto: 'debito', concepto: 'Se cancela el saldo de ingresos' },
      { codigo: '5905', efecto: 'credito', concepto: 'Ganancias y pérdidas' },
      { codigo: '5905', efecto: 'debito', concepto: 'Se cancelan costos y gastos contra el resultado' },
      { codigo: '6135', efecto: 'credito', concepto: 'Se cancela el costo de ventas' },
    ],
    nota: 'El saldo final de 5905 se traslada a 3605 si es utilidad o a 3610 si es pérdida.',
  },
]
