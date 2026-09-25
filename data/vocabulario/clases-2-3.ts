/**
 * Vocabulario coloquial de las clases 2 (pasivo) y 3 (patrimonio): préstamos, tarjetas,
 * proveedores, cuentas por pagar, retenciones, impuestos por pagar, nómina por pagar,
 * provisiones, anticipos recibidos, diferidos, bonos; capital, aportes, superávit,
 * reservas, dividendos, utilidades y pérdidas, valorizaciones.
 */

/** Formas de nombrar lo que registra cada cuenta. */
export const ALIAS_CLASES_2_3: Record<string, string[]> = {
  /* ───────────── 21 Obligaciones financieras ───────────── */
  '2105': [
    'le debo al banco', 'deuda con el banco', 'préstamo bancario', 'crédito bancario', 'crédito con el banco',
    'préstamo del banco', 'me prestó el banco', 'saqué un crédito', 'crédito de libre inversión', 'crédito de consumo',
    'crédito rotativo', 'cupo rotativo', 'tarjeta de crédito de la empresa', 'deuda de la tarjeta', 'tarjeta corporativa',
    'bancolombia', 'davivienda', 'banco de bogotá', 'bbva', 'banco agrario',
  ],
  '210505': [
    'sobregiro', 'sobregiro bancario', 'cuenta en rojo', 'cuenta en negativo', 'saldo negativo en el banco',
    'descubierto', 'giro en descubierto', 'me sobregiré', 'cupo de sobregiro', 'sobregiro en la cuenta corriente',
  ],
  '210510': [
    'pagaré', 'firmé un pagaré', 'crédito con pagaré', 'préstamo con pagaré', 'letra del banco',
    'crédito de tesorería', 'préstamo a plazo', 'crédito a cuotas', 'crédito de capital de trabajo',
  ],
  '210515': [
    'carta de crédito', 'carta de crédito de importación', 'l/c', 'crédito documentario', 'stand by',
    'carta de crédito para importar', 'garantía bancaria de importación',
  ],
  '2110': [
    'préstamo de un banco extranjero', 'crédito en dólares', 'deuda con banco del exterior', 'banco de afuera',
    'crédito en el exterior', 'préstamo en moneda extranjera', 'banco de estados unidos', 'deuda externa de la empresa',
  ],
  '2115': [
    'corporación financiera', 'préstamo de corficolombiana', 'crédito con corporación financiera',
    'financiación de proyecto', 'banca de inversión', 'crédito de fomento',
  ],
  '2120': [
    'compañía de financiamiento', 'financiera', 'leasing', 'leasing financiero', 'arrendamiento financiero',
    'le debo a la financiera', 'crédito de vehículo', 'crédito del carro', 'financiación del carro',
    'crédito de moto', 'renting', 'crédito con financiera', 'tarjeta tuya', 'giros y finanzas', 'crédito de libranza con financiera',
  ],
  '2125': [
    'crédito hipotecario', 'hipoteca', 'préstamo de vivienda', 'crédito de vivienda', 'le debo la hipoteca',
    'crédito para la bodega', 'crédito para comprar el local', 'préstamo hipotecario',
  ],
  '2130': [
    'entidad financiera del exterior', 'fintech extranjera', 'préstamo de una financiera extranjera',
    'deuda con financiera de afuera', 'crédito con organismo multilateral', 'banco interamericano', 'banco mundial',
  ],
  '2135': [
    'repo', 'operación repo', 'recompra de inversiones', 'pacto de recompra', 'venta con pacto de recompra',
    'simultánea', 'operación simultánea',
  ],
  '2140': [
    'recompra de cartera', 'venta de cartera con recompra', 'cartera negociada', 'factoring con recurso',
    'descuento de facturas con recurso', 'cesión de cartera con recompra',
  ],
  '2145': [
    'préstamo del gobierno', 'crédito del estado', 'deuda con el gobierno', 'crédito bancóldex', 'bancóldex',
    'findeter', 'finagro', 'fondo nacional de garantías', 'crédito de fomento del estado',
  ],
  '2195': [
    'otras obligaciones financieras', 'préstamo de un particular', 'préstamo de un tercero', 'gota a gota',
    'prestamista', 'préstamo de un amigo', 'crédito con cooperativa', 'préstamo de la cooperativa',
    'crédito de plataforma', 'addi', 'sistecrédito', 'préstamo de un familiar',
  ],

  /* ───────────── 22 Proveedores ───────────── */
  '2205': [
    'le debo al proveedor', 'proveedores', 'facturas de proveedores por pagar', 'compra a crédito',
    'compré fiado', 'compra a plazo', 'mercancía a crédito', 'factura a 30 días', 'factura a 60 días',
    'cuentas por pagar a proveedores', 'cxp proveedores', 'lo que le debo al mayorista', 'deuda con el distribuidor',
    'proveedores nacionales', 'crédito del proveedor',
  ],
  '2210': [
    'proveedor del exterior', 'proveedor extranjero', 'le debo al proveedor de china', 'importación a crédito',
    'factura en dólares por pagar', 'proveedor internacional', 'compra en alibaba a crédito', 'deuda por importación',
    'proveedor de estados unidos',
  ],
  '2215': [
    'cuenta corriente comercial con proveedor', 'cruce de cuentas con proveedor', 'cuenta corriente con el proveedor',
    'compras y ventas cruzadas', 'intercambio con proveedor', 'saldo cruzado con proveedor',
  ],
  '2220': [
    'le debo a la casa matriz por compras', 'compras a la matriz', 'mercancía de la casa matriz',
    'proveedor casa matriz', 'factura de la matriz', 'compra a la sede principal',
  ],
  '2225': [
    'compras a compañía vinculada', 'proveedor vinculado', 'compra a la filial', 'compra a empresa del grupo',
    'compra a subsidiaria', 'proveedor del mismo grupo', 'compra a empresa relacionada',
  ],

  /* ───────────── 23 Cuentas por pagar ───────────── */
  '2305': [
    'cuenta corriente comercial por pagar', 'cruce de cuentas por pagar', 'saldo a favor de un tercero comercial',
    'cuenta corriente con cliente-proveedor', 'compensación de cuentas',
  ],
  '2310': [
    'le debo a la casa matriz', 'deuda con la matriz', 'préstamo de la casa matriz', 'gastos que pagó la matriz',
    'reembolso a la matriz', 'cuenta por pagar a la sede principal',
  ],
  '2315': [
    'le debo a la filial', 'deuda con empresa del grupo', 'préstamo de compañía vinculada', 'deuda con subsidiaria',
    'préstamo de empresa hermana', 'cuenta por pagar a vinculada', 'deuda intercompañía',
  ],
  '2320': [
    'le debo al contratista', 'contratistas por pagar', 'pago al contratista', 'maestro de obra', 'obra por pagar',
    'subcontratista', 'cuenta de cobro del contratista', 'acta de obra por pagar', 'le debo al maestro',
  ],
  '2330': [
    'bonos de regalo vendidos', 'gift card', 'tarjeta regalo', 'vale de compra', 'bono de compra', 'bono regalo',
    'orden de compra por redimir', 'vales por redimir', 'cupones vendidos',
  ],
  '2335': [
    'gastos por pagar', 'costos por pagar', 'servicios por pagar', 'facturas por pagar', 'cuentas por pagar',
    'cxp', 'lo que debo de gastos', 'gastos causados', 'gastos pendientes de pago', 'recibos pendientes',
    'factura de gasto pendiente', 'cuentas pendientes',
  ],
  '233505': [
    'intereses por pagar', 'intereses causados', 'intereses del préstamo por pagar', 'gastos financieros por pagar',
    'comisiones bancarias por pagar', 'intereses pendientes',
  ],
  '233525': [
    'honorarios por pagar', 'le debo al contador', 'le debo al abogado', 'cuenta de cobro del contador',
    'le debo al revisor fiscal', 'honorarios pendientes', 'le debo al asesor', 'le debo al consultor',
    'cuenta de cobro por pagar',
  ],
  '233530': [
    'servicios técnicos por pagar', 'le debo al técnico', 'soporte técnico por pagar', 'servicio técnico pendiente',
    'le debo al ingeniero', 'factura del técnico', 'soporte de sistemas por pagar',
  ],
  '233535': [
    'mantenimiento por pagar', 'le debo al del mantenimiento', 'reparación por pagar', 'arreglo por pagar',
    'le debo al mecánico', 'le debo al plomero', 'le debo al electricista', 'taller por pagar',
  ],
  '233540': [
    'arriendo por pagar', 'le debo el arriendo', 'alquiler por pagar', 'alquiler del local por pagar',
    'canon por pagar', 'le debo al arrendador', 'le debo al casero', 'arriendo atrasado', 'alquiler pendiente',
  ],
  '233550': [
    'servicios públicos por pagar', 'recibo de la luz por pagar', 'recibo del agua pendiente', 'le debo la luz',
    'le debo el agua', 'factura de internet por pagar', 'recibo del gas por pagar', 'servicios pendientes',
    'epm por pagar', 'codensa por pagar', 'enel por pagar',
  ],
  '2340': [
    'instalamentos', 'cuotas de acciones por pagar', 'acciones suscritas por pagar', 'cuotas de suscripción por pagar',
    'saldo de acciones que compré', 'aportes a otra sociedad por pagar',
  ],
  '2345': [
    'acreedores oficiales', 'le debo a una entidad del estado', 'deuda con entidad pública', 'multa por pagar',
    'sanción por pagar', 'deuda con la superintendencia', 'contribución a la supersociedades por pagar',
  ],
  '2350': [
    'regalías por pagar', 'royalties por pagar', 'le debo regalías', 'derechos de autor por pagar',
    'franquicia por pagar', 'canon de franquicia', 'uso de marca por pagar', 'licencia de marca por pagar',
  ],
  '2355': [
    'le debo a los socios', 'préstamo de socios', 'préstamo del socio', 'el socio me prestó', 'deuda con accionistas',
    'plata que puso el socio prestada', 'préstamo del dueño', 'el dueño le prestó a la empresa',
    'cuenta por pagar a socios', 'mutuo con socio', 'préstamo de accionistas',
  ],
  '2357': [
    'deudas con directores', 'le debo al gerente', 'préstamo del gerente', 'le debo a la junta directiva',
    'préstamo de un director', 'gastos que pagó el gerente', 'reembolso al gerente',
  ],
  '2360': [
    'dividendos por pagar', 'utilidades por pagar a socios', 'dividendos decretados', 'participaciones por pagar',
    'reparto de utilidades pendiente', 'le debo los dividendos', 'utilidades repartidas por pagar',
  ],
  '2365': [
    'retefuente por pagar', 'retención que practiqué', 'retenciones a terceros', 'retención en la fuente por pagar',
    'lo que retuve', 'retenciones por pagar a la dian', 'declaración de retención', 'formulario 350',
    'retención que le hice al proveedor', 'retenciones practicadas', 'retefuente del mes',
  ],
  '236505': [
    'retención por salarios', 'retención a empleados', 'retención de nómina', 'retención sobre sueldos',
    'retefuente de salarios', 'retención laboral', 'retención al trabajador',
  ],
  '236510': [
    'retención por dividendos', 'retención sobre utilidades', 'retención a socios por dividendos',
    'retefuente de dividendos', 'retención de participaciones',
  ],
  '236515': [
    'retención por honorarios', 'retención al contador', 'retención al abogado', 'retefuente de honorarios',
    'retención del 10', 'retención del 11', 'retención a cuenta de cobro',
  ],
  '236520': [
    'retención por comisiones', 'retención a vendedores comisionistas', 'retefuente de comisiones',
    'retención al comisionista', 'retención sobre comisión',
  ],
  '236525': [
    'retención por servicios', 'retefuente de servicios', 'retención del 4', 'retención del 6',
    'retención al transportador', 'retención por fletes', 'retención de servicios generales', 'retención por aseo',
  ],
  '236530': [
    'retención por arriendos', 'retención por arrendamiento', 'retención al arrendador', 'retención del 3.5',
    'retefuente de arriendo', 'retención de alquiler',
  ],
  '236535': [
    'retención por rendimientos financieros', 'retención sobre intereses', 'retención por intereses pagados',
    'retención del 7', 'retefuente de intereses',
  ],
  '236540': [
    'retención por compras', 'retención al proveedor', 'retención del 2.5', 'retefuente de compras',
    'retención en compras', 'retención por compra de mercancía',
  ],
  '236570': [
    'otras retenciones', 'retención por loterías', 'retención por premios', 'retención por enajenación de activos',
    'retención varias', 'retención por venta de bienes raíces',
  ],
  '236575': [
    'autorretención', 'autorretenciones', 'autorretención especial de renta', 'autorretenedor',
    'me autorretengo', 'autorretención de renta',
  ],
  '2367': [
    'reteiva por pagar', 'iva retenido a terceros', 'reteiva que practiqué', 'retención de iva por pagar',
    'iva que retuve', 'retención del 15 del iva', 'reteiva al proveedor',
  ],
  '2368': [
    'reteica por pagar', 'ica retenido a terceros', 'reteica que practiqué', 'retención de ica por pagar',
    'ica que retuve', 'retención de industria y comercio', 'reteica al proveedor',
  ],
  '2370': [
    'aportes de nómina por pagar', 'seguridad social por pagar', 'planilla pila', 'pila por pagar',
    'aportes parafiscales por pagar', 'descuentos de nómina', 'eps y pensión por pagar', 'aportes a seguridad social',
    'deducciones de nómina', 'lo que le descuento al empleado', 'aportes patronales', 'aportes del empleado',
    'aportes a pensión', 'colpensiones', 'porvenir', 'fondo protección', 'colfondos', 'skandia',
  ],
  '237005': [
    'salud por pagar', 'eps por pagar', 'aporte de salud', 'aportes a la eps', 'sura eps', 'sanitas',
    'nueva eps', 'descuento de salud', 'salud del empleado', 'seguro médico obligatorio',
  ],
  '237006': [
    'arl por pagar', 'aportes a riesgos laborales', 'riesgos profesionales', 'arl sura', 'arl positiva',
    'riesgos laborales por pagar', 'seguro de accidentes de trabajo', 'arp',
  ],
  '237010': [
    'parafiscales por pagar', 'sena', 'icbf', 'caja de compensación', 'comfama', 'compensar', 'cafam',
    'colsubsidio', 'comfenalco', 'aporte a la caja', 'aportes parafiscales',
  ],
  '237025': [
    'embargo de sueldo', 'embargo al empleado', 'embargo de nómina', 'descuento por embargo',
    'embargo por alimentos', 'cuota alimentaria descontada', 'orden de embargo del juzgado',
  ],
  '237030': [
    'libranza', 'libranzas', 'descuento por libranza', 'crédito por libranza del empleado',
    'descuento de nómina para el banco', 'préstamo del empleado descontado por nómina',
  ],
  '237035': [
    'cuota sindical', 'sindicato', 'aporte sindical', 'descuento sindical', 'afiliación al sindicato',
  ],
  '237040': [
    'cooperativa', 'descuento de la cooperativa', 'aporte a la cooperativa', 'fondo de empleados',
    'ahorro en el fondo de empleados', 'descuento del fondo de empleados', 'crédito del fondo de empleados',
  ],
  '2375': [
    'cuotas por devolver', 'aportes por devolver', 'devolución de aportes a asociados', 'retiro de asociado',
    'cuotas que hay que devolver', 'reintegro de aportes',
  ],
  '2380': [
    'acreedores varios', 'otras deudas', 'otras cuentas por pagar', 'deudas varias', 'plata que debo a otros',
    'lo que le debo a un particular', 'cuentas por pagar diversas', 'fondo de pensiones por pagar',
  ],
  '238030': [
    'fondo de cesantías por pagar', 'fondo de pensiones voluntarias por pagar', 'le debo al fondo de cesantías',
    'cesantías al fondo por pagar', 'pensión voluntaria', 'consignar cesantías al fondo', 'aporte voluntario a pensión',
  ],
  '238095': [
    'sobrante de caja por aclarar', 'plata que no sé de quién es', 'consignación sin identificar',
    'partida por identificar', 'dinero pendiente de aclarar', 'otros acreedores', 'cheque sin cobrar de un tercero',
  ],

  /* ───────────── 24 Impuestos, gravámenes y tasas ───────────── */
  '2404': [
    'renta por pagar', 'impuesto de renta por pagar', 'lo que le debo a la dian de renta', 'declaración de renta a pagar',
    'impuesto sobre la renta', 'provisión de renta', 'renta del año', 'formulario 110', 'sobretasa de renta',
    'impuesto de ganancias', 'isr', 'impuesto de sociedades', 'ganancia ocasional por pagar',
  ],
  '2408': [
    'iva por pagar', 'iva', 'lo que le debo a la dian de iva', 'iva generado', 'iva descontable', 'iva cobrado',
    'iva de las ventas', 'declaración de iva', 'formulario 300', 'impuesto a las ventas', 'iva del bimestre',
    'iva del cuatrimestre', 'impuesto al valor agregado',
  ],
  '2412': [
    'ica por pagar', 'industria y comercio', 'impuesto de industria y comercio', 'le debo a la alcaldía el ica',
    'declaración de ica', 'avisos y tableros', 'impuesto municipal', 'ica del bimestre',
  ],
  '2416': [
    'predial por pagar', 'impuesto predial', 'le debo el predial', 'impuesto de la bodega', 'impuesto del local',
    'impuesto de la casa', 'impuesto de bienes inmuebles', 'contribución inmobiliaria',
  ],
  '2420': [
    'impuesto de registro', 'derechos de registro', 'boleta fiscal', 'beneficencia', 'registro de escritura',
    'instrumentos públicos', 'registro de la hipoteca',
  ],
  '2424': [
    'valorización por pagar', 'contribución de valorización', 'le debo la valorización', 'cobro de valorización',
    'impuesto de valorización', 'contribución por obra pública',
  ],
  '2428': [
    'impuesto de turismo', 'contribución parafiscal de turismo', 'fontur', 'impuesto de hotel',
    'tasa turística',
  ],
  '2432': [
    'tasa portuaria', 'impuesto de puertos', 'uso del puerto', 'derechos portuarios', 'tasa de muelle',
  ],
  '2436': [
    'impuesto vehicular', 'impuesto del carro', 'impuesto de la moto', 'impuesto de vehículos por pagar',
    'rodamiento', 'impuesto de rodamiento', 'tenencia', 'patente del auto', 'le debo el impuesto del carro',
  ],
  '2440': [
    'impuesto de espectáculos', 'impuesto a los conciertos', 'impuesto de boletería', 'ley del espectáculo',
    'contribución parafiscal de espectáculos',
  ],
  '2444': [
    'impuesto de hidrocarburos', 'impuesto de minas', 'regalías petroleras', 'impuesto al petróleo',
    'impuesto de minería',
  ],
  '2448': [
    'regalías mineras', 'impuesto de pequeña minería', 'regalías de la mina', 'minería pequeña',
    'impuesto del oro', 'regalías del carbón',
  ],
  '2452': [
    'contribución cafetera', 'impuesto al café', 'fondo nacional del café', 'exportación de café',
    'contribución a la federación de cafeteros',
  ],
  '2456': [
    'arancel', 'aranceles', 'impuesto de importación', 'derechos de aduana', 'aduana por pagar', 'dian aduanas',
    'nacionalización', 'impuestos de la importación',
  ],
  '2460': [
    'cuota de fomento', 'fondo de fomento', 'cuota ganadera', 'cuota de fomento avícola', 'fedegán',
    'cuota panelera', 'contribución gremial obligatoria',
  ],
  '2464': [
    'impuesto a los licores', 'impuesto a la cerveza', 'impuesto al cigarrillo', 'impuesto al tabaco',
    'impoconsumo de licores', 'impuesto al trago', 'estampilla de licores',
  ],
  '2468': [
    'degüello', 'impuesto de degüello', 'sacrificio de ganado', 'impuesto al matadero', 'impuesto por sacrificio',
  ],
  '2472': [
    'impuesto de juegos de azar', 'impuesto de loterías', 'impuesto de apuestas', 'coljuegos', 'impuesto de rifas',
    'impuesto de casino',
  ],
  '2476': [
    'uso del suelo', 'ocupación del espacio público', 'impuesto de uso del suelo', 'regalías por uso del suelo',
    'tasa por uso del suelo',
  ],
  '2495': [
    'otros impuestos por pagar', 'impoconsumo', 'impuesto al consumo', 'impuesto nacional al consumo', 'impuesto de bolsas plásticas',
    'impuesto a la bolsa', 'impuesto al carbono', 'impuesto saludable', 'estampillas', 'impuesto de timbre',
    'gmf por pagar', '4x1000 por pagar', 'impuesto de alumbrado', 'sobretasa bomberil', 'impuesto al patrimonio',
  ],

  /* ───────────── 25 Obligaciones laborales ───────────── */
  '2505': [
    'sueldos por pagar', 'nómina por pagar', 'salarios pendientes', 'le debo el sueldo al empleado',
    'quincena por pagar', 'nómina pendiente', 'salarios adeudados', 'le debo a los trabajadores',
    'sueldo atrasado', 'horas extra por pagar', 'comisiones de vendedores por pagar', 'liquidación por pagar',
  ],
  '2510': [
    'cesantías por pagar', 'cesantías consolidadas', 'cesantías del año', 'cesantías acumuladas',
    'le debo las cesantías', 'consignar cesantías', 'cesantías de los empleados',
  ],
  '251005': [
    'cesantías retroactivas', 'régimen anterior de cesantías', 'cesantías del régimen antiguo',
    'cesantías retroactivas de empleados antiguos', 'cesantías antes de 1990',
  ],
  '251010': [
    'cesantías ley 50', 'cesantías al fondo', 'régimen de cesantías actual', 'cesantías anualizadas',
    'cesantías que se consignan en febrero', 'cesantías de ley 50',
  ],
  '2515': [
    'intereses de cesantías por pagar', 'intereses sobre cesantías', 'intereses de las cesantías',
    'el 12 de las cesantías', 'intereses de cesantías de enero', 'le debo los intereses de cesantías',
  ],
  '2520': [
    'prima por pagar', 'prima de servicios', 'prima de junio', 'prima de diciembre', 'prima de mitad de año',
    'prima de navidad', 'le debo la prima', 'aguinaldo', 'paga extra', 'medio sueldo de prima',
  ],
  '2525': [
    'vacaciones por pagar', 'vacaciones consolidadas', 'vacaciones pendientes', 'vacaciones acumuladas',
    'le debo las vacaciones', 'días de vacaciones pendientes', 'vacaciones no disfrutadas',
  ],
  '2530': [
    'prestaciones extralegales', 'prima extralegal', 'bonificación por pagar', 'bono navideño',
    'prima de antigüedad', 'auxilio extralegal', 'beneficios adicionales a empleados', 'bono por resultados',
  ],
  '2532': [
    'pensiones por pagar', 'mesada pensional por pagar', 'pensión de un jubilado', 'le debo la pensión',
    'mesadas de pensionados', 'jubilados de la empresa',
  ],
  '2535': [
    'cuotas partes pensionales', 'cuota parte de pensión', 'cuotas partes de jubilación',
    'pensión compartida', 'cuota parte por pagar',
  ],
  '2540': [
    'indemnización por pagar', 'indemnización por despido', 'despido sin justa causa', 'le debo la indemnización',
    'indemnización laboral', 'liquidación por despido', 'finiquito', 'pago por despido',
  ],

  /* ───────────── 26 Pasivos estimados y provisiones ───────────── */
  '2605': [
    'provisión de costos y gastos', 'gastos estimados', 'gastos por causar', 'provisión de gastos',
    'estimación de gastos', 'gasto que todavía no me facturan', 'gasto devengado sin factura',
    'provisión de servicios públicos',
  ],
  '2610': [
    'provisión de prestaciones', 'provisión de cesantías', 'provisión de prima', 'provisión de vacaciones',
    'provisión de nómina', 'provisión laboral', 'reserva para prestaciones', 'apropiación de prestaciones',
    'causación de prestaciones',
  ],
  '2615': [
    'provisión de impuestos', 'provisión de renta', 'provisión para impuestos', 'impuesto estimado',
    'provisión fiscal', 'provisión de ica', 'reserva para impuestos',
  ],
  '2620': [
    'cálculo actuarial', 'provisión de pensiones', 'pensiones de jubilación', 'reserva pensional',
    'pasivo pensional', 'provisión para jubilados',
  ],
  '2625': [
    'provisión para obras de urbanismo', 'urbanismo', 'obras de urbanización', 'vías y redes del proyecto',
    'provisión de urbanismo del lote',
  ],
  '2630': [
    'provisión para mantenimiento', 'provisión para reparaciones', 'reserva para arreglos',
    'mantenimiento mayor estimado', 'provisión de overhaul', 'provisión para reparaciones futuras',
  ],
  '2635': [
    'provisión para contingencias', 'provisión por demanda', 'demanda laboral', 'pleito', 'litigio',
    'proceso judicial en contra', 'contingencia legal', 'posible multa', 'provisión por demandas',
  ],
  '2640': [
    'provisión para garantías', 'garantía de productos', 'garantías a clientes', 'reclamos por garantía',
    'posventa', 'provisión de garantías', 'reparaciones en garantía',
  ],
  '2695': [
    'provisiones diversas', 'otras provisiones', 'provisión varias', 'estimaciones varias',
    'provisión para imprevistos', 'reserva para imprevistos',
  ],

  /* ───────────── 27 Diferidos ───────────── */
  '2705': [
    'ingresos recibidos por anticipado', 'me pagaron por adelantado', 'cobré por adelantado', 'arriendo cobrado por anticipado',
    'matrículas cobradas por anticipado', 'suscripciones cobradas por adelantado', 'mensualidades por adelantado',
    'ingreso diferido', 'ingresos no devengados', 'pago anticipado de clientes por servicio', 'membresía cobrada por adelantado',
  ],
  '2710': [
    'abonos diferidos', 'intereses cobrados por anticipado', 'descuento diferido', 'abono diferido',
    'ingreso por diferir',
  ],
  '2715': [
    'utilidad diferida', 'venta a plazos', 'venta a cuotas', 'utilidad en ventas a crédito',
    'ganancia de ventas a plazos', 'venta por abonos',
  ],
  '2720': [
    'corrección monetaria diferida', 'ajuste por inflación diferido', 'crédito por corrección monetaria',
    'corrección monetaria', 'ajuste por inflación de diferidos',
  ],
  '2725': [
    'impuesto diferido', 'impuesto diferido pasivo', 'impuesto diferido por pagar', 'diferencias temporarias',
    'impuesto de renta diferido', 'diferido fiscal',
  ],

  /* ───────────── 28 Otros pasivos ───────────── */
  '2805': [
    'anticipos de clientes', 'abonos de clientes', 'adelantos recibidos', 'pagos por adelantado recibidos',
    'el cliente me dio un anticipo', 'el cliente me abonó', 'separado', 'plan separe', 'abono del cliente',
    'me pagaron la mitad antes', 'adelanto del cliente', 'anticipo recibido', 'depósito del cliente', 'enganche recibido',
  ],
  '2810': [
    'depósitos recibidos', 'depósito en garantía', 'depósito del arrendatario', 'fianza del inquilino',
    'depósito por envases', 'depósito de envases retornables', 'garantía recibida', 'plata en custodia',
  ],
  '2815': [
    'ingresos recibidos para terceros', 'recaudo para terceros', 'plata de terceros', 'propinas',
    'propina de los meseros', 'recaudo por cuenta de terceros', 'mandato', 'cobro a nombre de otro',
    'dinero que recaudo para otra empresa', 'comisión de mandato',
  ],
  '2820': [
    'operación conjunta', 'cuentas de operación conjunta', 'consorcio', 'unión temporal', 'joint venture',
    'negocio conjunto', 'aporte del socio del consorcio',
  ],
  '2825': [
    'retención de garantía', 'retención de garantía de obra', 'retenido al contratista', 'garantía de obra retenida',
    'el 5 retenido al contratista', 'retención sobre contrato', 'fondo de garantía del contrato',
  ],
  '2830': [
    'embargo judicial', 'embargo a un proveedor', 'dineros embargados a terceros', 'orden de embargo',
    'embargo de un acreedor', 'embargo ordenado por el juez',
  ],
  '2835': [
    'acreedores del sistema', 'sistema de ahorro programado', 'plan de ahorro de clientes', 'club de compras',
    'autofinanciamiento', 'fondo de ahorro de clientes',
  ],
  '2840': [
    'cuentas en participación', 'contrato de cuentas en participación', 'socio oculto', 'partícipe inactivo',
    'socio gestor', 'aporte del partícipe',
  ],
  '2895': [
    'otros pasivos diversos', 'pasivos varios', 'otras deudas diversas', 'pasivo diverso',
    'otros pasivos', 'cuenta puente de pasivo',
  ],

  /* ───────────── 29 Bonos y papeles comerciales ───────────── */
  '2905': [
    'bonos emitidos', 'emisión de bonos', 'bonos en circulación', 'bonos corporativos', 'deuda en bonos',
    'obligaciones negociables', 'bonistas', 'bonos ordinarios',
  ],
  '2910': [
    'bonos convertibles', 'boceas', 'bonos convertibles en acciones', 'bonos obligatoriamente convertibles',
    'deuda convertible', 'nota convertible',
  ],
  '2915': [
    'papeles comerciales', 'papel comercial', 'pagarés emitidos al mercado', 'deuda de corto plazo en bolsa',
    'commercial paper',
  ],
  '2920': [
    'bonos pensionales', 'bono pensional', 'bono pensional por pagar', 'bono pensional tipo a',
    'traslado de régimen pensional',
  ],
  '2925': [
    'títulos pensionales', 'título pensional', 'título pensional por pagar', 'cálculo de título pensional',
    'pensión por omisión de afiliación',
  ],

  /* ───────────── 31 Capital social ───────────── */
  '3105': [
    'capital', 'capital social', 'capital suscrito', 'capital pagado', 'acciones', 'aporte de socios',
    'la plata de los socios', 'lo que pusieron los socios', 'capital de la sas', 'capital de la sociedad anónima',
    'capital autorizado', 'acciones de la sas', 'aporte inicial', 'plata con la que arrancó la empresa',
    'constitución de la empresa', 'capitalización',
  ],
  '310515': [
    'capital suscrito por cobrar', 'acciones suscritas no pagadas', 'socio que no ha pagado sus acciones',
    'capital pendiente de pago', 'aporte prometido', 'capital por pagar de los socios', 'suscripción por cobrar',
  ],
  '3115': [
    'aportes sociales', 'aportes de socios', 'cuotas de socios', 'capital de la limitada', 'cuotas sociales',
    'cuotas de interés social', 'aportes de la ltda', 'capital de la cooperativa', 'aportes de asociados',
    'partes de interés', 'capital de la sociedad colectiva', 'lo que aportaron los socios',
  ],
  '3120': [
    'capital asignado', 'capital de la sucursal', 'sucursal de sociedad extranjera', 'capital asignado por la matriz',
    'capital de sucursal extranjera',
  ],
  '3125': [
    'inversión suplementaria', 'inversión suplementaria al capital asignado', 'aporte adicional de la casa matriz',
    'capital adicional de la sucursal', 'giro de la matriz a la sucursal',
  ],
  '3130': [
    'capital de persona natural', 'capital del dueño', 'capital del comerciante', 'la plata que puse en el negocio',
    'lo que invertí en mi negocio', 'patrimonio del dueño', 'capital del propietario', 'capital del establecimiento',
    'capital de la tienda', 'capital propio', 'retiros del dueño',
  ],
  '3135': [
    'aportes del estado', 'capital del estado', 'aporte del gobierno', 'capital público', 'empresa estatal',
    'aportes oficiales', 'aporte del municipio',
  ],
  '3140': [
    'fondo social', 'patrimonio de la fundación', 'fondo social de la corporación', 'aportes de la esal',
    'patrimonio de entidad sin ánimo de lucro', 'fondo social de la asociación', 'fondo social de la ong',
  ],

  /* ───────────── 32 Superávit de capital ───────────── */
  '3205': [
    'prima en colocación de acciones', 'prima de emisión', 'sobreprecio de acciones', 'vendí acciones por encima del valor nominal',
    'prima en acciones', 'aporte por encima del nominal', 'prima de colocación', 'agio de acciones',
  ],
  '3210': [
    'donaciones recibidas', 'donación', 'me donaron', 'nos donaron', 'regalo a la empresa', 'aporte gratuito',
    'donativo', 'bienes donados', 'donación en especie',
  ],
  '3215': [
    'crédito mercantil', 'goodwill', 'fondo de comercio', 'plusvalía comercial', 'good will formado',
    'crédito mercantil formado', 'prima de clientela',
  ],
  '3220': [
    'know how', 'saber hacer', 'conocimiento técnico', 'secreto industrial', 'receta secreta',
    'fórmula propia', 'conocimiento del negocio',
  ],
  '3225': [
    'superávit método de participación', 'método de participación', 'mpp', 'utilidad de subsidiarias',
    'variación patrimonial de la subordinada', 'participación en filiales',
  ],

  /* ───────────── 33 Reservas ───────────── */
  '3305': [
    'reserva legal', 'reservas obligatorias', 'el 10 de las utilidades', 'reserva de ley', 'reserva obligatoria',
    'reserva por disposición fiscal', 'apropiación de reserva legal',
  ],
  '3310': [
    'reservas estatutarias', 'reserva de los estatutos', 'reserva estatutaria', 'reserva que dicen los estatutos',
    'reserva para futuras capitalizaciones',
  ],
  '3315': [
    'reservas ocasionales', 'reserva ocasional', 'reserva para ensanche', 'reserva para inversiones',
    'reserva para readquisición de acciones', 'reserva que decidió la asamblea', 'reserva para expansión',
    'reserva para futuros repartos', 'guardar utilidades',
  ],

  /* ───────────── 34 Revalorización del patrimonio ───────────── */
  '3405': [
    'revalorización del patrimonio', 'ajustes por inflación del patrimonio', 'ajuste integral por inflación',
    'inflación del patrimonio', 'revalorización patrimonial',
  ],
  '3410': [
    'saneamiento fiscal', 'saneamiento de activos', 'saneamiento tributario', 'normalización fiscal',
    'saneamiento del patrimonio',
  ],
  '3415': [
    'ajustes por inflación decreto 3019', 'decreto 3019', 'ajustes por inflación de 1989', 'ajuste inflación antiguo', 'ajustes integrales por inflación antiguos',
  ],

  /* ───────────── 35 Dividendos decretados en acciones ───────────── */
  '3505': [
    'dividendos en acciones', 'dividendo en acciones', 'pago de dividendos con acciones', 'capitalizar utilidades',
    'acciones liberadas', 'dividendo pagado en acciones', 'utilidades convertidas en acciones',
  ],
  '3510': [
    'participaciones en cuotas', 'utilidades pagadas en cuotas', 'participaciones decretadas en cuotas',
    'capitalizar utilidades de la limitada', 'utilidades convertidas en cuotas', 'partes de interés como dividendo',
  ],

  /* ───────────── 36 Resultados del ejercicio ───────────── */
  '3605': [
    'utilidad del año', 'ganancia del año', 'utilidad del ejercicio', 'ganancia del ejercicio', 'lo que gané este año',
    'resultado positivo', 'ganancia neta', 'utilidad neta', 'excedente del ejercicio', 'beneficio del año',
    'cierre con utilidad', 'ganamos plata este año',
  ],
  '3610': [
    'pérdida del año', 'pérdida del ejercicio', 'resultado negativo', 'lo que perdí este año', 'pérdida neta',
    'cerramos con pérdida', 'perdimos plata', 'déficit del ejercicio', 'números rojos del año', 'cierre con pérdida',
  ],

  /* ───────────── 37 Resultados de ejercicios anteriores ───────────── */
  '3705': [
    'utilidades acumuladas', 'utilidades de años anteriores', 'ganancias acumuladas', 'utilidades retenidas',
    'utilidades no repartidas', 'ganancias de años pasados', 'resultados acumulados positivos', 'utilidades por distribuir',
    'beneficios acumulados', 'remanentes',
  ],
  '3710': [
    'pérdidas acumuladas', 'pérdidas de años anteriores', 'pérdidas de años pasados', 'pérdidas por compensar',
    'déficit acumulado', 'resultados negativos acumulados', 'pérdidas fiscales de años anteriores',
  ],

  /* ───────────── 38 Superávit por valorizaciones ───────────── */
  '3805': [
    'valorización de inversiones', 'superávit por valorización de acciones', 'las acciones subieron de precio',
    'aumento de valor de inversiones', 'valorización de acciones',
  ],
  '3810': [
    'valorización de propiedades', 'avalúo de la bodega', 'el local subió de valor', 'revaluación de activos',
    'valorización del edificio', 'superávit por revaluación', 'avalúo comercial', 'valorización del terreno',
    'el lote subió de precio',
  ],
  '3895': [
    'valorización de otros activos', 'valorización de obras de arte', 'superávit por valorización de otros activos',
    'avalúo de otros bienes', 'aumento de valor de otros activos',
  ],
}

/** Sinónimos de palabra suelta (cada grupo = palabras intercambiables). */
export const GRUPOS_CLASES_2_3: string[][] = [
  ['sobregiro', 'sobregirado', 'descubierto', 'sobregirar'],
  ['pagare', 'pagares'],
  ['hipoteca', 'hipotecario', 'hipotecar'],
  ['leasing', 'arrendamiento financiero', 'renting'],
  ['contratista', 'subcontratista'],
  ['matriz', 'casa matriz', 'sede principal', 'headquarters'],
  ['vinculada', 'filial', 'subsidiaria', 'subordinada', 'intercompania'],
  ['regalias', 'royalties'],
  ['libranza', 'libranzas'],
  ['embargo', 'embargar', 'embargado', 'embargos'],
  ['sindicato', 'sindical'],
  ['autorretencion', 'autorretenciones', 'autorretenedor'],
  ['arancel', 'aranceles', 'aduana', 'derechos de aduana'],
  ['vehicular', 'rodamiento', 'impuesto de vehiculos'],
  ['impoconsumo', 'impuesto al consumo', 'impuesto nacional al consumo'],
  ['deguello', 'sacrificio de ganado'],
  ['indemnizacion', 'indemnizaciones', 'resarcimiento'],
  ['aguinaldo', 'prima de navidad', 'paga extra'],
  ['jubilacion', 'jubilado', 'pensionado'],
  ['demanda', 'litigio', 'pleito', 'proceso judicial'],
  ['garantia', 'garantias'],
  ['diferido', 'diferidos', 'diferir'],
  ['propina', 'propinas'],
  ['consorcio', 'union temporal', 'joint venture'],
  ['bonista', 'bonistas', 'tenedor de bonos'],
  ['donacion', 'donativo', 'donar', 'donaciones'],
  ['goodwill', 'credito mercantil', 'fondo de comercio'],
  ['know how', 'saber hacer', 'conocimiento tecnico'],
  ['reserva', 'reservas'],
  ['reserva legal', 'reserva obligatoria', 'reserva de ley'],
  ['valorizacion', 'revaluacion', 'valorizaciones'],
  ['deficit', 'numeros rojos'],
  ['utilidades acumuladas', 'utilidades retenidas', 'ganancias acumuladas', 'resultados acumulados'],
  ['capital social', 'capital suscrito', 'capital pagado'],
  ['cuotas sociales', 'partes de interes', 'cuotas de interes social'],
]

/** Consultas de prueba: lo que escribiría una persona → el código que debe aparecer entre los 3 primeros. */
export const PRUEBAS_CLASES_2_3: Record<string, string> = {
  'le debo al banco': '2105',
  'saqué un crédito en bancolombia': '2105',
  'deuda de la tarjeta de crédito de la empresa': '2105',
  'la cuenta quedó en rojo': '210505',
  'firmé un pagaré con el banco': '210510',
  'carta de crédito para importar': '210515',
  'crédito en dólares con banco extranjero': '2110',
  'leasing del carro': '2120',
  'crédito hipotecario de la bodega': '2125',
  'préstamo de bancóldex': '2145',
  'me prestó un gota a gota': '2195',
  'compré mercancía fiada al proveedor': '2205',
  'le debo al proveedor de china': '2210',
  'le debo al maestro de obra': '2320',
  'vendí tarjetas regalo': '2330',
  'intereses del préstamo por pagar': '233505',
  'le debo al contador': '233525',
  'le debo al mecánico': '233535',
  'le debo el arriendo del local': '233540',
  'recibo de la luz pendiente': '233550',
  'regalías de la franquicia por pagar': '2350',
  'el socio le prestó a la empresa': '2355',
  'le debo al gerente': '2357',
  'dividendos pendientes de pagar a los socios': '2360',
  'retención que le hice al proveedor': '2365',
  'retención del 11 al abogado': '236515',
  'retención al arrendador': '236530',
  'autorretención especial de renta': '236575',
  'iva que le retuve al proveedor': '2367',
  'reteica que practiqué': '2368',
  'pagar la planilla pila': '2370',
  'aporte a la eps del empleado': '237005',
  'aportes a la caja de compensación': '237010',
  'embargo del sueldo de un empleado': '237025',
  'descuento por libranza': '237030',
  'descuento del fondo de empleados': '237040',
  'consignación sin identificar': '238095',
  'lo que le debo a la dian de renta': '2404',
  'lo que le debo a la dian de iva': '2408',
  'declaración de ica en la alcaldía': '2412',
  'le debo el predial': '2416',
  'impuesto del carro por pagar': '2436',
  'aranceles de la importación': '2456',
  'impoconsumo del restaurante': '2495',
  'le debo el sueldo a los trabajadores': '2505',
  'cesantías de los empleados': '2510',
  'intereses de las cesantías': '2515',
  'prima de diciembre': '2520',
  'vacaciones pendientes del empleado': '2525',
  'bono navideño a los empleados': '2530',
  'indemnización por despido sin justa causa': '2540',
  'provisión de prestaciones sociales': '2610',
  'demanda laboral en contra': '2635',
  'garantía de productos vendidos': '2640',
  'matrículas cobradas por adelantado': '2705',
  'impuesto diferido pasivo': '2725',
  'el cliente me dio un anticipo': '2805',
  'depósito del inquilino': '2810',
  'propinas de los meseros': '2815',
  'unión temporal con otra empresa': '2820',
  'retención de garantía al contratista': '2825',
  'emisión de bonos corporativos': '2905',
  'la plata de los socios': '3105',
  'socio que no ha pagado sus acciones': '310515',
  'cuotas de la limitada': '3115',
  'lo que invertí en mi negocio': '3130',
  'patrimonio de la fundación': '3140',
  'prima de emisión de acciones': '3205',
  'nos donaron un computador': '3210',
  'goodwill': '3215',
  'reserva legal del 10': '3305',
  'reserva para ensanche': '3315',
  'dividendos en acciones': '3505',
  'lo que gané este año': '3605',
  'cerramos con pérdida': '3610',
  'utilidades no repartidas': '3705',
  'pérdidas de años pasados': '3710',
  'el local subió de valor': '3810',
}
