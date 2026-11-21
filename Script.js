document.addEventListener('DOMContentLoaded', () => {
    // Seleccionamos todos los botones de las pestañas y los contenedores de contenido
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Iteramos sobre cada botón para añadirle el evento de clic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 1. Quitar la clase 'active' de todos los botones y contenidos
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // 2. Añadir la clase 'active' al botón que fue clickeado
            btn.classList.add('active');

            // 3. Mostrar el contenido correspondiente usando el atributo 'data-tab'
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
});