document.addEventListener('DOMContentLoaded', () => {
    
    // --- ESTADO DE LA APLICACIÓN ---
    const appState = {
        aulasDisponibles: 12,
        reservasActivas: 0,
        reservations: [] // Array para almacenar las reservas
    };

    // Referencias al DOM
    const reservaForm = document.querySelector('form[action="/procesar-reserva"]');
    const listaReservas = document.getElementById('lista-reservas');
    const totalReservasBadge = document.getElementById('total-reservas');
    const btnOrdenar = document.getElementById('btn-ordenar');
    const statAulas = document.querySelector('.text-success.display-4');
    const statReservas = document.querySelector('.text-primary.display-4');

    // --- INICIALIZACIÓN ---
    const init = () => {
        // Cargar reservas desde localStorage
        const storedReservations = localStorage.getItem('reservations');
        if (storedReservations) {
            appState.reservations = JSON.parse(storedReservations);
        }

        // Renderizar estado inicial
        renderReservations();
        updateStats();
        setupToastContainer();
    };

    // --- FUNCIONES DE RENDERIZADO ---
    
    // Renderiza la tabla de reservas
    const renderReservations = () => {
        listaReservas.innerHTML = '';
        
        // 4.5 Persistencia Avanzada: Mensaje si no hay reservas
        if (appState.reservations.length === 0) {
            listaReservas.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                        No hay reservas registradas
                    </td>
                </tr>
            `;
            updateCounter();
            return;
        }

        // Generar filas
        appState.reservations.forEach((reserva, index) => {
            const tr = document.createElement('tr');
            tr.className = 'animate-fade-in';
            
            // Formatear fecha para mostrar
            let fechaFormat = reserva.fecha;
            if(reserva.fecha) {
                const parts = reserva.fecha.split('-');
                const dateObj = new Date(parts[0], parts[1] - 1, parts[2]); 
                fechaFormat = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
            }

            tr.innerHTML = `
                <td class="ps-4"><strong>${reserva.aula}</strong></td>
                <td><time datetime="${reserva.fecha}">${fechaFormat}</time></td>
                <td>${reserva.hora}</td>
                <td><span class="badge bg-primary">Confirmada</span></td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-primary btn-editar" data-index="${index}" title="Editar">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-cancelar" data-index="${index}" title="Cancelar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            listaReservas.appendChild(tr);
        });

        updateCounter();
    };

    // 4.1 Mostrar contador dinámico
    const updateCounter = () => {
        const total = appState.reservations.length;
        appState.reservasActivas = total;
        
        if (totalReservasBadge) {
            totalReservasBadge.textContent = `Total de reservas: ${total}`;
        }
        
        // Actualizar estadísticas del dashboard también
        if(statReservas) {
            statReservas.textContent = total;
        }
    };

    const updateStats = () => {
        if(statAulas) animateValue(statAulas, 0, appState.aulasDisponibles, 1000);
        if(statReservas) animateValue(statReservas, 0, appState.reservasActivas, 1000);
    };

    // --- GESTIÓN DE DATOS ---

    const saveReservations = () => {
        localStorage.setItem('reservations', JSON.stringify(appState.reservations));
        renderReservations();
    };

    const addReservation = (reserva) => {
        // 4.2 Validaciones: Evitar duplicados
        const isDuplicate = appState.reservations.some(r => 
            r.aula === reserva.aula && 
            r.fecha === reserva.fecha && 
            r.hora === reserva.hora
        );

        if (isDuplicate) {
            showToast('¡Conflicto de reserva! El aula ya está ocupada en ese horario.', 'danger');
            return false;
        }

        appState.reservations.unshift(reserva); // Agregar al principio
        saveReservations();
        showToast(`Reserva confirmada para el aula <strong>${reserva.aula}</strong>.`);
        
        // Simular reducción de aulas disponibles (opcional, lógica simple)
        if(appState.aulasDisponibles > 0) {
            appState.aulasDisponibles--;
            if(statAulas) statAulas.textContent = appState.aulasDisponibles;
        }
        
        return true;
    };

    const deleteReservation = (index) => {
        const reserva = appState.reservations[index];
        appState.reservations.splice(index, 1);
        saveReservations();
        showToast('Reserva eliminada correctamente.', 'info');
        
        // Recuperar aula disponible
        appState.aulasDisponibles++;
        if(statAulas) statAulas.textContent = appState.aulasDisponibles;
    };

    // --- MANEJO DE EVENTOS ---

    if (reservaForm) {
        reservaForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const aula = formData.get('aula_id');
            const fecha = formData.get('fecha');
            const hora = formData.get('hora');
            
            const btnSubmit = this.querySelector('button[type="submit"]');
            const originalBtnText = btnSubmit.innerHTML;
            
            // UX: Feedback visual de carga
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...`;

            setTimeout(() => {
                const nuevaReserva = { aula, fecha, hora };
                const success = addReservation(nuevaReserva);

                if (success) {
                    this.reset();
                }

                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalBtnText;
            }, 500); // Pequeño delay para sensación de proceso
        });
    }

    // 4.3 Edición y Eliminación con Delegación de Eventos
    if (listaReservas) {
        listaReservas.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const index = target.dataset.index;
            
            if (target.classList.contains('btn-cancelar')) {
                if(confirm('¿Está seguro de eliminar esta reserva?')) {
                    deleteReservation(index);
                }
            } 
            else if (target.classList.contains('btn-editar')) {
                const reserva = appState.reservations[index];
                
                // Cargar datos en el formulario
                const aulaSelect = document.getElementById('aula-select');
                const fechaInput = document.getElementById('fecha-reserva');
                const horaInput = document.getElementById('hora-reserva');
                
                if(aulaSelect) aulaSelect.value = reserva.aula;
                if(fechaInput) fechaInput.value = reserva.fecha;
                if(horaInput) horaInput.value = reserva.hora;
                
                // Scroll hacia el formulario para mejor UX
                document.getElementById('reservar').scrollIntoView({ behavior: 'smooth' });
                
                // Eliminar temporalmente (según requerimiento 4.3)
                deleteReservation(index);
                showToast('Datos cargados. Modifique y guarde los cambios.', 'info');
            }
        });
    }

    // 4.4 Ordenamiento Dinámico
    if (btnOrdenar) {
        btnOrdenar.addEventListener('click', () => {
            appState.reservations.sort((a, b) => {
                const dateA = new Date(`${a.fecha}T${a.hora}`);
                const dateB = new Date(`${b.fecha}T${b.hora}`);
                return dateA - dateB;
            });
            renderReservations();
            showToast('Reservas ordenadas por fecha.', 'success');
        });
    }

    // --- UTILIDADES ---

    let toastContainer;
    const setupToastContainer = () => {
        toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '1100';
            document.body.appendChild(toastContainer);
        }
    };

    const showToast = (message, type = 'success') => {
        const bgClass = type === 'success' ? 'text-bg-success' : (type === 'danger' ? 'text-bg-danger' : 'text-bg-info');
        const toastId = 'toast-' + Date.now();
        
        // Icono según tipo
        let iconClass = 'bi-check-circle-fill';
        if (type === 'danger') iconClass = 'bi-exclamation-triangle-fill';
        if (type === 'info') iconClass = 'bi-info-circle-fill';

        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi ${iconClass} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        if(toastContainer) {
            toastContainer.insertAdjacentHTML('beforeend', toastHtml);
            const toastElement = document.getElementById(toastId);
            const toast = new bootstrap.Toast(toastElement, { delay: 4000 });
            toast.show();
            toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
        }
    };
    
    const animateValue = (obj, start, end, duration) => {
        if(!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    // --- INICIAR ---
    init();

    // Intersection Observer para navegación activa
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute("id");
                navLinks.forEach((link) => {
                    link.classList.remove("active");
                    if (link.getAttribute("href") === `#${id}`) {
                        link.classList.add("active");
                    }
                });
            }
        });
    }, { threshold: 0.3 });

    sections.forEach((section) => observer.observe(section));
});