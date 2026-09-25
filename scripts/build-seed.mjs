#!/usr/bin/env node
/**
 * Construye src/data/puc.json a partir de la fuente compacta de este archivo.
 * Formato de cada línea:  codigo|NOMBRE|descripcion (opcional)|DB|CR (naturaleza forzada, opcional)
 * El nivel se deduce de la longitud del código: 1=clase, 2=grupo, 4=cuenta, 6=subcuenta.
 *
 * Fuente normativa: Decreto 2650 de 1993 y sus modificaciones (PUC para comerciantes).
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const LINEAS = []
const D = (txt) => {
  for (const linea of txt.split('\n')) {
    const t = linea.trim()
    if (t && !t.startsWith('#')) LINEAS.push(t)
  }
}

/* ─────────────────────────── CLASES (1 dígito) ─────────────────────────── */
D(`
1|ACTIVO|Agrupa las cuentas que representan los bienes y derechos tangibles e intangibles de propiedad del ente económico, que en la medida de su utilización son fuente potencial de beneficios presentes o futuros.
2|PASIVO|Agrupa las cuentas que representan las obligaciones contraídas por el ente económico pagaderas en dinero, bienes o servicios, como resultado de transacciones pasadas.
3|PATRIMONIO|Agrupa las cuentas que representan el valor residual de comparar el activo total menos el pasivo externo, producto de los recursos netos del ente económico.
4|INGRESOS|Agrupa las cuentas que representan los beneficios operativos y financieros percibidos por el ente económico en desarrollo del giro normal de su actividad en un ejercicio determinado.
5|GASTOS|Agrupa las cuentas que representan los cargos operativos y financieros en que incurre el ente económico en el desarrollo del giro normal de su actividad en un ejercicio económico determinado.
6|COSTOS DE VENTAS|Agrupa las cuentas que representan la acumulación de los costos directos e indirectos necesarios en la elaboración de productos y prestación de servicios vendidos.
7|COSTOS DE PRODUCCIÓN O DE OPERACIÓN|Agrupa las cuentas que representan la acumulación de los costos incurridos en el proceso productivo o en la prestación del servicio durante un periodo, antes de su traslado al costo de ventas.
8|CUENTAS DE ORDEN DEUDORAS|Agrupa las cuentas que registran hechos o circunstancias que pueden llegar a afectar la estructura financiera del ente económico, así como el control interno y la información fiscal. No afectan los estados financieros básicos.
9|CUENTAS DE ORDEN ACREEDORAS|Agrupa las cuentas que registran compromisos o contratos que se relacionan con posibles obligaciones y que pueden llegar a afectar la estructura financiera del ente económico, así como el control interno y la información fiscal.
`)

/* ─────────────────────────── GRUPOS (2 dígitos) ─────────────────────────── */
D(`
11|DISPONIBLE|Recursos de liquidez inmediata con que cuenta el ente económico y que puede utilizar para fines generales o específicos.
12|INVERSIONES|Títulos valores y demás documentos a cargo de otros entes, conservados con el fin de obtener rentas fijas o variables, controlar otros entes o asegurar el mantenimiento de relaciones.
13|DEUDORES|Valor de las deudas a cargo de terceros y a favor del ente económico, incluidas las comerciales y no comerciales.
14|INVENTARIOS|Bienes corporales destinados a la venta en el curso normal de los negocios, los que se hallen en proceso de producción o los que se utilizarán en la producción o prestación de servicios.
15|PROPIEDADES, PLANTA Y EQUIPO|Activos tangibles adquiridos, construidos o en proceso, con la intención de emplearlos en forma permanente para la producción o suministro de bienes y servicios, y cuya vida útil excede de un año.
16|INTANGIBLES|Recursos obtenidos por un ente económico que, careciendo de naturaleza material, implican un derecho o privilegio oponible a terceros.
17|DIFERIDOS|Gastos pagados por anticipado y cargos diferidos que representan bienes o servicios recibidos, de los cuales se espera obtener beneficios económicos en periodos futuros.
18|OTROS ACTIVOS|Bienes y derechos que por su naturaleza no son clasificables en los demás grupos del activo.
19|VALORIZACIONES|Mayor valor de determinados activos frente a su costo neto en libros, establecido mediante avalúos técnicos o comparación con el valor intrínseco o de mercado.
21|OBLIGACIONES FINANCIERAS|Obligaciones contraídas por el ente económico con establecimientos de crédito u otras instituciones financieras del país o del exterior.
22|PROVEEDORES|Obligaciones a cargo del ente económico por la adquisición de bienes y servicios para la fabricación o comercialización de productos.
23|CUENTAS POR PAGAR|Obligaciones a cargo del ente económico originadas en operaciones distintas a la compra de bienes o servicios propios del giro del negocio.
24|IMPUESTOS, GRAVÁMENES Y TASAS|Obligaciones a favor del fisco nacional, departamental o municipal por concepto de impuestos, gravámenes y tasas de carácter obligatorio.
25|OBLIGACIONES LABORALES|Obligaciones a cargo del ente económico y a favor de los trabajadores originadas en la relación laboral vigente o en disposiciones legales.
26|PASIVOS ESTIMADOS Y PROVISIONES|Obligaciones a cargo del ente económico cuyo monto exacto o fecha de exigibilidad no se conoce con certeza, pero cuyo pago es probable.
27|DIFERIDOS|Ingresos recibidos por anticipado y demás partidas cuyo reconocimiento en resultados corresponde a periodos futuros.
28|OTROS PASIVOS|Obligaciones a cargo del ente económico que no son clasificables en los demás grupos del pasivo.
29|BONOS Y PAPELES COMERCIALES|Obligaciones representadas en títulos de deuda emitidos por el ente económico y colocados en el mercado de capitales.
31|CAPITAL SOCIAL|Valor total de los aportes iniciales y los posteriores aumentos o disminuciones que los socios, accionistas o el Estado ponen a disposición del ente económico.
32|SUPERÁVIT DE CAPITAL|Valor del mayor importe pagado sobre el valor nominal de los aportes, las donaciones y demás partidas que incrementan el patrimonio sin ser resultados.
33|RESERVAS|Valores apropiados de las utilidades líquidas por mandato legal, disposición estatutaria o decisión voluntaria del máximo órgano social.
34|REVALORIZACION DEL PATRIMONIO|Efecto sobre el patrimonio originado en la aplicación del sistema de ajustes integrales por inflación y el saneamiento fiscal.
35|DIVIDENDOS O PARTICIPACIONES DECRETADOS EN ACCIONES, CUOTAS O PARTES DE INTERÉS SOCIAL|Dividendos y participaciones decretados por el máximo órgano social que se pagarán en acciones, cuotas o partes de interés social.
36|RESULTADOS DEL EJERCICIO|Utilidad o pérdida obtenida por el ente económico al cierre del ejercicio contable.
37|RESULTADOS DE EJERCICIOS ANTERIORES|Utilidades acumuladas o pérdidas acumuladas de ejercicios anteriores que se encuentran pendientes de aplicación o enjugue.
38|SUPERÁVIT POR VALORIZACIONES|Contrapartida patrimonial de las valorizaciones registradas en el grupo 19.
41|OPERACIONALES|Ingresos provenientes de las transacciones que constituyen la actividad principal u objeto social del ente económico.
42|NO OPERACIONALES|Ingresos provenientes de transacciones diferentes a la actividad principal del ente económico.
47|AJUSTES POR INFLACION|Resultado neto del sistema de ajustes integrales por inflación, hoy suspendido para efectos contables y fiscales.
51|OPERACIONALES DE ADMINISTRACIÓN|Gastos ocasionados en el desarrollo del objeto social principal en el área administrativa del ente económico.
52|OPERACIONALES DE VENTAS|Gastos ocasionados en el desarrollo del objeto social principal en el área de comercialización, mercadeo y distribución.
53|NO OPERACIONALES|Gastos que no corresponden directamente a la actividad principal del ente económico, incluidos los financieros y extraordinarios.
54|IMPUESTO DE RENTA Y COMPLEMENTARIOS|Valor del impuesto de renta y complementarios a cargo del ente económico por el ejercicio gravable.
59|GANANCIAS Y PÉRDIDAS|Cuenta de cierre que resume el resultado del ejercicio antes de su traslado al patrimonio.
61|COSTO DE VENTAS Y DE PRESTACION DE SERVICIOS|Costo de los artículos vendidos y de los servicios prestados durante el ejercicio, clasificado por actividad económica.
62|COMPRAS|Valor de las adquisiciones de mercancías, materias primas y materiales, utilizado por entes que manejan inventario periódico.
71|MATERIA PRIMA|Costo de los materiales que se transforman e incorporan físicamente al producto terminado.
72|MANO DE OBRA DIRECTA|Costo de la remuneración y prestaciones del personal que interviene directamente en la transformación de la materia prima.
73|COSTOS INDIRECTOS|Costos que participan en el proceso productivo sin poder identificarse directamente con el producto, como mano de obra indirecta, materiales indirectos, depreciaciones y servicios.
74|CONTRATOS DE SERVICIOS|Costos acumulados en la ejecución de contratos de prestación de servicios.
81|DERECHOS CONTINGENTES|Hechos o circunstancias de los cuales pueden generarse derechos que afecten la estructura financiera del ente económico.
82|DEUDORAS FISCALES|Diferencias entre las cifras contables y las cifras fiscales que deben ser reveladas y controladas.
83|DEUDORAS DE CONTROL|Operaciones que requieren control interno o revelación, sin afectar los estados financieros básicos.
84|DERECHOS CONTINGENTES POR CONTRA|Contrapartida acreedora de las cuentas del grupo 81.|CR
85|DEUDORAS FISCALES POR CONTRA|Contrapartida acreedora de las cuentas del grupo 82.|CR
86|DEUDORAS DE CONTROL POR CONTRA|Contrapartida acreedora de las cuentas del grupo 83.|CR
91|RESPONSABILIDADES CONTINGENTES|Compromisos o contratos de los que pueden derivarse obligaciones a cargo del ente económico.
92|ACREEDORAS FISCALES|Diferencias de naturaleza acreedora entre las cifras contables y las fiscales.
93|ACREEDORAS DE CONTROL|Operaciones de naturaleza acreedora que requieren control interno o revelación.
94|RESPONSABILIDADES CONTINGENTES POR CONTRA|Contrapartida deudora de las cuentas del grupo 91.|DB
95|ACREEDORAS FISCALES POR CONTRA|Contrapartida deudora de las cuentas del grupo 92.|DB
96|ACREEDORAS DE CONTROL POR CONTRA|Contrapartida deudora de las cuentas del grupo 93.|DB
`)

/*
  ─────────────────────────── CUENTAS (4 dígitos) ───────────────────────────
  Códigos y nombres contrastados con el catálogo publicado en puc.com.co,
  clase por clase. Se conserva la escritura oficial, incluidos los distintivos
  (DB) y (CR) del propio decreto.
*/
D(`
1105|CAJA|Efectivo y cheques de propiedad del ente económico disponibles de forma inmediata, tanto en moneda nacional como extranjera.
1110|BANCOS|Depósitos constituidos por el ente económico en moneda nacional y extranjera en bancos del país y del exterior.
1115|REMESAS EN TRÁNSITO|Valor de los cheques y demás documentos girados sobre plazas distintas a la del domicilio, pendientes de abono en cuenta.
1120|CUENTAS DE AHORRO|Depósitos en cuentas de ahorro constituidos en bancos, corporaciones y demás entidades financieras.
1125|FONDOS|Recursos destinados a fines específicos como fondos rotatorios, de amortización o especiales.
1205|ACCIONES|Inversiones en títulos de participación adquiridos en sociedades por acciones.
1210|CUOTAS O PARTES DE INTERÉS SOCIAL|Inversiones en sociedades de personas representadas en cuotas o partes de interés social.
1215|BONOS|Inversiones en títulos de deuda emitidos por entidades públicas o privadas.
1220|CÉDULAS|Inversiones en cédulas hipotecarias o de capitalización.
1225|CERTIFICADOS|Inversiones en certificados de depósito a término, de cambio, de ahorro y similares.
1230|PAPELES COMERCIALES|Inversiones en títulos de deuda de corto plazo emitidos por sociedades.
1235|TÍTULOS|Inversiones en títulos de tesorería, de participación y demás títulos del mercado de valores.
1240|ACEPTACIONES BANCARIAS O FINANCIERAS|Inversiones en letras aceptadas por entidades bancarias o financieras.
1245|DERECHOS FIDUCIARIOS|Derechos derivados de la entrega de bienes o recursos a sociedades fiduciarias.
1250|DERECHOS DE RECOMPRA DE INVERSIONES NEGOCIADAS (REPOS)|Valor de las inversiones negociadas con pacto de recompra (operaciones repo).
1255|OBLIGATORIAS|Inversiones que el ente económico está obligado a mantener por disposición legal.
1260|CUENTAS EN PARTICIPACIÓN|Aportes entregados en desarrollo de contratos de cuentas en participación.
1295|OTRAS INVERSIONES|Inversiones no clasificables en las demás cuentas del grupo.
1299|PROVISIONES|Monto provisionado para cubrir la desvalorización de las inversiones.|CR
1305|CLIENTES|Valor de las deudas a cargo de terceros y a favor del ente económico originadas en la venta de bienes y servicios del giro ordinario.
1310|CUENTAS CORRIENTES COMERCIALES|Saldos a favor originados en relaciones comerciales de cuenta corriente con terceros.
1315|CUENTAS POR COBRAR A CASA MATRIZ|Derechos a favor del ente económico y a cargo de su casa matriz.
1320|CUENTAS POR COBRAR A VINCULADOS ECONÓMICOS|Derechos a cargo de filiales, subsidiarias y demás vinculados económicos.
1323|CUENTAS POR COBRAR A DIRECTORES|Derechos a cargo de directores, administradores y demás miembros de los órganos de dirección.
1325|CUENTAS POR COBRAR A SOCIOS Y ACCIONISTAS|Derechos a cargo de los socios o accionistas por conceptos distintos a aportes.
1328|APORTES POR COBRAR|Valor de los aportes suscritos por socios o accionistas pendientes de pago.
1330|ANTICIPOS Y AVANCES|Sumas entregadas anticipadamente a proveedores, contratistas y trabajadores, pendientes de legalizar.
1332|CUENTAS DE OPERACIÓN CONJUNTA|Derechos derivados de contratos de operación conjunta.
1335|DEPÓSITOS|Valores entregados en depósito o garantía a terceros para respaldar operaciones.
1340|PROMESAS DE COMPRA VENTA|Sumas entregadas en virtud de promesas de compraventa de bienes.
1345|INGRESOS POR COBRAR|Ingresos causados y pendientes de cobro como intereses, arrendamientos y dividendos.
1350|RETENCIÓN SOBRE CONTRATOS|Valores retenidos por los contratantes como garantía del cumplimiento de contratos.
1355|ANTICIPO DE IMPUESTOS Y CONTRIBUCIONES O SALDOS A FAVOR|Anticipos, retenciones practicadas al ente económico y saldos a favor en impuestos.
1360|RECLAMACIONES|Valor de las reclamaciones presentadas a compañías aseguradoras, transportadores y otros terceros.
1365|CUENTAS POR COBRAR A TRABAJADORES|Préstamos y demás derechos a cargo de los trabajadores del ente económico.
1370|PRÉSTAMOS A PARTICULARES|Préstamos concedidos a personas naturales o jurídicas ajenas al giro del negocio.
1380|DEUDORES VARIOS|Derechos a favor del ente económico no clasificables en las demás cuentas del grupo.
1385|DERECHOS DE RECOMPRA DE CARTERA NEGOCIADA|Valor de la cartera negociada con pacto de recompra.
1390|DEUDAS DE DIFÍCIL COBRO|Cuentas por cobrar vencidas cuya recuperación se considera dudosa.
1399|PROVISIONES|Monto provisionado para cubrir la desvalorización de las inversiones.|CR
1405|MATERIAS PRIMAS|Costo de los materiales adquiridos para ser transformados en el proceso productivo.
1410|PRODUCTOS EN PROCESO|Costo acumulado de los productos que se encuentran en proceso de transformación.
1415|OBRAS DE CONSTRUCCIÓN EN CURSO|Costos acumulados en obras de construcción que se adelantan para la venta.
1417|OBRAS DE URBANISMO|Costos incurridos en obras de urbanismo de terrenos destinados a la venta.
1420|CONTRATOS EN EJECUCIÓN|Costos acumulados en contratos de obra o servicio en ejecución.
1425|CULTIVOS EN DESARROLLO|Costos acumulados en cultivos que aún no se encuentran en etapa productiva.
1428|PLANTACIONES AGRÍCOLAS|Costo de las plantaciones agrícolas destinadas a la venta.
1430|PRODUCTOS TERMINADOS|Costo de los artículos fabricados por el ente económico y disponibles para la venta.
1435|MERCANCÍAS NO FABRICADAS POR LA EMPRESA|Costo de las mercancías adquiridas para ser vendidas sin someterlas a transformación.
1440|BIENES RAÍCES PARA LA VENTA|Costo de los inmuebles adquiridos o construidos con destino a la venta.
1445|SEMOVIENTES|Costo de los animales destinados a la venta.
1450|TERRENOS|Costo de los terrenos adquiridos con el propósito de venderlos.
1455|MATERIALES, REPUESTOS Y ACCESORIOS|Costo de los elementos destinados al mantenimiento y consumo, no incorporados directamente al producto.
1460|ENVASES Y EMPAQUES|Costo de los envases y empaques adquiridos para la comercialización de los productos.
1465|INVENTARIOS EN TRÁNSITO|Costo de los inventarios adquiridos que se encuentran en tránsito hacia la bodega.
1499|PROVISIONES|Monto provisionado para cubrir la desvalorización de las inversiones.|CR
1504|TERRENOS|Costo de los terrenos adquiridos con el propósito de venderlos.
1506|MATERIALES PROYECTOS PETROLEROS|Costo de los materiales destinados a proyectos de exploración y explotación petrolera.
1508|CONSTRUCCIONES EN CURSO|Costo acumulado de las obras en proceso de construcción para uso del ente económico.
1512|MAQUINARIA Y EQUIPOS EN MONTAJE|Costo de la maquinaria y equipos en proceso de instalación o montaje.
1516|CONSTRUCCIONES Y EDIFICACIONES|Costo de las edificaciones destinadas al uso del ente económico.
1520|MAQUINARIA Y EQUIPO|Costo de la maquinaria y equipo empleados en la producción de bienes y servicios.
1524|EQUIPO DE OFICINA|Costo de los muebles, enseres y equipos utilizados en las áreas administrativas y operativas.
1528|EQUIPO DE COMPUTACIÓN Y COMUNICACIÓN|Costo de los equipos de procesamiento de datos y de comunicaciones.
1532|EQUIPO MÉDICO-CIENTÍFICO|Costo de los equipos destinados a actividades médicas, odontológicas y científicas.
1536|EQUIPO DE HOTELES Y RESTAURANTES|Costo de los equipos destinados a la prestación de servicios de hotelería y restaurante.
1540|FLOTA Y EQUIPO DE TRANSPORTE|Costo de los vehículos utilizados en el transporte de bienes, personal o productos.
1544|FLOTA Y EQUIPO FLUVIAL Y/O MARÍTIMO|Costo de las embarcaciones destinadas al transporte fluvial o marítimo.
1548|FLOTA Y EQUIPO AÉREO|Costo de las aeronaves destinadas al transporte aéreo.
1552|FLOTA Y EQUIPO FÉRREO|Costo del equipo destinado al transporte férreo.
1556|ACUEDUCTOS, PLANTAS Y REDES|Costo de las plantas, redes y líneas destinadas a la prestación de servicios públicos.
1560|ARMAMENTO DE VIGILANCIA|Costo del armamento destinado a la vigilancia y seguridad.
1562|ENVASES Y EMPAQUES|Costo de los envases y empaques adquiridos para la comercialización de los productos.
1564|PLANTACIONES AGRÍCOLAS Y FORESTALES|Costo de las plantaciones destinadas a la explotación permanente.
1568|VÍAS DE COMUNICACIÓN|Costo de las vías construidas para uso del ente económico.
1572|MINAS Y CANTERAS|Costo de las minas y canteras objeto de explotación.
1576|POZOS ARTESIANOS|Costo de los pozos construidos para el abastecimiento de agua.
1580|YACIMIENTOS|Costo de los yacimientos de recursos naturales no renovables.
1584|SEMOVIENTES|Costo de los animales destinados a la venta.
1588|PROPIEDADES, PLANTA Y EQUIPO EN TRÁNSITO|Costo de los bienes adquiridos que se encuentran en tránsito.
1592|DEPRECIACIÓN ACUMULADA|Monto acumulado de la distribución sistemática del costo de los activos depreciables durante su vida útil.|CR
1596|DEPRECIACIÓN DIFERIDA|Diferencia entre la depreciación contable y la solicitada fiscalmente por sistemas de reconocido valor técnico.
1597|AMORTIZACIÓN ACUMULADA|Monto acumulado de la amortización de bienes de propiedad, planta y equipo sujetos a este sistema.|CR
1598|AGOTAMIENTO ACUMULADO|Monto acumulado del agotamiento de los recursos naturales explotados.|CR
1599|PROVISIONES|Monto provisionado para cubrir la desvalorización de las inversiones.|CR
1605|CRÉDITO MERCANTIL|Valor adicional pagado en la compra de un ente económico sobre el valor en libros de su patrimonio.
1610|MARCAS|Costo de adquisición o desarrollo de los signos distintivos de los productos o servicios.
1615|PATENTES|Costo de los derechos de explotación exclusiva sobre invenciones.
1620|CONCESIONES Y FRANQUICIAS|Costo de los derechos otorgados por el Estado o por particulares para explotar bienes o marcas.
1625|DERECHOS|Costo de los derechos adquiridos sobre bienes o contratos, incluidos los de arrendamiento financiero.
1630|KNOW HOW|Valor del conocimiento técnico o experiencia acumulada adquirido por el ente económico.
1635|LICENCIAS|Costo de las licencias de uso de programas de computador y otros derechos similares.
1698|DEPRECIACIÓN Y/O AMORTIZACIÓN ACUMULADA|Monto acumulado de la amortización de los activos intangibles.|CR
1699|PROVISIONES|Monto provisionado para cubrir la desvalorización de las inversiones.|CR
1705|GASTOS PAGADOS POR ANTICIPADO|Valor de los gastos pagados por anticipado como seguros, arrendamientos e intereses.
1710|CARGOS DIFERIDOS|Costos y gastos que benefician periodos futuros, como organización, preoperativos y mejoras a propiedades ajenas.
1715|COSTOS DE EXPLORACIÓN POR AMORTIZAR|Costos incurridos en actividades de exploración pendientes de amortizar.
1720|COSTOS DE EXPLOTACIÓN Y DESARROLLO|Costos incurridos en la explotación y desarrollo de recursos naturales.
1730|CARGOS POR CORRECCIÓN MONETARIA DIFERIDA|Ajustes por inflación diferidos originados en obras en construcción y cargos similares.
1798|AMORTIZACIÓN ACUMULADA|Monto acumulado de la amortización de bienes de propiedad, planta y equipo sujetos a este sistema.|CR
1805|BIENES DE ARTE Y CULTURA|Costo de obras de arte, biblioteca y demás bienes de valor cultural.
1895|DIVERSOS|Otros activos no clasificables en las demás cuentas del grupo.
1899|PROVISIONES|Monto provisionado para cubrir la desvalorización de las inversiones.|CR
1905|DE INVERSIONES|Mayor valor de las inversiones frente a su costo ajustado en libros.
1910|DE PROPIEDADES, PLANTA Y EQUIPO|Mayor valor de la propiedad, planta y equipo determinado mediante avalúo técnico.
1995|DE OTROS ACTIVOS|Mayor valor de otros activos frente a su costo en libros.
2105|BANCOS NACIONALES|Obligaciones contraídas con bancos del país por préstamos, sobregiros y demás modalidades de crédito.
2110|BANCOS DEL EXTERIOR|Obligaciones contraídas con bancos del exterior.
2115|CORPORACIONES FINANCIERAS|Obligaciones contraídas con corporaciones financieras del país.
2120|COMPAÑÍAS DE FINANCIAMIENTO COMERCIAL|Obligaciones contraídas con compañías de financiamiento comercial, incluidos los contratos de leasing.
2125|CORPORACIONES DE AHORRO Y VIVIENDA|Obligaciones contraídas con corporaciones de ahorro y vivienda.
2130|ENTIDADES FINANCIERAS DEL EXTERIOR|Obligaciones contraídas con entidades financieras domiciliadas en el exterior.
2135|COMPROMISOS DE RECOMPRA DE INVERSIONES NEGOCIADAS|Obligación de recomprar inversiones negociadas con pacto de recompra.
2140|COMPROMISOS DE RECOMPRA DE CARTERA NEGOCIADA|Obligación de recomprar cartera negociada con pacto de recompra.
2145|OBLIGACIONES GUBERNAMENTALES|Obligaciones contraídas con entidades gubernamentales de fomento y desarrollo.
2195|OTRAS OBLIGACIONES|Obligaciones financieras no clasificables en las demás cuentas del grupo.
2205|NACIONALES|Obligaciones a favor de proveedores del país por la adquisición de bienes y servicios del giro del negocio.
2210|DEL EXTERIOR|Obligaciones a favor de proveedores domiciliados en el exterior.
2215|CUENTAS CORRIENTES COMERCIALES|Saldos a favor originados en relaciones comerciales de cuenta corriente con terceros.
2220|CASA MATRIZ|Obligaciones a favor de la casa matriz por adquisición de bienes y servicios.
2225|COMPAÑÍAS VINCULADAS|Obligaciones a favor de filiales, subsidiarias y demás vinculados económicos.
2305|CUENTAS CORRIENTES COMERCIALES|Saldos a favor originados en relaciones comerciales de cuenta corriente con terceros.
2310|A CASA MATRIZ|Obligaciones a favor de la casa matriz por conceptos distintos a proveedores.
2315|A COMPAÑÍAS VINCULADAS|Obligaciones a favor de compañías vinculadas por conceptos distintos a proveedores.
2320|A CONTRATISTAS|Obligaciones a favor de contratistas por obras y servicios ejecutados.
2330|ÓRDENES DE COMPRA POR UTILIZAR|Valor de las órdenes de compra pendientes de utilizar.
2335|COSTOS Y GASTOS POR PAGAR|Costos y gastos causados pendientes de pago, como honorarios, servicios y arrendamientos.
2340|INSTALAMENTOS POR PAGAR|Cuotas pendientes de pago por adquisición de bienes a plazos.
2345|ACREEDORES OFICIALES|Obligaciones a favor de entidades oficiales por conceptos distintos a impuestos.
2350|REGALÍAS POR PAGAR|Obligaciones por concepto de regalías causadas y pendientes de pago.
2355|DEUDAS CON ACCIONISTAS O SOCIOS|Obligaciones a favor de los socios o accionistas por conceptos distintos a dividendos.
2357|DEUDAS CON DIRECTORES|Obligaciones a favor de los directores y administradores del ente económico.
2360|DIVIDENDOS O PARTICIPACIONES POR PAGAR|Dividendos o participaciones decretados en efectivo y pendientes de pago.
2365|RETENCIÓN EN LA FUENTE|Valor de las retenciones practicadas por el ente económico como agente retenedor del impuesto de renta.
2367|IMPUESTO A LAS VENTAS RETENIDO|Valor del IVA retenido por el ente económico en calidad de agente de retención (reteiva).
2368|IMPUESTO DE INDUSTRIA Y COMERCIO RETENIDO|Valor del impuesto de industria y comercio retenido por el ente económico (reteica).
2370|RETENCIONES Y APORTES DE NÓMINA|Valor de los descuentos de nómina y aportes al sistema de seguridad social y parafiscales pendientes de pago.
2375|CUOTAS POR DEVOLVER|Valor de las cuotas o aportes pendientes de devolver a terceros.
2380|ACREEDORES VARIOS|Obligaciones a favor de terceros no clasificables en las demás cuentas del grupo.
2404|DE RENTA Y COMPLEMENTARIOS|Saldo por pagar del impuesto de renta y complementarios del ejercicio.
2408|IMPUESTO SOBRE LAS VENTAS POR PAGAR|Saldo a favor del fisco por concepto del IVA generado menos el IVA descontable del periodo.
2412|DE INDUSTRIA Y COMERCIO|Impuesto de industria y comercio, avisos y tableros por pagar a los municipios.
2416|A LA PROPIEDAD RAÍZ|Impuesto predial y complementarios causados y pendientes de pago.
2420|DERECHOS SOBRE INSTRUMENTOS PÚBLICOS|Derechos causados por el registro de instrumentos públicos.
2424|DE VALORIZACIÓN|Contribución de valorización causada y pendiente de pago.
2428|DE TURISMO|Contribución parafiscal para la promoción del turismo.
2432|TASA POR UTILIZACIÓN DE PUERTOS|Tasas causadas por el uso de instalaciones portuarias.
2436|DE VEHÍCULOS|Impuesto sobre vehículos automotores causado y pendiente de pago.
2440|DE ESPECTÁCULOS PÚBLICOS|Impuesto sobre espectáculos públicos causado y pendiente de pago.
2444|DE HIDROCARBUROS Y MINAS|Impuestos causados por la explotación de hidrocarburos y minas.
2448|REGALÍAS E IMPUESTOS A LA PEQUEÑA Y MEDIANA MINERÍA|Regalías e impuestos causados por la actividad de la pequeña y mediana minería.
2452|A LAS EXPORTACIONES CAFETERAS|Impuestos causados sobre las exportaciones de café.
2456|A LAS IMPORTACIONES|Gravámenes arancelarios causados en las importaciones.
2460|CUOTAS DE FOMENTO|Contribuciones parafiscales de fomento sectorial.
2464|DE LICORES, CERVEZAS Y CIGARRILLOS|Impuestos al consumo de licores, cervezas y cigarrillos.
2468|AL SACRIFICIO DE GANADO|Impuesto causado por el sacrificio de ganado.
2472|AL AZAR Y JUEGOS|Impuestos causados sobre juegos de azar, rifas y apuestas.
2476|GRAVÁMENES Y REGALÍAS POR UTILIZACIÓN DEL SUELO|Gravámenes y regalías causados por la utilización del suelo.
2495|OTROS|Impuestos, gravámenes y tasas no clasificables en las demás cuentas del grupo.
2505|SALARIOS POR PAGAR|Valor de los salarios causados y pendientes de pago a los trabajadores.
2510|CESANTÍAS CONSOLIDADAS|Valor de las cesantías causadas a favor de los trabajadores.
2515|INTERESES SOBRE CESANTÍAS|Valor de los intereses sobre cesantías causados a favor de los trabajadores.
2520|PRIMA DE SERVICIOS|Valor de la prima legal de servicios causada y pendiente de pago.
2525|VACACIONES CONSOLIDADAS|Valor de las vacaciones causadas a favor de los trabajadores.
2530|PRESTACIONES EXTRALEGALES|Valor de las prestaciones pactadas convencional o voluntariamente.
2532|PENSIONES POR PAGAR|Mesadas pensionales causadas y pendientes de pago.
2535|CUOTAS PARTES PENSIONES DE JUBILACIÓN|Valor de las cuotas partes pensionales a cargo del ente económico.
2540|INDEMNIZACIONES LABORALES|Valor de las indemnizaciones causadas a favor de los trabajadores.
2605|PARA COSTOS Y GASTOS|Estimación de costos y gastos causados pendientes de determinación exacta.
2610|PARA OBLIGACIONES LABORALES|Estimación de obligaciones laborales pendientes de liquidación definitiva.
2615|PARA OBLIGACIONES FISCALES|Estimación de las obligaciones fiscales a cargo del ente económico.
2620|PENSIONES DE JUBILACIÓN|Valor del cálculo actuarial de las pensiones a cargo del ente económico.
2625|PARA OBRAS DE URBANISMO|Estimación de los costos pendientes en obras de urbanismo.
2630|PARA MANTENIMIENTO Y REPARACIONES|Estimación de los costos de mantenimiento y reparaciones programadas.
2635|PARA CONTINGENCIAS|Estimación de pérdidas probables por litigios, demandas y contingencias.
2640|PARA OBLIGACIONES DE GARANTÍAS|Estimación de los costos por garantías otorgadas sobre productos vendidos.
2695|PROVISIONES DIVERSAS|Otras provisiones no clasificables en las demás cuentas del grupo.
2705|INGRESOS RECIBIDOS POR ANTICIPADO|Valor de los ingresos recibidos que corresponden a periodos futuros.
2710|ABONOS DIFERIDOS|Utilidades diferidas originadas en ventas a plazos y operaciones similares.
2715|UTILIDAD DIFERIDA EN VENTAS A PLAZOS|Utilidad diferida originada en ventas a plazos, que se reconoce a medida que se recauda.
2720|CRÉDITO POR CORRECCIÓN MONETARIA DIFERIDA|Ajuste por inflación diferido de naturaleza crédito, pendiente de aplicar a resultados.
2725|IMPUESTOS DIFERIDOS|Impuesto de renta diferido por pagar originado en diferencias temporales.
2805|ANTICIPOS Y AVANCES RECIBIDOS|Sumas recibidas de clientes a cuenta de futuras ventas o servicios.
2810|DEPÓSITOS RECIBIDOS|Valores recibidos de terceros en calidad de depósito o garantía.
2815|INGRESOS RECIBIDOS PARA TERCEROS|Valores recaudados por cuenta de terceros pendientes de entrega.
2820|CUENTAS DE OPERACIÓN CONJUNTA|Derechos derivados de contratos de operación conjunta.
2825|RETENCIONES A TERCEROS SOBRE CONTRATOS|Valores retenidos a contratistas como garantía de cumplimiento.
2830|EMBARGOS JUDICIALES|Valores retenidos por orden de autoridad judicial.
2835|ACREEDORES DEL SISTEMA|Obligaciones con acreedores registradas mediante sistemas de información específicos.
2840|CUENTAS EN PARTICIPACIÓN|Aportes entregados en desarrollo de contratos de cuentas en participación.
2895|DIVERSOS|Otros activos no clasificables en las demás cuentas del grupo.
2905|BONOS EN CIRCULACIÓN|Valor nominal de los bonos emitidos y colocados pendientes de redención.
2910|BONOS OBLIGATORIAMENTE CONVERTIBLES EN ACCIONES|Valor de los bonos que deben convertirse en acciones al vencimiento.
2915|PAPELES COMERCIALES|Inversiones en títulos de deuda de corto plazo emitidos por sociedades.
2920|BONOS PENSIONALES|Valor de los bonos pensionales a cargo del ente económico.
2925|TÍTULOS PENSIONALES|Valor de los títulos pensionales a cargo del ente económico.
3105|CAPITAL SUSCRITO Y PAGADO|Valor del capital suscrito por los accionistas y efectivamente pagado en sociedades por acciones.
3115|APORTES SOCIALES|Valor de los aportes efectuados por los socios en sociedades de personas y entidades cooperativas.
3120|CAPITAL ASIGNADO|Valor asignado por la casa matriz a las sucursales de sociedades extranjeras.
3125|INVERSIÓN SUPLEMENTARIA AL CAPITAL ASIGNADO|Inversión adicional que la casa matriz destina a su sucursal, sin formar parte del capital asignado.
3130|CAPITAL DE PERSONAS NATURALES|Valor de los recursos aportados por el comerciante persona natural.
3135|APORTES DEL ESTADO|Valor de los aportes efectuados por el Estado en empresas oficiales y de economía mixta.
3140|FONDO SOCIAL|Valor de los aportes de las entidades sin ánimo de lucro.
3205|PRIMA EN COLOCACIÓN DE ACCIONES, CUOTAS O PARTES DE INTERÉS SOCIAL|Mayor valor pagado sobre el valor nominal de las acciones, cuotas o partes de interés.
3210|DONACIONES|Valor de los bienes y recursos recibidos a título gratuito.
3215|CRÉDITO MERCANTIL|Valor adicional pagado en la compra de un ente económico sobre el valor en libros de su patrimonio.
3220|KNOW HOW|Valor del conocimiento técnico o experiencia acumulada adquirido por el ente económico.
3225|SUPERÁVIT MÉTODO DE PARTICIPACIÓN|Variaciones patrimoniales de las subordinadas reconocidas por el método de participación.
3305|RESERVAS OBLIGATORIAS|Apropiaciones de utilidades exigidas por la ley, como la reserva legal.
3310|RESERVAS ESTATUTARIAS|Apropiaciones de utilidades ordenadas por los estatutos sociales.
3315|RESERVAS OCASIONALES|Apropiaciones de utilidades decididas voluntariamente por el máximo órgano social.
3405|AJUSTES POR INFLACIÓN|Efecto patrimonial acumulado del sistema de ajustes integrales por inflación.
3410|SANEAMIENTO FISCAL|Efecto patrimonial del saneamiento fiscal de activos.
3415|AJUSTES POR INFLACIÓN DECRETO 3019 DE 1989|Efecto patrimonial de los ajustes por inflación aplicados bajo el Decreto 3019 de 1989.
3505|DIVIDENDOS DECRETADOS EN ACCIONES|Dividendos decretados que se pagarán mediante la emisión de acciones.
3510|PARTICIPACIONES DECRETADAS EN CUOTAS O PARTES DE INTERÉS SOCIAL|Participaciones decretadas que se pagarán en cuotas o partes de interés social.
3605|UTILIDAD DEL EJERCICIO|Resultado positivo obtenido por el ente económico al cierre del ejercicio.
3610|PÉRDIDA DEL EJERCICIO|Resultado negativo obtenido por el ente económico al cierre del ejercicio.|DB
3705|UTILIDADES ACUMULADAS|Utilidades de ejercicios anteriores pendientes de distribución o capitalización.
3710|PÉRDIDAS ACUMULADAS|Pérdidas de ejercicios anteriores pendientes de enjugar.|DB
3805|DE INVERSIONES|Mayor valor de las inversiones frente a su costo ajustado en libros.
3810|DE PROPIEDADES, PLANTA Y EQUIPO|Mayor valor de la propiedad, planta y equipo determinado mediante avalúo técnico.
3895|DE OTROS ACTIVOS|Mayor valor de otros activos frente a su costo en libros.
4105|AGRICULTURA, GANADERÍA, CAZA Y SILVICULTURA|Ingresos operacionales provenientes de actividades agrícolas, pecuarias, de caza y silvicultura.
4110|PESCA|Ingresos operacionales provenientes de la pesca y la acuicultura.
4115|EXPLOTACIÓN DE MINAS Y CANTERAS|Ingresos operacionales provenientes de la extracción de minerales e hidrocarburos.
4120|INDUSTRIAS MANUFACTURERAS|Ingresos operacionales provenientes de la transformación industrial de bienes.
4125|SUMINISTRO DE ELECTRICIDAD, GAS Y AGUA|Ingresos operacionales por la generación y distribución de servicios públicos domiciliarios.
4130|CONSTRUCCIÓN|Ingresos operacionales provenientes de la actividad de construcción y obras civiles.
4135|COMERCIO AL POR MAYOR Y AL POR MENOR|Ingresos operacionales provenientes de la compraventa de mercancías sin transformación.
4140|HOTELES Y RESTAURANTES|Ingresos operacionales por servicios de alojamiento, comida y bebidas.
4145|TRANSPORTE, ALMACENAMIENTO Y COMUNICACIONES|Ingresos operacionales por servicios de transporte, almacenamiento y telecomunicaciones.
4150|ACTIVIDAD FINANCIERA|Ingresos operacionales de entidades cuya actividad principal es la intermediación financiera.
4155|ACTIVIDADES INMOBILIARIAS, EMPRESARIALES Y DE ALQUILER|Ingresos operacionales por servicios inmobiliarios, empresariales, de consultoría y alquiler.
4160|ENSEÑANZA|Ingresos operacionales por servicios de educación formal y no formal.
4165|SERVICIOS SOCIALES Y DE SALUD|Ingresos operacionales por servicios de salud y asistencia social.
4170|OTRAS ACTIVIDADES DE SERVICIOS COMUNITARIOS, SOCIALES Y PERSONALES|Ingresos operacionales por servicios comunitarios, culturales, deportivos y personales.
4175|DEVOLUCIONES EN VENTAS (DB)|Valor de las devoluciones, rebajas y descuentos en ventas, que disminuye el ingreso operacional.|DB
4205|OTRAS VENTAS|Ingresos por ventas de bienes distintos a los del objeto social.
4210|FINANCIEROS|Ingresos por intereses, descuentos y demás rendimientos financieros.
4215|DIVIDENDOS Y PARTICIPACIONES|Ingresos por dividendos y participaciones decretados a favor del ente económico.
4218|INGRESOS MÉTODO DE PARTICIPACIÓN|Ingresos reconocidos por la aplicación del método de participación patrimonial.
4220|ARRENDAMIENTOS|Ingresos por el alquiler de bienes ajenos al giro ordinario del negocio.
4225|COMISIONES|Ingresos por comisiones no operacionales.
4230|HONORARIOS|Ingresos por honorarios no operacionales.
4235|SERVICIOS|Ingresos por servicios prestados de manera ocasional.
4240|UTILIDAD EN VENTA DE INVERSIONES|Ganancia obtenida en la enajenación de inversiones.
4245|UTILIDAD EN VENTA DE PROPIEDADES, PLANTA Y EQUIPO|Ganancia obtenida en la enajenación de propiedad, planta y equipo.
4248|UTILIDAD EN VENTA DE OTROS BIENES|Ganancia obtenida en la enajenación de otros bienes.
4250|RECUPERACIONES|Ingresos por recuperación de provisiones, deducciones, castigos y gastos de ejercicios anteriores.
4255|INDEMNIZACIONES|Ingresos por indemnizaciones recibidas de compañías de seguros y terceros.
4260|PARTICIPACIONES EN CONCESIONES|Ingresos derivados de la participación en contratos de concesión.
4265|INGRESOS DE EJERCICIOS ANTERIORES|Ingresos correspondientes a ejercicios anteriores reconocidos en el periodo.
4275|DEVOLUCIONES EN OTRAS VENTAS (DB)|Devoluciones, rebajas y descuentos sobre otras ventas.|DB
4295|DIVERSOS|Otros activos no clasificables en las demás cuentas del grupo.
4705|CORRECCIÓN MONETARIA|Resultado neto de los ajustes integrales por inflación del ejercicio.
5105|GASTOS DE PERSONAL|Salarios, prestaciones sociales, aportes y demás pagos laborales del área administrativa.
5110|HONORARIOS|Ingresos por honorarios no operacionales.
5115|IMPUESTOS|Impuestos, tasas y contribuciones no recuperables asumidos por el área administrativa.
5120|ARRENDAMIENTOS|Ingresos por el alquiler de bienes ajenos al giro ordinario del negocio.
5125|CONTRIBUCIONES Y AFILIACIONES|Aportes a gremios, entidades de vigilancia y afiliaciones del área administrativa.
5130|SEGUROS|Primas de seguros que amparan bienes y riesgos del área administrativa.
5135|SERVICIOS|Ingresos por servicios prestados de manera ocasional.
5140|GASTOS LEGALES|Gastos notariales, de registro, trámites y licencias del área administrativa.
5145|MANTENIMIENTO Y REPARACIONES|Gastos de conservación y reparación de bienes del área administrativa.
5150|ADECUACIÓN E INSTALACIÓN|Gastos de instalación, montaje y adecuación de bienes del área administrativa.
5155|GASTOS DE VIAJE|Gastos de alojamiento, manutención y transporte del personal administrativo en comisión.
5160|DEPRECIACIONES|Gasto por depreciación de los bienes asignados al área administrativa.
5165|AMORTIZACIONES|Gasto por amortización de intangibles y diferidos del área administrativa.
5195|DIVERSOS|Otros activos no clasificables en las demás cuentas del grupo.
5199|PROVISIONES|Monto provisionado para cubrir la desvalorización de las inversiones.
5205|GASTOS DE PERSONAL|Salarios, prestaciones sociales, aportes y demás pagos laborales del área administrativa.
5210|HONORARIOS|Ingresos por honorarios no operacionales.
5215|IMPUESTOS|Impuestos, tasas y contribuciones no recuperables asumidos por el área administrativa.
5220|ARRENDAMIENTOS|Ingresos por el alquiler de bienes ajenos al giro ordinario del negocio.
5225|CONTRIBUCIONES Y AFILIACIONES|Aportes a gremios, entidades de vigilancia y afiliaciones del área administrativa.
5230|SEGUROS|Primas de seguros que amparan bienes y riesgos del área administrativa.
5235|SERVICIOS|Ingresos por servicios prestados de manera ocasional.
5240|GASTOS LEGALES|Gastos notariales, de registro, trámites y licencias del área administrativa.
5245|MANTENIMIENTO Y REPARACIONES|Gastos de conservación y reparación de bienes del área administrativa.
5250|ADECUACIÓN E INSTALACIÓN|Gastos de instalación, montaje y adecuación de bienes del área administrativa.
5255|GASTOS DE VIAJE|Gastos de alojamiento, manutención y transporte del personal administrativo en comisión.
5260|DEPRECIACIONES|Gasto por depreciación de los bienes asignados al área administrativa.
5265|AMORTIZACIONES|Gasto por amortización de intangibles y diferidos del área administrativa.
5270|FINANCIEROS-REAJUSTE DEL SISTEMA|Gastos financieros originados en el reajuste del sistema de valor constante.
5275|PÉRDIDAS MÉTODO DE PARTICIPACIÓN|Pérdidas reconocidas por la aplicación del método de participación patrimonial.
5295|DIVERSOS|Otros activos no clasificables en las demás cuentas del grupo.
5299|PROVISIONES|Monto provisionado para cubrir la desvalorización de las inversiones.
5305|FINANCIEROS|Ingresos por intereses, descuentos y demás rendimientos financieros.
5310|PÉRDIDA EN VENTA Y RETIRO DE BIENES|Pérdida originada en la venta, retiro o baja de bienes.
5313|PÉRDIDAS MÉTODO DE PARTICIPACIÓN|Pérdidas reconocidas por la aplicación del método de participación patrimonial.
5315|GASTOS EXTRAORDINARIOS|Gastos originados en hechos ajenos a la actividad normal del ente económico.
5395|GASTOS DIVERSOS|Gastos no operacionales no clasificables en las demás cuentas del grupo.
5405|IMPUESTO DE RENTA Y COMPLEMENTARIOS|Valor del impuesto de renta y complementarios causado en el ejercicio.
5905|GANANCIAS Y PÉRDIDAS|Cuenta de cierre donde se cancelan ingresos, costos y gastos para determinar el resultado.
6105|AGRICULTURA, GANADERÍA, CAZA Y SILVICULTURA|Ingresos operacionales provenientes de actividades agrícolas, pecuarias, de caza y silvicultura.
6110|PESCA|Ingresos operacionales provenientes de la pesca y la acuicultura.
6115|EXPLOTACIÓN DE MINAS Y CANTERAS|Ingresos operacionales provenientes de la extracción de minerales e hidrocarburos.
6120|INDUSTRIAS MANUFACTURERAS|Ingresos operacionales provenientes de la transformación industrial de bienes.
6125|SUMINISTRO DE ELECTRICIDAD, GAS Y AGUA|Ingresos operacionales por la generación y distribución de servicios públicos domiciliarios.
6130|CONSTRUCCIÓN|Ingresos operacionales provenientes de la actividad de construcción y obras civiles.
6135|COMERCIO AL POR MAYOR Y AL POR MENOR|Ingresos operacionales provenientes de la compraventa de mercancías sin transformación.
6140|HOTELES Y RESTAURANTES|Ingresos operacionales por servicios de alojamiento, comida y bebidas.
6145|TRANSPORTE, ALMACENAMIENTO Y COMUNICACIONES|Ingresos operacionales por servicios de transporte, almacenamiento y telecomunicaciones.
6150|ACTIVIDAD FINANCIERA|Ingresos operacionales de entidades cuya actividad principal es la intermediación financiera.
6155|ACTIVIDADES INMOBILIARIAS, EMPRESARIALES Y DE ALQUILER|Ingresos operacionales por servicios inmobiliarios, empresariales, de consultoría y alquiler.
6160|ENSEÑANZA|Ingresos operacionales por servicios de educación formal y no formal.
6165|SERVICIOS SOCIALES Y DE SALUD|Ingresos operacionales por servicios de salud y asistencia social.
6170|OTRAS ACTIVIDADES DE SERVICIOS COMUNITARIOS, SOCIALES Y PERSONALES|Ingresos operacionales por servicios comunitarios, culturales, deportivos y personales.
6205|DE MERCANCÍAS|Valor de las mercancías adquiridas para la venta, bajo el sistema de inventario periódico.
6210|DE MATERIAS PRIMAS|Valor de las materias primas adquiridas, bajo el sistema de inventario periódico.
6215|DE MATERIALES INDIRECTOS|Valor de los materiales indirectos adquiridos para el proceso productivo.
6220|COMPRA DE ENERGÍA|Valor de la energía adquirida para su comercialización o para el proceso productivo.
6225|DEVOLUCIONES EN COMPRAS (CR)|Valor de las devoluciones, rebajas y descuentos en compras.|CR
7105|MATERIA PRIMA|Costo de los materiales consumidos y transformados en el proceso productivo del periodo.
7205|MANO DE OBRA DIRECTA|Costo de la remuneración y prestaciones del personal que interviene directamente en la producción.
7305|COSTOS INDIRECTOS|Costos de mano de obra indirecta, materiales indirectos, servicios, depreciaciones y demás cargos aplicables a la producción.
7405|CONTRATOS DE SERVICIOS|Costos acumulados en la ejecución de contratos de prestación de servicios.
8105|BIENES Y VALORES ENTREGADOS EN CUSTODIA|Control de los bienes y valores del ente económico entregados a terceros en custodia.
8110|BIENES Y VALORES ENTREGADOS EN GARANTÍA|Control de los bienes y valores entregados para respaldar obligaciones.
8115|BIENES Y VALORES EN PODER DE TERCEROS|Control de los bienes de propiedad del ente económico que están en poder de terceros.
8120|LITIGIOS Y/O DEMANDAS|Control de los litigios y demandas instaurados por el ente económico a su favor.
8125|PROMESAS DE COMPRAVENTA|Sumas entregadas en virtud de promesas de compraventa de bienes.
8195|DIVERSAS|Otros derechos contingentes no clasificables en las demás cuentas del grupo.
8305|BIENES RECIBIDOS EN ARRENDAMIENTO FINANCIERO|Control de los bienes tomados en arrendamiento financiero.
8310|TÍTULOS DE INVERSIÓN NO COLOCADOS|Control de los títulos de inversión emitidos y aún no colocados en el mercado.
8315|PROPIEDADES, PLANTA Y EQUIPO TOTALMENTE DEPRECIADOS, AGOTADOS Y/O AMORTIZADOS|Control de los activos que siguen en uso y ya están totalmente depreciados, agotados o amortizados.
8320|CRÉDITOS A FAVOR NO UTILIZADOS|Control de los cupos de crédito aprobados a favor del ente económico y no utilizados.
8325|ACTIVOS CASTIGADOS|Control de los activos castigados contablemente sobre los que se conserva el derecho de cobro.
8330|TÍTULOS DE INVERSIÓN AMORTIZADOS|Control de los títulos de inversión que ya fueron amortizados.
8335|CAPITALIZACIÓN POR REVALORIZACIÓN DE PATRIMONIO|Control de la capitalización efectuada con cargo a la revalorización del patrimonio.
8395|OTRAS CUENTAS DEUDORAS DE CONTROL|Otras operaciones que requieren control interno de naturaleza deudora.
8399|AJUSTES POR INFLACIÓN ACTIVOS|Control de los ajustes por inflación aplicados a los activos.
9105|BIENES Y VALORES RECIBIDOS EN CUSTODIA|Control de los bienes y valores de terceros recibidos en custodia.
9110|BIENES Y VALORES RECIBIDOS EN GARANTÍA|Control de los bienes y valores recibidos de terceros como garantía.
9115|BIENES Y VALORES RECIBIDOS DE TERCEROS|Control de los bienes de terceros que están en poder del ente económico.
9120|LITIGIOS Y/O DEMANDAS|Control de los litigios y demandas instaurados contra el ente económico.
9125|PROMESAS DE COMPRAVENTA|Sumas entregadas en virtud de promesas de compraventa de bienes.
9130|CONTRATOS DE ADMINISTRACIÓN DELEGADA|Control de las obligaciones derivadas de contratos de administración delegada.
9135|CUENTAS EN PARTICIPACIÓN|Control de las obligaciones derivadas de contratos de cuentas en participación.
9195|OTRAS RESPONSABILIDADES CONTINGENTES|Otras responsabilidades contingentes no clasificables en las demás cuentas del grupo.
9305|CONTRATOS DE ARRENDAMIENTO FINANCIERO|Control de las obligaciones derivadas de contratos de arrendamiento financiero.
9395|OTRAS CUENTAS DE ORDEN ACREEDORAS DE CONTROL|Otras operaciones que requieren control interno de naturaleza acreedora.
9399|AJUSTES POR INFLACIÓN PATRIMONIO|Control de los ajustes por inflación aplicados al patrimonio.
`)

/* ──────────── SUBCUENTAS (6 dígitos) — núcleo de mayor uso ──────────── */
D(`
110505|CAJA GENERAL|Efectivo recaudado en la caja principal del ente económico.
110510|CAJAS MENORES|Fondos fijos establecidos para atender pagos de menor cuantía.
110515|MONEDA EXTRANJERA|Efectivo en divisas mantenido en caja.
111005|MONEDA NACIONAL|Depósitos en cuentas corrientes bancarias en pesos colombianos.
111010|MONEDA EXTRANJERA|Depósitos en cuentas corrientes bancarias en divisas.
112005|BANCOS|Depósitos en cuentas de ahorro constituidos en bancos.
112010|CORPORACIONES DE AHORRO Y VIVIENDA|Depósitos en cuentas de ahorro en corporaciones de ahorro y vivienda.
112505|ROTATORIOS MONEDA NACIONAL|Fondos en pesos destinados a atender gastos recurrentes de operación.
112515|ESPECIALES MONEDA NACIONAL|Fondos en pesos constituidos para destinaciones específicas.
130505|NACIONALES|Deudas a cargo de clientes domiciliados en el país.
130510|DEL EXTERIOR|Deudas a cargo de clientes domiciliados en el exterior.
130515|DEUDORES DEL SISTEMA|Cartera de clientes administrada mediante sistemas de financiación específicos.
133005|A PROVEEDORES|Sumas entregadas anticipadamente a proveedores de bienes y servicios.
133010|A CONTRATISTAS|Sumas entregadas anticipadamente a contratistas de obra.
133015|A TRABAJADORES|Anticipos de salarios y avances entregados a los trabajadores.
133020|A AGENTES|Sumas entregadas a agentes, por ejemplo de aduana, para adelantar trámites.
133025|A CONCESIONARIOS|Anticipos entregados a concesionarios.
133030|DE ADJUDICACIONES|Anticipos entregados por adjudicaciones.
135505|ANTICIPO DE IMPUESTOS DE RENTA Y COMPLEMENTARIOS|Anticipo del impuesto de renta liquidado para el periodo gravable siguiente.
135510|ANTICIPO DE IMPUESTOS DE INDUSTRIA Y COMERCIO|Anticipo liquidado por concepto de industria y comercio.
135515|RETENCIÓN EN LA FUENTE|Retenciones de renta practicadas al ente económico por sus clientes.
135517|IMPUESTO A LAS VENTAS RETENIDO|IVA retenido al ente económico por agentes de retención (reteiva a favor).
135518|IMPUESTO DE INDUSTRIA Y COMERCIO RETENIDO|Reteica practicado al ente económico por sus clientes.
135520|SOBRANTES EN LIQUIDACIÓN PRIVADA DE IMPUESTOS|Saldos a favor determinados en las declaraciones tributarias.
135525|CONTRIBUCIONES|Anticipos de contribuciones a favor del ente económico.
136505|VIVIENDA|Préstamos concedidos a los trabajadores con destino a vivienda.
136510|VEHÍCULOS|Préstamos concedidos a los trabajadores para adquisición de vehículo.
136515|EDUCACIÓN|Préstamos concedidos a los trabajadores con destino a educación.
136520|MÉDICOS, ODONTOLÓGICOS Y SIMILARES|Préstamos concedidos a los trabajadores para gastos de salud.
136525|CALAMIDAD DOMÉSTICA|Préstamos concedidos a los trabajadores por calamidad doméstica.
136530|RESPONSABILIDADES|Faltantes de caja, de inventarios u otros bienes a cargo del trabajador responsable.
139905|CLIENTES|Provisión constituida sobre la cartera de clientes (deterioro).|CR
139910|CUENTAS CORRIENTES COMERCIALES|Provisión constituida sobre cuentas corrientes comerciales.|CR
152405|MUEBLES Y ENSERES|Costo de los muebles y enseres del área administrativa y operativa.
152410|EQUIPOS|Costo de los equipos de oficina distintos de muebles y enseres.
152805|EQUIPOS DE PROCESAMIENTO DE DATOS|Costo de computadores, servidores y periféricos.
152810|EQUIPOS DE TELECOMUNICACIONES|Costo de los equipos de comunicaciones.
154005|AUTOS, CAMIONETAS Y CAMPEROS|Costo de los vehículos livianos de propiedad del ente económico.
154008|CAMIONES, VOLQUETAS Y FURGONES|Costo de los vehículos de carga de propiedad del ente económico.
159205|CONSTRUCCIONES Y EDIFICACIONES|Depreciación acumulada de construcciones y edificaciones.|CR
159210|MAQUINARIA Y EQUIPO|Depreciación acumulada de la maquinaria y equipo.|CR
159215|EQUIPO DE OFICINA|Depreciación acumulada del equipo de oficina.|CR
159220|EQUIPO DE COMPUTACION Y COMUNICACIÓN|Depreciación acumulada del equipo de cómputo y comunicaciones.|CR
159235|FLOTA Y EQUIPO DE TRANSPORTE|Depreciación acumulada de la flota y equipo de transporte.|CR
170505|INTERESES|Intereses pagados por anticipado.
170520|SEGUROS Y FIANZAS|Primas de seguros y fianzas pagadas por anticipado.
170525|ARRENDAMIENTOS|Cánones de arrendamiento pagados por anticipado.
171004|ORGANIZACIÓN Y PREOPERATIVOS|Costos incurridos en la organización y puesta en marcha del ente económico.
171016|PROGRAMAS PARA COMPUTADOR (SOFTWARE)|Costo de los programas de computador tratados como cargo diferido.
171020|ÚTILES Y PAPELERÍA|Costo de los útiles y papelería pendientes de consumo.
171024|MEJORAS A PROPIEDADES AJENAS|Costo de las mejoras efectuadas en bienes tomados en arrendamiento.
210505|SOBREGIROS|Saldos rojos en cuentas corrientes bancarias.
210510|PAGARES|Obligaciones respaldadas en pagarés suscritos con bancos nacionales.
210515|CARTAS DE CRÉDITO|Obligaciones derivadas de cartas de crédito.
233525|HONORARIOS|Honorarios causados y pendientes de pago.
233530|SERVICIOS TÉCNICOS|Servicios técnicos causados y pendientes de pago.
233535|SERVICIOS DE MANTENIMIENTO|Servicios de mantenimiento causados y pendientes de pago.
233540|ARRENDAMIENTOS|Cánones de arrendamiento causados y pendientes de pago.
233550|SERVICIOS PÚBLICOS|Servicios públicos causados y pendientes de pago.
236505|SALARIOS Y PAGOS LABORALES|Retención en la fuente practicada sobre pagos laborales.
236510|DIVIDENDOS Y/O PARTICIPACIONES|Retención en la fuente practicada sobre dividendos y participaciones.
236515|HONORARIOS|Retención en la fuente practicada por concepto de honorarios.
236520|COMISIONES|Retención en la fuente practicada por concepto de comisiones.
236525|SERVICIOS|Retención en la fuente practicada por concepto de servicios.
236530|ARRENDAMIENTOS|Retención en la fuente practicada por concepto de arrendamientos.
236535|RENDIMIENTOS FINANCIEROS|Retención en la fuente practicada sobre rendimientos financieros.
236540|COMPRAS|Retención en la fuente practicada por concepto de compras.
236570|OTRAS RETENCIONES Y PATRIMONIO|Retenciones practicadas por otros conceptos.
237005|APORTES A ENTIDADES PROMOTORAS DE SALUD|Aportes a EPS descontados y a cargo del empleador, pendientes de pago.
237006|APORTES A ADMINISTRADORAS DE RIESGOS PROFESIONALES|Aportes a ARL pendientes de pago.
237010|APORTES AL ICBF, SENA Y CAJAS DE COMPENSACIÓN|Aportes parafiscales pendientes de pago.
237025|EMBARGOS JUDICIALES|Descuentos de nómina por embargos judiciales pendientes de consignar.
237030|LIBRANZAS|Descuentos de nómina por libranzas pendientes de pago.
238095|OTROS|Otras obligaciones con acreedores varios; aquí van, entre otros, los sobrantes de caja mientras se aclara su origen.
251005|LEY LABORAL ANTERIOR|Cesantías consolidadas bajo el régimen retroactivo, anterior a la Ley 50.
251010|LEY 50 DE 1990 Y NORMAS POSTERIORES|Cesantías consolidadas bajo el régimen anualizado.
510506|SUELDOS|Remuneración fija pactada con los trabajadores del área administrativa.
510515|HORAS EXTRAS Y RECARGOS|Pagos por trabajo suplementario, nocturno, dominical y festivo.
510518|COMISIONES|Comisiones causadas a favor del personal administrativo.
510521|VIATICOS|Sumas reconocidas por manutención y alojamiento en comisiones de servicio.
510527|AUXILIO DE TRANSPORTE|Auxilio legal de transporte reconocido a los trabajadores.
510530|CESANTÍAS|Gasto por cesantías causadas del personal administrativo.
510533|INTERESES SOBRE CESANTÍAS|Gasto por intereses sobre cesantías del personal administrativo.
510536|PRIMA DE SERVICIOS|Gasto por prima legal de servicios del personal administrativo.
510539|VACACIONES|Gasto por vacaciones causadas del personal administrativo.
510548|BONIFICACIONES|Bonificaciones ocasionales o habituales reconocidas al personal administrativo.
510551|DOTACION Y SUMINISTRO A TRABAJADORES|Costo de la dotación legal entregada a los trabajadores.
510560|INDEMNIZACIONES LABORALES|Indemnizaciones causadas por terminación del contrato de trabajo.
510563|CAPACITACIÓN AL PERSONAL|Gastos de formación y capacitación del personal administrativo.
510568|APORTES A ADMINISTRADORAS DE RIESGOS PROFESIONALES|Aportes a ARL a cargo del empleador.
510569|APORTES A ENTIDADES PROMOTORAS DE SALUD|Aportes a salud a cargo del empleador.
510570|APORTES A FONDOS DE PENSIONES Y/O CESANTÍAS|Aportes a pensiones y cesantías a cargo del empleador.
510572|APORTES CAJAS DE COMPENSACIÓN FAMILIAR|Aporte parafiscal a cajas de compensación familiar.
510575|APORTES ICBF|Aporte parafiscal al Instituto Colombiano de Bienestar Familiar.
510578|SENA|Aporte parafiscal al Servicio Nacional de Aprendizaje.
513505|ASEO Y VIGILANCIA|Gastos por servicios de aseo y vigilancia del área administrativa.
513525|ACUEDUCTO Y ALCANTARILLADO|Gastos por servicios de acueducto y alcantarillado.
513530|ENERGÍA ELÉCTRICA|Gastos por servicio de energía eléctrica del área administrativa.
513535|TELÉFONO|Gastos por servicios de telefonía y comunicaciones.
513540|CORREO, PORTES Y TELEGRAMAS|Gastos por servicios de mensajería y correo.
530505|GASTOS BANCARIOS|Comisiones y cargos cobrados por las entidades bancarias.
530515|COMISIONES|Comisiones causadas por operaciones financieras.
530520|INTERESES|Intereses causados sobre obligaciones financieras.
530525|DIFERENCIA EN CAMBIO|Pérdida generada por la fluctuación de la tasa de cambio.
530535|DESCUENTOS COMERCIALES CONDICIONADOS|Descuentos concedidos a clientes por pronto pago.
# Añadidas al ampliar las operaciones (nombres verificados en puc.com.co)
236575|AUTORRETENCIONES|Retención en la fuente que el propio ente económico se practica cuando es autorretenedor.
238030|FONDOS DE CESANTÍAS Y/O PENSIONES|Aportes a fondos de pensiones y cesantías descontados o a cargo de la empresa, pendientes de girar.
237035|SINDICATOS|Cuotas sindicales descontadas a los trabajadores, pendientes de pagar al sindicato.
237040|COOPERATIVAS|Descuentos de nómina a favor de cooperativas, pendientes de pagar.
510503|SALARIO INTEGRAL|Salario que incluye prestaciones sociales, del personal administrativo.
510524|INCAPACIDADES|Días de incapacidad a cargo de la empresa del personal administrativo.
510545|AUXILIOS|Auxilios extralegales entregados al personal administrativo.
510566|GASTOS DEPORTIVOS Y DE RECREACIÓN|Actividades de bienestar, deporte y recreación del personal.
510584|GASTOS MÉDICOS Y DROGAS|Gastos médicos y medicamentos del personal asumidos por la empresa.
511010|REVISORÍA FISCAL|Honorarios del revisor fiscal.
233505|GASTOS FINANCIEROS|Intereses y demás gastos financieros causados y pendientes de pago.
134505|DIVIDENDOS Y/O PARTICIPACIONES|Dividendos o participaciones decretados a favor del ente económico y pendientes de cobro.
421020|DIFERENCIA EN CAMBIO|Ingreso por el mayor valor en pesos de derechos u obligaciones en moneda extranjera.
421040|DESCUENTOS COMERCIALES CONDICIONADOS|Descuentos obtenidos de proveedores por pronto pago.
310515|CAPITAL SUSCRITO POR COBRAR (DB)|Capital suscrito por los accionistas pendiente de pago.|DB
531515|COSTOS Y GASTOS DE EJERCICIOS ANTERIORES|Costos y gastos de periodos anteriores reconocidos en el ejercicio actual.
531520|IMPUESTOS ASUMIDOS|Impuestos de terceros que el ente económico asume, como retenciones no practicadas.
539520|MULTAS, SANCIONES Y LITIGIOS|Multas, sanciones e indemnizaciones por litigios a cargo del ente económico.
539525|DONACIONES|Donaciones efectuadas por el ente económico.
`)

/* ─────────── DINAMICA (se debita por / se acredita por) ─────────── */
const DINAMICA = {
  '1': {
    debita: ['La adquisición de bienes y derechos.', 'El aumento del valor de los activos por ajustes o avalúos.', 'El traslado desde otras cuentas de activo.'],
    acredita: ['La venta, retiro o baja de los bienes y derechos.', 'El recaudo de las cuentas por cobrar.', 'La disminución del valor de los activos.'],
  },
  '2': {
    debita: ['El pago total o parcial de la obligación.', 'La reversión o cancelación de la obligación.', 'Las notas crédito recibidas de los acreedores.'],
    acredita: ['El nacimiento de la obligación a cargo del ente económico.', 'La causación de intereses, ajustes y mayores valores de la deuda.'],
  },
  '3': {
    debita: ['Las disminuciones de capital legalmente aprobadas.', 'La distribución o aplicación de utilidades y reservas.', 'El registro de las pérdidas del ejercicio.'],
    acredita: ['Los aportes efectuados por socios o accionistas.', 'La apropiación de reservas y el registro de utilidades.', 'Las valorizaciones y demás incrementos patrimoniales.'],
  },
  '4': {
    debita: ['La cancelación de saldos al cierre del ejercicio contra ganancias y pérdidas.', 'Las devoluciones, rebajas y descuentos concedidos.'],
    acredita: ['El valor de los bienes vendidos o los servicios prestados.', 'La causación de rendimientos, arrendamientos y demás ingresos.'],
  },
  '5': {
    debita: ['La causación del gasto, se pague o no en el periodo.', 'Los ajustes que incrementan el valor del gasto.'],
    acredita: ['Las devoluciones, anulaciones y reintegros de gastos.', 'La cancelación de saldos al cierre del ejercicio contra ganancias y pérdidas.'],
  },
  '6': {
    debita: ['El costo de los bienes vendidos o de los servicios prestados.', 'Los ajustes que incrementan el costo.'],
    acredita: ['El costo de las devoluciones en ventas.', 'La cancelación de saldos al cierre del ejercicio contra ganancias y pérdidas.'],
  },
  '7': {
    debita: ['El consumo de materia prima, mano de obra y costos indirectos del periodo.'],
    acredita: ['El traslado de los costos acumulados a inventario de productos en proceso, terminados o al costo de ventas.'],
  },
  '8': {
    debita: ['El registro del derecho contingente o de la operación sujeta a control.'],
    acredita: ['La cancelación del derecho contingente o la extinción de la operación controlada.'],
  },
  '9': {
    debita: ['La cancelación de la responsabilidad contingente o la extinción de la operación controlada.'],
    acredita: ['El registro de la responsabilidad contingente o de la operación sujeta a control.'],
  },
  '1105': {
    debita: ['El valor de los ingresos en efectivo y cheques recibidos.', 'Los sobrantes de caja al efectuar arqueos.'],
    acredita: ['El valor de las consignaciones diarias en cuentas bancarias.', 'Los pagos efectuados en efectivo.', 'Los faltantes de caja al efectuar arqueos.'],
  },
  '1110': {
    debita: ['El valor de las consignaciones y notas crédito del banco.', 'Los traslados recibidos de otras cuentas.'],
    acredita: ['El valor de los cheques girados.', 'Las notas débito y comisiones cobradas por el banco.'],
  },
  '1305': {
    debita: ['El valor de las ventas de bienes y servicios a crédito.', 'Los intereses y ajustes causados a cargo del cliente.'],
    acredita: ['Los pagos recibidos del cliente.', 'Las devoluciones, rebajas y descuentos concedidos.', 'El castigo de cartera contra la provisión.'],
  },
  '1435': {
    debita: ['El costo de las mercancías compradas.', 'El valor de las devoluciones de clientes que reingresan al inventario.', 'Los sobrantes establecidos en la toma física.'],
    acredita: ['El costo de las mercancías vendidas.', 'Las devoluciones a proveedores.', 'Los faltantes establecidos en la toma física.'],
  },
  '2205': {
    debita: ['Los pagos efectuados al proveedor.', 'Las devoluciones de mercancía y los descuentos obtenidos.'],
    acredita: ['El valor de las compras de bienes y servicios a crédito.', 'Los ajustes y mayores valores facturados por el proveedor.'],
  },
  '2365': {
    debita: ['El pago de las retenciones a la DIAN mediante la declaración mensual.', 'Los ajustes o correcciones que disminuyen la retención.'],
    acredita: ['El valor de las retenciones practicadas a terceros al efectuar el pago o abono en cuenta.'],
  },
  '2408': {
    debita: ['El valor del IVA descontable en las compras.', 'El pago del saldo a cargo en la declaración bimestral o cuatrimestral.', 'El IVA de las devoluciones en ventas.'],
    acredita: ['El valor del IVA generado en las ventas de bienes y servicios gravados.', 'El IVA de las devoluciones en compras.'],
  },
  '2505': {
    debita: ['El pago de la nómina a los trabajadores.', 'Los descuentos de nómina trasladados a las cuentas por pagar.'],
    acredita: ['El valor de los salarios y demás pagos laborales causados en el periodo.'],
  },
  '4135': {
    debita: ['La cancelación del saldo al cierre del ejercicio contra ganancias y pérdidas.'],
    acredita: ['El valor de las mercancías vendidas, a crédito o de contado.'],
  },
  '5105': {
    debita: ['La causación de salarios, prestaciones, aportes y demás pagos laborales del área administrativa.'],
    acredita: ['Los reintegros y anulaciones.', 'La cancelación del saldo al cierre del ejercicio contra ganancias y pérdidas.'],
  },
  '6135': {
    debita: ['El costo de las mercancías vendidas en el periodo.'],
    acredita: ['El costo de las devoluciones en ventas.', 'La cancelación del saldo al cierre del ejercicio contra ganancias y pérdidas.'],
  },
}

/* ─────────────────── TEXTOS OFICIALES (puc.com.co) ───────────────────
  scripts/oficial.json guarda la descripción y la dinámica del Decreto 2650 tal como
  las publica puc.com.co (se genera con scripts/descargar-oficial.mjs). Cuando un
  código las tiene, sustituyen a la descripción breve de la fuente compacta y a la
  dinámica escrita a mano; la fuente compacta queda como respaldo para los códigos
  que el sitio no describe, como la mayoría de subcuentas.
*/
const RUTA_OFICIAL = join(RAIZ, 'scripts/oficial.json')
const OFICIAL = existsSync(RUTA_OFICIAL) ? JSON.parse(readFileSync(RUTA_OFICIAL, 'utf8')).textos : {}

/**
 * Algunas páginas intercalan rótulos de sección («Registro de pagos», «3710 Pérdidas
 * acumuladas») entre los renglones. Se reconocen porque son cortos y no terminan en
 * puntuación ni empiezan como un renglón de la dinámica.
 */
const esRotulo = (l) => l === 'DINÁMICA' || (l.length < 60 && !/[.;:,]$/.test(l) && !/^(Por|Con|Al|A la|El|La|Los|Las|-)\b/.test(l))

/** «Por el valor de los pagos efectuados;» o «…, y» pasan a terminar en punto. */
const cerrarRenglon = (l) => l.replace(/(,? (y|e)|[;,])\s*$/, '').replace(/\.?$/, '.')

function textoOficial(codigo) {
  const o = OFICIAL[codigo]
  if (!o) return null
  const descripcion = o.descripcion.filter((l) => !esRotulo(l) && !/^Cuentas?: /.test(l)).join('\n\n')
  // Los rótulos que parten la dinámica se conservan marcados con «§» para mostrarlos como subtítulo.
  const renglones = (lista) => {
    const salida = lista.map((l) => (esRotulo(l) ? `§ ${l}` : cerrarRenglon(l)))
    // Un rótulo al final no encabeza nada en esa columna.
    while (salida.at(-1)?.startsWith('§ ')) salida.pop()
    return salida
  }
  const dinamica = o.debita.length || o.acredita.length
    ? { debita: renglones(o.debita), acredita: renglones(o.acredita) }
    : null
  return { descripcion, dinamica }
}

/* ─────────────────────────── PARSEO Y SALIDA ─────────────────────────── */
const NIVEL_POR_LONGITUD = { 1: 'clase', 2: 'grupo', 4: 'cuenta', 6: 'subcuenta' }
const NATURALEZA_POR_CLASE = {
  '1': 'debito', '2': 'credito', '3': 'credito', '4': 'credito', '5': 'debito',
  '6': 'debito', '7': 'debito', '8': 'debito', '9': 'credito',
}

const cuentas = []
const vistos = new Set()

for (const linea of LINEAS) {
  const [codigo, nombre, descripcion = '', forzada = ''] = linea.split('|').map((c) => c.trim())
  const nivel = NIVEL_POR_LONGITUD[codigo.length]

  if (!nivel) throw new Error(`Código con longitud inválida: "${codigo}"`)
  if (!/^\d+$/.test(codigo)) throw new Error(`Código no numérico: "${codigo}"`)
  if (!nombre) throw new Error(`Falta el nombre en: "${linea}"`)
  if (vistos.has(codigo)) throw new Error(`Código duplicado: "${codigo}"`)
  vistos.add(codigo)

  const naturaleza = forzada === 'CR' ? 'credito'
    : forzada === 'DB' ? 'debito'
    : NATURALEZA_POR_CLASE[codigo[0]]

  const oficial = textoOficial(codigo)
  cuentas.push({
    codigo,
    nombre,
    nivel,
    naturaleza,
    naturalezaForzada: Boolean(forzada),
    descripcion: oficial?.descripcion || descripcion,
    ...(oficial?.descripcion ? { textoOficial: true } : {}),
    ...(oficial?.dinamica ? { dinamica: oficial.dinamica } : DINAMICA[codigo] ? { dinamica: DINAMICA[codigo] } : {}),
    origen: 'oficial',
  })
}

// Verificación de integridad jerárquica: toda cuenta debe tener padre existente.
const LONGITUD_PADRE = { 2: 1, 4: 2, 6: 4 }
for (const c of cuentas) {
  const lp = LONGITUD_PADRE[c.codigo.length]
  if (lp && !vistos.has(c.codigo.slice(0, lp))) {
    throw new Error(`La cuenta ${c.codigo} (${c.nombre}) no tiene padre ${c.codigo.slice(0, lp)} en el catálogo.`)
  }
}

cuentas.sort((a, b) => a.codigo.localeCompare(b.codigo))

const salida = {
  fuente: 'Decreto 2650 de 1993 y modificaciones — Plan Único de Cuentas para comerciantes (Colombia)',
  nota: 'Catálogo de referencia con fines didácticos. Las 9 clases, los 52 grupos y las 344 cuentas de 4 dígitos están contrastadas una a una con el catálogo publicado en puc.com.co, y sus descripciones y dinámicas son las oficiales cuando el sitio las publica (textoOficial). Las subcuentas incluidas son un núcleo verificado de las de mayor uso. Amplíalo desde la aplicación o importando un CSV.',
  generado: 'scripts/build-seed.mjs',
  cuentas,
}

mkdirSync(join(RAIZ, 'data'), { recursive: true })
writeFileSync(join(RAIZ, 'data/puc.json'), JSON.stringify(salida, null, 2) + '\n', 'utf8')

const conteo = cuentas.reduce((acc, c) => ({ ...acc, [c.nivel]: (acc[c.nivel] || 0) + 1 }), {})
console.log('data/puc.json generado')
console.log(`  clases:     ${conteo.clase || 0}`)
console.log(`  grupos:     ${conteo.grupo || 0}`)
console.log(`  cuentas:    ${conteo.cuenta || 0}`)
console.log(`  subcuentas: ${conteo.subcuenta || 0}`)
console.log(`  total:      ${cuentas.length}`)
