// ===== RESERVAR =====
async function reservar() {

    const nombre = document.getElementById("inp-nombre").value.trim();
    const fecha = document.getElementById("inp-fecha").value;
    const hora = document.getElementById("inp-hora").value;

    let total = 0;
    let serviciosEscogidos = [];

    // ===== SERVICIOS =====
    if (cantidades.barba > 0) {
        const subtotal = cantidades.barba * precios.barba;
        total += subtotal;
        serviciosEscogidos.push(
            `• Corte + barba x${cantidades.barba} → $${subtotal.toLocaleString("es-CO")}`
        );
    }

    if (cantidades.corte > 0) {
        const subtotal = cantidades.corte * precios.corte;
        total += subtotal;
        serviciosEscogidos.push(
            `• Solo corte x${cantidades.corte} → $${subtotal.toLocaleString("es-CO")}`
        );
    }

    if (cantidades.cejas > 0) {
        const subtotal = cantidades.cejas * precios.cejas;
        total += subtotal;
        serviciosEscogidos.push(
            `• Corte + cejas x${cantidades.cejas} → $${subtotal.toLocaleString("es-CO")}`
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
        const disponible = await verificarDisponibilidad(fecha, hora);

        if (!disponible) {
            mostrarAlerta("Ese horario ya está reservado");
            btnWsp.disabled = false;
            btnWsp.innerHTML = restaurarBtnWsp();
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

        mostrarAlerta("Cita guardada. Redirigiendo a WhatsApp...");

        // ===== FORMATEAR FECHA LIMPIA (Sin toLocaleDateString para evitar símbolos feos) =====
        const partes = fecha.split("-"); // fecha viene YYYY-MM-DD
        const anio = partes[0];
        const mesNum = partes[1];
        const dia = partes[2];
        
        // Mapeo manual de meses para tener control total de los caracteres
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const nombreMes = meses[parseInt(mesNum) - 1];
        
        const fechaFormateada = `${dia} de ${nombreMes} de ${anio}`;

        // ===== MENSAJE WHATSAPP (Asegurando nombres y emojis estables) =====
        const mensaje = 
`💈 *Hola MondáBarber* ✂️

🔥 *Quiero reservar una cita*

👤 *Nombre:* ${nombre}
📅 *Fecha:* ${fechaFormateada}
🕐 *Hora:* ${hora}

━━━━━━━━━━━━━━━

💈 *Servicios:*
${serviciosEscogidos.join('\n')}

━━━━━━━━━━━━━━━

💰 *Total:* $${total.toLocaleString("es-CO")}

✅ *Gracias por preferir MondáBarber*`;

        // ===== ENVIAR A WHATSAPP =====
        setTimeout(() => {
            const url = `https://wa.me/573138145675?text=${encodeURIComponent(mensaje)}`;
            window.open(url, "_blank");
        }, 1200);

    } catch (error) {
        console.error(error);
        mostrarAlerta("Hubo un error, intenta nuevamente");
    } finally {
        btnWsp.disabled = false;
        btnWsp.innerHTML = restaurarBtnWsp();
    }
}