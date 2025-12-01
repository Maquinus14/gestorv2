// ===============================
// Variables globales
// ===============================
// Presupuesto total disponible
let presupuestoActual = 0;

// Lista de todos los gastos creados
let listaGastos = [];

// Contador para asignar ID único a cada gasto
let siguienteIdGasto = 0;

// ===============================
// Funciones de presupuesto
// ===============================
/**
 * Actualiza el presupuesto disponible
 * @param {number} valor - Nuevo presupuesto
 * @returns {number} Presupuesto actualizado o -1 si es inválido
 */
export function actualizarPresupuesto(valor) {
  if (typeof valor === "number" && valor >= 0) {
    presupuestoActual = valor;
    return presupuestoActual;
  }
  return -1;
}

/**
 * Muestra el presupuesto actual en formato de texto
 * @returns {string}
 */
export function mostrarPresupuesto() {
  return `Tu presupuesto actual es de ${presupuestoActual} €`;
}

// ===============================
// Función constructora CrearGasto
// ===============================
export function CrearGasto(descripcion, valor = 0, fecha, ...etiquetas) {
  if (!(this instanceof CrearGasto)) {
    return new CrearGasto(descripcion, valor, fecha, ...etiquetas);
  }

  // Propiedades básicas
  this.descripcion = descripcion;
  this.valor = typeof valor === "number" && valor >= 0 ? valor : 0;

  // Gestión de fecha
  if (!fecha) {
    this.fecha = Date.now();
  } else {
    const fechaParseada = Date.parse(fecha);
    this.fecha = isNaN(fechaParseada) ? Date.now() : fechaParseada;
  }

  // Inicialización de etiquetas
  this.etiquetas = etiquetas.length ? [...etiquetas] : [];

  // ===============================
  // Métodos del gasto
  // ===============================

  // Muestra el gasto básico
  this.mostrarGasto = function () {
    return `Gasto correspondiente a ${this.descripcion} con valor ${this.valor} €`;
  };

  // Muestra el gasto completo con fecha y etiquetas
  this.mostrarGastoCompleto = function () {
    let fechaLocal = new Date(this.fecha).toLocaleString();
    let texto = `Gasto correspondiente a ${this.descripcion} con valor ${this.valor} €.\n`;
    texto += `Fecha: ${fechaLocal}\n`;
    texto += `Etiquetas:\n`;
    this.etiquetas.forEach((et) => {
      texto += `- ${et}\n`;
    });
    return texto;
  };

  // Actualiza la descripción
  this.actualizarDescripcion = function (nuevaDescripcion) {
    this.descripcion = nuevaDescripcion;
  };

  // Actualiza el valor del gasto
  this.actualizarValor = function (nuevoValor) {
    if (typeof nuevoValor === "number" && nuevoValor >= 0) {
      this.valor = nuevoValor;
    }
  };

  // Actualiza la fecha del gasto
  this.actualizarFecha = function (nuevaFecha) {
    const fechaParseada = Date.parse(nuevaFecha);
    if (!isNaN(fechaParseada)) this.fecha = fechaParseada;
  };

  // Añade etiquetas nuevas sin duplicados
  this.anyadirEtiquetas = function (...nuevas) {
    nuevas.forEach((et) => {
      if (!this.etiquetas.includes(et)) this.etiquetas.push(et);
    });
  };

  // Borra etiquetas existentes
  this.borrarEtiquetas = function (...aBorrar) {
    this.etiquetas = this.etiquetas.filter((et) => !aBorrar.includes(et));
  };

  // Obtiene clave de agrupación según periodo (día, mes, año)
  this.obtenerPeriodoAgrupacion = function (tipo) {
    const d = new Date(this.fecha);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    if (tipo === "dia") return `${yyyy}-${mm}-${dd}`;
    if (tipo === "mes") return `${yyyy}-${mm}`;
    if (tipo === "anyo") return `${yyyy}`;
    return `${yyyy}-${mm}-${dd}`;
  };
}

// ===============================
// Funciones de gestión de gastos
// ===============================
/**
 * Devuelve todos los gastos registrados
 * @returns {Array}
 */
export function listarGastos() {
  return listaGastos;
}

/**
 * Añade un gasto a la lista y le asigna un ID único
 * @param {CrearGasto} gasto
 */
export function anyadirGasto(gasto) {
  gasto.id = siguienteIdGasto++;
  listaGastos.push(gasto);
}

/**
 * Borra un gasto por su ID
 * @param {number} id
 */
export function borrarGasto(id) {
  listaGastos = listaGastos.filter((g) => g.id !== id);
}

/**
 * Calcula la suma total de todos los gastos
 * @returns {number}
 */
export function calcularTotalGastos() {
  return listaGastos.reduce((total, g) => total + g.valor, 0);
}

/**
 * Calcula el balance actual (presupuesto - gastos)
 * @returns {number}
 */
export function calcularBalance() {
  return presupuestoActual - calcularTotalGastos();
}

// ===============================
// Filtrado y agrupación de gastos
// ===============================
/**
 * Filtra los gastos según criterios opcionales
 * @param {Object} filtros
 * @returns {Array}
 */
export function filtrarGastos(filtros = {}) {
  return listaGastos.filter((g) => {
    if (filtros.fechaDesde && g.fecha < Date.parse(filtros.fechaDesde))
      return false;
    if (filtros.fechaHasta && g.fecha > Date.parse(filtros.fechaHasta))
      return false;
    if (filtros.valorMinimo != null && g.valor < filtros.valorMinimo)
      return false;
    if (filtros.valorMaximo != null && g.valor > filtros.valorMaximo)
      return false;
    if (
      filtros.descripcionContiene &&
      !g.descripcion
        .toLowerCase()
        .includes(filtros.descripcionContiene.toLowerCase())
    )
      return false;
    if (filtros.etiquetasTiene && filtros.etiquetasTiene.length > 0) {
      const coincide = g.etiquetas.some((e) =>
        filtros.etiquetasTiene.includes(e)
      );
      if (!coincide) return false;
    }
    return true;
  });
}

/**
 * Agrupa los gastos por periodo y etiquetas opcionales
 * @param {string} periodo - "dia", "mes" o "año"
 * @param {Array} etiquetas
 * @param {string} fechaDesde
 * @param {string} fechaHasta
 * @returns {Object}
 */
export function agruparGastos(periodo, etiquetas = [], fechaDesde, fechaHasta) {
  let filtrados = listaGastos;

  if (etiquetas.length > 0) {
    filtrados = filtrados.filter((g) =>
      g.etiquetas.some((e) => etiquetas.includes(e))
    );
  }
  if (fechaDesde)
    filtrados = filtrados.filter((g) => g.fecha >= Date.parse(fechaDesde));
  if (fechaHasta)
    filtrados = filtrados.filter((g) => g.fecha <= Date.parse(fechaHasta));

  const resultado = {};
  for (const g of filtrados) {
    const clave = g.obtenerPeriodoAgrupacion(periodo);
    resultado[clave] = (resultado[clave] || 0) + g.valor;
  }
  return resultado;
}

// ===============================
// NUEVO: REEMPLAZAR LISTADO COMPLETO
// ===============================

/**
 * Sustituye completamente el listado de gastos por uno nuevo
 * @param {Array} nuevoListado
 */
export function reemplazarListadoGastos(nuevoListado) {
  listaGastos = nuevoListado;

  // Recalculamos el siguiente ID correcto
  siguienteIdGasto =
    listaGastos.length > 0 ? Math.max(...listaGastos.map((g) => g.id)) + 1 : 0;
}
