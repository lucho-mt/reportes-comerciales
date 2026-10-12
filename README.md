# Reportes Comerciales · Reimpulso

Reportes de ocupación de los soportes DOOH de Reimpulso: minutos vendidos, Plus, desglose diario, anunciantes y espacio disponible.

## Cómo funciona

- Este repositorio **no contiene datos**. La página lee la planilla de Tráfico de Pautas en el momento en que alguien la abre (solo lectura).
- Los números se calculan con el mismo motor que la app de Tráfico de Pautas, copiado en `motor/trafico-motor.js`. La copia no puede escribir en la planilla ni mandar mails.
- El cálculo corre en segundo plano (`js/calculo-worker.js`) para que la página no se congele.

## Actualizar el motor cuando cambia la app de tráfico

La página avisa en el menú lateral si la app de tráfico cambió desde la última copia.

```
curl -sL https://lalofissore.github.io/Reimpulso/trafico-pautas.html -o /tmp/trafico-pautas.html
node herramientas/actualizar-motor.js /tmp/trafico-pautas.html
```

Revisar el cambio, probar la página y publicar.

## Cambiar la página

Los cambios se hacen en `herramientas/plantilla.html` (la misma plantilla del boceto, sin datos). Después:

```
node herramientas/armar-sitio.js
```

Eso regenera `index.html` y `js/app.js`.

## Seguridad

- Solo se cargan scripts propios y Chart.js con verificación de integridad (Content-Security-Policy en `index.html`).
- Los datos de la planilla se tratan como datos: se validan y se escapan antes de mostrarse.
- La página pide no ser indexada por buscadores (`robots.txt` y meta `noindex`).
