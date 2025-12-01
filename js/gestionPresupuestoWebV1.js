import * as gesGastos from "./gestionPresupuesto.js";


// Mostramos el total de gastos
let divTotal = document.getElementById("total");
divTotal.innerHTML = gesGastos.calcularTotalGastos();

let divForm = document.getElementById("formcreacion");

let form = document.createElement("form");
let campoDesc = document.createElement("input");
campoDesc.setAttribute("name", "descripcion");
campoDesc.setAttribute("id", "descripcion");

let campoValor = document.createElement("input");
campoValor.setAttribute("name", "valor");
campoValor.setAttribute("type", "number");
campoValor.setAttribute("id", "valor");

let campoFecha = document.createElement("input");
campoFecha.setAttribute("name", "fecha");
campoFecha.setAttribute("id", "fecha");
campoFecha.setAttribute("type", "date");

let campoEtiquetas = document.createElement("input");
campoEtiquetas.setAttribute("name", "etiquetas");
campoEtiquetas.setAttribute("id", "etiquetas");

let botonEnvio = document.createElement("button");
botonEnvio.setAttribute("type", "submit");
botonEnvio.textContent = "Crear";

form.append("Valor: ", campoValor, "Descripción: ", campoDesc, "Fecha: ", campoFecha, "Etiquetas: ", campoEtiquetas, botonEnvio);

// Manejador de eventos
form.addEventListener("submit", function(evento) {
    evento.preventDefault();
    let desc = evento.target.elements.descripcion.value;
    let valor = parseFloat(evento.target.elements.valor.value);
    let fecha = evento.target.elements.fecha.value;
    let etiquetas = evento.target.elements.etiquetas.value.split(" ");
    console.log(etiquetas);
    let nuevoGasto = new gesGastos.CrearGasto(desc, valor, fecha, ...etiquetas);
    gesGastos.anyadirGasto(nuevoGasto);
    // Repintamos
    pintarGastosWeb();
});

divForm.append(form);


// Prototipo de manejador de eventos del botón de borrado
let ManejadorBorrado = {
    handleEvent: function(evento) {
	// Pedimos confirmación
	if (confirm("¿Seguro que desea borrar?")) {

	    // Accedemos al gasto asociado y lo borramos
	    gesGastos.borrarGasto(this.gasto.id);

	    // Repintamos
	    pintarGastosWeb();

	}
    }
}


let divLista = document.getElementById("listado");

function pintarGastosWeb() {

    // Borramos la lista existente
    divLista.innerHTML = "";

    // Creamos el listado nuevo
    for (let gasto of gesGastos.listarGastos()) {
	let gastoDiv = document.createElement("div");
	gastoDiv.innerHTML = `${gasto.descripcion} - ${gasto.valor} - ${new Date(gasto.fecha).toISOString()} - ${gasto.etiquetas}`;

	// Botón de borrado
	let gastoBorrar = document.createElement("button");
	gastoBorrar.setAttribute("type", "button");
	gastoBorrar.textContent = "Borrar";

	// Manejador de eventos del botón de borrado
	let manejadorBorrar = Object.create(ManejadorBorrado);
	manejadorBorrar.gasto = gasto;
	gastoBorrar.addEventListener("click", manejadorBorrar);


	gastoDiv.append(gastoBorrar);
	divLista.append(gastoDiv);


    }

    // Mostramos nuevo total
    divTotal.innerHTML = gesGastos.calcularTotalGastos();
}

// Realizamos el 'pintado inicial' de los gastos
pintarGastosWeb();


