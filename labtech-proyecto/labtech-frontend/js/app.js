const tablas = document.querySelectorAll ('.tabla-gestion tbody tr');
tablas.forEach(fila =>{
    const celdanota=fila.children[3];
    const celdaestado=fila.children[5];

    const textonota=celdanota.textContent.trim(); //porque la nota tiene valor numero y texto , transformo solo a numerico
    const nota =parseInt(textonota);

    if(!isNaN(nota)){
        celdaestado.innerHTML='' //limpia la celdaestado
        const elemento = document.createElement('span');//la variable elemento la crea como elemento span es como un p pero negrita , podria ser p o cualquier otro

        if(nota>=6){
            elemento.textContent='Aprobado'; //le doy el valor de aprobado
            elemento.classList.add('estado-ap');//al elemento lo anade a la clase 'estado-ap' usada para estilo
        }
        else{
            elemento.textContent='Desaprobado';
            elemento.classList.add('estado-dp');
        }

        celdaestado.appendChild(elemento); // cargo elemento a celda estado , ahora en html saco el contenido del td correspondiente al estado del alumno de la tabla calificaciones
    }

});

document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.querySelector(".navbar-principal");

    window.addEventListener("scroll", () => {
        if(window.scrollY > 80) {
            navbar.classList.add("navbar-compacta");
        } else {
            navbar.classList.remove("navbar-compacta");
        }
    })

    const btnarr = document.getElementById("btn-arriba");

    window.addEventListener("scroll", () => {
        const altura = document.documentElement.scrollHeight - window.innerHeight;
        const mitad = altura / 2;

        if (window.scrollY > mitad) {
            btnarr.classList.add("visible");
        }else{
            btnarr.classList.remove("visible");
        }
    });

    btnarr.addEventListener("click", () => {
        window.scrollTo({
            top:0,
            behavior: "smooth"
        });
    });
});

