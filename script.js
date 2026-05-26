// ===== FIREBASE =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_DOMINIO.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_BUCKET.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== EMOJIS =====
const E = {
    check: "✅",
    person: "👤",
    cal: "📅",
    clock: "🕐",
    pole: "💈",
    sciss: "✂️",
    money: "💰"
};

// ===== SERVICIOS =====
const precios = {
    barba: 20000,
    corte: 20000,
    cejas: 20000
};

const cantidades = {
    barba: 0,
    corte: 0,
    cejas: 0
};

// ===== CAMBIAR CANTIDAD =====
function cambiarCantidad(servicio, cambio) {

    cantidades[servicio] += cambio;

    if (cantidades[servicio] < 0) {
        cantidades[servicio] = 0;
    }

    document.getElementById(
        'cantidad-' + servicio
    ).innerText = cantidades[servicio];

    calcularTotal();
}

// ===== CALCULAR TOTAL =====
function calcularTotal() {

    let total = 0;

    total += cantidades.barba * precios.barba;
    total += cantidades.corte * precios.corte;
    total += cantidades.cejas * precios.cejas;

    document.getElementById("total").innerText =
        "$" + total.toLocaleString("es-CO");
}

// ===== VERIFICAR DISPONIBILIDAD =====
async function verificarDisponibilidad(fecha, hora) {

    const q = query(
        collection(db, "citas"),
        where("fecha", "==", fecha),
        where("hora", "==", hora),
        where("estado", "==", "activa")
    );

    const snapshot = await getDocs(q);

    return snapshot.empty;
}

// ===== RESERVAR =====
async function reservar() {

    const nombre = document.getElementById("inp-nombre").value.trim();

    const fecha = document.getElementById("inp-fecha").value;

    const hora = document.getElementById("inp-hora").value;

    let total = 0;

    let serviciosEscogidos = [];

    // ===== SERVICIOS =====

    if (cantidades.barba > 0) {

        const subtotal =
            cantidades.barba * precios.barba;

        total += subtotal;

        serviciosEscogidos.push(
            `💈 Corte + barba x${cantidades.barba} → $${subtotal.toLocaleString("es-CO")}`
        );
    }

    if (cantidades.corte > 0) {

        const subtotal =
            cantidades.corte * precios.corte;

        total += subtotal;

        serviciosEscogidos.push(
            `💈 Solo corte x${cantidades.corte} → $${subtotal.toLocaleString("es-CO")}`
        );
    }

    if (cantidades.cejas > 0) {

        const subtotal =
            cantidades.cejas * precios.cejas;

        total += subtotal;

        serviciosEscogidos.push(
            `💈 Corte + cejas x${cantidades.cejas} → $${subtotal.toLocaleString("es-CO")}`
        );
    }

    // ===== VALIDACIONES =====

    if (total === 0) {
        mostrarAlerta("Selecciona al menos un servicio");
        return;
    }

    if (!nombre) {
        mostrarAlerta("Ingresa tu nombre");
        return;
    }

    if (!fecha) {
        mostrarAlerta("Selecciona una fecha");
        return;
    }

    if (!hora) {
        mostrarAlerta("Selecciona una hora");
        return;
    }

    const btnWsp = document.querySelector(".btn-whatsapp");

    btnWsp.disabled = true;

    btnWsp.innerHTML = "Verificando disponibilidad...";

    try {

        // ===== DISPONIBILIDAD =====

        const disponible =
            await verificarDisponibilidad(fecha, hora);

        if (!disponible) {

            mostrarAlerta(
                "Ese horario ya está reservado"
            );

            btnWsp.disabled = false;

            btnWsp.innerHTML =
                restaurarBtnWsp();

            return;
        }

        // ===== GUARDAR EN FIREBASE =====

        await addDoc(collection(db, "citas"), {

            nombre,
            fecha,
            hora,

            servicios: serviciosEscogidos,

            total,

            estado: "activa",

            creadoEn: new Date().toISOString()
        });

        mostrarAlerta(
            "Cita guardada. Redirigiendo a WhatsApp..."
        );

        // ===== FORMATEAR FECHA =====

        const fechaFormateada =
            new Date(fecha + "T00:00:00")
                .toLocaleDateString("es-CO", {

                    weekday: "long",

                    year: "numeric",

                    month: "long",

                    day: "numeric"
                });

        // ===== MENSAJE WHATSAPP =====

        const mensaje =

`Hola MondáBarber ✂️

Quiero reservar una cita

👤 Nombre: ${nombre}

📅 Fecha: ${fechaFormateada}

🕐 Hora: ${hora}

💈 Servicios:
${serviciosEscogidos.join('\n')}

💰 Total: $${total.toLocaleString("es-CO")}`;

        // ===== ENVIAR A WHATSAPP =====

        setTimeout(() => {

            const url =
                `https://wa.me/573138145675?text=${encodeURIComponent(mensaje)}`;

            window.open(url, "_blank");

        }, 1200);

    } catch (error) {

        console.error(error);

        mostrarAlerta(
            "Hubo un error, intenta nuevamente"
        );

    } finally {

        btnWsp.disabled = false;

        btnWsp.innerHTML = restaurarBtnWsp();
    }
}

// ===== BOTÓN WHATSAPP =====
function restaurarBtnWsp() {

    return `
    Confirmar por WhatsApp
    `;
}

// ===== ALERTAS =====
function mostrarAlerta(msg) {

    const existente =
        document.getElementById("alerta-custom");

    if (existente) {
        existente.remove();
    }

    const alerta =
        document.createElement("div");

    alerta.id = "alerta-custom";

    alerta.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: #111;
        color: #ffcc00;
        padding: 15px 30px;
        border-radius: 50px;
        z-index: 9999;
        font-family: Arial;
        box-shadow: 0 10px 30px rgba(0,0,0,.5);
    `;

    alerta.innerText = msg;

    document.body.appendChild(alerta);

    setTimeout(() => {
        alerta.remove();
    }, 3000);
}

// ===== EXPORTAR =====
window.cambiarCantidad = cambiarCantidad;
window.reservar = reservar;