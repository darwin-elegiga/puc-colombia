/**
 * Vocabulario coloquial de la clase 1 (activo): disponible, inversiones, deudores,
 * inventarios, propiedades planta y equipo, intangibles, diferidos, otros activos y
 * valorizaciones. Incluye bienes concretos, marcas y variantes regionales.
 */

/** Formas de nombrar lo que registra cada cuenta. */
export const ALIAS_CLASE_1: Record<string, string[]> = {
  /* ───────── 11 Disponible ───────── */
  '1105': [
    'efectivo', 'plata en efectivo', 'dinero en efectivo', 'billetes', 'monedas', 'cash', 'plata en la caja',
    'caja registradora', 'la registradora', 'cajón del dinero', 'plata del día', 'lo que hay en caja',
    'recaudo en efectivo', 'venta de contado en efectivo', 'guita', 'lana', 'pasta', 'lucas', 'billullo',
  ],
  '110505': [
    'caja general', 'caja principal', 'efectivo del día', 'recaudo del día', 'cuadre de caja', 'arqueo de caja',
    'venta en efectivo', 'plata del mostrador', 'caja del almacén', 'efectivo de la tienda',
  ],
  '110510': [
    'caja menor', 'caja chica', 'fondo fijo', 'fondo de caja menor', 'gastos menores', 'fondo rotatorio de caja',
    'reembolso de caja menor', 'plata para gastos pequeños', 'vales de caja', 'petty cash',
  ],
  '110515': [
    'dólares en efectivo', 'euros en efectivo', 'divisas en efectivo', 'billetes en dólares', 'moneda extranjera en caja',
    'efectivo en dólares', 'usd en efectivo', 'plata en dólares',
  ],
  '1110': [
    'banco', 'bancos', 'cuenta corriente', 'plata en el banco', 'consignaciones', 'transferencias', 'transferencia bancaria',
    'pse', 'pagos con tarjeta', 'datáfono', 'cheques recibidos', 'saldo en banco', 'cuenta bancaria',
    'bancolombia', 'davivienda', 'banco de bogotá', 'bbva', 'scotiabank colpatria',
    'banco caja social',
  ],
  '111005': [
    'cuenta corriente en pesos', 'cuenta bancaria en pesos', 'banco nacional', 'cuenta en pesos colombianos',
    'cuenta corriente bancolombia', 'cuenta corriente davivienda', 'cuenta de cheques', 'chequera',
  ],
  '111010': [
    'cuenta en dólares', 'cuenta en el exterior', 'cuenta en euros', 'banco extranjero', 'cuenta compensada',
    'cuenta en estados unidos', 'cuenta usd', 'cuenta de divisas', 'wise', 'payoneer',
  ],
  '1115': [
    'remesas en tránsito', 'plata en camino', 'transferencia pendiente', 'cheque en canje', 'consignación en tránsito',
    'dinero enviado sin llegar', 'giro en tránsito', 'fondos en tránsito',
  ],
  '1120': [
    'cuenta de ahorros', 'ahorros', 'plata ahorrada', 'nequi', 'daviplata', 'movii', 'dale', 'lulo bank', 'nu', 'nubank',
    'billetera digital', 'billetera virtual', 'monedero electrónico', 'me depositaron por nequi', 'me pasaron por daviplata',
    'cuenta de ahorros bancolombia', 'libreta de ahorros', 'caja de ahorro', 'mercado pago', 'paypal',
  ],
  '112005': [
    'ahorros en banco', 'cuenta de ahorros bancaria', 'cuenta de ahorros davivienda', 'cuenta de ahorros bbva',
    'ahorro en bancolombia', 'cuenta de ahorros en pesos',
  ],
  '112010': [
    'corporación de ahorro y vivienda', 'cav', 'upac', 'ahorro para vivienda', 'cuenta afc', 'ahorro programado vivienda',
  ],
  '1125': [
    'fondos', 'fondo de inversión colectiva', 'fic', 'fondo rotatorio', 'fondo especial', 'fondo para un fin específico',
    'fondo de reserva', 'plata apartada', 'fondo para pagar prestaciones',
  ],
  '112505': [ 'fondo de reposición','fondo rotatorio', 'fondo que se repone', 'fondo de anticipos rotatorio', 'fondo renovable'],
  '112515': [ 'fondo de destinación específica','fondo especial', 'fondo para proyecto', 'plata separada para un fin', 'fondo destinado'],

  /* ───────── 12 Inversiones ───────── */
  '1205': [
    'acciones', 'acciones en bolsa', 'compra de acciones', 'acciones de ecopetrol', 'acciones de bancolombia',
    'acciones de otra empresa', 'invertir en bolsa', 'bolsa de valores', 'bvc', 'trii', 'tyba', 'etf',
    'acciones de apple', 'portafolio de acciones', 'participación accionaria',
  ],
  '1210': [
    'cuotas de interés social', 'cuotas de una limitada', 'partes de interés', 'participación en una ltda',
    'socio de otra empresa', 'aporte en otra sociedad', 'cuotas sociales de otra compañía',
  ],
  '1215': ['bonos', 'bonos del gobierno', 'bonos corporativos', 'bonos de deuda', 'obligaciones negociables', 'bono pensional'],
  '1220': [ 'títulos de capitalización','cédulas', 'cédulas hipotecarias', 'cédulas de capitalización', 'cédulas de inversión'],
  '1225': [
    'cdt', 'certificado de depósito a término', 'depósito a plazo fijo', 'plazo fijo', 'cdat', 'certificados de depósito',
    'inversión a término', 'cdt en el banco', 'certificado de ahorro', 'depósito a plazo',
  ],
  '1230': [ 'papeles de deuda empresarial','papeles comerciales', 'pagarés comerciales', 'títulos de corto plazo', 'papel comercial de empresas'],
  '1235': [
    'títulos', 'tes', 'títulos de tesorería', 'títulos del gobierno', 'bonos del tesoro', 'cetes', 'letras del tesoro',
    'títulos valores', 'tidis', 'títulos de deuda pública',
  ],
  '1240': [ 'aceptación bancaria comprada', 'inversión en aceptaciones','aceptaciones bancarias', 'aceptaciones financieras', 'letra aceptada por banco'],
  '1245': [
    'derechos fiduciarios', 'fiducia', 'encargo fiduciario', 'patrimonio autónomo', 'fideicomiso',
    'fiducia inmobiliaria', 'plata en fiduciaria', 'fiduciaria bancolombia',
  ],
  '1250': ['repos', 'operaciones repo', 'pacto de recompra', 'derechos de recompra', 'reporto'],
  '1255': ['inversiones obligatorias', 'bonos obligatorios', 'títulos de desarrollo agropecuario', 'tda', 'inversión forzosa'],
  '1260': [ 'contrato de cuentas en participación','cuentas en participación', 'participé en un negocio', 'socio oculto', 'aporte a cuentas en participación'],
  '1295': [
    'otras inversiones', 'criptomonedas', 'cripto', 'bitcoin', 'ethereum', 'usdt', 'binance', 'oro', 'lingotes',
    'obras de inversión', 'crowdfunding', 'a2censo', 'inversión en startup', 'fondo voluntario de pensiones',
    'fondo de pensiones voluntarias',
  ],
  '1299': [
    'provisión de inversiones', 'deterioro de inversiones', 'pérdida de valor de acciones', 'bajaron las acciones',
    'desvalorización de inversiones',
  ],

  /* ───────── 13 Deudores ───────── */
  '1305': [
    'clientes', 'cartera', 'cuentas por cobrar', 'cxc', 'plata que me deben', 'clientes que me deben', 'me deben',
    'fiado', 'ventas a crédito', 'facturas por cobrar', 'vendí a crédito', 'le fié', 'crédito a clientes',
    'cobro a clientes', 'facturas pendientes de cobro', 'deudores comerciales',
  ],
  '130505': [
    'clientes nacionales', 'cartera nacional', 'clientes colombianos', 'cuentas por cobrar nacionales',
    'factura a cliente local', 'clientes del país',
  ],
  '130510': [
    'clientes del exterior', 'clientes extranjeros', 'exportaciones por cobrar', 'cliente en estados unidos',
    'factura de exportación', 'cartera del exterior', 'cliente internacional',
  ],
  '130515': [ 'cartera del sistema de ventas', 'clientes del sistema','deudores del sistema', 'cartera del sistema', 'deudores por sistema de ventas'],
  '1310': [ 'cuenta corriente mercantil','cuentas corrientes comerciales', 'cuenta corriente con un tercero', 'cruce de cuentas', 'cuenta recíproca'],
  '1315': [ 'préstamo a la casa matriz','casa matriz', 'cuentas por cobrar a la matriz', 'me debe la casa matriz', 'sede principal me debe'],
  '1320': [
    'vinculados económicos', 'empresas del grupo', 'filiales', 'subsidiarias', 'compañías relacionadas',
    'partes relacionadas', 'me debe la empresa hermana',
  ],
  '1323': [ 'cuentas por cobrar a la junta directiva','cuentas por cobrar a directores', 'préstamo al gerente', 'me debe el gerente', 'directivos que deben'],
  '1325': [
    'cuentas por cobrar a socios', 'préstamo a socios', 'le presté al socio', 'me debe el socio', 'socio debe',
    'plata que sacó el socio', 'accionistas deudores',
  ],
  '1328': [
    'aportes por cobrar', 'capital suscrito por pagar', 'capital por cobrar a socios', 'aporte prometido del socio',
    'suscripción de acciones por cobrar',
  ],
  '1330': [
    'anticipos', 'anticipos entregados', 'adelantos', 'avances', 'pagué por adelantado', 'adelanto a un tercero',
    'anticipo pagado', 'abono entregado',
  ],
  '133005': [
    'anticipo a proveedores', 'adelanto al proveedor', 'le pagué por adelantado al proveedor', 'abono a proveedor',
    'anticipo de compra', 'pago anticipado de mercancía',
  ],
  '133010': [
    'anticipo a contratistas', 'adelanto al contratista', 'anticipo de obra', 'adelanto al maestro de obra',
    'anticipo al constructor',
  ],
  '133015': [
    'anticipo a empleados', 'adelanto de sueldo', 'adelanto de nómina', 'vale del empleado', 'avance a trabajadores',
    'anticipo de viáticos', 'adelanto de quincena',
  ],
  '133020': [ 'adelanto a representantes','anticipo a agentes', 'adelanto a agentes', 'anticipo a agente aduanero', 'anticipo a comisionistas'],
  '133025': [ 'adelanto a concesionaria', 'abono al concesionario','anticipo a concesionarios', 'adelanto al concesionario', 'anticipo para comprar carro'],
  '133030': [ 'anticipo en adjudicación de bienes', 'adelanto por adjudicación','anticipos de adjudicaciones', 'adjudicaciones', 'anticipo por adjudicación'],
  '1332': ['operación conjunta', 'consorcio', 'unión temporal', 'joint venture', 'negocio conjunto'],
  '1335': [
    'depósitos', 'depósito en garantía', 'depósito del arriendo', 'fianza del arriendo', 'garantía entregada',
    'depósito judicial', 'depósito para licitación', 'depósito de servicios públicos',
  ],
  '1340': ['promesa de compraventa', 'arras', 'abono por promesa', 'separé un apartamento', 'cuota inicial pagada'],
  '1345': [
    'ingresos por cobrar', 'intereses por cobrar', 'arriendos por cobrar', 'comisiones por cobrar',
    'honorarios por cobrar', 'ingresos causados no cobrados',
  ],
  '134505': [
    'dividendos por cobrar', 'participaciones por cobrar', 'dividendos decretados', 'me van a pagar dividendos',
    'utilidades por recibir',
  ],
  '1350': [ 'garantía retenida por el cliente','retención sobre contratos', 'retención de garantía', 'retegarantía', 'porcentaje retenido en obra'],
  '1355': [
    'anticipo de impuestos', 'saldo a favor', 'impuestos a favor', 'retenciones que me hicieron', 'anticipo de renta',
    'saldo a favor dian', 'me retuvieron', 'descontable de renta',
  ],
  '135505': [ 'autorretención de renta',
    'anticipo de renta', 'anticipo del impuesto de renta', 'anticipo para el año siguiente', 'anticipo renta dian',
  ],
  '135510': [ 'anticipo de ica municipal','anticipo de ica', 'anticipo de industria y comercio', 'ica pagado por anticipado', 'anticipo reteica municipal'],
  '135515': [
    'retención en la fuente a favor', 'retefuente a favor', 'me retuvieron', 'retención que me practicaron',
    'me hicieron retención', 'retefuente que me descontaron', 'certificado de retención',
  ],
  '135517': [ 'reteiva descontable','reteiva a favor', 'iva que me retuvieron', 'reteiva que me practicaron', 'me retuvieron iva'],
  '135518': [ 'reteica descontable','reteica a favor', 'ica que me retuvieron', 'reteica que me practicaron', 'me retuvieron ica'],
  '135520': [
    'saldo a favor en declaración', 'saldo a favor de renta', 'saldo a favor de iva', 'devolución de impuestos',
    'pagué impuestos de más', 'sobrante en declaración',
  ],
  '135525': [ 'contribución a favor', 'contribuciones pagadas de más','contribuciones a favor', 'contribución pagada por anticipado', 'anticipo de contribuciones'],
  '1360': [
    'reclamaciones', 'reclamo a la aseguradora', 'indemnización por cobrar', 'siniestro por cobrar',
    'reclamo al seguro', 'me debe el seguro', 'reclamo a transportadora',
  ],
  '1365': [
    'cuentas por cobrar a trabajadores', 'préstamo a empleados', 'le presté a un empleado', 'deuda de un trabajador',
    'empleado me debe', 'préstamo de nómina', 'descuento por nómina',
  ],
  '136505': [ 'préstamo para vivienda del trabajador', 'crédito de vivienda a trabajador','préstamo de vivienda a empleado', 'préstamo para casa del trabajador', 'crédito de vivienda al empleado'],
  '136510': [ 'préstamo para vehículo del trabajador', 'crédito de moto a empleado','préstamo para carro del empleado', 'préstamo de vehículo a trabajador', 'le presté para la moto'],
  '136515': [ 'préstamo para matrícula','préstamo de educación', 'préstamo para estudios del empleado', 'auxilio educativo reembolsable', 'préstamo universidad'],
  '136520': [ 'préstamo para gastos médicos','préstamo médico', 'préstamo odontológico', 'préstamo para salud del empleado', 'préstamo para cirugía'],
  '136525': [ 'préstamo por calamidad del trabajador', 'auxilio reembolsable por calamidad','calamidad doméstica', 'préstamo por calamidad', 'préstamo de emergencia al empleado'],
  '136530': [
    'faltante de caja', 'faltante a cargo del empleado', 'responsabilidad del cajero', 'empleado responde por pérdida',
    'daño a cargo del trabajador', 'descuadre del cajero',
  ],
  '1370': [
    'préstamos a particulares', 'le presté a un amigo', 'préstamo a terceros', 'préstamo a una persona',
    'plata prestada', 'le presté plata a alguien',
  ],
  '1380': [
    'deudores varios', 'otras cuentas por cobrar', 'cuentas por cobrar varias', 'me deben por otras cosas',
    'cobros pendientes varios', 'pagos por cuenta de terceros',
  ],
  '1385': [ 'cartera vendida con recompra', 'venta de cartera con pacto','recompra de cartera', 'factoring con recompra', 'cartera negociada'],
  '1390': [
    'cartera de difícil cobro', 'deudas de difícil cobro', 'cliente moroso', 'cartera vencida', 'cartera en cobro jurídico',
    'no me paga', 'deuda perdida', 'deudor moroso',
  ],
  '1399': [
    'provisión de cartera', 'deterioro de cartera', 'cartera incobrable', 'provisión de deudores', 'deterioro de cuentas por cobrar',
    'estimación de incobrables',
  ],
  '139905': [ 'estimación de incobrables de clientes','provisión de clientes', 'deterioro de clientes', 'provisión cartera clientes', 'clientes que no pagarán'],
  '139910': [ 'provisión de cuentas comerciales', 'deterioro de cuenta recíproca', 'provisión de cuentas corrientes','provisión cuentas corrientes comerciales', 'deterioro de cuentas corrientes'],

  /* ───────── 14 Inventarios ───────── */
  '1405': [
    'materias primas', 'materia prima', 'insumos', 'insumos de producción', 'harina', 'telas', 'madera para fabricar',
    'resina', 'hilos', 'cuero', 'material para fabricar', 'ingredientes',
  ],
  '1410': ['productos en proceso', 'producción en curso', 'productos a medio hacer', 'trabajo en proceso', 'wip', 'en fabricación'],
  '1415': [ 'casas en construcción para vender','obras en construcción', 'obra en curso para vender', 'proyecto de construcción', 'apartamentos en construcción'],
  '1417': ['obras de urbanismo', 'urbanización', 'loteo', 'vías de urbanización', 'parcelación'],
  '1420': [ 'obra por encargo sin entregar','contratos en ejecución', 'obra por contrato', 'proyecto en ejecución', 'contrato sin terminar'],
  '1425': ['cultivos en desarrollo', 'siembra', 'cosecha pendiente', 'cultivo de ciclo corto', 'sembrado'],
  '1428': ['plantaciones agrícolas', 'plantación para vender', 'cafetal', 'platanera', 'cultivo de palma'],
  '1430': [
    'productos terminados', 'producto terminado', 'lo que fabricamos', 'producción terminada', 'bodega de producto final',
    'artículos fabricados',
  ],
  '1435': [
    'mercancía', 'mercancías', 'mercadería', 'mercancía para vender', 'inventario', 'productos para la venta', 'stock',
    'existencias', 'surtido', 'compré mercancía', 'artículos para revender', 'reventa', 'productos de la tienda',
  ],
  '1440': ['bienes raíces para la venta', 'apartamentos para vender', 'casas para vender', 'inmuebles para la venta', 'finca raíz para vender'],
  '1445': ['semovientes para la venta', 'ganado de engorde', 'novillos para vender', 'pollos de engorde', 'cerdos para venta'],
  '1450': [ 'terreno para lotear','terrenos para la venta', 'lotes para vender', 'lote en inventario', 'terreno para revender'],
  '1455': [
    'materiales', 'repuestos', 'accesorios', 'repuestos en bodega', 'materiales de mantenimiento', 'tornillos',
    'lubricantes en bodega', 'refacciones', 'recambios', 'piezas de repuesto',
  ],
  '1460': ['envases', 'empaques', 'cajas de cartón', 'bolsas', 'botellas', 'etiquetas', 'material de empaque', 'embalaje'],
  '1465': [
    'inventario en tránsito', 'mercancía en tránsito', 'importación en camino', 'mercancía en aduana', 'pedido en camino',
    'mercancía viajando', 'contenedor en camino',
  ],
  '1499': ['provisión de inventarios', 'deterioro de inventarios', 'mercancía obsoleta', 'mercancía dañada', 'inventario vencido'],

  /* ───────── 15 Propiedades, planta y equipo ───────── */
  '1504': [
    'terreno', 'terrenos', 'lote', 'finca', 'predio', 'parcela', 'solar', 'hacienda', 'chacra', 'rancho',
    'compré un lote', 'terreno de la empresa', 'lote urbano', 'lote rural',
  ],
  '1506': [ 'equipos para proyectos petroleros', 'materiales de perforación','materiales proyectos petroleros', 'tubería petrolera', 'materiales para pozos'],
  '1508': [
    'construcciones en curso', 'obra en construcción', 'estoy construyendo la bodega', 'edificio en obra',
    'construcción sin terminar', 'obra negra', 'ampliación en curso',
  ],
  '1512': [ 'máquina en instalación','maquinaria en montaje', 'equipo en instalación', 'máquina sin instalar', 'montaje de maquinaria'],
  '1516': [
    'edificio', 'edificaciones', 'construcciones', 'bodega propia', 'local propio', 'oficina propia', 'casa',
    'apartamento', 'departamento', 'piso', 'nave industrial', 'galpón', 'planta física', 'inmueble', 'sede propia',
    'compré una oficina', 'compré un local',
  ],
  '1520': [
    'maquinaria', 'máquinas', 'maquinaria industrial', 'herramientas', 'torno', 'fresadora', 'compresor',
    'planta eléctrica', 'generador', 'montacargas', 'soldador', 'taladro', 'máquina de coser', 'horno industrial',
    'retroexcavadora', 'tractor', 'equipo industrial',
  ],
  '1524': [
    'equipo de oficina', 'muebles', 'enseres', 'mobiliario', 'escritorio', 'silla', 'archivador', 'estantería',
    'aire acondicionado', 'caja fuerte', 'fotocopiadora', 'mueble de oficina',
  ],
  '152405': [
    'muebles y enseres', 'escritorios', 'sillas', 'sillas ergonómicas', 'mesas', 'archivadores', 'estantes', 'repisas',
    'sofá', 'counter', 'vitrina', 'góndola', 'mostrador', 'mueble', 'locker', 'lockers',
  ],
  '152410': [
    'equipos de oficina', 'fotocopiadora', 'aire acondicionado', 'ventilador', 'caja registradora', 'caja fuerte',
    'reloj de marcación', 'trituradora de papel', 'televisor', 'tv', 'proyector', 'video beam', 'dispensador de agua',
  ],
  '1528': [
    'equipo de cómputo', 'equipo de computación', 'computadores', 'computador', 'ordenador', 'computadora', 'portátil',
    'laptop', 'pc', 'impresoras', 'servidores', 'celulares de la empresa', 'tecnología', 'equipos tecnológicos',
    'hardware', 'teléfonos de la empresa', 'tablet',
  ],
  '152805': [
    'computador', 'ordenador', 'computadora', 'portátil', 'laptop', 'notebook', 'pc', 'pc de escritorio', 'mac',
    'macbook', 'imac', 'dell', 'lenovo', 'impresora', 'escáner', 'servidor', 'monitor', 'tablet', 'ipad', 'mouse',
  ],
  '152810': [
    'celular', 'celulares', 'móvil', 'teléfono móvil', 'smartphone', 'iphone', 'samsung galaxy', 'xiaomi',
    'teléfono', 'conmutador', 'planta telefónica', 'router', 'módem', 'switch', 'antena', 'radio de comunicación',
    'walkie talkie', 'radioteléfono', 'teléfono ip', 'central telefónica',
  ],
  '1532': [
    'equipo médico', 'equipo científico', 'equipo de laboratorio', 'microscopio', 'rayos x', 'ecógrafo',
    'unidad odontológica', 'sillón odontológico', 'camilla', 'monitor de signos vitales', 'autoclave',
    'equipo de consultorio',
  ],
  '1536': [
    'equipo de restaurante', 'equipo de cocina', 'nevera', 'refrigerador', 'heladera', 'frigorífico', 'congelador',
    'freezer', 'estufa', 'horno', 'freidora', 'plancha', 'cafetera', 'máquina de café', 'vajilla',
    'equipo de hotel', 'camas del hotel', 'lencería de hotel', 'cuarto frío', 'vitrina refrigerada',
  ],
  '1540': [
    'vehículos', 'vehículo', 'carro', 'carro de la empresa', 'coche', 'auto', 'automóvil', 'camioneta', 'moto',
    'motocicleta', 'camión', 'furgón', 'bus', 'buseta', 'flota', 'equipo de transporte', 'hilux', 'compré un carro',
    'bicicleta de reparto',
  ],
  '154005': [
    'carro', 'coche', 'auto', 'automóvil', 'camioneta', 'campero', 'jeep', 'suv', 'pickup', 'toyota hilux',
    'renault', 'chevrolet', 'mazda', 'kia', 'ford ranger', 'nissan frontier', 'moto', 'motocicleta', 'vehículo liviano',
    'carro del gerente',
  ],
  '154008': [
    'camión', 'volqueta', 'furgón', 'furgoneta', 'tractomula', 'tracto camión', 'camión de reparto', 'npr',
    'chevrolet npr', 'hino', 'kenworth', 'turbo', 'van', 'vehículo de carga', 'mula',
  ],
  '1544': ['embarcación', 'lancha', 'bote', 'barco', 'yate', 'planchón', 'equipo fluvial', 'equipo marítimo', 'chalupa'],
  '1548': ['avión', 'avioneta', 'helicóptero', 'aeronave', 'dron', 'equipo aéreo', 'flota aérea'],
  '1552': ['tren', 'locomotora', 'vagones', 'equipo férreo', 'equipo ferroviario', 'rieles'],
  '1556': ['acueducto propio', 'planta de tratamiento', 'redes de agua', 'redes eléctricas', 'planta de agua', 'tanques de almacenamiento', 'tubería'],
  '1560': ['armamento de vigilancia', 'armas', 'revólver', 'escopeta', 'armamento de seguridad', 'pistola del vigilante'],
  '1562': ['envases retornables', 'canastas', 'cilindros de gas', 'estibas', 'pallets', 'barriles', 'envases como activo'],
  '1564': ['plantaciones forestales', 'plantación de árboles', 'cultivo permanente', 'árboles frutales', 'cafetal propio', 'palma de aceite', 'bosque plantado'],
  '1568': ['vías de comunicación', 'carretera privada', 'puente', 'pavimentos', 'vía interna', 'caminos', 'parqueadero propio'],
  '1572': ['minas', 'canteras', 'mina de carbón', 'cantera de piedra', 'mina de oro', 'explotación minera'],
  '1576': [ 'pozo profundo','pozo artesiano', 'pozo de agua', 'aljibe', 'perforación de pozo'],
  '1580': [ 'mina sin explotar','yacimientos', 'yacimiento petrolero', 'yacimiento de gas', 'reservas minerales'],
  '1584': [
    'semovientes', 'ganado', 'vacas', 'toros', 'caballos', 'reses', 'animales de trabajo', 'ganado lechero',
    'ganado reproductor', 'mulas de carga',
  ],
  '1588': [ 'activos importados sin llegar','activo fijo en tránsito', 'maquinaria en tránsito', 'equipo importado en camino', 'activo en aduana'],
  '1592': [
    'depreciación acumulada', 'desgaste acumulado', 'depreciación de activos fijos', 'pérdida de valor de los equipos',
    'vida útil consumida',
  ],
  '159205': [ 'depreciación de la casa','depreciación del edificio', 'depreciación de construcciones', 'depreciación de la bodega', 'depreciación del local'],
  '159210': [ 'depreciación del torno', 'depreciación de equipos industriales','depreciación de maquinaria', 'depreciación de máquinas', 'depreciación de herramientas'],
  '159215': [ 'depreciación de sillas', 'depreciación de enseres','depreciación de muebles', 'depreciación de equipo de oficina', 'depreciación de escritorios'],
  '159220': [ 'depreciación del computador','depreciación de computadores', 'depreciación del portátil', 'depreciación de celulares', 'depreciación de equipo de cómputo'],
  '159235': [ 'depreciación del camión','depreciación del carro', 'depreciación de vehículos', 'depreciación de la camioneta', 'depreciación de la moto'],
  '1596': [ 'depreciación diferida fiscal', 'impuesto diferido por depreciación','depreciación diferida', 'diferencia depreciación fiscal', 'exceso de depreciación fiscal'],
  '1597': [ 'amortización de activos fijos', 'amortización de propiedad planta y equipo','amortización acumulada de activos fijos', 'amortización de mejoras', 'amortización ppe'],
  '1598': [ 'agotamiento de pozos','agotamiento acumulado', 'agotamiento de minas', 'agotamiento de yacimientos', 'agotamiento de canteras'],
  '1599': ['provisión de activos fijos', 'deterioro de propiedad planta y equipo', 'deterioro ppe', 'activo dañado', 'desvalorización del activo'],

  /* ───────── 16 Intangibles ───────── */
  '1605': ['crédito mercantil', 'good will', 'goodwill', 'plusvalía', 'prima pagada al comprar empresa', 'fondo de comercio'],
  '1610': ['marca', 'marcas', 'registro de marca', 'marca registrada', 'logo registrado', 'compré una marca', 'registro en la sic', 'nombre comercial'],
  '1615': ['patentes', 'patente', 'invento patentado', 'registro de patente', 'modelo de utilidad', 'diseño industrial'],
  '1620': ['concesiones', 'franquicias', 'franquicia', 'compré una franquicia', 'derecho de franquicia', 'concesión'],
  '1625': ['derechos', 'derechos de autor', 'derecho de uso', 'derechos de explotación', 'propiedad intelectual', 'derechos sobre bienes'],
  '1630': ['know how', 'saber hacer', 'fórmula secreta', 'secreto industrial', 'receta propia', 'conocimiento técnico comprado'],
  '1635': [
    'licencias', 'licencia de software', 'licencia perpetua', 'licencia de windows', 'licencia de office',
    'licencia de sap', 'licencia de autocad', 'licencia de funcionamiento', 'software licenciado',
  ],
  '1698': [ 'amortización del goodwill','amortización de intangibles', 'amortización de marcas', 'amortización de licencias', 'amortización de patentes'],
  '1699': [ 'pérdida de valor de la marca', 'deterioro de licencias','provisión de intangibles', 'deterioro de intangibles', 'deterioro del goodwill'],

  /* ───────── 17 Diferidos ───────── */
  '1705': [
    'gastos pagados por anticipado', 'pagos por adelantado', 'gastos prepagados', 'prepagos', 'pagué por adelantado',
    'gasto anticipado', 'pago anticipado de servicios', 'suscripción anual pagada',
  ],
  '170505': [ 'intereses pagados por adelantado', 'intereses cobrados por anticipado por el banco','intereses pagados por anticipado', 'intereses anticipados', 'intereses prepagados'],
  '170520': [
    'seguros pagados por anticipado', 'póliza pagada por anticipado', 'seguro prepagado', 'póliza anual', 'soat pagado',
    'seguro del carro anual', 'póliza todo riesgo', 'fianzas pagadas',
  ],
  '170525': ['arriendo pagado por anticipado', 'alquiler adelantado', 'renta prepagada', 'arriendo anticipado', 'pagué varios meses de arriendo'],
  '1710': [ 'cargos por amortizar','cargos diferidos', 'gastos diferidos', 'gastos por amortizar', 'diferir el gasto'],
  '171004': ['gastos de constitución', 'gastos preoperativos', 'gastos de organización', 'gastos antes de abrir', 'montaje de la empresa', 'puesta en marcha'],
  '171016': [
    'software', 'programa de computador', 'programas', 'aplicación', 'app', 'sistema contable', 'siigo', 'alegra',
    'world office', 'helisa', 'sap', 'excel', 'office', 'microsoft 365', 'windows', 'antivirus', 'erp', 'crm',
    'página web',
  ],
  '171020': ['útiles y papelería', 'papelería en bodega', 'resmas', 'papelería por consumir', 'útiles de oficina', 'tóner', 'cartuchos de tinta'],
  '171024': [
    'mejoras a propiedades ajenas', 'remodelación del local arrendado', 'adecuación de oficina arrendada',
    'mejoras al local alquilado', 'obras en local arrendado', 'arreglos en el local arrendado',
  ],
  '1715': [ 'exploración de pozos','costos de exploración', 'exploración minera', 'exploración petrolera', 'estudios de exploración'],
  '1720': [ 'costos de explotación minera', 'desarrollo de pozos','costos de explotación', 'desarrollo de mina', 'costos de desarrollo'],
  '1730': [ 'ajuste por inflación diferido', 'corrección monetaria','corrección monetaria diferida', 'ajustes por inflación diferidos', 'cargo por corrección monetaria'],
  '1798': [ 'amortización de preoperativos','amortización acumulada de diferidos', 'amortización del software', 'amortización de mejoras', 'amortización de cargos diferidos'],

  /* ───────── 18 Otros activos ───────── */
  '1805': [
    'obras de arte', 'cuadros', 'pinturas', 'esculturas', 'bienes de arte', 'libros antiguos', 'colección de arte',
    'antigüedades', 'bienes culturales',
  ],
  '1895': ['otros activos', 'activos diversos', 'bienes entregados en comodato', 'bienes recibidos en pago', 'maquinaria para arrendar'],
  '1899': [ 'activos diversos deteriorados', 'pérdida de valor de otros activos', 'provisión de obras de arte','provisión de otros activos', 'deterioro de otros activos'],

  /* ───────── 19 Valorizaciones ───────── */
  '1905': [ 'valorización de acciones','valorización de inversiones', 'subieron las acciones', 'mayor valor de acciones', 'ganancia no realizada de inversiones'],
  '1910': [
    'valorización de propiedades', 'valorización del edificio', 'avalúo comercial', 'el lote se valorizó',
    'subió el valor del inmueble', 'plusvalía del inmueble', 'mayor valor del activo',
  ],
  '1995': [ 'mayor valor de otros activos', 'valorización de bienes de arte','valorización de otros activos', 'valorización de obras de arte', 'avalúo de otros activos'],
}

/** Sinónimos de palabra suelta (cada grupo = palabras intercambiables). */
export const GRUPOS_CLASE_1: string[][] = [
  /* Equipos */
  ['computador', 'ordenador', 'computadora', 'pc', 'laptop', 'portatil', 'notebook', 'macbook'],
  ['impresora', 'multifuncional', 'impresor'],
  ['smartphone', 'movil', 'iphone'],
  ['enrutador', 'router', 'modem'],
  ['monitor', 'pantalla'],
  ['escaner', 'scanner', 'digitalizador'],
  ['tablet', 'tableta', 'ipad'],

  /* Vehículos */
  ['carro', 'coche', 'auto', 'automovil', 'vehiculo', 'automotor'],
  ['moto', 'motocicleta', 'motoneta', 'scooter'],
  ['camioneta', 'pickup', 'campero', 'jeep', 'suv'],
  ['camion', 'volqueta', 'tractomula', 'mula'],
  ['furgon', 'furgoneta', 'van'],
  ['barco', 'lancha', 'bote', 'embarcacion', 'yate'],
  ['avion', 'avioneta', 'aeronave'],

  /* Muebles y cocina */
  ['escritorio', 'mesa de trabajo', 'buro'],
  ['estanteria', 'estante', 'anaquel', 'repisa', 'librero'],
  ['nevera', 'refrigerador', 'refrigeradora', 'heladera', 'frigorifico'],
  ['congelador', 'freezer', 'nevera congeladora'],
  ['estufa', 'cocineta', 'fogon'],
  ['aire acondicionado', 'minisplit', 'climatizador'],

  /* Inmuebles */
  ['apartamento', 'departamento', 'apto'],
  ['galpon', 'nave industrial', 'hangar'],
  ['lote', 'terreno', 'solar', 'parcela', 'predio'],

  /* Animales */
  ['ganado', 'reses', 'vacas', 'bovinos', 'semovientes'],

  /* Dinero e inversiones */
  ['cdt', 'plazo fijo', 'cdat', 'certificado de deposito'],
  ['cripto', 'criptomoneda', 'criptomonedas', 'bitcoin', 'criptoactivo'],
  ['acciones', 'acción', 'stocks'],
  ['fiducia', 'fideicomiso', 'fiduciaria', 'encargo fiduciario'],
  ['billetera digital', 'billetera virtual', 'monedero electronico', 'wallet'],
  ['divisas', 'dolares', 'moneda extranjera', 'usd'],

  /* Intangibles y software */
  ['goodwill', 'plusvalia', 'credito mercantil', 'fondo de comercio'],
  ['franquicia', 'concesion'],
  ['repuestos', 'refacciones', 'recambios', 'piezas de repuesto'],
  ['empaque', 'embalaje', 'envase'],
  ['materia prima', 'insumo', 'insumos'],
]

/** Consultas de prueba: lo que escribiría una persona → el código que debe aparecer entre los 3 primeros. */
export const PRUEBAS_CLASE_1: Record<string, string> = {
  /* Dinero */
  'plata en la registradora': '1105',
  'dólares en efectivo': '110515',
  'me depositaron por nequi': '1120',
  'saldo en daviplata': '1120',
  'plata en bancolombia': '1110',
  'cuenta en dólares en el exterior': '111010',
  'transferencia que no ha llegado': '1115',
  'fondo de caja chica': '110510',
  'cheque en canje': '1115',

  /* Inversiones */
  'compré acciones de ecopetrol': '1205',
  'abrí un cdt': '1225',
  'plazo fijo en el banco': '1225',
  'compré bitcoin': '1295',
  'invertí en criptomonedas': '1295',
  'plata en la fiduciaria': '1245',
  'compré tes del gobierno': '1235',
  'bajaron las acciones': '1299',

  /* Deudores */
  'plata que me deben los clientes': '1305',
  'le fié a un cliente': '1305',
  'cliente en estados unidos me debe': '130510',
  'le presté plata al socio': '1325',
  'adelanto de quincena a un trabajador': '133015',
  'anticipo al maestro de obra': '133010',
  'le pagué por adelantado al proveedor': '133005',
  'depósito del arriendo del local': '1335',
  'me hicieron retefuente': '135515',
  'me retuvieron iva': '135517',
  'reclamo al seguro por el robo': '1360',
  'le presté a un amigo': '1370',
  'cliente moroso que no paga': '1390',
  'dividendos por recibir': '134505',

  /* Inventarios */
  'compré mercadería para revender': '1435',
  'harina para la panadería': '1405',
  'contenedor en camino de china': '1465',
  'cajas de cartón y bolsas': '1460',
  'refacciones en bodega': '1455',
  'ganado de engorde para vender': '1445',

  /* Propiedad, planta y equipo */
  'compro ordenador': '152805',
  'compré un macbook': '152805',
  'compré una impresora': '152805',
  'compré un iphone para la empresa': '152810',
  'celular de la empresa': '152810',
  'compré un router': '152810',
  'el coche de la empresa': '154005',
  'compré una hilux': '154005',
  'compré una moto para domicilios': '154005',
  'compré una volqueta': '154008',
  'furgoneta de reparto': '154008',
  'compré escritorios y sillas': '152405',
  'compré un aire acondicionado': '152410',
  'compré una nevera para el restaurante': '1536',
  'frigorífico industrial': '1536',
  'compré un torno': '1520',
  'planta eléctrica': '1520',
  'compré un apartamento para oficina': '1516',
  'compré una nave industrial': '1516',
  'compré un solar': '1504',
  'estoy construyendo la bodega': '1508',
  'microscopio del laboratorio': '1532',
  'compré una lancha': '1544',
  'compré un dron': '1548',
  'vacas lecheras de la finca': '1584',
  'depreciación del portátil': '159220',
  'depreciación del carro': '159235',

  /* Intangibles y diferidos */
  'registré mi marca': '1610',
  'compré una franquicia': '1620',
  'licencia perpetua de autocad': '1635',
  'pagué el goodwill': '1605',
  'compré siigo': '171016',
  'pagué el soat del año': '170520',
  'pagué seis meses de arriendo por adelantado': '170525',
  'remodelación del local arrendado': '171024',
  'gastos antes de abrir la empresa': '171004',

  /* Otros y valorizaciones */
  'compré un cuadro para la oficina': '1805',
  'el lote se valorizó': '1910',
}
