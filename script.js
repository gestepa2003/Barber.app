// ===== FIREBASE =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCPAxRLZDWgEBkdaL1RjL9HbC7rsNnjthM",
  authDomain: "barberia-a944e.firebaseapp.com",
  projectId: "barberia-a944e",
  storageBucket: "barberia-a944e.firebasestorage.app",
  messagingSenderId: "83047811200",
  appId: "1:83047811200:web:93228e92c1a5acbe22be65"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== PARTÍCULAS DE FONDO =====
(function crearParticulas() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 28; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.width = (Math.random() * 2 + 1) + 'px';
        p.style.height = p.style.width;
        p.style.animationDuration = (Math.random() * 12 + 8) + 's';
        p.style.animationDelay = (Math.random() * 10) + 's';
        p.style.opacity = Math.random() * 0.6 + 0.2;
        container.appendChild(p);
    }
})();

// ===== LÓGICA DE SERVICIOS =====
let precios = {
    barba: 20000,
    corte: 20000,
    cejas: 20000
};

let cantidades = {
    barba: 0,
    corte: 0,
    cejas: 0
};

function cambiarCantidad(servicio, cambio) {
    cantidades[servicio] += cambio;
    if (cantidades[servicio] < 0) cantidades[servicio] = 0;

    document.getElementById(`cantidad-${servicio}`).innerText = cantidades[servicio];

    const badge = document.getElementById(`badge-${servicio}`);
    badge.innerText = cantidades[servicio];
    if (cantidades[servicio] > 0) {
        badge.classList.add('visible');
    } else {
        badge.classList.remove('visible');
    }

    calcularTotal();
}

function calcularTotal() {
    let total = 0;
    total += cantidades.barba * precios.barba;
    total += cantidades.corte * precios.corte;
    total += cantidades.cejas * precios.cejas;

    const totalEl = document.getElementById('total');
    totalEl.innerText = '$' + total.toLocaleString('es-CO');

    totalEl.classList.remove('total-pulse');
    void totalEl.offsetWidth;
    totalEl.classList.add('total-pulse');
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
    return snapshot.empty; // true = disponible
}

// ===== RESERVAR =====
async function reservar() {
    const nombre = document.getElementById('inp-nombre').value.trim();
    const fecha  = document.getElementById('inp-fecha').value;
    const hora   = document.getElementById('inp-hora').value;

    let total = 0;
    let serviciosEscogidos = [];

    if (cantidades.barba > 0) {
        total += cantidades.barba * precios.barba;
        serviciosEscogidos.push(`✂ Corte + barba  x${cantidades.barba}  →  $${(cantidades.barba * precios.barba).toLocaleString('es-CO')}`);
    }
    if (cantidades.corte > 0) {
        total += cantidades.corte * precios.corte;
        serviciosEscogidos.push(`💈 Solo corte  x${cantidades.corte}  →  $${(cantidades.corte * precios.corte).toLocaleString('es-CO')}`);
    }
    if (cantidades.cejas > 0) {
        total += cantidades.cejas * precios.cejas;
        serviciosEscogidos.push(`👁 Corte + cejas  x${cantidades.cejas}  →  $${(cantidades.cejas * prejas.cejas).toLocaleString('es-CO')}`);
    }

    if (total === 0) {
        mostrarAlerta('Selecciona al menos un servicio primero ✂');
        return;
    }
    if (!nombre) {
        mostrarAlerta('Por favor ingresa tu nombre 👤');
        return;
    }
    if (!fecha) {
        mostrarAlerta('Por favor selecciona una fecha 📅');
        return;
    }
    if (!hora) {
        mostrarAlerta('Por favor selecciona una hora 🕐');
        return;
    }

    // Mostrar cargando
    const btnWsp = document.querySelector('.btn-whatsapp');
    btnWsp.disabled = true;
    btnWsp.innerHTML = '⏳ Verificando disponibilidad...';

    try {
        // Verificar si el horario está disponible
        const disponible = await verificarDisponibilidad(fecha, hora);

        if (!disponible) {
            mostrarAlerta('❌ Ese horario ya está reservado, elige otro');
            btnWsp.disabled = false;
            btnWsp.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> Confirmar por WhatsApp`;
            return;
        }

        // Guardar cita en Firestore
        await addDoc(collection(db, "citas"), {
            nombre,
            fecha,
            hora,
            servicios: serviciosEscogidos,
            total,
            estado: "activa",
            creadoEn: new Date().toISOString()
        });

        mostrarAlerta('✅ Cita guardada! Redirigiendo a WhatsApp...');

        // Mandar WhatsApp
        const fechaFormateada = new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const mensaje =
`Hola BarberFade ✂ Quiero reservar una cita

👤 Nombre: ${nombre}
📅 Fecha: ${fechaFormateada}
🕐 Hora: ${hora}

Servicios:
${serviciosEscogidos.join('\n')}

💰 Total: $${total.toLocaleString('es-CO')}`;

        setTimeout(() => {
            window.open(`https://wa.me/573138145675?text=${encodeURIComponent(mensaje)}`, '_blank');
        }, 1200);

    } catch (error) {
        console.error("Error:", error);
        mostrarAlerta('❌ Hubo un error, intenta de nuevo');
    } finally {
        btnWsp.disabled = false;
        btnWsp.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> Confirmar por WhatsApp`;
    }
}

// ===== ALERTA PERSONALIZADA =====
function mostrarAlerta(msg) {
    const existente = document.getElementById('alerta-custom');
    if (existente) existente.remove();

    const alerta = document.createElement('div');
    alerta.id = 'alerta-custom';
    alerta.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: linear-gradient(135deg, #1a1500, #2a2000);
        border: 1px solid rgba(255,204,0,0.5);
        color: #ffcc00;
        padding: 14px 28px;
        border-radius: 50px;
        font-family: 'DM Sans', sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        z-index: 9999;
        opacity: 0;
        transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        white-space: nowrap;
    `;
    alerta.innerText = msg;
    document.body.appendChild(alerta);

    requestAnimationFrame(() => {
        alerta.style.opacity = '1';
        alerta.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
        alerta.style.opacity = '0';
        alerta.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => alerta.remove(), 400);
    }, 3000);
}

// Exponer funciones globalmente
window.cambiarCantidad = cambiarCantidad;
window.reservar = reservar;