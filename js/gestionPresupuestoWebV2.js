import * as gesGastos from "./gestionPresupuesto.js";

// ===============================
// Configuración de la API
// ===============================
const API_BASE_URL = "http://localhost:3000";
let usuarioActual = "";

// ===============================
// Elementos base del documento
// ===============================
const divTotal = document.getElementById("total");
const divForm = document.getElementById("formcreacion");
const divLista = document.getElementById("listado");

// ===============================
// Funciones para la API
// ===============================
async function cargarGastosUsuario(usuario) {
  try {
    console.log(`Cargando gastos para usuario: ${usuario}`);
    const response = await fetch(`${API_BASE_URL}/${usuario}`);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const gastos = await response.json();
    console.log("Gastos cargados:", gastos);
    return gastos;
  } catch (error) {
    console.error("Error al cargar gastos:", error);
    return null;
  }
}

async function añadirGastoAPI(usuario, gasto) {
  try {
    const response = await fetch(`${API_BASE_URL}/${usuario}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gasto),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    console.log("Gasto añadido correctamente");
    return { success: true };
  } catch (error) {
    console.error("Error al añadir gasto:", error);
    alert(`Error al añadir el gasto: ${error.message}`);
    return null;
  }
}

async function actualizarGastoAPI(usuario, gastoId, gastoActualizado) {
  try {
    const response = await fetch(`${API_BASE_URL}/${usuario}/${gastoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gastoActualizado),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    console.log("Gasto actualizado correctamente");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar gasto:", error);
    alert(`Error al actualizar el gasto: ${error.message}`);
    return null;
  }
}

async function eliminarGastoAPI(usuario, gastoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/${usuario}/${gastoId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    console.log("Gasto eliminado correctamente");
    return true;
  } catch (error) {
    console.error("Error al eliminar gasto:", error);
    alert(`Error al eliminar el gasto: ${error.message}`);
    return false;
  }
}

// ===============================
// Manejador del formulario de usuario
// ===============================
document
  .getElementById("user-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    usuarioActual = document.getElementById("username").value.trim();

    if (usuarioActual) {
      document.getElementById(
        "user-status"
      ).textContent = `Cargando gastos de ${usuarioActual}...`;
      console.log(`Usuario seleccionado: ${usuarioActual}`);

      const gastos = await cargarGastosUsuario(usuarioActual);

      if (gastos === null) {
        document.getElementById(
          "user-status"
        ).textContent = `Error: No se pudo conectar con la API. Verifica que esté ejecutándose en ${API_BASE_URL}`;
        alert(
          `No se puede conectar con la API en ${API_BASE_URL}\n\nAsegúrate de que:\n1. La API esté ejecutándose\n2. El puerto 3000 esté libre\n3. No haya errores de CORS`
        );
        return;
      }

      if (!Array.isArray(gastos)) {
        document.getElementById(
          "user-status"
        ).textContent = `Error: Formato de datos inválido`;
        return;
      }

      console.log(`Convirtiendo ${gastos.length} gastos...`);

      const gastosConvertidos = gastos.map((gasto) => {
        const nuevoGasto = new gesGastos.CrearGasto(
          gasto.descripcion || "Sin descripción",
          gasto.valor || 0,
          gasto.fecha || new Date().toISOString().split("T")[0],
          ...(gasto.etiquetas || [])
        );
        nuevoGasto.id = gasto.id || Date.now();
        return nuevoGasto;
      });

      gesGastos.reemplazarListadoGastos(gastosConvertidos);
      pintarGastos();

      document.getElementById(
        "user-status"
      ).textContent = `Usuario activo: ${usuarioActual} - ${gastos.length} gastos cargados`;
      console.log(`${gastos.length} gastos cargados exitosamente`);
    }
  });

// ===============================
// Formulario de creación de gasto
// ===============================
const form = document.createElement("form");
form.innerHTML = `
  <label>Descripción: <input name="descripcion" required></label>
  <label>Valor (€): <input name="valor" type="number" required></label>
  <label>Fecha: <input name="fecha" type="date" required></label>
  <label>Etiquetas: <input name="etiquetas" placeholder="Separadas por espacios"></label>
  <button type="submit">Crear gasto</button>
`;
divForm.append(form);

// ===============================
// Definición del componente Web <mi-gasto>
// ===============================
const plantilla = document.getElementById("plantilla-gasto");

class MiGasto extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(plantilla.content.cloneNode(true));
  }

  set gasto(g) {
    this._gasto = g;
    this.render();
  }

  get gasto() {
    return this._gasto;
  }

  render() {
    const g = this._gasto;
    const root = this.shadowRoot;

    // Mostrar datos
    root.getElementById("descripcion").textContent = g.descripcion;
    root.getElementById("valor").textContent = `${g.valor} €`;
    root.getElementById("fecha").textContent = new Date(
      g.fecha
    ).toLocaleDateString();
    root.getElementById("etiquetas").textContent = g.etiquetas.join(" ");

    // Botones
    const editarBtn = root.getElementById("editar");
    const borrarBtn = root.getElementById("borrar");
    const formEditar = root.getElementById("formEditar");
    const cancelarBtn = root.getElementById("cancelar");

    editarBtn.onclick = () => formEditar.classList.toggle("visible");
    cancelarBtn.onclick = () => formEditar.classList.remove("visible");

    borrarBtn.onclick = async (e) => {
      e.preventDefault(); // Prevenir cualquier comportamiento por defecto
      e.stopPropagation(); // Detener la propagación

      if (confirm("¿Seguro que desea borrar el gasto?")) {
        if (usuarioActual) {
          const eliminado = await eliminarGastoAPI(usuarioActual, g.id);
          if (eliminado) {
            // Recargar desde API
            const gastos = await cargarGastosUsuario(usuarioActual);
            if (gastos && Array.isArray(gastos)) {
              const gastosConvertidos = gastos.map((gasto) => {
                const nuevoGasto = new gesGastos.CrearGasto(
                  gasto.descripcion,
                  gasto.valor,
                  gasto.fecha,
                  ...gasto.etiquetas
                );
                nuevoGasto.id = gasto.id;
                return nuevoGasto;
              });
              gesGastos.reemplazarListadoGastos(gastosConvertidos);
              pintarGastos();
            }
          }
        } else {
          gesGastos.borrarGasto(g.id);
          pintarGastos();
        }
      }
    };

    // Rellenar formulario de edición
    formEditar.fDescripcion.value = g.descripcion;
    formEditar.fValor.value = g.valor;
    formEditar.fFecha.value = new Date(g.fecha).toISOString().slice(0, 10);
    formEditar.fEtiquetas.value = g.etiquetas.join(" ");

    // Guardar cambios
    formEditar.onsubmit = async (e) => {
      e.preventDefault();
      e.stopPropagation(); // Detener la propagación

      const cambios = {
        descripcion: formEditar.fDescripcion.value.trim(),
        valor: parseFloat(formEditar.fValor.value),
        fecha: formEditar.fFecha.value,
        etiquetas: formEditar.fEtiquetas.value.split(" ").filter(Boolean),
      };

      if (usuarioActual) {
        console.log("Actualizando gasto via API...", cambios);
        const actualizado = await actualizarGastoAPI(
          usuarioActual,
          g.id,
          cambios
        );
        if (actualizado) {
          console.log("Gasto actualizado correctamente");
          // Recargar desde API para tener los datos actualizados
          const gastos = await cargarGastosUsuario(usuarioActual);
          if (gastos && Array.isArray(gastos)) {
            const gastosConvertidos = gastos.map((gasto) => {
              const nuevoGasto = new gesGastos.CrearGasto(
                gasto.descripcion,
                gasto.valor,
                gasto.fecha,
                ...gasto.etiquetas
              );
              nuevoGasto.id = gasto.id;
              return nuevoGasto;
            });
            gesGastos.reemplazarListadoGastos(gastosConvertidos);
            pintarGastos();
          }
        }
      } else {
        const gasto = gesGastos.listarGastos().find((x) => x.id === g.id);
        if (gasto) {
          gasto.actualizarDescripcion(cambios.descripcion);
          gasto.actualizarValor(cambios.valor);
          gasto.actualizarFecha(cambios.fecha);
          gasto.etiquetas = cambios.etiquetas;
          pintarGastos();
        }
      }

      formEditar.classList.remove("visible");
    };
  }
}

customElements.define("mi-gasto", MiGasto);

// ===============================
// Renderizado de los gastos
// ===============================
function pintarGastos() {
  divLista.innerHTML = "";

  const gastos = gesGastos.listarGastos();
  console.log(`Pintando ${gastos.length} gastos...`);

  for (const gasto of gastos) {
    const elem = document.createElement("mi-gasto");
    elem.gasto = gasto;
    divLista.append(elem);
  }

  divTotal.textContent = `Total de gastos: ${gesGastos.calcularTotalGastos()} €`;
  console.log(
    `Pintado completado. Total: ${gesGastos.calcularTotalGastos()} €`
  );
}

// ===============================
// Alta de nuevos gastos - CORREGIDO
// ===============================
form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  ev.stopPropagation(); // Detener la propagación

  const desc = ev.target.elements.descripcion.value;
  const valor = parseFloat(ev.target.elements.valor.value);
  const fecha = ev.target.elements.fecha.value;
  const etiquetas = ev.target.elements.etiquetas.value
    .split(" ")
    .filter(Boolean);

  if (usuarioActual) {
    const nuevoGasto = {
      descripcion: desc,
      valor: valor,
      fecha: fecha,
      etiquetas: etiquetas,
    };

    const gastoCreado = await añadirGastoAPI(usuarioActual, nuevoGasto);
    if (gastoCreado) {
      // Recargar desde API
      const gastos = await cargarGastosUsuario(usuarioActual);
      if (gastos && Array.isArray(gastos)) {
        const gastosConvertidos = gastos.map((gasto) => {
          const nuevoGasto = new gesGastos.CrearGasto(
            gasto.descripcion,
            gasto.valor,
            gasto.fecha,
            ...gasto.etiquetas
          );
          nuevoGasto.id = gasto.id;
          return nuevoGasto;
        });
        gesGastos.reemplazarListadoGastos(gastosConvertidos);
        pintarGastos();
      }
    }
  } else {
    const nuevoGasto = new gesGastos.CrearGasto(
      desc,
      valor,
      fecha,
      ...etiquetas
    );
    gesGastos.anyadirGasto(nuevoGasto);
    pintarGastos();
  }

  form.reset();
});

// ===============================
// Cargar algunos gastos iniciales (solo si no hay usuario seleccionado)
// ===============================
if (gesGastos.listarGastos().length === 0) {
  console.log("Cargando gastos iniciales...");
  gesGastos.anyadirGasto(
    new gesGastos.CrearGasto("Constantinopla", 35, "1453-5-24", "Caída")
  );
  gesGastos.anyadirGasto(
    new gesGastos.CrearGasto(
      "Terreno Edificado",
      100000,
      "2019-7-21",
      "Terreno"
    )
  );
  gesGastos.anyadirGasto(
    new gesGastos.CrearGasto("Transporte", 3, "2025-11-07", "Bus")
  );
}

// ===============================
// GUARDAR EN LOCALSTORAGE
// ===============================
document.getElementById("guardarLocal").addEventListener("click", (e) => {
  e.preventDefault();
  const gastos = gesGastos.listarGastos();

  const json = JSON.stringify(gastos);
  localStorage.setItem("mis_gastos", json);

  alert("Gastos guardados correctamente en el almacenamiento local.");
});

// ===============================
// CARGAR DESDE LOCALSTORAGE
// ===============================
document.getElementById("cargarLocal").addEventListener("click", (e) => {
  e.preventDefault();
  const datos = localStorage.getItem("mis_gastos");

  if (!datos) {
    alert("No hay datos guardados en localStorage.");
    return;
  }

  const listaPlano = JSON.parse(datos);

  const listaReconstruida = listaPlano.map((g) => {
    let gasto = new gesGastos.CrearGasto(
      g.descripcion,
      g.valor,
      g.fecha,
      ...g.etiquetas
    );
    gasto.id = g.id;
    return gasto;
  });

  gesGastos.reemplazarListadoGastos(listaReconstruida);

  pintarGastos();

  alert("Gastos cargados desde almacenamiento local.");
});

// ===============================
// Render inicial
// ===============================
console.log("Inicializando aplicación...");
pintarGastos();
console.log("Aplicación inicializada correctamente");
