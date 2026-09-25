/**
 * Operaciones típicas del día a día con el asiento contable que les corresponde.
 * Permite buscar "qué cuenta uso cuando…" en lugar de buscar por código o nombre.
 *
 * Los importes son ilustrativos: lo que importa es qué cuenta va al débito y cuál al crédito.
 */

import type { Lado } from './guia'
import { OPERACIONES_VENTAS } from './operaciones/ventas'
import { OPERACIONES_COMPRAS } from './operaciones/compras'
import { OPERACIONES_NOMINA } from './operaciones/nomina'
import { OPERACIONES_IMPUESTOS } from './operaciones/impuestos'
import { OPERACIONES_FINANCIERO } from './operaciones/financiero'
import { OPERACIONES_ACTIVOS_PATRIMONIO_GASTOS } from './operaciones/activos-patrimonio-gastos'
import { OPERACIONES_COBERTURA_C1 } from './operaciones/cobertura-c1'
import { OPERACIONES_COBERTURA_C2 } from './operaciones/cobertura-c2'
import { OPERACIONES_COBERTURA_C34 } from './operaciones/cobertura-c34'
import { OPERACIONES_COBERTURA_C56 } from './operaciones/cobertura-c56'
import { OPERACIONES_COBERTURA_C89 } from './operaciones/cobertura-c89'

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
  /**
   * Quién paga: «pago» cuando sale dinero de la empresa, «cobro» cuando un cliente
   * u otro tercero le paga, «interno» cuando no se mueve dinero (causaciones, ajustes).
   */
  lado: Lado
  /** La misma operación vista desde el otro lado, para pasar de «yo pago» a «me pagan». */
  espejo?: string
  descripcion: string
  /** Formas coloquiales de nombrar la operación, para que la búsqueda las encuentre. */
  palabras: string[]
  asiento: Renglon[]
  nota?: string
}

export const CATEGORIAS = [
  'Caja y bancos',
  'Ventas',
  'Gastos y servicios',
  'Compras e inventarios',
  'Nómina',
  'Impuestos',
  'Activos fijos',
  'Cartera y patrimonio',
  'Inversiones y financiación',
  'Producción',
] as const

/** Las operaciones básicas; el resto vive por áreas en data/operaciones/. */
const BASICAS: Movimiento[] = [
  /* ─────────────────────── Caja y bancos ─────────────────────── */
  {
    id: 'venta-contado-efectivo',
    nombre: 'Entra efectivo por una venta de contado',
    categoria: 'Caja y bancos',
    lado: 'cobro',
    espejo: 'compra-contado',
    descripcion: 'El cliente paga en efectivo en el momento de la venta. Entra dinero a la caja y nace el ingreso.',
    palabras: ['vendi de contado', 'me pagaron en efectivo', 'entrada de dinero', 'recaudo', 'venta en caja', 'me pagaron de contado', 'el cliente me paga en efectivo', 'cobro en efectivo', 'vendi en la tienda', 'venta del dia', 'venta de mostrador', 'caja registradora', 'cliente paga en caja', 'recibo plata por una venta', 'venta al detal', 'venta con iva'],
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
    lado: 'interno',
    descripcion: 'El efectivo recaudado sale de la caja y entra a la cuenta corriente. No hay ingreso ni gasto: solo cambia de lugar.',
    palabras: ['consignar', 'depositar en el banco', 'llevar la plata al banco', 'traslado de fondos', 'consigno el efectivo', 'deposito la plata de la caja', 'paso la plata al banco', 'llevo el dinero al banco', 'consignacion bancaria', 'guardar el efectivo en el banco', 'de la caja al banco'],
    asiento: [
      { codigo: '111005', efecto: 'debito', concepto: 'Entrada a la cuenta bancaria' },
      { codigo: '110505', efecto: 'credito', concepto: 'Salida del efectivo de la caja' },
    ],
  },
  {
    id: 'recaudo-cartera',
    nombre: 'Un cliente me paga una factura pendiente',
    categoria: 'Caja y bancos',
    lado: 'cobro',
    espejo: 'pago-proveedor',
    descripcion: 'Se cobra una venta hecha a crédito. Entra el dinero y desaparece la cuenta por cobrar. El ingreso ya se registró al facturar.',
    palabras: ['cobrar', 'recaudo de cartera', 'me pagaron la factura', 'abono del cliente', 'el cliente me pago lo que me debia', 'me pagaron una factura vieja', 'me abonaron', 'abono a la factura', 'pago de un cliente', 'cliente paga a credito', 'recupero cartera', 'cobro de cartera', 'me consignaron', 'me transfirieron', 'me pagaron por transferencia', 'cliente cancela la deuda', 'cobro una cuenta pendiente'],
    asiento: [
      { codigo: '111005', efecto: 'debito', concepto: 'Dinero recibido en el banco' },
      { codigo: '130505', efecto: 'credito', concepto: 'Se cancela la deuda del cliente' },
    ],
  },
  {
    id: 'caja-menor-constitucion',
    nombre: 'Constituyo la caja menor',
    categoria: 'Caja y bancos',
    lado: 'interno',
    descripcion: 'Se separa un fondo fijo para gastos pequeños. El dinero sale del banco y queda bajo responsabilidad de quien la maneja.',
    palabras: ['caja menor', 'fondo fijo', 'base de caja', 'monto para gastos pequenos', 'crear la caja menor', 'abrir caja chica', 'fondo para gastos pequenos', 'base para gastos menores', 'caja chica'],
    asiento: [
      { codigo: '110510', efecto: 'debito', concepto: 'Fondo entregado como caja menor' },
      { codigo: '111005', efecto: 'credito', concepto: 'Retiro de la cuenta bancaria' },
    ],
  },
  {
    id: 'caja-menor-reembolso',
    nombre: 'Reembolso la caja menor con las facturas del periodo',
    categoria: 'Caja y bancos',
    lado: 'pago',
    descripcion: 'Se legalizan los soportes de los gastos pagados con caja menor y se repone el fondo hasta su monto original.',
    palabras: ['legalizar caja menor', 'reembolso', 'reponer la caja menor', 'gastos menores', 'reponer la caja chica', 'legalizar gastos de caja menor', 'facturas de caja menor', 'reintegro de caja menor', 'cuadrar la caja menor', 'gastos pequenos'],
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
    lado: 'interno',
    espejo: 'arqueo-faltante',
    descripcion: 'Hay más efectivo del que indica el registro contable. Mientras se aclara de dónde salió, la diferencia queda como una obligación con acreedores varios.',
    palabras: ['sobrante de caja', 'arqueo', 'sobra plata', 'diferencia en caja', 'sobro plata en la caja', 'hay mas plata de la que deberia', 'cuadre de caja con sobrante', 'contar la caja', 'conteo de caja'],
    asiento: [
      { codigo: '110505', efecto: 'debito', concepto: 'Efectivo que apareció de más' },
      { codigo: '238095', efecto: 'credito', concepto: 'Sobrante pendiente de aclarar' },
    ],
    nota: 'Así lo indica la dinámica oficial de 1105: los sobrantes van a 238095 y los faltantes a 136530. Si al final nadie reclama el sobrante, se traslada a un ingreso diverso (4295).',
  },
  {
    id: 'arqueo-faltante',
    nombre: 'El arqueo de caja da un faltante',
    categoria: 'Caja y bancos',
    lado: 'interno',
    espejo: 'arqueo-sobrante',
    descripcion: 'Hay menos efectivo del registrado. El faltante se cobra al responsable de la caja.',
    palabras: ['faltante de caja', 'falta plata', 'descuadre', 'arqueo negativo', 'falto plata en la caja', 'hay menos plata', 'cuadre de caja con faltante', 'se perdio plata de la caja', 'el cajero debe el faltante', 'robo en caja'],
    asiento: [
      { codigo: '136530', efecto: 'debito', concepto: 'Faltante a cargo del cajero (responsabilidades)' },
      { codigo: '110505', efecto: 'credito', concepto: 'Disminución del efectivo en caja' },
    ],
    nota: 'Si la empresa asume la pérdida en lugar de cobrarla, el débito va a un gasto (5395).',
  },
  {
    id: 'pago-servicios-publicos',
    nombre: 'Pago los servicios públicos de la oficina',
    categoria: 'Gastos y servicios',
    lado: 'pago',
    espejo: 'cobro-servicio',
    descripcion: 'Se causa el gasto del periodo y se paga desde el banco.',
    palabras: ['pagar luz', 'agua', 'energia', 'internet', 'recibos', 'servicios', 'pague la luz', 'pague el agua', 'pago el recibo de la luz', 'pago el internet', 'pago el telefono', 'pago el celular', 'pago el gas', 'recibo de servicios', 'factura de energia', 'servicios publicos domiciliarios', 'acueducto', 'alcantarillado', 'aseo', 'yo pago los servicios'],
    asiento: [
      { codigo: '513530', efecto: 'debito', concepto: 'Gasto de energía del área administrativa' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago desde la cuenta bancaria' },
    ],
  },
  {
    id: 'comision-bancaria',
    nombre: 'El banco me descuenta comisiones y el 4x1000',
    categoria: 'Caja y bancos',
    lado: 'pago',
    espejo: 'rendimientos-financieros',
    descripcion: 'Nota débito del extracto bancario por cuota de manejo, chequeras o gravamen a los movimientos financieros.',
    palabras: ['4x1000', 'gmf', 'cuota de manejo', 'nota debito', 'comision del banco', 'gastos bancarios', 'el banco me cobro', 'descuento del banco', 'cobro del banco', 'cuatro por mil', 'gravamen movimientos financieros', 'comision bancaria', 'cobro por transferencia', 'costo de la chequera', 'extracto bancario'],
    asiento: [
      { codigo: '530505', efecto: 'debito', concepto: 'Gasto bancario del periodo' },
      { codigo: '111005', efecto: 'credito', concepto: 'Descuento aplicado por el banco' },
    ],
  },
  {
    id: 'rendimientos-financieros',
    nombre: 'La cuenta de ahorros genera intereses a mi favor',
    categoria: 'Caja y bancos',
    lado: 'cobro',
    espejo: 'pago-cuota-credito',
    descripcion: 'El banco abona rendimientos y practica la retención en la fuente correspondiente.',
    palabras: ['intereses ganados', 'rendimientos', 'abono del banco', 'ahorros', 'el banco me pago intereses', 'intereses de la cuenta de ahorros', 'rendimientos de un cdt', 'ganancia financiera', 'intereses a mi favor', 'me pagan intereses'],
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
    lado: 'cobro',
    espejo: 'anticipo-proveedor',
    descripcion: 'Entra dinero antes de entregar el bien o el servicio. Todavía no es ingreso: es una obligación con el cliente.',
    palabras: ['anticipo', 'abono por adelantado', 'pago anticipado', 'me pagaron antes', 'el cliente me pago por adelantado', 'me dieron un adelanto', 'abono antes de entregar', 'separado', 'reserva pagada', 'cliente me adelanta plata', 'anticipo recibido', 'me pagan antes de entregar'],
    asiento: [
      { codigo: '111005', efecto: 'debito', concepto: 'Dinero recibido' },
      { codigo: '2805', efecto: 'credito', concepto: 'Obligación de entregar el bien o servicio' },
    ],
  },
  {
    id: 'prestamo-bancario',
    nombre: 'El banco me desembolsa un crédito',
    categoria: 'Caja y bancos',
    lado: 'cobro',
    espejo: 'pago-cuota-credito',
    descripcion: 'Entra el dinero del préstamo y nace la obligación financiera.',
    palabras: ['prestamo', 'credito bancario', 'desembolso', 'me prestaron', 'el banco me presto', 'saco un credito', 'credito de libre inversion', 'me desembolsaron', 'pido un prestamo', 'financiacion bancaria', 'obligacion financiera', 'leasing', 'sobregiro'],
    asiento: [
      { codigo: '111005', efecto: 'debito', concepto: 'Desembolso recibido' },
      { codigo: '210510', efecto: 'credito', concepto: 'Obligación con el banco' },
    ],
  },
  {
    id: 'pago-cuota-credito',
    nombre: 'Pago la cuota del crédito bancario',
    categoria: 'Caja y bancos',
    lado: 'pago',
    espejo: 'rendimientos-financieros',
    descripcion: 'La cuota tiene dos partes: la que abona a la deuda y la que corresponde a intereses del periodo.',
    palabras: ['cuota del prestamo', 'pagar credito', 'abono a capital', 'intereses', 'pago la cuota del banco', 'pago el prestamo', 'abono al credito', 'pago intereses al banco', 'cuota mensual del credito', 'amortizacion del prestamo', 'yo pago el credito'],
    asiento: [
      { codigo: '210510', efecto: 'debito', concepto: 'Abono a capital' },
      { codigo: '530520', efecto: 'debito', concepto: 'Intereses del periodo' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago total de la cuota' },
    ],
  },

  /* ─────────────────────── Gastos y servicios ─────────────────────── */
  {
    id: 'cobro-servicio',
    nombre: 'Presto un servicio y el cliente me paga',
    categoria: 'Gastos y servicios',
    lado: 'cobro',
    espejo: 'pago-honorarios',
    descripcion: 'Facturas un servicio de tu actividad y el cliente lo paga por transferencia. Para ti es un ingreso operacional; al cliente, el mismo servicio le es un gasto.',
    palabras: ['me pagaron el servicio', 'cobro un servicio', 'facturo un servicio', 'me pagan', 'ingreso por servicios', 'consultoria', 'cliente me paga', 'me pagaron una asesoria', 'me pagaron una consultoria', 'cobro honorarios', 'facturo mis servicios', 'el cliente paga mi servicio', 'presto servicios profesionales', 'ingreso por consultoria', 'vendo un servicio', 'cobro por mi trabajo', 'cuenta de cobro', 'me pagaron por un proyecto', 'desarrollo de software', 'mantenimiento que presto', 'me pagan honorarios'],
    asiento: [
      { codigo: '111005', efecto: 'debito', concepto: 'Dinero recibido del cliente' },
      { codigo: '135515', efecto: 'debito', concepto: 'Retención en la fuente que me practicó el cliente' },
      { codigo: '2408', efecto: 'credito', concepto: 'IVA generado por el servicio' },
      { codigo: '4155', efecto: 'credito', concepto: 'Ingreso por servicios de consultoría' },
    ],
    nota: 'La cuenta de ingreso depende de tu actividad: 4155 consultoría y servicios empresariales, 4145 transporte, 4140 hoteles y restaurantes, 4170 otros servicios personales. Si el cliente no es agente retenedor, no hay renglón 135515.',
  },
  {
    id: 'pago-honorarios',
    nombre: 'Pago los honorarios de un contador o abogado',
    categoria: 'Gastos y servicios',
    lado: 'pago',
    espejo: 'cobro-servicio',
    descripcion: 'Contratas un servicio profesional y le pagas. Para ti es un gasto; si eres agente retenedor, descuentas la retención y se la debes a la DIAN.',
    palabras: ['pagar honorarios', 'pago al contador', 'pago al abogado', 'asesoria', 'yo pago un servicio', 'pago a un profesional', 'pago al revisor fiscal', 'pago a un consultor', 'pago una asesoria', 'contrato un servicio profesional', 'pago a un freelance', 'pago a un independiente', 'cuenta de cobro de un proveedor', 'honorarios del contador', 'pago al asesor', 'le pague a un profesional', 'servicios profesionales'],
    asiento: [
      { codigo: '5110', efecto: 'debito', concepto: 'Gasto por honorarios' },
      { codigo: '236515', efecto: 'credito', concepto: 'Retención en la fuente por honorarios que practico' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago neto desde el banco' },
    ],
    nota: 'La retención es el espejo de la del cliente: quien paga la registra como pasivo (2365) y quien cobra como anticipo de impuestos (1355).',
  },
  {
    id: 'pago-arriendo',
    nombre: 'Pago el arriendo del local',
    categoria: 'Gastos y servicios',
    lado: 'pago',
    espejo: 'cobro-arriendo',
    descripcion: 'El arriendo que pagas por el lugar donde trabajas es un gasto del periodo.',
    palabras: ['pague el arriendo', 'pagar arriendo', 'alquiler', 'canon de arrendamiento', 'renta del local', 'pago el alquiler', 'pago el arriendo de la oficina', 'pago al arrendador', 'arriendo del local', 'arriendo de la bodega', 'le pague al dueno del local', 'renta mensual', 'canon', 'alquiler de oficina', 'yo pago arriendo'],
    asiento: [
      { codigo: '5120', efecto: 'debito', concepto: 'Gasto por arrendamiento' },
      { codigo: '236530', efecto: 'credito', concepto: 'Retención en la fuente por arrendamientos que practico' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago neto al arrendador' },
    ],
    nota: 'Si el local es del área de ventas, el gasto va en 5220 en lugar de 5120.',
  },
  {
    id: 'cobro-arriendo',
    nombre: 'Me pagan el arriendo de un local que alquilo',
    categoria: 'Gastos y servicios',
    lado: 'cobro',
    espejo: 'pago-arriendo',
    descripcion: 'Alquilas un bien que no es parte de tu negocio principal y el arrendatario te paga. Es un ingreso no operacional.',
    palabras: ['me pagaron el arriendo', 'cobro arriendo', 'ingreso por arrendamiento', 'alquilo un local', 'me pagan el alquiler', 'me pagan el arriendo', 'cobro el alquiler', 'arrendatario me paga', 'renta que recibo', 'alquilo una bodega', 'alquilo una oficina', 'inquilino me paga', 'ingreso por alquiler', 'canon recibido'],
    asiento: [
      { codigo: '111005', efecto: 'debito', concepto: 'Canon recibido' },
      { codigo: '135515', efecto: 'debito', concepto: 'Retención en la fuente que me practicó el arrendatario' },
      { codigo: '4220', efecto: 'credito', concepto: 'Ingreso por arrendamientos' },
    ],
    nota: 'Si arrendar inmuebles es tu actividad principal, el ingreso es operacional y va en 4155.',
  },

  /* ─────────────────────── Ventas ─────────────────────── */
  {
    id: 'venta-credito',
    nombre: 'Vendo mercancía a crédito',
    categoria: 'Ventas',
    lado: 'cobro',
    espejo: 'compra-credito',
    descripcion: 'Se factura y el cliente queda debiendo. El ingreso se reconoce al facturar, no al cobrar.',
    palabras: ['venta a credito', 'factura por cobrar', 'vender a plazo', 'cartera', 'vendi a credito', 'vendi fiado', 'venta a plazos', 'el cliente me queda debiendo', 'factura a 30 dias', 'venta con factura', 'cliente paga despues', 'fiado', 'facturar una venta'],
    asiento: [
      { codigo: '130505', efecto: 'debito', concepto: 'Cuenta por cobrar al cliente' },
      { codigo: '2408', efecto: 'credito', concepto: 'IVA generado' },
      { codigo: '4135', efecto: 'credito', concepto: 'Ingreso por la venta' },
    ],
  },
  {
    id: 'venta-con-retencion',
    nombre: 'Vendo a crédito y el cliente me practica retención',
    categoria: 'Ventas',
    lado: 'cobro',
    espejo: 'compra-credito',
    descripcion: 'El cliente, como agente retenedor, descuenta la retención en la fuente. Para mí es un anticipo de impuestos (1355, activo); para él es una deuda con la DIAN (2365, pasivo).',
    palabras: ['me retuvieron', 'retefuente', 'retencion practicada', 'anticipo de impuesto', 'el cliente me retuvo', 'me hicieron retencion', 'me descontaron retefuente', 'retencion que me practicaron', 'cliente agente retenedor', 'me pagaron con retencion', 'me retienen'],
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
    lado: 'interno',
    espejo: 'devolucion-compra',
    descripcion: 'Se reversa la venta con una nota crédito. La devolución no se resta del ingreso: tiene su propia cuenta.',
    palabras: ['devolucion', 'nota credito', 'me devolvieron', 'anular venta', 'el cliente devolvio', 'me devolvieron mercancia', 'cambio de producto', 'reembolso a un cliente', 'le devuelvo la plata al cliente', 'nota credito a un cliente', 'anulo una factura de venta', 'rebaja en ventas'],
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
    lado: 'interno',
    descripcion: 'Con inventario permanente, cada venta saca la mercancía del inventario y la lleva al costo.',
    palabras: ['costo de ventas', 'salida de inventario', 'kardex', 'inventario permanente', 'costo de la mercancia vendida', 'descargar inventario', 'sacar del inventario', 'costo de lo vendido', 'cmv'],
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
    lado: 'pago',
    espejo: 'venta-con-retencion',
    descripcion: 'Entra la mercancía al inventario, el IVA queda como descontable y nace la deuda con el proveedor.',
    palabras: ['comprar mercancia', 'factura de compra', 'proveedor', 'iva descontable', 'compre mercancia a credito', 'le compre al proveedor', 'compro fiado', 'factura del proveedor', 'compra con retencion', 'compro para revender', 'le quedo debiendo al proveedor', 'compra a plazos', 'compro inventario', 'surtir la tienda'],
    asiento: [
      { codigo: '1435', efecto: 'debito', concepto: 'Entrada al inventario' },
      { codigo: '2408', efecto: 'debito', concepto: 'IVA descontable' },
      { codigo: '236540', efecto: 'credito', concepto: 'Retención en la fuente que le practico al proveedor' },
      { codigo: '2205', efecto: 'credito', concepto: 'Deuda con el proveedor' },
    ],
  },
  {
    id: 'compra-contado',
    nombre: 'Compro mercancía de contado',
    categoria: 'Compras e inventarios',
    lado: 'pago',
    espejo: 'venta-contado-efectivo',
    descripcion: 'Pagas en el momento la mercancía que vas a revender. Sale dinero del banco y entra la mercancía al inventario: no es un gasto.',
    palabras: ['compre de contado', 'pague la mercancia', 'compra en efectivo', 'yo pago al proveedor', 'compre mercancia en efectivo', 'pago la compra de inmediato', 'compro de contado', 'compra en efectivo al proveedor', 'surtir de contado', 'compro inventario de contado'],
    asiento: [
      { codigo: '1435', efecto: 'debito', concepto: 'Entrada al inventario' },
      { codigo: '2408', efecto: 'debito', concepto: 'IVA descontable' },
      { codigo: '236540', efecto: 'credito', concepto: 'Retención en la fuente que le practico al proveedor' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago neto desde el banco' },
    ],
  },
  {
    id: 'pago-proveedor',
    nombre: 'Le pago a un proveedor',
    categoria: 'Compras e inventarios',
    lado: 'pago',
    espejo: 'recaudo-cartera',
    descripcion: 'Se cancela la factura pendiente. No hay gasto: el costo ya se registró al comprar.',
    palabras: ['pagar proveedor', 'cancelar factura', 'pago a credito', 'le pague al proveedor', 'abono al proveedor', 'pago la factura del proveedor', 'cancelo la deuda con el proveedor', 'transfiero al proveedor', 'pago lo que le debo al proveedor', 'le pago a un acreedor'],
    asiento: [
      { codigo: '2205', efecto: 'debito', concepto: 'Se cancela la deuda' },
      { codigo: '111005', efecto: 'credito', concepto: 'Salida de dinero del banco' },
    ],
  },
  {
    id: 'devolucion-compra',
    nombre: 'Devuelvo mercancía a un proveedor',
    categoria: 'Compras e inventarios',
    lado: 'interno',
    espejo: 'devolucion-venta',
    descripcion: 'Se reversa parte de la compra. Con inventario periódico se usa la cuenta de devoluciones en compras.',
    palabras: ['devolver al proveedor', 'nota credito del proveedor', 'devolucion en compras', 'le devolvi mercancia al proveedor', 'devolucion al proveedor', 'mercancia defectuosa', 'producto danado', 'el proveedor me hace nota credito', 'rebaja en compras'],
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
    lado: 'pago',
    espejo: 'anticipo-cliente',
    descripcion: 'Sale dinero antes de recibir el bien o servicio. Es un derecho, no un gasto.',
    palabras: ['anticipo a proveedor', 'pago por adelantado', 'avance', 'le adelanto plata al proveedor', 'le doy un adelanto al proveedor', 'pago antes de recibir', 'anticipo entregado', 'abono al proveedor antes de la entrega'],
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
    lado: 'interno',
    espejo: 'pago-nomina',
    descripcion: 'Se reconoce el gasto por el trabajo del periodo, se separan los descuentos del empleado y queda el neto por pagar.',
    palabras: ['nomina', 'sueldos', 'causar nomina', 'salarios del mes', 'liquidar la nomina', 'calcular sueldos', 'causar salarios', 'nomina del mes', 'quincena', 'reconocer sueldos', 'descuentos de nomina', 'deducciones del empleado', 'horas extras', 'recargos nocturnos', 'dominicales', 'auxilio de transporte', 'comisiones de vendedores', 'bonificaciones'],
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
    lado: 'pago',
    descripcion: 'Se cancela el neto que quedó pendiente con los trabajadores.',
    palabras: ['pagar nomina', 'consignar sueldos', 'pago de salarios', 'pago a los empleados', 'pago la quincena', 'consigno la nomina', 'pago salarios', 'le pago al trabajador', 'dispersion de nomina', 'transfiero la nomina', 'pago el sueldo'],
    asiento: [
      { codigo: '2505', efecto: 'debito', concepto: 'Se cancela la obligación laboral' },
      { codigo: '111005', efecto: 'credito', concepto: 'Salida del banco' },
    ],
  },
  {
    id: 'prestaciones-sociales',
    nombre: 'Causo las prestaciones sociales del mes',
    categoria: 'Nómina',
    lado: 'interno',
    descripcion: 'Cesantías, intereses, prima y vacaciones se causan mes a mes aunque se paguen después.',
    palabras: ['prestaciones', 'cesantias', 'prima', 'vacaciones', 'provision de nomina', 'provisionar prestaciones', 'causar cesantias', 'causar prima', 'intereses de cesantias', 'vacaciones de los empleados', 'prima de junio', 'prima de diciembre', 'prestaciones del mes'],
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
    lado: 'pago',
    descripcion: 'Se traslada a las entidades tanto lo descontado al empleado como el aporte a cargo de la empresa.',
    palabras: ['planilla', 'pila', 'aportes', 'eps', 'pension', 'sena', 'icbf', 'caja de compensacion', 'pago la pila', 'pago la planilla', 'pago seguridad social', 'aportes a salud y pension', 'pago eps', 'pago arl', 'pago caja de compensacion', 'pago de parafiscales', 'aportes patronales'],
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
    lado: 'pago',
    descripcion: 'El saldo de la cuenta 2408 se cancela al pagar. Si el IVA descontable supera al generado, queda saldo a favor.',
    palabras: ['iva', 'declaracion de iva', 'pagar iva', 'impuesto a las ventas', 'pago el iva', 'declaro iva', 'iva bimestral', 'iva cuatrimestral', 'iva por pagar', 'liquidar el iva', 'iva a la dian', 'pago de impuesto a las ventas'],
    asiento: [
      { codigo: '2408', efecto: 'debito', concepto: 'Se cancela el saldo a cargo' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago a la DIAN' },
    ],
  },
  {
    id: 'pago-retefuente',
    nombre: 'Pago la retención en la fuente que practiqué',
    categoria: 'Impuestos',
    lado: 'pago',
    descripcion: 'Lo retenido a terceros durante el mes se consigna a la DIAN.',
    palabras: ['retefuente', 'declaracion de retencion', 'pagar retenciones', 'agente retenedor', 'declaro retencion', 'pago la retencion a la dian', 'retenciones del mes', 'formulario 350', 'pago lo que retuve', 'retencion por pagar'],
    asiento: [
      { codigo: '236540', efecto: 'debito', concepto: 'Retenciones practicadas en el periodo' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago a la DIAN' },
    ],
  },
  {
    id: 'causacion-renta',
    nombre: 'Causo el impuesto de renta del ejercicio',
    categoria: 'Impuestos',
    lado: 'interno',
    descripcion: 'Al cierre se reconoce el impuesto del año como gasto y como obligación por pagar.',
    palabras: ['impuesto de renta', 'declaracion de renta', 'provision de impuestos', 'calcular la renta', 'impuesto del ano', 'provision de renta', 'renta por pagar', 'declaracion anual', 'impuesto sobre la renta'],
    asiento: [
      { codigo: '5405', efecto: 'debito', concepto: 'Gasto por impuesto de renta' },
      { codigo: '2404', efecto: 'credito', concepto: 'Impuesto por pagar' },
    ],
  },
  {
    id: 'pago-ica',
    nombre: 'Pago el impuesto de industria y comercio',
    categoria: 'Impuestos',
    lado: 'interno',
    descripcion: 'El ICA se causa como gasto del periodo y se paga al municipio.',
    palabras: ['ica', 'industria y comercio', 'impuesto municipal', 'rete ica', 'impuesto de industria y comercio', 'declaracion de ica', 'pago al municipio', 'impuesto a la alcaldia', 'ica por pagar', 'avisos y tableros'],
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
    lado: 'pago',
    espejo: 'venta-activo-fijo',
    descripcion: 'El bien se capitaliza porque se usará por más de un año: no es gasto del periodo.',
    palabras: ['comprar computador', 'activo fijo', 'equipo de computo', 'capitalizar', 'compro un portatil', 'compro un computador', 'compro una impresora', 'compro un celular para la empresa', 'compro muebles', 'compro un escritorio', 'compro maquinaria', 'compro un carro para la empresa', 'compro un vehiculo', 'compro equipos', 'compra de activos', 'inversion en equipos'],
    asiento: [
      { codigo: '152805', efecto: 'debito', concepto: 'Equipo de procesamiento de datos, con el IVA incluido en su costo' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago al proveedor' },
    ],
    nota: 'El IVA de un activo fijo no se descuenta en la declaración de IVA (2408): se suma al costo del activo. Si es un activo fijo real productivo, puede tomarse como descuento en el impuesto de renta (art. 258-1 del Estatuto Tributario) y entonces se debita a 1355 en lugar de sumarse al costo.',
  },
  {
    id: 'depreciacion',
    nombre: 'Registro la depreciación del mes',
    categoria: 'Activos fijos',
    lado: 'interno',
    descripcion: 'El costo del activo se distribuye a lo largo de su vida útil. La depreciación acumulada resta del activo.',
    palabras: ['depreciacion', 'desgaste', 'vida util', 'depreciar', 'depreciar equipos', 'depreciacion mensual', 'gasto por depreciacion', 'desgaste de activos', 'depreciacion del computador', 'depreciacion del carro', 'depreciacion acumulada'],
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
    lado: 'cobro',
    espejo: 'compra-activo-fijo',
    descripcion: 'Se retira el costo y su depreciación acumulada; la diferencia contra el precio de venta es utilidad o pérdida.',
    palabras: ['vender activo', 'dar de baja', 'venta de equipo', 'utilidad en venta', 'vendo un computador usado', 'vendo el carro de la empresa', 'vendo maquinaria', 'vendo un activo', 'baja de activos', 'venta de activos fijos', 'me pagan por un equipo usado', 'ganancia en venta de activo'],
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
    lado: 'interno',
    descripcion: 'Se reconoce que parte de la cartera probablemente no se recupere, sin borrar todavía la cuenta por cobrar.',
    palabras: ['provision de cartera', 'deterioro', 'cartera vencida', 'incobrable', 'el cliente no me paga', 'cliente moroso', 'cartera morosa', 'cuentas incobrables', 'deterioro de cartera', 'cartera dificil cobro', 'castigar cartera', 'no me van a pagar'],
    asiento: [
      { codigo: '5199', efecto: 'debito', concepto: 'Gasto por provisión' },
      { codigo: '139905', efecto: 'credito', concepto: 'Provisión de clientes' },
    ],
  },
  {
    id: 'aporte-socios',
    nombre: 'Los socios aportan capital en efectivo',
    categoria: 'Cartera y patrimonio',
    lado: 'cobro',
    espejo: 'pago-dividendos',
    descripcion: 'Entra dinero a la empresa y aumenta el patrimonio, no el pasivo.',
    palabras: ['aporte de capital', 'socios', 'capitalizar', 'inversion de los duenos', 'los socios ponen plata', 'aporte de los duenos', 'capitalizacion', 'inyeccion de capital', 'socio aporta dinero', 'constitucion de la empresa', 'pago de acciones', 'suscripcion de acciones', 'me paga un socio su aporte'],
    asiento: [
      { codigo: '111005', efecto: 'debito', concepto: 'Dinero aportado' },
      { codigo: '3105', efecto: 'credito', concepto: 'Capital suscrito y pagado' },
    ],
  },
  {
    id: 'decreto-dividendos',
    nombre: 'Se decretan dividendos a los socios',
    categoria: 'Cartera y patrimonio',
    lado: 'interno',
    espejo: 'pago-dividendos',
    descripcion: 'Las utilidades acumuladas se convierten en una obligación con los socios hasta que se paguen.',
    palabras: ['dividendos', 'reparto de utilidades', 'participaciones', 'distribuir ganancias', 'decretar dividendos', 'repartir utilidades', 'asamblea reparte ganancias', 'dividendos por pagar', 'distribucion de utilidades'],
    asiento: [
      { codigo: '3705', efecto: 'debito', concepto: 'Utilidades acumuladas distribuidas' },
      { codigo: '2360', efecto: 'credito', concepto: 'Dividendos por pagar' },
    ],
  },
  {
    id: 'pago-dividendos',
    nombre: 'Pago los dividendos a los socios',
    categoria: 'Cartera y patrimonio',
    lado: 'pago',
    espejo: 'aporte-socios',
    descripcion: 'Se paga la obligación que nació al decretar los dividendos. El patrimonio ya bajó al decretarlos: el pago solo cancela el pasivo.',
    palabras: ['pagar dividendos', 'pago a socios', 'reparto de utilidades', 'giro a los accionistas', 'pagar utilidades a los socios', 'le pago a los socios', 'giro de dividendos', 'entrega de utilidades', 'pago de participaciones'],
    asiento: [
      { codigo: '2360', efecto: 'debito', concepto: 'Se cancelan los dividendos por pagar' },
      { codigo: '236510', efecto: 'credito', concepto: 'Retención en la fuente sobre dividendos' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago neto a los socios' },
    ],
  },
  {
    id: 'cierre-ejercicio',
    nombre: 'Cierro ingresos, costos y gastos al final del año',
    categoria: 'Cartera y patrimonio',
    lado: 'interno',
    descripcion: 'Las cuentas de resultado se cancelan contra ganancias y pérdidas para determinar la utilidad del ejercicio.',
    palabras: ['cierre contable', 'ganancias y perdidas', 'fin de ano', 'cancelar cuentas de resultado', 'cierre del ano', 'cierre de fin de ano', 'cerrar cuentas de resultado', 'utilidad del ejercicio', 'perdida del ejercicio', 'cierre anual', 'cancelar ingresos y gastos'],
    asiento: [
      { codigo: '4135', efecto: 'debito', concepto: 'Se cancela el saldo de ingresos' },
      { codigo: '5905', efecto: 'credito', concepto: 'Ganancias y pérdidas' },
      { codigo: '5905', efecto: 'debito', concepto: 'Se cancelan costos y gastos contra el resultado' },
      { codigo: '6135', efecto: 'credito', concepto: 'Se cancela el costo de ventas' },
    ],
    nota: 'El saldo final de 5905 se traslada a 3605 si es utilidad o a 3610 si es pérdida.',
  },

  /* ─────────────── Más operaciones del día a día ─────────────── */
  {
    id: 'retiro-banco-caja',
    nombre: 'Retiro dinero del banco para la caja',
    categoria: 'Caja y bancos',
    lado: 'interno',
    espejo: 'consignacion-caja-banco',
    descripcion: 'Sacas efectivo del banco para tener base en la caja o hacer pagos en efectivo. El dinero solo cambia de lugar: no hay gasto ni ingreso.',
    palabras: ['retirar plata del banco', 'saco efectivo', 'retiro en el cajero', 'base de caja', 'cambio para la caja', 'del banco a la caja', 'retiro por ventanilla'],
    asiento: [
      { codigo: '110505', efecto: 'debito', concepto: 'Entra el efectivo a la caja' },
      { codigo: '111005', efecto: 'credito', concepto: 'Sale el dinero del banco' },
    ],
  },
  {
    id: 'cobro-tarjeta',
    nombre: 'Un cliente me paga con tarjeta en el datáfono',
    categoria: 'Ventas',
    lado: 'cobro',
    espejo: 'compra-contado',
    descripcion: 'La venta se cobra con tarjeta débito o crédito. El banco abona el valor descontando su comisión, que es un gasto financiero para ti.',
    palabras: ['pago con tarjeta', 'datafono', 'me pagaron con tarjeta', 'venta con tarjeta de credito', 'pago con debito', 'pos', 'comision del datafono', 'cobro con tarjeta', 'redeban', 'credibanco'],
    asiento: [
      { codigo: '111005', efecto: 'debito', concepto: 'Abono neto del banco' },
      { codigo: '530505', efecto: 'debito', concepto: 'Comisión del datáfono' },
      { codigo: '2408', efecto: 'credito', concepto: 'IVA generado en la venta' },
      { codigo: '4135', efecto: 'credito', concepto: 'Ingreso por la venta' },
    ],
    nota: 'Si el banco además practica retención en la fuente o reteIVA sobre el pago con tarjeta, esos valores se debitan en 135515 y 135517.',
  },
  {
    id: 'pago-seguro',
    nombre: 'Pago la póliza de seguros',
    categoria: 'Gastos y servicios',
    lado: 'pago',
    descripcion: 'El seguro que cubre el mes en curso es un gasto. Si la póliza cubre un año entero, se registra como pagada por anticipado y se lleva al gasto mes a mes.',
    palabras: ['pago el seguro', 'poliza', 'soat', 'seguro del local', 'seguro de la mercancia', 'seguro del carro', 'aseguradora', 'renovar la poliza', 'poliza anual'],
    asiento: [
      { codigo: '5130', efecto: 'debito', concepto: 'Gasto por seguros del periodo' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago a la aseguradora' },
    ],
    nota: 'Póliza de un año pagada por adelantado: débito a 170520 (seguros pagados por anticipado) y cada mes se traslada la doceava parte a 5130.',
  },
  {
    id: 'pago-mantenimiento',
    nombre: 'Pago una reparación o mantenimiento',
    categoria: 'Gastos y servicios',
    lado: 'pago',
    descripcion: 'Arreglos que conservan un bien en funcionamiento sin aumentar su vida útil: son gasto del periodo, no un mayor valor del activo.',
    palabras: ['arreglo del computador', 'reparacion', 'mantenimiento del carro', 'tecnico', 'arreglar la maquina', 'repuestos', 'mantenimiento preventivo', 'pintar el local', 'plomero', 'electricista'],
    asiento: [
      { codigo: '5145', efecto: 'debito', concepto: 'Gasto por mantenimiento y reparaciones' },
      { codigo: '2408', efecto: 'debito', concepto: 'IVA descontable' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago al técnico o proveedor' },
    ],
    nota: 'Si la mejora alarga la vida útil o aumenta la capacidad del bien, se suma al activo (grupo 15) en lugar de ir al gasto.',
  },
  {
    id: 'pago-papeleria',
    nombre: 'Compro papelería, cafetería o útiles de aseo',
    categoria: 'Gastos y servicios',
    lado: 'pago',
    descripcion: 'Consumos pequeños de la oficina que no se revenden: son gastos diversos del periodo.',
    palabras: ['papeleria', 'utiles de oficina', 'resmas', 'tinta de impresora', 'cafe', 'tinto', 'cafeteria', 'elementos de aseo', 'implementos de limpieza', 'gastos varios', 'compras pequenas'],
    asiento: [
      { codigo: '5195', efecto: 'debito', concepto: 'Gastos diversos' },
      { codigo: '2408', efecto: 'debito', concepto: 'IVA descontable' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago de la compra' },
    ],
    nota: 'Si se pagan con la caja menor, se registran al reembolsarla y el crédito va al banco que la repone.',
  },
  {
    id: 'pago-transporte',
    nombre: 'Pago transporte, fletes o mensajería',
    categoria: 'Gastos y servicios',
    lado: 'pago',
    descripcion: 'Fletes, acarreos, envíos y domicilios contratados con terceros son un gasto por servicios.',
    palabras: ['flete', 'envio', 'mensajeria', 'domicilio', 'transportadora', 'servientrega', 'acarreo', 'taxi', 'uber', 'pago un envio', 'despacho de mercancia', 'gasolina', 'combustible', 'tanqueo', 'peajes', 'parqueadero', 'acpm'],
    asiento: [
      { codigo: '5135', efecto: 'debito', concepto: 'Gasto por transporte, fletes y acarreos' },
      { codigo: '236525', efecto: 'credito', concepto: 'Retención en la fuente por servicios que practico' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago al transportador' },
    ],
    nota: 'Si el transporte es para entregar lo vendido, el gasto es del área de ventas (5235). Si es para traer mercancía comprada, se suma al costo del inventario (1435).',
  },
  {
    id: 'pago-publicidad',
    nombre: 'Pago publicidad o pauta en redes',
    categoria: 'Gastos y servicios',
    lado: 'pago',
    descripcion: 'La publicidad sirve para vender: es un gasto operacional del área de ventas.',
    palabras: ['publicidad', 'pauta en redes', 'anuncios', 'facebook ads', 'google ads', 'volantes', 'marketing', 'propaganda', 'valla', 'promocion'],
    asiento: [
      { codigo: '5235', efecto: 'debito', concepto: 'Gasto de publicidad del área de ventas' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago al medio o a la agencia' },
    ],
  },
  {
    id: 'pago-gastos-legales',
    nombre: 'Pago la renovación de la cámara de comercio',
    categoria: 'Gastos y servicios',
    lado: 'pago',
    descripcion: 'Registro mercantil, notaría y trámites legales son gastos legales del periodo.',
    palabras: ['camara de comercio', 'renovar matricula mercantil', 'registro mercantil', 'notaria', 'autenticacion', 'certificado de existencia', 'tramites legales', 'escrituras'],
    asiento: [
      { codigo: '5140', efecto: 'debito', concepto: 'Gastos legales' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago del trámite' },
    ],
  },
  {
    id: 'pago-viaticos',
    nombre: 'Pago los gastos de un viaje de trabajo',
    categoria: 'Gastos y servicios',
    lado: 'pago',
    descripcion: 'Tiquetes, hotel y alimentación de un viaje de la empresa son gastos de viaje.',
    palabras: ['viaticos', 'tiquetes', 'hotel', 'pasajes', 'viaje de negocios', 'alimentacion en viaje', 'hospedaje', 'legalizo gastos de viaje'],
    asiento: [
      { codigo: '5155', efecto: 'debito', concepto: 'Gastos de viaje' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago de los gastos' },
    ],
    nota: 'Si al empleado se le entrega el dinero antes del viaje, es un anticipo (133015) que se legaliza con las facturas.',
  },
  {
    id: 'pago-predial',
    nombre: 'Pago el impuesto predial o de vehículos',
    categoria: 'Impuestos',
    lado: 'pago',
    descripcion: 'Impuestos a cargo de la empresa distintos del de renta —predial, vehículos, timbre— son gasto del periodo.',
    palabras: ['predial', 'impuesto del carro', 'impuesto vehicular', 'impuesto de rodamiento', 'pago a la alcaldia', 'pago a la gobernacion', 'timbre'],
    asiento: [
      { codigo: '5115', efecto: 'debito', concepto: 'Gasto por impuestos' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago del impuesto' },
    ],
  },
  {
    id: 'prestamo-empleado',
    nombre: 'Le presto dinero a un empleado',
    categoria: 'Nómina',
    lado: 'pago',
    espejo: 'cobro-prestamo-empleado',
    descripcion: 'Sale dinero, pero no es gasto: el trabajador queda debiéndole a la empresa.',
    palabras: ['prestamo a un trabajador', 'le preste plata a un empleado', 'adelanto de sueldo', 'avance de nomina', 'credito a empleados', 'libranza interna'],
    asiento: [
      { codigo: '1365', efecto: 'debito', concepto: 'Cuenta por cobrar al trabajador' },
      { codigo: '111005', efecto: 'credito', concepto: 'Dinero entregado' },
    ],
  },
  {
    id: 'cobro-prestamo-empleado',
    nombre: 'El empleado me paga el préstamo',
    categoria: 'Nómina',
    lado: 'cobro',
    espejo: 'prestamo-empleado',
    descripcion: 'El trabajador devuelve lo que se le prestó. Entra dinero y se cancela la cuenta por cobrar: no es un ingreso.',
    palabras: ['el trabajador me devuelve', 'abono del empleado', 'me pagan el prestamo', 'descuento por nomina', 'cuota del empleado', 'recupero el prestamo'],
    asiento: [
      { codigo: '111005', efecto: 'debito', concepto: 'Dinero recibido del trabajador' },
      { codigo: '1365', efecto: 'credito', concepto: 'Se cancela la cuenta por cobrar' },
    ],
    nota: 'Si se descuenta de la nómina en vez de recibir el dinero, el débito va a 2505 (salarios por pagar) al pagar la nómina.',
  },
  {
    id: 'pago-cesantias',
    nombre: 'Consigno las cesantías al fondo',
    categoria: 'Nómina',
    lado: 'pago',
    descripcion: 'Antes del 14 de febrero se consignan al fondo las cesantías causadas el año anterior. Se cancela el pasivo que se fue acumulando cada mes.',
    palabras: ['cesantias', 'fondo de cesantias', 'porvenir', 'proteccion', 'colfondos', 'consignar cesantias', 'pago de cesantias', 'febrero'],
    asiento: [
      { codigo: '2510', efecto: 'debito', concepto: 'Se cancelan las cesantías consolidadas' },
      { codigo: '111005', efecto: 'credito', concepto: 'Consignación al fondo' },
    ],
  },
  {
    id: 'pago-prima',
    nombre: 'Pago la prima de servicios',
    categoria: 'Nómina',
    lado: 'pago',
    descripcion: 'La prima se paga en junio y en diciembre. El gasto ya se causó mes a mes: el pago solo cancela el pasivo.',
    palabras: ['prima de junio', 'prima de diciembre', 'pagar la prima', 'prima de mitad de ano', 'prima navidena'],
    asiento: [
      { codigo: '2520', efecto: 'debito', concepto: 'Se cancela la prima por pagar' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago a los trabajadores' },
    ],
  },
  {
    id: 'pago-vacaciones',
    nombre: 'Pago las vacaciones de un empleado',
    categoria: 'Nómina',
    lado: 'pago',
    descripcion: 'Al salir a vacaciones se paga lo que se había acumulado como vacaciones consolidadas.',
    palabras: ['vacaciones', 'pago de vacaciones', 'empleado sale a vacaciones', 'vacaciones compensadas', 'descanso remunerado'],
    asiento: [
      { codigo: '2525', efecto: 'debito', concepto: 'Se cancelan las vacaciones consolidadas' },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago al trabajador' },
    ],
  },
  {
    id: 'castigo-cartera',
    nombre: 'Doy de baja una factura que no me van a pagar',
    categoria: 'Cartera y patrimonio',
    lado: 'interno',
    espejo: 'provision-cartera',
    descripcion: 'Cuando se agotan los cobros, la cuenta por cobrar se castiga contra la provisión que ya se había hecho: no hay un gasto nuevo.',
    palabras: ['castigar cartera', 'dar de baja una deuda', 'cliente que nunca pago', 'cartera perdida', 'deuda incobrable', 'eliminar la cuenta por cobrar'],
    asiento: [
      { codigo: '139905', efecto: 'debito', concepto: 'Se usa la provisión de clientes' },
      { codigo: '130505', efecto: 'credito', concepto: 'Se retira la cuenta por cobrar' },
    ],
    nota: 'Si el cliente paga después del castigo, lo recibido es un ingreso por recuperaciones (4250).',
  },
]

export const MOVIMIENTOS: Movimiento[] = [
  ...BASICAS,
  ...OPERACIONES_VENTAS,
  ...OPERACIONES_COMPRAS,
  ...OPERACIONES_NOMINA,
  ...OPERACIONES_IMPUESTOS,
  ...OPERACIONES_FINANCIERO,
  ...OPERACIONES_ACTIVOS_PATRIMONIO_GASTOS,
  // Al menos una operación por cada cuenta del catálogo, por clases.
  ...OPERACIONES_COBERTURA_C1,
  ...OPERACIONES_COBERTURA_C2,
  ...OPERACIONES_COBERTURA_C34,
  ...OPERACIONES_COBERTURA_C56,
  ...OPERACIONES_COBERTURA_C89,
]
