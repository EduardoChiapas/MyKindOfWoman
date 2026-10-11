# Créditos y licencias · PC de Toriel / FNF original

## Motor oficial

**Friday Night Funkin’ 0.8.6**, de **The Funkin’ Crew Inc.** El número de versión procede de `project.hxp` del código fuente utilizado. El motor está construido con Haxe, HaxeFlixel, Lime y OpenFL y se compila para HTML5. Los menús y el gameplay proceden de ese motor oficial.

Código fuente: [FunkinCrew/Funkin](https://github.com/FunkinCrew/Funkin). Los créditos completos del juego se conservan en su menú y en [credits.json](https://github.com/FunkinCrew/funkin.assets/blob/main/exclude/data/credits.json).

El archivo `LICENSE.md` del motor declara **Apache License 2.0** para el código. El archivo `assets/LICENSE.md` declara por separado que el arte, audio, música, efectos y otros contenidos creativos son **propietarios**, con copyright de The Funkin’ Crew Inc., y que su distribución pública gratuita o de pago por terceros no está autorizada por esa licencia. Apache-2.0 del código no cambia esa declaración de los recursos. Los avisos originales completos se reproducen al final de este documento.

La adaptación de plataforma y el puente HTML5 unen la compilación original con la web: apertura en iframe, volumen y guardado de victorias. La futura entrega de la llave queda pendiente. El catálogo se limita a Tutorial y la semana de Bad Bunny. Al llegar a la pantalla de resultados, la integración vuelve al menú original de semanas y omite la animación del porcentaje; Story Mode conserva la secuencia de las tres canciones del mod. FNF permanece abierto hasta salir manualmente al escritorio. No se atribuye la autoría del motor o del mod a esta integración.

El código fuente utilizado corresponde a la revisión `ee9d492becfc1178b2c80487167d09a880f90146` (v0.8.6). `fnf-original/web-port.patch` registra la adaptación HTML5. Las tres correcciones de compatibilidad de Polymod conservadas en `fnf-original/polymod-web-compat.patch`, `fnf-original/polymod-html5-memory-images.patch` y `fnf-original/polymod-html5-memory-audio.patch` corrigen los argumentos opcionales de cadenas en JavaScript y la carga asíncrona de imágenes y audio desde el ZIP en memoria. El audio usa el detector de formato, el codificador Base64 y la carga asíncrona original de Lime/Howler; la rama nativa se conserva. Los archivos del mod conservan sus bytes originales.

## Mod aportado

**feat. Bad Bunny**, ID `ftbb`, versión **1.0.0**, de **gamerbross**. La metadata original `_polymod_meta.json` declara `api_version: 0.8.6` y `license: Apache-2.0`.

Las canciones del mod son **Celoso, Palmas y Amarre**. Los charts, escenarios, personajes, animaciones y audios proceden de la carpeta `FEAT. BAD BUNNY FLAS + BG CLIP FILE` suministrada por el usuario. Se conservan sus autores y avisos; la declaración de licencia de la metadata del mod no se extiende a materiales de terceros que el autor no controle.

Metadata reproducida:

```json
{
  "id": "ftbb",
  "title": "feat. Bad Bunny",
  "description": "juegalo beibe !!\nA Bad Bunny Friday Night Funkin Mod",
  "contributors": [{ "name": "gamerbross" }],
  "api_version": "0.8.6",
  "mod_version": "1.0.0",
  "license": "Apache-2.0"
}
```

## Icono original

`assets/props/funkin-icon.png` es el PNG original del recurso de icono de `Funkin.exe`: **768 × 768**, RGBA transparente. Se extrajo por lectura del archivo PE, sin ejecutar el juego y sin volver a dibujar el icono. Sus bytes se conservan íntegros. SHA-256:

```text
c7ddce6eee97a8ec220d73e18aef40dd273d990a5bf74be4202317e6da9122d2
```

## Casa y escritorio

La casa, Frisk y los recursos base de la habitación proceden del proyecto **MyKindOfWoman-main** aportado por el usuario. La nueva distribución sigue su referencia de Toriel. Se retiró la silla añadida a la PC y se conserva la silla original del rincón de lectura; la mesa y el escritorio cercano se dibujan con código de esta integración.

La PC pequeña, `assets/props/gaming-pc.png`, fue creada con ImageGen a partir de la referencia de estilo de la habitación. El monitor cercano, la torre RGB y el escritorio usan HTML/CSS/SVG. El sprite generado no reemplaza ningún recurso de FNF.

Undertale y sus elementos originales pertenecen a **Toby Fox** y a sus respectivos autores. La tipografía **8bitoperator JVE Regular**, de **nipcen**, se declara bajo **CC BY-NC-SA 3.0** en los créditos existentes. La fuente, sus cambios técnicos y las muestras de sonido de Undertale conservan su detalle en `ASSET_CREDITS.md`. Las licencias del motor FNF o del mod no sustituyen las de esos otros recursos.

## Aviso original completo del código del motor

El texto siguiente se copia de `LICENSE.md` del checkout utilizado, sin cambiar sus avisos ni años:

# Friday Night Funkin'

The Friday Night Funkin' source code is licensed under the Apache 2.0 license: (https://www.apache.org/licenses/LICENSE-2.0)

Friday Night Funkin' Copyright 2020-2024 The Funkin' Crew Inc.
All Rights Reserved. "Friday Night Funkin'" and the "Friday Night Funkin'" logo are trademarks of The Funkin' Crew Inc.

You can view the `funkin-assets` license here: (https://github.com/FunkinCrew/funkin.assets/blob/main/LICENSE.md)

## Apache 2.0 License
```
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright 2020-2026 The Funkin' Crew Inc.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```


## Aviso original completo de los recursos del motor

El texto siguiente se copia de `assets/LICENSE.md` del checkout utilizado:

"Friday Night Funkin'" and the "Friday Night Funkin'" logo are trademarks of  The Funkin' Crew Inc.

Copyright 2020-2026 The Funkin' Crew Inc.

All rights reserved.

This game's Content is proprietary and protected by national and international copyright and trademark laws, and may not be publicly distributed for free or for profit by anyone but the copyright owner. "Content" includes but is not limited to the art, visual assets, audio assets, sound effects, music, and any other creative works.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

