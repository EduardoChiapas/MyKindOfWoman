# Subir la carpeta completa a GitHub

Esta carpeta ya contiene el proyecto descomprimido. El límite de 100 archivos corresponde al cargador del navegador de GitHub; puedes usar GitHub Desktop para enviar el proyecto completo.

La carpeta ocupa aproximadamente 436 MiB. Ningún archivo supera 100 MiB; el más grande es el ZIP del mod, de unos 59 MiB. Ese ZIP interno, `fnf-original/mods/ftbb.zip`, debe conservarse porque el motor lo carga directamente.

## Publicar como una web propia

1. Instala [GitHub Desktop](https://desktop.github.com/) e inicia sesión.
2. Crea un repositorio vacío en GitHub. Si usas GitHub Free, el repositorio de Pages debe ser público.
3. En GitHub Desktop, elige **File → Clone repository**, selecciona ese repositorio y elige una carpeta local.
4. Copia **el contenido** de `pc-room` dentro de esa carpeta clonada. Conserva las subcarpetas y el archivo `.nojekyll`. `index.html` debe quedar en la raíz del repositorio, junto a `assets` y `fnf-original`.
5. En GitHub Desktop escribe un resumen, por ejemplo `Añadir la web`, pulsa **Commit to main** y luego **Push origin**. Esto envía todos los archivos seleccionados juntos.
6. En la web de GitHub abre **Settings → Pages**. En **Source** selecciona **Deploy from a branch**; elige **main** y **/(root)**, y pulsa **Save**.
7. Cuando termine la publicación, abre el enlace que indique Pages. Allí la web y FNF cargan por HTTPS; `iniciar.cmd` solo se utiliza para las pruebas locales.

## Añadirla a un repositorio que ya tiene otra web

Copia la carpeta `pc-room` completa como subcarpeta de tu repositorio. Copia también `.nojekyll` a la raíz de la fuente de Pages si no existe allí. Así puedes abrir esta escena desde `https://TU-USUARIO.github.io/TU-REPOSITORIO/pc-room/` sin sustituir el `index.html` de tu otra web.

Para insertar la escena en tu página, usa la ruta relativa `pc-room/index.html` en un iframe. La sección de integración de `LEEME.md` explica también cómo llevar solo la PC a otra escena.

## Referencias oficiales

- [Subida de archivos y límites del cargador web](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).
- [GitHub Desktop: commits y Push origin](https://docs.github.com/en/desktop/overview/creating-your-first-repository-using-github-desktop).
- [Crear un sitio de Pages, archivo de entrada y .nojekyll](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).
