document.addEventListener('DOMContentLoaded', () => {
    
    const appState = {
        aulasDisponibles: 12,
        reservasActivas: 45
    };

    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }

    const showToast = (message, type = 'success') => {
        const bgClass = type === 'success' ? 'text-bg-success' : 'text-bg-danger';
        const toastId = 'toast-' + Date.now();
        
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi ${type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 4000 });
        toast.show();
        
        toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
    };
    
    const animateValue = (obj, start, end, duration) => {
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

    const statAulas = document.querySelector('.text-success.display-4');
    const statReservas = document.querySelector('.text-primary.display-4');
    
    const statsElements = {
        aulas: statAulas,
        reservas: statReservas
    };

    if(statAulas) animateValue(statAulas, 0, appState.aulasDisponibles, 1500);
    if(statReservas) animateValue(statReservas, 0, appState.reservasActivas, 1500);

    const reservaForm = document.querySelector('form[action="/procesar-reserva"]');
    
    if (reservaForm) {
        reservaForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const aula = formData.get('aula_id');
            const fecha = formData.get('fecha');
            const hora = formData.get('hora');
            const btnSubmit = this.querySelector('button[type="submit"]');

            const originalBtnText = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...`;

            setTimeout(() => {
                const tablaReservas = document.querySelector('#mis-reservas tbody');
                
                const nuevaFila = document.createElement('tr');
                
                let fechaFormat = fecha;
                if(fecha) {
                    const parts = fecha.split('-');
                    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]); 
                    fechaFormat = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
                }

                nuevaFila.innerHTML = `
                    <td class="ps-4"><strong>${aula}</strong></td>
                    <td><time datetime="${fecha}">${fechaFormat}</time></td>
                    <td>${hora}</td>
                    <td><span class="badge bg-warning text-dark animate-pulse">Pendiente</span></td>
                `;
                
                nuevaFila.style.opacity = '0';
                tablaReservas.prepend(nuevaFila);
                
                requestAnimationFrame(() => {
                    nuevaFila.style.transition = 'opacity 0.5s';
                    nuevaFila.style.opacity = '1';
                });

                if(appState.aulasDisponibles > 0) {
                    appState.aulasDisponibles--;
                    appState.reservasActivas++;
                    statsElements.aulas.textContent = appState.aulasDisponibles;
                    statsElements.reservas.textContent = appState.reservasActivas;
                }

                showToast(`Reserva confirmada para el aula <strong>${aula}</strong>.`);
                this.reset();
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalBtnText;

                setTimeout(() => {
                    const badge = nuevaFila.querySelector('.badge');
                    if(badge) {
                        badge.className = 'badge bg-primary';
                        badge.textContent = 'Confirmada';
                    }
                }, 2000);

            }, 800);
        });
    }

    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.3
    };

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
    }, observerOptions);

    sections.forEach((section) => {
        observer.observe(section);
    });
});